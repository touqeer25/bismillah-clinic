"""Windows-first Tk GUI: floating manual-scroll capture with one-page review.

RAW source frames are saved locally before asynchronous OCR. A screen capture
keeps only the selected rectangle; the optional original-PDF action saves its
whole page instead. Without a counter the user confirms each page boundary;
never infer that the entire unseen book has been captured.
"""
from __future__ import annotations

import gc
import json
import queue
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog, ttk
from PIL import Image, ImageChops, ImageStat, ImageTk, ImageOps

from . import capture, engine, ocr
from .store import Ledger


class RegionPicker(tk.Toplevel):
    def __init__(self, master, callback, label="Select ONE page's text region", cancel=None):
        super().__init__(master)
        self.callback = callback
        self.cancel_callback = cancel
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
        self.bind("<Escape>", lambda _e: self.cancel())
        self.protocol("WM_DELETE_WINDOW", self.cancel)
        self.grab_set()
        self.focus_force()

    def cancel(self):
        self.destroy()
        if self.cancel_callback:
            self.master.after(90, self.cancel_callback)

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
        if rect[2] >= 90 and rect[3] >= 80:
            self.master.after(150, lambda: self.callback(rect))
        elif self.cancel_callback:
            self.master.after(90, self.cancel_callback)


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
        self.photo = ImageTk.PhotoImage(display, master=self)
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

    def destroy(self):
        # Tk images MUST be finalized on Tk's owning/main thread. A later
        # worker-thread GC during OCR can otherwise abort the whole process.
        self.photo = None
        super().destroy()


class BookDialog(tk.Toplevel):
    """Quick start with unknown edition/total/range; advanced metadata later."""
    MODES = ("No visible page numbers · capture sequence", "Physical PDF/viewer page numbers")

    def __init__(self, master, book=None):
        super().__init__(master)
        self.book = book
        self.title("Source details — " + ("verify/update" if book else "quick start"))
        self.resizable(False, False)
        self.result = None
        self.vars = {key: tk.StringVar(value=value) for key, value in {
            "title": "", "edition": "", "author": "", "year": "", "profile": "",
            "total_pages": "", "first_page": "", "last_page": "", "columns": "1",
            "source_path": "", "red": "unverified", "blue": "unverified",
            "teal": "unverified", "dark": "unverified",
            "mode": self.MODES[0],
        }.items()}
        self.confirmed = tk.BooleanVar(value=False)
        if book:
            for field in ("title", "edition", "author", "year", "profile", "columns", "source_path"):
                self.vars[field].set(str(book.get(field) or ""))
            for field in ("total_pages", "first_page", "last_page"):
                self.vars[field].set(str(book[field]) if book.get(field) else "")
            self.vars["mode"].set(self.MODES[1 if book["page_mode"] == "physical" else 0])
            self.confirmed.set(bool(book["range_confirmed"]))
        f = ttk.Frame(self, padding=14)
        f.pack(fill="both", expand=True)
        ttk.Label(f, text="Only title and profile are needed to begin. Unknown means UNKNOWN, not page 1.",
                  foreground="#315b67", wraplength=550).grid(row=0, column=0, columnspan=2,
                                                               sticky="w", pady=(0, 11))
        ttk.Label(f, text="Book/source title").grid(row=1, column=0, sticky="w", padx=5, pady=4)
        ttk.Entry(f, textvariable=self.vars["title"], width=43,
                  state="readonly" if book else "normal").grid(row=1, column=1, sticky="ew")
        ttk.Label(f, text="English layout profile").grid(row=2, column=0, sticky="w", padx=5, pady=4)
        ttk.Combobox(f, textvariable=self.vars["profile"], values=engine.PROFILES,
                     state="disabled" if book else "readonly", width=40).grid(row=2, column=1, sticky="w")
        ttk.Label(f, text="How are pages identified?").grid(row=3, column=0, sticky="w", padx=5, pady=4)
        ttk.Combobox(f, textvariable=self.vars["mode"], values=self.MODES,
                     state="disabled" if book else "readonly", width=40).grid(row=3, column=1, sticky="w")
        ttk.Label(f, text="Body columns WITHIN one page").grid(row=4, column=0, sticky="w", padx=5, pady=4)
        ttk.Combobox(f, textvariable=self.vars["columns"], values=("1", "2"),
                     state="disabled" if book else "readonly", width=40).grid(row=4, column=1, sticky="w")
        ttk.Label(f, text="Original PDF (optional)").grid(row=5, column=0, sticky="w", padx=5, pady=4)
        source = ttk.Frame(f)
        source.grid(row=5, column=1, sticky="ew")
        ttk.Entry(source, textvariable=self.vars["source_path"], width=34,
                  state="readonly").pack(side="left")
        if not book:
            ttk.Button(source, text="Browse…", command=self.browse_pdf).pack(side="left")
        self.optional = ttk.LabelFrame(f, text="Details (optional; can be added later)", padding=7)
        self.optional.grid(row=6, column=0, columnspan=2, sticky="ew", pady=(13, 2))
        fields = (("Edition / version (if known)", "edition"),
                  ("Author (optional)", "author"), ("Year (optional)", "year"),
                  ("Total physical PDF/viewer pages", "total_pages"),
                  ("First CONTENT page, physical number", "first_page"),
                  ("Last CONTENT page, physical number", "last_page"))
        for index, (label, key) in enumerate(fields):
            ttk.Label(self.optional, text=label).grid(row=index, column=0, sticky="w", padx=3, pady=3)
            ttk.Entry(self.optional, textvariable=self.vars[key], width=40,
                      state="readonly" if book and key in ("author", "year") else "normal").grid(
                          row=index, column=1, sticky="w", pady=3)
        self.vars["total_pages"].trace_add("write", self._unverify_range)
        self.vars["first_page"].trace_add("write", self._unverify_range)
        self.vars["last_page"].trace_add("write", self._unverify_range)
        ttk.Checkbutton(self.optional, text="I checked the total AND content range in this exact source",
                        variable=self.confirmed).grid(row=6, column=0, columnspan=2, sticky="w", pady=5)
        ttk.Label(self.optional, text="Leave these BLANK when unknown. Confirm them later for a complete-book export.",
                  foreground="#935b1f").grid(row=7, column=0, columnspan=2, sticky="w", pady=2)
        if not book:
            ttk.Label(self.optional, text="Repertory ONLY: colour → printed grade (leave unverified if unknown).",
                      foreground="#a14a18").grid(row=8, column=0, columnspan=2, sticky="w", pady=3)
            palette_row = ttk.Frame(self.optional)
            palette_row.grid(row=9, column=0, columnspan=2, sticky="w")
            for label in ("red", "blue", "teal", "dark"):
                cell = ttk.Frame(palette_row, padding=(5, 0))
                cell.pack(side="left")
                ttk.Label(cell, text=label).pack(anchor="w")
                ttk.Combobox(cell, textvariable=self.vars[label],
                             values=("unverified", "1", "2", "3", "4"),
                             state="readonly", width=10).pack()
        buttons = ttk.Frame(f)
        buttons.grid(row=7, column=0, columnspan=2, sticky="e", pady=(12, 0))
        ttk.Button(buttons, text="Cancel", command=self.destroy).pack(side="right", padx=4)
        ttk.Button(buttons, text="Save details" if book else "Start source",
                   command=self.save).pack(side="right", padx=4)
        self.transient(master)
        self.grab_set()
        self.focus_force()

    def _unverify_range(self, *_args):
        self.confirmed.set(False)

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
            # Knowing the PDF total does NOT establish its first/last CONTENT pages.
            self.vars["mode"].set(self.MODES[1])
        except Exception as exc:
            messagebox.showerror("PDF", "Install PyMuPDF or enter total manually.\n" + str(exc), parent=self)

    def save(self):
        try:
            d = {key: var.get().strip() for key, var in self.vars.items()}
            if not d["title"]:
                raise ValueError("A book/source title is required. Other details can wait.")
            if d["profile"] not in engine.PROFILES:
                raise ValueError("Choose the correct English layout profile for this book before you start.")
            vals = {key: int(d[key]) if d[key] else None for key in (
                "total_pages", "first_page", "last_page")}
            total, first, last = (Ledger._positive_or_unknown(vals[key], key) for key in
                                  ("total_pages", "first_page", "last_page"))
            Ledger._validate_range(total, first, last, self.confirmed.get())
            if not self.book and d["source_path"] and d["mode"] != self.MODES[1]:
                raise ValueError("A linked PDF has physical numbered pages. Choose viewer/PDF mode.")
            if not self.book and d["mode"] == self.MODES[1] and not first and not d["source_path"]:
                raise ValueError("Enter a known first physical page or choose NO visible page numbers.")
            if self.book:
                self.result = dict(edition=d["edition"], **vals,
                                   range_confirmed=self.confirmed.get())
            else:
                palette = {key: int(d[key]) for key in ("red", "blue", "teal", "dark")
                           if d[key] != "unverified"}
                if palette and d["profile"] != "repertory":
                    raise ValueError("Only repertory sources use colour-to-grade mappings.")
                if palette and not messagebox.askyesno("VERIFY this book's printed grade legend",
                        "Have you inspected the legend in THIS exact book/edition? "
                        "Do the chosen colours truly mean these printed grades? "
                        "Without source verification leave ALL grades unverified.", parent=self):
                    return
                self.result = dict(title=d["title"], edition=d["edition"], profile=d["profile"],
                                   **vals, columns=int(d["columns"]), author=d["author"],
                                   year=d["year"], source_path=d["source_path"],
                                   grade_palette=palette,
                                   page_mode="physical" if d["mode"] == self.MODES[1] else "sequence",
                                   range_confirmed=self.confirmed.get())
        except ValueError as exc:
            messagebox.showerror("Book details", str(exc), parent=self)
            return
        self.destroy()


