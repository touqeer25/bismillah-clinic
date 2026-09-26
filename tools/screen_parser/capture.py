"""Image-first, offline scroll continuity and a human-readable page preview.

A fixed screen rectangle shows different parts of ONE page while a human scrolls.
Store each raw frame before OCR; a mosaic is just an inspection aid, never proof
that unseen pixels were captured. Page boundaries are confirmed separately.
This module uses Pillow only; no Snagit, system hooks or external service.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageChops, ImageOps


@dataclass(frozen=True)
class ScrollJoin:
    direction: str  # same, down, up, gap
    shift: int = 0   # original-frame pixels; DOWN = new material at bottom
    score: float = 1.0


def _ink_mask(image: Image.Image, w: int, h: int) -> Image.Image:
    mono = ImageOps.grayscale(image).resize((w, h), Image.Resampling.BILINEAR)
    # Ignore white margins; compare actual glyph/shape pixels, not blank space.
    return mono.point(lambda v: 255 if v < 185 else 0)


def _ink_count(image: Image.Image) -> int:
    return image.histogram()[255]


def compare_scroll_frames(previous: Image.Image, current: Image.Image) -> ScrollJoin:
    """Seek *visible pixel* overlap independently of OCR's text-based check.

    Search both directions because a user may scroll backwards to inspect a
    join. Low-information, resized or non-overlapping frames return 'gap', not
    an invented position. Repeating layouts can still confuse image matching:
    the OCR join and full-page human preview remain separate safeguards.
    """
    if previous.size != current.size or min(previous.size) < 90:
        return ScrollJoin("gap")
    width = min(192, previous.width)
    height = min(280, previous.height)
    a = _ink_mask(previous, width, height)
    b = _ink_mask(current, width, height)
    diff = _ink_count(ImageChops.difference(a, b))
    total_ink = _ink_count(a) + _ink_count(b)
    if total_ink < width * height * .006 or total_ink > width * height * 1.5:
        return ScrollJoin("gap")  # blank/solid dark areas cannot establish overlap
    if diff / total_ink < .08:
        return ScrollJoin("same", score=diff / total_ink)
    candidates: list[tuple[float, str, int]] = []
    min_shift = max(3, int(height * .015))
    max_shift = min(height - 8, int(height * .75))  # >=25% of body must overlap
    # Cheap search finds POSSIBLE shifts, never certifies them. Repeated line
    # spacing can otherwise make two unrelated pages appear to match.
    for shift in range(min_shift, max_shift + 1):
        for direction in ("down", "up"):
            aa = a.crop((0, shift, width, height)) if direction == "down" else a.crop((0, 0, width, height - shift))
            bb = b.crop((0, 0, width, height - shift)) if direction == "down" else b.crop((0, shift, width, height))
            ink = _ink_count(aa) + _ink_count(bb)
            if ink < max(60, width * (height - shift) * .009):
                continue
            mismatch = _ink_count(ImageChops.difference(aa, bb)) / ink
            candidates.append((mismatch + .025 * shift / height, direction, shift))
    if not candidates:
        return ScrollJoin("gap")
    # At thumbnail resolution a 1px rounding error destroys glyph alignment.
    # Certify top candidates AGAIN at native vertical resolution; require most
    # ink pixels to literally match, rather than merely similar-looking text.
    candidates.sort()
    distinct = []
    for value, direction, shift in candidates:
        if all(d != direction or abs(shift - other) >= 3 for _, d, other in distinct):
            distinct.append((value, direction, shift))
        if len(distinct) >= 12:
            break
    native_w = min(previous.width, 720)
    native_h = previous.height
    raw_a = _ink_mask(previous, native_w, native_h)
    raw_b = _ink_mask(current, native_w, native_h)
    best = ScrollJoin("gap")
    best_value = 999.0
    radius = max(5, round(native_h / height * 2))
    for _, direction, coarse_shift in distinct:
        center = round(coarse_shift * native_h / height)
        for shift in range(max(3, center-radius), min(native_h-8, center+radius) + 1):
            aa = raw_a.crop((0, shift, native_w, native_h)) if direction == "down" else raw_a.crop((0, 0, native_w, native_h-shift))
            bb = raw_b.crop((0, 0, native_w, native_h-shift)) if direction == "down" else raw_b.crop((0, shift, native_w, native_h))
            ink = _ink_count(aa) + _ink_count(bb)
            if ink < max(120, native_w * (native_h-shift) * .009):
                continue
            mismatch = _ink_count(ImageChops.difference(aa, bb)) / ink
            value = mismatch + .01 * shift / native_h
            if value < best_value:
                best_value = value
                best = ScrollJoin(direction, shift, mismatch)
    # Deliberately conservative: a false alarm can be reviewed, missing text
    # must never be silently declared a seamless image join.
    return best if best.score <= .035 else ScrollJoin("gap", score=best.score)


def _load_images(image_paths: Iterable[str | Path]) -> list[Image.Image]:
    images = []
    for path in image_paths:
        with Image.open(path) as image:
            images.append(image.convert("RGB"))
    return images


def inspect_page_images(image_paths: Iterable[str | Path], *,
                        preview: bool = True) -> tuple[Image.Image | None, list[dict]]:
    """Stitch only proven vertical joins; display gaps visibly, NEVER fill them.

    Returns (mosaic, joins). The picture may not prove its own TOP/BOTTOM: that
    requires an explicit user confirmation before a screen page is approved.
    A PDF full-page render is a single image, not an attempted scroll mosaic.
    """
    images = _load_images(image_paths)
    if not images:
        return None, []
    pieces = [images[0]]
    joins = []
    previous = images[0]
    previous_y = 0
    end = images[0].height
    for index, image in enumerate(images[1:], 2):
        relation = compare_scroll_frames(previous, image)
        row = {"frame": index, "direction": relation.direction,
               "shift": relation.shift, "score": round(relation.score, 3)}
        joins.append(row)
        if relation.direction in ("down", "up"):
            new_y = previous_y + (relation.shift if relation.direction == "down" else -relation.shift)
            if new_y < 0:
                row["direction"] = "gap"
                row["reason"] = "Scrolled above the first captured page fragment"
            elif new_y > end:
                row["direction"] = "gap"
                row["reason"] = "Unseen pixels between captured fragments"
            else:
                if preview and new_y + image.height > end:
                    pieces.append(image.crop((0, end - new_y, image.width, image.height)))
                end = max(end, new_y + image.height)
                previous_y = new_y
                previous = image
                continue
        elif relation.direction == "same":
            previous = image
            continue
        # Do not disguise a lost interval with a seamless-looking join.
        if preview:
            separator = Image.new("RGB", (images[0].width, 32), "#ffc67e")
            pieces.extend((separator, image))
        end += 32 + image.height
        previous_y = end - image.height
        previous = image
    if not preview:
        return None, joins
    width = max(piece.width for piece in pieces)
    height = sum(piece.height for piece in pieces)
    # Do the overlap check above at NATIVE resolution. Only its display copy
    # is downscaled to keep huge genuine scrolling pages previewable in Tk.
    # Users can still inspect each original full-resolution frame in Review.
    scale = min(1.0, 2000 / width, 16000 / height,
                (24_000_000 / (width * height)) ** .5)
    if scale < 1:
        resized = []
        for part in pieces:
            gap_band = part.height == 32 and part.getpixel((0, 0)) == (255, 198, 126)
            target = (max(1, round(part.width * scale)),
                      max(8 if gap_band else 1, round(part.height * scale)))
            resized.append(part.resize(target, Image.Resampling.LANCZOS))
        pieces = resized
        width = max(piece.width for piece in pieces)
        height = sum(piece.height for piece in pieces)
    mosaic = Image.new("RGB", (width, height), "white")
    y = 0
    for part in pieces:
        mosaic.paste(part, (0, y))
        y += part.height
    return mosaic, joins
