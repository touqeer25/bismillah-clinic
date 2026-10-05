#!/usr/bin/env python3
"""Overlay the approved Homeoint Vertigo source order on the existing local rows.

This tool never deletes or rewrites the existing local English labels/remedy maps.
It adds source fields to matched rows and creates a new row only when the source
rubric has no safe existing candidate. The input snapshot is restricted to pages
96–106 and the Vertigo chapter.
"""
from __future__ import annotations

import argparse
import copy
import importlib.util
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "kent_sources/homeoint_vertigo_candidates.json"
MANIFEST_PATH = ROOT / "kent_sources/homeoint_vertigo_source_manifest.json"
CHAPTER_PATH = ROOT / "kent_chapters/vertigo.json"
MARKER = "homeoint-vertigo-v1"

# The six remaining rows had no exact medicine/grade signature. Their local
# candidates were selected by the same rubric wording and the complete nearby
# hierarchy; source remedies are kept separately so the old local data survives.
MANUAL_CROSSWALK = {
    "LOOKING with eyes turned, upwards": "o63211",
    "OBJECTS seem to be too far off, move": "o63296",
    "OBJECTS seem to be too far off, move, run into each other": "o63298",
    "OBJECTS seem to be too far off, seem to turn in a circle, room whirls": "o63305",
    "RISING, on, from kneeling, of, a seat, on, after": "o63343",
    "WARM bed amel., room": "o63459",
}


def load_existing_audit_helpers():
    tools = str(ROOT / "tools")
    if tools not in sys.path:
        sys.path.insert(0, tools)
    path = ROOT / "tools/build_kent_mind_homeoint.py"
    spec = importlib.util.spec_from_file_location("kent_source_match_helpers", path)
    if not spec or not spec.loader:
        raise RuntimeError("Could not load the shared, read-only source matching helpers")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def source_rows_and_parents(snapshot: list[dict[str, Any]], helpers):
    rows = [
        row for row in snapshot
        if not (int(row.get("page", -1)) == 96 and str(row.get("label", "")).strip().upper() == "VERTIGO")
    ]
    if len(rows) != 429:
        raise ValueError(f"Expected 429 source rubrics after excluding the chapter heading; found {len(rows)}")

    # The saved parser depth has a few empty-directory gaps. The captured full
    # path is the source of truth for parent links; derive display depth from it.
    path_to_order: dict[tuple[str, ...], int] = {}
    parents: list[int | None] = []
    depth_corrections: list[int] = []
    for index, row in enumerate(rows):
        page = int(row.get("page", -1))
        raw_depth = int(row.get("depth", -1))
        if not 96 <= page <= 106:
            raise ValueError(f"Source row {index} is outside the allowed printed pages: {page}")
        if raw_depth < 0 or raw_depth > 30:
            raise ValueError(f"Invalid source depth at row {index}: {raw_depth}")
        labels = tuple(str(part).strip() for part in row.get("source_path_labels", []))
        label = str(row.get("label", "")).strip()
        if not labels or labels[-1] != label:
            raise ValueError(f"Source label/path mismatch at row {index}: {label!r} / {labels!r}")
        parent_path = labels[:-1]
        parent_index = path_to_order.get(parent_path) if parent_path else None
        if parent_path and parent_index is None:
            raise ValueError(f"Missing source parent path before row {index}: {parent_path!r}")
        corrected_depth = len(parent_path)
        parents.append(parent_index)
        if raw_depth != corrected_depth:
            depth_corrections.append(index)
        row["_vertigo_parent_order"] = parent_index
        row["_vertigo_order"] = index
        row["_vertigo_source_depth"] = corrected_depth
        if labels in path_to_order:
            raise ValueError(f"Duplicate source path at row {index}: {labels!r}")
        path_to_order[labels] = index
    return rows, parents, depth_corrections


def exact_signature_matches(rows, local, matches, helpers):
    used = set(matches.values())
    remaining = set(range(len(rows))) - set(matches)
    exact_matches: dict[int, str] = {}
    while True:
        candidates: dict[int, set[str]] = {}
        for index in remaining:
            source_signature = helpers.source_signature(rows[index])
            if not source_signature:
                continue
            candidates[index] = {
                rubric_id for rubric_id, record in local.items()
                if rubric_id not in used and helpers.local_signature(record) == source_signature
            }
        candidates = {index: ids for index, ids in candidates.items() if ids}
        reverse: dict[str, list[int]] = {}
        for index, ids in candidates.items():
            if len(ids) == 1:
                reverse.setdefault(next(iter(ids)), []).append(index)
        pairs = [(indices[0], rubric_id) for rubric_id, indices in reverse.items() if len(indices) == 1]
        if not pairs:
            break
        for index, rubric_id in pairs:
            if index in remaining and rubric_id not in used:
                matches[index] = rubric_id
                exact_matches[index] = rubric_id
                remaining.remove(index)
                used.add(rubric_id)
    return exact_matches


