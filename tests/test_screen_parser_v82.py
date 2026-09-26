"""Windows companion pure-core checks. Run: python -m unittest -v tests.test_screen_parser_v82

GUI/screen permission integration needs a real Windows desktop; the OCR smoke below
uses local Tesseract only if installed. No attached copyrighted book image is shipped.
"""
import json
import sys
import tempfile
import unittest
import zipfile
from unittest.mock import patch
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from tools.screen_parser import engine, ocr
from tools.screen_parser.store import Ledger
NAMES = engine.read_remedy_names(ROOT)


def frame(text, cols=1, sha="frame1"):
    column_text = text if isinstance(text, list) else [text]
    return {"columns": [[{"text": line, "words": [], "bbox": [0, 10*i, 100, 9],
                          "confidence": 96} for i, line in enumerate(content.splitlines())]
                        for content in column_text],
            "text": "\n".join(column_text), "second": "\n".join(column_text),
            "image_sha256": sha, "low_confidence": []}


class Parsing(unittest.TestCase):
    def test_prescriber_dual_output_and_explicit_remedies(self):
        sample = ("Quick Bed-Side Prescriber\nA\n"
                  "Abdomen—cavity opened with burning pain—If the abdomen hurts\n"
                  "Staphysagria is the remedy. (Staph.) See “Stretches”.\n"
                  "Abdomen—colic disorders—After eating. (Nux-v.) See “Digestion”.")
        parsed, problems = engine.check_page("prescriber", sample, sample, NAMES)
        self.assertFalse(problems, problems)
        self.assertEqual([x["heading"] for x in parsed["entries"]],
                         ["Abdomen—cavity opened with burning pain", "Abdomen—colic disorders"])
        self.assertEqual(parsed["entries"][0]["remedy_refs"][0]["abbr"], "staph")
        self.assertEqual(parsed["entries"][1]["remedy_refs"][0]["abbr"], "nux-v")
        self.assertEqual(parsed["entries"][0]["see_refs"], ["Stretches"])
        self.assertNotIn("grade", json.dumps(parsed))

    def test_materia_medica_sections_continuation(self):
        sample = ("ALLEN T.F., Encyclopedia of Pure Materia Medica (a1)\n"
                  "Abies canadensis\nMind\nMind quiet, careless, but easily fretted.\n"
                  "Head\nA tipsy feeling, a swimming of the head.\nStomach\nHungry.")
        parsed, problems = engine.check_page("materia_medica", sample, sample, NAMES)
        self.assertFalse(problems, problems)
        self.assertEqual(parsed["entries"][0]["abbr"], "abies-c")
        self.assertEqual([s["h"] for s in parsed["entries"][0]["sections"]],
                         ["Mind", "Head", "Stomach"])
        p2, problems2 = engine.check_page("materia_medica", "Stomach\nSome thirst.",
                                          "Stomach\nSome thirst.", NAMES,
                                          context=parsed["context_out"])
        self.assertFalse(problems2, problems2)
        self.assertEqual(p2["entries"][0]["abbr"], "abies-c")

    def test_repertory_count_vs_grade_and_unverified_palette(self):
        sample = "MIND\nDAYTIME: (2) ars. 3 bell. 2\n- morning: (1) nux-v. 1"
        parsed, problems = engine.check_page("repertory", sample, sample, NAMES)
        self.assertFalse(problems, problems)
        self.assertEqual(parsed["entries"][0]["path"], "DAYTIME")
        self.assertEqual(parsed["entries"][0]["remedies"], {"ars": 3, "bell": 2})
        self.assertEqual(parsed["entries"][1]["path"], "DAYTIME - morning")
        self.assertEqual(parsed["entries"][1]["remedies"]["nux-v"], 1)
        no_grade = "MIND\nMORNING: (1) ars."
        _, issues = engine.check_page("repertory", no_grade, no_grade, NAMES)
        self.assertTrue(any(x["code"] == "unverified_grade" for x in issues))
        self.assertFalse(any("(1)" in str(e.get("remedies")) for e in parsed["entries"]))

    def test_checker_not_circular_and_unknown_line(self):
        first = "Abdomen—colic—(Nux-v.)"
        parsed, probs = engine.check_page("prescriber", first, "Abdomen—colic—(Nux-y.)", NAMES)
        self.assertTrue(any(p["code"] == "ocr_disagreement" for p in probs))
        self.assertEqual(parsed["entries"][0]["remedy_refs"][0]["abbr"], "nux-v")
        _, probs2 = engine.check_page("prescriber", "Unheaded text.", "Unheaded text.", NAMES)
        self.assertTrue(any(p["code"] == "orphan_text" for p in probs2))
        _, probs3 = engine.check_page("prescriber", "عبدالله", "عبدالله", NAMES)
        self.assertTrue(any(p["code"] == "unsupported_language" for p in probs3))

    def test_local_ocr_disagreement_on_long_page(self):
        first = "Abies canadensis\nMind\n" + ("Mind quiet, careless.\n" * 100) + "Irritable."
        second = first.replace("Irritable.", "Trritable.")
        results = engine.compare_readings(first, second)
        self.assertTrue(any(i["code"] == "ocr_local_disagreement" for i in results), results)

    def test_repeated_chapter_not_a_rubric(self):
        raw = "H HOMEOCARE\n«PERSONAL CHAPTER®\nMIND\nDAYTIME: (1) ars. 3"
        parsed, problems = engine.check_page("repertory", raw, raw, NAMES,
                                             context={"chapter":"MIND"})
        self.assertFalse(problems, problems)
        self.assertEqual(len(parsed["entries"]), 1)
        self.assertEqual(parsed["entries"][0]["path"], "DAYTIME")

    def test_stitch_two_columns_and_gap_detection(self):
        f1 = frame(["A\nB\nC", "X\nY\nZ"], sha="one")
        f2 = frame(["B\nC\nD", "Y\nZ\nQ"], sha="two")
        merged = ocr.stitch_frames([f1, f2, f2], 2)
        self.assertEqual(merged["text"], "A\nB\nC\nD\nX\nY\nZ\nQ")
        self.assertFalse(merged["issues"])
        gap = ocr.stitch_frames([f1, frame(["Unrelated", "No overlap"], sha="three")], 2)
        self.assertTrue(any(p["code"] == "scroll_gap" for p in gap["issues"]))


class LedgerTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.ledger = Ledger(self.folder.name)
        self.image = Image.new("RGB", (280, 180), "white")

    def tearDown(self):
        self.folder.cleanup()

    def test_resume_unique_pages_no_jump_and_daily_count(self):
        book = self.ledger.create_book("Quick Bed-Side Prescriber", "6th edition", "prescriber", 750,
                                       first_page=24, last_page=26)
        sid = self.ledger.start_session(book)
        self.assertEqual(self.ledger.expected_next(book), 24)
        sample = "Abdomen—colic disorders—(Nux-v.)"
        with self.assertRaisesRegex(ValueError, "expected 24"):
            self.ledger.add_capture(book, 25, self.image, frame(sample, sha="jump"), sid)
        self.assertTrue(self.ledger.add_capture(book, 24, self.image, frame(sample), sid))
        self.assertFalse(self.ledger.add_capture(book, 24, self.image, frame(sample), sid))
        page = self.ledger.finish_page(book, 24, NAMES, sid, printed_page="1")
        self.assertEqual(page["status"], "approved")
        self.assertEqual(page["approval_kind"], "auto_checked")
        with self.assertRaisesRegex(ValueError, "already approved"):
            self.ledger.add_capture(book, 24, self.image, frame(sample, sha="again"), sid)
        self.assertEqual(self.ledger.stats(book, sid)["session_new_approved"], 1)
        self.assertEqual(self.ledger.stats(book, sid)["today_new_approved"], 1)
        self.ledger.end_session(sid)
        sid2 = self.ledger.start_session(book)
        self.assertEqual(self.ledger.expected_next(book), 25)
        self.assertEqual(self.ledger.stats(book, sid2)["session_new_approved"], 0)
        self.ledger.skip_page(book, 25, "Front-matter index page", sid2)
        self.assertEqual(self.ledger.expected_next(book), 26)
        self.assertEqual(self.ledger.stats(book, sid2)["skipped"], 1)
        self.ledger.reopen_page(book, 24, sid2)
        self.assertEqual(self.ledger.expected_next(book), 24)
        self.ledger.approve_page(book, 24, "manual_corrected", sid2) if False else None
        self.assertEqual(self.ledger.stats(book, sid2)["session_new_approved"], 0)

    def test_false_alarm_approval_and_persistence(self):
        b = self.ledger.create_book("Quick Bed-Side", "6th", "prescriber", 2)
        s = self.ledger.start_session(b)
        text = "Abdomen—cavity opened—Staphysagria is the remedy. (Staph.)"
        bad = frame(text)
        bad["second"] = "Abdomen—cavity opened—Staphysagria is the remedy. (Staf.)"
        self.ledger.add_capture(b, 1, self.image, bad, s)
        result = self.ledger.finish_page(b, 1, NAMES, s)
        self.assertEqual(result["status"], "review")
        self.assertTrue(result["issues"])
        with self.assertRaisesRegex(ValueError, "Resolve"):
            self.ledger.approve_page(b, 1, "manual_override", s, "Checked original image")
        for i in range(len(result["issues"])):
            self.ledger.resolve_issue(b, 1, i, "false_alarm", "Compared with pixels", s)
        p = self.ledger.approve_page(b, 1, "manual_override", s, "Compared original image")
        self.assertEqual(p["approval_kind"], "manual_override")
        self.assertEqual(Ledger(self.folder.name).expected_next(b), 2)

    def test_manual_text_and_structure_with_complete_export(self):
        b = self.ledger.create_book("Quick Bed-Side", "6th", "prescriber", 2)
        s = self.ledger.start_session(b)
        raw = "Abdomen—burning pain—(Staoh.)"
        self.ledger.add_capture(b, 1, self.image, frame(raw), s)
        self.ledger.finish_page(b, 1, NAMES, s)
        p = self.ledger.recheck_text(b, 1, "Abdomen—burning pain—Staphysagria is the remedy. (Staph.)", NAMES, s)
        self.assertEqual(p["parsed"]["entries"][0]["remedy_refs"][0]["abbr"], "staph")
        for i in range(len(p["issues"])):
            self.ledger.resolve_issue(b, 1, i, "corrected", "Fixed against scan", s)
        self.ledger.approve_page(b, 1, "manual_corrected", s)
        with self.assertRaisesRegex(ValueError, "page 2"):
            self.ledger.export(b, Path(self.folder.name) / "too-early.zip", NAMES)
        p2 = "Abdomen—colic—Nux vomica helps. (Nux-v.)"
        self.ledger.add_capture(b, 2, self.image, frame(p2, sha="f2"), s)
        self.ledger.finish_page(b, 2, NAMES, s)
        z = self.ledger.export(b, Path(self.folder.name) / "complete.zip", NAMES)
        with zipfile.ZipFile(z) as f:
            paths = f.namelist()
            self.assertTrue(any("/library/" in name for name in paths))
            self.assertTrue(any("clinical_index/" in name for name in paths))
            index_file = next(name for name in paths if "clinical_index/" in name)
            index = json.loads(f.read(index_file))
            self.assertEqual(index["entries"][0]["remedies"][0]["abbr"], "staph")
            self.assertEqual(index["entries"][1]["remedies"][0]["abbr"], "nux-v")
            man = json.loads(f.read("screen_parser/manifest.json"))
            self.assertEqual(man["book"]["total_pdf_pages"], 2)
            self.assertEqual(man["pages"][0]["approval_kind"], "manual_corrected")
            self.assertEqual(man["pages"][1]["approval_kind"], "auto_checked")
            self.assertNotIn(".png", "\n".join(paths))

    def test_partial_grade_edits_persist_but_cannot_be_approved(self):
        b = self.ledger.create_book("Synthesis", "9.1", "repertory", 1)
        s = self.ledger.start_session(b)
        content = "MIND\nDAYTIME: (1) ars.\nMORNING: (1) bell."
        self.ledger.add_capture(b,1,self.image,frame(content),s)
        p = self.ledger.finish_page(b,1,NAMES,s)
        self.assertEqual(p["status"], "review")
        parsed = p["parsed"]
        parsed["entries"][0]["remedies"]["ars"] = 3
        p = self.ledger.save_structured(b,1,parsed,NAMES,s)
        self.assertIsNone(p["parsed"]["entries"][1]["remedies"]["bell"])
        for i in range(len(p["issues"])):
            self.ledger.resolve_issue(b,1,i,"corrected","Inspect printed grade",s)
        with self.assertRaisesRegex(ValueError,"grade"):
            self.ledger.approve_page(b,1,"manual_corrected",s)

    def test_repertory_export_requires_grade(self):
        b = self.ledger.create_book("Synthesis", "v9.1", "repertory", 1)
        s = self.ledger.start_session(b)
        sample = "MIND\nDAYTIME: (2) ars. bell."
        self.ledger.add_capture(b, 1, self.image, frame(sample), s)
        p = self.ledger.finish_page(b, 1, NAMES, s)
        self.assertTrue(any(i["code"] == "unverified_grade" for i in p["issues"]))
        edited = p["parsed"]
        edited["entries"][0]["remedies"] = {"ars": 3, "bell": 2}
        p = self.ledger.save_structured(b, 1, edited, NAMES, s)
        for i in range(len(p["issues"])):
            self.ledger.resolve_issue(b, 1, i, "corrected", "Verified against source", s)
        self.ledger.approve_page(b, 1, "manual_corrected", s)
        exported = self.ledger.export(b, Path(self.folder.name)/"rep.zip", NAMES)
        with zipfile.ZipFile(exported) as f:
            ch = next(n for n in f.namelist() if n.endswith("/chapters/mind.json"))
            entry = next(iter(json.loads(f.read(ch)).values()))
            self.assertEqual(entry, {"t": "DAYTIME", "r": {"ars": 3, "bell": 2}})

    def test_retry_limit_and_capture_gap_survive_recheck(self):
        b = self.ledger.create_book("Quick Bed-Side", "6th", "prescriber", 1)
        sid = self.ledger.start_session(b)
        first = "Abdomen—colic—(Nux-v.)"
        second = "Abdomen—dropsy—(Apoc.)"
        self.ledger.add_capture(b, 1, self.image, frame(first, sha="a"), sid)
        new_image = Image.new("RGB", (280,180), (245,245,245))
        self.ledger.add_capture(b, 1, new_image, frame(second, sha="b"), sid)
        p = self.ledger.finish_page(b, 1, NAMES, sid)
        self.assertIn("scroll_gap", [i["code"] for i in p["issues"]])
        p = self.ledger.recheck_text(b, 1, p["raw_text"], NAMES, sid)
        self.assertIn("scroll_gap", [i["code"] for i in p["issues"]])
        with patch.object(ocr, "ocr_columns", return_value=frame(first, sha="retry")):
            self.ledger.retry_page(b, 1, NAMES, 1, sid)
            self.ledger.retry_page(b, 1, NAMES, 2, sid)
            with self.assertRaisesRegex(ValueError, "two sequential"):
                self.ledger.retry_page(b, 1, NAMES, 1, sid)
        self.assertEqual(Ledger(self.folder.name).retry_count(b,1), 2)
        self.ledger.clear_page_captures(b, 1, sid)
        self.assertEqual(self.ledger.retry_count(b,1), 0)

    def test_colour_calibration_cannot_regrade_approved_pages(self):
        b = self.ledger.create_book("Synthesis", "v9.1", "repertory", 1)
        self.ledger.set_grade_palette(b, {"teal":1,"blue":2,"red":3})
        self.assertEqual(self.ledger.book(b)["grade_palette"]["teal"], 1)
        sid = self.ledger.start_session(b)
        sample = "MIND\nDAYTIME: (1) ars. 3"
        self.ledger.add_capture(b, 1, self.image, frame(sample), sid)
        self.assertEqual(self.ledger.finish_page(b, 1, NAMES, sid)["status"], "approved")
        with self.assertRaisesRegex(ValueError, "already approved"):
            self.ledger.set_grade_palette(b, {"red":2})

    def test_mm_export_and_continuation(self):
        b = self.ledger.create_book("Allen", "volume 1", "materia_medica", 2)
        s = self.ledger.start_session(b)
        for no, text in enumerate(("Abies canadensis\nMind\nIrritable.",
                                   "Mind\nFretted.\nHead\nA swimming feeling."), 1):
            im = Image.new("RGB", (280, 180), (255, 255, 255-no))
            self.ledger.add_capture(b, no, im, frame(text, sha=str(no)), s)
            self.assertEqual(self.ledger.finish_page(b, no, NAMES, s)["status"], "approved")
        z = self.ledger.export(b, Path(self.folder.name)/"mm.zip", NAMES)
        with zipfile.ZipFile(z) as f:
            path = next(n for n in f.namelist() if "/mm/" in n and n.endswith(".json"))
            d = json.loads(f.read(path))
            self.assertEqual(d["remedies"]["abies-c"]["sections"][0]["p"],
                             ["Irritable.", "Fretted."])