class SelectionOutline:
    """Persistent OUTSIDE border: it cannot enter the pixels passed to MSS."""
    def __init__(self, master, rectangle):
        self.windows = []
        x, y, w, h = rectangle
        sw, sh = master.winfo_screenwidth(), master.winfo_screenheight()
        width = 3
        bounds = ((x, y-width, w, width), (x, y+h, w, width),
                  (x-width, y, width, h), (x+w, y, width, h))
        for bx, by, bw, bh in bounds:
            # If there is no room OUTSIDE the region, omit that edge instead
            # of drawing it over the source and contaminating OCR.
            if bx < 0 or by < 0 or bx+bw > sw or by+bh > sh:
                continue
            win = tk.Toplevel(master)
            win.overrideredirect(True)
            win.configure(bg="#f38521")
            win.geometry(f"{bw}x{bh}+{bx}+{by}")
            win.attributes("-topmost", True)
            self.windows.append(win)

    def hide(self):
        for win in self.windows:
            if win.winfo_exists():
                win.withdraw()

    def show(self):
        for win in self.windows:
            if win.winfo_exists():
                win.deiconify()
                win.lift()

    def destroy(self):
        for win in self.windows:
            if win.winfo_exists():
                win.destroy()
        self.windows = []


class CaptureStrip(tk.Toplevel):
    """Source remains unobstructed; persistent controls live OUTSIDE the ROI."""
    def __init__(self, app, rectangle):
        super().__init__(app.root)
        self.app = app
        self.title("Bismillah · Scroll capture")
        self.resizable(False, False)
        self.attributes("-topmost", True)
        self.protocol("WM_DELETE_WINDOW", app.show_main)
        width, height = 340, 158
        x, y, w, h = rectangle
        sw, sh = self.winfo_screenwidth(), self.winfo_screenheight()
        if y >= height + 12:
            px, py = min(x, sw-width), y-height-8
        elif y+h+height+8 <= sh:
            px, py = min(x, sw-width), y+h+8
        elif x+w+width+8 <= sw:
            px, py = x+w+8, min(y, sh-height)
        else:
            px, py = max(0, x-width-8), min(y, sh-height)
        self.geometry(f"{width}x{height}+{max(0, px)}+{max(0, py)}")
        pane = ttk.Frame(self, padding=(7, 5))
        pane.pack(fill="both", expand=True)
        ttk.Label(pane, textvariable=app.frame_var, font=("Segoe UI", 10, "bold"),
                  wraplength=320).pack(anchor="w")
        ttk.Label(pane, textvariable=app.status_var, wraplength=320,
                  foreground="#315a63").pack(anchor="w")
        for row in ((("▶ Start", app.toggle_watch), ("■ Stop", app.stop_watch),
                     ("👁 Preview", app.open_capture_preview)),
                    (("✔ Check page", app.finish_page), ("⛶ Area", app.select_region),
                     ("☰ Main", app.show_main))):
            buttons = ttk.Frame(pane)
            buttons.pack(anchor="w", pady=(3, 0))
            for label, callback in row:
                ttk.Button(buttons, text=label, command=callback).pack(side="left", padx=2)