def prepare_overlay(snapshot: list[dict[str, Any]], chapter: dict[str, dict], helpers):
    rows, parent_orders, depth_corrections = source_rows_and_parents(copy.deepcopy(snapshot), helpers)
    base_matches, base_stages = helpers.map_existing_ids(rows, chapter)
    matches = dict(base_matches)
    exact_matches = exact_signature_matches(rows, chapter, matches, helpers)
    manual_matches: dict[int, str] = {}
    used = set(matches.values())

    by_path: dict[str, int] = {}
    for index, row in enumerate(rows):
        source_path = ", ".join(row["source_path_labels"])
        if source_path in by_path:
            raise ValueError(f"Duplicate source path at rows {by_path[source_path]} and {index}: {source_path}")
        by_path[source_path] = index

    for source_path, rubric_id in MANUAL_CROSSWALK.items():
        if source_path not in by_path:
            raise ValueError(f"Manual crosswalk source path is no longer present: {source_path}")
        index = by_path[source_path]
        if index in matches:
            raise ValueError(f"Manual crosswalk duplicates an automatic match: {source_path}")
        if rubric_id not in chapter:
            raise ValueError(f"Manual crosswalk local id is missing: {rubric_id}")
        if rubric_id in used:
            raise ValueError(f"Manual crosswalk local id is already used: {rubric_id}")
        matches[index] = rubric_id
        manual_matches[index] = rubric_id
        used.add(rubric_id)

    new_rows: dict[int, str] = {}
    for index in range(len(rows)):
        if index in matches:
            continue
        rubric_id = f"h{index:04d}"
        if rubric_id in chapter:
            raise ValueError(f"Generated source id already exists in local data: {rubric_id}")
        matches[index] = rubric_id
        new_rows[index] = rubric_id

    if len(matches) != 429 or len(set(matches.values())) != 429:
        raise ValueError("Source crosswalk is incomplete or reuses a local row")

    output = copy.deepcopy(chapter)
    for index, source in enumerate(rows):
        rubric_id = matches[index]
        source_path_labels = [str(part).strip() for part in source["source_path_labels"]]
        source_path = ", ".join(source_path_labels)
        parent_index = parent_orders[index]
        parent_id = matches[parent_index] if parent_index is not None else None
        source_remedies: dict[str, int] = {}
        for remedy in source.get("remedies", []):
            code = helpers.normalize_remedy_code(remedy["name"])
            grade = int(remedy["grade"])
            if not code or grade not in (1, 2, 3):
                raise ValueError(f"Invalid source medicine/grade at row {index}: {remedy!r}")
            if code in source_remedies:
                raise ValueError(f"Duplicate medicine at row {index}: {code}")
            source_remedies[code] = grade

        if index in new_rows:
            output[rubric_id] = {
                "t": source_path,
                "r": source_remedies,
            }
        record = output[rubric_id]
        if record.get("source_canonical") not in (None, MARKER):
            raise ValueError(f"Local record already has another source marker: {rubric_id}")
        record.update({
            "source_canonical": MARKER,
            "source_order": index,
            "source_page": int(source["page"]),
            "source_depth": int(source["_vertigo_source_depth"]),
            "source_parser_depth": int(source["depth"]),
            "source_label": str(source["label"]).strip(),
            "source_parent_id": parent_id,
            "source_path": source_path,
            "source_path_labels": source_path_labels,
            "source_remedies": source_remedies,
            "translation_title": str(record.get("t", source_path)),
            "source_match_method": (
                "existing-title-remedy-crosswalk" if index in base_matches
                else "unique-remedy-grade-crosswalk" if index in exact_matches
                else "manually-reviewed-title-context" if index in manual_matches
                else "new-source-rubric"
            ),
        })

    source_ids = {matches[i] for i in range(len(rows))}
    legacy_local_ids = set(chapter) - source_ids
    stage_counts = Counter(base_stages)
    summary = {
        "source_rubric_rows": len(rows),
        "chapter_heading_rows_excluded": 1,
        "source_pages": [96, 106],
        "initial_crosswalk_rows": len(base_matches),
        "initial_crosswalk_stages": dict(stage_counts),
        "unique_exact_remedy_grade_rows": len(exact_matches),
        "manually_reviewed_title_context_rows": len(manual_matches),
        "new_source_rubrics_added": len(new_rows),
        "existing_local_rows_before": len(chapter),
        "existing_local_rows_preserved_outside_source_tree": len(legacy_local_ids),
        "source_rows_without_unique_existing_id": sorted(new_rows),
        "source_path_based_depth_corrections": len(depth_corrections),
        "source_path_based_depth_correction_orders": depth_corrections,
    }
    return output, summary


def main() -> int:
    parser = argparse.ArgumentParser(description="Add the page 96–106 Vertigo source overlay without deleting local rows")
    parser.add_argument("--check", action="store_true", help="validate current source overlay without writing files")
    args = parser.parse_args()

    helpers = load_existing_audit_helpers()
    snapshot = read_json(SOURCE_PATH)
    chapter = read_json(CHAPTER_PATH)
    manifest = read_json(MANIFEST_PATH)
    output, summary = prepare_overlay(snapshot, chapter, helpers)

    active = [record for record in output.values() if record.get("source_canonical") == MARKER]
    if len(active) != 429:
        raise ValueError(f"Expected 429 active source rows; found {len(active)}")
    if len(output) != len(chapter) + summary["new_source_rubrics_added"]:
        raise ValueError("An existing local row was removed")

    manifest = copy.deepcopy(manifest)
    manifest["source_crosswalk"] = summary
    manifest["note"] = (
        "اس ماخذی عکس میں صرف صفحات 96 تا 106 کے چکر کے اندراج ہیں؛ صفحہ 107 سے آگے کچھ نہیں لیا گیا۔ "
        "اصل 567 مقامی قطاریں محفوظ ہیں؛ 429 ماخذی قطاریں الگ درختی نشان سے دکھائی جاتی ہیں، "
        "اور ماخذ سے غیر متعلق 138 مقامی قطاریں حذف یا تبدیل نہیں کی گئیں۔"
    )

    if args.check:
        expected_ids = {record["source_order"] for record in active}
        if expected_ids != set(range(429)):
            raise ValueError("Source order is incomplete")
        if output != chapter:
            raise ValueError("Current Vertigo source overlay differs from the reproducible build")
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return 0

    CHAPTER_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"Updated only: {CHAPTER_PATH.relative_to(ROOT)} and {MANIFEST_PATH.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
