"""Local English OCR, source-colour sampling and scroll-frame stitching.

The screen scanner sees *visible pixels only*. It does not OCR hidden pages or
claim that two similar OCR passes guarantee correctness. OCR runs off the UI thread.
"""
from __future__ import annotations

import hashlib
import re
import statistics
from difflib import SequenceMatcher
from typing import Any

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

from .engine import issue


def _tesseract():
    try:
        import pytesseract
        set_tesseract_from_env()
        pytesseract.get_tesseract_version()
        return pytesseract
    except Exception as exc:
        raise RuntimeError("Offline Tesseract is not available. Install Tesseract OCR for Windows "
                           "(English language data) and set TESSERACT_CMD if it is not on PATH.") from exc


def set_tesseract_from_env() -> None:
    import os
    from pathlib import Path
    import pytesseract
    if os.getenv("TESSERACT_CMD"):
        pytesseract.pytesseract.tesseract_cmd = os.environ["TESSERACT_CMD"]
    elif os.name == "nt":
        for root in (os.getenv("ProgramFiles", r"C:\Program Files"),
                     os.getenv("ProgramFiles(x86)", r"C:\Program Files (x86)"),
                     os.getenv("LOCALAPPDATA", "")):
            for candidate in (Path(root) / "Tesseract-OCR" / "tesseract.exe",
                              Path(root) / "Programs" / "Tesseract-OCR" / "tesseract.exe"):
                if candidate.is_file():
                    pytesseract.pytesseract.tesseract_cmd = str(candidate)
                    return


def _color(img: Image.Image, box: tuple[int, int, int, int]) -> str:
    """A colour cue, NOT a grade. Grade meaning must be configured per book."""
    x, y, w, h = box
    tile = img.crop((max(0, x), max(0, y), min(img.width, x+w), min(img.height, y+h))).convert("RGB")
    if not tile.width or not tile.height:
        return "unknown"
    palette = {"red": 0, "blue": 0, "teal": 0, "dark": 0}
    pixels = tile.get_flattened_data() if hasattr(tile, "get_flattened_data") else tile.getdata()
    for r, g, b in pixels:
        hi, lo = max(r, g, b), min(r, g, b)
        if lo > 215 or hi < 20:
            continue
        # Separate pale teal grade-1 text from saturated blue grade-2 text.
        # Orange compression/background fragments are NOT remedy colours.
        if r > 80 and r-g > 60 and r-b > 55 and g < 160 and b < 160:
            palette["red"] += 1
        elif b > 90 and b-r > 65 and b-g > 42 and b > g * 1.25:
            palette["blue"] += 1
        elif g > 75 and b > 75 and g-r > 16 and b-r > 16 and abs(g-b) < 65:
            palette["teal"] += 1
        elif hi < 155 and hi-lo < 32:
            palette["dark"] += 1
    enough = sum(palette.values())
    if enough < 3:
        return "unknown"
    colour = max(palette, key=palette.get)
    if palette[colour] < max(3, int(enough * .40)):
        return "unknown"  # ambiguous hue: require a human grade
    return colour


def _line_similarity(a: str, b: str) -> float:
    a = re.sub(r"[^a-z0-9]+", "", a.casefold())
    b = re.sub(r"[^a-z0-9]+", "", b.casefold())
    return SequenceMatcher(None, a[:180], b[:180]).ratio() if a and b else 0.


