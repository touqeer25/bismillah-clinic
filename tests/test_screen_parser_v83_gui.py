"""Real virtual-desktop MSS scroll smoke. Run under xvfb-run on Linux.

This does NOT certify a Windows protected/app window; it verifies that a
selected stationary region records multiple REAL rendered screen positions,
not just the last one. OCR is mocked here; separate tests exercise Tesseract.
"""
import os
import sys
import tempfile
import time
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
try:
    import mss  # noqa: F401
except ImportError:
    mss = None


@unittest.skipUnless(os.getenv("DISPLAY") and mss, "Needs Xvfb and mss")
class CaptureDesktop(unittest.TestCase):
    def test_hidden_main_persistent_outline_raw_frames_preview_and_resume(self):
        import tkinter as tk
        from tools.screen_parser import ocr
        from tools.screen_parser.app import StudioApp, RegionPicker
        with tempfile.TemporaryDirectory() as directory:
            source = tk.Tk()
            source.title("Generated visible English book page")
            source.geometry("1040x800+280+65")
            text = tk.Text(source, font=("DejaVu Sans", 15), bg="white", fg="black", wrap="none")
            text.place(x=22, y=35, width=875, height=545)
            for number in range(85):
                text.insert("end", f"Abdomen—condition {number:03d}—Line {number*19+7} on one long page.\n")
            source.update()
            app = StudioApp(Path(directory))
            book = app.ledger.create_book("Generated source", page_mode="sequence",
                                          profile="prescriber", range_confirmed=False)
            app.select_book(book)
            box = (text.winfo_rootx()+6, text.winfo_rooty()+6, 855, 515)
            self.assertGreater(box[0], 0)
            self.assertLess(box[0]+box[2], source.winfo_rootx()+source.winfo_width())
            # Simulate the exact region picker, not just a preconfigured rectangle.
            app.select_region()
            picker = next(x for x in app.root.winfo_children() if isinstance(x, RegionPicker))
            picker.press(SimpleNamespace(x_root=box[0], y_root=box[1]))
            picker.release(SimpleNamespace(x_root=box[0]+box[2], y_root=box[1]+box[3]))
            deadline = time.monotonic()+3
            while (app.strip is None or not app.strip.winfo_viewable()) and time.monotonic()<deadline:
                app.root.update()
                source.update()
                time.sleep(.02)
            self.assertFalse(app.root.winfo_viewable(), "Main should hide after selecting area")
            self.assertTrue(app.strip.winfo_viewable(), "Floating controls should remain")
            self.assertLessEqual(app.strip.winfo_width(), 370, "Toolbox must fit beside a book page")
            self.assertFalse(app._rect_intersects_toolbar(), "Toolbox must not cover selected pixels")
            self.assertTrue(app.outline.windows, "Persistent ROI border should remain")

            def fast_scan(image, columns=1, **_ignored):
                self.assertEqual(columns, 1)
                self.assertGreater(image.width, 800)
                return {"columns": [[{"text": "Abdomen—colic—(Nux-v.)",
                                     "words": [], "bbox": [5, 5, 300, 24],
                                     "confidence": 95}]],
                        "text": "Abdomen—colic—(Nux-v.)", "second": "Abdomen—colic—(Nux-v.)",
                        "alt_columns": ["Abdomen—colic—(Nux-v.)"],
                        "image_sha256": str(image.getpixel((0, 0))),
                        "low_confidence": [{"text": "Synthetic review alert"}]}

            try:
                with patch.object(ocr, "ocr_columns", side_effect=fast_scan), \
                     patch("tkinter.messagebox.askyesno", return_value=True):
                    app.toggle_watch()
                    deadline = time.monotonic()+5
                    while len(app.ledger.captures(book, 1)) < 1 and time.monotonic()<deadline:
                        app.root.update()
                        source.update()
                        time.sleep(.025)
                    self.assertGreaterEqual(len(app.ledger.captures(book, 1)), 1,
                                            "Start should immediately save first RAW pixels")
                    text.yview_scroll(6, "units")
                    source.update()
                    deadline = time.monotonic()+6
                    while len(app.ledger.captures(book, 1)) < 2 and time.monotonic()<deadline:
                        app.root.update()
                        source.update()
                        time.sleep(.025)
                    app.stop_watch()
                    records = app.ledger.captures(book, 1)
                    self.assertGreaterEqual(len(records), 2,
                                            "Watch must persist more than the last visible frame")
                    self.assertNotEqual(records[0]["sha256"], records[1]["sha256"])
                    self.assertTrue(all(r["image"].is_file() for r in records))
                    deadline = time.monotonic()+5
                    while app.pending and time.monotonic()<deadline:
                        app.root.update()
                        source.update()
                        time.sleep(.025)
                    self.assertFalse(app.pending, "OCR worker should finish without losing raw frames")
                    with patch("tkinter.messagebox.showerror",
                               side_effect=lambda _title, message: self.fail(message)):
                        app.open_capture_preview()
                    self.assertTrue(app.preview and app.preview.winfo_exists())
                    self.assertEqual(app.preview.page_no, 1)
                    app.preview.close()
                    self.assertTrue(app.outline.windows[0].winfo_viewable())
                    self.assertEqual(app.ledger.page(book, 1)["status"], "draft")
                    self.assertEqual(app.ledger.stats(book)["approved"], 0)
                    with patch("tkinter.messagebox.showerror",
                               side_effect=lambda _title, message: self.fail(message)):
                        app.finish_page()
                        self.assertTrue(app.preview and app.preview.winfo_exists())
                        app.preview.top_ok.set(True)
                        app.preview.bottom_ok.set(True)
                        app.preview.confirm()
                    self.assertEqual(app.ledger.page(book, 1)["status"], "review")
                    self.assertTrue(app.review and app.review.winfo_exists())
                    self.assertIn("Review Capture #1 · physical page unknown", app.review.title())
                    self.assertEqual(app.ledger.stats(book)["approved"], 0)
                    app.review.close()
            finally:
                if app.preview and app.preview.winfo_exists():
                    app.preview.close()
                app.stop_watch()
                # Close must be called after pending jobs finish.
                deadline = time.monotonic()+8
                while app.pending and time.monotonic()<deadline:
                    app.root.update()
                    time.sleep(.03)
                app.close()
                source.destroy()


