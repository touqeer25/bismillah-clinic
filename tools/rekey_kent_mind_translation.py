#!/usr/bin/env python3
"""Re-key the downloaded Kent MIND Urdu text to the current Homeoint rubric titles.

No translation is generated here. Existing text is carried forward only when the
same stable rubric ID occurs in the recorded earlier chapter; new source rubrics
without an earlier ID remain untranslated rather than receiving guessed prose.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHAPTER_PATH = ROOT / "kent_chapters/mind.json"
TRANSLATION_SOURCE_PATH = ROOT / "kent_sources/github_mind_ur_translation_main.json"
CROSSWALK_PATH = ROOT / "kent_sources/kent_mind_translation_old_id_keys.json"
SOURCE_MANIFEST_PATH = ROOT / "kent_sources/kent_mind_translation_source_manifest.json"
OUTPUT_PATH = ROOT / "ur/rubrics/kent/mind.json"


def rubric_key(value: str) -> str:
    """Match js/18-rubrics-ur.js repRubKey exactly."""
    text = re.sub(r" \[\d+\]$", "", str(value or ""))
    text = re.sub(r"\s*\(\s*see\b[^)]*\)", "", text, flags=re.I)
    text = re.sub(r"\s+,", ",", text)
    text = re.sub(r",\s*,", ",", text)
    text = re.sub(r",\s*$", "", text)
    text = re.sub(r"^\s*,", "", text)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r",(\S)", r", \1", text)
    return text.strip().lower()


def git_blob_sha1(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + b"\0" + data).hexdigest()


def compact_json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, indent=0) + "\n"


def build() -> tuple[dict, dict]:
    chapter = json.loads(CHAPTER_PATH.read_text(encoding="utf-8"))
    translation_bytes = TRANSLATION_SOURCE_PATH.read_bytes()
    upstream = json.loads(translation_bytes)
    crosswalk = json.loads(CROSSWALK_PATH.read_text(encoding="utf-8"))
    source_manifest = json.loads(SOURCE_MANIFEST_PATH.read_text(encoding="utf-8"))

    expected_translation_blob = crosswalk.get("translation_source_git_blob_sha1")
    if expected_translation_blob != source_manifest.get("translation_git_blob_sha1"):
        raise ValueError("Translation Git blob hashes disagree between the saved source records.")
    if expected_translation_blob and git_blob_sha1(translation_bytes) != expected_translation_blob:
        raise ValueError("Saved repository translation file does not match its recorded Git blob.")
    expected_sha256 = source_manifest.get("translation_sha256")
    if expected_sha256 and hashlib.sha256(translation_bytes).hexdigest() != expected_sha256:
        raise ValueError("Saved repository translation file does not match its SHA-256 record.")
    if len(chapter) != source_manifest.get("current_homeoint_rubrics"):
        raise ValueError("Current MIND chapter count does not match the translation-source manifest.")
    old_id_to_key = crosswalk.get("id_to_translation_key") or {}
    upstream_rubrics = upstream.get("rubrics") or {}
    expected_old_count = source_manifest.get("translation_source_rubrics")
    if len(old_id_to_key) != expected_old_count or len(upstream_rubrics) != expected_old_count:
        raise ValueError("Saved earlier-ID map or downloaded translation count does not match the manifest.")
    old_locked = set(upstream.get("locked") or [])
    output_rubrics: dict[str, str] = {}
    output_locked: list[str] = []
    missing_old_text: list[str] = []
    new_source_rows: list[str] = []
    current_keys: dict[str, str] = {}

    ordered_rows = sorted(chapter.items(), key=lambda item: int(item[1]["source_order"]))
    for rid, row in ordered_rows:
        target_key = rubric_key(row.get("t", ""))
        if not target_key:
            raise ValueError(f"Empty current translation key at rubric {rid}")
        if target_key in current_keys:
            raise ValueError(f"Duplicate normalized current key {target_key!r}: {current_keys[target_key]} and {rid}")
        current_keys[target_key] = str(rid)
        old_key = old_id_to_key.get(str(rid))
        if old_key is None:
            new_source_rows.append(str(rid))
            continue
        translated = upstream_rubrics.get(old_key)
        if not translated:
            missing_old_text.append(str(rid))
            continue
        if target_key in output_rubrics and output_rubrics[target_key] != translated:
            raise ValueError(f"Conflicting translations for current key {target_key!r}")
        output_rubrics[target_key] = str(translated)
        if old_key in old_locked:
            output_locked.append(target_key)

    if missing_old_text:
        raise ValueError("Earlier-ID translations missing from downloaded file: " + ", ".join(missing_old_text[:8]))
    if len(output_rubrics) != len(set(output_rubrics)):
        raise ValueError("Current translation keys are not unique")

    meta = dict(upstream.get("meta") or {})
    meta["version"] = int(meta.get("version", 1)) + 1
    meta["count"] = len(output_rubrics)
    meta["locked_count"] = len(output_locked)
    meta["source_rubric_count"] = len(chapter)
    meta["untranslated_count"] = len(chapter) - len(output_rubrics)
    meta["updated"] = "2026-10-03"
    meta["note"] = (
        "کینٹ کے ذہنی باب کے اردو متن کو پرانی مستحکم ربرک شناختوں کے ذریعے موجودہ ماخذی عنوانات سے جوڑا گیا ہے۔ "
        "نئے 117 ماخذی ربرکس کے لیے سابقہ ترجمہ فائل میں عبارت نہیں؛ کوئی خودکار ترجمہ شامل نہیں کیا گیا۔"
    )
    output = {"meta": meta, "rubrics": output_rubrics, "locked": output_locked}
    summary = {
        "current_source_rubrics": len(chapter),
        "repository_translations": len(upstream_rubrics),
        "rekeyed_translations": len(output_rubrics),
        "untranslated_new_source_rubrics": len(new_source_rows),
        "untranslated_id_examples": new_source_rows[:8],
        "locked_translations": len(output_locked),
    }
    if len(chapter) - len(output_rubrics) != len(new_source_rows):
        raise ValueError("Some current MIND rubrics have neither a re-used ID nor a translation.")
    if len(output_rubrics) != source_manifest.get("old_id_matches_with_translation"):
        raise ValueError("Re-keyed translation count does not match the recorded stable-ID overlap.")
    if len(new_source_rows) != source_manifest.get("current_rubrics_without_existing_translation"):
        raise ValueError("Untranslated current-rubric count does not match the recorded overlap.")
    return output, summary


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="write the re-keyed MIND Urdu file")
    parser.add_argument("--check", action="store_true", help="verify the saved file matches the re-keyed source")
    args = parser.parse_args()
    output, summary = build()
    expected = compact_json(output)
    if args.check:
        if not OUTPUT_PATH.exists() or OUTPUT_PATH.read_text(encoding="utf-8") != expected:
            raise SystemExit("Kent MIND Urdu rubric file is stale; run tools/rekey_kent_mind_translation.py --write")
        print(json.dumps(summary, ensure_ascii=False))
        print("Kent MIND Urdu translations are joined to current rubric keys.")
        return
    if args.write:
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT_PATH.write_text(expected, encoding="utf-8")
    print(json.dumps({"write": args.write, **summary}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
