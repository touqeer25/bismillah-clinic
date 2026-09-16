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

import re
from collections import defaultdict
from typing import Dict, List, Optional

from . import rubric_mapper
from .rubric_mapper import RubricIndex, get_index
from .sources import RepertorySource, get_sources

# نسخہ 2.4: تشخیی نفی — "no organic lesion discovered" جیسی باتیں علامت نہیں، رپورٹ ہے
# ادھوری علامت کے شروع ہونے والے الفاظ (اسے پچھلی علامت کے ساتھ جوڑ دیں)
_FRAGMENT_START = (
    "especially", "specially", "particularly", "mainly", "mostly", "only",
    "also", "and", "or", "more", "less", "again", "now", "but", "however",
    "sometimes", "occasionally", "frequently", "usually", "generally",
    "first", "then", "after", "before", "during", "while", "with", "without",
    "left", "right", "both", "the same",
)

_NEG_FINDING_RX = re.compile(
    r"\bno (organic|abnormality|abnormal|lesion|pathology|lesions)\b"
    r"|\bnothing (abnormal|found|wrong)\b|\bno abnormality\b"
    r"|\bnormal (examination|auscultation|exam|x-ray|ecg|echo|investigations?)\b"
    r"|\bnothing significant\b",
    re.I,
)


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
try:
    from homeo_core.engine.word_policy import _NARRATIVE_WORDS as _NARRATIVE
    from homeo_core.engine.word_policy import classify_words
    from homeo_core.engine.word_policy import RepertoryVocabulary
except Exception:  # احتیاطی محفوظ صورت
    _NARRATIVE = set()
    classify_words = None
    RepertoryVocabulary = None


