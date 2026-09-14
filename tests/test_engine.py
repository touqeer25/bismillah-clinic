"""
tests/test_engine.py — homeo_core انجن کے بنیادی یونٹ ٹیسٹس
چلانے کا طریقہ:  python -m pytest tests/ -q
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


# ------------------------------------------------------------------ #
# درجہ نارملائزیشن + دوا کے نام
# ------------------------------------------------------------------ #
def test_grade_normalization_synthesis():
    from homeo_core.engine.sources import RepertorySource
    s = RepertorySource("synthesis", build_index=False)
    assert s.normalize_grade(4) == 3.0
    assert s.normalize_grade(3) == 2.25
    assert s.normalize_grade(2) == 1.5
    assert s.normalize_grade(1) == 0.75


def test_grade_normalization_kent():
    from homeo_core.engine.sources import RepertorySource
    s = RepertorySource("kent", build_index=False)
    assert s.normalize_grade(3) == 3.0
    assert s.normalize_grade(1) == 1.0


def test_remedy_normalization():
    from homeo_core.engine.sources import RepertorySource
    g = RepertorySource("general", build_index=False)
    assert g.normalize_remedy("Acon.") == "acon"
    assert g.normalize_remedy("Hep.") == "hep"
    k = RepertorySource("kent", build_index=False)
    assert k.normalize_remedy("acon") == "acon"


def test_kent_de_registered():
    from homeo_core.engine import sources
    assert "kent_de" in sources.SOURCE_DEFS
    assert sources.SOURCE_DEFS["kent_de"]["grade_max"] == 3
    opts = sources.source_options("ur")
    assert len(opts) == 4


# ------------------------------------------------------------------ #
# جہتی درجہ بندی (انگریزی + جرمن)
# ------------------------------------------------------------------ #
def test_dimensions():
    from homeo_core.engine.rubric_mapper import RubricIndex
    d = RubricIndex.dimensions
    assert d(None, "mind") == "mind"
    assert d(None, "gemuet") == "mind"           # جرمن ذہنی باب
    assert d(None, "generalities") == "generals"
    assert d(None, "allgemeines") == "generals"  # جرمن عمومی باب
    assert d(None, "cough") == "particulars"
    assert d(None, "husten") == "particulars"    # جرمن کھانسی


# ------------------------------------------------------------------ #
# ٹوکنائزیشن — رومن اردو، فقرے، نفی
# ------------------------------------------------------------------ #
def test_roman_urdu_tokens():
    from homeo_core.engine.rubric_mapper import _tokens_canonical
    toks = _tokens_canonical("sar ka dard")
    assert "head" in toks and "pain" in toks
    assert "pyas" not in toks
    assert "thirst" in _tokens_canonical("zyada pyas")


def test_urdu_modality_phrases():
    from homeo_core.engine.rubric_mapper import _tokens_canonical
    toks = _tokens_canonical("khansi se barhti hai raat ko")
    assert "cough" in toks
    assert "agg" in toks        # "se barhti" → agg
    assert "night" in toks      # "raat ko" → night
    toks2 = _tokens_canonical("dard se behtar hai subah ko")
    assert "amel" in toks2
    assert "morning" in toks2


def test_negation_tokens():
    from homeo_core.engine.rubric_mapper import _tokens_canonical
    toks = _tokens_canonical("pyas nahin")
    assert "no" in toks
    assert "thirst" in toks
    toks2 = _tokens_canonical("pasina bina")
    assert "no" in toks2
    assert "sweat" in toks2


# ------------------------------------------------------------------ #
# میازم
# ------------------------------------------------------------------ #
def test_miasm_dominant_tubercular():
    from homeo_core.engine import miasm
    profile = miasm.analyze_miasm([
        "weight loss", "recurring cold", "restless", "impatient",
    ])
    assert miasm.dominant_miasm(profile) == "tubercular"


def test_miasm_dominant_psora():
    from homeo_core.engine import miasm
    profile = miasm.analyze_miasm([
        "itching skin", "dryness", "anxiety", "constipation", "craving sweets",
    ])
    assert miasm.dominant_miasm(profile) == "psora"


def test_miasm_plain_cough_not_tubercular():
    """ایک عام کھانسی خود بخود ٹیوبرکولر نہیں بناتی (مرمت)"""
    from homeo_core.engine import miasm
    profile = miasm.analyze_miasm(["dry cough worse from motion"])
    assert profile["tubercular"]["raw"] == 0


def test_miasm_filter_boost():
    from homeo_core.engine import miasm
    remedies = [
        {"remedy": "ars", "score": 10.0},
        {"remedy": "calc", "score": 9.5},
    ]
    out = miasm.filter_by_miasm(remedies, "psora", boost=1.0)
    top = out[0]
    assert top["remedy"] == "calc"      # میازم بونس سے اوپر چڑھی
    assert top["miasm_match"] is True
    assert top["score"] == 10.5


# ------------------------------------------------------------------ #
# پوٹینسی
# ------------------------------------------------------------------ #
def test_potency_acute_chronic():
    from homeo_core.engine import potency
    a = potency.recommend_potency("acute", "medium")
    assert a["potency"] == "30C"
    c = potency.recommend_potency("chronic", "medium")
    assert c["potency"] == "200C"
    ah = potency.recommend_potency("acute", "high")
    assert "6C" in ah["potency"]


def test_potency_age_overrides():
    from homeo_core.engine import potency
    r = potency.recommend_potency("acute", "medium", age=2)
    assert "6C" in r["potency"]
    e = potency.recommend_potency("chronic", "medium", age=70)
    assert "LM" in e["potency"]


# ------------------------------------------------------------------ #
# ڈیفرنشل میٹرکس
# ------------------------------------------------------------------ #
def test_differential_matrix():
    from homeo_core.engine import differential
    ranked = [
        {"remedy": "a", "rubrics": [
            {"rubric": "x", "grade": 3, "dimension": "particulars", "chapter": "cough"},
            {"rubric": "only_a", "grade": 2, "dimension": "generals", "chapter": "fever"},
        ]},
        {"remedy": "b", "rubrics": [
            {"rubric": "x", "grade": 3, "dimension": "particulars", "chapter": "cough"},
        ]},
    ]
    m = differential.build_differential_matrix(ranked, top_n=2)
    rows = {r["rubric"] for r in m["rows"]}
    assert "only_a" in rows      # امتیازی (صرف ایک میں)
    assert "x" not in rows       # دونوں میں موجود — امتیازی نہیں


# ------------------------------------------------------------------ #
# فالو اپ + ہیرنگ
# ------------------------------------------------------------------ #
def test_followup_decisions():
    from homeo_core.engine import followup
    assert "برقرار" in followup.decide("improved")["action"]
    assert followup.decide("no_change")["wait"] is False
    assert "نئے کیس" in followup.decide("worse")["action"]


def test_hering_check():
    from homeo_core.engine import followup
    ok = followup.hering_check({"direction": 1, "center_to_periphery": 1,
                                "organ_priority": 1, "reverse_order": 1})
    assert ok["compliant"] is True
    bad = followup.hering_check({"direction": 1})
    assert bad["compliant"] is False


# ------------------------------------------------------------------ #
# انٹیگریشن — کینٹ پر مکمل پائپ لائن (بغیر ایل ایل ایم)
# ------------------------------------------------------------------ #
def _runner():
    from homeo_core.flows.flow_runner import FlowRunner
    return FlowRunner("acute")


def test_repertorization_pipeline():
    r = _runner()
    res = r.run_repertorization(
        ["dry cough worse from motion", "great thirst for cold water"],
        sources=["kent"],
    )
    assert res["remedies"], "کوئی دوا نہیں ملی"
    top = res["remedies"][0]
    assert top["score"] > 0
    assert top["rubric_count"] > 0
    assert res["rubrics_used"], "ربرکس استعمال نہیں ہوئے"
    # ہر ربرک کی اندراجات میں علامت موجود ہے (ایلپینیبلٹی کے لیے)
    assert all(x.get("symptom") for x in top["rubrics"])


def test_symptom_weights_boost():
    r = _runner()
    base = r.run_repertorization(["fever", "dry cough"], sources=["kent"])
    boosted = r.run_repertorization(
        ["fever", "dry cough"], sources=["kent"],
        symptom_weights={"dry cough": 2.0},
    )
    # خاص علامت کے وزن سے کل اسکور بڑھنا چاہیے
    base_total = sum(x["score"] for x in base["remedies"])
    boosted_total = sum(x["score"] for x in boosted["remedies"])
    assert boosted_total > base_total


def test_chronic_miasm_pipeline():
    from homeo_core.flows.flow_runner import FlowRunner
    cr = FlowRunner("chronic")
    res = cr.run_repertorization(
        ["itching skin worse at night", "anxiety and fear", "craving sweets", "constipation"],
        sources=["kent"],
    )
    assert res["miasm_dominant"] in ("psora", "sycosis", "syphilis", "tubercular")
    assert res["miasm_profile"]


# ------------------------------------------------------------------ #
# میٹیریا میڈیکا تصدیق (کوانٹ) — بغیر نیٹ ورک کے ٹیسٹس
# ------------------------------------------------------------------ #
def test_mm_format_for_prompt():
    from homeo_core.engine import materia_medica as mm
    out = mm.format_for_prompt({})
    assert out == ""
    verdicts = {"bell": {"chunks": [{"book": "Absolute MM", "page": 5,
                                     "text": "Sudden onset high fever"}],
                         "match_rate": 0.6}}
    text = mm.format_for_prompt(verdicts)
    assert "bell" in text
    assert "60%" in text
    assert "Sudden onset high fever" in text


def test_mm_graceful_without_key(monkeypatch):
    from homeo_core.engine import materia_medica as mm
    monkeypatch.setattr(mm, "QDRANT_API_KEY", "")
    assert mm.available() is False
    assert mm.verify_remedies(["bell"], ["fever"]) == {}


def test_mm_symptom_tokens():
    from homeo_core.engine import materia_medica as mm
    toks = mm._symptom_tokens(["dry cough", "ثست", "thirst for cold water"])
    assert "cough" in toks and "thirst" in toks
