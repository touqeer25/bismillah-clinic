"""
streamlit_page.py — اڈاپٹو ایڈوانس اسسٹنٹ کی مکمل یو آئی (اسٹریم لٹ)
------------------------------------------------------------------
homeo_core کے FlowRunner پر بنی ایک مکمل اڈاپٹو یو آئی:
  - اکیوٹ: 4 مراحل (مختصر راستہ)
  - کرانک: 8 مراحل (گہرا راستہ + میازم + فالو اپ)
  - ہر مرحلہ کنفیگریشن سے آتا ہے — کوئی ہارڈ کوڈ نہیں
  - مکملیت اسکور، تفریق میٹرکس، پوٹینسی، اعتماد — سب شامل

استعمال:  advanced_assistant.py (پتلا انٹری پوائنٹ) اسے بلاتا ہے۔
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
from homeo_core.engine import potency as potency_mod          # noqa: E402
from homeo_core.engine import sources as sources_mod          # noqa: E402

# ------------------------------------------------------------------ #
# زبان
# ------------------------------------------------------------------ #
def get_lang() -> str:
    try:
        v = st.query_params.get("lang", "ur")
    except Exception:
        v = "ur"
    if isinstance(v, list):
        v = v[0] if v else "ur"
    return v if v in ("ur", "en", "roman") else "ur"


LANG = get_lang()

T = {
    "title": {"ur": "بسم اللہ ہومیو اسسٹنٹ — اڈاپٹو ایڈوانس", "en": "Bismillah Homeo Assistant — Adaptive Advanced", "roman": "Bismillah Homeo Assistant — Adaptive Advanced"},
    "subtitle": {"ur": "مریض کی انفرادیت مرکز — علامات سے نسخہ تک", "en": "Patient Individualization — Symptoms to Prescription", "roman": "Mareez ki infiradiyat — Alamat se Nuskha tak"},
    "case_type": {"ur": "کیس کی قسم", "en": "Case Type", "roman": "Case Type"},
    "acute": {"ur": "🔴 حاد (ایکیوٹ)", "en": "🔴 Acute", "roman": "🔴 Acute"},
    "chronic": {"ur": "🔵 مزمن (کرانک)", "en": "🔵 Chronic", "roman": "🔵 Chronic"},
    "step": {"ur": "مرحلہ", "en": "Step", "roman": "Step"},
    "of": {"ur": "از", "en": "of", "roman": "of"},
    "completeness": {"ur": "کیس کی مکملیت", "en": "Case Completeness", "roman": "Case Completeness"},
    "missing": {"ur": "یہ جہتیں ابھی ادھوری ہیں:", "en": "These dimensions are incomplete:", "roman": "Yeh jihatein adhuri hain:"},
    "chief_label": {"ur": "مریض کی بنیادی شکایت", "en": "Chief Complaint", "roman": "Mareez ki bunyadi shikayat"},
    "chief_ph": {"ur": "مثال: خشک کھانسی، حرکت سے بڑھتی ہے...", "en": "e.g. dry cough, worse from motion...", "roman": "e.g. khushk khansi..."},
    "select_topics": {"ur": "منتخب کریں (کلک کریں)", "en": "Select topics", "roman": "Muntakhab karein"},
    "free_text": {"ur": "اضافی تفصیل / نوٹس", "en": "Additional details / notes", "roman": "Izafi tafseel"},
    "free_ph": {"ur": "جو اوپر نہ ہو یہاں لکھیں...", "en": "Write anything not listed above...", "roman": "Jo upar na ho yahan likhein..."},
    "symptoms_collected": {"ur": "جمع شدہ علامات", "en": "Collected Symptoms", "roman": "Jama shuda alamaat"},
    "run_repertorization": {"ur": "🌿 ریپرٹورائزیشن چلائیں", "en": "🌿 Run Repertorization", "roman": "🌿 Repertorization chalain"},
    "running": {"ur": "ربرکس اور ادویات تلاش کی جا رہی ہیں...", "en": "Searching rubrics and remedies...", "roman": "Rubrics aur adwiyat talash ho rahi hain..."},
    "results_title": {"ur": "📊 ریپرٹورائزیشن نتیجہ", "en": "📊 Repertorization Result", "roman": "📊 Repertorization Natija"},
    "remedy": {"ur": "دوا", "en": "Remedy", "roman": "Dawa"},
    "score": {"ur": "اسکور", "en": "Score", "roman": "Score"},
    "rubrics": {"ur": "ربرکس", "en": "Rubrics", "roman": "Rubrics"},
    "sources": {"ur": "ریپرٹریز", "en": "Repertories", "roman": "Repertories"},
    "differential": {"ur": "⚖ تفریق میٹرکس", "en": "⚖ Differential Matrix", "roman": "⚖ Differential Matrix"},
    "miasm_title": {"ur": "🌀 میازم تجزیہ", "en": "🌀 Miasm Analysis", "roman": "🌀 Miasm Analysis"},
    "dominant": {"ur": "غالب میازم", "en": "Dominant Miasm", "roman": "Ghalib Miasm"},
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
    return T.get(key, {}).get(LANG, T.get(key, {}).get("ur", key))


# ------------------------------------------------------------------ #
# اسٹائل
# ------------------------------------------------------------------ #
CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap');
.bhc-hero{background:linear-gradient(120deg,#0b5d3b,#0e7c7b);color:#fff;border-radius:16px;
  padding:20px 26px;margin-bottom:16px;}
.bhc-hero h1{margin:0;font-size:22px;}
.bhc-hero .sub{opacity:.9;font-size:13px;margin-top:4px;}
.bhc-badge{display:inline-block;border-radius:20px;padding:3px 12px;font-size:12px;font-weight:700;
  margin-left:6px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.4);}
.bhc-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;margin-bottom:12px;}
.bhc-cat{font-weight:700;font-size:14px;margin-bottom:6px;color:#2c3e50;}
.bhc-remedy{display:flex;gap:12px;border:1px solid #e2e8f0;border-radius:12px;padding:12px 15px;margin-bottom:10px;background:linear-gradient(135deg,#fff,#f6fbf9);}
.bhc-rank{flex:0 0 40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;
  font-weight:800;font-size:18px;color:#fff;}
.bhc-r1{background:linear-gradient(135deg,#f1c40f,#f39c12);}
.bhc-r2{background:linear-gradient(135deg,#bdc3c7,#95a5a6);}
.bhc-r3{background:linear-gradient(135deg,#e67e22,#ca6f1e);}
.bhc-ktag{display:inline-block;background:#eef4ff;color:#2c5282;border:1px solid #d3e2fa;border-radius:8px;
  padding:2px 9px;font-size:11px;font-weight:700;margin:2px;}
.bhc-src{font-size:11px;color:#7f8c9a;margin-top:4px;}
.bhc-chips{display:flex;flex-wrap:wrap;gap:6px;}
.bhc-chip{background:#e7f6ee;border:1px solid #bfe6cf;color:#1e8449;border-radius:20px;padding:3px 12px;font-size:12px;font-weight:700;}
</style>
"""