class PagePreview(tk.Toplevel):
    """Show the actual image mosaic BEFORE any page OCR is accepted."""
    def __init__(self, app, page_no: int, for_check: bool = False, review_only: bool = False):
        super().__init__(app.root)
        self.app = app
        self.page_no = page_no
        self.for_check = for_check
        self.review_only = review_only
        self.title(f"Whole captured page preview · {app.page_label(page_no)}")
        self.attributes("-topmost", True)
        self.geometry(f"{min(1160, self.winfo_screenwidth()-80)}x"
                      f"{min(900, self.winfo_screenheight()-70)}+35+25")
        self.protocol("WM_DELETE_WINDOW", self.close)
        records = app.ledger.captures(app.book_id, page_no)
        try:
            mosaic, joins = capture.inspect_page_images([r["image"] for r in records])
        except Exception as exc:
            self.destroy()
            raise ValueError(f"Unable to build a trustworthy page preview: {exc}") from exc
        self.joins = joins
        if mosaic is None:
            self.destroy()
            raise ValueError("No saved screenshots to preview")
        problems = [x for x in joins if x["direction"] == "gap"]
        ttk.Label(self, text=f"{app.page_label(page_no)} · {len(records)} saved raw frame(s) · "
                           f"{len(problems)} unverified IMAGE join(s) · source: "
                           f"{(app.ledger.page(app.book_id, page_no) or {}).get('capture_origin') or 'legacy'}",
                  font=("Segoe UI", 11, "bold")).pack(anchor="w", padx=9, pady=5)
        if problems:
            ttk.Label(self, text="ORANGE bands = unproved joins. They do NOT replace missing pixels. "
                                 "Recapture a gap or inspect/resolve it in Review; never guess text.",
                      foreground="#a42f0a", wraplength=1100).pack(anchor="w", padx=9)
        elif len(records) == 1 and app.ledger.page(app.book_id, page_no)["capture_origin"] == "screen":
            ttk.Label(self, text="Only one SCREEN frame saved: look carefully for the page TOP and BOTTOM.",
                      foreground="#a42f0a").pack(anchor="w", padx=9)
        body = ttk.Frame(self)
        body.pack(fill="both", expand=True, padx=8, pady=5)
        self.canvas = tk.Canvas(body, bg="#edf0ef", highlightthickness=0)
        scroll = ttk.Scrollbar(body, orient="vertical", command=self.canvas.yview)
        self.canvas.configure(yscrollcommand=scroll.set)
        scroll.pack(side="right", fill="y")
        self.canvas.pack(side="left", fill="both", expand=True)
        max_width = max(400, min(1010, self.winfo_screenwidth()-190))
        factor = min(1.0, max_width / mosaic.width)
        target = (max(1, round(mosaic.width*factor)), max(1, round(mosaic.height*factor)))
        self.photo = ImageTk.PhotoImage(mosaic.resize(target, Image.Resampling.LANCZOS), master=self)
        self.canvas.create_image(0, 0, anchor="nw", image=self.photo)
        self.canvas.configure(scrollregion=(0, 0, *target))
        self.canvas.bind("<MouseWheel>", self._wheel)
        self.canvas.bind("<Button-4>", lambda _e: self.canvas.yview_scroll(-3, "units"))
        self.canvas.bind("<Button-5>", lambda _e: self.canvas.yview_scroll(3, "units"))
        footer = ttk.Frame(self, padding=8)
        footer.pack(fill="x")
        p = app.ledger.page(app.book_id, page_no)
        self.top_ok = tk.BooleanVar(value=bool(p["top_confirmed"]))
        self.bottom_ok = tk.BooleanVar(value=bool(p["bottom_confirmed"]))
        if not review_only:
            ttk.Checkbutton(footer, text="I see the TOP of this same page",
                            variable=self.top_ok).pack(side="left", padx=3)
            ttk.Checkbutton(footer, text="I see the BOTTOM (no next page mixed in)",
                            variable=self.bottom_ok).pack(side="left", padx=3)
            ttk.Button(footer, text="Confirm & Check page", command=self.confirm).pack(side="right", padx=4)
        ttk.Button(footer, text="Back to source (not approved)", command=self.close).pack(side="right", padx=4)
        self.lift()

    def _wheel(self, event):
        self.canvas.yview_scroll(-int(event.delta / 120) * 4, "units")

    def confirm(self):
        if not self.top_ok.get() or not self.bottom_ok.get():
            messagebox.showwarning("Incomplete page", "Inspect the TOP and BOTTOM. If anything is missing, "
                                   "go back and capture it before checking this page.", parent=self)
            return
        if self.app.ledger.unready_captures(self.app.book_id, self.page_no):
            messagebox.showinfo("OCR still running", "Raw images are saved. Wait for OCR to finish; "
                                "then press Check page again.", parent=self)
            return
        self.app.ledger.confirm_capture_boundaries(self.app.book_id, self.page_no,
            top=True, bottom=True, preview=True,
            note="Human inspected saved whole-page image mosaic and confirmed boundaries",
            session=self.app.session_id)
        self.close()
        self.app._check_page_now()

    def close(self):
        if self.winfo_exists():
            self.destroy()
        self.app.preview = None
        self.app._show_outline()

    def destroy(self):
        self.photo = None  # finalize ImageTk on the Tk thread, not OCR/GC
        super().destroy()


