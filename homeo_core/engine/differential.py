"""
differential.py — تفریق میٹرکس (قریب ترین دواؤں کا فرق)
------------------------------------------------------
ٹاپ ادویات میں سے وہ ربرکس تلاش کرتا ہے جو صرف بعض ادویات میں موجود ہوں
(امتیازی ربرکس) — تاکہ فرق واضح ہو سکے۔
"""

from __future__ import annotations

from typing import Dict, List


def build_differential_matrix(
    ranked_remedies: List[dict],
    top_n: int = 4,
    max_rows: int = 8,
) -> Dict:
    """
    ranked_remedies: repertorizer.repertorize() کا نتیجہ
    واپسی: {"remedies": [...], "rows": [{rubric, dimension, cells:{remedy: grade}}]}
    """
    remedies = ranked_remedies[:top_n]
    remedy_names = [r["remedy"] for r in remedies]

    # ہر ربرک: کن ادویات میں موجود؟
    rubric_presence: Dict[str, Dict[str, int]] = {}
    rubric_meta: Dict[str, tuple] = {}
    for r in remedies:
        for rub in r.get("rubrics", []):
            key = rub.get("rubric")
            presence = rubric_presence.setdefault(key, {})
            presence[r["remedy"]] = rub.get("grade", 1)
            rubric_meta[key] = (rub.get("dimension", "particulars"), rub.get("chapter", ""))

    # امتیازی ربرکس: جہاں سب ادویات نہیں بلکہ صرف بعض موجود ہوں
    rows = []
    for key, presence in rubric_presence.items():
        n = len(presence)
        if 0 < n < len(remedies):  # امتیازی — سب میں نہیں
            dim, chapter = rubric_meta[key]
            rows.append({
                "rubric": key,
                "dimension": dim,
                "chapter": chapter,
                "cells": {rem: presence.get(rem, 0) for rem in remedy_names},
                "discriminates": n,
            })

    # پہلے وہ ربرکس جو سب سے کم ادویات میں ہیں (سب سے امتیازی)
    rows.sort(key=lambda r: (r["discriminates"],))
    rows = rows[:max_rows]

    return {"remedies": remedy_names, "rows": rows}


def render_matrix(matrix: Dict) -> str:
    """متن میں تفریق میٹرکس بنانا (رپورٹ/ڈیبگ)"""
    if not matrix["rows"]:
        return "(کافی امتیازی ربرکس نہیں ملے)"
    header = "Rubric | " + " | ".join(matrix["remedies"])
    lines = [header, "-" * len(header)]
    for row in matrix["rows"]:
        cells = " | ".join(str(row["cells"].get(r, "—")) for r in matrix["remedies"])
        lines.append(f"{row['rubric'][:40]:<40} | {cells}")
    return "\n".join(lines)
