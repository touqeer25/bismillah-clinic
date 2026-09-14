"""
streamlit_page.py — اڈاپٹو ایڈوانس اسسٹنٹ 2.1 (ٹیب پر مبنی، صاف لے آؤٹ)
--------------------------------------------------------------------
نسخہ 2.1 اضافے:
  - ریپرٹری منتخب کرنے کا ڈراپ ڈاؤن (بنیادی شکایت ٹیب، اوپر دائیں)
  - خاص/کاریکٹرسٹک علامات کا اضافی وزن (1.5x)
  - سیفٹی ریڈ فلیگز (ایمرجنسی بینر)
  - اسکور کی تفصیل (ایلپینیبلٹی ایکسپینڈر)
  - اگلا سوال (اسٹیٹک رہنمائی + ایل ایل ایم متلاشی سوالات)
  - سیاق و سباق والی چیپس (کھانسی → بلغم وغیرہ)
  - مکمل کیس نوٹ سے خودکار بھرنا (ایل ایل ایم)
  - آواز سے درج کرنا (گروک وِساپر، اگر کیز موجود ہو)
  - مریض کا سیاق (?patient= پیرامیٹر: نام/عمر/جنس)
  - پوٹینسی کارڈ (عمر/میازم سمیت) + پچھلے نتائج (اسناپ شاٹس)
  - فالو اپ میں ہیرنگ کے قوانین کی چیک باکسز
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
import time
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

CONFIG_DIR = ROOT / "homeo_core" / "config"

from homeo_core.flows.flow_runner import FlowRunner          # noqa: E402
from homeo_core.engine import llm as llm_mod                  # noqa: E402
from homeo_core.engine import miasm as miasm_mod              # noqa: E402
from homeo_core.engine import sources as sources_mod          # noqa: E402

_LANG = "ur"

# ------------------------------------------------------------------ #
# متن (تین زبانیں)
# ------------------------------------------------------------------ #
T = {
    "acute_short": {"ur": "ایکوٹ", "en": "Acute", "roman": "Acute"},
    "chronic_short": {"ur": "کرانک", "en": "Chronic", "roman": "Chronic"},
    "chief_added": {
        "ur": "بنیادی شکایت درج ہو گئی — اگلا ٹیب: دیگر علامات",
        "en": "Chief complaint recorded — next tab: Other Symptoms",
        "roman": "Bunyadi shikayat darj ho gayi — agla tab: Deegar Alamaat",
    },
    "symptoms_collected": {"ur": "جمع شدہ علامات", "en": "Collected Symptoms", "roman": "Jama shuda alamaat"},
    "run_repertorization": {"ur": "🌿 ریپرٹورائزیشن چلائیں", "en": "🌿 Run Repertorization", "roman": "🌿 Repertorization chalain"},
    "running": {"ur": "ربرکس اور ادویات تلاش کی جا رہی ہیں...", "en": "Searching rubrics and remedies...", "roman": "Rubrics aur adwiyat talash ho rahi hain..."},
    "results_title": {"ur": "📊 ریپرٹورائزیشن نتیجہ", "en": "📊 Repertorization Result", "roman": "📊 Repertorization Natija"},
    "score": {"ur": "اسکور", "en": "Score", "roman": "Score"},
    "rubrics": {"ur": "ربرکس", "en": "Rubrics", "roman": "Rubrics"},
    "sources": {"ur": "ریپرٹریز", "en": "Repertories", "roman": "Repertories"},
    "differential": {"ur": "⚖ تفریق میٹرکس", "en": "⚖ Differential Matrix", "roman": "⚖ Differential Matrix"},
    "potency_title": {"ur": "⚡ پوٹینسی اور خوراک", "en": "⚡ Potency & Dosage", "roman": "⚡ Potency aur Khurak"},
    "followup_title": {"ur": "🔁 فالو اپ", "en": "🔁 Follow-up", "roman": "🔁 Follow-up"},
    "response_q": {"ur": "علاج کے بعد کیا ہوا؟", "en": "What happened after treatment?", "roman": "Ilaj ke baad kya hua?"},
    "fu_improved": {"ur": "✅ بہتری (عمومی)", "en": "✅ Improvement (general)", "roman": "✅ Behtari (umoomi)"},
    "fu_aggr_imp": {"ur": "⚠️ پہلے بڑھنا، پھر بہتری", "en": "⚠️ Aggravation then improvement", "roman": "⚠️ Pehle barhna, phir behtari"},
    "fu_no_change": {"ur": "❌ کوئی تبدیلی نہیں", "en": "❌ No change", "roman": "❌ Koi tabdeeli nahin"},
    "fu_worse": {"ur": "🔻 خرابی / نئی علامات", "en": "🔻 Worse / new symptoms", "roman": "🔻 Kharabi / nayi alamaat"},
    "dominant": {"ur": "غالب میازم", "en": "Dominant Miasm", "roman": "Ghalib Miasm"},
    "decision": {"ur": "فیصلہ", "en": "Decision", "roman": "Faisla"},
    "reason": {"ur": "وجہ", "en": "Reason", "roman": "Wajah"},
    "next_steps": {"ur": "اگلے اقدامات", "en": "Next Steps", "roman": "Agle iqdamaat"},
    "rubrics_used": {"ur": "استعمال شدہ ربرکس", "en": "Rubrics Used", "roman": "Istemaal shuda rubrics"},
    "final_prescription": {"ur": "📋 حتمی نسخہ تیار کریں (اے آئی)", "en": "📋 Generate Final Prescription (AI)", "roman": "📋 Nuskha taiyar karein (AI)"},
    "rx_local": {"ur": "منتخب بہترین دوا", "en": "Selected best remedy", "roman": "Muntakhab behtareen dawa"},
    "rx_local_dose": {"ur": "طاقت اور خوراک", "en": "Potency & dosage", "roman": "Taqat aur khurak"},
    "rx_local_note": {"ur": "اے آئی دستیاب نہیں — سب سے زیادہ اسکور والی دوا (میٹیریا میڈیکا تصدیق کے بغیر)", "en": "AI unavailable — highest-scored remedy (without materia medica verification)", "roman": "AI nahin — sab se zyada score wali dawa"},
    "ai_offline": {"ur": "اے آئی کیز دستیاب نہیں — مقامی ریپرٹری موڈ چل رہا ہے", "en": "No AI keys — running local repertory mode", "roman": "AI keys nahin — local repertory mode"},
    "no_symptoms": {"ur": "پہلے دیگر ٹیبز میں علامات درج کریں", "en": "Enter symptoms in the other tabs first", "roman": "Pehle doosri tabs me alamaat likhein"},
    "final_note": {"ur": "⚠️ یہ اے آئی کی رہنمائی ہے — حتمی فیصلہ معالج کا ہے", "en": "⚠️ AI guidance — final decision rests with the physician", "roman": "⚠️ AI rahnumai — aakhri faisla mu'alij ka hai"},
    # ===== نسخہ 2.1 =====
    "repertory_select": {"ur": "ریپرٹری منتخب کریں", "en": "Select repertory", "roman": "Repertory select karein"},
    "rep_only_one": {"ur": "صرف ایک ریپرٹری — کراس ویلیڈیشن بند", "en": "Only one repertory — cross-validation off", "roman": "Sirf aik repertory"},
    "repertories_used": {"ur": "استعمال شدہ ریپرٹریز", "en": "Repertories used", "roman": "Istemaal shuda repertories"},
    "no_sources": {"ur": "کام کے لیے کم از کم ایک ریپرٹری منتخب کریں", "en": "Select at least one repertory to run", "roman": "Kam az kam aik repertory select karein"},
    "german_note": {"ur": "جرمن ریپرٹری پر کوئی میچ نہیں ملا — اردو/رومن علامات کے لیے اے آئی کیز درکار ہیں", "en": "No match in German repertory — AI keys are needed to match Urdu/Roman symptoms", "roman": "German repertory me koi match nahi"},
    "char_symptom": {"ur": "خاص / کاریکٹرسٹک علامت (اختیاری)", "en": "Characteristic / key symptom (optional)", "roman": "Khas / characteristic alamat (ikhtiyari)"},
    "char_ph": {"ur": "سب سے نایاب/خاص علامت لکھیں — اسے اضافی وزن ملے گا (1.5x)", "en": "Write the rarest / most peculiar symptom — it gets extra weight (1.5x)", "roman": "Sab se nayaab/khas alamat likhein"},
    "emergency": {"ur": "⛑️ ایمرجنسی", "en": "⛑️ Emergency", "roman": "⛑️ Emergency"},
    "safety_note": {"ur": "دی گئی علامات میں ایمرجنسی کے اشارے ہیں — ریپرٹورائزیشن سے پہلے طبی حاضری/حوالگی غور کریں", "en": "The entered symptoms contain emergency indicators — consider medical referral before repertorization", "roman": "Alamat me emergency ke ishara hain"},
    "score_breakdown": {"ur": "اسکور کی تفصیل دیکھیں", "en": "Score breakdown", "roman": "Score ki tafseel"},
    "prev_remedy_badge": {"ur": "⚠ پہلے دی گئی دوا", "en": "⚠ previously tried", "roman": "⚠ pehle di gayi dawa"},
    "prev_results": {"ur": "🕓 پچھلے نتائج (اس سیشن)", "en": "🕓 Previous results (this session)", "roman": "🕓 Pehle ke natija"},
    "ai_questions": {"ur": "🤖 اگلا سوال کیا پوچھوں؟", "en": "🤖 What should I ask next?", "roman": "🤖 Agla sawal kya poochho?"},
    "ai_questions_btn": {"ur": "🤖 اے آئی: ان پٹ کے مطابق متلاشی سوالات", "en": "🤖 AI: targeted questions from your input", "roman": "🤖 AI: input ke mutabiq sawalat"},
    "ai_questions_short": {"ur": "ابھی تک درج شدہ معلومات پر مبنی تجاویز", "en": "Suggestions based on what you have entered", "roman": "Inpurt par mabni tajweez"},
    "case_note_fill": {"ur": "📝 میرے پاس مکمل کیس نوٹ ہے — خودکار بھر دیں (اے آئی)", "en": "📝 I have a full case note — auto-fill (AI)", "roman": "📝 Mukammal case note — auto-fill (AI)"},
    "case_note_ph": {"ur": "پورا کیس نوٹ یہاں پیسٹ کریں (اردو / رومن / انگریزی)", "en": "Paste the full case note here (Urdu / Roman / English)", "roman": "Pora case note yahan paste karein"},
    "case_note_done": {"ur": "✅ ٹیبز خودکار بھر دیے گئے — ضروریات کے مطابق جانچ لیں", "en": "✅ Tabs auto-filled — please review", "roman": "✅ Tabs auto-fill — check karein"},
    "voice_exp": {"ur": "🎤 آواز سے درج کریں", "en": "🎤 Voice input", "roman": "🎤 Awaaz se darj karein"},
    "voice_btn": {"ur": "🎙️ آواز ریکارڈ کریں یا فائل بھیجیں", "en": "🎙️ Record audio or send file", "roman": "🎙️ Awaaz record karein ya file bhejein"},
    "voice_done": {"ur": "✅ آواز درج ہو گئی", "en": "✅ Voice captured", "roman": "✅ Awaaz darj ho gayi"},
    "voice_failed": {"ur": "آواز سمجھ نہیں آ سکی — دوبارہ کوشش کریں", "en": "Could not understand the audio — please try again", "roman": "Awaaz samajh nahi aayi"},
    "rep_chip_hint": {"ur": "کلک → منتخب | دوبارہ کلک → سلیکشن ختم", "en": "Click to select | click again to deselect", "roman": "Click = select | dobara click = deselect"},
    "mic_help": {"ur": "آواز سے بول کر نوٹ لکھیں", "en": "Dictate the note by voice", "roman": "Awaaz se bol kar note likhein"},
    "voice_hint": {"ur": "مائک کھلا ہے — بولیں، متن نیچے نوٹ میں خود شامل ہو جائے گا", "en": "Mic is on — speak and the text will be added to the note below", "roman": "Mic khula hai — bolein, text note me shamil ho jayega"},
    "voice_no_key": {"ur": "آواز کی سہولت کے لیے گروک کلید (GROQ_API_KEY) سیکرٹس میں شامل کریں", "en": "Voice input needs GROQ_API_KEY in secrets", "roman": "Awaaz ke liye GROQ_API_KEY secrets me daalein"},
    "hering_title": {"ur": "ہیرنگ کے قوانین (قوانینِ شفا) — بہتری کی سمت", "en": "Hering's Laws — direction of cure", "roman": "Hering qawaneen — behtari ki samt"},
    "hering_1": {"ur": "علامتیں اوپر سے نیچے کے اعتبار سے گئیں", "en": "Symptoms resolved top → bottom", "roman": "Ooper se neeche ki tarteeb"},
    "hering_2": {"ur": "اندر سے باہر (اعضاء پہلے، جلد بعد میں)", "en": "In → out (organs first, skin later)", "roman": "Andar se bahar"},
    "hering_3": {"ur": "اہم عضو پہلے، غیر اہم بعد میں", "en": "Important organs first, less important later", "roman": "Ahem aza pehle"},
    "hering_4": {"ur": "پرانی علامات الٹی ترتیب میں واپس آئیں", "en": "Older symptoms returned in reverse order", "roman": "Purani alamaat ulti tarteeb"},
    "hering_compliant": {"ur": "ہیرنگ مطابقت", "en": "Hering compliance", "roman": "Hering muwafaqat"},
    "patient_prev": {"ur": "پچھلی دوا", "en": "Previous remedy", "roman": "Pehli dawa"},
    "mm_title": {"ur": "📖 میٹیریا میڈیکا میچ ریٹ (کلینک کے کتب خانے سے)", "en": "📖 Materia Medica match rate (clinic library)", "roman": "📖 MM match rate"},
    "mm_off": {"ur": "میٹیریا میڈیکا کی تصدیق دستیاب نہیں — Qdrant کلید (QDRANT_API_KEY) اسٹریم لٹ سیکرٹس میں شامل کریں", "en": "MM verification unavailable — add QDRANT_API_KEY to Streamlit secrets", "roman": "MM verification band — QDRANT_API_KEY secrets me daalein"},
}


def t(key: str) -> str:
    return T.get(key, {}).get(_LANG, T.get(key, {}).get("ur", key))


def _get_lang() -> str:
    """زبان صرف ?lang= سے آتی ہے (والد ایپ آئی فریم میں بھیجتی ہے)"""
    try:
        v = st.query_params.get("lang", "ur")
    except Exception:
        v = "ur"
    if isinstance(v, list):
        v = v[0] if v else "ur"
    return v if v in ("ur", "en", "roman") else "ur"


def _source_label(name: str) -> str:
    lbl = sources_mod.SOURCE_DEFS.get(name, {}).get("label", {})
    return lbl.get(_LANG) or lbl.get("en", name)


# ------------------------------------------------------------------ #
# سیفٹی ریڈ فلیگز — ایمرجنسی کے اشارے (نسخہ 2.1)
# ------------------------------------------------------------------ #
SAFETY_FLAGS = [
    (["chest pain", "seenay ka dard", "seena ka dard", "seene ka dard"],
     "Seene ka dard — foran tibs ke liye rujoo karein"),
    (["breathing difficulty", "saans phoolna", "saans ki takleef", "shortness of breath"],
     "Saans ki takleef — foran rujoo karein"),
    (["seizure", "convulsion", "fit hai", "hosh kho na", "be hoshi"],
     "Fait / hosh kho na — foran rujoo karein"),
    (["suicidal", "suicide", "khudkushi"],
     "Khudkushi ka khyal — foran rujoo karein, makhooz nadar raheem"),
    (["vomiting blood", "qay me khon", "khon ki qay", "blood in vomit"],
     "Khoon ki qay — foran rujoo karein"),
    (["gadday me khon", "stool me khon", "dast me khon", "blood in stool"],
     "Gadday me khon — foran rujoo karein"),
]
SAFETY_COMBOS = [
    (["bukhar", "fever"], ["shishay", "infant", "newborn", "baby"],
     "Shishay me bhari bukhār — foran rujoo karein"),
    (["hamal", "pregnant", "pregnancy"], ["bleeding", "khon"],
     "Hamal me khon — foran rujoo karein"),
]


def _safety_alerts(symptoms: list) -> list:
    text = " ".join(str(s).lower() for s in symptoms)
    alerts = []
    for kws, msg in SAFETY_FLAGS:
        if all(k in text for k in kws):
            alerts.append(msg)
    for g1, g2, msg in SAFETY_COMBOS:
        if any(a in text for a in g1) and any(b in text for b in g2):
            alerts.append(msg)
    return alerts


# ------------------------------------------------------------------ #
# مریض کا سیاق (?patient= JSON) (نسخہ 2.1)
# ------------------------------------------------------------------ #
def _get_patient() -> dict:
    try:
        raw = st.query_params.get("patient", "")
        if isinstance(raw, list):
            raw = raw[0] if raw else ""
        raw = str(raw or "").strip()
        if not raw:
            return {}
        import urllib.parse
        try:
            d = json.loads(raw)
        except Exception:
            d = json.loads(urllib.parse.unquote_plus(raw))
        return d if isinstance(d, dict) else {}
    except Exception:
        return {}


def _patient_age(p: dict):
    try:
        a = int(str(p.get("age", "")).strip()[:3])
        return a if 0 < a < 130 else None
    except Exception:
        return None


# ------------------------------------------------------------------ #
# ڈسائن اسٹائل
# ------------------------------------------------------------------ #
CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&family=Segoe+UI:wght@400;600;700&display=swap');

html, body, [data-testid="stAppViewContainer"] {
    background: #f0f4f8 !important;
    color: #2c3e50;
    font-family: 'Segoe UI', Tahoma, sans-serif;
}
#MainMenu, footer, header {visibility: hidden;}
[data-testid="stToolbar"] {display:none;}
.block-container {
    padding-top: 0.6rem !important;
    padding-bottom: 2rem !important;
    max-width: 1200px;
}
:root { --primary-color: #2980b9; }
div[role="progressbar"] > div {
    background: linear-gradient(90deg, #2980b9, #1a5276) !important;
}

/* ===== اوپر کا ایکوٹ/کرانک ٹوگل ===== */
[data-testid="stSegmentedControl"] { width: 100%; }
[data-testid="stSegmentedControl"] button {
    font-family: 'Noto Nastaliq Urdu', 'Segoe UI', sans-serif;
    font-weight: 700 !important;
    font-size: 15px !important;
    padding: 8px 16px !important;
}
[data-testid="stSegmentedControl"] button[aria-checked="true"] {
    background: linear-gradient(135deg, #2980b9, #1a5276) !important;
    color: #fff !important;
}

/* ===== نیچے کی سیکشن ٹیبز ===== */
.stTabs [data-baseweb="tab-list"] { gap: 4px; }
.stTabs [data-baseweb="tab"] {
    font-family: 'Noto Nastaliq Urdu', 'Segoe UI', sans-serif;
    font-weight: 700;
    padding: 8px 14px;
}

/* ===== فیلڈ لیبل ===== */
.bhc-field-label {
    color: #1a5276; font-size: 15px; font-weight: 700;
    margin: 10px 0 2px; direction: rtl;
}

/* ===== ریپرٹری ڈراپ ڈاؤن ===== */
.bhc-rep-wrap {
    background: #f4f9fd; border: 1px solid #cfe4f5; border-radius: 10px;
    padding: 8px 10px;
}

/* ===== چیپ بٹن (کلک ایبل ٹیبز) ===== */
.bhc-chip-title {
    color: #7f8c9a; font-size: 12px; font-weight: 700;
    margin: 10px 0 4px; direction: rtl;
}
div.stButton button[class*="st-key-chip_"] {
    background: #f4faf7 !important;
    border: 1px solid #cde9dc !important;
    color: #1e6b50 !important;
    border-radius: 999px !important;
    min-height: 0 !important;
    height: auto !important;
    padding: 5px 10px !important;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
    font-family: 'Noto Nastaliq Urdu', 'Segoe UI', sans-serif !important;
    box-shadow: none !important;
}
div.stButton button[class*="st-key-chip_"]:hover {
    background: #dcf0e7 !important;
    border-color: #9fd4be !important;
    color: #14513a !important;
}

/* ===== چپس / کارڈز / مواد ===== */
.bhc-chip {
    display: inline-block; background: #eafaf1; border: 1px solid #a9dfbf;
    color: #1e8449; border-radius: 20px; padding: 3px 12px; font-size: 12px;
    font-weight: 600; margin: 2px; direction: rtl;
}
.bhc-remedy {
    background: #fbfdfe; border: 1px solid #d6eaf8; border-right: 4px solid #2980b9;
    border-radius: 12px; padding: 11px 14px; margin-bottom: 9px; direction: rtl;
}
.bhc-ktag {
    display: inline-block; background: #e8f0fe; color: #1a5276;
    border: 1px solid #cfe0f4; border-radius: 8px; padding: 1px 8px;
    font-size: 11px; font-weight: 600; margin: 2px;
}
.bhc-card-title {
    color: #1a5276; font-size: 16px; font-weight: 700;
    margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #ecf0f1;
}
.bhc-card {
    background: #ffffff; border: 1px solid #d1e3f8; border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.06); padding: 18px; margin-bottom: 14px;
}
.bhc-done-hint {
    background: #eafaf1; border: 1px solid #a9dfbf; color: #1e8449;
    border-radius: 10px; padding: 8px 12px; margin-top: 8px;
    font-size: 13px; font-weight: 600; direction: rtl;
}

/* ===== ان پٹس ===== */
.stTextInput > div > div > input,
.stTextArea > div > div > textarea {
    direction: RTL; text-align: right;
    font-family: 'Noto Nastaliq Urdu', 'Segoe UI', sans-serif;
    border-radius: 10px !important;
}

/* ===== بٹن ===== */
div.stButton > button {
    border-radius: 8px; font-weight: 600; min-height: 2.3rem;
    white-space: normal !important; height: auto !important;
    font-family: 'Noto Nastaliq Urdu', 'Segoe UI', sans-serif;
}
div.stButton > button[kind="primary"] {
    background: linear-gradient(135deg, #2980b9, #1a5276) !important;
    border: none !important; color: #ffffff !important;
    box-shadow: 0 2px 8px rgba(41,128,185,0.35);
}
div.stButton > button[kind="primary"]:hover { filter: brightness(1.07); }

/* ===== نسخہ 2.2: ٹاپ لائن ریپرٹری چپس ===== */
.bhc-rep-label {
    font-size: 13px; font-weight: 700; color: #1a5276; direction: rtl;
    margin: 2px 0 4px 0;
}
.st-key-bhc_reps div.stButton > button { min-height: 2.1rem; font-size: 13px; }
.st-key-bhc_reps div.stButton > button[kind="secondary"] {
    background: #ffffff !important; color: #1a5276 !important;
    border: 1px solid #a9c7e8 !important; box-shadow: none;
}
.st-key-bhc_reps div.stButton > button[kind="secondary"]:hover { background: #eaf3fc !important; }

/* ===== نسخہ 2.2: مکمل کیس نوٹ کے نیچے کونے میں مائک (گوگل سرچ کی طرز) ===== */
.st-key-bhc_notebox { position: relative; }
.st-key-bhc_notebox .stTextArea textarea { padding-bottom: 2.9rem !important; }
.st-key-bhc_notebox div.stButton {
    position: absolute; left: 10px; bottom: 10px; z-index: 10; width: auto;
}
.st-key-bhc_notebox div.stButton > button {
    width: 40px; height: 40px; min-height: 40px; padding: 0;
    border-radius: 50%; font-size: 17px; line-height: 1;
    background: #ffffff !important; color: #1a5276 !important;
    border: 1px solid #a9c7e8 !important;
    box-shadow: 0 2px 8px rgba(26,82,118,0.18);
}
.st-key-bhc_notebox div.stButton > button:hover { background: #eaf3fc !important; }
.st-key-bhc_notebox div.stButton > button[kind="primary"] {
    background: linear-gradient(135deg, #c0392b, #e74c3c) !important;
    color: #ffffff !important; border: none !important;
}
</style>
"""


