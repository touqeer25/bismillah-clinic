"""Persistent per-book/page/session ledger and isolated clinic-format export.

This file never writes to the clinic's existing JSONs or browser localStorage.
Page (book_id, physical_page) is UNIQUE; recaptures do not increment progress.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sqlite3
import uuid
import zipfile
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any

from PIL import Image

from . import engine, ocr


def _now() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def _today() -> str:
    return datetime.now().astimezone().date().isoformat()


def _json(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False, separators=(",", ":"))


def default_data_dir() -> Path:
    if os.name == "nt":
        return Path(os.getenv("LOCALAPPDATA", str(Path.home()))) / "BismillahClinic" / "ScreenParser"
    return Path.home() / "BismillahClinic" / "ScreenParser"


def source_fingerprint(path: str | None) -> str:
    """Fast identity hint: size plus first/last MiB, not a file signature/copyright check."""
    if not path:
        return ""
    p = Path(path)
    if not p.is_file():
        raise FileNotFoundError(p)
    h = hashlib.sha256()
    h.update(str(p.stat().st_size).encode())
    with p.open("rb") as f:
        h.update(f.read(1024 * 1024))
        f.seek(max(0, p.stat().st_size - 1024 * 1024))
        h.update(f.read(1024 * 1024))
    return h.hexdigest()


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", text.casefold()).strip("_")[:45] or "book"


class Ledger:
    def __init__(self, directory: str | Path | None = None):
        self.directory = Path(directory) if directory else default_data_dir()
        self.directory.mkdir(parents=True, exist_ok=True)
        self.db = self.directory / "pages.sqlite3"
        with self.connect() as c:
            c.executescript("""
                CREATE TABLE IF NOT EXISTS books (
                    id TEXT PRIMARY KEY, title TEXT NOT NULL, edition TEXT NOT NULL,
                    profile TEXT NOT NULL, author TEXT NOT NULL, year TEXT NOT NULL,
                    total_pages INTEGER NOT NULL, first_page INTEGER NOT NULL,
                    last_page INTEGER NOT NULL, columns INTEGER NOT NULL,
                    grade_palette TEXT NOT NULL, source_path TEXT NOT NULL,
                    fingerprint TEXT NOT NULL, created TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY, book_id TEXT NOT NULL REFERENCES books(id),
                    started TEXT NOT NULL, local_day TEXT NOT NULL, ended TEXT
                );
                CREATE TABLE IF NOT EXISTS pages (
                    book_id TEXT NOT NULL REFERENCES books(id), page_no INTEGER NOT NULL,
                    status TEXT NOT NULL, raw_text TEXT NOT NULL, corrected_text TEXT NOT NULL,
                    second_text TEXT NOT NULL, parsed TEXT NOT NULL, issues TEXT NOT NULL,
                    approval_kind TEXT NOT NULL, approval_note TEXT NOT NULL,
                    first_approved_at TEXT, first_approved_session TEXT,
                    first_approved_day TEXT, updated TEXT NOT NULL,
                    printed_page TEXT NOT NULL, PRIMARY KEY(book_id,page_no)
                );
                CREATE TABLE IF NOT EXISTS captures (
                    book_id TEXT NOT NULL, page_no INTEGER NOT NULL, seq INTEGER NOT NULL,
                    filename TEXT NOT NULL, sha256 TEXT NOT NULL, scan_json TEXT NOT NULL,
                    created TEXT NOT NULL, PRIMARY KEY(book_id,page_no,seq),
                    UNIQUE(book_id,page_no,sha256),
                    FOREIGN KEY(book_id,page_no) REFERENCES pages(book_id,page_no)
                );
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, book_id TEXT NOT NULL,
                    page_no INTEGER, session_id TEXT, at TEXT NOT NULL,
                    action TEXT NOT NULL, detail TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS pages_status ON pages(book_id,status);
                CREATE INDEX IF NOT EXISTS sessions_day ON sessions(book_id,local_day);
            """)

    @contextmanager
    def connect(self):
        c = sqlite3.connect(self.db, timeout=15)
        try:
            c.row_factory = sqlite3.Row
            c.execute("PRAGMA foreign_keys=ON")
            c.execute("PRAGMA journal_mode=WAL")
            c.execute("PRAGMA busy_timeout=15000")
            yield c
            c.commit()
        except BaseException:
            c.rollback()
            raise
        finally:
            c.close()

    def _event(self, c, book_id: str, page_no: int | None, session: str | None,
               action: str, detail: str = ""):
        c.execute("INSERT INTO events(book_id,page_no,session_id,at,action,detail) VALUES(?,?,?,?,?,?)",
                  (book_id, page_no, session, _now(), action, detail))

    def create_book(self, title: str, edition: str, profile: str, total_pages: int,
                    first_page: int = 1, last_page: int | None = None, columns: int = 1,
                    author: str = "", year: str = "", source_path: str = "",
                    grade_palette: dict[str, int] | None = None) -> str:
        if not title.strip() or not edition.strip():
            raise ValueError("Book title AND edition/source identifier are required")
        if profile not in engine.PROFILES:
            raise ValueError("Choose a supported book profile")
        total_pages = int(total_pages)
        first_page = int(first_page)
        last_page = int(last_page) if last_page is not None else total_pages
        if total_pages < 1 or not (1 <= first_page <= last_page <= total_pages):
            raise ValueError("Physical page range must lie inside 1..total PDF pages")
        if columns not in (1, 2):
            raise ValueError("Select one or two text columns within one page")
        palette = grade_palette or {}
        if any(k not in ("red", "blue", "teal", "dark") or v not in (1, 2, 3, 4)
               for k, v in palette.items()):
            raise ValueError("Grade palette must map colour names to verified grades 1–4")
        fp = source_fingerprint(source_path) if source_path else ""
        book_id = uuid.uuid4().hex
        with self.connect() as c:
            c.execute("INSERT INTO books VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                      (book_id, title.strip(), edition.strip(), profile, author.strip(), year.strip(),
                       total_pages, first_page, last_page, columns, _json(palette),
                       source_path, fp, _now()))
            self._event(c, book_id, None, None, "create_book", f"Range {first_page}–{last_page}/{total_pages}")
            c.commit()
        return book_id

    def books(self) -> list[dict]:
        with self.connect() as c:
            return [dict(r) for r in c.execute("SELECT * FROM books ORDER BY created DESC")]

    def book(self, book_id: str) -> dict:
        with self.connect() as c:
            row = c.execute("SELECT * FROM books WHERE id=?", (book_id,)).fetchone()
        if row is None:
            raise KeyError(f"Unknown book {book_id}")
        result = dict(row)
        result["grade_palette"] = json.loads(result["grade_palette"])
        return result

    def set_grade_palette(self, book_id: str, palette: dict[str, int],
                          session: str | None = None) -> None:
        """Grade colours must be confirmed against THIS source's printed legend."""
        b = self.book(book_id)
        if b["profile"] != "repertory":
            raise ValueError("Only repertory books have colour-to-grade mappings")
        if any(k not in ("red", "blue", "teal", "dark") or v not in (1,2,3,4) for k,v in palette.items()):
            raise ValueError("Map only verified red/blue/teal/dark source colours to grades 1–4")
        with self.connect() as c:
            n = c.execute("SELECT COUNT(*) FROM pages WHERE book_id=? AND status='approved'",
                          (book_id,)).fetchone()[0]
            if n:
                raise ValueError(f"{n} pages already approved. Reopen/review their grades before changing the legend.")
            c.execute("UPDATE books SET grade_palette=? WHERE id=?", (_json(palette), book_id))
            self._event(c, book_id, None, session, "set_grade_palette", _json(palette))
            c.commit()

    def check_source(self, book_id: str) -> None:
        b = self.book(book_id)
        if b["source_path"] and source_fingerprint(b["source_path"]) != b["fingerprint"]:
            raise ValueError("The source PDF changed since this book was registered. Recheck edition/pages.")

    def start_session(self, book_id: str) -> str:
        self.book(book_id)
        sid = uuid.uuid4().hex
        with self.connect() as c:
            c.execute("INSERT INTO sessions(id,book_id,started,local_day) VALUES(?,?,?,?)",
                      (sid, book_id, _now(), _today()))
            self._event(c, book_id, None, sid, "start_session")
            c.commit()
        return sid

    def end_session(self, session_id: str) -> None:
        with self.connect() as c:
            row = c.execute("SELECT book_id FROM sessions WHERE id=?", (session_id,)).fetchone()
            if row:
                c.execute("UPDATE sessions SET ended=? WHERE id=? AND ended IS NULL", (_now(), session_id))
                self._event(c, row["book_id"], None, session_id, "end_session")
                c.commit()

    def page(self, book_id: str, page_no: int) -> dict | None:
        with self.connect() as c:
            row = c.execute("SELECT * FROM pages WHERE book_id=? AND page_no=?", (book_id, page_no)).fetchone()
        if row is None:
            return None
        d = dict(row)
        d["parsed"] = json.loads(d["parsed"])
        d["issues"] = json.loads(d["issues"])
        return d

    def expected_next(self, book_id: str) -> int | None:
        b = self.book(book_id)
        with self.connect() as c:
            done = {r[0] for r in c.execute("SELECT page_no FROM pages WHERE book_id=? "
                                          "AND status IN ('approved','skipped')", (book_id,))}
        return next((n for n in range(b["first_page"], b["last_page"]+1) if n not in done), None)

    def _require_page(self, book_id: str, page_no: int, editing: bool = False) -> None:
        b = self.book(book_id)
        if not b["first_page"] <= page_no <= b["last_page"]:
            raise ValueError(f"Page {page_no} outside selected range {b['first_page']}–{b['last_page']}")
        existing = self.page(book_id, page_no)
        if existing and existing["status"] in ("approved", "skipped") and not editing:
            raise ValueError(f"Page {page_no} was already {existing['status']}; use explicit Reopen")
        if not existing and page_no != self.expected_next(book_id):
            raise ValueError(f"Page jump/duplicate: expected {self.expected_next(book_id)}, got {page_no}")

    def _ensure_draft(self, c, book_id: str, page_no: int) -> None:
        c.execute("INSERT OR IGNORE INTO pages(book_id,page_no,status,raw_text,corrected_text,second_text,"
                  "parsed,issues,approval_kind,approval_note,updated,printed_page) "
                  "VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
                  (book_id, page_no, "draft", "", "", "", "{}", "[]", "", "", _now(), ""))

    def add_capture(self, book_id: str, page_no: int, image: Image.Image,
                    scan: dict, session: str | None = None) -> bool:
        """Save just the user-selected rectangle and its OCR. Return False for same pixels."""
        self._require_page(book_id, page_no)
        image = image.convert("RGB")
        sha = hashlib.sha256(image.tobytes()).hexdigest()
        with self.connect() as c:
            self._ensure_draft(c, book_id, page_no)
            prior = c.execute("SELECT 1 FROM captures WHERE book_id=? AND page_no=? AND sha256=?",
                              (book_id, page_no, sha)).fetchone()
            if prior:
                return False
            seq = c.execute("SELECT COUNT(*) FROM captures WHERE book_id=? AND page_no=?",
                            (book_id, page_no)).fetchone()[0] + 1
            directory = self.directory / "captures" / book_id / str(page_no)
            directory.mkdir(parents=True, exist_ok=True)
            filename = directory / f"frame-{seq:03d}.png"
            tmp = directory / f".frame-{seq:03d}-{uuid.uuid4().hex}.png"
            image.save(tmp, format="PNG", optimize=True)
            tmp.replace(filename)
            try:
                c.execute("INSERT INTO captures VALUES(?,?,?,?,?,?,?)",
                          (book_id, page_no, seq, str(filename.relative_to(self.directory)),
                           sha, _json(scan), _now()))
                self._event(c, book_id, page_no, session, "capture", f"frame={seq} sha256={sha}")
                c.commit()
            except Exception:
                filename.unlink(missing_ok=True)
                raise
        return True

    def captures(self, book_id: str, page_no: int) -> list[dict]:
        with self.connect() as c:
            rows = c.execute("SELECT * FROM captures WHERE book_id=? AND page_no=? ORDER BY seq",
                             (book_id, page_no)).fetchall()
        return [{**dict(r), "scan": json.loads(r["scan_json"]),
                 "image": self.directory / r["filename"]} for r in rows]

    def _context(self, book_id: str, page_no: int) -> dict:
        with self.connect() as c:
            row = c.execute("SELECT parsed FROM pages WHERE book_id=? AND page_no<? AND status='approved' "
                            "ORDER BY page_no DESC LIMIT 1", (book_id, page_no)).fetchone()
        return json.loads(row[0]).get("context_out", {}) if row else {}

    def _source_issues(self, b: dict, page_no: int, frames: list[dict]) -> list[dict]:
        problems = []
        for frame in frames:
            if frame.get("viewer_page") is not None and frame["viewer_page"] != page_no:
                problems.append(engine.issue("page_counter_mismatch", "Viewer displayed a different physical page.",
                                             "block", detail=f"expected={page_no}, got={frame['viewer_page']}"))
            if frame.get("viewer_total") is not None and frame["viewer_total"] != b["total_pages"]:
                problems.append(engine.issue("total_pages_mismatch", "Viewer total changed; check book/edition.",
                                             "block", detail=f"book={b['total_pages']} viewer={frame['viewer_total']}"))
        return problems

    def finish_page(self, book_id: str, page_no: int, names: dict[str, str],
                    session: str | None = None, printed_page: str = "",
                    extra_issues: list[dict] | None = None) -> dict:
        """Always check one physical page before allowing the next new page."""
        self._require_page(book_id, page_no)
        b = self.book(book_id)
        frames = [r["scan"] for r in self.captures(book_id, page_no)]
        stitched = ocr.stitch_frames(frames, b["columns"])
        parsed, issues = engine.check_page(b["profile"], stitched["text"], stitched["second"], names,
                                           self._context(book_id, page_no), stitched["lines"],
                                           b["grade_palette"], stitched["issues"], stitched["low_confidence"])
        issues.extend(extra_issues or [])
        issues.extend(self._source_issues(b, page_no, frames))
        with self.connect() as c:
            self._ensure_draft(c, book_id, page_no)
            c.execute("UPDATE pages SET raw_text=?,corrected_text=?,second_text=?,parsed=?,issues=?,"
                      "status='review',updated=?,printed_page=? WHERE book_id=? AND page_no=?",
                      (stitched["text"], stitched["text"], stitched["second"], _json(parsed),
                       _json(issues), _now(), printed_page, book_id, page_no))
            self._event(c, book_id, page_no, session, "finish_page", f"issues={len(issues)}")
            c.commit()
        if not issues:
            self.approve_page(book_id, page_no, "auto_checked", session=session)
        return self.page(book_id, page_no)

    def suggest_line(self, book_id: str, page_no: int, line_no: int,
                     session: str | None = None) -> dict:
        """Source-image linked re-OCR of just ONE line. Never auto-apply its guess."""
        p = self.page(book_id, page_no)
        if not p or p["status"] != "review":
            raise ValueError("Open an unfinished page for review")
        records = self.captures(book_id, page_no)
        b = self.book(book_id)
        merged = ocr.stitch_frames([r["scan"] for r in records], b["columns"])
        if not 1 <= line_no <= len(merged["lines"]):
            raise ValueError("Select a warning linked to a captured OCR line")
        line = merged["lines"][line_no-1]
        if line.get("bbox") is None:
            raise ValueError("No pixel coordinates remain; recapture at a better zoom")
        frame_idx = line.get("frame_index", 0)
        with Image.open(records[frame_idx]["image"]) as image:
            candidate = ocr.reread_line(image, line["bbox"], line.get("column",0), b["columns"])
        candidate["line_no"] = line_no
        candidate["original"] = line["text"]
        with self.connect() as c:
            self._event(c, book_id, page_no, session, "retry_line",
                        f"line={line_no}; agree={candidate['agree']}; original={line['text'][:90]}")
            c.commit()
        return candidate

    def retry_count(self, book_id: str, page_no: int) -> int:
        # Across restarts/sessions; a real recapture at higher zoom resets attempts.
        with self.connect() as c:
            reset = c.execute("SELECT COALESCE(MAX(id),0) FROM events WHERE book_id=? AND page_no=? "
                              "AND action='recapture'", (book_id, page_no)).fetchone()[0]
            return c.execute("SELECT COUNT(*) FROM events WHERE book_id=? AND page_no=? "
                             "AND action='retry_ocr' AND id>?", (book_id, page_no, reset)).fetchone()[0]

    def retry_page(self, book_id: str, page_no: int, names: dict[str, str],
                   attempt: int, session: str | None = None) -> tuple[dict, bool]:
        """Changed OCR pre-processing; only use it if coverage does not regress.

        The original image stays untouched. Maximum two attempts, then offer
        image-linked manual text/structure correction, never an infinite loop.
        Run this off the GUI thread.
        """
        if attempt not in (1, 2) or attempt != self.retry_count(book_id, page_no) + 1:
            raise ValueError("Only two sequential changed OCR attempts before recapture are allowed")
        p = self.page(book_id, page_no)
        if not p or p["status"] != "review":
            raise ValueError("Finish initial page check before retrying")
        if p["corrected_text"] != p["raw_text"] or any(i["code"] == "manual_structure" for i in p["issues"]):
            raise ValueError("Human text/structure edits exist: don't overwrite their verified work")
        book = self.book(book_id)
        records = self.captures(book_id, page_no)
        if not records:
            raise ValueError("No source image remains for retry")
        from PIL import Image
        new_scans = []
        for capture in records:
            with Image.open(capture["image"]) as img:
                new_scans.append(ocr.ocr_columns(img, book["columns"], attempt=attempt))
        stitched = ocr.stitch_frames(new_scans, book["columns"])
        parsed, problems = engine.check_page(book["profile"], stitched["text"], stitched["second"],
                                             names, self._context(book_id, page_no),
                                             stitched["lines"], book["grade_palette"],
                                             stitched["issues"], stitched["low_confidence"])
        problems.extend(self._source_issues(book, page_no, new_scans))
        problems.extend(i for i in p["issues"] if i["code"] == "possible_missed_scroll")
        old_count = len(p["issues"])
        old_lines = len([x for x in p["raw_text"].splitlines() if x.strip()])
        new_lines = len([x for x in stitched["text"].splitlines() if x.strip()])
        old_entries = len(p["parsed"].get("entries", []))
        old_refs = len(re.findall(r"\([A-Za-z][A-Za-z0-9.\-]{1,17}\)", p["raw_text"]))
        new_refs = len(re.findall(r"\([A-Za-z][A-Za-z0-9.\-]{1,17}\)", stitched["text"]))
        safer = (len(problems) < old_count and new_lines >= int(old_lines * .90)
                 and len(stitched["text"]) >= len(p["raw_text"]) * .95
                 and new_refs >= old_refs
                 and len(parsed.get("entries", [])) >= old_entries)
        with self.connect() as c:
            if safer:
                for record, scan in zip(records, new_scans):
                    c.execute("UPDATE captures SET scan_json=? WHERE book_id=? AND page_no=? AND seq=?",
                              (_json(scan), book_id, page_no, record["seq"]))
                c.execute("UPDATE pages SET raw_text=?,corrected_text=?,second_text=?,parsed=?,issues=?,updated=? "
                          "WHERE book_id=? AND page_no=?",
                          (stitched["text"], stitched["text"], stitched["second"], _json(parsed),
                           _json(problems), _now(), book_id, page_no))
            self._event(c, book_id, page_no, session, "retry_ocr",
                        f"attempt={attempt}; kept={safer}; issues={old_count}->{len(problems)}; "
                        f"lines={old_lines}->{new_lines}; entries={old_entries}->{len(parsed.get('entries', []))}")
            c.commit()
        if safer and not problems:
            self.approve_page(book_id, page_no, "auto_checked", session=session)
        return self.page(book_id, page_no), safer

    def clear_page_captures(self, book_id: str, page_no: int,
                            session: str | None = None) -> None:
        """Recapture after zooming; archive (don't silently destroy) older images."""
        self._require_page(book_id, page_no)
        records = self.captures(book_id, page_no)
        if records:
            archive = self.directory / "archive" / book_id / f"{page_no}-{uuid.uuid4().hex[:8]}"
            archive.mkdir(parents=True, exist_ok=True)
            for r in records:
                target = archive / Path(r["filename"]).name
                Path(r["image"]).replace(target)
        with self.connect() as c:
            c.execute("DELETE FROM captures WHERE book_id=? AND page_no=?", (book_id, page_no))
            self._ensure_draft(c, book_id, page_no)
            c.execute("UPDATE pages SET status='draft',raw_text='',corrected_text='',second_text='',"
                      "parsed='{}',issues='[]',approval_kind='',updated=? WHERE book_id=? AND page_no=?",
                      (_now(), book_id, page_no))
            self._event(c, book_id, page_no, session, "recapture",
                        f"{len(records)} images archived; choose a better zoom/selection")
            c.commit()

    def recheck_text(self, book_id: str, page_no: int, corrected: str, names: dict[str, str],
                     session: str | None = None) -> dict:
        """Human can edit OCR transcription, then reparse EVERY affected field."""
        self._require_page(book_id, page_no)
        old = self.page(book_id, page_no)
        if not old:
            raise ValueError("Capture this page before editing")
        b = self.book(book_id)
        frames = [r["scan"] for r in self.captures(book_id, page_no)]
        stitched = ocr.stitch_frames(frames, b["columns"])
        parsed, issues = engine.check_page(b["profile"], corrected, old["second_text"], names,
                                           self._context(book_id, page_no),
                                           stitched["lines"] if corrected == old["raw_text"] else None,
                                           b["grade_palette"], stitched["issues"], stitched["low_confidence"])
        issues.extend(self._source_issues(b, page_no, frames))
        issues.extend(i for i in old["issues"] if i["code"] == "possible_missed_scroll")
        if corrected != old["raw_text"]:
            issues.append(engine.issue("manual_transcription", "OCR text changed by a human; inspect source image.",
                                       "warning"))
        with self.connect() as c:
            c.execute("UPDATE pages SET corrected_text=?,parsed=?,issues=?,status='review',updated=? "
                      "WHERE book_id=? AND page_no=?",
                      (corrected, _json(parsed), _json(issues), _now(), book_id, page_no))
            self._event(c, book_id, page_no, session, "edit_transcription")
            c.commit()
        return self.page(book_id, page_no)

    def save_structured(self, book_id: str, page_no: int, parsed: dict, names: dict[str, str],
                        session: str | None = None) -> dict:
        """Separate escape hatch when raw OCR is right but layout/grade assignment is wrong."""
        self._require_page(book_id, page_no)
        b = self.book(book_id)
        old = self.page(book_id, page_no)
        if not old:
            raise ValueError("No captured page")
        if parsed.get("profile") != b["profile"] or not isinstance(parsed.get("entries"), list):
            raise ValueError("Structured data needs the same profile and an entries array")
        # Recheck output invariants, but do not replace a human editor's correction
        # with OCR's original wrong interpretation on the next attempt.
        issues = list(old["issues"])
        if b["profile"] == "repertory":
            for e in parsed["entries"]:
                if not e.get("chapter") or not e.get("path"):
                    raise ValueError("Each rubric needs a chapter and a path")
                for ab, grade in e.get("remedies", {}).items():
                    if ab not in names or grade not in (None, 1, 2, 3, 4):
                        raise ValueError(f"Unknown remedy or invalid grade: {ab}={grade}")
                # OTHER rubrics on this page may still have grade=None. Saving one
                # correction must not throw away hours of partial human work.
                # approve_page/export will block until every grade is verified.
        elif b["profile"] == "materia_medica":
            for e in parsed["entries"]:
                if e.get("abbr") not in names:
                    raise ValueError("Materia Medica remedy must match remedy_names.json")
                if not isinstance(e.get("sections"), list):
                    raise ValueError("Materia Medica entry needs sections")
        else:
            for e in parsed["entries"]:
                if not e.get("heading") or not isinstance(e.get("text"), str):
                    raise ValueError("Prescriber entry needs a heading and text")
                for ref in e.get("remedy_refs", []):
                    if ref.get("abbr") not in names:
                        raise ValueError("Prescriber remedy reference is not in remedy_names.json")
        for warning in issues:
            if warning["code"] == "unverified_grade" and warning.get("line") is not None:
                matching = [e for e in parsed["entries"] if e.get("line") == warning["line"]]
                if matching and all(g in (1,2,3,4) for e in matching for g in e.get("remedies",{}).values()):
                    warning["resolution"] = "corrected"
                    warning["note"] = "Human entered numeric grades; manual_structure still requires visual verification"
            if warning["code"] == "count_mismatch" and warning.get("line") is not None:
                matching = [e for e in parsed["entries"] if e.get("line") == warning["line"]]
                if matching and all(e.get("expected_count") == len(e.get("remedies",{})) for e in matching):
                    warning["resolution"] = "corrected"
                    warning["note"] = "Structured count updated; confirm on original screenshot"
        struct_issue = next((i for i in issues if i["code"] == "manual_structure"), None)
        if struct_issue:
            struct_issue["resolution"] = None
            struct_issue["note"] = ""  # EVERY new edit needs a fresh visual sign-off
        else:
            issues.append(engine.issue("manual_structure", "Structured fields edited; confirm against source image.",
                                       "warning"))
        with self.connect() as c:
            c.execute("UPDATE pages SET parsed=?,issues=?,status='review',updated=? "
                      "WHERE book_id=? AND page_no=?",
                      (_json(parsed), _json(issues), _now(), book_id, page_no))
            self._event(c, book_id, page_no, session, "edit_structure")
            c.commit()
        return self.page(book_id, page_no)

    def resolve_issue(self, book_id: str, page_no: int, index: int,
                      resolution: str, note: str, session: str | None = None) -> dict:
        self._require_page(book_id, page_no)
        if resolution not in ("false_alarm", "corrected", "verified_from_image"):
            raise ValueError("Choose false_alarm, corrected or verified_from_image")
        p = self.page(book_id, page_no)
        if not p or not 0 <= index < len(p["issues"]):
            raise ValueError("Choose a displayed warning")
        if len(note.strip()) < 4:
            raise ValueError("Record a short reason for dismissing this warning")
        p["issues"][index]["resolution"] = resolution
        p["issues"][index]["note"] = note.strip()
        with self.connect() as c:
            c.execute("UPDATE pages SET issues=?,updated=? WHERE book_id=? AND page_no=?",
                      (_json(p["issues"]), _now(), book_id, page_no))
            self._event(c, book_id, page_no, session, "resolve_issue",
                        f"{p['issues'][index]['code']}: {resolution}: {note.strip()}")
            c.commit()
        return self.page(book_id, page_no)

    def approve_page(self, book_id: str, page_no: int, mode: str,
                     session: str | None = None, note: str = "") -> dict:
        if mode not in ("auto_checked", "manual_corrected", "manual_override"):
            raise ValueError("Unknown approval mode")
        self._require_page(book_id, page_no)
        p = self.page(book_id, page_no)
        if not p or p["status"] != "review":
            raise ValueError("Finish OCR/check before approval")
        unresolved = [i for i in p["issues"] if not i.get("resolution")]
        if mode == "auto_checked" and (p["issues"] or p["raw_text"] != p["corrected_text"]):
            raise ValueError("Auto-check cannot dismiss issues/manual edits")
        if unresolved:
            raise ValueError(f"Resolve {len(unresolved)} warnings individually before page approval")
        if p["issues"] and mode == "auto_checked":
            raise ValueError("This page needs an auditable human approval")
        if mode == "manual_override" and len(note.strip()) < 4:
            raise ValueError("Manual override needs a reason")
        # Manual approval may overrule a false positive, but may NOT insert
        # physically missing grades or empty content into app-compatible JSON.
        profile = self.book(book_id)["profile"]
        entries = p["parsed"].get("entries", [])
        if profile == "repertory":
            if not entries:
                raise ValueError("No rubrics extracted; recapture/edit or explicitly skip a non-content page")
            for e in entries:
                if not e.get("chapter") or not e.get("path") or any(g not in (1,2,3,4) for g in e.get("remedies",{}).values()):
                    raise ValueError("Resolve unknown chapter/path/grade in structured fields before approval")
        elif not entries and not p["parsed"].get("continuation"):
            raise ValueError("No book content extracted. Recapture, enter it manually or explicitly skip non-content page")
        with self.connect() as c:
            c.execute("UPDATE pages SET status='approved',approval_kind=?,approval_note=?,updated=?,"
                      "first_approved_at=COALESCE(first_approved_at,?),"
                      "first_approved_session=COALESCE(first_approved_session,?),"
                      "first_approved_day=COALESCE(first_approved_day,?) "
                      "WHERE book_id=? AND page_no=?",
                      (mode, note.strip(), _now(), _now(), session, _today(), book_id, page_no))
            self._event(c, book_id, page_no, session, "approve", mode + ": " + note.strip())
            c.commit()
        return self.page(book_id, page_no)

    def set_printed_page(self, book_id: str, page_no: int, label: str,
                         session: str | None = None) -> None:
        """Printed folio (e.g. 1) is NOT the physical PDF page (e.g. 24/750)."""
        p = self.page(book_id, page_no)
        if not p:
            raise ValueError("Capture/skip the physical PDF page before adding a printed label")
        if len(label) > 30:
            raise ValueError("Printed page label is too long")
        with self.connect() as c:
            c.execute("UPDATE pages SET printed_page=?,updated=? WHERE book_id=? AND page_no=?",
                      (label.strip(), _now(), book_id, page_no))
            self._event(c, book_id, page_no, session, "set_printed_folio", label.strip())
            c.commit()

    def reopen_page(self, book_id: str, page_no: int, session: str | None = None) -> None:
        p = self.page(book_id, page_no)
        if not p or p["status"] != "approved":
            raise ValueError("Only an approved page can be reopened")
        with self.connect() as c:
            c.execute("UPDATE pages SET status='review',updated=? WHERE book_id=? AND page_no=?",
                      (_now(), book_id, page_no))
            self._event(c, book_id, page_no, session, "reopen", "Counted once on initial approval")
            c.commit()

    def skip_page(self, book_id: str, page_no: int, reason: str,
                  session: str | None = None) -> None:
        self._require_page(book_id, page_no)
        if len(reason.strip()) < 8:
            raise ValueError("Explain why this physical page has no book content")
        with self.connect() as c:
            self._ensure_draft(c, book_id, page_no)
            c.execute("UPDATE pages SET status='skipped',approval_kind='intentional_skip',approval_note=?,updated=? "
                      "WHERE book_id=? AND page_no=?", (reason.strip(), _now(), book_id, page_no))
            self._event(c, book_id, page_no, session, "skip", reason.strip())
            c.commit()

    def stats(self, book_id: str, session: str | None = None) -> dict:
        b = self.book(book_id)
        count = b["last_page"] - b["first_page"] + 1
        with self.connect() as c:
            rows = c.execute("SELECT page_no,status,approval_kind,first_approved_session,"
                             "first_approved_day FROM pages WHERE book_id=?", (book_id,)).fetchall()
            today = sum(r["first_approved_day"] == _today() and r["status"] == "approved" for r in rows)
            in_session = sum(r["first_approved_session"] == session and r["status"] == "approved"
                             for r in rows) if session else 0
            attempts = c.execute("SELECT COUNT(*) FROM events WHERE book_id=? AND session_id=? "
                                 "AND action IN ('edit_transcription','edit_structure','reopen')",
                                 (book_id, session)).fetchone()[0] if session else 0
            today_checked = c.execute("SELECT COUNT(DISTINCT page_no) FROM events WHERE book_id=? "
                                      "AND action='finish_page' AND substr(at,1,10)=?",
                                      (book_id, _today())).fetchone()[0]
            session_checked = c.execute("SELECT COUNT(DISTINCT page_no) FROM events WHERE book_id=? "
                                        "AND action='finish_page' AND session_id=?",
                                        (book_id, session)).fetchone()[0] if session else 0
        approved = sum(r["status"] == "approved" for r in rows)
        skipped = sum(r["status"] == "skipped" for r in rows)
        pending = sum(r["status"] in ("draft", "review") for r in rows)
        return {"total_pdf_pages": b["total_pages"], "range": [b["first_page"], b["last_page"]],
                "in_range": count, "approved": approved, "skipped": skipped,
                "pending_review": pending, "remaining": count-approved-skipped,
                "today_new_approved": today, "session_new_approved": in_session,
                "today_checked_unique": today_checked, "session_checked_unique": session_checked,
                "session_revisions": attempts, "expected_next": self.expected_next(book_id)}

    def _export_payload(self, b: dict, pages: list[dict], names: dict[str, str]) -> dict[str, str]:
        """App-compatible formats in an isolated staging/ directory; NO app files touched."""
        slug = _slug(b["title"]) + "_" + b["id"][:7]
        prefix = f"staging/{slug}/"
        source = f"Screen Parser capture; {b['title']} ({b['edition']})"
        meta = {"id": slug, "title": b["title"], "author": b["author"],
                "year": b["year"], "source": source}
        files: dict[str, str] = {}
        if b["profile"] == "prescriber":
            entries: list[dict] = []
            for p in pages:
                parsed = p["parsed"]
                continuation = parsed.get("continuation", "")
                if continuation:
                    if not entries:
                        raise ValueError(f"Page {p['page_no']} begins with orphan text; review the previous page")
                    entries[-1]["text"] += "\n" + continuation
                    entries[-1]["pages"].append(p["page_no"])
                for e in parsed.get("entries", []):
                    entries.append({"heading": e["heading"], "text": e["text"],
                                    "pages": [p["page_no"]], "see": e.get("see_refs", [])})
            library = {**meta, "sections": [{"h": e["heading"], "p": [e["text"]]} for e in entries]}
            clinical = {"id": slug, "title": b["title"], "schema": "clinical-index-v1",
                        "entries": [{"heading": e["heading"], "text": e["text"], "pages": e["pages"],
                                     "remedies": engine.remedy_in_text(e["text"], names), "see": e["see"]}
                                    for e in entries]}
            files[prefix + "library/" + slug + ".json"] = _json(library)
            files[prefix + "clinical_index/" + slug + ".json"] = _json(clinical)
        elif b["profile"] == "materia_medica":
            remedies: dict[str, dict] = {}
            unmatched = []
            for p in pages:
                for e in p["parsed"].get("entries", []):
                    ab = e.get("abbr", "")
                    if ab not in names:
                        unmatched.append({"page": p["page_no"], "name": e.get("name", "")})
                        continue
                    dest = remedies.setdefault(ab, {"name": e.get("name", names[ab]), "sections": []})
                    for section in e.get("sections", []):
                        heading = section.get("h", "")
                        paragraphs = section.get("p", [])
                        if dest["sections"] and dest["sections"][-1]["h"] == heading:
                            dest["sections"][-1]["p"].extend(paragraphs)
                        else:
                            dest["sections"].append({"h": heading, "p": list(paragraphs)})
            files[prefix + "mm/" + slug + ".json"] = _json({**meta, "license": "verify source rights",
                                                               "remedies": remedies, "unmatched": unmatched})
        else:
            chapters: dict[str, dict] = {}
            keys = {}
            for p in pages:
                for n, e in enumerate(p["parsed"].get("entries", [])):
                    chapter = e.get("chapter") or p["parsed"].get("chapter")
                    if not chapter or not e.get("path"):
                        raise ValueError(f"Page {p['page_no']} has no chapter/rubric path")
                    key = _slug(chapter)
                    keys[key] = chapter
                    rem = e.get("remedies", {})
                    if any(ab not in names or g not in (1, 2, 3, 4) for ab, g in rem.items()):
                        raise ValueError(f"Page {p['page_no']} has unknown remedies/grades: {e['path']}")
                    rid = f"sp{p['page_no']:05d}_{n+1:03d}"
                    chapters.setdefault(key, {})[rid] = {"t": e["path"], "r": rem}
            master = {key: chapters[key] for key in sorted(chapters)}
            index = [{"key": key, "name": keys[key], "rubrics": len(chapters[key])}
                     for key in sorted(chapters)]
            for key in sorted(chapters):
                files[prefix + "repertory/chapters/" + key + ".json"] = _json(chapters[key])
            files[prefix + "repertory/_index.json"] = _json(index)
            files[prefix + "repertory/" + slug + "_repertory.json"] = _json(master)
        return files

    def export(self, book_id: str, filename: str | Path, names: dict[str, str]) -> Path:
        """Refuse a 'complete' ZIP until EVERY in-range physical page is approved/skipped."""
        b = self.book(book_id)
        self.check_source(book_id)
        stats = self.stats(book_id)
        if stats["expected_next"] is not None:
            raise ValueError(f"Cannot export a complete book: page {stats['expected_next']} "
                             "is not approved/explicitly skipped")
        with self.connect() as c:
            raw = c.execute("SELECT * FROM pages WHERE book_id=? ORDER BY page_no", (book_id,)).fetchall()
            shots = c.execute("SELECT page_no,filename,sha256 FROM captures WHERE book_id=? ORDER BY page_no,seq",
                              (book_id,)).fetchall()
        pages = []
        for row in raw:
            p = dict(row)
            p["parsed"] = json.loads(p["parsed"])
            p["issues"] = json.loads(p["issues"])
            pages.append(p)
        manifest = {"schema": "bhc-screen-parser-v1", "book": {
            "title": b["title"], "edition": b["edition"], "profile": b["profile"],
            "total_pdf_pages": b["total_pages"], "physical_page_range": stats["range"],
            "source_fingerprint": b["fingerprint"]},
            "exported_at": _now(), "stats": stats,
            "pages": [{"physical_page": p["page_no"], "printed_page": p["printed_page"],
                       "status": p["status"], "approval_kind": p["approval_kind"],
                       "approval_note": p["approval_note"],
                       "issues": [{"code": i["code"], "resolution": i.get("resolution"),
                                   "note": i.get("note", "")} for i in p["issues"]],
                       "sha256_of_cropped_images": [s["sha256"] for s in shots if s["page_no"] == p["page_no"]]}
                      for p in pages]}
        content = [p for p in pages if p["status"] == "approved"]
        files = self._export_payload(b, content, names)
        files["screen_parser/manifest.json"] = json.dumps(manifest, ensure_ascii=False, indent=2)
        files["README_IMPORT_FIRST.txt"] = ("Bismillah Screen Parser: reviewed data staging package.\n"
            "This is NOT installed into the clinic by merely copying the ZIP. Review the per-page manifest, "
            "then integrate the compatible JSON and register each book in the clinic.\n"
            "The prescriber clinical_index is data for the SEPARATE future clinic search mechanism.\n"
            "Screenshots remain ONLY on this Windows machine; only their SHA-256 hashes are in this ZIP.\n"
            "Do not publicly commit copyrighted/private book content without permission.\n")
        destination = Path(filename)
        destination.parent.mkdir(parents=True, exist_ok=True)
        tmp = destination.with_suffix(destination.suffix + ".tmp")
        try:
            with zipfile.ZipFile(tmp, "w", compression=zipfile.ZIP_DEFLATED,
                                 compresslevel=6, allowZip64=True) as z:
                for name, text in sorted(files.items()):
                    z.writestr(name, text.encode("utf-8"))
            tmp.replace(destination)
        finally:
            tmp.unlink(missing_ok=True)
        with self.connect() as c:
            self._event(c, book_id, None, None, "export", str(destination))
            c.commit()
        return destination
