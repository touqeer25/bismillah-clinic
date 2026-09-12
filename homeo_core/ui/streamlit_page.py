"""
streamlit_page.py — اڈاپٹو ایڈوانس اسسٹنٹ (کلینک جیسا ڈیزائن)
------------------------------------------------------------
homeo_core کے FlowRunner پر مبنی اڈاپٹو یو آئی، جو باقی صفحات
(ٹریٹمنٹ اسٹوڈیو / ایڈوانس تشخیص موڈز / کیس ٹیکنگ) جیسی
رنگ سکیم اور ترتیب اپناتی ہے:

  - چھوٹا (کمپیکٹ) نیلا ٹاپ بار — عنوان + زبان + کیس کی قسم، سب اوپر
  - تین زبانیں: اردو / English / Roman
  - اکیوٹ: 4 مراحل | کرانک: 8 مراحل + میازم + فالو اپ
  - رنگ: #1a5276 → #2980b9 (نیلا)، سفید کارڈز

نوٹ: زبان اور کیس کی قسم ویجٹس کو session_state سے باندھا گیا ہے
(Streamlit کا مقامی طریقہ) — کوئی دستی st.rerun() لوپ نہیں۔
"""

from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from homeo_core.flows.flow_runner import FlowRunner          # noqa: E402
from homeo_core.engine import llm as llm_mod                  # noqa: E402
from homeo_core.engine import miasm as miasm_mod              # noqa: E402
from homeo_core.engine import sources as sources_mod          # noqa: E402

LANG_LIST = ["ur", "en", "roman"]
LANG_LABELS = {"ur": "اردو", "en": "English", "roman": "Roman"}

# موجودہ زبان — render_app() کے اندر سیٹ ہوتی ہے
_LANG = "ur"

T = {
    "title": {"ur": "⚕️ ایڈوانس اسسٹنٹ 2.0", "en": "⚕️ Advanced Assistant 2.0", "roman": "⚕️ Advanced Assistant 2.0"},
    "subtitle": {"ur": "مریض کی انفرادیت — علامات سے نسخہ تک", "en": "Patient Individualization — Symptoms to Prescription", "roman": "Mareez ki infiradiyat — Alamat se Nuskha tak"},
    "language": {"ur": "زبان", "en": "Language", "roman": "Language"},
    "case_type": {"ur": "کیس کی قسم", "en": "Case Type", "roman": "Case Type"},
    "acute": {"ur": "🔴 حاد (ایکیوٹ)", "en": "🔴 Acute", "roman": "🔴 Acute"},
    "chronic": {"ur": "🔵 مزمن (کرانک)", "en": "🔵 Chronic", "roman": "🔵 Chronic"},
    "completeness": {"ur": "کیس کی مکملیت", "en": "Case Completeness", "roman": "Case Completeness"},
    "missing": {"ur": "یہ جہتیں ادھوری ہیں", "en": "Incomplete dimensions", "roman": "Yeh jihatein adhuri hain"},
    "chief_label": {"ur": "مریض کی بنیادی شکایت", "en": "Chief Complaint", "roman": "Mareez ki bunyadi shikayat"},
    "chief_ph": {"ur": "مثال: خشک کھانسی، حرکت سے بڑھتی ہے...", "en": "e.g. dry cough, worse from motion...", "roman": "e.g. khushk khansi, harkat se barhti hai..."},
    "select_topics": {"ur": "منتخب کریں (کلک کریں)", "en": "Select topics", "roman": "Muntakhab karein"},
    "free_text": {"ur": "اضافی تفصیل / نوٹس", "en": "Additional details / notes", "roman": "Izafi tafseel / notes"},
    "free_ph": {"ur": "جو اوپر نہ ہو یہاں لکھیں...", "en": "Write anything not listed above...", "roman": "Jo upar na ho yahan likhein..."},
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
    "decision": {"ur": "فیصلہ", "en": "Decision", "roman": "Faisla"},
    "reason": {"ur": "وجہ", "en": "Reason", "roman": "Wajah"},
    "next_steps": {"ur": "اگلے اقدامات", "en": "Next Steps", "roman": "Agle iqdamaat"},
    "back": {"ur": "⬅️ واپس", "en": "⬅️ Back", "roman": "⬅️ Wapis"},
    "next": {"ur": "آگے ➔", "en": "Next ➔", "roman": "Aage ➔"},
    "reset": {"ur": "🔄 نیا کیس", "en": "🔄 New Case", "roman": "🔄 Naya Case"},
    "rubrics_used": {"ur": "استعمال شدہ ربرکس", "en": "Rubrics Used", "roman": "Istemaal shuda rubrics"},
    "final_prescription": {"ur": "📋 حتمی نسخہ تیار کریں (اے آئی)", "en": "📋 Generate Final Prescription (AI)", "roman": "📋 Nuskha taiyar karein (AI)"},
    "ai_offline": {"ur": "اے آئی کیز دستیاب نہیں — مقامی ریپرٹری موڈ چل رہا ہے", "en": "No AI keys — running local repertory mode", "roman": "AI keys nahin — local repertory mode"},
    "no_symptoms": {"ur": "پہلے کچھ علامات درج کریں", "en": "Enter some symptoms first", "roman": "Pehle kuch alamaat likhein"},
    "final_note": {"ur": "⚠️ یہ اے آئی کی رہنمائی ہے — حتمی فیصلہ معالج کا ہے", "en": "⚠️ AI guidance — final decision rests with the physician", "roman": "⚠️ AI rahnumai — aakhri faisla mu'alij ka hai"},
}