# ------------------------------------------------------------------ #
# کیش شدہ وسائل
# ------------------------------------------------------------------ #
@st.cache_resource(show_spinner=False)
def _cached_runner(case_type: str) -> FlowRunner:
    return FlowRunner(case_type)


@st.cache_data(show_spinner=False)
def _cached_quick_picks() -> dict:
    fpath = CONFIG_DIR / "quick_picks.json"
    if fpath.exists():
        return json.loads(fpath.read_text(encoding="utf-8"))
    return {}


# ------------------------------------------------------------------ #
# سیشن سٹیٹ
# ------------------------------------------------------------------ #
def _init_state():
    st.session_state.setdefault("bc_case_type", "acute")
    st.session_state.setdefault("bc_result", None)
    st.session_state.setdefault("bc_rx", None)
    st.session_state.setdefault("bc_rx_sig", None)
    st.session_state.setdefault("bc_sources", ["kent", "synthesis"])
    st.session_state.setdefault("bc_snaps", [])
    st.session_state.setdefault("bc_mic_open", False)
    st.session_state.setdefault("bc_voice_sig", None)
    st.session_state.setdefault("bc_pending_voice", None)


def _reset_case_state():
    st.session_state.bc_result = None
    st.session_state.bc_rx = None
    st.session_state.bc_rx_sig = None
    st.session_state.bc_snaps = []


