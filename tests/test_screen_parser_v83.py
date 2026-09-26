"""v83 source metadata + image-first scroll evidence; no copyrighted scans needed."""
import json
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from tools.screen_parser import capture, engine
from tools.screen_parser.store import Ledger

NAMES = engine.read_remedy_names(ROOT)


def scan(text, key="frame"):
    return {"columns": [[{"text": line, "words": [], "bbox": [0, i*24, 240, 21],
                          "confidence": 97} for i, line in enumerate(text.splitlines())]],
            "text": text, "second": text, "image_sha256": key,
            "low_confidence": [], "alt_columns": [text]}


class UnknownSourceTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.ledger = Ledger(self.folder.name)
        self.image = Image.new("RGB", (460, 260), "white")

    def tearDown(self):
        self.folder.cleanup()

    def test_unknown_edition_total_and_page_labels_are_not_invented(self):
        book = self.ledger.create_book("Other application", "", "prescriber",
                                       total_pages=None, first_page=None, last_page=None,
                                       page_mode="sequence", range_confirmed=False)
        b = self.ledger.book(book)
        self.assertEqual(b["edition"], "")
        self.assertIsNone(b["total_pages"])
        self.assertIsNone(b["first_page"])
        self.assertIsNone(b["last_page"])
        self.assertEqual(self.ledger.expected_next(book), 1)
        self.assertIsNone(self.ledger.physical_page_for(b, 1))
        first = self.ledger.start_session(book)
        self.ledger.add_capture(book, 1, self.image, scan("Abdomen—colic—(Nux-v.)"), first)
        self.assertEqual(self.ledger.finish_page(book, 1, NAMES, first)["status"], "approved")
        self.assertEqual(self.ledger.stats(book, first)["today_new_approved"], 1)
        self.assertIsNone(self.ledger.stats(book)["remaining"])
        self.assertFalse(self.ledger.stats(book)["book_complete"])
        self.assertEqual(self.ledger.expected_next(book), 2)
        with self.assertRaisesRegex(ValueError, "confirm total"):
            self.ledger.export(book, Path(self.folder.name)/"not-complete.zip", NAMES)
        staged = self.ledger.export(book, Path(self.folder.name)/"partial.zip", NAMES,
                                    allow_partial=True)
        with zipfile.ZipFile(staged) as z:
            manifest = json.loads(z.read("screen_parser/manifest.json"))
            self.assertFalse(manifest["complete"])
            self.assertEqual(manifest["book"]["page_number_kind"], "capture_sequence")
            self.assertIsNone(manifest["pages"][0]["physical_page"])
            self.assertEqual(manifest["pages"][0]["capture_sequence"], 1)
            self.assertFalse(any(name.endswith(".png") for name in z.namelist()))
            self.assertIn("PARTIAL", z.read("README_IMPORT_FIRST.txt").decode())
        self.ledger.end_session(first)
        second = self.ledger.start_session(book)
        self.assertEqual(Ledger(self.folder.name).stats(book, second)["session_new_approved"], 0)
        with self.assertRaisesRegex(ValueError, "Confirm the total"):
            self.ledger.update_book_details(book, edition="unconfirmed", total_pages=25,
                                            first_page=24, last_page=None, range_confirmed=True)
        self.ledger.update_book_details(book, edition="verified sixth", total_pages=25,
                                        first_page=24, last_page=25, range_confirmed=True,
                                        session=second)
        self.assertEqual(self.ledger.physical_page_for(self.ledger.book(book), 1), 24)
        self.assertEqual(self.ledger.expected_next(book), 2)
        self.assertFalse(self.ledger.stats(book)["book_complete"])
        later = Image.new("RGB", self.image.size, "#eeeeee")
        self.ledger.add_capture(book, 2, later, scan("Abdomen—dropsy—(Apoc.)", "second"), second)
        checked = self.ledger.finish_page(book, 2, NAMES, second)
        if checked["status"] == "review":  # a known abbreviation may need checking
            for index, _ in enumerate(checked["issues"]):
                self.ledger.resolve_issue(book, 2, index, "verified_from_image",
                                          "Verified original generated page", second)
            self.ledger.approve_page(book, 2, "manual_override", second, "Source inspected")
        self.assertTrue(self.ledger.stats(book)["book_complete"])
        complete = self.ledger.export(book, Path(self.folder.name)/"complete.zip", NAMES)
        with zipfile.ZipFile(complete) as z:
            manifest = json.loads(z.read("screen_parser/manifest.json"))
            self.assertTrue(manifest["complete"])
            self.assertEqual([r["physical_page"] for r in manifest["pages"]], [24, 25])
        self.ledger.reopen_page(book, 1, second)
        self.assertFalse(self.ledger.stats(book)["book_complete"])
        # Page 2 was first-approved in this session; reopened page 1 does not add one.
        self.assertEqual(self.ledger.stats(book, second)["session_new_approved"], 1)

    def test_raw_screenshot_is_safe_before_ocr_and_bounds_are_a_hard_gate(self):
        b = self.ledger.create_book("Book with no counter", profile="prescriber",
                                    page_mode="sequence")
        sid = self.ledger.start_session(b)
        text = "Abdomen—colic—(Nux-v.)"
        n = self.ledger.stage_capture(b, 1, self.image, sid)
        self.assertEqual(n, 1)
        self.assertTrue(self.ledger.captures(b, 1)[0]["image"].is_file())
        self.assertEqual(self.ledger.unready_captures(b, 1)[0]["scan"]["_state"], "pending")
        self.assertIsNone(self.ledger.stage_capture(b, 1, self.image, sid))
        with self.assertRaisesRegex(ValueError, "still need OCR"):
            self.ledger.finish_page(b, 1, NAMES, sid)
        restarted = Ledger(self.folder.name)
        self.assertEqual(len(restarted.unready_captures(b, 1)), 1)
        restarted.complete_capture(b, 1, n, scan(text), sid)
        p = restarted.finish_page(b, 1, NAMES, sid)
        self.assertEqual(p["status"], "review")
        self.assertIn("unconfirmed_page_bounds", [i["code"] for i in p["issues"]])
        for index, _ in enumerate(p["issues"]):
            restarted.resolve_issue(b, 1, index, "false_alarm", "Visual source checked", sid)
        with self.assertRaisesRegex(ValueError, "Top, bottom"):
            restarted.approve_page(b, 1, "manual_override", sid, "Inspected source")
        restarted.confirm_capture_boundaries(b, 1, top=True, bottom=True,
                                             preview=True, note="Whole page visually checked")
        restarted.approve_page(b, 1, "manual_override", sid, "Inspected source")
        self.assertEqual(restarted.stats(b, sid)["today_new_approved"], 1)

    def test_rechecking_never_silently_erases_human_corrected_text_or_printed_folio(self):
        b = self.ledger.create_book("Manual edit", profile="prescriber",
                                    page_mode="sequence", range_confirmed=False)
        old = scan("Abdomen—colix—(Nux-v.)")
        old["low_confidence"] = [{"text": "colix"}]
        self.ledger.add_capture(b, 1, self.image, old)
        self.ledger.finish_page(b, 1, NAMES, printed_page="iv")
        page = self.ledger.recheck_text(b, 1, "Abdomen—colic—(Nux-v.)", NAMES)
        self.assertEqual(page["corrected_text"], "Abdomen—colic—(Nux-v.)")
        with self.assertRaisesRegex(ValueError, "must not overwrite human work"):
            self.ledger.finish_page(b, 1, NAMES)
        self.assertEqual(self.ledger.page(b, 1)["corrected_text"], "Abdomen—colic—(Nux-v.)")
        self.assertEqual(self.ledger.page(b, 1)["printed_page"], "iv")

    def test_changed_ocr_keeps_existing_counter_evidence_and_origin(self):
        from unittest.mock import patch
        from tools.screen_parser import ocr
        b = self.ledger.create_book("Numbered viewer", profile="prescriber",
                                    total_pages=40, first_page=7, last_page=8,
                                    page_mode="physical", range_confirmed=True)
        old = scan("Abdomen—colic—(Nux-v.)")
        old.update(viewer_page=7, viewer_total=40, source_kind="screen",
                   low_confidence=[{"text": "synthetic source warning"}])
        self.ledger.add_capture(b, 7, self.image, old)
        self.ledger.finish_page(b, 7, NAMES)
        with patch.object(ocr, "ocr_columns", return_value=scan("Abdomen—colic—(Nux-v.)")):
            _page, improved = self.ledger.retry_page(b, 7, NAMES, attempt=1)
        self.assertTrue(improved, "Verify counter provenance on the accepted replacement scan")
        r = self.ledger.captures(b, 7)[0]["scan"]
        self.assertEqual([r["viewer_page"], r["viewer_total"], r["source_kind"]],
                         [7, 40, "screen"])

    def test_partial_prescriber_keeps_unlinked_text_without_fake_remedy_heading(self):
        b = self.ledger.create_book("Quick Prescriber fragment", profile="prescriber",
                                    page_mode="sequence", range_confirmed=False)
        text = "small quantity relieves him.\nAbdomen—colic—(Nux-v.)"
        self.ledger.add_capture(b, 1, self.image, scan(text))
        p = self.ledger.finish_page(b, 1, NAMES)
        self.assertEqual(p["status"], "review")
        self.assertIn("small quantity", p["parsed"]["unlinked_continuation"])
        for i, _ in enumerate(p["issues"]):
            self.ledger.resolve_issue(b, 1, i, "verified_from_image", "Original fragment visible")
        self.ledger.approve_page(b, 1, "manual_override", note="Confirmed exact source")
        self.ledger.update_book_details(b, total_pages=1, first_page=1, last_page=1,
                                        range_confirmed=True)
        self.assertFalse(self.ledger.stats(b)["book_complete"],
                         "Unlinked first-page prose cannot claim a complete book")
        with self.assertRaisesRegex(ValueError, "no source entry heading"):
            self.ledger.export(b, Path(self.folder.name)/"wrongly-complete.zip", NAMES)
        path = self.ledger.export(b, Path(self.folder.name)/"fragment.zip", NAMES, allow_partial=True)
        with zipfile.ZipFile(path) as z:
            unlinked = json.loads(z.read("screen_parser/unlinked_continuations.json"))
            self.assertEqual(unlinked[0]["text"], "small quantity relieves him.")
            library_name = next(x for x in z.namelist() if "/library/" in x)
            library = json.loads(z.read(library_name))
            self.assertEqual(len(library["sections"]), 1)
            self.assertNotIn("small quantity", library["sections"][0]["h"])

    def test_persistent_scroll_warning_survives_restart_and_text_recheck(self):
        b = self.ledger.create_book("Other app", profile="prescriber", page_mode="sequence")
        self.ledger.confirm_capture_boundaries(b, 1, top=True, bottom=True, preview=True)
        self.ledger.flag_capture_uncertain(b, 1, "Continuous fast scroll might skip a line")
        n = self.ledger.stage_capture(b, 1, self.image)
        self.ledger.complete_capture(b, 1, n, scan("Abdomen—colic—(Nux-v.)"))
        p = Ledger(self.folder.name).finish_page(b, 1, NAMES)
        self.assertEqual(p["status"], "review")
        self.assertIn("possible_missed_scroll", [i["code"] for i in p["issues"]])
        p = self.ledger.recheck_text(b, 1, p["raw_text"], NAMES)
        self.assertIn("possible_missed_scroll", [i["code"] for i in p["issues"]])
        self.ledger.clear_page_captures(b, 1)
        n = self.ledger.stage_capture(b, 1, self.image)
        self.ledger.complete_capture(b, 1, n, scan("Abdomen—colic—(Nux-v.)"))
        self.ledger.confirm_capture_boundaries(b, 1, top=True, bottom=True, preview=True)
        p = self.ledger.finish_page(b, 1, NAMES)
        self.assertNotIn("possible_missed_scroll", [i["code"] for i in p["issues"]])

    def test_old_books_migrate_in_place_without_losing_page_counts(self):
        b = self.ledger.create_book("Earlier registered", "sixth", "prescriber", 3)
        sid = self.ledger.start_session(b)
        self.ledger.add_capture(b, 1, self.image, scan("Abdomen—colic—(Nux-v.)"), sid)
        self.ledger.finish_page(b, 1, NAMES, sid)
        # Migration's additive columns can be dropped to emulate a v82 database.
        with self.ledger.connect() as c:
            for table, cols in (("books", ("page_mode", "range_confirmed")),
                                ("pages", ("top_confirmed", "bottom_confirmed",
                                           "preview_confirmed", "capture_origin"))):
                for col in cols:
                    c.execute(f"ALTER TABLE {table} DROP COLUMN {col}")
        after = Ledger(self.folder.name)
        self.assertEqual(after.book(b)["page_mode"], "physical")
        self.assertTrue(after.book(b)["range_confirmed"])
        self.assertEqual(after.stats(b)["approved"], 1)
        self.assertEqual(after.expected_next(b), 2)
        self.assertEqual(after.page(b, 1)["first_approved_day"], self.ledger.page(b, 1)["first_approved_day"])