# ------------------------------------------------------------------ #
# کیش شدہ سورس لوڈنگ
# ------------------------------------------------------------------ #
@st.cache_resource(show_spinner=False)
def _cached_runner(case_type: str) -> FlowRunner:
    return FlowRunner(case_type)


@st.cache_resource(show_spinner=False)
def _cached_source(name: str):
    return sources_mod.get_source(name)


# ------------------------------------------------------------------ #
# سیشن سٹیٹ
# ------------------------------------------------------------------ #
def _init_state():
    if "bc_case_type" not in st.session_state:
        st.session_state.bc_case_type = "acute"
    if "bc_step" not in st.session_state:
        st.session_state.bc_step = 0
    if "bc_data" not in st.session_state:
        st.session_state.bc_data = {}          # step_id -> {"topics":[], "notes":""}
    if "bc_result" not in st.session_state:
        st.session_state.bc_result = None
    if "bc_rx" not in st.session_state:
        st.session_state.bc_rx = None


def _collected_symptoms() -> list:
    """تمام مراحل سے علامات جمع کرنا (ریپرٹورائزیشن کا ان پٹ)"""
    out = []
    data = st.session_state.bc_data
    # بنیادی شکایت
    if data.get("chief", {}).get("notes"):
        out.append(data["chief"]["notes"])
    for step_id, d in data.items():
        if step_id == "chief":
            continue
        for x in d.get("topics", []):
            out.append(x)
        if d.get("notes", "").strip():
            out.append(d["notes"].strip())
    # فالتو/خالی صاف کریں
    return [s for s in out if s and str(s).strip()]