def _on_case_change():
    _reset_case_state()


def _case_type() -> str:
    return st.session_state.get("bc_case_type", "acute")


def _field_key(sid: str, fid: str) -> str:
    """ہر فیلڈ کا منفرد session_state کلید (کیس ٹائپ سمیت)"""
    return f"f_{_case_type()}_{sid}_{fid}"


# ------------------------------------------------------------------ #
# علامات اکٹھا کرنا
# ------------------------------------------------------------------ #
def _split_symptoms(text: str) -> list:
    """فیلڈ کے متن کو الگ الگ علامات میں توڑنا (کاما / سطر / ۔)"""
    parts = re.split(r"[\n,،。؛;]+", text or "")
    return [p.strip() for p in parts if p and p.strip()]


def _collected_symptoms(steps: list) -> list:
    out = []
    for step in steps:
        for f in step.get("fields", []):
            txt = st.session_state.get(_field_key(step["id"], f["id"]), "")
            out.extend(_split_symptoms(txt))
    return out


# ------------------------------------------------------------------ #
# سیاق و سباق والی چیپس (نسخہ 2.1)
# ------------------------------------------------------------------ #
CONTEXT_CHIPS = [
    (("cough", "khansi", "کھانسی", "respiratory"), "expectoration",
     {"ur": "بلغم — کلک کریں", "en": "Expectoration — click", "roman": "Balgham — click"}),
    (("skin", "jild", "khujli", "rash", "danay", "خارش", "جلد"), "skin_detail",
     {"ur": "جلد کی تفصیل — کلک کریں", "en": "Skin details — click", "roman": "Jild ki tafseel — click"}),
    (("head", "sar", "sardard", "migraine", "سردرد"), "head_detail",
     {"ur": "سردرد کی تفصیل — کلک کریں", "en": "Headache details — click", "roman": "Sardard ki tafseel — click"}),
    (("joint", "joron", "ghutna", "kandha", "taang", "جوڑ"), "joint_detail",
     {"ur": "جوڑوں کی تفصیل — کلک کریں", "en": "Joint details — click", "roman": "Joron ki tafseel — click"}),
]


