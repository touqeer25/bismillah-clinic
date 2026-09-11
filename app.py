import os
import re
import json
import datetime
import time
import streamlit as st
import google.generativeai as genai
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from fastembed import TextEmbedding

# ==========================
# ENV
# ==========================
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

def _get_key(name: str) -> str:
    """Read a key from env (.env) or Streamlit Secrets (Cloud)"""
    v = os.getenv(name)
    if v and v.strip():
        return v.strip()
    try:
        if name in st.secrets:
            v = st.secrets[name]
            if v and str(v).strip():
                return str(v).strip()
    except Exception:
        pass
    return ""

QDRANT_URL = _get_key("QDRANT_URL")
QDRANT_API_KEY = _get_key("QDRANT_API_KEY")
COLLECTION_NAME = _get_key("COLLECTION_NAME") or "homeopathy_knowledge"

# --- LLM engines (kam az kam ek key honi chahiye) ---
GEMINI_API_KEY = _get_key("GEMINI_API_KEY")
GROQ_API_KEY = _get_key("GROQ_API_KEY")
ZAI_API_KEY = _get_key("ZAI_API_KEY")
OPENROUTER_API_KEY = _get_key("OPENROUTER_API_KEY")

# --- model ids (env se override ho sakte hain) ---
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "models/gemini-flash-latest")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
ZAI_MODEL = os.getenv("ZAI_MODEL", "glm-4.5-flash")
ZAI_BASE = os.getenv("ZAI_BASE", "https://api.z.ai/api/paas/v4")
OR_MODEL = os.getenv("OR_MODEL", "openrouter/free")

