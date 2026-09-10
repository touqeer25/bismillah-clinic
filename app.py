import os
import re
import json
import streamlit as st
import google.generativeai as genai
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from fastembed import TextEmbedding

# ==========================
# ENV
# ==========================
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "homeopathy_knowledge")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

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
if not GEMINI_API_KEY:
    st.error("❌ GEMINI_API_KEY غائب ہے (.env)")
    st.stop()
if not QDRANT_URL or not QDRANT_API_KEY:
    st.error("❌ Qdrant keys غائب ہیں (.env)")
    st.stop()

genai.configure(api_key=GEMINI_API_KEY)

@st.cache_resource
def init_services():
    llm = genai.GenerativeModel("models/gemini-flash-latest")
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
# HELPERS
# ==========================
def search_books(query, limit=8, min_score=0.28):
    vec = list(embedding_model.embed([query]))[0].tolist()
    res = client.query_points(
        collection_name=COLLECTION_NAME,
        query=vec,
        limit=limit
    ).points
    return [r for r in res if (r.score or 0) >= min_score]

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
    return json.loads(text)

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
        return "معذرت، فراہم کردہ کتابی مواد میں اس کیس کے لیے کافی معلومات موجود نہیں ہیں۔"

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
    return llm_model.generate_content(prompt).text


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
    return llm_model.generate_content(prompt).text


def generate(task: str, context: str = "") -> str:
    if st.session_state.search_mode.startswith("📚"):
        return generate_books_mode(task, context)
    return generate_ai_mode(task, context)

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

mode_col, type_col = st.columns([1.7, 1])
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
                    results = search_books(chief, limit=8)
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