def _context_chips_for(sid: str, fid: str) -> list:
    """بنیادی شکایت کے سیاق میں اضافی چیپ سیٹس"""
    if not (sid == "other_symptoms" and fid == "other_symptoms"):
        return []
    chief_txt = (st.session_state.get(_field_key("chief", "chief_complaint"), "") or "").lower()
    if not chief_txt.strip():
        return []
    out = []
    for kws, extra_set, extra_title in CONTEXT_CHIPS:
        if any(k in chief_txt for k in kws):
            out.append({"set": extra_set, "title": extra_title})
    return out


# ------------------------------------------------------------------ #
# فیلڈز اور چیپ بٹن
# ------------------------------------------------------------------ #
def _pick_label(item) -> str:
    if isinstance(item, dict):
        return item.get(_LANG) or item.get("ur") or item.get("en") or ""
    return str(item)


def _append_chip(field_key: str, text: str):
    """چیپ پر کلک → متن فیلڈ میں شامل"""
    cur = (st.session_state.get(field_key, "") or "").strip()
    st.session_state[field_key] = (cur + "\n" + text).strip() if cur else text


def _render_chips(sid: str, fid: str, chip_def: dict):
    """فیلڈ کے نیچے کلک ایبل چیپ بٹن (امراض / ممکنہ جوابات)"""
    if not chip_def:
        return
    picks = _cached_quick_picks()
    items = picks.get(chip_def.get("set", ""), [])
    if not items:
        return

    title = chip_def.get("title", {})
    title_text = title.get(_LANG) or title.get("ur", "")
    if title_text:
        st.markdown(f'<div class="bhc-chip-title">▸ {title_text}</div>', unsafe_allow_html=True)

    labels = [_pick_label(it) for it in items]
    fkey = _field_key(sid, fid)
    per_row = 4
    for i in range(0, len(labels), per_row):
        cols = st.columns(per_row)
        for j, col in enumerate(cols):
            idx = i + j
            if idx >= len(labels):
                break
            with col:
                st.button(
                    labels[idx],
                    key=f"chip_{_case_type()}_{sid}_{fid}_{chip_def.get('set','x')}_{idx}",
                    on_click=_append_chip,
                    args=(fkey, labels[idx]),
                    use_container_width=True,
                )


def _toggle_source(key: str) -> None:
    """ریپرٹری چپ: کلک → سلیکٹ | دوبارہ کلک → سلیکشن ختم
    (on_click کال بیک — اگلے رن سے پہلے چلتا ہے، اس لیے محفوظ ہے)"""
    sel = list(st.session_state.get("bc_sources") or [])
    if key in sel:
        sel.remove(key)
    else:
        sel.append(key)
    st.session_state.bc_sources = sel


def _render_repertory_chips() -> None:
    """ریپرٹری منتخب کرنے کی کلک ایبل چپس — ایک ہی لائن میں (نسخہ 2.2)
    (پہلے یہ فیلڈ بنیادی شکایت ٹیب میں ڈراپ ڈاؤن تھی؛ اب ٹاپ پر ہے)"""
    st.markdown(f'<div class="bhc-rep-label">{t("repertory_select")}</div>',
                unsafe_allow_html=True)
    options = list(sources_mod.SOURCE_DEFS.keys())
    sel = list(st.session_state.get("bc_sources") or [])
    with st.container(key="bhc_reps"):
        cols = st.columns(len(options))
        for col, key in zip(cols, options):
            with col:
                st.button(
                    _source_label(key),
                    key=f"rep_chip_{key}",
                    type="primary" if key in sel else "secondary",
                    on_click=_toggle_source,
                    args=(key,),
                    use_container_width=True,
                    help=t("rep_chip_hint"),
                )
    if not sel:
        st.caption(f"⚠️ {t('no_sources')}")
    elif len(sel) == 1:
        st.caption(f"⚠️ {t('rep_only_one')}")


def _render_field(sid: str, f: dict):
    """ایک فیلڈ (سوال + text area) + اس کے نیچے چیپ بٹن
    بنیادی شکایت کے لیبل کے ساتھ دائیں جانب ریپرٹری ڈراپ ڈاؤن"""
    fid = f["id"]
    fkey = _field_key(sid, fid)
    label = f.get("label", {})
    label_text = label.get(_LANG) or label.get("ur") or fid
    ph = f.get("placeholder", {})
    ph_text = ph.get(_LANG) or ph.get("ur", "")
    height = f.get("height", 80)

    if label_text:
        st.markdown(f'<div class="bhc-field-label">{label_text}</div>', unsafe_allow_html=True)
    st.text_area(label_text, key=fkey, height=height, placeholder=ph_text,
                 label_visibility="collapsed")
    _render_chips(sid, fid, f.get("chips"))
    for extra in _context_chips_for(sid, fid):
        _render_chips(sid, fid, extra)


