"""Windows-first Tk GUI: unobtrusive capture bar + full-screen *frozen* review.

Nothing is captured until the user selects a region and starts Watch/Capture.
OCR takes place in a worker; only the selected rectangle (not the whole desktop)
is retained. If counter detection isn't possible, Finish page is a deliberate
page-boundary button; the page ledger still prevents skips/double counting.
"""
from __future__ import annotations

import json
import queue
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog, ttk
from PIL import Image, ImageChops, ImageStat, ImageTk, ImageOps

from . import engine, ocr
from .store import Ledger


class RegionPicker(tk.Toplevel):
    def __init__(self, master, callback, label="Select ONE physical page's text region"):
        super().__init__(master)
        self.callback = callback
        self.start = None
        self.attributes("-topmost", True)
        self.attributes("-fullscreen", True)
        self.attributes("-alpha", .29)
        self.configure(bg="#135a62", cursor="crosshair")
        self.canvas = tk.Canvas(self, highlightthickness=0, bg="#135a62", cursor="crosshair")
        self.canvas.pack(fill="both", expand=True)
        self.canvas.create_text(30, 35, anchor="w", text=label + "   •   Esc = cancel",
                                fill="white", font=("Segoe UI", 19, "bold"))
        self.canvas.bind("<ButtonPress-1>", self.press)
        self.canvas.bind("<B1-Motion>", self.move)
        self.canvas.bind("<ButtonRelease-1>", self.release)
        self.bind("<Escape>", lambda _e: self.destroy())
        self.grab_set()
        self.focus_force()

    def press(self, event):
        self.start = (event.x_root, event.y_root)

    def move(self, event):
        if not self.start:
            return
        self.canvas.delete("rect")
        x, y = self.start
        self.canvas.create_rectangle(x-self.winfo_rootx(), y-self.winfo_rooty(), event.x, event.y,
                                     outline="#fff024", width=4, tags="rect")

    def release(self, event):
        if not self.start:
            return
        x1, y1 = self.start
        x2, y2 = event.x_root, event.y_root
        rect = (min(x1, x2), min(y1, y2), abs(x2-x1), abs(y2-y1))
        self.destroy()
        if rect[2] >= 65 and rect[3] >= 35:
            self.master.after(150, lambda: self.callback(rect))


class CropImage(tk.Toplevel):
    """Choose a single physical page/body area from a screenshot file."""
    def __init__(self, master, image: Image.Image):
        super().__init__(master)
        self.title("Crop to ONE physical page — headers/viewer UI excluded")
        self.image = ImageOps.exif_transpose(image).convert("RGB")
        display = self.image.copy()
        display.thumbnail((min(master.winfo_screenwidth()-100, 1300),
                           min(master.winfo_screenheight()-170, 880)))
        self.display = display
        self.ratio_x = self.image.width / display.width
        self.ratio_y = self.image.height / display.height
        self.photo = ImageTk.PhotoImage(display)
        ttk.Label(self, text="Drag ONE printed page / book body. Press Use selection; Esc cancels.").pack(pady=5)
        self.canvas = tk.Canvas(self, width=display.width, height=display.height, cursor="crosshair")
        self.canvas.pack(padx=10)
        self.canvas.create_image(0, 0, anchor="nw", image=self.photo)
        ttk.Button(self, text="Use selection", command=self.finish).pack(pady=6)
        self.bind("<Escape>", lambda _e: self.destroy())
        self.start = None
        self.end = None
        self.result = None
        self.canvas.bind("<ButtonPress-1>", lambda e: setattr(self, 'start', (e.x, e.y)))
        self.canvas.bind("<B1-Motion>", self._drag)
        self.canvas.bind("<ButtonRelease-1>", self._drag)
        self.transient(master)
        self.grab_set()
        self.focus_force()

    def _drag(self, e):
        if not self.start:
            return
        self.end = (e.x, e.y)
        self.canvas.delete("selection")
        self.canvas.create_rectangle(*self.start, *self.end, outline="#ffad00", width=3,
                                     tags="selection")

    def finish(self):
        if not self.start or not self.end:
            messagebox.showinfo("Selection", "Draw a box around ONE physical page first.", parent=self)
            return
        x1, y1 = self.start
        x2, y2 = self.end
        box = (max(0, int(min(x1,x2)*self.ratio_x)), max(0, int(min(y1,y2)*self.ratio_y)),
               min(self.image.width, int(max(x1,x2)*self.ratio_x)),
               min(self.image.height, int(max(y1,y2)*self.ratio_y)))
        if box[2]-box[0] < 90 or box[3]-box[1] < 80:
            messagebox.showerror("Selection", "Crop is too small for OCR.", parent=self)
            return
        self.result = self.image.crop(box)
        self.destroy()


class BookDialog(tk.Toplevel):
    def __init__(self, master):
        super().__init__(master)
        self.title("New English source book / edition")
        self.resizable(False, False)
        self.result = None
        self.vars = {key: tk.StringVar(value=value) for key, value in {
            "title":"", "edition":"", "author":"", "year":"", "profile":"prescriber",
            "total_pages":"", "first_page":"1", "last_page":"", "columns":"1",
            "source_path":"", "red":"unverified", "blue":"unverified", "teal":"unverified", "dark":"unverified"
        }.items()}
        f = ttk.Frame(self, padding=15)
        f.pack(fill="both", expand=True)
        rows = [
            ("Book title", "title"), ("Edition / identifying version", "edition"),
            ("Author (optional)", "author"), ("Year (optional)", "year"),
            ("Total physical PDF pages", "total_pages"), ("First content page (physical)", "first_page"),
            ("Last content page (physical)", "last_page")]
        for i, (label, key) in enumerate(rows):
            ttk.Label(f, text=label).grid(row=i, column=0, sticky="w", padx=5, pady=3)
            ttk.Entry(f, textvariable=self.vars[key], width=43).grid(row=i, column=1, sticky="ew", pady=3)
        i = len(rows)
        ttk.Label(f, text="Book layout profile").grid(row=i, column=0, sticky="w")
        ttk.Combobox(f, textvariable=self.vars["profile"], values=engine.PROFILES,
                     state="readonly", width=40).grid(row=i, column=1, sticky="w")
        i += 1
        ttk.Label(f, text="Body columns per ONE page").grid(row=i, column=0, sticky="w")
        ttk.Combobox(f, textvariable=self.vars["columns"], values=("1", "2"),
                     state="readonly", width=40).grid(row=i, column=1, sticky="w")
        i += 1
        ttk.Label(f, text="Original PDF (optional)").grid(row=i, column=0, sticky="w")
        source = ttk.Frame(f)
        source.grid(row=i, column=1, sticky="ew")
        ttk.Entry(source, textvariable=self.vars["source_path"], width=32,
                  state="readonly").pack(side="left")
        ttk.Button(source, text="Browse…", command=self.browse_pdf).pack(side="left")
        i += 1
        ttk.Label(f, text="Colour grades: ONLY after source legend checked", foreground="#a14a18").grid(
            row=i, column=0, columnspan=2, sticky="w", pady=(12,2))
        i += 1
        palette_row = ttk.Frame(f)
        palette_row.grid(row=i, column=0, columnspan=2, sticky="w")
        for label in ("red", "blue", "teal", "dark"):
            cell = ttk.Frame(palette_row, padding=(5,0))
            cell.pack(side="left")
            ttk.Label(cell, text=label).pack(anchor="w")
            ttk.Combobox(cell, textvariable=self.vars[label],
                         values=("unverified", "1", "2", "3", "4"),
                         state="readonly", width=10).pack()
        i += 1
        ttk.Label(f, text="If colour is unverified, grade entries MUST be checked manually.",
                  foreground="#7d2828").grid(row=i, column=0, columnspan=2, sticky="w")
        i += 1
        buttons = ttk.Frame(f)
        buttons.grid(row=i, column=0, columnspan=2, sticky="e", pady=(16,0))
        ttk.Button(buttons, text="Cancel", command=self.destroy).pack(side="right", padx=4)
        ttk.Button(buttons, text="Create book", command=self.save).pack(side="right", padx=4)
        self.transient(master)
        self.grab_set()
        self.focus_force()

    def browse_pdf(self):
        path = filedialog.askopenfilename(parent=self, title="Original PDF file (optional)",
                                          filetypes=[("PDF", "*.pdf")])
        if not path:
            return
        try:
            import pymupdf
            with pymupdf.open(path) as doc:
                total = doc.page_count
            self.vars["source_path"].set(path)
            self.vars["total_pages"].set(str(total))
            self.vars["last_page"].set(str(total))
        except Exception as exc:
            messagebox.showerror("PDF", "Install PyMuPDF or enter total manually.\n"+str(exc), parent=self)

    def save(self):
        try:
            d = {key: var.get().strip() for key, var in self.vars.items()}
            palette = {key: int(d[key]) for key in ("red","blue","teal","dark") if d[key] != "unverified"}
            self.result = dict(title=d["title"], edition=d["edition"],
                               profile=d["profile"], total_pages=int(d["total_pages"]),
                               first_page=int(d["first_page"]),
                               last_page=int(d["last_page"] or d["total_pages"]),
                               columns=int(d["columns"]), author=d["author"], year=d["year"],
                               source_path=d["source_path"], grade_palette=palette)
            if not d["title"] or not d["edition"]:
                raise ValueError("Title and edition/version are required")
        except (ValueError, KeyError) as exc:
            messagebox.showerror("Book details", str(exc), parent=self)
            return
        self.destroy()


