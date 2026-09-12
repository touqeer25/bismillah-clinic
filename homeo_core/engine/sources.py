"""
sources.py — ریپرٹری سورسز (کینٹ + سنتھیسس 9.1 + عمومی)
--------------------------------------------------------
ہر ریپرٹری ایک "سورس" ہے۔ ایک ہی انجن متعدد سورسز پر چلتا ہے۔

فرق:
  kent       — درجہ 1-3، چھوٹے حروف کے مخففات (hep, bry)
  synthesis  — درجہ 1-4، path + sources فیلڈز، چھوٹے حروف کے مخففات
  general    — درجہ 1-3، بڑے حروف کے نام ("Hep.") → خودکار چھوٹے حروف میں

درجہ بندی کو ایک مشترکہ 3-اسکیل پر نارمل کیا جاتا ہے:
  synthesis کا درجہ 4 → 3.0، درجہ 3 → 2.25، درجہ 2 → 1.5، درجہ 1 → 0.75
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional

from .rubric_mapper import RubricIndex

ROOT = Path(__file__).resolve().parents[2]  # bismillah-clinic/ کا راستہ

SOURCE_DEFS = {
    "kent": {
        "dir": "kent_chapters",
        "grade_max": 3,
        "label": {"ur": "کینٹ ریپرٹری", "en": "Kent Repertory"},
        "remedy_style": "lower",
    },
    "synthesis": {
        "dir": "synthesis91_raw_chapters",
        "grade_max": 4,
        "label": {"ur": "سنتھیسس 9.1", "en": "Synthesis 9.1"},
        "remedy_style": "lower",
    },
    "general": {
        "dir": "repertory_chapters",
        "grade_max": 3,
        "label": {"ur": "عمومی ریپرٹری", "en": "General Repertory"},
        "remedy_style": "capitalized",  # "Hep." → "hep"
    },
}


class RepertorySource:
    """ایک ریپرٹری سورس — ڈیٹا ڈائریکٹری + درجہ اسکیل + نام کی مطابقت"""

    def __init__(self, name: str):
        if name not in SOURCE_DEFS:
            raise KeyError(f"نامعلوم ریپرٹری سورس: {name}")
        d = SOURCE_DEFS[name]
        self.name = name
        self.grade_max = d["grade_max"]
        self.label = d["label"]
        self.remedy_style = d["remedy_style"]
        self.data_dir = ROOT / d["dir"]
        self.index = RubricIndex(
            data_dir=self.data_dir, name=name, grade_max=self.grade_max
        )

    def normalize_remedy(self, remedy: str) -> str:
        """دوا کے نام کو ایک مشترکہ شکل میں لانا (چھوٹے حروف، بغیر نقطے)"""
        r = str(remedy).strip()
        if self.remedy_style == "capitalized":
            r = r.lower().replace(".", "")
        return r

    def normalize_grade(self, grade: int) -> float:
        """درجے کو 3-اسکیل پر لانا"""
        if self.grade_max == 3:
            return float(grade)
        return round(grade * 3.0 / self.grade_max, 2)

    def search(self, symptom: str, top_k: int = 5) -> List[dict]:
        return self.index.search(symptom, top_k=top_k)


# ------------------------------------------------------------------ #
# سنگلٹن رجسٹری — ہر سورس ایک بار لوڈ ہو
# ------------------------------------------------------------------ #
_sources: Dict[str, RepertorySource] = {}


def get_source(name: str) -> RepertorySource:
    if name not in _sources:
        _sources[name] = RepertorySource(name)
    return _sources[name]


def get_sources(names: Optional[List[str]] = None) -> List[RepertorySource]:
    """درخواست کردہ سورسز (یا تمام دستیاب)"""
    if names is None:
        names = list(SOURCE_DEFS.keys())
    return [get_source(n) for n in names]


def all_sources() -> List[RepertorySource]:
    return get_sources()


def source_labels() -> Dict[str, str]:
    return {k: v["label"]["ur"] for k, v in SOURCE_DEFS.items()}