# ------------------------------------------------------------------ #
# اگلا سوال — اسٹیٹک رہنمائی + ایل ایل ایم (نسخہ 2.1)
# ------------------------------------------------------------------ #
STATIC_QUESTION_HINTS = {
    "chief": {
        "ur": ["دورانیہ: کتنا دن/ہفتہ سے ہے؟", "جسم کے کس حصے میں ہے، اور کیا محل بدلتا ہے؟", "صبح، دوپہر یا رات زیادہ ہے؟"],
        "en": ["Duration: how long has it been there?", "Where exactly, and does it move?", "Worse in morning, afternoon or night?"],
        "roman": ["Doraana: kitne din se hai?", "Jis hisse me hai, kya mahal badalta hai?", "Subah, dopehar ya raat zyada hai?"],
    },
    "other_symptoms": {
        "ur": ["پہلے کون سی علامت آئی، اور پھر کون سی؟", "کیا کوئی علامت باقاعدگی سے آتی جاتی ہے؟", "علاج یا کسی واقعے کے بعد کیا بدل گیا؟"],
        "en": ["Which symptom came first?", "Any symptom that comes and goes regularly?", "What changed after treatment or an event?"],
        "roman": ["Pehle kon si alamat aayi?", "Koi alamat baqaidgi se aati jaati hai?", "Ilaj ya waqiye ke baad kya badla?"],
    },
    "causation": {
        "ur": ["کیا یہ جذبات (غصہ، غم، صدمہ) کے بعد شروع ہوا؟", "سردی لگنا، ویکسین یا پرانی بیماری؟", "خاندان میں اسی مرض کا رجحان؟"],
        "en": ["Did it start after an emotion (anger, grief, shock)?", "Cold exposure, vaccination or past illness?", "Family tendency for this disease?"],
        "roman": ["Kya yeh jazbati (ghussa, gham, sadma) ke baad shuru hua?", "Sardi, vaccine ya purani bimari?", "Khandan me is marz ka rojhan?"],
    },
    "mental": {
        "ur": ["اضطراب، خوف یا چڑچڑاپن؟ کیا اس کا محرک ہے؟", "بھوک یا کسی کھانے کی خاص خواہش/نفرت؟", "نیند کی کیفیت: کیسے سوتے ہیں؟"],
        "en": ["Anxiety, fear or irritability? What triggers it?", "Appetite or craving/aversion for any food?", "Sleep quality: how do they fall asleep?"],
        "roman": ["Iztirab, khauf ya chirchirapan? Kis se chalta hai?", "Bhook ya kisi khanay ki khwahish/nafrat?", "Neend ki kawaif: kaise sote hain?"],
    },
    "generals": {
        "ur": ["بھوک: اچھی ہے یا کم؟", "پیاس: زیادہ ہے یا تقریباً نہیں؟", "گرمی یا سردی کی طبیعت؟"],
        "en": ["Appetite: good or poor?", "Thirst: excessive or almost none?", "Hot or chilly nature?"],
        "roman": ["Bhook: achi hai ya kam?", "Pyas: zyada hai ya taa'ayan nahin?", "Garmi ya sardi ki tabiyat?"],
    },
    "sleep": {
        "ur": ["کیسے سوتے ہیں؟", "رات میں جاگتے ہیں؟ کس وقت؟", "خواب آتے ہیں؟ کس قسم کے؟"],
        "en": ["How do they fall asleep?", "Do they wake at night? What time?", "Dreams? What kind?"],
        "roman": ["Kaise sote hain?", "Raat me jagte hain? Kis waqt?", "Khwab aate hain? Kis qism ke?"],
    },
    "history": {
        "ur": ["ماضی کی بیماریاں اور علاج؟", "خاندانی امراض (شوگر، بلڈ پریشر، جلد)؟", "ایلرگیاں یا کھانے کی نفرت؟"],
        "en": ["Past illnesses and treatments?", "Family diseases (sugar, BP, skin)?", "Allergies or food aversions?"],
        "roman": ["Maazi ke bimariyan aur ilaj?", "Khandani amraaz (shugar, BP, jild)?", "Allergy ya khanay ki nafrat?"],
    },
    "modalities": {
        "ur": ["کیا بڑھاتا ہے؟ (وقت، حرکت، موسم)", "کیا آرام دیتا ہے؟", "موسم یا وضع کی کوئی خواہش؟"],
        "en": ["What aggravates? (time, motion, weather)", "What brings relief?", "Any desire for climate or posture?"],
        "roman": ["Kya barhata hai? (waqt, harakat, mausam)", "Kya aaram deta hai?", "Mausam ya waz'ah ki khwahish?"],
    },
}

_QUESTIONS_CACHE = {}


def _llm_questions(text: str, sid: str) -> list:
    """درج شدہ متن کے مطابق ایل ایل ایم سے 3 متلاشی سوالات (کیش شدہ)"""
    import hashlib as _h
    key = _h.md5(f"{sid}|{text}".encode("utf-8")).hexdigest()
    if key in _QUESTIONS_CACHE:
        return _QUESTIONS_CACHE[key]
    static = STATIC_QUESTION_HINTS.get(sid, {}).get(_LANG) or STATIC_QUESTION_HINTS.get(sid, {}).get("ur", [])
    try:
        lang_name = {"ur": "Urdu", "en": "English", "roman": "Roman Urdu"}[_LANG]
        prompt = (
            "You are an expert homeopathic case-taking assistant. "
            "Based on the patient data entered so far, suggest EXACTLY 3 specific "
            "follow-up questions that would sharpen the case (modalities, particulars, "
            "generals, or causation). Do not repeat information already given. "
            f"Write the questions in {lang_name}.\n\n"
            f"Patient data so far:\n{text}\n\n"
            'Return ONLY valid JSON: {"questions":["q1","q2","q3"]}'
        )
        raw, _ = llm_mod.ask_llm(prompt, require_json=True, temperature=0.2)
        data = llm_mod.extract_json(raw)
        qs = [str(q).strip() for q in data.get("questions", []) if str(q).strip()][:3]
        if qs:
            if len(_QUESTIONS_CACHE) >= 300:
                try:
                    _QUESTIONS_CACHE.pop(next(iter(_QUESTIONS_CACHE)))
                except Exception:
                    pass
            _QUESTIONS_CACHE[key] = qs
            return qs
    except Exception:
        pass
    return static


def _render_next_questions(step: dict):
    """ہر مواد ٹیب کے آخر میں: اسٹیٹک رہنمائی + ایل ایل ایم بٹن"""
    sid = step["id"]
    with st.expander(t("ai_questions")):
        # اسٹیٹک تجاویز
        static = STATIC_QUESTION_HINTS.get(sid, {})
        items = static.get(_LANG) or static.get("ur", [])
        if items:
            st.markdown(f'<div style="direction:rtl;">{t("ai_questions_short")}:</div>', unsafe_allow_html=True)
            for q in items:
                st.markdown(f'&nbsp;&nbsp;• {q}', unsafe_allow_html=True)
        # ایل ایل ایم
        if st.button(t("ai_questions_btn"), key=f"aiq_{_case_type()}_{sid}"):
            text = " | ".join(
                (st.session_state.get(_field_key(sid, f["id"]), "") or "")
                for f in step.get("fields", [])
            ).strip()
            if len(text) < 10:
                st.info(t("no_symptoms"))
                return
            with st.spinner("..."):
                qs = _llm_questions(text, sid)
            for q in qs:
                st.markdown(f'🤖 {q}')


# ------------------------------------------------------------------ #
# مکمل کیس نوٹ سے خودکار بھرنا (نسخہ 2.1)
# ------------------------------------------------------------------ #
def _auto_fill_from_note(runner: FlowRunner, note: str) -> tuple:
    fields = []
    for step in runner.steps:
        for f in step.get("fields", []):
            label = f.get("label", {}).get(_LANG) or f.get("label", {}).get("ur", "")
            fields.append((step["id"], f["id"], label))
    lines = "\n".join(f"{sid}::{fid} — {lbl}" for sid, fid, lbl in fields)
    prompt = f"""You are a homeopathic case-taking assistant. Below is a raw case note (it may be in Urdu, Roman Urdu or English). Extract the relevant information into the structured fields.

Fields (use the "sid::fid" format as keys EXACTLY as listed):
{lines}

Case note:
\"\"\"{note}\"\"\"

Rules:
- For each field, output the relevant text from the note, keeping the original wording.
- If a field has no information in the note, output an empty string.
- Do not invent information.

Return ONLY valid JSON: {{"sid::fid": "text", ...}}"""
    raw, prov = llm_mod.ask_llm(prompt, require_json=True, temperature=0.0)
    data = llm_mod.extract_json(raw)
    filled = 0
    for sid, fid, _lbl in fields:
        v = str(data.get(f"{sid}::{fid}", "") or "").strip()
        if v:
            st.session_state[_field_key(sid, fid)] = v
            filled += 1
    return filled, prov