def repertorize_multi(
    symptoms: List[str],
    source_names: Optional[List[str]] = None,
    dimension_weights: Optional[Dict[str, float]] = None,
    use_llm: bool = True,
    min_grade: int = 1,
    top_rubrics_per_symptom: int = 4,
    symptom_weights: Optional[Dict[str, float]] = None,
) -> Dict:
    """
    مکمل پائپ لائن: علامات → (ہر سورس پر) ربرکس → اسکورنگ → رینکنگ (نسخہ 2.1)

    نئی خصوصیات:
      - symptom_weights: خاص/کاریکٹرسٹک علامتوں کو اضافی وزن (مثلاً 1.5)
      - پرت کی حد: ہر (علامت × جہت) میں صرف ٹاپ 2 ربرکس پورا وزن لیتے ہیں،
        باقی آدھا — تاکہ ایک علامت کا ایک جہت پر بے جا قبضہ نہ ہو

    واپسی: {
        "remedies": [ {remedy, score, rubric_count, avg_grade, sources, source_count, rubrics} ],
        "rubrics_used": [ ... چنے گئے ربرکس ... ],
        "sources": [source names],
    }
    """
    weights = dimension_weights or DEFAULT_DIMENSION_WEIGHTS
    sources = get_sources(source_names)
    sw = symptom_weights or {}

    # نسخہ 2.4: علامات کی چھانٹی — مکرر ہٹائیں، تشخیصی نفی الگ کریں
    orig_symptoms: List[str] = [str(x) for x in symptoms if str(x).strip()]

    # نسخہ 3.6: پہلے علامت کو مکمل کریں، پھر ربرک ڈھونڈیں
    #   (مقام · سینسیشن · موڈیلٹی · سمت · کمی/زیادتی · پھیلاؤ — ٹکڑے اپنی علامت میں ضم)
    symptom_parts: List[dict] = []
    symptom_questions: List[str] = []
    try:
        from homeo_core.engine.symptom_builder import build_symptoms as _build
        built = _build(orig_symptoms)
        if built.get("symptoms"):
            symptoms = [b["complete"] for b in built["symptoms"]]
            symptom_parts = built["symptoms"]
            symptom_questions = built.get("questions", [])
    except Exception:
        pass

    # نسخہ 4.0: کینٹ/ٹائلر کی درجہ بندی — ذہنی (1) → جنرل (2) → خواہش/نفرت (3) → حیض (4) → پارٹیکولر (5)
    case_grading: dict = {}
    try:
        from homeo_core.engine.symptom_grading import grade_case as _grade_case, thermal_lean as _lean
        _parts_map = {b["symptom"]: b.get("parts") for b in (symptom_parts or [])}
        case_grading = _grade_case(list(symptoms), _parts_map)
    except Exception:
        case_grading = {}

    seen_sym = set()
    clean_symptoms: List[str] = []
    skipped: List[dict] = []
    # نسخہ 3.3: جو سطریں ربرک بنانے کے لیے نہیں رکھی گئیں (معائنہ/تشخیصی نفی/مکرر) —
    # اُن کے الفاظ «کہانی» ہیں، فہرست میں نہیں آئیں گے
    story_syms: List[str] = []
    for sym in symptoms:
        s_norm = " ".join(str(sym).lower().split())
        if not s_norm:
            continue
        if _NEG_FINDING_RX.search(s_norm):
            skipped.append({
                "symptom": sym,
                "reason": "تشخیصی نفی — یہ علامت نہیں، معائنے کی اطلاع ہے",
            })
            story_syms.append(str(sym))
            continue
        if s_norm in seen_sym:
            skipped.append({"symptom": sym, "reason": "مکرر علامت — ایک ہی بار گنی گئی"})
            story_syms.append(str(sym))
            continue
        seen_sym.add(s_norm)
        clean_symptoms.append(sym)

    # ادھوری علامت (مثلاً "especially the right") → پچھلی علامت میں ضم کر دیں
    # (نسخہ 3.6: اگر علامت مکمل کرنے والا مرحلہ چل چکا ہو تو یہ پرانا قاعدہ بند رہے —
    #  ورنہ «violent palpitation» جیسی دو لفظوں والی مکمل علامت بھی ضم ہو جاتی ہے)
    merged: List[str] = []
    if symptom_parts:
        merged = list(clean_symptoms)
    for sym in ([] if symptom_parts else clean_symptoms):
        words = str(sym).split()
        is_frag = bool(merged) and (
            (len(words) <= 4 and str(sym).strip().lower().startswith(_FRAGMENT_START))
            or len(words) <= 2
        )
        if is_frag:
            merged[-1] = f"{merged[-1]}, {sym}"
        else:
            merged.append(sym)
    symptoms = merged

    remedy_scores: Dict[str, float] = defaultdict(float)
    remedy_rubrics: Dict[str, List[dict]] = defaultdict(list)
    remedy_sources: Dict[str, set] = defaultdict(set)
    rubrics_used = []
    # نسخہ 3.4: رد شدہ ربرکیں (شرط ادھوری / الٹا رخ / الٹی سمت / دوسرا عضو)
    rejected_rubrics: List[dict] = []
    seen_kept: set = set()

    # نسخہ 4.3: کیس کا نمایاں عضو (موڈیلٹی والی علامتوں کے لیے)
    _dom_region = ""
    try:
        from homeo_core.engine.rubric_mapper import _REGION as _RG
        _freq: Dict[str, int] = defaultdict(int)
        for _s in symptoms:
            for _w in re.findall(r"[a-z-]{3,}", str(_s).lower()):
                _r = _RG.get(_w) or _RG.get(_w.rstrip("s"))
                if _r and _r not in ("upper", "lower"):
                    _freq[_r] += 1
        if _freq:
            _dom_region = max(_freq.items(), key=lambda kv: kv[1])[0]
    except Exception:
        _dom_region = ""
    _MODALITY_RX = re.compile(r"^\s*(worse|better|agg|amel|aggravat|ameliorat)", re.I)

    for src in sources:
        for sym in symptoms:
            if not str(sym).strip():
                continue
            # موڈیلٹی کی علامت: تلاش میں کیس کا عضو بھی شامل کریں
            _st = None
            _mo = ""
            _mp = ""
            _mr = ""
            if _MODALITY_RX.match(str(sym)):
                _sraw = str(sym).lower()
                _mp = "amel" if re.match(r"\s*(better|amel)", _sraw) else "agg"
                try:
                    from homeo_core.engine.symptom_builder import _condition_object
                    _mo = _condition_object(_sraw)
                except Exception:
                    _mo = ""
                _mr = _dom_region
            sym_weight = float(sw.get(sym, 1.0) or 1.0)  # خاص علامت کا اضافی وزن
            # نسخہ 4.0: درجے کا وزن (ذہنی 3.0 · جنرل 2.2 · خواہش 1.6 · حیض 1.3 · پارٹ 1.0)
            if case_grading.get("weights"):
                gsum = case_grading["weights"]
                sym_weight *= float(
                    gsum.get(sym)
                    or next((v for k, v in gsum.items() if sym.startswith(k) or k.startswith(sym[:24])), 1.0)
                    or 1.0)
            rej_tmp: List[dict] = []
            matches = rubric_mapper.map_symptom_deep(
                sym, index=src.index, top_k=top_rubrics_per_symptom, use_llm=use_llm,
                reject_log=rej_tmp, search_text=_st,
                modality_obj=_mo, modality_pol=_mp, case_region=_mr,
            )
            for rj in rej_tmp:
                rejected_rubrics.append({"symptom": sym, "source": src.name, **rj})
            # مکرر (سورس + ربرک + علامت) ایک بار
            uniq = []
            for m in matches:
                key3 = (src.name, m.get("text") or m.get("rubric_id"), sym)
                if key3 in seen_kept:
                    continue
                seen_kept.add(key3)
                uniq.append(m)
            matches = uniq
            # پرت کی حد: جہت کی بنیاد پر گروپ، ٹاپ 2 پورا وزن
            by_dim: Dict[str, List[dict]] = {}
            for m in matches:
                rid = m["rubric_id"]
                if rid not in src.index.rubrics:
                    continue
                dim = src.index.dimensions(src.index.rubrics[rid]["chapter"])
                by_dim.setdefault(dim, []).append(m)

            for dim, mlist in by_dim.items():
                mlist.sort(key=lambda m: -float(m.get("confidence", 1.0) or 1.0))
                for pos, m in enumerate(mlist):
                    cap_factor = 1.0 if pos < 2 else 0.5  # باقی آدھا وزن
                    rid = m["rubric_id"]
                    rb = src.index.rubrics[rid]
                    weight = weights.get(dim, weights.get("particulars", 1.0))
                    confidence = float(m.get("confidence", 1.0) or 1.0) * cap_factor

                    raw = src.index.load_rubric(rid)
                    grades = raw.get("r", {}) if raw else {}

                    rubrics_used.append({
                        "symptom": sym,
                        "rubric": rb["t"],
                        "chapter": rb["chapter"],
                        "dimension": dim,
                        "source": src.name,
                        "confidence": confidence,
                        "score": m.get("score"),
                        "coverage": m.get("coverage"),
                        "matched": m.get("matched", []),
                        "rationale": m.get("rationale", ""),
                    })

                    for remedy, grade in grades.items():
                        if grade < min_grade:
                            continue
                        remedy = src.normalize_remedy(remedy)
                        g_norm = src.normalize_grade(grade)
                        # نسخہ 4.2: کینٹ کی اپنی ریپرٹری بنیاد ہے (ٹائلر-ویر کے حوالے کینٹ کے صفحات ہیں)
                        src_factor = {"kent": 1.0, "synthesis": 0.8, "general": 0.7,
                                      "kent_de": 0.5}.get(src.name, 0.8)
                        contribution = g_norm * float(weight) * confidence * sym_weight * src_factor
                        remedy_scores[remedy] += contribution
                        remedy_sources[remedy].add(src.name)
                        remedy_rubrics[remedy].append({
                            "rubric": rb["t"],
                            "symptom": sym,
                            "chapter": rb["chapter"],
                            "dimension": dim,
                            "grade": grade,
                            "grade_norm": g_norm,
                            "weight": weight,
                            "confidence": confidence,
                            "contribution": round(contribution, 2),
                            "source": src.name,
                            "characteristic": sym_weight > 1.0,
                        })

    results = _finalize(remedy_scores, remedy_rubrics, remedy_sources)

    # نسخہ 4.0: «eliminating symptom» — نمایاں جنرل (مثلاً گرمی سے بگاڑ) سے مخالف مزاج
    # کی دوائیں شروع ہی میں خارج کر دی جاتی ہیں (کینٹ: "ruthlessly cut out").
    # خارج شدہ دوائیں چھپائی نہیں جاتیں — معالج کے سامنے دکھائی جاتی ہیں۔
    eliminated_remedies: List[dict] = []
    try:
        from homeo_core.engine.symptom_grading import (build_thermal_profile, thermal_lean as _tl,
                                                       thermal_source as _src)
        # نسخہ 4.1: راستہ خود ماڈیول سے لیا جاتا ہے (پہلے sources کا راستہ غلط نکلتا تھا
        # اور ریپرٹری کا اندازہ خالی آ رہا تھا)
        prof = build_thermal_profile()
        want = None
        for el in (case_grading.get("eliminating") or []):
            if el.get("kind") == "heat":
                want = "chilly"      # مریض گرمی سے بگڑتا ہے → سرد مزاج دوائیں خارج
            elif el.get("kind") == "cold":
                want = "warm"        # مریض سردی سے بگڑتا ہے → گرم مزاج دوائیں خارج
            if want:
                break
        if want:
            kept = []
            for r in results:
                lean, strength = _tl(prof, r["remedy"])
                if lean == want and strength >= 0.5:
                    eliminated_remedies.append({**r, "lean": lean, "why": "eliminating symptom",
                                                "src": _src(r["remedy"])})
                else:
                    kept.append(r)
            if kept:
                results = kept
    except Exception:
        eliminated_remedies = []

    # نسخہ 2.4: جو علامات کوئی ربرک نہ بنا سکیں، اُن کی وجہ کے ساتھ فہرست
    matched_syms = {ru["symptom"] for ru in rubrics_used}
    if sources:
        for sym in symptoms:
            if sym in matched_syms:
                continue
            near = ""
            why = ""
            for rj in rejected_rubrics:
                if rj.get("symptom") == sym:
                    why = f'ربرکیں شرطِ ادھوری کی وجہ سے رد: {rj.get("why", "")}'
                    near = rj.get("rubric", "")
                    break
            if not why:
                try:
                    exp = sources[0].index.explain(sym, top_k=1)
                    why = exp.get("reason") or "قریب ترین ربرک نہیں ملا"
                    near = exp.get("nearest") or ""
                except Exception:
                    why, near = "قریب ترین ربرک نہیں ملا", ""
            skipped.append({"symptom": sym, "reason": why, "nearest": near})

    # نسخہ 3.3: مریض اور پروور کا فرق
    #   مریض عام آدمی ہے — اُس کے تمام الفاظ کا ریپرٹری میں ہونا ضروری نہیں۔
    #   اِس فہرست میں صرف وہی الفاظ آتے ہیں جو ربرک کی زبان میں نہ بیٹھ سکے («بےجگہ»)۔
    #   کہانی/معائنے/گنتی کے الفاظ اپنی جگہ درست ہیں — اُنہیں شمار کیا جاتا ہے، دکھایا نہیں جاتا۔
    unmatched: List[dict] = []
    case_words = {"total": 0, "known": 0, "story": 0, "unplaced": 0}
    if sources:
        seen_w = set()
        try:
            vocab = None
            if RepertoryVocabulary is not None:
                repo = (getattr(sources[0], "repo_dir", None)
                        or getattr(sources[0].index, "repo_dir", None)
                        or getattr(sources[0].index, "data_dir", None))
                if repo:
                    vocab = RepertoryVocabulary(repo)
        except Exception:
            vocab = None
        for sym in orig_symptoms:
            try:
                if vocab is not None and classify_words is not None and sym not in story_syms:
                    cl = classify_words(sym, vocab)
                    case_words["total"] += cl["total"]
                    case_words["known"] += len(cl["known"])
                    case_words["story"] += len(cl["narrative"])
                    words, is_story = cl["unplaced"], False
                else:
                    # پرانا راستہ: ریپرٹری انڈیکس سے غیر موجود الفاظ، کہانی کے فلٹر کے ساتھ
                    words = []
                    for item in sources[0].index.unmatched_words(sym):
                        w = str(item.get("word", ""))
                        if w.lower() in _NARRATIVE or sym in story_syms or len(w) <= 2 or w.isdigit():
                            case_words["story"] += 1
                            continue
                        words.append(w)
                    case_words["total"] += len(words)
                    case_words["story"] += 0
                    is_story = sym in story_syms
                landed = sym in matched_syms
                added = 0
                for w in words:
                    key = (w, )
                    if key in seen_w:
                        continue
                    seen_w.add(key)
                    added += 1
                    cands = []
                    try:
                        cands = sources[0].index._spelling_candidates(w)
                    except Exception:
                        cands = []
                    unmatched.append({"symptom": sym, "word": w, "landed": landed,
                                      "spelling_candidates": cands})
                case_words["unplaced"] += added
            except Exception:
                pass
        if case_words["known"] + case_words["story"] + case_words["unplaced"] != case_words["total"]:
            case_words["known"] = max(0, case_words["total"] - case_words["story"] - case_words["unplaced"])

    return {
        "remedies": results,
        "rubrics_used": rubrics_used,
        "sources": [s.name for s in sources],
        "skipped": skipped,
        "unmatched_words": unmatched,
        "rejected_rubrics": rejected_rubrics,
        "symptom_parts": symptom_parts,        # نسخہ 3.6: مکمل علامات کے اجزاء
        "symptom_questions": symptom_questions, # نسخہ 3.6: خالی خانوں کے سوالات
        "case_grading": case_grading,           # نسخہ 4.0: کینٹ کی درجہ بندی + eliminating + تضاد
        "eliminated_remedies": eliminated_remedies,  # نسخہ 4.0: خارج کی گئی دوائیں (وجہ کے ساتھ)
        "case_words": case_words,
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