def t(key: str) -> str:
    return T.get(key, {}).get(_LANG, T.get(key, {}).get("ur", key))


def _lang_from_query() -> str:
    try:
        v = st.query_params.get("lang", "ur")
    except Exception:
        v = "ur"
    if isinstance(v, list):
        v = v[0] if v else "ur"
    return v if v in ("ur", "en", "roman") else "ur"


# ------------------------------------------------------------------ #
# کلینک جیسا اسٹائل (app.py کی اصل CSS + کمپیکٹ ٹاپ بار)
# ------------------------------------------------------------------ #
CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&family=Segoe+UI:wght@400;600;700&display=swap');

html, body, [data-testid="stAppViewContainer"] {
    background: #f0f4f8 !important;
    color: #2c3e50;
    font-family: 'Segoe UI', Tahoma, sans-serif;
}
/* Streamlit کا اپنا ہیڈر/مینو چھپائیں — پیج صاف نظر آئے */
#MainMenu, footer, header {visibility: hidden;}
[data-testid="stToolbar"] {display:none;}
.block-container {
    padding-top: 0.7rem !important;
    padding-bottom: 2rem !important;
    max-width: 1200px;
}
:root { --primary-color: #2980b9; }
div[role="progressbar"] > div {
    background: linear-gradient(90deg, #2980b9, #1a5276) !important;
}

/* ===== کمپیکٹ ٹاپ بار ===== */
.bhc-topbar {
    background: linear-gradient(135deg, #1a5276, #2980b9);
    color: #fff;
    border-radius: 12px;
    padding: 10px 18px;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    box-shadow: 0 2px 10px rgba(26,82,118,.25);
}
.bhc-topbar .t { font-size: 17px; font-weight: 800; }
.bhc-topbar .s { font-size: 11.5px; opacity: .92; }

/* ===== لیبل (زبان / کیس کی قسم) ===== */
.bhc-label {
    font-size: 12px; font-weight: 700; color: #1a5276; margin-bottom: 2px;
}

/* ===== کارڈ (index.html کے .card جیسا) ===== */
.bhc-card {
    background: #ffffff;
    border: 1px solid #d1e3f8;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.06);
    padding: 18px;
    margin-bottom: 14px;
}
.bhc-card-title {
    color: #1a5276;
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #ecf0f1;
}

/* ===== سٹیپر ===== */
.bhc-step {
    display: inline-flex; align-items: center; gap: 6px;
    background: #fff; border: 1.5px solid #e1e8f0; border-radius: 20px;
    padding: 3px 12px; font-size: 11.5px; font-weight: 700; color: #7f8c9a;
    margin: 2px; direction: rtl;
}
.bhc-step .c {
    width: 18px; height: 18px; border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 10px; background: #eef2f7; color: #7f8c9a;
}
.bhc-step.on { background: #eaf2f8; border-color: #2980b9; color: #1a5276; }
.bhc-step.on .c { background: #2980b9; color: #fff; }
.bhc-step.done .c { background: #27ae60; color: #fff; }

/* ===== چپس ===== */
.bhc-chip {
    display: inline-block; background: #eafaf1; border: 1px solid #a9dfbf;
    color: #1e8449; border-radius: 20px; padding: 3px 12px; font-size: 12px;
    font-weight: 600; margin: 2px; direction: rtl;
}

/* ===== دوا کارڈ ===== */
.bhc-remedy {
    background: #fbfdfe; border: 1px solid #d6eaf8; border-right: 4px solid #2980b9;
    border-radius: 12px; padding: 11px 14px; margin-bottom: 9px; direction: rtl;
}
.bhc-ktag {
    display: inline-block; background: #e8f0fe; color: #1a5276;
    border: 1px solid #cfe0f4; border-radius: 8px; padding: 1px 8px;
    font-size: 11px; font-weight: 600; margin: 2px;
}

/* ===== ان پٹس ===== */
.stTextInput > div > div > input,
.stTextArea > div > div > textarea {
    direction: RTL; text-align: right;
    font-family: 'Noto Nastaliq Urdu', 'Segoe UI', sans-serif;
    border-radius: 10px !important;
}

/* ===== بٹن — کلینک جیسے ===== */
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
    border: none !important; color: #ffffff !important;
    box-shadow: 0 2px 8px rgba(41,128,185,0.35);
}
div.stButton > button[kind="primary"]:hover { filter: brightness(1.07); }
</style>
"""


# ------------------------------------------------------------------ #
# کیش شدہ وسائل
# ------------------------------------------------------------------ #
@st.cache_resource(show_spinner=False)
def _cached_runner(case_type: str) -> FlowRunner:
    return FlowRunner(case_type)


# ------------------------------------------------------------------ #
# سیشن سٹیٹ
# ------------------------------------------------------------------ #
def _init_state():
    if "bc_lang" not in st.session_state:
        st.session_state.bc_lang = _lang_from_query()
    st.session_state.setdefault("bc_case_type", "acute")
    st.session_state.setdefault("bc_step", 0)
    st.session_state.setdefault("bc_data", {})
    st.session_state.setdefault("bc_result", None)
    st.session_state.setdefault("bc_rx", None)


def _reset_case_state():
    st.session_state.bc_step = 0
    st.session_state.bc_data = {}
    st.session_state.bc_result = None
    st.session_state.bc_rx = None


def _on_case_change():
    _reset_case_state()


def _collected_symptoms() -> list:
    out = []
    data = st.session_state.bc_data
    if data.get("chief", {}).get("notes"):
        out.append(data["chief"]["notes"])
    for step_id, d in data.items():
        if step_id == "chief":
            continue
        for x in d.get("topics", []):
            out.append(x)
        if d.get("notes", "").strip():
            out.append(d["notes"].strip())
    return [s for s in out if s and str(s).strip()]


# ------------------------------------------------------------------ #
# سٹیپر
# ------------------------------------------------------------------ #
def _render_stepper(runner: FlowRunner):
    steps = runner.steps
    cur = st.session_state.bc_step
    html = ['<div style="margin:4px 0 10px;">']
    for i, s in enumerate(steps):
        label = s["title"].get(_LANG, s["title"].get("ur", s["id"]))
        if i < cur:
            cls, mark = "done", "✓"
        elif i == cur:
            cls, mark = "on", str(i + 1)
        else:
            cls, mark = "", str(i + 1)
        html.append(f'<span class="bhc-step {cls}"><span class="c">{mark}</span>{label}</span>')
    html.append("</div>")
    st.markdown("".join(html), unsafe_allow_html=True)


# ------------------------------------------------------------------ #
# مکملیت (کمپیکٹ)
# ------------------------------------------------------------------ #
def _render_completeness(runner: FlowRunner):
    comp = runner.completeness()
    c1, c2 = st.columns([1, 2])
    with c1:
        st.progress(min(comp["percent"] / 100, 1.0), text=f"{t('completeness')}: {comp['percent']}%")
    with c2:
        if comp["suggestions"]:
            with st.expander(t("missing")):
                for s in comp["suggestions"][:4]:
                    st.markdown(f"💡 {s}")


# ------------------------------------------------------------------ #
# مراحل
# ------------------------------------------------------------------ #
def _render_step(runner: FlowRunner):
    step = runner.steps[st.session_state.bc_step]
    sid = step["id"]
    st.markdown(
        f'<div class="bhc-card-title">{step["title"].get(_LANG, step["title"].get("ur", sid))}</div>',
        unsafe_allow_html=True,
    )

    data = st.session_state.bc_data.setdefault(sid, {"topics": [], "notes": ""})

    if sid == "chief":
        data["notes"] = st.text_area(t("chief_label"), value=data["notes"], height=100, placeholder=t("chief_ph"))
    elif step.get("module") == "repertorize":
        _render_remedy_step(runner)
        return
    elif step.get("module") == "miasm":
        _render_miasm_step()
        return
    elif step.get("module") == "followup":
        _render_followup_step()
        return
    else:
        topics = step.get("topics", [])
        if topics:
            data["topics"] = st.multiselect(t("select_topics"), topics, default=data.get("topics", []))
        data["notes"] = st.text_area(t("free_text"), value=data.get("notes", ""), height=80, placeholder=t("free_ph"))


def _render_remedy_step(runner: FlowRunner):
    symptoms = _collected_symptoms()
    if not symptoms:
        st.warning(t("no_symptoms"))
        return

    st.markdown(f"**{t('symptoms_collected')}** ({len(symptoms)}):")
    st.markdown('<div style="margin:6px 0 10px;">' + "".join(
        f'<span class="bhc-chip">{s}</span>' for s in symptoms) + "</div>", unsafe_allow_html=True)

    if st.button(t("run_repertorization"), type="primary", use_container_width=True):
        with st.spinner(t("running")):
            try:
                st.session_state.bc_result = runner.run_repertorization(symptoms)
            except Exception as e:
                st.error(f"غلطی: {e}")
                return

    res = st.session_state.bc_result
    if not res:
        return

    st.markdown(f'<div class="bhc-card-title">{t("results_title")}</div>', unsafe_allow_html=True)
    for i, r in enumerate(res["remedies"][:6], 1):
        srcs = " + ".join(sources_mod.source_labels().get(s, s) for s in r.get("sources", []))
        keynotes = " ".join(f'<span class="bhc-ktag">{rb["rubric"][:40]}</span>' for rb in r["rubrics"][:4])
        st.markdown(
            f"""
            <div class="bhc-remedy">
              <b style="font-size:15px;">{i}. {r['remedy']}</b> &nbsp;
              <span style="color:#1e8449;font-weight:700;">{t('score')}: {r['score']}</span><br>
              <span style="font-size:12px;color:#7f8c9a;">{t('rubrics')}: {r['rubric_count']} • {t('sources')}: {srcs}</span>
              <div style="margin-top:4px;">{keynotes}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    mat = res.get("differential", {})
    if mat.get("rows"):
        st.markdown(f'<div class="bhc-card-title">{t("differential")}</div>', unsafe_allow_html=True)
        import pandas as pd
        rows = [{"rubric": row["rubric"][:48], **row["cells"]} for row in mat["rows"]]
        st.dataframe(pd.DataFrame(rows), width="stretch")

    st.markdown(f'<div class="bhc-card-title">{t("potency_title")}</div>', unsafe_allow_html=True)
    pot = runner.run_potency()
    st.markdown(
        f"""
        <div class="bhc-card" style="background:linear-gradient(135deg,#eafaf1,#fff);border:1px solid #a9dfbf;">
          <b>💊 {pot['potency']}</b> ({pot.get('range', '')})<br>
          <span style="font-size:13px;">🔄 {pot['repetition']} — {pot['duration']}</span><br>
          <span style="font-size:12px;color:#7f8c9a;">{pot['note']}</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

    with st.expander(t("rubrics_used")):
        for ru in res.get("rubrics_used", [])[:20]:
            st.markdown(f"• [{ru['source']}][{ru['dimension']}] {ru['rubric']}")

    if st.button(t("final_prescription"), use_container_width=True):
        with st.spinner("نسخہ تیار ہو رہا ہے..."):
            try:
                prompt = f"""You are an expert classical homeopathic physician.
Case type: {runner.case_type}
Symptoms: {', '.join(symptoms)}
Top repertorized remedies: {', '.join(r['remedy'] for r in res['remedies'][:5])}
Write a final prescription in Urdu with headings: منتخب بہترین دوا، دلیل، طاقت اور خوراک، فالو اپ، نوٹ."""
                rx, prov = llm_mod.ask_llm(prompt, require_json=False)
                st.session_state.bc_rx = rx
                st.caption(f"🤖 {prov}")
            except Exception as e:
                st.session_state.bc_rx = None
                st.info(t("ai_offline") + f" ({e})")

    if st.session_state.bc_rx:
        st.markdown(
            f'<div class="bhc-card" style="background:linear-gradient(135deg,#eafaf1,#fff);'
            f'border:1px solid #a9dfbf;border-right:6px solid #27ae60;">{st.session_state.bc_rx}</div>',
            unsafe_allow_html=True,
        )
    st.markdown(f"<div style='font-size:11px;color:#7f8c9a;margin-top:8px;'>{t('final_note')}</div>", unsafe_allow_html=True)


def _render_miasm_step():
    symptoms = _collected_symptoms()
    if not symptoms:
        st.info(t("no_symptoms"))
        return
    profile = miasm_mod.analyze_miasm(symptoms)
    dom = miasm_mod.dominant_miasm(profile)
    for m, v in profile.items():
        st.markdown(f"**{m}** — {v['percent']}%")
        st.progress(min(v["percent"] / 100, 1.0))
    st.markdown(f"**{t('decision')}** — {dom}")


def _render_followup_step():
    options = {
        "improved": "✅ بہتری (عمومی)",
        "aggravated_then_improved": "⚠️ پہلے بڑھنا، پھر بہتری",
        "no_change": "❌ کوئی تبدیلی نہیں",
        "worse": "🔻 خرابی / نئی علامات",
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
          <b>{t('next_steps')}:</b> {" • ".join(d['next_steps'])}
        </div>
        """,
        unsafe_allow_html=True,
    )


# ------------------------------------------------------------------ #
# مرکزی رینڈر
# ------------------------------------------------------------------ #
def render_app():
    global _LANG

    st.set_page_config(page_title="Bismillah Homeo Assistant — Advanced", page_icon="🩺", layout="wide")
    st.markdown(CSS, unsafe_allow_html=True)
    _init_state()

    # موجودہ زبان کو پہلے ہی عالمی متغیر میں رکھیں (تاکہ اوپر کے لیبل بھی درست زبان میں ہوں)
    _LANG = st.session_state.bc_lang

    # ===== ٹاپ بار: عنوان + زبان + کیس کی قسم =====
    c1, c2, c3 = st.columns([2.0, 1.15, 1.15])
    with c1:
        st.markdown(
            '<div class="bhc-topbar"><div><div class="t">⚕️ ایڈوانس اسسٹنٹ 2.0</div>'
            '<div class="s">مریض کی انفرادیت — علامات سے نسخہ تک</div></div></div>',
            unsafe_allow_html=True,
        )
    with c2:
        st.markdown(f'<div class="bhc-label">{t("language")}</div>', unsafe_allow_html=True)
        # key=bc_lang → سیس مین اسٹیٹ سے براہِ راست بندھا (کوئی دستی ریرن نہیں)
        st.radio(
            t("language"), LANG_LIST, horizontal=True,
            format_func=lambda c: LANG_LABELS[c],
            key="bc_lang", label_visibility="collapsed",
        )
    with c3:
        st.markdown(f'<div class="bhc-label">{t("case_type")}</div>', unsafe_allow_html=True)
        # key=bc_case_type → سیس مین اسٹیٹ سے بندھا؛ تبدیلی پر کیس ری سیٹ
        st.radio(
            t("case_type"), ["acute", "chronic"], horizontal=True,
            format_func=lambda c: t("acute") if c == "acute" else t("chronic"),
            key="bc_case_type", label_visibility="collapsed",
            on_change=_on_case_change,
        )

    runner = _cached_runner(st.session_state.bc_case_type)

    # ===== سٹیپر + مکملیت =====
    _render_stepper(runner)
    _render_completeness(runner)

    # ===== مواد (کارڈ میں) =====
    st.markdown('<div class="bhc-card">', unsafe_allow_html=True)
    _render_step(runner)
    st.markdown('</div>', unsafe_allow_html=True)

    # ===== نیویگیشن =====
    total = runner.total_steps
    cur = st.session_state.bc_step
    b1, b2, b3 = st.columns([1, 1, 2])
    with b1:
        if cur > 0 and st.button(t("back"), use_container_width=True):
            st.session_state.bc_step -= 1
            st.rerun()
    with b2:
        if st.button(t("reset"), use_container_width=True):
            _reset_case_state()
            st.rerun()
    with b3:
        if cur < total - 1 and st.button(t("next"), type="primary", use_container_width=True):
            st.session_state.bc_step += 1
            st.rerun()
