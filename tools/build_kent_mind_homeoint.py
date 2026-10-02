#!/usr/bin/env python3
"""Build only Kent MIND from the committed, audited Homeoint page extraction.

By default the builder uses the parsed snapshots under kent_sources, so --check
works offline and across workspace sessions. Use --source-dir to rebuild against
fresh temporary audit output. Existing local IDs are reused only through unique
matches; titles, parents, order, medicines, and grades come from the extraction.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import tempfile
from collections import Counter, defaultdict
from pathlib import Path

from audit_kent_mind_homeoint import normalize_remedy_code, parse_remedy_abbreviations

ROOT = Path(__file__).resolve().parents[1]
SOURCE_SNAPSHOT_DIR = ROOT / "kent_sources"
DEFAULT_RAW_SOURCE_DIR = Path("/tmp/kentmind_homeoint")
MIND_PATH = ROOT / "kent_chapters/mind.json"
MASTER_PATH = ROOT / "kent_repertory.json"
INDEX_PATH = ROOT / "kent_chapters/_index.json"
NAMES_PATH = ROOT / "remedy_names.json"


def normalize_title(value: str) -> str:
    value = str(value).lower().replace("æ", "ae").replace("œ", "oe").replace("’", "'")
    value = re.sub(r"\(\s*(?:see|compare)\b[^)]*\)", " ", value, flags=re.I)
    return "".join(char for char in value if char.isalnum())


def source_signature(row: dict) -> tuple[tuple[str, int], ...]:
    return tuple(sorted(
        (normalize_remedy_code(remedy["name"]), int(remedy["grade"]))
        for remedy in row["remedies"]
    ))


def local_signature(row: dict) -> tuple[tuple[str, int], ...]:
    return tuple(sorted(
        (normalize_remedy_code(code), int(grade))
        for code, grade in (row.get("r") or {}).items()
    ))


def validate_source_rows(rows: list[dict]) -> None:
    if not rows:
        raise ValueError("The Homeoint extraction is empty")
    if [row.get("source_order") for row in rows] != list(range(len(rows))):
        raise ValueError("source_order must be continuous and match the extracted page order")
    stack: list[dict] = []
    for row in rows:
        depth = int(row["depth"])
        if depth > len(stack):
            raise ValueError(f"Source tree has an unattached level at order {row['source_order']}")
        stack = stack[:depth]
        expected_parent = stack[-1]["source_order"] if depth else None
        if row.get("parent_source_order") != expected_parent:
            raise ValueError(f"Parent mismatch at source order {row['source_order']}")
        expected_path = [parent["label"] for parent in stack] + [row["label"]]
        if row.get("source_path_labels") != expected_path:
            raise ValueError(f"Path mismatch at source order {row['source_order']}")
        if not 1 <= int(row["page"]) <= 95:
            raise ValueError(f"Printed page out of range at source order {row['source_order']}")
        for remedy in row["remedies"]:
            if int(remedy["grade"]) not in (1, 2, 3):
                raise ValueError(f"Invalid source grade at source order {row['source_order']}")
        stack.append(row)


def map_existing_ids(rows: list[dict], local: dict) -> tuple[dict[int, str], Counter]:
    """One-to-one ID crosswalk; deliberately avoids leaf-only/signature-only guesses."""
    # An already-built source chapter is reused exactly, making rebuilds idempotent.
    by_order = defaultdict(list)
    for rid, rubric in local.items():
        if isinstance(rubric, dict) and isinstance(rubric.get("source_order"), int):
            by_order[rubric["source_order"]].append((rid, rubric))
    if len(by_order) == len(rows) and all(len(by_order.get(i, [])) == 1 for i in range(len(rows))):
        exact = {}
        for row in rows:
            rid, old = by_order[row["source_order"]][0]
            full_title = ", ".join(row["source_path_labels"])
            expected_remedies = {
                normalize_remedy_code(remedy["name"]): int(remedy["grade"])
                for remedy in row["remedies"]
            }
            if (old.get("t") != full_title or old.get("source_label") != row["label"] or
                    old.get("source_page") != row["page"] or old.get("r", {}) != expected_remedies):
                break
            exact[row["source_order"]] = rid
        else:
            return exact, Counter({"existing_source_order": len(exact)})

    local_titles = {rid: normalize_title(rubric.get("t", ""))
                    for rid, rubric in local.items() if isinstance(rubric, dict)}
    local_sigs = {rid: local_signature(rubric)
                  for rid, rubric in local.items() if isinstance(rubric, dict)}
    remaining_source = set(range(len(rows)))
    remaining_local = set(local_titles)
    matches: dict[int, str] = {}
    stages: Counter = Counter()

    prepared = []
    for index, row in enumerate(rows):
        path_labels = row["source_path_labels"]
        prepared.append({
            "full": normalize_title(", ".join(path_labels)),
            "leaf": normalize_title(row["label"]),
            "root": normalize_title(path_labels[0].split(",", 1)[0]),
            "signature": source_signature(row),
        })

    def candidates(stage: str, index: int) -> set[str]:
        item = prepared[index]
        if stage == "full_path":
            return {rid for rid in remaining_local if local_titles[rid] == item["full"]}
        if stage == "root_leaf_and_remedies":
            if not item["signature"]:
                return set()
            return {
                rid for rid in remaining_local
                if local_titles[rid].startswith(item["root"])
                and local_titles[rid].endswith(item["leaf"])
                and local_sigs[rid] == item["signature"]
            }
        if stage == "leaf_and_remedies":
            if not item["signature"]:
                return set()
            return {
                rid for rid in remaining_local
                if local_titles[rid].endswith(item["leaf"])
                and local_sigs[rid] == item["signature"]
            }
        if stage == "root_and_leaf":
            return {
                rid for rid in remaining_local
                if item["leaf"] and local_titles[rid].startswith(item["root"])
                and local_titles[rid].endswith(item["leaf"])
            }
        return set()

    for stage in ("full_path", "root_leaf_and_remedies", "leaf_and_remedies", "root_and_leaf"):
        while True:
            options = {index: candidates(stage, index) for index in remaining_source}
            options = {index: ids for index, ids in options.items() if ids}
            reverse = defaultdict(list)
            for index, ids in options.items():
                if len(ids) == 1:
                    reverse[next(iter(ids))].append(index)
            pairs = [(indices[0], rid) for rid, indices in reverse.items() if len(indices) == 1]
            if not pairs:
                break
            for index, rid in pairs:
                if index not in remaining_source or rid not in remaining_local:
                    continue
                matches[index] = rid
                remaining_source.remove(index)
                remaining_local.remove(rid)
                stages[stage] += 1
    return matches, stages


def add_required_remedy_names(rows: list[dict], names: dict, source_abbreviations: dict) -> tuple[dict, list[str]]:
    updated = dict(names)
    additions = []
    source_codes = sorted({normalize_remedy_code(remedy["name"])
                           for row in rows for remedy in row["remedies"]})
    for code in source_codes:
        if not code:
            raise ValueError("Empty source remedy abbreviation")
        if code in updated:
            continue
        if code in source_abbreviations:
            updated[code] = source_abbreviations[code]
        elif code == "cocaine":
            # The MIND page itself prints “Cocaine.”; it is absent from Kent's
            # abbreviation list, so preserve that literal source designation.
            updated[code] = "Cocaine"
        else:
            raise ValueError(f"No Homeoint or existing display name for source remedy {code!r}")
        additions.append(code)
    return dict(sorted(updated.items())), additions


def build_chapter(rows: list[dict], local: dict, remedy_names: dict,
                  source_abbreviations: dict) -> tuple[dict, dict]:
    validate_source_rows(rows)
    name_map, additions = add_required_remedy_names(rows, remedy_names, source_abbreviations)
    id_map, stages = map_existing_ids(rows, local)
    used = set(id_map.values())
    for row in rows:
        order = int(row["source_order"])
        if order in id_map:
            continue
        rid = "h" + str(order).zfill(4)
        if rid in local or rid in used:
            raise ValueError(f"Deterministic new rubric ID collides: {rid}")
        id_map[order] = rid
        used.add(rid)
    if len(set(id_map.values())) != len(rows):
        raise ValueError("The source-to-local ID crosswalk is not one-to-one")

    output = {}
    for row in rows:
        order = int(row["source_order"])
        parent_order = row["parent_source_order"]
        parent_id = id_map[parent_order] if parent_order is not None else None
        title = ", ".join(row["source_path_labels"])
        remedies = {}
        for remedy in row["remedies"]:
            code = normalize_remedy_code(remedy["name"])
            grade = int(remedy["grade"])
            if code in remedies and remedies[code] != grade:
                raise ValueError(f"Conflicting grades for {code} at source order {order}")
            remedies[code] = grade
        rubric = {
            "t": title,
            "r": remedies,
            "source_label": row["label"],
            "source_parent_id": parent_id,
            "source_order": order,
            "source_page": int(row["page"]),
        }
        output[id_map[order]] = rubric

    mapping_summary = {
        "matched_existing_ids": sum(stages.values()),
        "new_source_ids": len(rows) - sum(stages.values()),
        "unused_old_local_ids": len(set(local) - set(id_map.values())),
        "matching_stages": dict(stages),
        "new_remedy_name_keys": additions,
        "new_remedy_name_count": len(additions),
    }
    return output, {"remedy_names": name_map, "mapping": mapping_summary}


def json_compact(value) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def replace_master_mind_value(master_text: str, mind_text: str) -> str:
    match = re.match(r"\s*\{\s*\"mind\"\s*:\s*", master_text)
    if not match:
        raise ValueError("kent_repertory.json must start with its mind chapter")
    start = match.end()
    if start >= len(master_text) or master_text[start] != "{":
        raise ValueError("Could not locate the MIND object in kent_repertory.json")
    depth = 0
    in_string = False
    escaped = False
    end = None
    for index in range(start, len(master_text)):
        char = master_text[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char in "{[":
            depth += 1
        elif char in "}]":
            depth -= 1
            if depth == 0:
                end = index + 1
                break
    if end is None:
        raise ValueError("Unclosed MIND object in kent_repertory.json")
    return master_text[:start] + mind_text + master_text[end:]


def atomic_write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    mode = (path.stat().st_mode & 0o777) if path.exists() else 0o644
    fd, temp_name = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=path.parent)
    try:
        os.chmod(temp_name, mode)
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as handle:
            handle.write(text)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_name, path)
    except Exception:
        try:
            os.unlink(temp_name)
        except OSError:
            pass
        raise


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=None,
        help=("optional raw audit directory (default: committed parsed snapshot in "
              "kent_sources; raw-audit example: " + str(DEFAULT_RAW_SOURCE_DIR)),
    )
    parser.add_argument("--write", action="store_true", help="write only the Kent MIND-related outputs")
    parser.add_argument("--check", action="store_true", help="fail unless saved outputs match the source build")
    args = parser.parse_args()

    if args.source_dir is None:
        source_json = SOURCE_SNAPSHOT_DIR / "homeoint_mind_candidates.json"
        abbreviation_json = SOURCE_SNAPSHOT_DIR / "homeoint_remedy_abbreviations.json"
        manifest_json = SOURCE_SNAPSHOT_DIR / "homeoint_mind_source_manifest.json"
        if not source_json.exists() or not abbreviation_json.exists() or not manifest_json.exists():
            raise SystemExit("Committed Homeoint MIND source snapshot is incomplete.")
        manifest = json.loads(manifest_json.read_text(encoding="utf-8"))
        candidate_bytes = source_json.read_bytes()
        abbreviation_bytes = abbreviation_json.read_bytes()
        expected_candidate_hash = manifest.get("candidate_snapshot_sha256")
        expected_abbreviation_hash = manifest.get("remedy_abbreviations_snapshot_sha256")
        if expected_candidate_hash and hashlib.sha256(candidate_bytes).hexdigest() != expected_candidate_hash:
            raise SystemExit("Committed Homeoint MIND candidate snapshot hash mismatch.")
        if expected_abbreviation_hash and hashlib.sha256(abbreviation_bytes).hexdigest() != expected_abbreviation_hash:
            raise SystemExit("Committed Homeoint remedy-abbreviation snapshot hash mismatch.")
        source_rows = json.loads(candidate_bytes)
        source_abbreviations = json.loads(abbreviation_bytes)
        if len(source_rows) != manifest.get("candidate_count"):
            raise SystemExit("Committed Homeoint MIND source count does not match its manifest.")
    else:
        source_json = args.source_dir / "mind_extracted_candidates.json"
        remedy_html = args.source_dir / "kentreme.htm"
        if not source_json.exists() or not remedy_html.exists():
            raise SystemExit("The raw audit directory must contain parsed candidates and kentreme.htm.")
        source_rows = json.loads(source_json.read_text(encoding="utf-8"))
        source_abbreviations = parse_remedy_abbreviations(remedy_html.read_bytes())
    local = json.loads(MIND_PATH.read_text(encoding="utf-8"))
    names = json.loads(NAMES_PATH.read_text(encoding="utf-8"))
    new_mind, build_info = build_chapter(source_rows, local, names, source_abbreviations)
    new_names = build_info["remedy_names"]
    mapping = build_info["mapping"]

    mind_text = json_compact(new_mind)
    names_text = json.dumps(new_names, ensure_ascii=False, indent=0) + "\n"
    master_before_text = MASTER_PATH.read_text(encoding="utf-8")
    master_before = json.loads(master_before_text)
    master_text = replace_master_mind_value(master_before_text, mind_text)
    master_after = json.loads(master_text)
    for key in master_before:
        if key != "mind" and master_before[key] != master_after[key]:
            raise ValueError(f"Non-MIND chapter changed in master data: {key}")
    master_after["mind"] = new_mind
    if master_after["mind"] != new_mind:
        raise ValueError("Master MIND object does not match the generated chapter")

    index_before = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    index_after = [dict(item) for item in index_before]
    matches = [item for item in index_after if item.get("key") == "mind"]
    if len(matches) != 1:
        raise ValueError("Expected exactly one MIND record in kent_chapters/_index.json")
    matches[0]["rubrics"] = len(new_mind)
    index_text = json_compact(index_after)

    outputs = {
        MIND_PATH: mind_text,
        MASTER_PATH: master_text,
        INDEX_PATH: index_text,
        NAMES_PATH: names_text,
    }
    if args.check:
        stale = [str(path.relative_to(ROOT)) for path, text in outputs.items()
                 if not path.exists() or path.read_text(encoding="utf-8") != text]
        if stale:
            raise SystemExit("Stale Homeoint MIND outputs: " + ", ".join(stale))
        print("Homeoint MIND outputs are current.")
        return
    if args.write:
        for path, text in outputs.items():
            atomic_write(path, text)

    total_remedies = sum(len(row["r"]) for row in new_mind.values())
    grades = Counter(grade for row in new_mind.values() for grade in row["r"].values())
    print(json.dumps({
        "write": args.write,
        "source_records": len(source_rows),
        "chapter_records": len(new_mind),
        "with_remedies": sum(bool(row["r"]) for row in new_mind.values()),
        "empty_rubrics": sum(not row["r"] for row in new_mind.values()),
        "remedy_grade_entries": total_remedies,
        "grade_counts": {str(grade): grades[grade] for grade in sorted(grades)},
        "roots": sum(row["source_parent_id"] is None for row in new_mind.values()),
        "parent_links": sum(row["source_parent_id"] is not None for row in new_mind.values()),
        **mapping,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