@unittest.skipUnless(os.getenv("DISPLAY"), "Needs a graphical display")
class QuickSetupDesktop(unittest.TestCase):
    def test_title_and_profile_only_allow_unknown_fields_without_pdf_label(self):
        from tools.screen_parser.app import StudioApp, BookDialog
        with tempfile.TemporaryDirectory() as directory:
            app = StudioApp(Path(directory))
            try:
                dialog = BookDialog(app.root)
                dialog.vars["title"].set("Other app with unnumbered pages")
                with patch("tkinter.messagebox.showerror") as error:
                    dialog.save()
                self.assertIsNone(dialog.result, "Profile is mandatory, never silently Prescriber")
                self.assertIn("layout profile", error.call_args.args[1])
                dialog.vars["profile"].set("materia_medica")
                dialog.save()
                self.assertIsNotNone(dialog.result)
                r = dialog.result
                self.assertEqual(r["page_mode"], "sequence")
                self.assertEqual(r["edition"], "")
                self.assertEqual([r[x] for x in ("total_pages", "first_page", "last_page")],
                                 [None]*3)
                self.assertFalse(r["range_confirmed"])
                b = app.ledger.create_book(r["title"], profile=r["profile"],
                                           page_mode="sequence", range_confirmed=False)
                app.select_book(b)
                self.assertEqual(app.page_no, 1)
                self.assertEqual(app.page_label(1), "Capture #1 · physical page unknown")
            finally:
                app.close()

    def test_restart_recovers_saved_raw_pixels_without_second_grab(self):
        from PIL import Image
        from tools.screen_parser import ocr
        from tools.screen_parser.app import StudioApp
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            app = StudioApp(root)
            book = app.ledger.create_book("Interrupted source", profile="prescriber",
                                          page_mode="sequence", range_confirmed=False)
            app.select_book(book)
            original = Image.new("RGB", (420, 240), "white")
            seq = app.ledger.stage_capture(book, 1, original, app.session_id)
            self.assertEqual(seq, 1)
            self.assertEqual(app.ledger.unready_captures(book, 1)[0]["seq"], 1)
            app.close()
            answer = {"columns": [[{"text": "Abdomen—colic—(Nux-v.)", "bbox": [0, 0, 250, 25],
                                    "confidence": 99, "words": []}]],
                      "text": "Abdomen—colic—(Nux-v.)", "second": "Abdomen—colic—(Nux-v.)",
                      "low_confidence": [], "alt_columns": ["Abdomen—colic—(Nux-v.)"]}
            with patch.object(ocr, "ocr_columns", return_value=answer):
                resumed = StudioApp(root)
                try:
                    if resumed.book_id != book:  # last source auto-opens AND auto-resumes
                        resumed.select_book(book)
                    deadline = time.monotonic()+8
                    while resumed.pending and time.monotonic()<deadline:
                        resumed.root.update()
                        time.sleep(.03)
                    self.assertFalse(resumed.pending)
                    self.assertFalse(resumed.ledger.unready_captures(book, 1))
                    self.assertEqual(len(resumed.ledger.captures(book, 1)), 1)
                    self.assertEqual(resumed.ledger.page(book, 1)["status"], "draft")
                    self.assertEqual(resumed.ledger.stats(book)["approved"], 0)
                finally:
                    resumed.close()