st.set_page_config(
    page_title="Bismillah Homeopathic Clinic — AI Diagnosis",
    page_icon="🩺",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ==========================
# LANGUAGE (ur / en / roman) — main app sends ?lang= in the iframe URL
# ==========================
def get_lang():
    try:
        v = st.query_params.get("lang", "ur")
    except Exception:
        v = "ur"
    if isinstance(v, list):
        v = v[0] if v else "ur"
    return v if v in ("ur", "en", "roman") else "ur"

LANG = get_lang()

T = {
    "ur": {
        "studio_title": "🧠 اے آئی تشخیص اسٹوڈیو — علامات سے نسخہ تک",
        "search_label": "🔎 سرچ موڈ (تلاش کا طریقہ):",
        "opt_books": "📚 کتب موڈ (Local Books Only)",
        "opt_ai": "🧠 اے آئی موڈ",
        "search_help": "کتب موڈ: جواب صرف آپ کی کتابوں سے • اے آئی موڈ: ماڈل کے علم سے",
        "ctype_label": "⏱ کیس کی قسم:",
        "opt_acute": "🔴 حاد (Acute)",
        "opt_chronic": "🔵 مزمن (Chronic)",
        "ctype_help": "حاد = اچانک/مختصر شکایت • مزمن = پرانی/دائمی شکایت",
        "progress": "مرحلہ {n} از 3",
        "summary_title": "🧾 کیس سمری",
        "mode_word": "موڈ",
        "shikayat": "شکایت:",
        "book_sources": "📚 استعمال شدہ کتابی حوالے",
        "step1_title": "📋 مرحلہ 1 — بنیادی شکایت",
        "chief_label": "مریض کی بنیادی شکایت",
        "chief_ph": "مثال: کھانسی، بخار، پائلز، سر درد...",
        "start_btn": "🚀 کیس ٹیکنگ شروع کریں",
        "reset_btn": "🔄 ری سیٹ",
        "warn_chief": "بنیادی شکایت لکھیں",
        "spinner_cats": "کیٹگری سوالات تیار ہو رہے ہیں...",
        "err_books_nomat": "کتب موڈ: اس شکایت پر آپ کی کتابوں میں کافی مواد نہیں ملا۔ اے آئی موڈ آزمائیں یا مزید کتابیں اپلوڈ کریں۔",
        "err_cats": "کیٹگریز نہیں بن سکیں۔ دوبارہ کوشش کریں۔",
        "step2_title": "🔍 مرحلہ 2 — کیس ٹیکنگ (کلک کر کے منتخب کریں)",
        "step2_cap": "کلک = منتخب ✅ • دوبارہ کلک = ہٹے • نیچے ✕ سے بھی ڈیلیٹ",
        "sel_title": "✅ منتخب شدہ جوابات",
        "sel_empty": "ابھی کچھ منتخب نہیں۔",
        "notes_label": "اضافی تفصیل / Extra notes",
        "notes_ph": "جو بٹن میں نہ ہو یہاں لکھیں...",
        "back_btn": "⬅️ واپس",
        "clear_btn": "🧹 صاف کریں",
        "find_btn": "امیدوار ادویات تلاش کریں ➔",
        "warn_sel": "کم از کم کچھ منتخب کریں",
        "spinner_rem": "ادویات تلاش کی جا رہی ہیں...",
        "err_books_match": "کتب موڈ: کافی میچ نہیں ملا۔",
        "step3_title": "🌿 مرحلہ 3 — امیدوار ادویات اور تفریق",
        "no_cand": "کوئی امیدوار دوائی نہیں ملی",
        "diff_title": "#### ⚖️ تفریقی سوالات",
        "allsel_title": "#### ✅ تمام منتخب شدہ",
        "finalnote": "آخری نوٹ",
        "final_ph": "آخری نوٹ...",
        "final_btn": "✅ حتمی نسخہ",
        "spinner_rx": "نسخہ تیار ہو رہا ہے...",
        "err_books_nomat2": "کتب موڈ: کافی مواد نہیں",
        "rx_title": "📋 حتمی ہومیوپیتھک نسخہ",
        "sources_word": "حوالہ جات:",
        "new_case": "🔄 نیا کیس",
        "model_label": "🤖 اے آئی انجن (ماڈل):",
        "model_auto": "🤖 اوتو — تیز ترین پہلے (فال بیک کے ساتھ)",
        "engine_help": "اوتو = سب سے تیز دستیاب انجن سے جواب • limit ختم ہو تو خود بخود اگلا انجن",
        "prov_groq": "⚡ Groq — GPT-OSS 120B (سب سے تیز)",
        "prov_groq_lim": "مفت ~1,000 درخواست/دن • 30/منٹ",
        "prov_gemini": "✨ Gemini Flash (گوگل)",
        "prov_gemini_lim": "مفت: روزانہ محدود حد (ماڈل کے مطابق)",
        "prov_glm": "🧊 GLM Flash (Z.ai — مستقل مفت)",
        "prov_glm_lim": "مستقل مفت — کوئی سخت روزانہ حد نہیں",
        "prov_or": "🛟 OpenRouter (خودکار مفت ماڈل)",
        "prov_or_lim": "مفت: ~50–200 درخواست/دن ($10 کریڈٹ پر ~1,000)",
        "engine_status": "دستیاب انجن",
        "active_model": "فعال ماڈل",
        "today_used": "آج کی درخواستیں",
        "fallback_note": "⚠️ {prev} کی حد بھر چکی تھی — جواب {cur} سے دیا گیا",
        "err_engines_all": "تمام اے آئی انجن ناکام رہے۔ Streamlit Secrets میں keys چیک کریں۔",
        "qd_test_title": "🩺 کتب ڈیٹا (Qdrant) کنکشن",
        "qd_test_btn": "🔍 کنکشن ٹیسٹ کریں",
        "qd_ok": "✅ کنکشن ٹھیک ہے — کلیکشنز: {cols}",
        "qd_empty": "🔎 Qdrant سرور نے خالی/نامکمل جواب دیا۔ عام وجوہات:\n1) Qdrant Cloud کلسٹر paused/archived ہو — cloud.qdrant.io کھول کر کلسٹر دوبارہ Resume/Restore کریں (مفت کلسٹر چند دن غیر استعمال رہنے پر خود روک دیا جاتا ہے)۔\n2) QDRANT_URL غلط ہو — فارمیٹ: https://xxxx.eu-central.aws.cloud.qdrant.io (https:// شامل ہو، آخر میں اضافی سلیش یا پاتھ نہ ہو)۔\n3) عارضی نیٹ ورک مسئلہ — صفحہ refresh کر کے دوبارہ کوشش کریں۔",
        "qd_auth": "🔑 Qdrant نے رسائی مسترد کی (401/403)۔ QDRANT_API_KEY غلط یا ختم ہو چکی ہے — cloud.qdrant.io سے نئی key لیں اور Secrets/.env اپڈیٹ کریں۔",
        "qd_404": "📦 Qdrant میں کلیکشن نہیں ملی (404)۔ COLLECTION_NAME چیک کریں (موجودہ: {col}) یا کتابوں کا ڈیٹا دوبارہ اپلوڈ کریں۔",
        "qd_conn": "🌐 Qdrant سرور تک کنکشن نہیں بن سکا (خودکار کوششیں ناکام)۔ انٹرنیٹ چیک کریں اور QDRANT_URL درست ہو: https://xxxx.cloud.qdrant.io",
        "qd_other": "Qdrant سرچ ناکام: {err}",
        "err_bad_json": "🤖 ماڈل کا جواب نامکمل/غیر JSON تھا — دوبارہ کوشش کریں یا AI انجن بدلیں۔ جواب کا آغاز: {snippet}",
    },
    "en": {
        "studio_title": "🧠 AI Diagnosis Studio — Symptoms to Prescription",
        "search_label": "🔎 Search Mode:",
        "opt_books": "📚 Books Mode (Local Books Only)",
        "opt_ai": "🧠 AI Mode",
        "search_help": "Books: answers only from your books • AI: from the model's knowledge",
        "ctype_label": "⏱ Case Type:",
        "opt_acute": "🔴 Acute",
        "opt_chronic": "🔵 Chronic",
        "ctype_help": "Acute = sudden/short complaint • Chronic = old/persistent complaint",
        "progress": "Step {n} of 3",
        "summary_title": "🧾 Case Summary",
        "mode_word": "Mode",
        "shikayat": "Complaint:",
        "book_sources": "📚 Book Sources used",
        "step1_title": "📋 Step 1 — Chief Complaint",
        "chief_label": "Patient's chief complaint",
        "chief_ph": "e.g., cough, fever, piles, headache...",
        "start_btn": "🚀 Start Case Taking",
        "reset_btn": "🔄 Reset",
        "warn_chief": "Please write the chief complaint",
        "spinner_cats": "Preparing category questions...",
        "err_books_nomat": "Books mode: not enough material in your books for this complaint. Try AI mode or upload more books.",
        "err_cats": "Could not create categories. Please try again.",
        "step2_title": "🔍 Step 2 — Case Taking (Click to select)",
        "step2_cap": "Click = select ✅ • click again = remove • or delete with ✕ below",
        "sel_title": "✅ Selected Answers",
        "sel_empty": "Nothing selected yet.",
        "notes_label": "Extra notes",
        "notes_ph": "Write anything not covered by the buttons...",
        "back_btn": "⬅️ Back",
        "clear_btn": "🧹 Clear",
        "find_btn": "Find Remedies ➔",
        "warn_sel": "Select at least something",
        "spinner_rem": "Searching remedies...",
        "err_books_match": "Books mode: not enough matches.",
        "step3_title": "🌿 Step 3 — Candidate Remedies & Differential",
        "no_cand": "No candidate remedies found",
        "diff_title": "#### ⚖️ Differential Questions",
        "allsel_title": "#### ✅ All selected",
        "finalnote": "Final note",
        "final_ph": "Final note...",
        "final_btn": "✅ Final Prescription",
        "spinner_rx": "Preparing prescription...",
        "err_books_nomat2": "Books mode: not enough material",
        "rx_title": "📋 Final Homeopathic Prescription",
        "sources_word": "Sources:",
        "new_case": "🔄 New Case",
        "model_label": "🤖 AI Engine (Model):",
        "model_auto": "🤖 Auto — fastest first (with fallback)",
        "engine_help": "Auto = answers from the fastest available engine; if its limit is hit, the next engine is used automatically",
        "prov_groq": "⚡ Groq — GPT-OSS 120B (Fastest)",
        "prov_groq_lim": "Free ~1,000 requests/day • 30/min",
        "prov_gemini": "✨ Gemini Flash (Google)",
        "prov_gemini_lim": "Free: limited daily quota (model dependent)",
        "prov_glm": "🧊 GLM Flash (Z.ai — always free)",
        "prov_glm_lim": "Always free — no hard daily cap",
        "prov_or": "🛟 OpenRouter (auto free model)",
        "prov_or_lim": "Free: ~50–200 requests/day (~1,000 with $10 credit)",
        "engine_status": "Available engines",
        "active_model": "Active model",
        "today_used": "requests today",
        "fallback_note": "⚠️ {prev} limit reached — answered by {cur}",
        "err_engines_all": "All AI engines failed. Check the keys in Streamlit Secrets.",
        "qd_test_title": "🩺 Books Data (Qdrant) Connection",
        "qd_test_btn": "🔍 Test connection",
        "qd_ok": "✅ Connection OK — collections: {cols}",
        "qd_empty": "🔎 Qdrant returned an empty/invalid response. Common causes:\n1) The Qdrant Cloud cluster is paused/archived — open cloud.qdrant.io and Resume/Restore it (free clusters auto-pause after inactivity).\n2) Wrong QDRANT_URL — format: https://xxxx.eu-central.aws.cloud.qdrant.io (must start with https://, no extra slash or path at the end).\n3) Temporary network issue — refresh the page and try again.",
        "qd_auth": "🔑 Qdrant rejected access (401/403). QDRANT_API_KEY is wrong or expired — get a new key from cloud.qdrant.io and update Secrets/.env.",
        "qd_404": "📦 Collection not found in Qdrant (404). Check COLLECTION_NAME (current: {col}) or re-upload your books data.",
        "qd_conn": "🌐 Could not reach the Qdrant server (automatic retries failed). Check your internet and verify QDRANT_URL: https://xxxx.cloud.qdrant.io",
        "qd_other": "Qdrant search failed: {err}",
        "err_bad_json": "🤖 The model reply was incomplete/not valid JSON — try again or switch the AI engine. Reply began with: {snippet}",
    },
    "roman": {
        "studio_title": "🧠 AI Diagnosis Studio — Alamaat se Nuskhah tak",
        "search_label": "🔎 Search Mode (Talash ka tareeqa):",
        "opt_books": "📚 Kitab Mode (Local Books Only)",
        "opt_ai": "🧠 AI Mode",
        "search_help": "Kitab mode: jawab sirf aap ki kitabon se • AI mode: model ke ilm se",
        "ctype_label": "⏱ Case Type (Qism):",
        "opt_acute": "🔴 Acute (Haad)",
        "opt_chronic": "🔵 Chronic (Muzmin)",
        "ctype_help": "Haad = achanak/mukhtasar shikayat • Muzmin = purani/daimi shikayat",
        "progress": "Step {n} of 3",
        "summary_title": "🧾 Case Summary",
        "mode_word": "Mode",
        "shikayat": "Shikayat:",
        "book_sources": "📚 Istemal shuda kitabi hawale",
        "step1_title": "📋 Step 1 — Bunyadi Shikayat",
        "chief_label": "Mareez ki bunyadi shikayat",
        "chief_ph": "Misal: khansi, bukhar, piles, sar dard...",
        "start_btn": "🚀 Case Taking Shuru Karein",
        "reset_btn": "🔄 Reset",
        "warn_chief": "Bunyadi shikayat likhein",
        "spinner_cats": "Category sawalat tayyar ho rahe hain...",
        "err_books_nomat": "Kitab mode: is shikayat par aap ki kitabon mein kafi material nahi mila. AI mode azmain ya mazeed kitabein upload karein.",
        "err_cats": "Categories nahi ban sakeen. Dobara koshish karein.",
        "step2_title": "🔍 Step 2 — Case Taking (Click kar ke select karein)",
        "step2_cap": "Click = select ✅ • dobara click = hat jaye • neeche ✕ se bhi delete",
        "sel_title": "✅ Selected Jawabaat",
        "sel_empty": "Abhi kuch select nahi hua.",
        "notes_label": "Extra notes / Izafi tafseel",
        "notes_ph": "Jo button mein na ho yahan likhein...",
        "back_btn": "⬅️ Wapis",
        "clear_btn": "🧹 Saaf Karein",
        "find_btn": "Remedies Talash Karein ➔",
        "warn_sel": "Kam az kam kuch select karein",
        "spinner_rem": "Adviat talash ki ja rahi hain...",
        "err_books_match": "Kitab mode: kafi match nahi mila.",
        "step3_title": "🌿 Step 3 — Candidate Remedies aur Tafreeq",
        "no_cand": "Koi candidate dawai nahi mili",
        "diff_title": "#### ⚖️ Tafreeqi Sawalat",
        "allsel_title": "#### ✅ Tamam selected",
        "finalnote": "Aakhri note",
        "final_ph": "Aakhri note...",
        "final_btn": "✅ Final Nuskhah",
        "spinner_rx": "Nuskhah tayyar ho raha hai...",
        "err_books_nomat2": "Kitab mode: kafi material nahi",
        "rx_title": "📋 Final Homeopathic Nuskhah",
        "sources_word": "Hawale:",
        "new_case": "🔄 Naya Case",
        "model_label": "🤖 AI Engine (Model):",
        "model_auto": "🤖 Auto — sab se tez pehle (fallback ke sath)",
        "engine_help": "Auto = sab se tez available engine se jawab; limit bhar jaye to khud agla engine",
        "prov_groq": "⚡ Groq — GPT-OSS 120B (Sab se tez)",
        "prov_groq_lim": "Muft ~1,000 request/din • 30/min",
        "prov_gemini": "✨ Gemini Flash (Google)",
        "prov_gemini_lim": "Muft: rozana mehdood had (model par munhasir)",
        "prov_glm": "🧊 GLM Flash (Z.ai — hamesha muft)",
        "prov_glm_lim": "Hamesha muft — koi sakht rozana had nahi",
        "prov_or": "🛟 OpenRouter (khud-kaar mift model)",
        "prov_or_lim": "Muft: ~50–200 request/din ($10 credit par ~1,000)",
        "engine_status": "Available engines",
        "active_model": "Active model",
        "today_used": "aaj ki requests",
        "fallback_note": "⚠️ {prev} ki had bhar gayi thi — jawab {cur} se diya gaya",
        "err_engines_all": "Tamam AI engine nakam rahe. Streamlit Secrets mein keys check karein.",
        "qd_test_title": "🩺 Kitabon ka Data (Qdrant) Connection",
        "qd_test_btn": "🔍 Connection test karein",
        "qd_ok": "✅ Connection theek hai — collections: {cols}",
        "qd_empty": "🔎 Qdrant server ne khali/invalid jawab diya. Aam wajuhat:\n1) Qdrant Cloud cluster paused/archived ho — cloud.qdrant.io khol kar cluster Resume/Restore karein (free cluster kuch din ghair-istemaal rehne par khud pause ho jata hai).\n2) QDRANT_URL ghalat ho — format: https://xxxx.eu-central.aws.cloud.qdrant.io (https:// shamil ho, aakhir mein extra slash ya path na ho).\n3) Aarzi network masla — page refresh kar ke dobara koshish karein.",
        "qd_auth": "🔑 Qdrant ne access reject kiya (401/403). QDRANT_API_KEY ghalat ya expire ho chuki hai — cloud.qdrant.io se nayi key lein aur Secrets/.env update karein.",
        "qd_404": "📦 Qdrant mein collection nahi mili (404). COLLECTION_NAME check karein (current: {col}) ya kitabon ka data dobara upload karein.",
        "qd_conn": "🌐 Qdrant server tak connection nahi ban saka (automatic koshishein nakam). Internet check karein aur QDRANT_URL durust ho: https://xxxx.cloud.qdrant.io",
        "qd_other": "Qdrant search nakam: {err}",
        "err_bad_json": "🤖 Model ka jawab namaqool/ghair-JSON tha — dobara koshish karein ya AI engine tabdeel karein. Jawab ka aaghaz: {snippet}",
    },
}

T = T[LANG]

# ==========================
# CSS — Bismillah Clinic Exact Look
# ==========================
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&family=Segoe+UI:wght@400;600;700&display=swap');

html, body, [data-testid="stAppViewContainer"] {
    background: #f0f4f8 !important;
    color: #2c3e50;
    font-family: 'Segoe UI', Tahoma, sans-serif;
}

/* hide default streamlit chrome */
#MainMenu, footer, header {visibility: hidden;}
[data-testid="stToolbar"] {display:none;}
.block-container {
    padding-top: 0.6rem !important;
    padding-bottom: 2rem !important;
    max-width: 1200px;
}

/* ===== CLINIC ACCENT (radio ticks, progress, focus) ===== */
:root {
    --primary-color: #2980b9;
}
div[role="progressbar"] > div {
    background: linear-gradient(90deg, #2980b9, #1a5276) !important;
}

/* ===== CARDS (same as .card in clinic style.css) ===== */
.bhc-card {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.06);
    padding: 20px;
    margin-bottom: 15px;
}
.bhc-card-title {
    color: #1a5276;
    font-size: 17px;
    font-weight: 700;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 2px solid #ecf0f1;
}
.section-title {
    color: #1a5276;
    font-weight: 700;
    font-size: 1rem;
    margin: 8px 0;
}

/* ===== CHIPS / BADGES (clinic hues) ===== */
.badge-blue {background:#d6eaf8;color:#1a5276;padding:3px 10px;border-radius:999px;font-size:0.78rem;font-weight:600;}
.badge-purple {background:#e8daef;color:#6c3483;padding:3px 10px;border-radius:999px;font-size:0.78rem;font-weight:600;}
.badge-green {background:#d5f5e3;color:#1e8449;padding:3px 10px;border-radius:999px;font-size:0.78rem;font-weight:600;}
.badge-pink {background:#fadbd8;color:#943126;padding:3px 10px;border-radius:999px;font-size:0.78rem;font-weight:600;}
.badge-gold {background:#fdebd0;color:#9c640c;padding:3px 10px;border-radius:999px;font-size:0.78rem;font-weight:600;}

.source-tag {
    display:inline-block;
    background:#d6eaf8;
    color:#1a5276;
    padding:3px 10px;
    border-radius:12px;
    font-size:0.75rem;
    margin:3px 4px;
}

/* ===== URDU ===== */
.urdu {
    direction: RTL;
    text-align: right;
    font-family: 'Noto Nastaliq Urdu', 'Segoe UI', sans-serif;
    line-height: 2.05;
}

.category-title {
    background: linear-gradient(90deg, #eaf2f8, #ffffff);
    border-right: 5px solid #2980b9;
    border-radius: 10px;
    padding: 9px 12px;
    margin: 12px 0 8px 0;
    color: #1a5276;
    font-weight: 700;
    direction: RTL;
    text-align: right;
    font-family: 'Noto Nastaliq Urdu', sans-serif;
}

.selected-box {
    background: #eafaf1;
    border: 1px solid #a9dfbf;
    border-radius: 12px;
    padding: 12px;
    min-height: 54px;
    direction: RTL;
    text-align: right;
    font-family: 'Noto Nastaliq Urdu', sans-serif;
    line-height: 2;
}

.remedy-card {
    background: #fbfdfe;
    border: 1px solid #d6eaf8;
    border-right: 4px solid #2980b9;
    border-radius: 12px;
    padding: 12px 14px;
    margin-bottom: 10px;
    direction: RTL;
    text-align: right;
    font-family: 'Noto Nastaliq Urdu', sans-serif;
    line-height: 1.9;
}

.rx-card {
    background: linear-gradient(135deg, #eafaf1 0%, #ffffff 70%);
    border: 1px solid #a9dfbf;
    border-right: 6px solid #27ae60;
    border-radius: 16px;
    padding: 20px;
    margin-top: 12px;
    direction: RTL;
    text-align: right;
    font-family: 'Noto Nastaliq Urdu', sans-serif;
    line-height: 2.1;
}

/* inputs RTL */
.stTextInput > div > div > input,
.stTextArea > div > div > textarea {
    direction: RTL;
    text-align: right;
    font-family: 'Noto Nastaliq Urdu', 'Segoe UI', sans-serif;
    border-radius: 10px !important;
}

/* buttons — same gradients as clinic .btn-primary */
div.stButton > button {
    border-radius: 8px !important;
    font-weight: 600 !important;
    min-height: 2.3rem;
    white-space: normal !important;
    height: auto !important;
    font-family: 'Noto Nastaliq Urdu', 'Segoe UI', sans-serif;
}
div.stButton > button[kind="primary"] {
    background: linear-gradient(135deg, #2980b9, #1a5276) !important;
    border: none !important;
    color: #ffffff !important;
    box-shadow: 0 2px 8px rgba(41,128,185,0.35);
}
div.stButton > button[kind="primary"]:hover {
    filter: brightness(1.07);
}
</style>
""", unsafe_allow_html=True)

# ==========================
# CHECK KEYS
# ==========================
if not (GEMINI_API_KEY or GROQ_API_KEY or ZAI_API_KEY or OPENROUTER_API_KEY):
    st.error("❌ کوئی اے آئی key نہیں ملی — GEMINI_API_KEY / GROQ_API_KEY / ZAI_API_KEY / OPENROUTER_API_KEY (.env یا Streamlit Secrets)")
    st.stop()
if not QDRANT_URL or not QDRANT_API_KEY:
    st.error("❌ Qdrant keys غائب ہیں (.env)")
    st.stop()

@st.cache_resource
def init_services():
    llm = None
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        llm = genai.GenerativeModel(GEMINI_MODEL)
    qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    embedder = TextEmbedding(
        model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    )
    return llm, qdrant, embedder

try:
    llm_model, client, embedding_model = init_services()
except Exception as e:
    st.error(f"سروسز کنیکٹ نہیں ہوئیں: {e}")
    st.stop()

# ==========================
# MULTI-MODEL REGISTRY — order = fallback priority (fastest first)
# ==========================
PROVIDERS = []
if GROQ_API_KEY:
    PROVIDERS.append({"id": "groq", "label": T["prov_groq"], "limit": T["prov_groq_lim"], "model": GROQ_MODEL})
if GEMINI_API_KEY:
    PROVIDERS.append({"id": "gemini", "label": T["prov_gemini"], "limit": T["prov_gemini_lim"], "model": GEMINI_MODEL})
if ZAI_API_KEY:
    PROVIDERS.append({"id": "glm", "label": T["prov_glm"], "limit": T["prov_glm_lim"], "model": ZAI_MODEL})
if OPENROUTER_API_KEY:
    PROVIDERS.append({"id": "openrouter", "label": T["prov_or"], "limit": T["prov_or_lim"], "model": OR_MODEL})
AUTO_CHAIN = [p["id"] for p in PROVIDERS]
PROVIDERS_BY_ID = {p["id"]: p for p in PROVIDERS}

# ==========================
# HELPERS
# ==========================
def _qdrant_kind(e):
    """Qdrant/client error ki type — friendly message ke liye"""
    s = str(e).lower()
    t = type(e).__name__.lower()
    if "jsondecode" in t or "expecting value" in s or "char 0" in s:
        return "empty"
    if ("401" in s or "402" in s or "403" in s or "unauthorized" in s or "forbidden" in s
            or "api key" in s or "permission" in s):
        return "auth"
    if "404" in s or "not found" in s or "doesn't exist" in s or "does not exist" in s:
        return "404"
    if ("timeout" in s or "timed out" in s or "connection" in s or "max retries" in s
            or "unreachable" in s or "getaddrinfo" in s or "failed to resolve" in s
            or "ssl" in s or "500" in s or "502" in s or "503" in s or "server error" in s):
        return "conn"
    return "other"


def _qdrant_msg(e):
    """Error ko dostana localized message me badalna"""
    k = _qdrant_kind(e)
    if k == "empty":
        return T["qd_empty"]
    if k == "auth":
        return T["qd_auth"]
    if k == "404":
        return T["qd_404"].format(col=COLLECTION_NAME)
    if k == "conn":
        return T["qd_conn"]
    return T["qd_other"].format(err=str(e))


def search_books(query, limit=8, min_score=0.28):
    vec = list(embedding_model.embed([query]))[0].tolist()
    last = None
    for attempt in range(3):
        try:
            res = client.query_points(
                collection_name=COLLECTION_NAME,
                query=vec,
                limit=limit
            ).points
            return [r for r in res if (r.score or 0) >= min_score]
        except Exception as e:
            last = e
            if _qdrant_kind(last) in ("empty", "auth", "404"):
                break  # retry se faida nahi
            time.sleep(0.7 * (attempt + 1))  # transient net issue → chhota wait
    raise RuntimeError(_qdrant_msg(last)) from last

def format_context(results):
    if not results:
        return ""
    out = ""
    for i, r in enumerate(results, 1):
        p = r.payload or {}
        out += (
            f"\n[Source {i}] Book: {p.get('book_name','?')} | Page: {p.get('page_number','?')} | Score: {r.score:.2f}\n"
            f"{p.get('text','')}\n"
        )
    return out

def sources_html(results):
    if not results:
        return "<i>No book sources</i>"
    html = ""
    for r in results:
        p = r.payload or {}
        html += f"<span class='source-tag'>📖 {p.get('book_name','?')} — p.{p.get('page_number','?')} ({r.score:.2f})</span>"
    return html

def extract_json(text: str):
    text = text.strip()
    m = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.I)
    if m:
        text = m.group(1).strip()
    a, b = text.find("{"), text.rfind("}")
    if a != -1 and b != -1 and b > a:
        text = text[a:b+1]
    try:
        return json.loads(text)
    except Exception as e:
        # خام JSONDecodeError ke bajaye dostana pegham + jawab ka jhalak
        snippet = " ".join(str(text).split())[:120]
        raise RuntimeError(T["err_bad_json"].format(snippet=snippet)) from e

def toggle_answer(item: str):
    s = st.session_state.selected_answers
    if item in s:
        s.remove(item)
    else:
        s.append(item)
    st.session_state.selected_answers = s

def render_options(prefix: str, options: list):
    cols = st.columns(3)
    for i, opt in enumerate(options):
        sel = opt in st.session_state.selected_answers
        with cols[i % 3]:
            st.button(
                f"{'✅ ' if sel else ''}{opt}",
                key=f"{prefix}::{opt}",
                on_click=toggle_answer,
                args=(opt,),
                use_container_width=True,
                type="primary" if sel else "secondary",
            )

def answers_text():
    return "، ".join(st.session_state.selected_answers)

# ==========================
# AI CALLS — TWO MODES
# ==========================
def generate_books_mode(task: str, context: str) -> str:
    """STRICT: only local books"""
    if not context.strip():
        return ""

    prompt = f"""
STRICT BOOKS-ONLY MODE:
- Answer ONLY from Books Context below.
- Do NOT use general homeopathic knowledge.
- If not found in context, reply exactly:
"معذرت، فراہم کردہ کتابی مواد میں اس کیس کے لیے کافی معلومات موجود نہیں ہیں۔"
- Cite sources as (کتاب: ..., صفحہ: ...)

Books Context:
{context}

Task:
{task}
"""
    return prompt


def generate_ai_mode(task: str, context: str = "") -> str:
    """AI knowledge mode (can use general knowledge + optional books)"""
    prompt = f"""
You are an expert Classical Homeopathic Physician AI.
You MAY use your full homeopathic knowledge (Materia Medica, Repertory principles, keynotes).
If optional books context is provided, you may also use it and cite it.

Optional Books Context (may be empty):
{context if context else "None"}

Task:
{task}
"""
    return prompt


BOOKS_EMPTY_MSG = "معذرت، فراہم کردہ کتابی مواد میں اس کیس کے لیے کافی معلومات موجود نہیں ہیں۔"

_OPENAI_CLIENTS = {}

def _bump_usage(pid: str):
    """Per-session daily usage counter (Streamlit session scope)"""
    today = datetime.date.today().isoformat()
    u = dict(st.session_state.get("usage") or {})
    if u.get("date") != today:
        u = {"date": today}
    u[pid] = u.get(pid, 0) + 1
    u["date"] = today
    st.session_state["usage"] = u

def _short_err(e) -> str:
    """Engine error ko mukhtasar magar fehem banana (class + status + message)"""
    name = type(e).__name__
    sc = getattr(e, "status_code", None)
    msg = getattr(e, "message", None) or str(e)
    try:
        if msg and str(msg) == str(e) and getattr(e, "body", None):
            msg = str(e.body)
    except Exception:
        pass
    msg = " ".join(str(msg).split())[:110]
    return f"{name}" + (f"[{sc}]" if sc else "") + (f": {msg}" if msg else "")


def _call_openai_compat(pid: str, model: str, prompt: str) -> str:
    """Groq / GLM(Z.ai) / OpenRouter — sab OpenAI-compatible"""
    if pid not in _OPENAI_CLIENTS:
        try:
            from openai import OpenAI
        except Exception:
            raise RuntimeError("openai package missing (requirements.txt: openai)")
        base, key = {
            "groq": ("https://api.groq.com/openai/v1", GROQ_API_KEY),
            "glm": (ZAI_BASE, ZAI_API_KEY),
            "openrouter": ("https://openrouter.ai/api/v1", OPENROUTER_API_KEY),
        }[pid]
        kw = {"api_key": key, "base_url": base}
        if pid == "openrouter":
            kw["default_headers"] = {
                "HTTP-Referer": "https://bismillah-clinic-homeo.streamlit.app",
                "X-Title": "Bismillah Homeo Assistant",
            }
        _OPENAI_CLIENTS[pid] = OpenAI(**kw)
    cli = _OPENAI_CLIENTS[pid]
    kw2 = {}
    mt = 4096
    if pid == "glm":
        # GLM-4.5 reasoning model: thinking tokens max_tokens kha jate hain -> content khali
        kw2["extra_body"] = {"thinking": {"type": "disabled"}}
        mt = 8192
    resp = cli.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=mt,
        **kw2,
    )
    msg = resp.choices[0].message if resp.choices else None
    text = (getattr(msg, "content", None) or "") if msg is not None else ""
    if not str(text).strip():
        # thinking ignore ho to reasoning_content aata hai — us me se sirf JSON hissa (agar ho)
        rc = (getattr(msg, "reasoning_content", None) or "") if msg is not None else ""
        a2, b2 = rc.find("{"), rc.rfind("}")
        text = rc[a2:b2 + 1] if (a2 != -1 and b2 > a2) else ""
    return text

def _call_gemini(prompt: str) -> str:
    if llm_model is None:
        raise RuntimeError("GEMINI_API_KEY missing")
    return llm_model.generate_content(prompt).text

def ask_llm(prompt: str):
    """Try engines in priority order; auto-fallback on any failure. Returns (text, provider)."""
    choice = st.session_state.get("engine_choice", "auto")
    if choice in PROVIDERS_BY_ID:
        chain = [choice] + [c for c in AUTO_CHAIN if c != choice]
    else:
        chain = list(AUTO_CHAIN)
    prev_label = None
    errs = []
    for pid in chain:
        p = PROVIDERS_BY_ID.get(pid)
        if not p:
            continue
        try:
            if pid == "gemini":
                text = _call_gemini(prompt)
            else:
                text = _call_openai_compat(pid, p["model"], prompt)
            if not text or not str(text).strip():
                raise RuntimeError("empty response")
            if "{" not in str(text) and "[" not in str(text):
                raise RuntimeError("non-JSON reply (no braces) -> agli engine")
            _bump_usage(pid)
            st.session_state["last_provider"] = p["label"]
            st.session_state["last_fallback"] = (prev_label, p["label"]) if prev_label else None
            return str(text), p
        except Exception as e:
            errs.append(f"{p['label']}: {_short_err(e)}")
            prev_label = p["label"]
            continue
    raise RuntimeError(T["err_engines_all"] + " (" + "; ".join(errs) + ")")

def generate(task: str, context: str = "") -> str:
    if st.session_state.search_mode.startswith("📚"):
        if not context.strip():
            return BOOKS_EMPTY_MSG
        prompt = generate_books_mode(task, context)
    else:
        prompt = generate_ai_mode(task, context)
    text, _prov = ask_llm(prompt)
    if "{" not in text and "[" not in text:
        # ek khudkar dobara koshish — sakht JSON hidayat ke sath
        text, _prov = ask_llm(prompt + "\n\nIMPORTANT: Reply with ONLY the valid JSON object. No explanations, no markdown, no extra text.")
    return text

# ==========================
# SESSION
# ==========================
defaults = {
    "step": 1,
    "search_mode": "📚 کتب موڈ (Local Books Only)",
    "case_type": "🔴 حاد (Acute)",
    "chief_complaint": "",
    "categories": [],
    "selected_answers": [],
    "extra_notes": "",
    "candidate_data": [],
    "diff_categories": [],
    "final_prescription": None,
    "context_results": [],
    "full_symptoms": "",
}
for k, v in defaults.items():
    if k not in st.session_state:
        st.session_state[k] = v

def reset_case():
    keep_mode = st.session_state.search_mode
    keep_type = st.session_state.case_type
    for k, v in defaults.items():
        st.session_state[k] = v
    st.session_state.search_mode = keep_mode
    st.session_state.case_type = keep_type

# ==========================
# TITLE + SEARCH MODE (left) + CASE TYPE (right)
# ==========================
st.markdown(f'<div class="bhc-card-title">{T["studio_title"]}</div>', unsafe_allow_html=True)

# — compact row: Search Mode | Case Type | AI Engine (limits inside the ? tooltip) —
st.session_state.setdefault("engine_choice", "auto")
_engine_labels = [T["model_auto"]] + [p["label"] for p in PROVIDERS]
_engine_ids = ["auto"] + [p["id"] for p in PROVIDERS]
_engine_idx = _engine_ids.index(st.session_state.engine_choice) if st.session_state.engine_choice in _engine_ids else 0
_engine_help = T["engine_help"] + "\n\n" + "\n".join([f"{p['label']} — {p['limit']}" for p in PROVIDERS])

mode_col, type_col, engine_col = st.columns([1.7, 1, 1.3])
with mode_col:
    mode = st.radio(
        T["search_label"],
        [T["opt_books"], T["opt_ai"]],
        horizontal=True,
        index=0 if st.session_state.search_mode.startswith("📚") else 1,
        help=T["search_help"]
    )
st.session_state.search_mode = mode
with type_col:
    st.session_state.case_type = st.radio(
        T["ctype_label"],
        [T["opt_acute"], T["opt_chronic"]],
        horizontal=True,
        index=0 if st.session_state.case_type.startswith("🔴") else 1,
        help=T["ctype_help"]
    )
with engine_col:
    _engine_choice = st.selectbox(T["model_label"], _engine_labels, index=_engine_idx, help=_engine_help)
st.session_state.engine_choice = _engine_ids[_engine_labels.index(_engine_choice)]

_usage = st.session_state.get("usage") or {}
_last_prov = st.session_state.get("last_provider")
if _last_prov:
    _used_total = sum(v for k, v in _usage.items() if isinstance(v, int))
    st.caption(f"🤖 {T['active_model']}: {_last_prov} • {T['today_used']}: {_used_total}")
_last_fb = st.session_state.get("last_fallback")
if _last_fb:
    st.info(T["fallback_note"].format(prev=_last_fb[0], cur=_last_fb[1]))

# --- Qdrant (books data) connection self-test ---
with st.expander(T["qd_test_title"]):
    if st.button(T["qd_test_btn"], key="btn_qd_test"):
        try:
            _cols = client.get_collections().collections
            _names = ", ".join(c.name for c in _cols) if _cols else "-"
            st.success(T["qd_ok"].format(cols=_names))
        except Exception as _qe:
            st.error(_qdrant_msg(_qe))

# Progress
st.progress(st.session_state.step / 3, text=T["progress"].format(n=st.session_state.step))

# ==========================
# STEP 1
# ==========================
if st.session_state.step == 1:
    st.markdown(f'<div class="bhc-card-title">{T["step1_title"]}</div>', unsafe_allow_html=True)

    chief = st.text_area(
        T["chief_label"],
        value=st.session_state.chief_complaint,
        placeholder=T["chief_ph"],
        height=110
    )

    b1, b2 = st.columns([3, 1])
    with b1:
        start = st.button(T["start_btn"], type="primary", use_container_width=True)
    with b2:
        if st.button(T["reset_btn"], use_container_width=True):
            reset_case()
            st.rerun()

    if start:
        if not chief.strip():
            st.warning(T["warn_chief"])
        else:
            with st.spinner(T["spinner_cats"]):
                st.session_state.chief_complaint = chief.strip()
                st.session_state.selected_answers = []

                results = []
                context = ""
                if st.session_state.search_mode.startswith("📚"):
                    try:
                        results = search_books(chief, limit=8)
                    except RuntimeError as _se:
                        st.error(str(_se))
                        st.stop()
                    context = format_context(results)
                    if not context:
                        st.error(T["err_books_nomat"])
                        st.stop()

                task = f"""
Chief complaint: "{chief}"
Case type: "{st.session_state.case_type}"

Create interactive case-taking categories for a homeopath.
Return ONLY valid JSON:
{{
  "categories": [
    {{"category":"کیٹگری","options":["آپشن1","آپشن2","آپشن3","آپشن4"]}}
  ]
}}
Rules:
- 5 to 7 categories in Urdu
- 3 to 6 short clickable Urdu options each
- Cover: nature/sensation, time, modalities, thirst/temp, mind, concomitants
- No remedy names
- JSON only
"""
                try:
                    raw = generate(task, context)
                    data = extract_json(raw)
                    cats = data.get("categories", [])
                    if not cats:
                        st.error(T["err_cats"])
                    else:
                        st.session_state.categories = cats
                        st.session_state.context_results = results
                        st.session_state.step = 2
                        st.rerun()
                except Exception as e:
                    st.error(f"Error: {e}")

# ==========================
# STEP 2
# ==========================
elif st.session_state.step == 2:
    # summary
    st.markdown(f"""
    <div class="bhc-card">
      <div class="bhc-card-title">{T["summary_title"]}</div>
      <span class="badge-purple">{st.session_state.case_type}</span>
      <span class="badge-green">{st.session_state.search_mode.split(' ')[0]} {T["mode_word"]}</span>
      <div class="urdu" style="margin-top:10px;"><b>{T["shikayat"]}</b> {st.session_state.chief_complaint}</div>
    </div>
    """, unsafe_allow_html=True)

    if st.session_state.context_results:
        with st.expander(T["book_sources"]):
            st.markdown(sources_html(st.session_state.context_results), unsafe_allow_html=True)

    st.markdown(f'<div class="bhc-card-title">{T["step2_title"]}</div>', unsafe_allow_html=True)
    st.caption(T["step2_cap"])

    for i, cat in enumerate(st.session_state.categories):
        st.markdown(f"<div class='category-title'>📂 {cat.get('category', f'Category {i+1}')}</div>", unsafe_allow_html=True)
        render_options(f"c{i}", cat.get("options", []))

    st.markdown(f'<div class="section-title">{T["sel_title"]}</div>', unsafe_allow_html=True)
    if st.session_state.selected_answers:
        cols = st.columns(4)
        for i, ans in enumerate(list(st.session_state.selected_answers)):
            with cols[i % 4]:
                if st.button(f"✕ {ans}", key=f"rm2-{i}-{ans}", use_container_width=True):
                    st.session_state.selected_answers.remove(ans)
                    st.rerun()
    else:
        st.markdown("<div class='selected-box'>ابھی کچھ منتخب نہیں۔</div>", unsafe_allow_html=True)

    st.session_state.extra_notes = st.text_area(
        T["notes_label"],
        value=st.session_state.extra_notes,
        height=90,
        placeholder=T["notes_ph"]
    )

    c1, c2, c3 = st.columns([1, 1, 2])
    with c1:
        if st.button(T["back_btn"], use_container_width=True):
            st.session_state.step = 1
            st.rerun()
    with c2:
        if st.button(T["clear_btn"], use_container_width=True):
            st.session_state.selected_answers = []
            st.rerun()
    with c3:
        if st.button(T["find_btn"], type="primary", use_container_width=True):
            if not st.session_state.selected_answers and not st.session_state.extra_notes.strip():
                st.warning(T["warn_sel"])
            else:
                with st.spinner(T["spinner_rem"]):
                    full = (
                        f"Chief: {st.session_state.chief_complaint}. "
                        f"Details: {answers_text()}. Notes: {st.session_state.extra_notes}"
                    )
                    results = []
                    context = ""
                    if st.session_state.search_mode.startswith("📚"):
                        results = search_books(full, limit=10)
                        context = format_context(results)
                        if not context:
                            st.error(T["err_books_match"])
                            st.stop()
                    else:
                        # AI mode: books optional support
                        results = search_books(full, limit=6, min_score=0.25)
                        context = format_context(results)

                    task = f"""
Case type: {st.session_state.case_type}
Chief: {st.session_state.chief_complaint}
Selected: {answers_text()}
Notes: {st.session_state.extra_notes}

Return ONLY valid JSON:
{{
  "candidates":[
    {{
      "remedy":"Name",
      "urdu_name":"اردو",
      "why":"کیوں (مختصر اردو)",
      "keynotes":["n1","n2"],
      "source":"حوالہ"
    }}
  ],
  "diff_categories":[
    {{"category":"تفریقی کیٹگری","options":["A","B","C"]}}
  ]
}}
- 3 to 4 remedies
- 2 to 3 differential categories with short Urdu options
- JSON only
"""
                    try:
                        raw = generate(task, context)
                        data = extract_json(raw)
                        st.session_state.candidate_data = data.get("candidates", [])
                        st.session_state.diff_categories = data.get("diff_categories", [])
                        st.session_state.full_symptoms = full
                        st.session_state.context_results = results
                        st.session_state.step = 3
                        st.rerun()
                    except Exception as e:
                        st.error(f"Error: {e}")

# ==========================
# STEP 3
# ==========================
elif st.session_state.step == 3:
    st.markdown(f'<div class="bhc-card-title">{T["step3_title"]}</div>', unsafe_allow_html=True)

    if st.session_state.candidate_data:
        for i, rem in enumerate(st.session_state.candidate_data, 1):
            kn = rem.get("keynotes", [])
            kn_txt = " • ".join(kn) if isinstance(kn, list) else str(kn)
            st.markdown(f"""
            <div class="remedy-card">
              <b>{i}. {rem.get('remedy','')} ({rem.get('urdu_name','')})</b><br>
              <b>وجہ:</b> {rem.get('why','')}<br>
              <b>Keynotes:</b> {kn_txt}<br>
              <small>📖 {rem.get('source','')}</small>
            </div>
            """, unsafe_allow_html=True)
    else:
        st.warning(T["no_cand"])

    if st.session_state.diff_categories:
        st.markdown(T["diff_title"])
        for i, cat in enumerate(st.session_state.diff_categories):
            st.markdown(f"<div class='category-title'>⚖️ {cat.get('category','Diff')}</div>", unsafe_allow_html=True)
            render_options(f"d{i}", cat.get("options", []))

    st.markdown(T["allsel_title"])
    if st.session_state.selected_answers:
        cols = st.columns(4)
        for i, ans in enumerate(list(st.session_state.selected_answers)):
            with cols[i % 4]:
                if st.button(f"✕ {ans}", key=f"rm3-{i}-{ans}", use_container_width=True):
                    st.session_state.selected_answers.remove(ans)
                    st.rerun()

    extra = st.text_area(T["finalnote"], height=70, placeholder=T["final_ph"])

    c1, c2 = st.columns([1, 3])
    with c1:
        if st.button(T["back_btn"], use_container_width=True):
            st.session_state.step = 2
            st.rerun()
    with c2:
        if st.button(T["final_btn"], type="primary", use_container_width=True):
            with st.spinner(T["spinner_rx"]):
                all_ans = answers_text()
                if extra.strip():
                    all_ans += "۔ " + extra.strip()
                combined = f"{st.session_state.full_symptoms}. Differential: {all_ans}"

                results = []
                context = ""
                if st.session_state.search_mode.startswith("📚"):
                    results = search_books(combined, limit=10)
                    context = format_context(results)
                    if not context:
                        st.error(T["err_books_nomat2"])
                        st.stop()
                else:
                    results = search_books(combined, limit=6, min_score=0.22)
                    context = format_context(results)

                task = f"""
Case type: {st.session_state.case_type}
Chief: {st.session_state.chief_complaint}
All answers: {all_ans}
Candidates: {json.dumps(st.session_state.candidate_data, ensure_ascii=False)}

Write FINAL prescription in URDU with headings:
### 💊 منتخب کردہ بہترین دوائی
### 📖 دلیل
### ⚡ طاقت اور خوراک
### 🔄 فالو اپ اور احتیاط
### 📚 حوالہ جات
### ⚠️ نوٹ
(AI assisted suggestion; final decision by physician)
"""
                try:
                    rx = generate(task, context)
                    st.session_state.final_prescription = rx
                    st.session_state.context_results = results
                except Exception as e:
                    st.error(f"Error: {e}")

    if st.session_state.final_prescription:
        st.markdown(f"""
        <div class="rx-card">
          <h3 style="color:#1e8449;margin-top:0;">{T["rx_title"]}</h3>
          {st.session_state.final_prescription}
          <hr>
          <div><b>{T["sources_word"]}</b><br>{sources_html(st.session_state.context_results)}</div>
        </div>
        """, unsafe_allow_html=True)

        if st.button(T["new_case"], use_container_width=True):
            reset_case()
