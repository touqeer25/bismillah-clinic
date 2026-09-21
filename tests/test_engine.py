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
    # نسخہ 4.8: فقرے کی پیداوار اب اسٹیمڈ ہوتی ہے — "morn" وہی ٹوکن ہے جو ربرک
    # («SLEEPLESSNESS, morning») کے ٹوکنائزیشن سے بنتا ہے، اس لیے میچ اسی سے لگتا ہے
    assert "morn" in toks2


def test_concept_phrases_v48():
    """نسخہ 4.8 — فقرے کا تصور-ترجمہ (مریض کا فقرہ → ریپرٹری کی اپنی زبان)"""
    from homeo_core.engine.rubric_mapper import _concept_rewrite
    assert _concept_rewrite("cannot sleep") == "sleeplessness"
    assert _concept_rewrite("can't fall asleep at night") == "sleeplessness at night"
    assert _concept_rewrite("insomnia") == "sleeplessness"
    assert _concept_rewrite("neend nahin aati") == "sleeplessness"
    assert _concept_rewrite("wants to be alone") == "aversion to company"
    assert _concept_rewrite("akela rehna chahta hai") == "aversion to company"
    # باقی الفاظ مریض کے ہی رہتے ہیں — کوئی خودکار مترادف نہیں
    assert _concept_rewrite("sadness") == "sadness"
    assert _concept_rewrite("constipation in morning") == "constipation in morning"


def test_negation_tokens():
    from homeo_core.engine.rubric_mapper import _tokens_canonical
    toks = _tokens_canonical("pyas nahin")
    assert "no" in toks
    assert "thirst" in toks
    toks2 = _tokens_canonical("pasina bina")
    assert "no" in toks2
    assert "sweat" in toks2


def test_main_rubric_rule_v49():
    """نسخہ 4.9 — بغیر-موڈیلٹی سادہ علامت → باب کی مین ربرک اوّل
    («burning in abdomen» → abdomen کی «PAIN, burning» — نہ کہ lower abdomen)"""
    from homeo_core.engine.rubric_mapper import map_symptom_deep, get_index
    kent = get_index()
    for sym in ("burning in abdomen", "jalan pait mein"):
        picks = map_symptom_deep(sym, index=kent, top_k=3, use_llm=False)
        assert picks, f"خالی: {sym}"
        top = picks[0]
        assert top["chapter"] == "abdomen", f"{sym}: باب {top['chapter']}"
        assert top["text"] == "PAIN, burning", f"{sym}: {top['text']}"


def test_roman_stooping_coffee_v49():
    """نسخہ 4.9 — رومن اردو: jhukne se chakkar → STOOPING، coffee se bigarta → agg"""
    from homeo_core.engine.rubric_mapper import map_symptom_deep, get_index
    kent = get_index()
    picks = map_symptom_deep("jhukne se chakkar", index=kent, top_k=3, use_llm=False)
    assert picks and picks[0]["text"].startswith("STOOPING"), picks
    picks2 = map_symptom_deep("coffee se bigarta hai", index=kent, top_k=3, use_llm=False)
    assert picks2 and "COFFEE agg" in picks2[0]["text"], picks2


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


# ------------------------------------------------------------------ #
# نسخہ 5.0 — اردو رسم الخط کا آف لائن راستہ + بہن ربرک کا جھنڈا
# ------------------------------------------------------------------ #
def test_urdu_script_rewrite_v50():
    """اردو رسم الخط → انگریزی کلیدیں — یکسانی (ھ→ہ) اور صرفی سابقے سمیت"""
    from homeo_core.engine import urdu_script as us
    cases = {
        "پیٹ میں جلن": "abdomen burning",
        "صبح سر درد": "morning headache",
        "جھکنے سے چکر": "stooping vertigo",
        "کافی سے بگڑتا ہے": "coffee agg",
        "دائیں گھٹنے میں چبھن": "right knee stitching",   # ھ → ہ یکسانی
        "آنکھوں میں خارش": "eyes itching",                 # وں سابقہ
        "کھلی ہوا میں بہتر": "open air amel",
        "اکیلے رہنا چاہتا ہے": "wants to be alone",
    }
    for ur, expect in cases.items():
        got = us.rewrite_urdu(ur)
        assert got == expect, f"{ur}: {got!r} != {expect!r}"
    assert us.has_urdu("پیٹ") and not us.has_urdu("pait mein jalan")


def test_urdu_script_engine_path_v50():
    """انجن میں اردو رسم الخط علامت — بغیر انٹرنیٹ کے درست ربرک"""
    from homeo_core.engine.rubric_mapper import map_symptom_deep, get_index
    kent = get_index()
    picks = map_symptom_deep("پیٹ میں جلن", index=kent, top_k=3, use_llm=False)
    assert picks and picks[0]["chapter"] == "abdomen"
    assert picks[0]["text"] == "PAIN, burning"
    picks2 = map_symptom_deep("نیند نہیں آتی", index=kent, top_k=3, use_llm=False)
    assert picks2 and picks2[0]["text"].startswith("SLEEPLESSNESS")
    picks3 = map_symptom_deep("پیٹھ میں جکڑن صبح", index=kent, top_k=3, use_llm=False)
    assert picks3 and picks3[0]["chapter"] == "back" and "STIFFNESS" in picks3[0]["text"]