def _render_header(runner: FlowRunner):
    cfg = runner.config
    case = st.session_state.bc_case_type
    st.markdown(
        f"""
        <div class="bhc-hero">
          <h1>🩺 {t('title')}</h1>
          <div class="sub">{t('subtitle')}</div>
          <div style="margin-top:10px;">
            <span class="bhc-badge">{cfg['label'].get(LANG, cfg['label'].get('ur'))}</span>
            <span class="bhc-badge">📚 {' + '.join(sources_mod.source_labels().get(s, s) for s in cfg.get('sources', []))}</span>
            <span class="bhc-badge">🌀 {t('miasm_title') if cfg.get('miasm_enabled') else '—'}</span>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def _render_stepper(runner: FlowRunner):
    steps = runner.steps
    cur = st.session_state.bc_step
    cols = st.columns(len(steps))
    for i, s in enumerate(steps):
        label = s["title"].get(LANG, s["title"].get("ur", s["id"]))
        mark = "✓" if i < cur else (str(i + 1))
        style = "background:#1e8449;color:#fff;" if i == cur else (
            "background:#e7f6ee;color:#1e8449;" if i < cur else "background:#eef2f7;color:#7f8c9a;")
        with cols[i]:
            st.markdown(
                f"<div style='text-align:center;'><div style='width:26px;height:26px;border-radius:50%;"
                f"margin:0 auto;display:flex;align-items:center;justify-content:center;font-weight:800;"
                f"font-size:13px;{style}'>{mark}</div>"
                f"<div style='font-size:10.5px;color:#4a5b6e;margin-top:4px;'>{label}</div></div>",
                unsafe_allow_html=True,
            )
    st.markdown("<hr style='margin:10px 0 16px;border:none;border-top:1px solid #e2e8f0;'>", unsafe_allow_html=True)


def _render_completeness(runner: FlowRunner):
    comp = runner.completeness()
    st.sidebar.markdown(f"### 📈 {t('completeness')}")
    st.sidebar.progress(min(comp["percent"] / 100, 1.0), text=f"{comp['percent']}%")
    if comp["suggestions"]:
        st.sidebar.markdown(f"**{t('missing')}**")
        for s in comp["suggestions"][:4]:
            st.sidebar.info(f"💡 {s}")


def _render_step(runner: FlowRunner):
    step = runner.steps[st.session_state.bc_step]
    sid = step["id"]
    st.markdown(f"### {step['title'].get(LANG, step['title'].get('ur', sid))}")

    data = st.session_state.bc_data.setdefault(sid, {"topics": [], "notes": ""})

    if sid == "chief":
        notes = st.text_area(t("chief_label"), value=data["notes"], height=110, placeholder=t("chief_ph"))
        data["notes"] = notes
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
            chosen = st.multiselect(t("select_topics"), topics, default=data.get("topics", []))
            data["topics"] = chosen
        notes = st.text_area(t("free_text"), value=data.get("notes", ""), height=80, placeholder=t("free_ph"))
        data["notes"] = notes


def _render_remedy_step(runner: FlowRunner):
    symptoms = _collected_symptoms()
    if not symptoms:
        st.warning(t("no_symptoms"))
        return

    st.markdown(f"**{t('symptoms_collected')}** ({len(symptoms)}):")
    st.markdown('<div class="bhc-chips">' +
                "".join(f'<span class="bhc-chip">{s}</span>' for s in symptoms) +
                "</div>", unsafe_allow_html=True)
    st.markdown("")

    if st.button(t("run_repertorization"), type="primary"):
        with st.spinner(t("running")):
            try:
                st.session_state.bc_result = runner.run_repertorization(symptoms)
            except Exception as e:
                st.error(f"غلطی: {e}")
                return

    res = st.session_state.bc_result
    if not res:
        return

    st.markdown(f"### {t('results_title')}")
    for i, r in enumerate(res["remedies"][:6], 1):
        rank_cls = "bhc-r1" if i == 1 else ("bhc-r2" if i == 2 else "bhc-r3")
        srcs = " + ".join(sources_mod.source_labels().get(s, s) for s in r.get("sources", []))
        keynotes = " ".join(f'<span class="bhc-ktag">{rb["rubric"][:42]}</span>' for rb in r["rubrics"][:4])
        st.markdown(
            f"""
            <div class="bhc-remedy">
              <div class="bhc-rank {rank_cls}">{i}</div>
              <div>
                <b style="font-size:16px;">{r['remedy']}</b> &nbsp;
                <span style="color:#1e8449;font-weight:700;">{t('score')}: {r['score']}</span><br>
                <span style="font-size:12px;color:#7f8c9a;">{t('rubrics')}: {r['rubric_count']} • {t('sources')}: {srcs}</span>
                <div style="margin-top:5px;">{keynotes}</div>
              </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    # تفریق میٹرکس
    mat = res.get("differential", {})
    if mat.get("rows"):
        st.markdown(f"### {t('differential')}")
        import pandas as pd
        remedies = mat["remedies"]
        rows = []
        for row in mat["rows"]:
            rows.append({"rubric": row["rubric"][:50], **row["cells"]})
        st.dataframe(pd.DataFrame(rows), width="stretch")

    # پوٹینسی
    st.markdown(f"### {t('potency_title')}")
    pot = runner.run_potency()
    st.markdown(
        f"""
        <div class="bhc-card">
          <b>💊 {pot['potency']}</b> ({pot.get('range','')})<br>
          <span style="font-size:13px;">🔄 {pot['repetition']} — {pot['duration']}</span><br>
          <span style="font-size:12px;color:#7f8c9a;">{pot['note']}</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # ربرکس کی فہرست
    with st.expander(t("rubrics_used")):
        for ru in res.get("rubrics_used", [])[:20]:
            st.markdown(f"• [{ru['source']}][{ru['dimension']}] {ru['rubric']}")

    # حتمی نسخہ (ایل ایل ایم)
    if st.button(t("final_prescription")):
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
            f'<div class="bhc-card" style="border:1.5px solid #cdecd6;background:linear-gradient(135deg,#f4fbf6,#fff);">'
            f"{st.session_state.bc_rx}</div>",
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
    st.markdown(f"### {t('miasm_title')}")
    for m, v in profile.items():
        pct = v["percent"]
        st.markdown(f"**{m}** — {pct}%")
        st.progress(min(pct / 100, 1.0))
    st.markdown(f"**{t('dominant')}:** {dom}")


def _render_followup_step():
    st.markdown(f"### {t('followup_title')}")
    options = {
        "improved": "✅ بہتری (عمومی)",
        "aggravated_then_improved": "⚠️ پہلے بڑھنا، پھر بہتری",
        "no_change": "❌ کوئی تبدیلی نہیں",
        "worse": "🔻 خرابی / نئی علامات",
    }
    labels = [options[k] for k in options]
    choice = st.radio(t("response_q"), labels, horizontal=True)
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
    st.set_page_config(page_title="Bismillah Homeo Assistant — Advanced", page_icon="🩺", layout="wide")
    st.markdown(CSS, unsafe_allow_html=True)
    _init_state()

    # کیس کی قسم (اوپر)
    c1, c2 = st.columns([1, 3])
    with c1:
        case_type = st.radio(
            t("case_type"),
            [t("acute"), t("chronic")],
            horizontal=False,
            index=0 if st.session_state.bc_case_type == "acute" else 1,
        )
    new_case_type = "acute" if case_type.startswith("🔴") else "chronic"
    if new_case_type != st.session_state.bc_case_type:
        st.session_state.bc_case_type = new_case_type
        st.session_state.bc_step = 0
        st.session_state.bc_data = {}
        st.session_state.bc_result = None
        st.session_state.bc_rx = None
        st.rerun()

    runner = _cached_runner(st.session_state.bc_case_type)

    _render_header(runner)
    _render_stepper(runner)
    _render_completeness(runner)

    _render_step(runner)

    # نیویگیشن
    total = runner.total_steps
    cur = st.session_state.bc_step
    b1, b2, b3 = st.columns([1, 1, 1])
    with b1:
        if cur > 0 and st.button(t("back")):
            st.session_state.bc_step -= 1
            st.rerun()
    with b2:
        if st.button(t("reset")):
            for k in ["bc_step", "bc_data", "bc_result", "bc_rx"]:
                st.session_state[k] = 0 if k == "bc_step" else ({} if k == "bc_data" else None)
            st.rerun()
    with b3:
        if cur < total - 1 and st.button(t("next")):
            st.session_state.bc_step += 1
            st.rerun()