def _render_case_note_expander(runner: FlowRunner):
    """نسخہ 2.2: یہ بلاک اب ٹیبز سے اوپر ہے، اور مائک اسی خانے کے
    نیچے کونے میں ہے (گوگل سرچ کی طرز)۔"""
    with st.expander(t("case_note_fill")):
        with st.container(key="bhc_notebox"):
            note = st.text_area(t("case_note_ph"), key="bc_case_note", height=160,
                                label_visibility="collapsed")
            mic_on = bool(st.session_state.get("bc_mic_open"))
            if st.button("🎙️", key="bc_mic_btn", help=t("mic_help"),
                         type="primary" if mic_on else "secondary"):
                st.session_state.bc_mic_open = not mic_on
                st.rerun()

        # مائک کھلا ہو تو ریکارڈنگ والا وجٹ (اسی بلاک کے اندر)
        if st.session_state.get("bc_mic_open"):
            _voice_capture("bc_case_note")

        toast = st.session_state.pop("bc_note_toast", None)
        if toast:
            st.success(toast)

        if st.button(t("case_note_fill"), use_container_width=True, key="case_note_btn"):
            if not (note or "").strip():
                st.info(t("no_symptoms"))
                return
            with st.spinner("..."):
                try:
                    filled, prov = _auto_fill_from_note(runner, note.strip())
                    if filled:
                        st.session_state.bc_note_toast = f"{t('case_note_done')} ({filled}) 🤖 {prov}"
                        st.session_state.bc_clear_note = True   # اگلے رن میں خانہ صاف
                        st.rerun()
                    else:
                        st.warning(t("ai_offline"))
                except Exception as e:
                    st.error(f"غلطی: {e}")