def test_sibling_alerts_v50():
    """بہن ربرک کا جھنڈا — رشتہ دار ربرکس کی پہچان (والد-ذیلی/بہن)"""
    from homeo_core.engine.repertorizer import _related_rubrics
    # والد-ذیلی
    assert _related_rubrics("PAIN, burning", "PAIN, burning, left")
    assert _related_rubrics("PAIN", "PAIN, burning")
    # بہن (ایک ہی والد)
    assert _related_rubrics("PAIN, morning", "PAIN, evening")
    # غیر متعلق
    assert not _related_rubrics("PAIN, burning", "SLEEPLESSNESS")
    assert not _related_rubrics("PAIN, burning", "PAIN, burning")


def test_repertorize_sibling_alerts_key_v50():
    """repertorize_multi کے جواب میں sibling_alerts موجود ہو"""
    from homeo_core.engine.repertorizer import repertorize_multi
    res = repertorize_multi(
        ["burning in abdomen", "headache worse in morning"],
        source_names=["kent"], use_llm=False,
    )
    assert "sibling_alerts" in res
    assert isinstance(res["sibling_alerts"], list)


def test_reverse_index_glossary_v50():
    """لغت سے ریورس انڈیکس — جدول میں نہ ہونے والا لفظ بھی ملے"""
    from homeo_core.engine import urdu_script as us
    rev = us._reverse()
    assert rev, "ریورس انڈیکس خالی — glossary_en_ur.json لوڈ نہیں ہوا"
    # لغت میں پلسیشن کا اردو معنی «دھڑکن» ہے — ریورس سے انگریزی ملنی چاہیے
    assert any("pulsat" in w for w in rev.get(us.normalize("دھڑکن"), []))


def test_mixed_urdu_english_case_v50():
    """ملا جلا کیس (اردو + انگریزی) — اردو علامت گم نہ ہو، اپنی ربرک لے
    (symptom_builder خالص اردو علامت کو نہیں گراتا اب)"""
    from homeo_core.engine.repertorizer import repertorize_multi
    res = repertorize_multi(
        ["burning in abdomen", "پیٹ میں جلن صبح", "headache worse in morning"],
        source_names=["kent"], use_llm=False,
    )
    ur_rubrics = [r for r in res["rubrics_used"] if "پیٹ" in r["symptom"]]
    assert ur_rubrics, "اردو علامت کی ربرکس پائپ لائن سے گم ہو گئیں"
    assert any("PAIN, burning, morning" == r["rubric"] for r in ur_rubrics)


# ==================== نسخہ 5.1 — پرانے رویوں کی مرمت + مرحلہ 4 ====================

def test_family_fallback_knee_stitching_v51():
    """«right knee stitching» — v51: خاندان ربرک PAIN, knee دکھائی جاتی تھی
    (پرانے ڈیٹا میں مخصوص ربرک موجود نہیں تھی)۔ v52 (homeoint عین مطابق ڈیٹا):
    مخصوص ربرک «PAIN, Knee, right» اب کتاب میں موجود ہے — وہی اوّل ملتی ہے؛
    خاندان-جھنڈا راستہ یونٹ سطح پر بھی جانچا گیا۔"""
    from homeo_core.engine.rubric_mapper import map_symptom_deep, _family_fallback_rubrics, get_index
    for sym in ("right knee stitching", "دائیں گھٹنے میں چبھن"):
        res = map_symptom_deep(sym, use_llm=False, top_k=3)
        assert res, f"{sym} → خالی"
        assert res[0]["text"].startswith("PAIN, Knee"), res[0]["text"]
    fam = _family_fallback_rubrics("right knee whirling", get_index(),
                                   "extremities", {"right", "knee", "whirling"})
    assert fam and fam[0]["text"] == "PAIN, Knee"


def test_case_region_limb_organs_v51():
    """knee/shoulder → extremities باب — پہلے upper/lower پر ضائع ہو جاتے تھے"""
    from homeo_core.engine.rubric_mapper import _REGION, _REGION_CHAPTERS
    assert _REGION.get("knee") in ("upper", "lower")
    assert "extremities" in _REGION_CHAPTERS
    res = _m_knee = __import__("homeo_core.engine.rubric_mapper", fromlist=["x"]).map_symptom_deep(
        "knee pain", use_llm=False, top_k=2)
    assert res[0]["text"] == "PAIN, Knee"
    assert res[0].get("main_rule") is True


def test_word_boundary_subject_v51():
    """«stitching» میں «itching» سب اسٹرنگ — بہرا پن: guard شکایت غلط سمجھتا تھا"""
    from homeo_core.engine.rubric_mapper import _has_word
    assert _has_word("itching", "right knee stitching") is False
    assert _has_word("itching", "itching of skin") is True
    assert _has_word("right", "fright") is False
    assert _has_word("ear", "heart") is False