class StudioApp:
    def __init__(self, data_dir: Path | None = None):
        self.ledger = Ledger(data_dir)
        resource_root = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parents[2]))
        self.names = engine.read_remedy_names(resource_root)
        self.root = tk.Tk()
        self.root.title("Bismillah · Windows Screen Parser · English OCR")
        self.root.geometry("510x290+25+95")
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
        self.watch_token = 0
        self.watch_after = None
        self.poll_after = None
        self.pending = 0
        self._gc_guard_active = False
        self._gc_was_enabled = False
        self._gc_last_collect = time.monotonic()
        self.finish_requested = False
        self.resume_watch = False
        self.held_next = None
        self.last_sample = None
        self.last_captured = None
        self.stable_ticks = 0
        self.last_capture_at = 0.
        self.backlog_gap = False
        self.review = None
        self.preview = None
        self.strip = None
        self.outline = None
        self.frame_var = tk.StringVar(value="Choose a source and select its page area.")
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
        self.poll_after = self.root.after(160, self._poll)

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
        ttk.Button(row, text="Floating Start/Stop", command=self.show_strip).pack(side="left", padx=2)
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
        self.book_choice["values"] = [f"{b['title']} [{b['edition'] or 'edition unknown'}]"
                                      for b in self.current_books]

    def _choose_book(self, _evt):
        i = self.book_choice.current()
        if 0 <= i < len(self.current_books):
            self.select_book(self.current_books[i]["id"])

    def select_book(self, book_id):
        if self.pending:
            messagebox.showwarning("OCR busy", "Wait for the current capture to finish before switching books.")
            return
        self.stop_watch()
        self.show_main()
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
        self.resume_saved_ocr()
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
                self.status_var.set("Source ready. Unknown page count stays UNKNOWN; select ONE page body.")
            except Exception as exc:
                messagebox.showerror("New book", str(exc))

    def page_label(self, no: int | None = None) -> str:
        if not self.book_id:
            return "No source"
        b = self.ledger.book(self.book_id)
        no = self.page_no if no is None else no
        if no is None:
            return "Verified range complete" if self.ledger.stats(self.book_id)["book_complete"] else "No next page"
        physical = self.ledger.physical_page_for(b, no)
        if b["page_mode"] == "sequence":
            return (f"Capture #{no} · physical {physical}/{b['total_pages'] or '?'}"
                    if physical else f"Capture #{no} · physical page unknown")
        return f"PDF/viewer {no}/{b['total_pages'] or '?'}"

    def _progress(self):
        if not self.book_id:
            return
        b = self.ledger.book(self.book_id)
        st = self.ledger.stats(self.book_id, self.session_id)
        self.page_no = st["expected_next"]
        label = self.page_label(self.page_no)
        total = b["total_pages"] if b["total_pages"] else "unknown"
        complete = "COMPLETE ✓" if st["book_complete"] else "source not complete"
        self.stats_var.set(f"{b['title'][:22]} · total {total} · {complete} · "
                           f"Approved {st['approved']} · Next {label} · Pending {st['pending_review']}\n"
                           f"Today checked {st['today_checked_unique']} / NEW approved {st['today_new_approved']} "
                           f"· Session checked {st['session_checked_unique']} / NEW approved {st['session_new_approved']}")
        self.root.title(f"Bismillah Screen Parser · {b['title']} · {label}")
        self._frame_status()

    def _frame_status(self):
        if not self.book_id or self.page_no is None:
            self.frame_var.set("No current unfinished page.")
            return
        records = self.ledger.captures(self.book_id, self.page_no)
        waiting = sum(bool(r["scan"].get("_state")) for r in records)
        self.frame_var.set(f"{self.page_label()} · saved {len(records)} raw frame(s) · OCR waiting {waiting}")

    def _hide_outline(self):
        if self.outline:
            self.outline.hide()

    def _show_outline(self):
        if self.outline and self.strip and self.strip.winfo_exists():
            self.outline.show()

    def show_main(self):
        self.stop_watch()
        if self.strip and self.strip.winfo_exists():
            self.strip.destroy()
        self.strip = None
        if self.outline:
            self.outline.destroy()
        self.outline = None
        self.root.deiconify()
        self.root.lift()

    def show_strip(self):
        if not self.book_id or not self.rect:
            messagebox.showinfo("Area", "Select a source and text area first.", parent=self.root)
            return
        if self.strip and self.strip.winfo_exists():
            self.strip.lift()
            self.root.withdraw()
            return
        if self.outline:
            self.outline.destroy()
        self.root.withdraw()  # region selection leaves MAIN control window hidden
        self.outline = SelectionOutline(self.root, self.rect)
        self.strip = CaptureStrip(self, self.rect)
        self._frame_status()

    def edit_book_details(self):
        if not self.book_id or self.pending:
            return
        if self.strip and self.strip.winfo_exists():
            self.show_main()
        dialog = BookDialog(self.root, self.ledger.book(self.book_id))
        self.root.wait_window(dialog)
        if dialog.result:
            try:
                self.ledger.update_book_details(self.book_id, **dialog.result, session=self.session_id)
                self._progress()
                self._list_books()
                self.status_var.set("Source details updated. Unknown values are NOT assumed complete.")
            except Exception as exc:
                messagebox.showerror("Source details", str(exc), parent=self.root)

    def resume_saved_ocr(self):
        """Recover raw screenshot evidence left by a crash or interrupted OCR."""
        if self.page_no is None:
            return
        for record in self.ledger.unready_captures(self.book_id, self.page_no):
            self._submit_saved_capture(record["seq"], self.book_id, self.page_no)
        self._frame_status()

    def _save_region(self, region, counter=False):
        if not self.book_id:
            self.show_main()
            return
        if counter:
            self.counter_rect = region
            self.prefs[self.book_id + "_counter"] = list(region)
            self.status_var.set("Viewer page counter selected; use only with a single numbered page.")
            self.show_main()
        else:
            self.rect = region
            self.prefs[self.book_id + "_rect"] = list(region)
            self.status_var.set("Orange outline stays outside selected text. Start at TOP; "
                                "scroll manually; raw frames are saved automatically.")
            self.show_strip()
        self._prefs_save()

    def select_region(self):
        if not self.book_id:
            messagebox.showinfo("Book", "Create/select a book first.")
            return
        if self.pending:
            messagebox.showwarning("OCR busy", "Wait for pending OCR before changing the area.")
            return
        self.stop_watch()
        if self.page_no is not None and self.ledger.captures(self.book_id, self.page_no):
            if not messagebox.askyesno("New selected area", "This page already has saved frames. "
                                      "Changing the rectangle requires archiving them and recapturing "
                                      "THIS SAME unapproved page. Continue?", parent=self.strip or self.root):
                return
            try:
                self.ledger.clear_page_captures(self.book_id, self.page_no, self.session_id)
                if self.review and self.review.winfo_exists():
                    self.review.destroy()
                    self.review = None
            except Exception as exc:
                messagebox.showerror("Area", str(exc))
                return
        if self.outline:
            self.outline.destroy()
            self.outline = None
        if self.strip and self.strip.winfo_exists():
            self.strip.destroy()
            self.strip = None
        self.root.withdraw()  # source app is visible while selecting
        RegionPicker(self.root, lambda r: self._save_region(r),
                     "Drag TEXT within ONE source page; exclude toolbar/next page",
                     cancel=self.show_main)

    def select_counter(self):
        if not self.book_id:
            return
        if self.ledger.book(self.book_id)["page_mode"] == "sequence":
            messagebox.showinfo("Counter", "This source has no numbered pages. "
                                "Finish each visible page explicitly with Check page.")
            return
        if self.counter_rect and messagebox.askyesno("Counter", "Turn OFF the viewer counter? "
                                                     "(No = pick a new region)"):
            self.counter_rect = None
            self.prefs.pop(self.book_id + "_counter", None)
            self._prefs_save()
            self.status_var.set("Counter OFF; Check page at the end of each source page.")
            return
        self.root.withdraw()
        RegionPicker(self.root, lambda r: self._save_region(r, True),
                     "Viewer's physical 24 of 750 badge (not printed folio)", cancel=self.show_main)

    def _reset_watch(self, keep_gap=False):
        self.last_sample = None
        self.last_captured = None
        self.stable_ticks = 0
        self.last_capture_at = 0.
        if not keep_gap:
            self.backlog_gap = False

    def _rect_intersects_toolbar(self):
        if not self.rect:
            return False
        x, y, w, h = self.rect
        for window in (self.root, self.strip):
            if not window or not window.winfo_exists() or not window.winfo_viewable():
                continue
            window.update_idletasks()
            bx, by = window.winfo_rootx(), window.winfo_rooty()
            bw, bh = window.winfo_width(), window.winfo_height()
            if x < bx+bw and x+w > bx and y < by+bh and y+h > by:
                return True
        return False

    def _mark_capture_uncertain(self, reason):
        if not self.backlog_gap and self.book_id and self.page_no is not None:
            try:
                self.ledger.flag_capture_uncertain(self.book_id, self.page_no, reason, self.session_id)
            except Exception as exc:
                self.status_var.set("Could not persist capture warning: " + str(exc))
        self.backlog_gap = True

    def stop_watch(self):
        was_running = self.running
        self.running = False
        self.watch_token += 1  # invalidate any previously scheduled sampling callback
        if self.watch_after is not None:
            try:
                self.root.after_cancel(self.watch_after)
            except tk.TclError:
                pass
            self.watch_after = None
        if was_running:
            self.status_var.set("Stopped. Preview the saved full page, then Check page.")
            self._frame_status()

    def toggle_watch(self):
        if self.running:
            self.stop_watch()
            return
        if not self._ready() or not self.rect:
            messagebox.showwarning("Selection", "Choose a book and selected text region first.")
            return
        if self._rect_intersects_toolbar():
            messagebox.showwarning("Controls cover book", "Move the small strip OUTSIDE "
                                   "the orange text region, then Start again.")
            return
        previous = self.ledger.page(self.book_id, self.page_no)
        if not previous or not previous["top_confirmed"]:
            if not messagebox.askyesno("Start at the TOP of ONE page",
                    "Is the TOP of this ONE visible source page in the orange region? "
                    "Start will save these pixels immediately, then keep recording as YOU scroll. "
                    "Don't advance to the next page until Check page approves this one.",
                    parent=self.strip or self.root):
                return
            self.ledger.confirm_capture_boundaries(self.book_id, self.page_no, top=True,
                note="Operator confirmed this initial capture starts at the top of ONE page",
                session=self.session_id)
        self._reset_watch(keep_gap=True)
        self.running = True
        self.watch_token += 1
        token = self.watch_token
        self.status_var.set(f"Recording {self.page_label()}. Scroll yourself; pictures are saved BEFORE OCR.")
        # Let the confirmation window disappear before saving the first pixels.
        self.watch_after = self.root.after(220, lambda: self._initial_watch_capture(token))

    def _ready(self):
        if not self.book_id or self.page_no is None:
            self.status_var.set("Select a source with an unfinished page first.")
            return False
        p = self.ledger.page(self.book_id, self.page_no)
        if p and p["status"] == "review":
            self.open_review()
            return False
        return True

    @staticmethod
    def _difference(a: Image.Image, b: Image.Image) -> float:
        return ImageStat.Stat(ImageChops.difference(a, b)).mean[0]

    def _screen_frame(self, image=None):
        image = image if image is not None else ocr.capture_rectangle(self.rect)
        counter = ocr.capture_rectangle(self.counter_rect) if self.counter_rect else None
        self._queue_capture(image, counter)
        self.last_captured = image.resize((160, 120), Image.Resampling.BILINEAR).convert("L")
        self.last_capture_at = time.monotonic()

    def _initial_watch_capture(self, token):
        if not self.running or token != self.watch_token:
            return
        try:
            self._screen_frame()
            self.last_sample = self.last_captured
            self.stable_ticks = 1
        except Exception as exc:
            self.stop_watch()
            messagebox.showerror("Capture", str(exc))
            return
        self.watch_after = self.root.after(250, lambda: self._watch_tick(token))

    def _watch_tick(self, token):
        if not self.running or self.closing or token != self.watch_token:
            return
        try:
            image = ocr.capture_rectangle(self.rect)
            thumb = image.resize((160, 120), Image.Resampling.BILINEAR).convert("L")
            if self.last_sample is not None and self._difference(thumb, self.last_sample) < .65:
                self.stable_ticks += 1
            else:
                self.stable_ticks = 0
            self.last_sample = thumb
            changed = self.last_captured is None or self._difference(thumb, self.last_captured) >= .7
            elapsed = time.monotonic() - self.last_capture_at
            if changed and elapsed >= .25 and (self.stable_ticks >= 1 or elapsed >= 1.25):
                count = len(self.ledger.captures(self.book_id, self.page_no))
                if count >= 30 or self.pending >= 28:
                    self.stop_watch()
                    self._mark_capture_uncertain("Raw-frame/OCR safety limit reached; scrolling paused")
                    self.status_var.set("RAW frame/OCR safety limit reached. Stop scrolling; "
                                        "inspect the page and resume before moving farther.")
                else:
                    if self.stable_ticks == 0:
                        self._mark_capture_uncertain("Image captured while source was still moving")
                    self._screen_frame(image)
        except Exception as exc:
            self.stop_watch()
            self._mark_capture_uncertain("Capture error: " + str(exc))
            messagebox.showerror("Capture error", str(exc))
        if self.running and token == self.watch_token:
            self.watch_after = self.root.after(250, lambda: self._watch_tick(token))

    def _queue(self, kind, action):
        # Python GC may collect cyclic Tk widgets on whichever thread crossed
        # its threshold, including this OCR/PDF worker. Tk finalizers there
        # can ABORT the interpreter (Tcl_AsyncDelete). Only run cyclic GC on
        # the Tk thread while a background task is active.
        if not self._gc_guard_active:
            self._gc_was_enabled = gc.isenabled()
            gc.disable()
            self._gc_guard_active = True
            self._gc_last_collect = time.monotonic()
        self.pending += 1
        future = self.executor.submit(action)
        future.add_done_callback(lambda f: self.results.put((kind, f)))
        self.status_var.set(f"{kind.title()} in background · pending {self.pending}…")

    def _queue_capture(self, image, counter_img=None, forced_counter=None,
                       source_kind="screen") -> bool:
        """Save RAW pixels synchronously; OCR must never hold up the scroll recorder."""
        if self.book_id is None or self.page_no is None:
            return False
        seq = self.ledger.stage_capture(self.book_id, self.page_no, image,
                                        self.session_id, source_kind=source_kind,
                                        counter_image=counter_img)
        if seq is None:
            self.status_var.set("Identical pixels already stored; no duplicate OCR/count.")
            return False
        self._frame_status()
        self._submit_saved_capture(seq, self.book_id, self.page_no, forced_counter=forced_counter)
        self.status_var.set(f"RAW frame {seq} safely saved · OCR in background. Keep scrolling manually.")
        return True

    def _submit_saved_capture(self, seq, target_book, target_page, forced_counter=None):
        book = self.ledger.book(target_book)
        record = next((r for r in self.ledger.captures(target_book, target_page)
                       if r["seq"] == seq), None)
        if record is None:
            raise ValueError("Saved screenshot unexpectedly missing")
        counter_file = record["scan"].get("counter_filename")
        counter_path = self.ledger.directory / counter_file if counter_file else None

        def task():
            try:
                with Image.open(record["image"]) as saved:
                    image = saved.convert("RGB")
                if forced_counter:
                    detected, total = forced_counter
                elif counter_path:
                    with Image.open(counter_path) as saved_counter:
                        detected, total = ocr.read_viewer_counter(saved_counter, book["total_pages"])
                else:
                    detected, total = None, None
                if counter_path and detected is None:
                    return {"error": "Viewer counter OCR unclear. Change or disable counter ROI; "
                                     "this raw screenshot is retained.",
                            "seq": seq, "book": target_book, "page": target_page}
                expected = self.ledger.physical_page_for(book, target_page)
                if detected is not None and (expected is None or (total and not book["total_pages"])):
                    return {"error": "Counter/total is not yet anchored to this source. "
                                     "Confirm page metadata or turn OFF counter ROI.",
                            "seq": seq, "book": target_book, "page": target_page}
                if detected is not None and detected != expected:
                    return {"counter_move": (detected, total), "seq": seq,
                            "book": target_book, "page": target_page}
                scan = ocr.ocr_columns(image, book["columns"])
                if detected is not None:
                    scan["viewer_page"], scan["viewer_total"] = detected, total
                return {"seq": seq, "scan": scan, "book": target_book, "page": target_page}
            except Exception as exc:
                return {"error": str(exc), "seq": seq, "book": target_book, "page": target_page}
        self._queue("capture", task)
        self._frame_status()

    def capture_once(self):
        """Optional one-shot for a page wholly visible in the rectangle."""
        if not self._ready():
            return
        if not self.rect:
            messagebox.showinfo("Area", "Select a text region or import a screenshot first.")
            return
        if self._rect_intersects_toolbar():
            if self.strip and self.strip.winfo_viewable():
                messagebox.showwarning("Controls", "Move small controls outside orange selection.")
                return
            self.root.withdraw()
            self.root.after(220, lambda: self._grab_then_restore(True))
        else:
            self._grab_then_restore(False)

    def _grab_then_restore(self, restore):
        try:
            self._screen_frame()
        except Exception as exc:
            messagebox.showerror("Capture", str(exc))
        finally:
            if restore:
                self.root.deiconify()

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
                self._queue_capture(picker.result, source_kind="imported_image")
        except Exception as exc:
            messagebox.showerror("Image", str(exc))

    def import_pdf_page(self):
        if not self._ready():
            return
        b = self.ledger.book(self.book_id)
        if not b["source_path"]:
            messagebox.showinfo("PDF", "No original PDF linked. Screen scrolling works without one.")
            return
        if b["page_mode"] != "physical":
            messagebox.showinfo("PDF", "An original PDF has physical page numbers; "
                                "verify this source's page metadata first.")
            return
        if self.ledger.captures(self.book_id, self.page_no):
            messagebox.showinfo("PDF", "This page has screen/image frames. Use Recapture current "
                                "page first; mixing a cropped screenshot and full PDF page is unsafe.")
            return
        book_id, page_no = self.book_id, self.page_no

        def task():
            self.ledger.check_source(book_id)
            image, scan, total = ocr.scan_pdf_page(b["source_path"], page_no, b["columns"])
            if b["total_pages"] and total != b["total_pages"]:
                raise ValueError("Original PDF page count changed since book setup")
            scan["viewer_page"], scan["viewer_total"] = page_no, total
            return {"image": image, "scan": scan, "source_kind": "pdf",
                    "book": book_id, "page": page_no}
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
        if self._gc_guard_active and (not self.pending or time.monotonic()-self._gc_last_collect > 4):
            gc.collect()  # main Tk thread, never the OCR worker
            self._gc_last_collect = time.monotonic()
            if not self.pending:
                self._gc_guard_active = False
                if self._gc_was_enabled:
                    gc.enable()
        self.poll_after = self.root.after(170, self._poll)

    def _capture_result(self, data):
        book, no = data.get("book"), data.get("page")
        seq = data.get("seq")
        if book != self.book_id or no != self.page_no:
            if seq is not None:
                self.ledger.fail_capture(book, no, seq,
                    "Book/page changed before pending OCR completed; retry saved pixels")
            self.status_var.set("Unfinished OCR for another page preserved, not counted.")
            return
        if data.get("error"):
            if seq is not None:
                self.ledger.fail_capture(book, no, seq, data["error"], self.session_id)
            self.stop_watch()
            self._mark_capture_uncertain("Background OCR or counter failed while recording")
            self.status_var.set("OCR/counter failed, RAW pixels retained. " + data["error"] +
                                " Use … → Retry saved OCR or recapture this page.")
            self._frame_status()
            return
        if "counter_move" in data:
            seen, total = data["counter_move"]
            self.ledger.discard_staged_capture(book, no, seq, self.session_id)
            b = self.ledger.book(book)
            expected = self.ledger.physical_page_for(b, no)
            self.stop_watch()
            if total != b["total_pages"]:
                self._mark_capture_uncertain("Viewer total differs from registered total")
                self.status_var.set(f"Viewer total {total} differs from registered {b['total_pages']}. "
                                    "Verify the book/source before any next page.")
            elif seen == expected + 1 and self.ledger.captures(book, no):
                # Never carry an unreviewed next-page frame across approval.
                self.status_var.set(f"Viewer advanced to {seen}; saved page {expected} requires "
                                    "full-page Preview/Check BEFORE the next Start.")
                self.finish_requested = True
            else:
                self._mark_capture_uncertain("Viewer jumped or repeated a numbered page")
                self.status_var.set(f"Page jump/duplicate: expected {expected}, saw {seen}. "
                                    "Return to the missing page and verify the saved image.")
            self._frame_status()
            return
        if seq is not None:
            self.ledger.complete_capture(book, no, seq, data["scan"], self.session_id)
        else:
            self.ledger.add_capture(book, no, data["image"], data["scan"],
                                    self.session_id, source_kind=data.get("source_kind", ""))
            self.status_var.set(f"FULL PDF page {no} rendered directly; "
                                "screen selection was NOT used. Preview top/bottom before checking.")
        self._frame_status()

    def finish_page(self):
        if not self.book_id or self.page_no is None:
            return
        self.stop_watch()
        self.finish_requested = True
        if self.pending == 0:
            self._finish_now()
        else:
            self.status_var.set(f"RAW frames safe; waiting for {self.pending} OCR job(s). "
                                "Then inspect full-page Preview before approval.")

    def _finish_now(self):
        self.finish_requested = False
        if not self.ledger.captures(self.book_id, self.page_no):
            messagebox.showwarning("No image", "No frame saved for this page yet.")
            return
        failed = self.ledger.unready_captures(self.book_id, self.page_no)
        if failed:
            messagebox.showwarning("OCR incomplete", f"{len(failed)} raw screenshot(s) need OCR. "
                                   "Use … → Retry saved OCR; don't approve a partial page.")
            return
        self.open_capture_preview(for_check=True)

    def open_capture_preview(self, for_check=False, page_no=None, review_only=False):
        if not self.book_id:
            return
        if self.running:
            self.stop_watch()
        page_no = self.page_no if page_no is None else page_no
        if page_no is None or not self.ledger.captures(self.book_id, page_no):
            messagebox.showinfo("Preview", "Capture at least one source frame first.")
            return
        if self.preview and self.preview.winfo_exists():
            self.preview.lift()
            return
        self._hide_outline()
        try:
            self.preview = PagePreview(self, page_no, for_check=for_check,
                                       review_only=review_only)
        except Exception as exc:
            self._show_outline()
            messagebox.showerror("Page Preview", str(exc))

    def _check_page_now(self):
        try:
            result = self.ledger.finish_page(self.book_id, self.page_no, self.names,
                                             self.session_id)
            if result["status"] == "review":
                self.status_var.set(f"{self.page_label()}: {len(result['issues'])} warnings. "
                                    "Review saved pixels + text BEFORE proceeding.")
                self.open_review(self.page_no)
            else:
                self.status_var.set("Independent OCR/layout checks passed. "
                                    "This is NOT a pixel-perfect text guarantee.")
                self._after_accept()
        except Exception as exc:
            messagebox.showerror("Page check", str(exc))

    def _after_accept(self):
        self._progress()
        self._reset_watch()
        if self.page_no is None:
            self.status_var.set("Selected and VERIFIED page range accounted for; staging export available.")
        else:
            self.status_var.set(f"Current page approved. Position NEXT source page at its TOP, then Start. "
                                f"{self.page_label()} expected.")

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
        self.stop_watch()
        self._hide_outline()
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
        m.add_command(label="Read FULL original PDF page (if registered)…", command=self.import_pdf_page)
        m.add_command(label="Retry OCR for raw frames saved before interruption…",
                      command=self.retry_saved_ocr)
        m.add_separator()
        m.add_command(label="Edit edition / total / confirmed page range…", command=self.edit_book_details)
        m.add_command(label="Small floating scroll controls", command=self.show_strip)
        m.add_separator()
        m.add_command(label="Skip NON-CONTENT page, with reason…", command=self.skip_current)
        m.add_command(label="Recapture current page after zoom…", command=self.clear_current)
        m.add_command(label="Open a previous page for correction…", command=self.open_previous)
        m.add_command(label="Printed page label (e.g. PDF 24 = printed 1)…", command=self.printed_label)
        m.add_command(label="Set VERIFIED repertory colour grades…", command=self.calibrate_palette)
        m.add_command(label="Local session/data folder…", command=lambda: messagebox.showinfo(
            "Local storage", str(self.ledger.directory)))
        m.tk_popup(self.root.winfo_pointerx(), self.root.winfo_pointery())

    def retry_saved_ocr(self):
        if not self.book_id or self.page_no is None:
            return
        unready = self.ledger.unready_captures(self.book_id, self.page_no)
        if not unready:
            messagebox.showinfo("Saved frames", "All saved raw screenshots have OCR results.")
            return
        if self.pending:
            messagebox.showinfo("OCR busy", "OCR is already processing a saved frame.")
            return
        for r in unready:
            self._submit_saved_capture(r["seq"], self.book_id, self.page_no)
        self.status_var.set(f"Reprocessing {len(unready)} saved raw frame(s); no need to recapture yet.")

    def skip_current(self):
        if not self._ready():
            return
        reason = simpledialog.askstring("Explicit skip", f"Why skip {self.page_label()}? "
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
        mode = self.ledger.book(self.book_id)["page_mode"]
        page_no = simpledialog.askinteger("Captured page", "Capture sequence to review/reopen:" if mode == "sequence"
                                          else "Physical PDF/viewer page to review/reopen:", parent=self.root)
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
        no = simpledialog.askinteger("Captured page", "Capture sequence to label:" if
                                     self.ledger.book(self.book_id)["page_mode"] == "sequence"
                                     else "Physical PDF/viewer page to label:", parent=self.root)
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
        stats = self.ledger.stats(self.book_id, self.session_id)
        partial = not stats["book_complete"]
        if partial and not messagebox.askyesno("INCOMPLETE source — partial staging only",
                "Total/edition/range or some captured pages are not yet verified. "
                "Export ONLY approved data as a prominently labelled PARTIAL staging ZIP? "
                "It is NOT a complete book and is NOT installed in the clinic.", parent=self.root):
            return
        filename = filedialog.asksaveasfilename(parent=self.root, title="Export reviewed STAGING data (not auto-imported)",
                initialfile=b["title"].replace(" ", "_") + ("_PARTIAL" if partial else "") + "_staging.zip",
                defaultextension=".zip", filetypes=[("ZIP", "*.zip")])
        if filename:
            try:
                path = self.ledger.export(self.book_id, filename, self.names, allow_partial=partial)
                messagebox.showinfo("Staging export", "Saved: " + str(path) +
                    ("\nINCOMPLETE / PARTIAL, do not treat as a whole book." if partial else "\nComplete verified range.") +
                    "\nClinic search/import registration is separate. Do not overwrite live JSON files.")
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
        self.stop_watch()
        if self.poll_after is not None:
            try:
                self.root.after_cancel(self.poll_after)
            except tk.TclError:
                pass
            self.poll_after = None
        if self.review and self.review.winfo_exists():
            self.review.close()  # save any unsaved reviewer draft and dispose Tk images
        if self.preview and self.preview.winfo_exists():
            self.preview.close()
        if self.session_id:
            self.ledger.end_session(self.session_id)
        self.executor.shutdown(wait=True, cancel_futures=True)
        self.root.destroy()
        gc.collect()  # Tk/PIL finalizers run on the thread that owned Tcl
        if self._gc_guard_active:
            self._gc_guard_active = False
            if self._gc_was_enabled:
                gc.enable()

    def run(self):
        self.root.mainloop()


class ReviewWindow(tk.Toplevel):
    def __init__(self, app: StudioApp, page_no: int):
        super().__init__(app.root)
        self.app = app
        self.book_id = app.book_id
        self.page_no = page_no
        self.title(f"Review {app.page_label(page_no)} — saved image ⇄ transcription ⇄ structured data")
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
        self._render_after = None
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
        ttk.Button(barrow, text="Stitched FULL page preview",
                   command=lambda: self.app.open_capture_preview(page_no=self.page_no,
                                                            review_only=True)).pack(side="right")
        ttk.Button(barrow, text="Whole frame", command=self.whole_page).pack(side="right")
        self.canvas = tk.Canvas(left, bg="#eef1ef", highlightthickness=0)
        self.canvas.pack(fill="both", expand=True)
        self.canvas.bind("<Configure>", lambda _e: self._schedule_render())
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
        self.heading.set(f"{b['title']} · {self.app.page_label(self.page_no)}{folio} · "
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
        self._schedule_render(100)

    def _schedule_render(self, delay=80):
        if self._render_after is not None:
            self.after_cancel(self._render_after)
        self._render_after = self.after(delay, self.render_image)

    def render_image(self):
        self._render_after = None
        if not self.winfo_exists():
            return
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
            self.photo = ImageTk.PhotoImage(source.resize(size, Image.Resampling.LANCZOS), master=self)
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
            if self._render_after is not None:
                self.after_cancel(self._render_after)
                self._render_after = None
            self.destroy()
            self.app.review = None
            self.app._after_accept()
            self.app._show_outline()
        except Exception as exc:
            messagebox.showerror("Approval", str(exc), parent=self)

    def close(self):
        self._draft_save()
        self._json_draft_save()
        self.destroy()
        self.app.review = None
        self.app._progress()
        self.app._show_outline()

    def destroy(self):
        # Explicitly release the image while running in the Tk thread. The
        # next background PIL/PDF OCR job may trigger GC on its own thread.
        for key in ("_render_after", "_autosave_timer", "_json_timer"):
            callback = getattr(self, key, None)
            if callback is not None:
                try:
                    self.after_cancel(callback)
                except tk.TclError:
                    pass
                setattr(self, key, None)
        self.photo = None
        self.screenshot = None
        super().destroy()


def launch(data_dir: Path | None = None):
    StudioApp(data_dir).run()