class StudioApp:
    def __init__(self, data_dir: Path | None = None):
        self.ledger = Ledger(data_dir)
        resource_root = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parents[2]))
        self.names = engine.read_remedy_names(resource_root)
        self.root = tk.Tk()
        self.root.title("Bismillah · Windows Screen Parser · English OCR")
        self.root.geometry("510x275+25+95")
        self.root.attributes("-topmost", True)
        self.root.resizable(False, False)
        self.root.protocol("WM_DELETE_WINDOW", self.close)
        self.executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="EnglishOCR")
        self.results = queue.Queue()
        self.closing = False
        self.book_id = None
        self.session_id = None
        self.page_no = None
        self.running = False
        self.pending = 0
        self.finish_requested = False
        self.resume_watch = False
        self.held_next = None
        self.last_sample = None
        self.last_captured = None
        self.stable_ticks = 0
        self.last_capture_at = 0.
        self.backlog_gap = False
        self.review = None
        self.prefs_path = self.ledger.directory / "ui_prefs.json"
        try:
            self.prefs = json.loads(self.prefs_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            self.prefs = {}
        self.rect = None
        self.counter_rect = None
        self.current_books = []
        self._make_toolbar()
        self._list_books()
        saved = self.prefs.get("last_book")
        if saved in [b["id"] for b in self.current_books]:
            self.select_book(saved)
        self.root.after(160, self._poll)

    def _make_toolbar(self):
        f = ttk.Frame(self.root, padding=9)
        f.pack(fill="both", expand=True)
        first = ttk.Frame(f)
        first.pack(fill="x")
        ttk.Label(first, text="English source:").pack(side="left")
        self.book_choice = ttk.Combobox(first, state="readonly", width=35)
        self.book_choice.pack(side="left", padx=4)
        self.book_choice.bind("<<ComboboxSelected>>", self._choose_book)
        ttk.Button(first, text="＋", width=3, command=self.new_book).pack(side="right")
        self.stats_var = tk.StringVar(value="Create a book to start. No network or cloud OCR.")
        ttk.Label(f, textvariable=self.stats_var, wraplength=490,
                  font=("Segoe UI", 10, "bold")).pack(anchor="w", pady=(10,4))
        self.status_var = tk.StringVar(value="Select a page region; keep this bar outside the selected rectangle.")
        ttk.Label(f, textvariable=self.status_var, foreground="#426475", wraplength=490).pack(anchor="w")
        row = ttk.Frame(f)
        row.pack(fill="x", pady=(8,2))
        ttk.Button(row, text="① Select text area", command=self.select_region).pack(side="left", padx=2)
        ttk.Button(row, text="Counter ROI (optional)", command=self.select_counter).pack(side="left", padx=2)
        ttk.Button(row, text="▶ Watch scroll", command=self.toggle_watch).pack(side="left", padx=2)
        row2 = ttk.Frame(f)
        row2.pack(fill="x", pady=2)
        ttk.Button(row2, text="📸 Grab", command=self.capture_once).pack(side="left", padx=2)
        ttk.Button(row2, text="✔ Check page", command=self.finish_page).pack(side="left", padx=2)
        ttk.Button(row2, text="⚠ Review", command=self.open_review).pack(side="left", padx=2)
        ttk.Button(row2, text="…", width=3, command=self.more_menu).pack(side="left", padx=2)
        ttk.Button(row2, text="⬇ Export", command=self.export_book).pack(side="right", padx=2)
        ttk.Label(f, text="Manual scroll · one physical page per check · visible selected pixels only",
                  foreground="#666").pack(anchor="w", pady=8)

    def _prefs_save(self):
        tmp = self.prefs_path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.prefs, indent=2), encoding="utf-8")
        tmp.replace(self.prefs_path)

    def _list_books(self):
        self.current_books = self.ledger.books()
        self.book_choice["values"] = [f"{b['title']} [{b['edition']}]" for b in self.current_books]

    def _choose_book(self, _evt):
        i = self.book_choice.current()
        if 0 <= i < len(self.current_books):
            self.select_book(self.current_books[i]["id"])

    def select_book(self, book_id):
        if self.pending:
            messagebox.showwarning("OCR busy", "Wait for the current capture to finish before switching books.")
            return
        self.running = False
        if self.session_id:
            self.ledger.end_session(self.session_id)
        self.book_id = book_id
        self.session_id = self.ledger.start_session(book_id)
        self.page_no = self.ledger.expected_next(book_id)
        self.rect = tuple(self.prefs.get(book_id + "_rect", [])) or None
        self.counter_rect = tuple(self.prefs.get(book_id + "_counter", [])) or None
        self.prefs["last_book"] = book_id
        self._prefs_save()
        self._list_books()
        self.book_choice.current(next(i for i,b in enumerate(self.current_books) if b["id"]==book_id))
        self._reset_watch()
        self._progress()
        try:
            self.ledger.check_source(book_id)
        except (ValueError, FileNotFoundError) as exc:
            messagebox.showwarning("Different source", str(exc))

    def new_book(self):
        if self.pending:
            messagebox.showwarning("OCR busy", "Wait for capture to complete.")
            return
        d = BookDialog(self.root)
        self.root.wait_window(d)
        if d.result:
            try:
                b = self.ledger.create_book(**d.result)
                self.select_book(b)
                self.status_var.set("Book registered. Pick ONE physical page/body region; original PDF is optional.")
            except Exception as exc:
                messagebox.showerror("New book", str(exc))

    def _progress(self):
        if not self.book_id:
            return
        b = self.ledger.book(self.book_id)
        st = self.ledger.stats(self.book_id, self.session_id)
        self.page_no = st["expected_next"]
        next_label = str(self.page_no) if self.page_no is not None else "Complete ✓"
        self.stats_var.set(f"{b['title'][:24]} · PDF {st['total_pdf_pages']} · "
                           f"Approved {st['approved']} · Next {next_label} · Pending {st['pending_review']}\n"
                           f"Today checked {st['today_checked_unique']} / approved {st['today_new_approved']} "
                           f"· Session checked {st['session_checked_unique']} / approved {st['session_new_approved']}")
        self.root.title(f"Bismillah Screen Parser · {b['title']} · page {next_label}")

    def _save_region(self, region, counter=False):
        if not self.book_id:
            return
        if counter:
            self.counter_rect = region
            self.prefs[self.book_id + "_counter"] = list(region)
            self.status_var.set("Viewer page counter selected. Use ONLY if it labels the chosen single page.")
        else:
            self.rect = region
            self.prefs[self.book_id + "_rect"] = list(region)
            self.status_var.set(f"Body rectangle {region}. Move this toolbar OUTSIDE it before Watch.")
        self._prefs_save()

    def select_region(self):
        if not self.book_id:
            messagebox.showinfo("Book", "Create/select a book first.")
            return
        self.running = False
        RegionPicker(self.root, lambda r: self._save_region(r), "Drag ONE physical page's TEXT; no WhatsApp/browser UI")

    def select_counter(self):
        if not self.book_id:
            return
        if self.counter_rect and messagebox.askyesno("Counter", "Turn OFF the viewer counter? (No = pick a new ROI)"):
            self.counter_rect = None
            self.prefs.pop(self.book_id + "_counter", None)
            self._prefs_save()
            self.status_var.set("Counter OFF; use Check page at the end of each physical page.")
            return
        RegionPicker(self.root, lambda r: self._save_region(r, True),
                     "Drag the VIEWER's 24 of 750 counter (NOT the printed page number)")

    def _reset_watch(self):
        self.last_sample = None
        self.last_captured = None
        self.stable_ticks = 0
        self.last_capture_at = 0.
        self.backlog_gap = False

    def _rect_intersects_toolbar(self):
        if not self.rect:
            return False
        self.root.update_idletasks()
        a = (self.root.winfo_rootx(), self.root.winfo_rooty(), self.root.winfo_width(), self.root.winfo_height())
        x,y,w,h = self.rect
        return x < a[0]+a[2] and x+w > a[0] and y < a[1]+a[3] and y+h > a[1]

    def toggle_watch(self):
        if self.running:
            self.running = False
            self.status_var.set("Watching paused. Finish/check this physical page before continuing.")
            return
        if not self._ready() or not self.rect:
            messagebox.showwarning("Selection", "Select book and text rectangle first.")
            return
        if self._rect_intersects_toolbar():
            messagebox.showwarning("Toolbar covers text", "Move this small window OUTSIDE the selected text region.")
            return
        self.running = True
        self._reset_watch()
        self.status_var.set(f"Watching visible page {self.page_no}. Scroll slowly; stop briefly between movements.")
        self.root.after(150, self._watch_tick)

    def _ready(self):
        if not self.book_id or self.page_no is None:
            self.status_var.set("Select a book with an unfinished physical page first.")
            return False
        p = self.ledger.page(self.book_id, self.page_no)
        if p and p["status"] == "review":
            self.open_review()
            return False
        return True

    @staticmethod
    def _difference(a: Image.Image, b: Image.Image) -> float:
        return ImageStat.Stat(ImageChops.difference(a,b)).mean[0]

    def _watch_tick(self):
        if not self.running or self.closing:
            return
        try:
            img = ocr.capture_rectangle(self.rect)
            thumb = img.resize((100, 80), Image.Resampling.BILINEAR).convert("L")
            if self.last_sample is not None and self._difference(thumb, self.last_sample) < .45:
                self.stable_ticks += 1
            else:
                self.stable_ticks = 0
            self.last_sample = thumb
            changed = self.last_captured is None or self._difference(thumb, self.last_captured) >= .55
            if self.stable_ticks >= 2 and changed and time.monotonic()-self.last_capture_at >= .9:
                if self.pending >= 2:
                    self.running = False
                    self.backlog_gap = True
                    self.status_var.set("OCR backlog: scrolling paused. Check that no line was missed.")
                else:
                    counter_img = ocr.capture_rectangle(self.counter_rect) if self.counter_rect else None
                    self.last_captured = thumb
                    self.last_capture_at = time.monotonic()
                    self._queue_capture(img, counter_img)
        except Exception as exc:
            self.running = False
            messagebox.showerror("Capture error", str(exc))
        if self.running:
            self.root.after(470, self._watch_tick)

    def _queue(self, kind, action):
        self.pending += 1
        future = self.executor.submit(action)
        future.add_done_callback(lambda f: self.results.put((kind, f)))
        self.status_var.set(f"{kind.title()} in background · pending {self.pending}…")

    def _queue_capture(self, image, counter_img=None, forced_counter=None):
        book = self.ledger.book(self.book_id)
        target_book, target_page = self.book_id, self.page_no
        def task():
            if forced_counter:
                detected, total = forced_counter
            elif counter_img is not None:
                detected, total = ocr.read_viewer_counter(counter_img, book["total_pages"])
            else:
                detected, total = None, None
            if counter_img is not None and detected is None:
                return {"error": "Counter OCR uncertain. Choose a clearer ROI or turn counter OFF.",
                        "image": image, "book": target_book, "page": target_page}
            if detected is not None and detected != target_page:
                return {"counter_move": (detected, total), "image": image,
                        "book": target_book, "page": target_page}
            scan = ocr.ocr_columns(image, book["columns"])
            if detected is not None:
                scan["viewer_page"], scan["viewer_total"] = detected, total
            return {"image": image, "scan": scan, "book": target_book, "page": target_page}
        self._queue("capture", task)

    def capture_once(self):
        if not self._ready():
            return
        if not self.rect:
            messagebox.showinfo("Area", "Select a text region or import a screenshot first.")
            return
        def grab():
            try:
                img = ocr.capture_rectangle(self.rect)
                counter = ocr.capture_rectangle(self.counter_rect) if self.counter_rect else None
                self._queue_capture(img, counter)
            except Exception as exc:
                messagebox.showerror("Capture", str(exc))
            self.root.deiconify()
        if self._rect_intersects_toolbar():
            self.root.withdraw()  # don't OCR our OWN floating buttons on a one-shot
            self.root.after(200, grab)
        else:
            grab()

    def import_screenshot(self):
        if not self._ready():
            return
        path = filedialog.askopenfilename(parent=self.root, title="Choose screenshot (will be cropped)",
                                          filetypes=[("Images", "*.png *.jpg *.jpeg *.webp *.bmp")])
        if not path:
            return
        try:
            with Image.open(path) as im:
                picker = CropImage(self.root, im.copy())
            self.root.wait_window(picker)
            if picker.result:
                self._queue_capture(picker.result)
        except Exception as exc:
            messagebox.showerror("Image", str(exc))

    def import_pdf_page(self):
        if not self._ready():
            return
        b = self.ledger.book(self.book_id)
        if not b["source_path"]:
            messagebox.showinfo("PDF", "Register a source PDF for this book, or select/capture its screen page.")
            return
        book_id, page_no = self.book_id, self.page_no
        def task():
            self.ledger.check_source(book_id)
            image, scan, total = ocr.scan_pdf_page(b["source_path"], page_no, b["columns"])
            if total != b["total_pages"]:
                raise ValueError("Original PDF page count changed since book setup")
            scan["viewer_page"], scan["viewer_total"] = page_no, total
            return {"image": image, "scan": scan, "book": book_id, "page": page_no}
        self._queue("capture", task)

    def _poll(self):
        if self.closing:
            return
        try:
            while True:
                kind, future = self.results.get_nowait()
                self.pending = max(0, self.pending-1)
                try:
                    result = future.result()
                    if kind == "capture":
                        self._capture_result(result)
                    elif kind == "line":
                        if self.review and self.review.winfo_exists():
                            self.review.show_line_candidate(result)
                    elif kind == "retry":
                        page, used = result
                        if self.review and self.review.winfo_exists():
                            self.review.reload()
                        self._progress()
                        self.status_var.set("Alternate OCR improved the page." if used else
                                            "No safe improvement: edit the text/fields or recapture at better zoom.")
                        if page["status"] == "approved":
                            if self.review and self.review.winfo_exists():
                                self.review.destroy()
                            self.review = None
                            self._after_accept()
                except Exception as exc:
                    self.running = False
                    if kind == "capture":
                        self.backlog_gap = True  # failed OCR may have missed visible content
                    messagebox.showerror(kind.title()+" error", str(exc))
                if self.finish_requested and self.pending == 0:
                    self._finish_now()
        except queue.Empty:
            pass
        self.root.after(170, self._poll)

    def _capture_result(self, data):
        if data.get("book") != self.book_id or data.get("page") != self.page_no:
            self.status_var.set("Old OCR result from another page/book ignored (not added).")
            return
        if data.get("error"):
            self.running = False
            self.backlog_gap = True
            self.status_var.set(data["error"] + " Page remains UNAPPROVED.")
            return
        if "counter_move" in data:
            seen, total = data["counter_move"]
            b = self.ledger.book(self.book_id)
            self.running = False
            if total != b["total_pages"]:
                self.backlog_gap = True
                self.status_var.set(f"Counter total {total} ≠ book total {b['total_pages']}; book/edition check required.")
                return
            if seen == self.page_no+1 and self.ledger.captures(self.book_id, self.page_no):
                self.held_next = (data["image"], seen, total)
                self.resume_watch = True
                self.status_var.set(f"Viewer shows page {seen}; checking {self.page_no} BEFORE accepting next.")
                self.finish_requested = True
            else:
                self.backlog_gap = True
                self.status_var.set(f"Page jump/duplicate: expected {self.page_no}, saw {seen}. Correct viewer position.")
            return
        stored = self.ledger.add_capture(self.book_id, self.page_no,
                                         data["image"], data["scan"], self.session_id)
        count = len(self.ledger.captures(self.book_id, self.page_no))
        self.status_var.set(f"Page {self.page_no} · {count} distinct scroll frames stored" +
                            ("." if stored else "; identical frame not counted."))

    def finish_page(self):
        if not self.book_id or self.page_no is None:
            return
        self.running = False
        self.finish_requested = True
        if self.pending == 0:
            self._finish_now()
        else:
            self.status_var.set(f"Waiting for {self.pending} OCR frame(s), then checking page {self.page_no}.")

    def _finish_now(self):
        self.finish_requested = False
        if not self.ledger.captures(self.book_id, self.page_no):
            messagebox.showwarning("No image", "No captured frame for this physical page yet.")
            return
        extra = ([engine.issue("possible_missed_scroll", "Capture was interrupted/overloaded: check entire page "
                               "for gaps or recapture with slower scroll.", "block")]
                 if self.backlog_gap else [])
        try:
            result = self.ledger.finish_page(self.book_id, self.page_no, self.names,
                                             self.session_id, extra_issues=extra)
            if result["status"] == "review":
                self.status_var.set(f"Page {self.page_no}: {len(result['issues'])} alerts. "
                                    "Review frozen image + text; don't advance yet.")
                self.open_review(self.page_no)
            else:
                self.status_var.set(f"Page {self.page_no}: automatic checks passed. Not a 100% OCR guarantee.")
                self._after_accept()
        except Exception as exc:
            messagebox.showerror("Page check", str(exc))

    def _after_accept(self):
        self._progress()
        self._reset_watch()
        if self.held_next and self.page_no == self.held_next[1]:
            image, seen, total = self.held_next
            self.held_next = None
            self._queue_capture(image, forced_counter=(seen, total))
            if self.resume_watch and self.rect:
                self.running = True
                self.root.after(850, self._watch_tick)
            self.resume_watch = False
        elif self.page_no is None:
            self.status_var.set("All selected physical pages handled. Review/export the book.")

    def open_review(self, page_no=None):
        if not self.book_id:
            return
        if self.review and self.review.winfo_exists():
            self.review.lift()
            return
        if page_no is None:
            page_no = self.page_no
            if not page_no or not self.ledger.page(self.book_id, page_no):
                with self.ledger.connect() as c:
                    r = c.execute("SELECT MAX(page_no) FROM pages WHERE book_id=?", (self.book_id,)).fetchone()
                    page_no = r[0]
        if page_no is None or not self.ledger.page(self.book_id, page_no):
            messagebox.showinfo("Review", "Capture a physical page first.")
            return
        if self.ledger.page(self.book_id, page_no)["status"] == "draft":
            messagebox.showinfo("Finish page", "Press Check page first to run the cross-checker.")
            return
        self.running = False
        self.review = ReviewWindow(self, page_no)

    def retry(self, page_no, attempt):
        if self.pending:
            messagebox.showinfo("OCR busy", "Wait for the current attempt to finish.")
            return
        self._queue("retry", lambda: self.ledger.retry_page(self.book_id, page_no,
                                                            self.names, attempt, self.session_id))

    def retry_line(self, page_no: int, line_no: int):
        if self.pending:
            messagebox.showinfo("OCR busy", "Wait for the current OCR job.")
            return
        self._queue("line", lambda: self.ledger.suggest_line(self.book_id, page_no,
                                                               line_no, self.session_id))

    def more_menu(self):
        m = tk.Menu(self.root, tearoff=False)
        m.add_command(label="Import cropped screenshot…", command=self.import_screenshot)
        m.add_command(label="Read original PDF page (if registered)…", command=self.import_pdf_page)
        m.add_separator()
        m.add_command(label="Skip NON-CONTENT page, with reason…", command=self.skip_current)
        m.add_command(label="Recapture current page after zoom…", command=self.clear_current)
        m.add_command(label="Open a previous page for correction…", command=self.open_previous)
        m.add_command(label="Printed page label (e.g. PDF 24 = printed 1)…", command=self.printed_label)
        m.add_command(label="Set VERIFIED repertory colour grades…", command=self.calibrate_palette)
        m.add_command(label="Local session/data folder…", command=lambda: messagebox.showinfo(
            "Local storage", str(self.ledger.directory)))
        m.tk_popup(self.root.winfo_pointerx(), self.root.winfo_pointery())

    def skip_current(self):
        if not self._ready():
            return
        reason = simpledialog.askstring("Explicit skip", f"Why skip PDF page {self.page_no}? "
                                       "(e.g. cover/table of contents)", parent=self.root)
        if reason:
            try:
                self.ledger.skip_page(self.book_id, self.page_no, reason, self.session_id)
                self._after_accept()
            except Exception as exc:
                messagebox.showerror("Skip", str(exc))

    def clear_current(self):
        if self.page_no is None or self.pending:
            return
        if not messagebox.askyesno("Recapture", "Archive old images and start this UNAPPROVED page again?"):
            return
        try:
            self.ledger.clear_page_captures(self.book_id, self.page_no, self.session_id)
            self.running = False
            self._reset_watch()
            if self.review and self.review.winfo_exists():
                self.review.destroy()
            self.review = None
            self.status_var.set("Images archived. Increase zoom/select tighter region, then capture this SAME page.")
        except Exception as exc:
            messagebox.showerror("Recapture", str(exc))

    def open_previous(self):
        if not self.book_id:
            return
        page_no = simpledialog.askinteger("Physical PDF page", "Page to review/reopen:", parent=self.root)
        if page_no is None:
            return
        p = self.ledger.page(self.book_id, page_no)
        if not p:
            messagebox.showinfo("Page", "This physical page has not been captured/handled yet.")
            return
        if p["status"] == "approved" and messagebox.askyesno(
                "Reopen", "Reopen an APPROVED page for correction? It will become the NEXT required page "
                "until reapproved. Its daily/new count will NOT double."):
            self.ledger.reopen_page(self.book_id, page_no, self.session_id)
            self._progress()
        self.open_review(page_no)

    def printed_label(self):
        if not self.book_id:
            return
        no = simpledialog.askinteger("Physical page", "Physical PDF page to label:", parent=self.root)
        if no is None:
            return
        p = self.ledger.page(self.book_id, no)
        if not p:
            messagebox.showinfo("Physical page", "Capture/check this physical page first.")
            return
        label = simpledialog.askstring("Printed folio", "Printed number/roman folio on paper (optional):",
                                        initialvalue=p["printed_page"], parent=self.root)
        if label is not None:
            try:
                self.ledger.set_printed_page(self.book_id, no, label, self.session_id)
                if self.review and self.review.winfo_exists() and self.review.page_no == no:
                    self.review.reload()
            except Exception as exc:
                messagebox.showerror("Printed label", str(exc))

    def calibrate_palette(self):
        if not self.book_id:
            return
        b = self.ledger.book(self.book_id)
        if b["profile"] != "repertory":
            messagebox.showinfo("Grades", "Only a repertory has remedy grades.")
            return
        current = ", ".join(f"{k}={v}" for k,v in b["grade_palette"].items())
        answer = simpledialog.askstring("Verify source legend FIRST",
            "ONLY if you inspected THIS book's grade legend, enter mappings such as:\n"
            "red=3, blue=2, teal=1 (EXAMPLE ONLY)\n"
            "Leave blank to keep grades unverified.\n"
            f"Existing: {current or 'none'}", parent=self.root)
        if answer is None:
            return
        try:
            palette = {}
            if answer.strip():
                for part in answer.split(","):
                    name, grade = part.strip().split("=", 1)
                    palette[name.strip().casefold()] = int(grade.strip())
            if not messagebox.askyesno("Confirm optical grading",
                                        "Have you VERIFIED these grades in the printed source/legend? "
                                        "Colour alone is not evidence of grade."):
                return
            self.ledger.set_grade_palette(self.book_id, palette, self.session_id)
            p = self.ledger.page(self.book_id, self.page_no) if self.page_no is not None else None
            if p and p["status"] == "review" and p["raw_text"] == p["corrected_text"]:
                self.ledger.finish_page(self.book_id, self.page_no, self.names, self.session_id)
                if self.review and self.review.winfo_exists():
                    self.review.reload()
            self.status_var.set("Colour mapping saved for this BOOK only; inspect first page against the source.")
        except Exception as exc:
            messagebox.showerror("Grade mapping", str(exc))

    def export_book(self):
        if not self.book_id:
            return
        b = self.ledger.book(self.book_id)
        filename = filedialog.asksaveasfilename(parent=self.root, title="Export reviewed data (NOT auto-imported)",
                                                initialfile=b["title"].replace(" ", "_")+"_staging.zip",
                                                defaultextension=".zip", filetypes=[("ZIP", "*.zip")])
        if filename:
            try:
                path = self.ledger.export(self.book_id, filename, self.names)
                messagebox.showinfo("Staging export", "Saved: " + str(path) + "\n\nClinic search/integration is a separate future step. "
                                    "Do not unzip this into live app data without reviewing the manifest.")
            except Exception as exc:
                messagebox.showerror("Export blocked", str(exc))

    def close(self):
        if self.pending and not messagebox.askyesno("OCR still running", "Wait for OCR to finish before closing? "
                                                   "Cancel closing to avoid losing pending frames."):
            return
        if self.pending:
            self.status_var.set("Please wait for OCR to finish, then close.")
            return
        self.closing = True
        self.running = False
        if self.session_id:
            self.ledger.end_session(self.session_id)
        self.executor.shutdown(wait=False, cancel_futures=True)
        self.root.destroy()

    def run(self):
        self.root.mainloop()


