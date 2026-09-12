"""
repertorizer.py — ریپرٹورائزیشن انجن (نظام کا دل)
-----------------------------------------------
علامات → ربرکس → گریڈنگ (نارملائزڈ) → عددی اسکور → رینک شدہ ادویات

نسخہ 2.0 خصوصیات:
  - ملٹی سورس (کینٹ + سنتھیسس + عمومی) — ایک دوا متعدد ریپرٹریز میں ملے تو اعتماد بڑھتا ہے
  - درجہ نارملائزیشن (سنتھیسس کا 1-4 اسکیل کینٹ کے 1-3 اسکیل میں)
  - ایل ایل ایم اعتماد کی ویٹنگ — ربرک کا انتخاب جتنا پراعتماد، اتنا وزن

اسکور فارمولا:
    دوا کا اسکور = Σ (نارمل درجہ × جہت کا وزن × ربرک کا اعتماد)
"""

from __future__ import annotations

from collections import defaultdict
from typing import Dict, List, Optional

from . import rubric_mapper
from .rubric_mapper import RubricIndex, get_index
from .sources import RepertorySource, get_sources

# ڈیفالٹ جہتی وزن (کنفیگریشن سے اوور رائیڈ ہو سکتے ہیں)
DEFAULT_DIMENSION_WEIGHTS = {
    "mind": 3.0,
    "generals": 2.5,
    "modalities": 3.0,
    "particulars": 1.5,
    "causation": 2.5,
    "concomitants": 1.5,
}


# ------------------------------------------------------------------ #
# ایک سورس پر (پسماندہ مطابقت)
# ------------------------------------------------------------------ #
def repertorize(
    matched_rubrics: List[dict],
    dimension_weights: Optional[Dict[str, float]] = None,
    index: Optional[RubricIndex] = None,
    min_grade: int = 1,
) -> List[dict]:
    """
    matched_rubrics: ہر آئٹم میں "rubric_id" (اور اختیاری "confidence") ہونا چاہیے۔
    """
    weights = dimension_weights or DEFAULT_DIMENSION_WEIGHTS
    idx = index or get_index()

    remedy_scores: Dict[str, float] = defaultdict(float)
    remedy_rubrics: Dict[str, List[dict]] = defaultdict(list)

    for mr in matched_rubrics:
        rid = mr.get("rubric_id")
        if not rid or rid not in idx.rubrics:
            continue
        rb = idx.rubrics[rid]
        chapter = rb["chapter"]
        dim = idx.dimensions(chapter)
        weight = weights.get(dim, weights.get("particulars", 1.0))
        confidence = float(mr.get("confidence", 1.0) or 1.0)

        grades: Dict[str, int] = mr.get("grades")
        if grades is None:
            raw = idx.load_rubric(rid)
            grades = raw.get("r", {}) if raw else {}

        for remedy, grade in grades.items():
            if grade < min_grade:
                continue
            contribution = float(grade) * float(weight) * confidence
            remedy_scores[remedy] += contribution
            remedy_rubrics[remedy].append({
                "rubric": rb["t"],
                "chapter": chapter,
                "dimension": dim,
                "grade": grade,
                "weight": weight,
                "confidence": confidence,
                "contribution": round(contribution, 2),
                "source": idx.name,
            })

    return _finalize(remedy_scores, remedy_rubrics)