@unittest.skipUnless(os.getenv("DISPLAY") and mss, "Needs Xvfb + mss")
class OriginalPdfDesktop(unittest.TestCase):
    def test_full_original_pdf_capture_ignores_a_saved_screen_rectangle(self):
        try:
            import pymupdf
            from tools.screen_parser import ocr
            ocr._tesseract()
        except (ImportError, RuntimeError):
            self.skipTest("PyMuPDF + local Tesseract required")
        from tools.screen_parser.app import StudioApp
        with tempfile.TemporaryDirectory() as directory:
            pdf = Path(directory) / "generated.pdf"
            doc = pymupdf.open()
            page = doc.new_page(width=600, height=900)
            for y, line in ((55, "Abies canadensis"), (130, "Mind"),
                            (195, "Irritable."), (795, "Head"),
                            (850, "A floating sensation.")):
                page.insert_text((45, y), line, fontsize=19)
            doc.new_page()
            doc.save(pdf)
            doc.close()
            app = StudioApp(Path(directory) / "ledger")
            book = app.ledger.create_book("Generated Allen PDF", "first volume", "materia_medica",
                total_pages=2, first_page=1, last_page=2, source_path=str(pdf),
                page_mode="physical", range_confirmed=True)
            app.select_book(book)
            app.rect = (10, 10, 180, 140)  # deliberately wrong saved SCREEN area
            try:
                with patch("tkinter.messagebox.showerror",
                           side_effect=lambda _title, message: self.fail(message)):
                    app.import_pdf_page()
                    deadline = time.monotonic()+35
                    while app.pending and time.monotonic()<deadline:
                        app.root.update()
                        time.sleep(.045)
                    self.assertFalse(app.pending, "Original PDF OCR should finish")
                    records = app.ledger.captures(book, 1)
                    self.assertEqual(len(records), 1)
                    from PIL import Image
                    with Image.open(records[0]["image"]) as image:
                        self.assertGreater(image.height, 1600)  # entire PDF page, not ROI=140
                    self.assertIn("Abies canadensis", records[0]["scan"]["text"])
                    self.assertIn("Head", records[0]["scan"]["text"])
                    self.assertEqual(app.ledger.page(book, 1)["capture_origin"], "pdf")
                    app.finish_page()
                    self.assertTrue(app.preview and app.preview.winfo_exists())
                    self.assertEqual(app.preview.top_ok.get(), True)
                    self.assertEqual(app.preview.bottom_ok.get(), True)
                    app.preview.confirm()
                    self.assertIn(app.ledger.page(book, 1)["status"], ("approved", "review"))
            finally:
                if app.review and app.review.winfo_exists():
                    app.review.close()
                if app.preview and app.preview.winfo_exists():
                    app.preview.close()
                app.close()


if __name__ == "__main__":
    unittest.main()