class VisualScrollTests(unittest.TestCase):
    @staticmethod
    def source():
        image = Image.new("RGB", (720, 2400), "white")
        draw = ImageDraw.Draw(image)
        try:
            font = ImageFont.truetype("DejaVuSans.ttf", 24)
        except OSError:
            font = ImageFont.load_default()
        for i in range(78):
            draw.text((20, 15+i*30),
                      f"Abdomen condition {i:03d} remedy {(i*13)%71} and unique text {i*i}",
                      font=font, fill="black")
        return image

    def test_pixel_overlap_preview_and_disjoint_repeated_layout(self):
        image = self.source()
        first = image.crop((0, 0, 720, 600))
        second = image.crop((0, 260, 720, 860))
        third = image.crop((0, 510, 720, 1110))
        gap = image.crop((0, 1600, 720, 2200))
        self.assertEqual(capture.compare_scroll_frames(first, second).direction, "down")
        self.assertEqual(capture.compare_scroll_frames(first, second).shift, 260)
        self.assertEqual(capture.compare_scroll_frames(second, third).shift, 250)
        self.assertEqual(capture.compare_scroll_frames(first, gap).direction, "gap")
        self.assertEqual(capture.compare_scroll_frames(second, first).direction, "up")
        with tempfile.TemporaryDirectory() as folder:
            paths = []
            for index, frame in enumerate((first, second, third), 1):
                path = Path(folder)/f"{index}.png"
                frame.save(path)
                paths.append(path)
            mosaic, joins = capture.inspect_page_images(paths)
            self.assertEqual(mosaic.size, (720, 1110))
            self.assertEqual([j["direction"] for j in joins], ["down", "down"])
            gap_path = Path(folder)/"gap.png"
            gap.save(gap_path)
            unsafe, joins = capture.inspect_page_images([paths[0], gap_path])
            self.assertEqual(joins[0]["direction"], "gap")
            self.assertEqual(unsafe.height, first.height + gap.height + 32)


if __name__ == "__main__":
    unittest.main()
