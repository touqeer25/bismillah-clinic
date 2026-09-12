"""
streamlit_page.py — اڈاپٹو ایڈوانس اسسٹنٹ (ٹیب پر مبنی، صاف لے آؤٹ)
----------------------------------------------------------------
ڈیزائن (آخری ہدایت کے مطابق):
  - کوئی ہیڈر نہیں، کوئی زبان کا سوئچر نہیں، کوئی مکملیت بار نہیں
  - زبان والد ایپ (?lang=) سے آتی ہے
  - ٹاپ پر دو ٹوگل ٹیبز: ایکوٹ | کرانک
  - نیچے سیکشن ٹیبز — پہلا ٹیب ڈیفالٹ "بنیادی شکایت (Chief Complaint)"
  - ہر ٹیب میں فیلڈز (text area) اور ہر فیلڈ کے نیچے
    "کلک ایبل چیپ بٹن" — کلک کرنے پر متن اسی فیلڈ میں شامل ہو جاتا ہے

ڈیٹا کا نظام (الگ فائلوں میں — کوڈ چھوئے بغیر ترمیم):
  - config/acute_flow.json  /  chronic_flow.json
      → ہر فلو کے سیکشن ٹیبز اور ہر ٹیب کے فیلڈز (سوال + placeholder + chips)
  - config/quick_picks.json
      → ہر فیلڈ کے نیچے دکھنے والے ممکنہ جوابات / عام امراض
"""
from __future__ import annotations

import json
import re
import sys
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
    "ai_offline": {"ur": "اے آئی کیز دستیاب نہیں — مقامی ریپرٹری موڈ چل رہا ہے", "en": "No AI keys — running local repertory mode", "roman": "AI keys nahin — local repertory mode"},
    "no_symptoms": {"ur": "پہلے دیگر ٹیبز میں علامات درج کریں", "en": "Enter symptoms in the other tabs first", "roman": "Pehle doosri tabs me alamaat likhein"},
    "final_note": {"ur": "⚠️ یہ اے آئی کی رہنمائی ہے — حتمی فیصلہ معالج کا ہے", "en": "⚠️ AI guidance — final decision rests with the physician", "roman": "⚠️ AI rahnumai — aakhri faisla mu'alij ka hai"},
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


# ------------------------------------------------------------------ #
# کلینک جیسا اسٹائل
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
    font-size: 13px !important;
    font-weight: 600 !important;
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


def _reset_case_state():
    st.session_state.bc_result = None
    st.session_state.bc_rx = None


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
                    key=f"chip_{_case_type()}_{sid}_{fid}_{idx}",
                    on_click=_append_chip,
                    args=(fkey, labels[idx]),
                    use_container_width=True,
                )


def _render_field(sid: str, f: dict):
    """ایک فیلڈ (سوال + text area) + اس کے نیچے چیپ بٹن"""
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


# ------------------------------------------------------------------ #
# ریپرٹورائزیشن / میازم / فالو اپ ٹیبز
# ------------------------------------------------------------------ #
def _render_remedy_tab(runner: FlowRunner):
    symptoms = _collected_symptoms(runner.steps)
    if not symptoms:
        st.info(t("no_symptoms"))
        return

    st.markdown(f"**{t('symptoms_collected')}** ({len(symptoms)}):")
    st.markdown('<div style="margin:6px 0 10px;">' + "".join(
        f'<span class="bhc-chip">{s}</span>' for s in symptoms) + "</div>", unsafe_allow_html=True)

    if st.button(t("run_repertorization"), type="primary", use_container_width=True, key="run_repert"):
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

    if st.button(t("final_prescription"), use_container_width=True, key="final_rx_btn"):
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

    st.set_page_config(page_title="Advanced Assistant", page_icon="🩺", layout="wide")
    st.markdown(CSS, unsafe_allow_html=True)
    _init_state()
    _LANG = _get_lang()

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

    # ===== نیچے: سیکشن ٹیبز (پہلا ٹیب = بنیادی شکایت، ڈیفالٹ) =====
    steps = runner.steps
    titles = [s["title"].get(_LANG, s["title"].get("ur", s["id"])) for s in steps]
    tabs = st.tabs(titles, key=f"section_tabs_{runner.case_type}")
    for tab, step in zip(tabs, steps):
        with tab:
            _render_step_content(step, runner)