# ------------------------------------------------------------------ #
# ملٹی سورس ریپرٹورائزیشن (تجویز کردہ راستہ)
# ------------------------------------------------------------------ #
def repertorize_multi(
    symptoms: List[str],
    source_names: Optional[List[str]] = None,
    dimension_weights: Optional[Dict[str, float]] = None,
    use_llm: bool = True,
    min_grade: int = 1,
    top_rubrics_per_symptom: int = 4,
) -> Dict:
    """
    مکمل پائپ لائن: علامات → (ہر سورس پر) ربرکس → اسکورنگ → رینکنگ

    واپسی: {
        "remedies": [ {remedy, score, rubric_count, avg_grade, sources, source_count, rubrics} ],
        "rubrics_used": [ ... چنے گئے ربرکس ... ],
        "sources": [source names],
    }
    """
    weights = dimension_weights or DEFAULT_DIMENSION_WEIGHTS
    sources = get_sources(source_names)

    remedy_scores: Dict[str, float] = defaultdict(float)
    remedy_rubrics: Dict[str, List[dict]] = defaultdict(list)
    remedy_sources: Dict[str, set] = defaultdict(set)
    rubrics_used = []

    for src in sources:
        for sym in symptoms:
            if not str(sym).strip():
                continue
            matches = rubric_mapper.map_symptom_deep(
                sym, index=src.index, top_k=top_rubrics_per_symptom, use_llm=use_llm
            )
            for m in matches:
                rid = m["rubric_id"]
                if rid not in src.index.rubrics:
                    continue
                rb = src.index.rubrics[rid]
                dim = src.index.dimensions(rb["chapter"])
                weight = weights.get(dim, weights.get("particulars", 1.0))
                confidence = float(m.get("confidence", 1.0) or 1.0)

                raw = src.index.load_rubric(rid)
                grades = raw.get("r", {}) if raw else {}

                rubrics_used.append({
                    "symptom": sym,
                    "rubric": rb["t"],
                    "chapter": rb["chapter"],
                    "dimension": dim,
                    "source": src.name,
                    "confidence": confidence,
                    "rationale": m.get("rationale", ""),
                })

                for remedy, grade in grades.items():
                    if grade < min_grade:
                        continue
                    remedy = src.normalize_remedy(remedy)
                    g_norm = src.normalize_grade(grade)
                    contribution = g_norm * float(weight) * confidence
                    remedy_scores[remedy] += contribution
                    remedy_sources[remedy].add(src.name)
                    remedy_rubrics[remedy].append({
                        "rubric": rb["t"],
                        "chapter": rb["chapter"],
                        "dimension": dim,
                        "grade": grade,
                        "grade_norm": g_norm,
                        "weight": weight,
                        "confidence": confidence,
                        "contribution": round(contribution, 2),
                        "source": src.name,
                    })

    results = _finalize(remedy_scores, remedy_rubrics, remedy_sources)
    return {
        "remedies": results,
        "rubrics_used": rubrics_used,
        "sources": [s.name for s in sources],
    }


# ------------------------------------------------------------------ #
# مشترکہ نتیجہ سازی
# ------------------------------------------------------------------ #
def _finalize(
    remedy_scores: Dict[str, float],
    remedy_rubrics: Dict[str, List[dict]],
    remedy_sources: Optional[Dict[str, set]] = None,
) -> List[dict]:
    results = []
    for remedy, score in remedy_scores.items():
        rubs = remedy_rubrics[remedy]
        grades_list = [r["grade"] for r in rubs]
        srcs = sorted(remedy_sources.get(remedy, set())) if remedy_sources else []
        results.append({
            "remedy": remedy,
            "score": round(score, 2),
            "rubric_count": len(rubs),
            "avg_grade": round(sum(grades_list) / len(grades_list), 2),
            "sources": srcs,
            "source_count": len(srcs),
            "rubrics": rubs,
        })

    # اسکور ← ربرکس تعداد ← سورس تعداد ← اوسط درجہ
    results.sort(key=lambda r: (-r["score"], -r["rubric_count"], -r["source_count"], -r["avg_grade"]))
    return results


def top_remedies(results: List[dict], n: int = 5) -> List[dict]:
    return results[:n]


def score_table(results: List[dict]) -> str:
    """نتیجے کو پڑھنے کے قابل متنی جدول میں بدلنا (ڈیبگ/رپورٹ)"""
    if not results:
        return "(کوئی نتیجہ نہیں)"
    lines = ["Remedy | Score | Rubrics | Sources | Avg Grade", "-" * 52]
    for r in results[:10]:
        lines.append(
            f"{r['remedy']:<12} | {r['score']:>6} | {r['rubric_count']:>7} | "
            f"{','.join(r.get('sources', [])):<12} | {r['avg_grade']:>10}"
        )
    return "\n".join(lines)
