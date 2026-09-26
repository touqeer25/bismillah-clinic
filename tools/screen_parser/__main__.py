"""Run: python -m tools.screen_parser [--image page.png --profile prescriber]."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from . import engine, ocr


def main():
    p = argparse.ArgumentParser(description="Bismillah Windows Screen Parser (English, local OCR)")
    p.add_argument("--image", type=Path, help="Headless OCR/check a single existing screenshot; no data is saved")
    p.add_argument("--profile", choices=engine.PROFILES, default="prescriber")
    p.add_argument("--columns", type=int, choices=(1, 2), default=1)
    p.add_argument("--pdf", type=Path, help="Open a local PDF page instead of a screenshot (optional PyMuPDF)")
    p.add_argument("--page", type=int, default=1, help="Physical PDF page (1-based)")
    p.add_argument("--data-dir", type=Path, help="Override the durable local book/session folder")
    args = p.parse_args()
    if args.image and args.pdf:
        p.error("Select an image OR a PDF, not both")
    if args.image or args.pdf:
        from PIL import Image
        if args.pdf:
            _img, scan, _total = ocr.scan_pdf_page(str(args.pdf), args.page, args.columns)
        else:
            with Image.open(args.image) as raw_image:
                scan = ocr.ocr_columns(raw_image, args.columns)
        names = engine.read_remedy_names(Path(__file__).resolve().parents[2])
        parsed, problems = engine.check_page(args.profile, scan["text"], scan["second"], names,
                                             scanned_lines=[l for col in scan["columns"] for l in col],
                                             low_confidence=scan["low_confidence"])
        print(json.dumps({"text": scan["text"], "parsed": parsed, "issues": problems},
                         ensure_ascii=False, indent=2))
        return 0 if not problems else 2
    from .app import launch
    launch(data_dir=args.data_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
