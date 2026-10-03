"""Regression checks for the source-backed Kent MIND Urdu translation join."""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import rekey_kent_mind_translation as rekey  # noqa: E402


class KentMindTranslationRekeyTests(unittest.TestCase):
    def test_saved_file_is_reproducible_and_joined_only_by_old_id(self) -> None:
        chapter_bytes_before = rekey.CHAPTER_PATH.read_bytes()
        output, summary = rekey.build()
        saved = json.loads(rekey.OUTPUT_PATH.read_text(encoding="utf-8"))
        chapter = json.loads(chapter_bytes_before)
        raw = json.loads(rekey.TRANSLATION_SOURCE_PATH.read_text(encoding="utf-8"))
        crosswalk = json.loads(rekey.CROSSWALK_PATH.read_text(encoding="utf-8"))
        old_id_to_key = crosswalk["id_to_translation_key"]

        self.assertEqual(saved, output)
        self.assertEqual(summary["current_source_rubrics"], 4356)
        self.assertEqual(summary["repository_translations"], 4834)
        self.assertEqual(summary["rekeyed_translations"], 4239)
        self.assertEqual(summary["untranslated_new_source_rubrics"], 117)
        self.assertEqual(len(saved["rubrics"]), 4239)
        self.assertEqual(saved["meta"]["untranslated_count"], 117)

        joined = 0
        untranslated = 0
        for rid, row in chapter.items():
            current_key = rekey.rubric_key(row["t"])
            old_key = old_id_to_key.get(str(rid))
            if old_key is None:
                untranslated += 1
                self.assertNotIn(current_key, saved["rubrics"], rid)
                continue
            self.assertIn(old_key, raw["rubrics"], rid)
            self.assertEqual(saved["rubrics"].get(current_key), raw["rubrics"][old_key], rid)
            joined += 1

        self.assertEqual(joined, 4239)
        self.assertEqual(untranslated, 117)
        self.assertEqual(rekey.CHAPTER_PATH.read_bytes(), chapter_bytes_before,
                         "the source MIND chapter is read-only during the translation join")

    def test_raw_download_copy_and_saved_hashes_are_intact(self) -> None:
        manifest = json.loads(rekey.SOURCE_MANIFEST_PATH.read_text(encoding="utf-8"))
        copied = ROOT / "kent_sources/github_mind_ur_translation_main.json"
        output_bytes = rekey.OUTPUT_PATH.read_bytes()
        self.assertEqual(rekey.TRANSLATION_SOURCE_PATH.read_bytes(), copied.read_bytes())
        self.assertEqual(rekey.git_blob_sha1(copied.read_bytes()), manifest["translation_git_blob_sha1"])
        self.assertEqual(hashlib.sha256(output_bytes).hexdigest(), manifest["rekeyed_output_sha256"])
        self.assertEqual(manifest["rekeyed_output_rubrics"], 4239)
        self.assertEqual(manifest["rekeyed_output_untranslated_rubrics"], 117)

    def test_saved_join_passes_command_line_check(self) -> None:
        result = subprocess.run(
            [sys.executable, str(ROOT / "tools/rekey_kent_mind_translation.py"), "--check"],
            cwd=ROOT, text=True, capture_output=True, check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('"rekeyed_translations": 4239', result.stdout)
        self.assertIn('"untranslated_new_source_rubrics": 117', result.stdout)


if __name__ == "__main__":
    unittest.main()