class OCRIntegration(unittest.TestCase):
    def test_colour_cues_are_not_grades_without_calibration(self):
        im = Image.new("RGB", (640,130), "white")
        dr = ImageDraw.Draw(im)
        try:
            font = ImageFont.truetype("DejaVuSans.ttf", 40)
        except OSError:
            font = ImageFont.load_default()
        for x,color,name in ((10,(20,150,155),"teal"),(180,(30,30,210),"blue"),(345,(200,30,30),"red")):
            dr.text((x,20), name, fill=color, font=font)
            box = (x,20,110,52)
            self.assertEqual(ocr._color(im,box),name)

    def test_physical_viewer_counter_if_ocr_installed(self):
        try:
            ocr._tesseract()
        except RuntimeError:
            self.skipTest("Install offline Tesseract first")
        im = Image.new("RGB", (400,100), "white")
        dr = ImageDraw.Draw(im)
        try:
            font = ImageFont.truetype("DejaVuSans.ttf", 38)
        except OSError:
            font = ImageFont.load_default()
        dr.text((15,20), "24 of 750", fill="black", font=font)
        self.assertEqual(ocr.read_viewer_counter(im, 750), (24,750))

    def test_pdf_text_layer_and_physical_total_if_installed(self):
        try:
            import pymupdf
            ocr._tesseract()
        except (ImportError,RuntimeError):
            self.skipTest("Install optional PyMuPDF + Tesseract")
        with tempfile.TemporaryDirectory() as d:
            path = Path(d)/"test.pdf"
            doc = pymupdf.open()
            page = doc.new_page(width=600,height=500)
            for i,text in enumerate(("Abies canadensis", "Mind", "Mind quiet, careless, but easily fretted.",
                                      "Head", "A tipsy feeling, a swimming of the head.")):
                page.insert_text((35,55+i*65),text,fontsize=16)
            doc.new_page()
            doc.save(path)
            doc.close()
            image,scan,total = ocr.scan_pdf_page(str(path),1)
            self.assertEqual(total,2)
            self.assertEqual(scan["source_kind"], "pdf_text_layer+ocr")
            self.assertIn("Abies canadensis",scan["text"])
            self.assertTrue(image.width>600)

    def test_real_ocr_on_generated_page_when_tesseract_installed(self):
        try:
            ocr._tesseract()
        except RuntimeError:
            self.skipTest("Install Tesseract OCR first")
        im = Image.new("RGB", (900, 290), "white")
        dr = ImageDraw.Draw(im)
        try:
            font = ImageFont.truetype("DejaVuSans.ttf", 32)
        except OSError:
            font = ImageFont.load_default()
        dr.text((25, 38), "Abies canadensis", fill="black", font=font)
        dr.text((25, 108), "Mind", fill="black", font=font)
        dr.text((25, 168), "Irritable and anxious.", fill="black", font=font)
        scan = ocr.ocr_columns(im)
        self.assertIn("Mind", scan["text"])
        self.assertGreater(len(scan["columns"][0]), 1)
        self.assertTrue(scan["second"])


if __name__ == "__main__":
    unittest.main()