# ------------------------------------------------------------------ #
# آواز سے درج کرنا (گروک وِساپر — اگر کیز موجود ہو) (نسخہ 2.2)
# ------------------------------------------------------------------ #
def _groq_transcribe(audio_obj) -> str:
    if not getattr(llm_mod, "GROQ_API_KEY", ""):
        return ""
    import io
    from openai import OpenAI
    cli = OpenAI(api_key=llm_mod.GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
    try:
        data = audio_obj.getvalue()
    except Exception:
        data = bytes(audio_obj)
    buf = io.BytesIO(data)
    buf.name = "voice.webm"
    r = cli.audio.transcriptions.create(model="whisper-large-v3", file=buf)
    return str(getattr(r, "text", "") or "").strip()


def _apply_pending_edits() -> None:
    """رن کے آغاز پر (وجٹ بننے سے پہلے): آواز کا متن شامل کرنا / نوٹ خانہ صاف کرنا
    نوٹ: وجٹ بننے کے بعد سیشن اسٹیٹ بدلنا اسٹریم لٹ میں منع ہے،
    اسی لیے یہ کام 'زیرِ التوا' رکھ کر rerun پر کیا جاتا ہے۔"""
    pending = st.session_state.pop("bc_pending_voice", None)
    if pending:
        key = pending.get("key") or "bc_case_note"
        text = (pending.get("text") or "").strip()
        if text:
            cur = (st.session_state.get(key, "") or "").strip()
            st.session_state[key] = (cur + "\n" + text).strip() if cur else text
    if st.session_state.pop("bc_clear_note", False):
        st.session_state["bc_case_note"] = ""


def _voice_capture(target_key: str) -> None:
    """آواز → گروک وہسپر → ٹرانسکرپٹ → مطلوبہ فیلڈ (نسخہ 2.2)
    نئے اسٹریم لٹ پر st.audio_input (براؤزر میں ریکارڈنگ)،
    پرانے ورژن پر st.file_uploader (آڈیو فائل اپ لوڈ)۔"""
    if not getattr(llm_mod, "GROQ_API_KEY", ""):
        st.caption("ℹ️ " + t("voice_no_key"))
        return
    audio = None
    try:
        if hasattr(st, "audio_input"):
            audio = st.audio_input(t("voice_btn"), key="bc_voice_rec")
        else:
            audio = st.file_uploader(t("voice_btn"), key="bc_voice_rec",
                                     type=["webm", "wav", "mp3", "m4a", "ogg"])
    except Exception:
        return
    st.caption(t("voice_hint"))
    if audio is None:
        return
    # ایک ہی ریکارڈنگ دوبارہ پروسیس نہ ہو
    try:
        sig = getattr(audio, "file_id", None) or (
            str(getattr(audio, "name", "")) + "|" + str(len(audio.getvalue())))
    except Exception:
        sig = str(time.time())
    if sig == st.session_state.get("bc_voice_sig"):
        return
    with st.spinner("..."):
        try:
            text = _groq_transcribe(audio)
        except Exception:
            text = ""
    if text:
        st.session_state.bc_voice_sig = sig
        st.session_state.bc_pending_voice = {"key": target_key, "text": text}
        st.rerun()
    else:
        st.warning(t("voice_failed"))


# ------------------------------------------------------------------ #
# رینڈرنگ: سٹیپ مواد
# ------------------------------------------------------------------ #
def _render_step_content(step: dict, runner: FlowRunner):
    sid = step["id"]

    if step.get("module") == "repertorize":
        _render_remedy_tab(runner)
        return
    if step.get("module") == "miasm":
        _render_miasm_tab(runner)
        return
    if step.get("module") == "followup":
        _render_followup_tab()
        return

    for f in step.get("fields", []):
        _render_field(sid, f)

    # چیف کمپلینٹ درج ہو جائے تو اگلے ٹیب کی نرم رہنمائی
    if sid == "chief":
        chief_key = _field_key("chief", "chief_complaint")
        if (st.session_state.get(chief_key, "") or "").strip():
            st.markdown(f'<div class="bhc-done-hint">✅ {t("chief_added")}</div>',
                        unsafe_allow_html=True)

    _render_next_questions(step)


# ------------------------------------------------------------------ #
# ریپرٹورائزیشن ٹیب
# ------------------------------------------------------------------ #
def _symptom_signature(symptoms: list) -> str:
    return hashlib.md5("|".join(symptoms).encode("utf-8")).hexdigest()


def _generate_prescription(runner: FlowRunner, symptoms: list, res: dict,
                           char_syms: list, patient: dict):
    """حتمی نسخہ — درست طریقہ کار کے مطابق:
    ٹاپ 3–5 امیدوار دوائیں لیں، ہر ایک کی علاماتِ کلیہ اور میٹیریا میڈیکا /
    لٹریچر سے تصدیق کریں، جو پوری علامات پر اترے وہی فائنل۔
    (ایک ہی کیس پر نتیجہ مستقل رہتا ہے — temperature=0 + کیش)"""
    sig = _symptom_signature(symptoms)
    if st.session_state.get("bc_rx_sig") == sig and st.session_state.bc_rx:
        return

    ranked_lines = []
    prev = (patient.get("last_remedy") or "").strip().lower()
    for i, r in enumerate(res["remedies"][:5], 1):
        rubs = "; ".join(rb["rubric"][:48] for rb in r.get("rubrics", [])[:6])
        tag = " (previously tried, no improvement)" if prev and r["remedy"].lower() == prev else ""
        ranked_lines.append(
            f"{i}. {r['remedy']}{tag} — score {r['score']} "
            f"(matched rubrics: {r['rubric_count']}, sources: {len(r.get('sources', []))})\n"
            f"   rubrics: {rubs}"
        )
    ranked = "\n".join(ranked_lines)

    rep_labels = ", ".join(_source_label(s) for s in res.get("sources", []))
    patient_line = ""
    if patient.get("name") or patient.get("age"):
        bits = []
        if patient.get("name"):
            bits.append(str(patient["name"]))
        if patient.get("age"):
            bits.append(f"{patient['age']} years")
        if patient.get("gender"):
            bits.append(str(patient["gender"]))
        patient_line = f"\nPatient: {' , '.join(bits)}\n"
    prev_line = ""
    if prev:
        prev_line = (f"\nPreviously tried remedy: {prev} — no significant improvement. "
                     f"Avoid choosing it as primary unless strongly justified.\n")

    prompt = f"""You are an expert classical homeopathic physician.
Case type: {runner.case_type}
Repertories used in this chart: {rep_labels}
Characteristic (key) symptoms: {', '.join(char_syms) if char_syms else 'none marked'}
{patient_line}{prev_line}
Patient symptoms (totality):
{', '.join(symptoms)}

Repertorization chart — top candidates (score is only a starting point):
{ranked}

Method:
1. Treat the repertorization chart as a starting point only. The final remedy must be
   chosen from among these top 3–5 candidates.
2. Verify each candidate against the TOTALITY of the patient's symptoms using classical
   homeopathic materia medica, keynotes and literature. A candidate with a lower score
   may be chosen if it covers the characteristic symptoms better.
3. Select the ONE remedy whose materia medica picture best matches the case.
4. In the 'دلیل' section, give a short differential: why the chosen remedy fits, and
   why the other top candidates were rejected.

Write the final prescription in Urdu with exactly these headings:
منتخب بہترین دوا، دلیل (تفریق)، طاقت اور خوراک، فالو اپ، نوٹ."""

    # میٹیریا میڈیکا کی حقیقی تصدیق (کوانٹ سے کتابوں کے صفحات)
    mm_v = st.session_state.get("bc_mm") or {}
    if mm_v:
        from homeo_core.engine import materia_medica as mm_mod
        mm_text = mm_mod.format_for_prompt(mm_v)
        if mm_text:
            prompt += (
                "\n\nMateria Medica verification — real pages from the clinic's own "
                f"MM library (Qdrant):\n{mm_text}\n\n"
                "Instruction: base the final choice on these real keynotes as well as the chart. "
                "In the 'دلیل (تفریق)' section, quote 2-3 matching keynotes for the chosen remedy, "
                "and mention one or two points that did not fit."
            )
    try:
        rx, prov = llm_mod.ask_llm(prompt, require_json=False, temperature=0.0)
        st.session_state.bc_rx = rx
        st.session_state.bc_rx_sig = sig
        st.caption(f"🤖 {prov}")
    except Exception as e:
        # اے آئی دستیاب نہ ہو تو مقامی ریپرٹری + پوٹینسی انجن سے تجویز
        top = res["remedies"][0] if res.get("remedies") else None
        if top:
            pot = runner.run_potency(age=_patient_age(patient))
            st.session_state.bc_rx = (
                f"<b>{t('rx_local')}:</b> {top['remedy']} ({t('score')}: {top['score']})<br><br>"
                f"<b>{t('rx_local_dose')}:</b> 💊 {pot['potency']} — {pot['repetition']} — {pot['duration']}<br><br>"
                f"<i>{t('rx_local_note')}</i>"
            )
            st.session_state.bc_rx_sig = sig
        else:
            st.session_state.bc_rx = None
            st.info(t("ai_offline") + f" ({e})")


def _render_remedy_tab(runner: FlowRunner):
    symptoms = _collected_symptoms(runner.steps)

    # خاص/کاریکٹرسٹک علامات (اختیاری) — 1.5x وزن
    char_text = st.session_state.get("bc_char", "") or ""
    char_syms = _split_symptoms(char_text)
    all_syms = symptoms + [c for c in char_syms if c not in symptoms]

    if not all_syms:
        st.info(t("no_symptoms"))
        return

    # سیفٹی ریڈ فلیگز
    for a in _safety_alerts(all_syms):
        st.error(f"{t('emergency')}: {a} — {t('safety_note')}")

    st.markdown(f"**{t('symptoms_collected')}** ({len(all_syms)}):")
    st.markdown('<div style="margin:6px 0 10px;">' + "".join(
        f'<span class="bhc-chip">{"⭐ " if s in char_syms else ""}{s}</span>'
        for s in all_syms) + "</div>", unsafe_allow_html=True)

    st.text_input(t("char_symptom"), key="bc_char",
                  placeholder=t("char_ph"))

    selected = st.session_state.get("bc_sources", ["kent", "synthesis"])
    if not selected:
        st.warning(t("no_sources"))
        return

    weights = {s: 1.5 for s in char_syms}  # خاص علامات کو اضافی وزن

    if st.button(t("run_repertorization"), type="primary", use_container_width=True, key="run_repert"):
        with st.spinner(t("running")):
            try:
                st.session_state.bc_result = runner.run_repertorization(
                    all_syms, sources=selected, symptom_weights=weights)
            except Exception as e:
                st.error(f"غلطی: {e}")
                return
        res_tmp = st.session_state.bc_result
        # اسناپ شاٹ (آخری 5)
        snaps = st.session_state.setdefault("bc_snaps", [])
        snaps.append({
            "ts": time.strftime("%d %b %H:%M"),
            "sig": _symptom_signature(all_syms),
            "sources": selected,
            "top": [(r["remedy"], r["score"]) for r in res_tmp["remedies"][:5]],
        })
        del snaps[:-5]
        # میٹیریا میڈیکا تصدیق (کوانٹ) — ہر run میں صرف ایک بار
        try:
            from homeo_core.engine import materia_medica as mm_mod
            st.session_state.bc_mm = (
                mm_mod.verify_remedies([r["remedy"] for r in res_tmp["remedies"][:5]],
                                       all_syms[:10])
                if mm_mod.available() else {}
            )
        except Exception:
            st.session_state.bc_mm = {}

    res = st.session_state.bc_result
    if not res:
        return

    # جرمن ریپرٹری پر کوئی میچ نہ ہو تو نوٹ
    if "kent_de" in selected and not any(ru.get("source") == "kent_de" for ru in res.get("rubrics_used", [])):
        st.caption(t("german_note"))

    st.markdown(
        f'<div class="bhc-card-title">{t("results_title")} — '
        f'{t("repertories_used")}: {" + ".join(_source_label(s) for s in res.get("sources", []))}</div>',
        unsafe_allow_html=True)

    patient = _get_patient()
    prev = (patient.get("last_remedy") or "").strip().lower()

    import pandas as pd
    for i, r in enumerate(res["remedies"][:6], 1):
        srcs = " + ".join(_source_label(s) for s in r.get("sources", []))
        keynotes = " ".join(
            f'<span class="bhc-ktag">{rb["rubric"][:40]}</span>' for rb in r["rubrics"][:4])
        badge = f' <span style="color:#c0392b;font-size:12px;">{t("prev_remedy_badge")}</span>' \
            if prev and r["remedy"].lower() == prev else ""
        st.markdown(
            f"""
            <div class="bhc-remedy">
              <b style="font-size:15px;">{i}. {r['remedy']}</b>{badge} &nbsp;
              <span style="color:#1e8449;font-weight:700;">{t('score')}: {r['score']}</span><br>
              <span style="font-size:12px;color:#7f8c9a;">{t('rubrics')}: {r['rubric_count']} • {t('sources')}: {srcs}</span>
              <div style="margin-top:4px;">{keynotes}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
        # ایلپینیبلٹی: اسکور کی تفصیل
        with st.expander(t("score_breakdown")):
            rows = [{
                "Symptom": x.get("symptom", ""),
                "Rubric": x["rubric"][:60],
                "Repertory": _source_label(x.get("source", "")),
                "Grade": x.get("grade", ""),
                "Weight": x.get("weight", ""),
                "Conf": x.get("confidence", ""),
                "Contribution": x.get("contribution", ""),
            } for x in r["rubrics"][:15]]
            st.dataframe(pd.DataFrame(rows), width="stretch")

    mat = res.get("differential", {})
    if mat.get("rows"):
        st.markdown(f'<div class="bhc-card-title">{t("differential")}</div>', unsafe_allow_html=True)
        rows = [{"rubric": row["rubric"][:48], **row["cells"]} for row in mat["rows"]]
        st.dataframe(pd.DataFrame(rows), width="stretch")

    # ===== استعمال شدہ ربرکس =====
    rubrics_used = res.get("rubrics_used", [])
    st.markdown(
        f'<div class="bhc-card-title">{t("rubrics_used")} ({len(rubrics_used)})</div>',
        unsafe_allow_html=True,
    )
    if rubrics_used:
        items = []
        for ru in rubrics_used:
            sym = str(ru.get("symptom", ""))
            rub = str(ru.get("rubric", ""))
            src = _source_label(str(ru.get("source", "")))
            dim = str(ru.get("dimension", ""))
            star = "⭐ " if sym in char_syms else ""
            items.append(
                f'<div style="padding:5px 0;border-bottom:1px dashed #ecf0f1;">'
                f'<b style="color:#1a5276;">▸ {rub}</b><br>'
                f'<span style="font-size:12px;color:#7f8c9a;">🩺 {star}{sym} &nbsp;•&nbsp; 📚 {src} &nbsp;•&nbsp; {dim}</span>'
                f'</div>'
            )
        st.markdown('<div class="bhc-card">' + "".join(items) + "</div>", unsafe_allow_html=True)
    else:
        st.caption(t("no_symptoms"))

    # ===== میٹیریا میڈیکا میچ ریٹ (کوانٹ سے) =====
    mm_v = st.session_state.get("bc_mm") or {}
    if mm_v:
        st.markdown(f'<div class="bhc-card-title">{t("mm_title")}</div>', unsafe_allow_html=True)
        rows_mm = []
        for r in res["remedies"][:6]:
            v = mm_v.get(r["remedy"])
            book = (v["chunks"][0]["book"] if v and v.get("chunks") else "")[:55]
            rows_mm.append({
                "Remedy": r["remedy"],
                "MM Match %": int(v["match_rate"] * 100) if v else "—",
                "Source Book": book,
            })
        st.dataframe(pd.DataFrame(rows_mm), width="stretch")
    else:
        st.caption("ℹ️ " + t("mm_off"))

    # ===== پوٹینسی اور خوراک (نسخہ 2.1) =====
    pot = runner.run_potency(miasm=res.get("miasm_dominant"), age=_patient_age(patient))
    pot_lines = [f"💊 <b>{pot['potency']}</b> — {pot.get('range','')}"]
    if pot.get("repetition"):
        pot_lines.append(f"🔁 {pot['repetition']}")
    if pot.get("duration"):
        pot_lines.append(f"⏱ {pot['duration']}")
    if pot.get("note"):
        pot_lines.append(f"📌 {pot['note']}")
    if pot.get("miasm_note"):
        pot_lines.append(f"🌀 {pot['miasm_note']}")
    st.markdown(
        f'<div class="bhc-card-title">{t("potency_title")}</div>', unsafe_allow_html=True)
    st.markdown('<div class="bhc-card" style="direction:rtl;">' + "<br>".join(pot_lines) + "</div>",
                unsafe_allow_html=True)

    # ===== پچھلے نتائج (اسناپ شاٹس) =====
    snaps = st.session_state.get("bc_snaps", [])
    if len(snaps) > 1:
        with st.expander(f"{t('prev_results')} ({len(snaps)})"):
            for s in reversed(snaps[-5:]):
                top3 = ", ".join(f"{n} ({sc})" for n, sc in s["top"][:3])
                srcs = " + ".join(_source_label(x) for x in s["sources"])
                st.markdown(
                    f'<div style="direction:rtl;padding:4px 0;border-bottom:1px dashed #ecf0f1;">'
                    f'<b>{s["ts"]}</b> • {srcs} • {top3}</div>')

    # ===== حتمی نسخہ =====
    if st.button(t("final_prescription"), use_container_width=True, key="final_rx_btn"):
        with st.spinner("نسخہ تیار ہو رہا ہے..."):
            _generate_prescription(runner, all_syms, res, char_syms, patient)

    if st.session_state.bc_rx:
        st.markdown(
            f'<div class="bhc-card" style="background:linear-gradient(135deg,#eafaf1,#fff);'
            f'border:1px solid #a9dfbf;border-right:6px solid #27ae60;">{st.session_state.bc_rx}</div>',
            unsafe_allow_html=True,
        )
    st.markdown(f"<div style='font-size:11px;color:#7f8c9a;margin-top:8px;'>{t('final_note')}</div>",
                unsafe_allow_html=True)


# ------------------------------------------------------------------ #
# میازم ٹیب
# ------------------------------------------------------------------ #
def _render_miasm_tab(runner: FlowRunner):
    symptoms = _collected_symptoms(runner.steps)
    if not symptoms:
        st.info(t("no_symptoms"))
        return
    profile = miasm_mod.analyze_miasm(symptoms)
    dom = miasm_mod.dominant_miasm(profile)
    for m, v in profile.items():
        st.markdown(f"**{m}** — {v['percent']}%")
        st.progress(min(v["percent"] / 100, 1.0))
    st.markdown(f"**{t('dominant')}:** {dom}")


# ------------------------------------------------------------------ #
# فالو اپ ٹیب (ہیرنگ کے قوانین سمیت — نسخہ 2.1)
# ------------------------------------------------------------------ #
def _render_followup_tab():
    options = {
        "improved": t("fu_improved"),
        "aggravated_then_improved": t("fu_aggr_imp"),
        "no_change": t("fu_no_change"),
        "worse": t("fu_worse"),
    }
    labels = list(options.values())
    choice = st.radio(t("response_q"), labels, horizontal=True, key="followup_choice")
    resp_key = [k for k, v in options.items() if v == choice][0]
    from homeo_core.engine import followup as followup_mod
    d = followup_mod.decide(resp_key)
    st.markdown(
        f"""
        <div class="bhc-card">
          <b>{t('decision')}:</b> {d['action']}<br>
          <b>{t('reason')}:</b> {d['reason']}<br>
          <b>{t('next_steps')}:</b> {chr(8226).join(d['next_steps'])}
        </div>
        """,
        unsafe_allow_html=True,
    )

    # ہیرنگ کے قوانین — بہتری کی سمت کی چیک
    st.markdown(f'<div class="bhc-card-title">{t("hering_title")}</div>', unsafe_allow_html=True)
    h1 = st.checkbox(t("hering_1"), key="hering_1")
    h2 = st.checkbox(t("hering_2"), key="hering_2")
    h3 = st.checkbox(t("hering_3"), key="hering_3")
    h4 = st.checkbox(t("hering_4"), key="hering_4")
    if any([h1, h2, h3, h4]):
        hcheck = followup_mod.hering_check({
            "direction": h1,
            "center_to_periphery": h2,
            "organ_priority": h3,
            "reverse_order": h4,
        })
        bits = []
        for k, c in hcheck.items():
            if k == "compliant":
                continue
            mark = "✅" if c["observed"] else "❌"
            bits.append(f"{mark} {c['desc']}")
        verdict = "✅" if hcheck["compliant"] else "⚠️"
        st.markdown(
            f'<div class="bhc-card" style="direction:rtl;">'
            f"<br>".join(bits) + f"<br><b>{t('hering_compliant')}:</b> {verdict}"
            f"{' ' + t('fu_improved') if hcheck['compliant'] else ''}</div>",
            unsafe_allow_html=True,
        )


# ------------------------------------------------------------------ #
# مرکزی رینڈر
# ------------------------------------------------------------------ #
def render_app():
    global _LANG

    st.set_page_config(page_title="Advanced Assistant", page_icon="🩺", layout="wide")
    st.markdown(CSS, unsafe_allow_html=True)
    _init_state()
    _apply_pending_edits()      # آواز/صفائی کے زیرِ التوا کام (وجٹس سے پہلے)
    _LANG = _get_lang()

    # ===== مریض کا سیاق (?patient=) =====
    patient = _get_patient()
    if patient.get("name"):
        parts = [f"🧾 {patient['name']}"]
        if patient.get("age"):
            parts.append(str(patient["age"]))
        if patient.get("gender"):
            parts.append(patient["gender"])
        if patient.get("last_remedy"):
            parts.append(f"{t('patient_prev')}: {patient['last_remedy']}")
        st.caption(" • ".join(parts))

    # ===== ٹاپ: ایکوٹ | کرانک ٹوگل =====
    st.segmented_control(
        "case_type", ["acute", "chronic"],
        format_func=lambda c: t("acute_short") if c == "acute" else t("chronic_short"),
        key="bc_case_type",
        label_visibility="collapsed",
        on_change=_on_case_change,
        width="stretch",
    )

    runner = _cached_runner(_case_type())

    # ===== نسخہ 2.2 کا نیا لے آؤٹ =====
    # ٹوگل کے نیچے پہلی لائن: ریپرٹریز کے کلک ایبل نام (ایک ہی لائن میں)
    _render_repertory_chips()
    # دوسری لائن: "مکمل کیس نوٹ" — مائک اسی خانے کے نیچے کونے میں
    _render_case_note_expander(runner)

    # ===== نیچے: سیکشن ٹیبز (پہلا ٹیب = بنیادی شکایت، ڈیفالٹ) =====
    steps = runner.steps
    titles = [s["title"].get(_LANG, s["title"].get("ur", s["id"])) for s in steps]
    tabs = st.tabs(titles, key=f"section_tabs_{runner.case_type}")
    for tab, step in zip(tabs, steps):
        with tab:
            _render_step_content(step, runner)
