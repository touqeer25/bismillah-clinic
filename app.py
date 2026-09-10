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
# CSS — Bismillah Clinic Exact Look
# ==========================
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&family=Segoe+UI:wght@400;600;700&display=swap');

html, body, [data-testid="stAppViewContainer"] {
    background: #eef3f8 !important;
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

/* ===== CARDS ===== */
.bhc-card {
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 10px rgba(15, 40, 70, 0.05);
    padding: 18px 20px;
    margin-bottom: 14px;
}
.bhc-card-title {
    color: #0b4f75;
    font-size: 1.08rem;
    font-weight: 700;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 2px dashed #f0c14b;
}
.section-title {
    color: #0b4f75;
    font-weight: 700;
    font-size: 1rem;
    margin: 8px 0;
}

/* ===== MODE SWITCH ===== */
.mode-box {
    background: #f8fafc;
    border: 1px solid #dbe3ee;
    border-radius: 14px;
    padding: 12px 14px;
    margin-bottom: 12px;
}
.mode-books {
    background: linear-gradient(135deg, #eff6ff, #ffffff);
    border-left: 5px solid #1a6aa8;
}
.mode-ai {
    background: linear-gradient(135deg, #f5f3ff, #ffffff);
    border-left: 5px solid #7c3aed;
}

/* ===== CHIPS / BADGES ===== */
.badge-blue {background:#dbeafe;color:#1e40af;padding:3px 10px;border-radius:999px;font-size:0.78rem;font-weight:600;}
.badge-purple {background:#ede9fe;color:#6d28d9;padding:3px 10px;border-radius:999px;font-size:0.78rem;font-weight:600;}
.badge-green {background:#dcfce7;color:#166534;padding:3px 10px;border-radius:999px;font-size:0.78rem;font-weight:600;}
.badge-pink {background:#fce7f3;color:#9d174d;padding:3px 10px;border-radius:999px;font-size:0.78rem;font-weight:600;}
.badge-gold {background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:999px;font-size:0.78rem;font-weight:600;}

.source-tag {
    display:inline-block;
    background:#e0f2fe;
    color:#075985;
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
    background: linear-gradient(90deg, #e8f3fb, #ffffff);
    border-right: 5px solid #1a6aa8;
    border-radius: 10px;
    padding: 9px 12px;
    margin: 12px 0 8px 0;
    color: #0b4f75;
    font-weight: 700;
    direction: RTL;
    text-align: right;
    font-family: 'Noto Nastaliq Urdu', sans-serif;
}

.selected-box {
    background: #f0fdf4;
    border: 1px solid #86efac;
    border-radius: 12px;
    padding: 12px;
    min-height: 54px;
    direction: RTL;
    text-align: right;
    font-family: 'Noto Nastaliq Urdu', sans-serif;
    line-height: 2;
}

.remedy-card {
    background: #f8fbff;
    border: 1px solid #dbeafe;
    border-right: 4px solid #1a6aa8;
    border-radius: 12px;
    padding: 12px 14px;
    margin-bottom: 10px;
    direction: RTL;
    text-align: right;
    font-family: 'Noto Nastaliq Urdu', sans-serif;
    line-height: 1.9;
}

.rx-card {
    background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 70%);
    border: 1px solid #bbf7d0;
    border-right: 6px solid #16a34a;
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

/* buttons */
div.stButton > button {
    border-radius: 12px !important;
    font-weight: 600 !important;
    min-height: 2.3rem;
    white-space: normal !important;
    height: auto !important;
    font-family: 'Noto Nastaliq Urdu', 'Segoe UI', sans-serif;
}
div.stButton > button[kind="primary"] {
    background: #1a6aa8 !important;
    border-color: #1a6aa8 !important;
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
    if st.session_state.search_mode == "📚 کتب موڈ (Local Books Only)":
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
    for k, v in defaults.items():
        st.session_state[k] = v
    st.session_state.search_mode = keep_mode

# ==========================
# TITLE + SEARCH MODE + CASE TYPE
# ==========================
st.markdown('<div class="bhc-card-title">🧠 AI Diagnosis Studio — Symptoms to Prescription</div>', unsafe_allow_html=True)

mode_col, type_col = st.columns([2.6, 1])
with mode_col:
    mode = st.radio(
        "🔎 Search Mode (تلاش کا طریقہ):",
        [
            "📚 کتب موڈ (Local Books Only)",
            "🧠 AI موڈ (Gemini Knowledge)"
        ],
        horizontal=True,
        index=0 if st.session_state.search_mode.startswith("📚") else 1,
        help="کتب موڈ: صرف آپ کی PDFs سے۔ AI موڈ: Gemini کے مکمل علم سے۔"
    )
with type_col:
    st.session_state.case_type = st.selectbox(
        "⏱ Case Type (کیس کی قسم)",
        ["🔴 حاد (Acute)", "🔵 مزمن (Chronic)"]
    )
st.session_state.search_mode = mode
if mode.startswith("📚"):
    st.markdown("""
    <div class="mode-box mode-books">
        <b>📚 کتب موڈ فعال ہے</b><br>
        جواب صرف آپ کی اپلوڈ شدہ ہومیوپیتھک کتب (Qdrant) سے آئے گا۔<br>
        اگر کتاب میں نہ ملے تو سسٹم صاف انکار کرے گا۔ • آف لائن مستقبل کے لیے بہترین
    </div>
    """, unsafe_allow_html=True)
else:
    st.markdown("""
    <div class="mode-box mode-ai">
        <b>🧠 AI موڈ فعال ہے</b><br>
        جواب Gemini کے وسیع ہومیوپیتھک علم سے آئے گا۔<br>
        کتب کا ڈیٹا معاون ہو سکتا ہے، مگر پابندی نہیں۔ • وسیع کوریج
    </div>
    """, unsafe_allow_html=True)

# Progress
st.progress(st.session_state.step / 3, text=f"Step {st.session_state.step} of 3")

# ==========================
# STEP 1
# ==========================
if st.session_state.step == 1:
    st.markdown('<div class="bhc-card-title">📋 Step 1 — Chief Complaint</div>', unsafe_allow_html=True)

    chief = st.text_area(
        "مریض کی بنیادی شکایت / Chief Complaint",
        value=st.session_state.chief_complaint,
        placeholder="مثال: کھانسی، بخار، piles، سر درد...",
        height=110
    )

    b1, b2 = st.columns([3, 1])
    with b1:
        start = st.button("🚀 Start Case Taking / پوچھ گچھ شروع کریں", type="primary", use_container_width=True)
    with b2:
        if st.button("🔄 Reset", use_container_width=True):
            reset_case()
            st.rerun()

    if start:
        if not chief.strip():
            st.warning("بنیادی شکایت لکھیں")
        else:
            with st.spinner("کیٹگری سوالات تیار ہو رہے ہیں..."):
                st.session_state.chief_complaint = chief.strip()
                st.session_state.selected_answers = []

                results = []
                context = ""
                if st.session_state.search_mode.startswith("📚"):
                    results = search_books(chief, limit=8)
                    context = format_context(results)
                    if not context:
                        st.error("کتب موڈ: اس شکایت پر آپ کی PDFs میں کافی مواد نہیں ملا۔ AI موڈ آزمائیں یا مزید کتابیں اپلوڈ کریں۔")
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
                        st.error("کیٹگریز نہیں بن سکیں۔ دوبارہ کوشش کریں۔")
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
      <div class="bhc-card-title">🧾 Case Summary</div>
      <span class="badge-purple">{st.session_state.case_type}</span>
      <span class="badge-green">{st.session_state.search_mode.split(' ')[0]} Mode</span>
      <div class="urdu" style="margin-top:10px;"><b>شکایت:</b> {st.session_state.chief_complaint}</div>
    </div>
    """, unsafe_allow_html=True)

    if st.session_state.context_results:
        with st.expander("📚 Book Sources used"):
            st.markdown(sources_html(st.session_state.context_results), unsafe_allow_html=True)

    st.markdown('<div class="bhc-card-title">🔍 Step 2 — Case Taking (Click to select)</div>', unsafe_allow_html=True)
    st.caption("کلک = منتخب ✅ • دوبارہ کلک = ہٹے • نیچے ✕ سے بھی ڈیلیٹ")

    for i, cat in enumerate(st.session_state.categories):
        st.markdown(f"<div class='category-title'>📂 {cat.get('category', f'Category {i+1}')}</div>", unsafe_allow_html=True)
        render_options(f"c{i}", cat.get("options", []))

    st.markdown('<div class="section-title">✅ Selected Answers</div>', unsafe_allow_html=True)
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
        "Extra notes / اضافی تفصیل",
        value=st.session_state.extra_notes,
        height=90,
        placeholder="جو بٹن میں نہ ہو یہاں لکھیں..."
    )

    c1, c2, c3 = st.columns([1, 1, 2])
    with c1:
        if st.button("⬅️ Back", use_container_width=True):
            st.session_state.step = 1
            st.rerun()
    with c2:
        if st.button("🧹 Clear", use_container_width=True):
            st.session_state.selected_answers = []
            st.rerun()
    with c3:
        if st.button("Find Remedies / تفریقی تشخیص ➔", type="primary", use_container_width=True):
            if not st.session_state.selected_answers and not st.session_state.extra_notes.strip():
                st.warning("کم از کم کچھ منتخب کریں")
            else:
                with st.spinner("ادویات تلاش کی جا رہی ہیں..."):
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
                            st.error("کتب موڈ: کافی میچ نہیں ملا۔")
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
    st.markdown('<div class="bhc-card-title">🌿 Step 3 — Candidate Remedies & Differential</div>', unsafe_allow_html=True)

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
        st.warning("کوئی امیدوار دوائی نہیں ملی")

    if st.session_state.diff_categories:
        st.markdown("#### ⚖️ Differential Questions")
        for i, cat in enumerate(st.session_state.diff_categories):
            st.markdown(f"<div class='category-title'>⚖️ {cat.get('category','Diff')}</div>", unsafe_allow_html=True)
            render_options(f"d{i}", cat.get("options", []))

    st.markdown("#### ✅ All selected")
    if st.session_state.selected_answers:
        cols = st.columns(4)
        for i, ans in enumerate(list(st.session_state.selected_answers)):
            with cols[i % 4]:
                if st.button(f"✕ {ans}", key=f"rm3-{i}-{ans}", use_container_width=True):
                    st.session_state.selected_answers.remove(ans)
                    st.rerun()

    extra = st.text_area("Final note", height=70, placeholder="آخری نوٹ...")

    c1, c2 = st.columns([1, 3])
    with c1:
        if st.button("⬅️ Back", use_container_width=True):
            st.session_state.step = 2
            st.rerun()
    with c2:
        if st.button("✅ Final Prescription / حتمی نسخہ", type="primary", use_container_width=True):
            with st.spinner("نسخہ تیار ہو رہا ہے..."):
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
                        st.error("کتب موڈ: کافی مواد نہیں")
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
          <h3 style="color:#166534;margin-top:0;">📋 Final Homeopathic Prescription</h3>
          {st.session_state.final_prescription}
          <hr>
          <div><b>Sources:</b><br>{sources_html(st.session_state.context_results)}</div>
        </div>
        """, unsafe_allow_html=True)

        if st.button("🔄 New Case", use_container_width=True):
            reset_case()
            st.rerun()