def ocr_columns(image: Image.Image, columns: int = 1, text_layer: list[list[dict]] | None = None,
                alternate: bool = True, attempt: int = 0) -> dict[str, Any]:
    """Read each column top-to-bottom, preserving word boxes/colours for evidence.

    Set columns=2 ONLY when a single physical page has two body-text columns.
    Source header/footer outside the selected rectangle is deliberately ignored.
    """
    if columns not in (1, 2):
        raise ValueError("Select one or two columns within ONE physical page")
    if attempt not in (0, 1, 2):
        raise ValueError("Only two changed OCR retries are allowed")
    set_tesseract_from_env()
    t = _tesseract()
    image = image.convert("RGB")
    if image.width < 90 or image.height < 80:
        raise ValueError("Capture is too small for OCR")
    image_parts = [image] if columns == 1 else [image.crop((0, 0, image.width // 2, image.height)),
                                                 image.crop((image.width // 2, 0, image.width, image.height))]
    lines_by_col: list[list[dict]] = []
    alt_by_col: list[str] = []
    low: list[dict] = []
    for col_no, part in enumerate(image_parts):
        # Tesseract struggles with small repertory glyphs at native screenshot size.
        factor = (2 if part.width < 1000 and part.height < 2400 else 1.25) * (1.0 + attempt * .30)
        factor = min(factor, 4200/max(part.width, part.height))
        size = (max(1, int(part.width * factor)), max(1, int(part.height * factor)))
        prepared = ImageOps.autocontrast(part.convert("L")).resize(size, Image.Resampling.LANCZOS)
        if attempt == 1:
            prepared = prepared.point(lambda v: 255 if v >= 172 else 0)
        else:
            prepared = prepared.filter(ImageFilter.UnsharpMask(radius=1.1, percent=95, threshold=2))
        psm = (6, 4, 11)[attempt]
        raw = t.image_to_data(prepared, lang="eng", config=f"--psm {psm}",
                              output_type=t.Output.DICT, timeout=65)
        grouped: dict[tuple[int, int, int], list[dict]] = {}
        for i, txt in enumerate(raw["text"]):
            txt = txt.strip()
            if not txt:
                continue
            try:
                conf = float(raw["conf"][i])
            except (TypeError, ValueError):
                conf = -1
            # Local coords are relative to the captured page rectangle, not the desktop.
            bx = int(raw["left"][i] / factor)
            by = int(raw["top"][i] / factor)
            bw = max(1, int(raw["width"][i] / factor))
            bh = max(1, int(raw["height"][i] / factor))
            word = {"text": txt, "conf": round(conf, 1), "bbox": [bx, by, bw, bh],
                    "color": _color(part, (bx, by, bw, bh))}
            key = (raw["block_num"][i], raw["par_num"][i], raw["line_num"][i])
            grouped.setdefault(key, []).append(word)
        column_lines = []
        for words in grouped.values():
            words.sort(key=lambda w: w["bbox"][0])
            top = min(w["bbox"][1] for w in words)
            left = min(w["bbox"][0] for w in words)
            right = max(w["bbox"][0] + w["bbox"][2] for w in words)
            bottom = max(w["bbox"][1] + w["bbox"][3] for w in words)
            text = " ".join(w["text"] for w in words)
            confidence = statistics.median([w["conf"] for w in words if w["conf"] >= 0] or [0])
            line = {"text": text, "words": words, "bbox": [left, top, right-left, bottom-top],
                    "column": col_no, "confidence": round(confidence, 1)}
            column_lines.append(line)
            if confidence < 60 and len(text) > 3:
                low.append({"column": col_no, "text": text, "bbox": line["bbox"],
                            "confidence": round(confidence, 1)})
        column_lines.sort(key=lambda row: (row["bbox"][1], row["bbox"][0]))
        lines_by_col.append(column_lines)
        if alternate:
            # Different preprocessing + segmentation is an *independent signal*, not
            # a second guarantee. It is kept even when it disagrees with the first.
            alt_img = ImageEnhance.Contrast(part.convert("L")).enhance(1.35)
            alt_img = alt_img.resize(size, Image.Resampling.LANCZOS)
            alt_by_col.append(t.image_to_string(alt_img, lang="eng", config=f"--psm {(4, 6, 3)[attempt]}",
                                                timeout=65).strip())
        else:
            alt_by_col.append("")
    ocr_primary_by_col = ["\n".join(row["text"] for row in col) for col in lines_by_col]
    primary = "\n".join(ocr_primary_by_col)
    second = "\n".join(alt_by_col)
    independent_by_col = alt_by_col
    if text_layer and sum(len(line.get("text", "")) for col in text_layer for line in col) >= 60:
        # PDF text layer has its own reading order. Preserve its words/styles if supplied.
        second = primary
        independent_by_col = ocr_primary_by_col
        lines_by_col = text_layer
        primary = "\n".join(line["text"] for col in text_layer for line in col)
        low = []
    return {"columns": lines_by_col, "text": primary, "second": second,
            "alt_columns": independent_by_col,
            "low_confidence": low,
            "image_sha256": hashlib.sha256(image.tobytes()).hexdigest(), "attempt": attempt}


def capture_rectangle(rect: tuple[int, int, int, int]) -> Image.Image:
    """Take visible pixels from the selected Windows screen region (x,y,w,h)."""
    try:
        import mss
    except ImportError as exc:
        raise RuntimeError("Install mss: python -m pip install -r requirements.txt") from exc
    x, y, w, h = rect
    if w < 90 or h < 80:
        raise ValueError("Selection is too small")
    with mss.mss() as screen:
        shot = screen.grab({"left": x, "top": y, "width": w, "height": h})
        return Image.frombytes("RGB", shot.size, shot.rgb)


def _frame_overlap(assembled: list[dict], new: list[dict]) -> int:
    if not assembled or not new:
        return 0
    a = [r["text"] for r in assembled]
    b = [r["text"] for r in new]
    # Whole unchanged frame = no new lines, regardless of OCR punctuation changes.
    if len(b) == len(a) and all(_line_similarity(x, y) >= .84 for x, y in zip(a, b)):
        return len(new)
    # A user may scroll backwards to inspect an already-seen portion; don't
    # count it again or label it a missing interval.
    if len(b) <= len(a):
        for start in range(max(0, len(a)-len(b)-50), len(a)-len(b)+1):
            if sum(_line_similarity(x, y) >= .80 for x, y in zip(a[start:start+len(b)], b)) >= max(1, int(len(b)*.85)):
                return len(b)
    best = 0
    for k in range(min(50, len(a), len(b)), 0, -1):
        matched = sum(_line_similarity(x, y) >= .76 for x, y in zip(a[-k:], b[:k]))
        if (k >= 2 and matched >= max(2, int(k * .75))) or (k == 1 and matched and len(a[-1]) > 25):
            best = k
            break
    return best


def stitch_frames(frames: list[dict], columns: int = 1) -> dict[str, Any]:
    """Merge overlapping scroll screenshots PER COLUMN; never silently drop a gap.

    Each frame is an ocr_columns result. If no textual overlap can be proved,
    the frame is still retained and the page gets a gap warning (manual review).
    """
    if not frames:
        return {"text": "", "second": "", "lines": [],
                "issues": [issue("no_frames", "No page image was captured.", "block")],
                "low_confidence": []}
    merged: list[list[dict]] = [[] for _ in range(columns)]
    problems: list[dict] = []
    hashes: set[str] = set()
    low = []
    for frame_index, frame in enumerate(frames):
        h = frame.get("image_sha256", "")
        if h and h in hashes:
            continue
        hashes.add(h)
        low.extend(frame.get("low_confidence", []))
        for col in range(columns):
            original = frame["columns"][col] if col < len(frame["columns"]) else []
            new = [{**line, "frame_index": frame_index, "column": col} for line in original]
            if not new:
                continue
            previous = merged[col]
            if not previous:
                merged[col] = list(new)
                continue
            k = _frame_overlap(previous, new)
            if k == 0:
                problems.append(issue("scroll_gap", f"No overlap proved before frame {frame_index+1}, "
                                      f"column {col+1}; scroll back and inspect the join.", "block"))
            if k < len(new):
                previous.extend(new[k:])
    all_lines = [row for col in merged for row in col]
    primary = "\n".join(row["text"] for row in all_lines)
    # De-duplicate independent OCR readings separately for each column.
    secondary: list[list[dict]] = [[] for _ in range(columns)]
    for frame in frames:
        alt = frame.get("alt_columns")
        for col in range(columns):
            part = alt[col] if alt and col < len(alt) else (frame.get("second", "") if columns == 1 else "")
            new = [{"text": s} for s in part.splitlines() if s.strip()]
            k = _frame_overlap(secondary[col], new)
            secondary[col].extend(new[k:])
    second = "\n".join(r["text"] for col in secondary for r in col)
    return {"text": primary, "second": second, "lines": all_lines,
            "issues": problems, "low_confidence": low}


def pdf_page_image(path: str, page_number: int, scale: float = 2.0) -> tuple[Image.Image, int]:
    """Optional high-resolution source-PDF path. Page numbers are physical 1-based."""
    try:
        import pymupdf
    except ImportError as exc:
        raise RuntimeError("Install optional PyMuPDF to open PDFs; screen OCR works without it.") from exc
    with pymupdf.open(path) as doc:
        if not (1 <= page_number <= doc.page_count):
            raise ValueError(f"PDF has {doc.page_count} pages; page {page_number} is out of range")
        page = doc[page_number - 1]
        pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), alpha=False)
        return Image.frombytes("RGB", (pix.width, pix.height), pix.samples), doc.page_count


def scan_pdf_page(path: str, page_number: int, columns: int = 1) -> tuple[Image.Image, dict, int]:
    """Optional PDF-file path: vector text first, independently compared with OCR.

    A scanned PDF has no usable text layer and falls back to two offline OCR passes.
    Processing stays page-by-page and uses the physical 1-based PDF page number.
    """
    try:
        import pymupdf
    except ImportError as exc:
        raise RuntimeError("Install optional PyMuPDF or use 'Select on screen' instead.") from exc
    if columns not in (1, 2):
        raise ValueError("Only one or two columns per physical PDF page are supported")
    with pymupdf.open(path) as doc:
        total = doc.page_count
        if not (1 <= page_number <= total):
            raise ValueError(f"PDF page must be 1..{total}")
        page = doc[page_number - 1]
        scale = 2.0
        pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), alpha=False)
        image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        layer: list[list[dict]] = [[] for _ in range(columns)]
        groups: dict[tuple[int, int, int], list[dict]] = {}
        image_parts = ([image] if columns == 1 else
                       [image.crop((0, 0, image.width//2, image.height)),
                        image.crop((image.width//2, 0, image.width, image.height))])
        for data in page.get_text("words"):
            x0, y0, x1, y1, text, block, line_no, _word = data[:8]
            text = str(text).strip()
            if not text:
                continue
            col = 0 if columns == 1 or x0 < page.rect.width / 2 else 1
            offset = 0 if col == 0 else image.width // 2
            x, y, w, h = (int(x0*scale) - offset, int(y0*scale),
                          max(1, int((x1-x0)*scale)), max(1, int((y1-y0)*scale)))
            word = {"text": text, "conf": 100., "bbox": [x, y, w, h],
                    "color": _color(image_parts[col], (x, y, w, h))}
            groups.setdefault((col, block, line_no), []).append(word)
        for (col, _block, _line), words in groups.items():
            words.sort(key=lambda d: d["bbox"][0])
            xx = min(w["bbox"][0] for w in words)
            yy = min(w["bbox"][1] for w in words)
            right = max(w["bbox"][0]+w["bbox"][2] for w in words)
            bottom = max(w["bbox"][1]+w["bbox"][3] for w in words)
            layer[col].append({"text": " ".join(w["text"] for w in words),
                               "words": words, "bbox": [xx, yy, right-xx, bottom-yy],
                               "column": col, "confidence": 100.})
        for col in layer:
            col.sort(key=lambda item: (item["bbox"][1], item["bbox"][0]))
    layer_arg = layer if sum(len(l["text"]) for col in layer for l in col) >= 60 else None
    scan = ocr_columns(image, columns, text_layer=layer_arg)
    scan["source_kind"] = "pdf_text_layer+ocr" if layer_arg else "scanned_pdf_ocr"
    return image, scan, total


def read_viewer_counter(image: Image.Image, expected_total: int) -> tuple[int | None, int | None]:
    """Read user-selected viewer counter ROI; never use *printed* page numbers.

    Returns (physical_page, displayed_total). OCR errors return (None,None), which
    the UI must flag when a counter region was selected. Screens showing TWO
    pages at once should not enable counter-based auto advance.
    """
    t = _tesseract()
    scale = max(2, min(4, int(250 / max(40, image.width))))
    im = ImageOps.autocontrast(image.convert("L")).resize((image.width * scale,
                                                             image.height * scale))
    text = t.image_to_string(im, lang="eng", config="--psm 6", timeout=10).lower()
    text = re.sub(r"\s+", " ", text).strip()
    m = re.search(r"\b(\d{1,5})\s*(?:of|/|[|])\s*(\d{1,5})\b", text)
    if m:
        no, total = map(int, m.groups())
        return (no, total) if 1 <= no <= total else (None, None)
    # Single number is safe only if the user selected a dedicated viewer badge.
    single = re.fullmatch(r"(?:page\s*)?(\d{1,5})", text)
    if single:
        no = int(single.group(1))
        return (no, expected_total) if 1 <= no <= expected_total else (None, None)
    return None, None


def reread_line(image: Image.Image, bbox: list[int], column: int = 0,
                columns: int = 1) -> dict[str, Any]:
    """Try TWO new line-specific OCR readings, never hallucinate missing pixels.

    The returned candidate is a suggestion for the human reviewer, not an
    automatic correction. Crop extends across the whole text column to include
    words missed by the original OCR line bounding box.
    """
    if columns not in (1, 2) or column not in range(columns) or len(bbox) != 4:
        raise ValueError("Select a source-linked OCR line first")
    set_tesseract_from_env()
    t = _tesseract()
    x,y,w,h = bbox
    column_width = image.width // columns
    left = column * column_width
    right = image.width if column == columns-1 else (column+1)*column_width
    pad = max(5, min(11, h//2))
    top = max(0, y-pad)
    bottom = min(image.height, y+h+pad)
    if bottom <= top:
        raise ValueError("Line is outside its original screenshot")
    crop = image.convert("RGB").crop((left,top,right,bottom))
    size = (crop.width*3,crop.height*3)
    base = ImageOps.autocontrast(crop.convert("L")).resize(size, Image.Resampling.LANCZOS)
    first = t.image_to_string(base, lang="eng", config="--psm 7", timeout=25).strip()
    binary = base.point(lambda v: 255 if v >= 176 else 0)
    second = t.image_to_string(binary, lang="eng", config="--psm 13", timeout=25).strip()
    similarity = _line_similarity(first, second)
    return {"first": re.sub(r"\s+", " ", first), "second": re.sub(r"\s+", " ", second),
            "similarity": round(similarity,3), "agree": bool(first and second and similarity >= .90),
            "bbox": [left,top,right-left,bottom-top]}