def test_seat_guard_limb_v51():
    """«left shoulder pain» — پرانا رویہ: elbow-alternates ربرک اوّل!"""
    from homeo_core.engine.rubric_mapper import map_symptom_deep
    res = map_symptom_deep("left shoulder pain", use_llm=False, top_k=4)
    assert res, "خالی"
    assert "elbow" not in res[0]["text"].lower(), res[0]["text"]
    assert "shoulder" in res[0]["text"].lower()


def test_back_pain_family_v51():
    """«peeth mein dard» — پرانا رویہ: urine باب کی COPIOUS اوّل!"""
    from homeo_core.engine.rubric_mapper import map_symptom_deep
    for sym in ("peeth mein dard", "back pain"):
        res = map_symptom_deep(sym, use_llm=False, top_k=3)
        assert res[0]["chapter"] == "back", (sym, res[0]["chapter"])
        assert res[0]["text"] == "PAIN", res[0]["text"]


def test_chilliness_phrase_v51():
    """«سردی لگتی ہے» — پرانا رویہ: خالی یا stool کی COLD!"""
    from homeo_core.engine.rubric_mapper import map_symptom_deep
    res = map_symptom_deep("سردی لگتی ہے", use_llm=False, top_k=2)
    assert res and "CHILLINESS" in res[0]["text"], res[0]["text"] if res else "خالی"


def test_rubric_overrides_v51():
    """(تجویز د) — ڈاکٹر کا چنا ربرک استعمال ہو (انڈیکس تلاش سمیت)"""
    from homeo_core.engine.repertorizer import repertorize_multi
    ov = {"دائیں گھٹنے میں چبھن": "PAIN, Knee, motion, amel."}
    res = repertorize_multi(["دائیں گھٹنے میں چبھن"], source_names=["kent"],
                            use_llm=False, rubric_overrides=ov)
    knee = [r for r in res["rubrics_used"] if "گھٹنے" in r["symptom"]]
    assert knee and knee[0]["rubric"] == "PAIN, Knee, motion, amel."


def test_sibling_alerts_remedy_counts_v51():
    """(تجویز الف) — بہن ربرک کے جھنڈے میں ادویات کی گنتی (168 بمقابلہ 14)"""
    from homeo_core.engine.repertorizer import repertorize_multi
    res = repertorize_multi(["burning in abdomen"], source_names=["kent"], use_llm=False)
    sib = res.get("sibling_alerts", [])
    assert sib, "بہن ربرک کے جھنڈے خالی"
    a = sib[0]
    assert isinstance(a["chosen"].get("remedies"), int)
    assert a["chosen"]["remedies"] > 0


def test_family_flag_in_rubrics_used_v51():
    """خاندان جھنڈا — v52: نئے (homeoint عین مطابق) ڈیٹا میں مخصوص ربرکیں
    موجود ہیں تو عام راستہ ہی کافی ہے؛ جھنڈا یونٹ سطح پر جانچا گیا —
    خاندان ربرک 'PAIN, Knee' (162+ ادویات) _recover_rubrics سے جھنڈے کے ساتھ آتی ہے"""
    from homeo_core.engine.repertorizer import repertorize_multi
    from homeo_core.engine.rubric_mapper import _recover_rubrics, get_index
    res = repertorize_multi(["right knee stitching"], source_names=["kent"], use_llm=False)
    knee = [r for r in res["rubrics_used"] if "knee" in r["symptom"].lower()]
    assert knee and knee[0]["rubric"].startswith("PAIN, Knee")
    rec = _recover_rubrics("right knee whirling", get_index(), top_k=3,
                           case_region="extremities")
    fam = [c for c in rec if c.get("family")]
    assert fam and fam[0].get("text") == "PAIN, Knee"
    rec_full = get_index().load_rubric(str(fam[0]["rubric_id"])) or {}
    assert len(rec_full.get("r") or {}) > 100


def test_rubric_notes_module_v51():
    """(تجویز ب) — ربرک کے اردو معنی نوٹ + حس نوٹ"""
    from homeo_core.engine.rubric_notes import annotate_rubric, sense_note, rubric_note
    ann = annotate_rubric("PAIN, knee")
    assert ann.get("pain") == "درد"
    note = sense_note("PAIN, stitching, knee")
    assert "سوئی" in note
    assert "درد" in rubric_note("PAIN, knee")


def test_glossary_full_coverage_v51():
    """مرحلہ 2 — مکمل لغت (6,000+ الفاظ، رسائی 99%+)"""
    import json
    from pathlib import Path
    g = json.loads((Path(__file__).resolve().parents[1] / "glossary_en_ur.json").read_text(encoding="utf-8"))
    words = g["words"]
    assert len(words) >= 6000
    assert all(e.get("ur") for e in words.values()), "غیر ترجمہ شدہ الفاظ باقی"
    assert len(g.get("sense_notes", {})) >= 40