class ReviewWindow(tk.Toplevel):
    def __init__(self, app: StudioApp, page_no: int):
        super().__init__(app.root)
        self.app = app
        self.book_id = app.book_id
        self.page_no = page_no
        self.title(f"Review PDF page {page_no} — saved image ⇄ transcription ⇄ structured data")
        try:
            self.state("zoomed")  # Windows
        except tk.TclError:
            self.geometry(f"{self.winfo_screenwidth()}x{self.winfo_screenheight()}+0+0")
        self.attributes("-topmost", True)
        self.protocol("WM_DELETE_WINDOW", self.close)
        self.image_paths = []
        self.frame_index = 0
        self.photo = None
        self.screenshot = None
        self.image_scale = 1.
        self.image_origin = (0,0)
        self.highlight = None
        self.lines = []
        self.attempts = app.ledger.retry_count(self.book_id, page_no)
        self.selected_entry = None
        self.focus_box = None
        self.crop_origin = (0, 0)
        self._autosave_timer = None
        self._json_timer = None
        self._make_review()
        self.reload()

    def _make_review(self):
        head = ttk.Frame(self, padding=7)
        head.pack(fill="x")
        self.heading = tk.StringVar()
        ttk.Label(head, textvariable=self.heading, font=("Segoe UI", 13, "bold")).pack(side="left")
        ttk.Button(head, text="Back to source (UNAPPROVED stays pending)", command=self.close).pack(side="right")
        bar = ttk.Panedwindow(self, orient="horizontal")
        bar.pack(fill="both", expand=True, padx=8, pady=4)
        left = ttk.Frame(bar)
        right = ttk.Frame(bar)
        bar.add(left, weight=1)
        bar.add(right, weight=1)
        barrow = ttk.Frame(left)
        barrow.pack(fill="x")
        ttk.Button(barrow, text="◀ image", command=lambda: self.change_image(-1)).pack(side="left")
        ttk.Button(barrow, text="image ▶", command=lambda: self.change_image(1)).pack(side="left")
        self.image_label = ttk.Label(barrow, text="Saved selected-area image")
        self.image_label.pack(side="left", padx=10)
        ttk.Button(barrow, text="Whole page", command=self.whole_page).pack(side="right")
        self.canvas = tk.Canvas(left, bg="#eef1ef", highlightthickness=0)
        self.canvas.pack(fill="both", expand=True)
        self.canvas.bind("<Configure>", lambda _e: self.after(80, self.render_image))
        self.tabs = ttk.Notebook(right)
        self.tabs.pack(fill="both", expand=True)
        ocrtab = ttk.Frame(self.tabs)
        structtab = ttk.Frame(self.tabs)
        jsontab = ttk.Frame(self.tabs)
        self.tabs.add(ocrtab, text="OCR text — editable")
        self.tabs.add(structtab, text="Entries — editable")
        self.tabs.add(jsontab, text="Advanced JSON")
        self.text = tk.Text(ocrtab, font=("Consolas", 10), wrap="word", undo=True)
        self.text.pack(fill="both", expand=True)
        self.text.bind("<KeyRelease>", lambda _e: self._draft_save_later())
        tb = ttk.Frame(ocrtab)
        tb.pack(fill="x")
        ttk.Button(tb, text="Reparse corrected transcription", command=self.save_text).pack(side="left", padx=4, pady=4)
        ttk.Button(tb, text="Re-read selected LINE", command=self.retry_line).pack(side="left", padx=4)
        ttk.Button(tb, text="Changed OCR retry (max 2)", command=self.retry).pack(side="left", padx=4)
        ttk.Button(tb, text="Recapture instead", command=self.recapture).pack(side="left", padx=4)
        self.entry_tree = ttk.Treeview(structtab, columns=("entry", "detail"), show="headings", height=10)
        self.entry_tree.heading("entry", text="Rubric / Heading / Section")
        self.entry_tree.heading("detail", text="Text / remedies")
        self.entry_tree.column("entry", width=260)
        self.entry_tree.column("detail", width=270)
        self.entry_tree.pack(fill="both", expand=True)
        self.entry_tree.bind("<<TreeviewSelect>>", self.entry_select)
        form = ttk.Frame(structtab, padding=6)
        form.pack(fill="x")
        ttk.Label(form, text="Path / heading / section").grid(row=0, column=0, sticky="w")
        self.entry_title = tk.StringVar()
        ttk.Entry(form, textvariable=self.entry_title, width=58).grid(row=1, column=0, sticky="ew")
        ttk.Label(form, text="Chapter / explicit remedy refs / remedy abbreviation").grid(row=2, column=0, sticky="w")
        self.entry_extra = tk.StringVar()
        ttk.Entry(form, textvariable=self.entry_extra, width=58).grid(row=3, column=0, sticky="ew")
        ttk.Label(form, text="Repertory: ars:3 bell:2  |  Book/MM: original paragraph(s)").grid(row=4, column=0, sticky="w")
        self.entry_body = tk.Text(form, height=5, width=55, wrap="word", font=("Consolas", 10))
        self.entry_body.grid(row=5, column=0, sticky="ew")
        ttk.Button(form, text="Save selected entry/grades (then resolve warnings)", command=self.save_entry).grid(
            row=6, column=0, sticky="w", pady=4)
        self.json_text = tk.Text(jsontab, font=("Consolas", 9), wrap="none", undo=True)
        self.json_text.pack(fill="both", expand=True)
        self.json_text.bind("<KeyRelease>", lambda _e: self._json_save_later())
        ttk.Button(jsontab, text="Save validated structured fields", command=self.save_json).pack(anchor="w", pady=5)
        ttk.Label(right, text="Cross-check warnings — click one to locate its line/image:").pack(anchor="w", pady=(8,0))
        self.issue_list = ttk.Treeview(right, columns=("severity","line","message","status"),
                                       show="headings", height=6)
        for key,width in (("severity",80),("line",45),("message",410),("status",120)):
            self.issue_list.heading(key, text=key.title())
            self.issue_list.column(key, width=width, anchor="w")
        self.issue_list.pack(fill="both", expand=False)
        self.issue_list.bind("<<TreeviewSelect>>", self.locate_issue)
        actions = ttk.Frame(right)
        actions.pack(fill="x", pady=5)
        ttk.Button(actions, text="False alarm ✓", command=lambda: self.resolve("false_alarm")).pack(side="left", padx=2)
        ttk.Button(actions, text="Corrected ✓", command=lambda: self.resolve("corrected")).pack(side="left", padx=2)
        ttk.Button(actions, text="Verified on image ✓", command=lambda: self.resolve("verified_from_image")).pack(side="left", padx=2)
        ttk.Button(actions, text="Approve page →", command=self.approve).pack(side="right", padx=2)

    def _draft_path(self):
        p = self.app.ledger.directory / "editor_drafts" / self.book_id
        p.mkdir(parents=True, exist_ok=True)
        return p / f"page-{self.page_no}-ocr.txt"

    def _draft_save_later(self):
        if self._autosave_timer:
            self.after_cancel(self._autosave_timer)
        self._autosave_timer = self.after(750, self._draft_save)

    def _draft_save(self):
        if not self.winfo_exists():
            return
        self._autosave_timer = None
        edited = self.text.get("1.0", "end-1c")
        page = self.app.ledger.page(self.book_id, self.page_no)
        if not page or edited == page["corrected_text"]:
            self._draft_path().unlink(missing_ok=True)
            return
        path = self._draft_path()
        tmp = path.with_suffix(".tmp")
        tmp.write_text(edited, encoding="utf-8")
        tmp.replace(path)

    def _json_draft_path(self):
        return self._draft_path().with_name(f"page-{self.page_no}-structure.json")

    def _json_save_later(self):
        if self._json_timer:
            self.after_cancel(self._json_timer)
        self._json_timer = self.after(750, self._json_draft_save)

    def _json_draft_save(self):
        if not self.winfo_exists():
            return
        self._json_timer = None
        edited = self.json_text.get("1.0", "end-1c")
        p = self.app.ledger.page(self.book_id, self.page_no)
        if not p:
            return
        canonical = json.dumps(p["parsed"], ensure_ascii=False, indent=2)
        path = self._json_draft_path()
        if edited == canonical:
            path.unlink(missing_ok=True)
            return
        tmp = path.with_suffix(".tmp")
        tmp.write_text(edited, encoding="utf-8")
        tmp.replace(path)

    def _confirm_structured_overwrite(self) -> bool:
        self._json_draft_save()
        draft = self._json_draft_path()
        if not draft.exists():
            return True
        if not messagebox.askyesno("Unsaved advanced JSON",
                                   "An advanced JSON draft exists. Save it first? "
                                   "Proceeding here will discard that unsaved JSON draft.", parent=self):
            return False
        draft.unlink(missing_ok=True)
        return True

    def reload(self):
        p = self.app.ledger.page(self.book_id, self.page_no)
        if not p:
            return
        self.current_page = p
        b = self.app.ledger.book(self.book_id)
        folio = f" · printed {p['printed_page']}" if p["printed_page"] else ""
        self.heading.set(f"{b['title']} · physical PDF page {self.page_no}/{b['total_pages']}{folio} · "
                         f"{p['status'].upper()} · {p['approval_kind'] or 'not approved'}")
        captures = self.app.ledger.captures(self.book_id, self.page_no)
        self.image_paths = [c["image"] for c in captures]
        self.frame_index = min(self.frame_index, max(0,len(self.image_paths)-1))
        stitched = ocr.stitch_frames([c["scan"] for c in captures], b["columns"])
        self.lines = stitched["lines"]
        draft = self._draft_path()
        self.text.delete("1.0", "end")
        self.text.insert("1.0", draft.read_text(encoding="utf-8") if draft.exists() else p["corrected_text"])
        self.json_text.delete("1.0", "end")
        json_draft = self._json_draft_path()
        self.json_text.insert("1.0", json_draft.read_text(encoding="utf-8") if json_draft.exists()
                              else json.dumps(p["parsed"], ensure_ascii=False, indent=2))
        self.issue_list.delete(*self.issue_list.get_children())
        for n, warning in enumerate(p["issues"]):
            self.issue_list.insert("", "end", iid=str(n), values=(warning["severity"],
                                   warning.get("line") or "—", warning["message"],
                                   warning.get("resolution") or "unresolved"))
        self.entry_tree.delete(*self.entry_tree.get_children())
        profile = b["profile"]
        for n, item in enumerate(p["parsed"].get("entries", [])):
            if profile == "materia_medica":
                for m, sec in enumerate(item.get("sections", [])):
                    self.entry_tree.insert("", "end", iid=f"{n}:{m}",
                                           values=(item.get("name", "")+" / "+sec["h"],
                                                   " ".join(sec.get("p", []))[:150]))
            else:
                body = (", ".join(f"{a}:{g}" for a,g in item.get("remedies", {}).items())
                        if profile == "repertory" else item.get("text", ""))
                self.entry_tree.insert("", "end", iid=str(n),
                                       values=(item.get("path") or item.get("heading"), body[:150]))
        self.after(100, self.render_image)

    def render_image(self):
        self.canvas.delete("all")
        if not self.image_paths:
            self.canvas.create_text(20,20,anchor="nw",text="No saved screenshot. Recapture this page.")
            return
        try:
            with Image.open(self.image_paths[self.frame_index]) as im:
                self.screenshot = im.convert("RGB")
            source = self.screenshot
            self.crop_origin = (0,0)
            if self.focus_box:
                x,y,w,h = self.focus_box
                pad_x, pad_y = max(130,w*2), max(90,h*5)
                x1,y1 = max(0,x-pad_x), max(0,y-pad_y)
                x2,y2 = min(source.width,x+w+pad_x), min(source.height,y+h+pad_y)
                self.crop_origin = (x1,y1)
                source = source.crop((x1,y1,x2,y2))
            target_w = max(220,self.canvas.winfo_width()-25)
            target_h = max(220,self.canvas.winfo_height()-25)
            cap = 4.0 if self.focus_box else 1.35
            self.image_scale = min(target_w/source.width, target_h/source.height, cap)
            size = (max(1,int(source.width*self.image_scale)),
                    max(1,int(source.height*self.image_scale)))
            self.photo = ImageTk.PhotoImage(source.resize(size, Image.Resampling.LANCZOS))
            self.image_origin = ((self.canvas.winfo_width()-size[0])//2,
                                 (self.canvas.winfo_height()-size[1])//2)
            self.canvas.create_image(*self.image_origin, image=self.photo, anchor="nw")
            self.image_label.configure(text=f"Saved frame {self.frame_index+1}/{len(self.image_paths)} · "
                                            + ("zoomed flagged region" if self.focus_box else "whole page"))
        except Exception as exc:
            self.canvas.create_text(20,20,anchor="nw",text="Image error: "+str(exc))

    def whole_page(self):
        self.focus_box = None
        self.render_image()

    def change_image(self, direction):
        if self.image_paths:
            self.frame_index = (self.frame_index+direction) % len(self.image_paths)
            self.focus_box = None
            self.render_image()

    def locate_issue(self, _evt):
        selection = self.issue_list.selection()
        if not selection:
            return
        problem = self.current_page["issues"][int(selection[0])]
        n = problem.get("line")
        if not n or not 1 <= n <= len(self.lines):
            return
        self.tabs.select(0)
        self.text.see(f"{n}.0")
        self.text.tag_remove("issue", "1.0", "end")
        self.text.tag_configure("issue", background="#fff4ad")
        self.text.tag_add("issue", f"{n}.0", f"{n}.end")
        line = self.lines[n-1]
        self.frame_index = min(line.get("frame_index", 0), len(self.image_paths)-1)
        self.render_image()
        if not line.get("bbox") or not self.screenshot:
            return
        col = line.get("column", 0)
        x,y,w,h = line["bbox"]
        x += col * (self.screenshot.width // 2) if self.app.ledger.book(self.book_id)["columns"]==2 else 0
        self.focus_box = (x,y,w,h)
        self.render_image()
        ox,oy = self.image_origin
        cx,cy = self.crop_origin
        sc = self.image_scale
        self.canvas.create_rectangle(ox+(x-cx)*sc-4, oy+(y-cy)*sc-4,
                                     ox+(x+w-cx)*sc+4, oy+(y+h-cy)*sc+4,
                                     outline="#ed361a", width=3)

    def entry_select(self, _evt):
        sel = self.entry_tree.selection()
        if not sel:
            return
        value = sel[0]
        parts = value.split(":")
        n = int(parts[0])
        entries = self.current_page["parsed"].get("entries", [])
        if n >= len(entries):
            return
        entry = entries[n]
        profile = self.app.ledger.book(self.book_id)["profile"]
        self.selected_entry = (n, int(parts[1]) if len(parts)>1 else None)
        self.entry_body.delete("1.0", "end")
        if profile == "repertory":
            self.entry_title.set(entry["path"])
            self.entry_extra.set(entry.get("chapter", ""))
            self.entry_body.insert("1.0", " ".join(f"{a}:{g if g is not None else '?'}"
                                                  for a,g in entry.get("remedies", {}).items()))
        elif profile == "prescriber":
            self.entry_title.set(entry["heading"])
            self.entry_extra.set(", ".join(x["abbr"] for x in entry.get("remedy_refs", [])))
            self.entry_body.insert("1.0", entry["text"])
        else:
            self.entry_title.set(entry["sections"][self.selected_entry[1]]["h"])
            self.entry_extra.set(entry["abbr"])
            self.entry_body.insert("1.0", "\n".join(entry["sections"][self.selected_entry[1]]["p"]))

    def save_entry(self):
        if self.current_page["status"] == "approved":
            messagebox.showinfo("Already approved", "Reopen this approved page first.", parent=self)
            return
        if self.selected_entry is None:
            messagebox.showinfo("Selection", "Select an entry in the table first.", parent=self)
            return
        if not self._confirm_structured_overwrite():
            return
        n,section_no = self.selected_entry
        parsed = json.loads(json.dumps(self.current_page["parsed"]))
        entry = parsed["entries"][n]
        title = self.entry_title.get().strip()
        extra = self.entry_extra.get().strip()
        body = self.entry_body.get("1.0", "end-1c").strip()
        profile = parsed["profile"]
        try:
            if profile == "repertory":
                rem = {}
                for part in body.replace(",", " ").split():
                    ab, sep, grade = part.partition(":")
                    if not sep or (not grade.isdigit() and grade != "?"):
                        raise ValueError("Use abbr:grade (e.g. ars:3 bell:2). ? keeps an unverified grade.")
                    rem[engine.norm_abbr(ab)] = None if grade == "?" else int(grade)
                entry["path"] = title
                entry["chapter"] = extra
                entry["remedies"] = rem
            elif profile == "prescriber":
                entry["heading"], entry["text"] = title, body
                abbrs = [engine.norm_abbr(s) for s in extra.replace(";", ",").split(",") if s.strip()]
                if not abbrs:
                    entry["remedy_refs"] = engine.remedy_in_text(body, self.app.names)
                else:
                    entry["remedy_refs"] = [{"abbr": a, "name": self.app.names[a], "evidence": "human verified"}
                                            for a in abbrs]
                entry["see_refs"] = engine.SEE_REF.findall(body)
            else:
                entry["abbr"] = extra
                entry["sections"][section_no]["h"] = title
                entry["sections"][section_no]["p"] = [line for line in body.splitlines() if line.strip()]
            self.app.ledger.save_structured(self.book_id, self.page_no, parsed,
                                            self.app.names, self.app.session_id)
            self.reload()
            self.app._progress()
        except Exception as exc:
            messagebox.showerror("Entry", str(exc), parent=self)

    def save_json(self):
        if self.current_page["status"] == "approved":
            messagebox.showinfo("Already approved", "Reopen this approved page first.", parent=self)
            return
        try:
            parsed = json.loads(self.json_text.get("1.0", "end-1c"))
            self.app.ledger.save_structured(self.book_id, self.page_no, parsed,
                                            self.app.names, self.app.session_id)
            self._json_draft_path().unlink(missing_ok=True)
            self.reload()
            messagebox.showinfo("Structured fields", "Saved. Check/resolve warnings against the saved image.",
                                parent=self)
        except Exception as exc:
            messagebox.showerror("Invalid structured fields", str(exc), parent=self)

    def save_text(self):
        if self.current_page["status"] == "approved":
            messagebox.showinfo("Already approved", "Reopen this approved page first.", parent=self)
            return
        if not self._confirm_structured_overwrite():
            return
        try:
            text = self.text.get("1.0", "end-1c")
            self.app.ledger.recheck_text(self.book_id, self.page_no, text,
                                         self.app.names, self.app.session_id)
            self._draft_path().unlink(missing_ok=True)
            self.reload()
            self.app._progress()
        except Exception as exc:
            messagebox.showerror("Transcription", str(exc), parent=self)

    def retry_line(self):
        if self.current_page["status"] == "approved":
            return
        selected = self.issue_list.selection()
        if not selected:
            messagebox.showinfo("Line", "Select a cross-check warning WITH a line number.", parent=self)
            return
        n = self.current_page["issues"][int(selected[0])].get("line")
        if not n:
            messagebox.showinfo("Line", "This is a page-level warning; retry the full page or edit text.", parent=self)
            return
        self.app.retry_line(self.page_no, n)

    def show_line_candidate(self, candidate: dict):
        n = candidate["line_no"]
        self.tabs.select(0)
        self.text.see(f"{n}.0")
        self.text.tag_remove("issue", "1.0", "end")
        self.text.tag_configure("issue", background="#fff4ad")
        self.text.tag_add("issue", f"{n}.0", f"{n}.end")
        message = (f"Original: {candidate['original']}\n\n"
                   f"Crop OCR #1: {candidate['first']}\n"
                   f"Crop OCR #2: {candidate['second']}\n\n"
                   "Two OCR passes agreeing does NOT prove perfect pixels. "
                   "Check the highlighted screenshot before using either reading.")
        messagebox.showinfo("Source line re-read (NOT auto-applied)", message, parent=self)
        if candidate["first"]:
            replacement = simpledialog.askstring("Use/edit re-read line", "Type the exact printed line "
                "(Cancel = keep current):", initialvalue=candidate["first"], parent=self)
            if replacement is not None:
                self.text.delete(f"{n}.0", f"{n}.end")
                self.text.insert(f"{n}.0", replacement)
                self._draft_save()
                self.save_text()

    def retry(self):
        if self.current_page["status"] == "approved":
            return
        if self.text.get("1.0", "end-1c") != self.current_page["raw_text"]:
            messagebox.showinfo("Save edits", "Manual edits exist; reparse/save them first, don't overwrite with OCR.",
                                parent=self)
            return
        if self.attempts >= 2:
            messagebox.showinfo("OCR attempts", "Two changed passes tried. Edit manually or recapture at higher zoom.",
                                parent=self)
            return
        self.attempts += 1
        self.app.retry(self.page_no, self.attempts)

    def recapture(self):
        self.app.clear_current()

    def resolve(self, kind):
        if self.current_page["status"] == "approved":
            return
        selected = self.issue_list.selection()
        if not selected:
            messagebox.showinfo("Warning", "Select ONE warning to resolve first.", parent=self)
            return
        idx = int(selected[0])
        prompt = ("Why is this a false alarm?" if kind == "false_alarm" else
                  "What did you correct/verify against the saved image?")
        reason = simpledialog.askstring("Auditable human resolution", prompt, parent=self)
        if not reason:
            return
        try:
            self.app.ledger.resolve_issue(self.book_id, self.page_no, idx, kind,
                                          reason, self.app.session_id)
            self.reload()
        except Exception as exc:
            messagebox.showerror("Resolution", str(exc), parent=self)

    def approve(self):
        if self.current_page["status"] == "approved":
            return
        if self.text.get("1.0", "end-1c") != self.current_page["corrected_text"]:
            messagebox.showwarning("Unsaved OCR", "Save/reparse the changed OCR text first.", parent=self)
            return
        p = self.app.ledger.page(self.book_id, self.page_no)
        unresolved = [i for i in p["issues"] if not i.get("resolution")]
        if unresolved:
            messagebox.showwarning("Unresolved warnings", f"Resolve {len(unresolved)} warnings before next page.",
                                   parent=self)
            return
        corrected = (p["raw_text"] != p["corrected_text"] or
                     any(i.get("resolution") == "corrected" for i in p["issues"]))
        mode = "manual_corrected" if corrected else "manual_override"
        note = ""
        if mode == "manual_override":
            note = simpledialog.askstring("Approve after looking at pixels",
                                          "Reason for manual approval (false alarms or image-verified):", parent=self)
            if not note:
                return
        try:
            self.app.ledger.approve_page(self.book_id, self.page_no, mode,
                                         self.app.session_id, note)
            self._draft_path().unlink(missing_ok=True)
            self._json_draft_path().unlink(missing_ok=True)
            self.destroy()
            self.app.review = None
            self.app._after_accept()
        except Exception as exc:
            messagebox.showerror("Approval", str(exc), parent=self)

    def close(self):
        if self._autosave_timer:
            self.after_cancel(self._autosave_timer)
        if self._json_timer:
            self.after_cancel(self._json_timer)
        self._draft_save()
        self._json_draft_save()
        self.destroy()
        self.app.review = None
        self.app._progress()


def launch(data_dir: Path | None = None):
    StudioApp(data_dir).run()
