# -*- coding: utf-8 -*-
"""
rubric_notes.py — ربرک کے اردو معنی نوٹ (نسخہ 5.1 / تجویز ب)
=============================================================
صارف کا اصول: ہر ربرک کا اپنا مطلب ہوتا ہے — معالج کو ربرک کا مطلب
بغیر غلطی کے سمجھ آنا چاہیے۔ یہ ماڈیول glossary_en_ur.json سے:

  1) ربرک کے متن کے اہم الفاظ کے اردو معنی (annotate_rubric)
  2) حس-خاندانوں کے کلینیکل نوٹ («stitching» بمقابلہ «stinging» کا فرق)
     — glossary کے sense_notes سیکشن سے
  3) پورا تیار سطر (rubric_note) — UI میں براہِ راست دکھانے کے لیے

آف لائن — صرف لغت فائل پر انحصار (LSP پالسی: کوئی نیٹ ورک کال نہیں)۔
"""

from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Dict, List

_GLOSSARY_PATH = Path(__file__).resolve().parents[2] / "glossary_en_ur.json"


@lru_cache(maxsize=1)
def _gloss() -> tuple:
    """لغت لوڈ — ایک بار (words, sense_notes, grammar_phrases)"""
    try:
        g = json.loads(_GLOSSARY_PATH.read_text(encoding="utf-8"))
        return (g.get("words", {}), g.get("sense_notes", {}),
                g.get("grammar_phrases", {}))
    except Exception:
        return {}, {}, {}


_WORD_RX = re.compile(r"[a-z][a-z'\-]{2,}")


def annotate_rubric(text: str) -> Dict[str, str]:
    """ربرک کے متن کے اردو معنی — {انگریزی لفظ: اردو مطلب}
    ساختی الفاظ (with/like/…) اور نامعلوم الفاظ چھوٹ جاتے ہیں"""
    words, _senses, _phrases = _gloss()
    out: Dict[str, str] = {}
    for w in _WORD_RX.findall(str(text).lower()):
        e = words.get(w) or words.get(w.rstrip("s"))
        if e and e.get("ur") and str(e.get("part")) not in ("structural", "pending"):
            out.setdefault(w, str(e["ur"]))
    return out


def sense_note(text: str) -> str:
    """ربرک میں حس-خاندان کا لفظ ہو تو اُس کا کلینیکل نوٹ
    («stitching» = سوئی جیسی تیز چبھن — آنے جاتے کرتی ہے)"""
    _words, senses, _phrases = _gloss()
    low = str(text).lower()
    for key, note in senses.items():
        if re.search(r"\b" + re.escape(str(key)) + r"\b", low):
            return str(note)
    return ""


def rubric_note(text: str, max_words: int = 10) -> str:
    """پورا تیار سطر — «معنی: ناف — درد …» (UI کے لیے)"""
    ann = annotate_rubric(text)
    if not ann:
        return ""
    items = list(ann.items())[:max_words]
    return "، ".join(f"{en} = {ur}" for en, ur in items)


def annotate_symptom_candidates(symptom: str, candidates: List[dict]) -> List[dict]:
    """تصدیقی مرحلے کے امیدواروں کے ساتھ معنی نوٹ شامل"""
    out = []
    for c in candidates:
        c2 = dict(c)
        c2["note"] = rubric_note(str(c.get("text", "")))
        out.append(c2)
    return out
