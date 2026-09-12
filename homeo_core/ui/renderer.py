"""
renderer.py — کنفیگریشن کو اسٹریم لٹ میں پیش کرنا
-------------------------------------------------
app.py کے اندر سے استعمال کے لیے ایک پتلی تہہ۔
ہر مرحلہ کنفیگریشن سے آتا ہے، اس لیے اکیوٹ/کرانک دونوں ایک ہی رینڈرر سے چلتے ہیں۔

نوٹ: یہ سکیلیٹن ہے — مکمل یو آئی انضمام app.py میں کیا جائے گا۔
"""

from __future__ import annotations

from typing import Dict, List


def render_step_header(runner) -> None:
    """موجودہ مرحلے کی سرخی اور پیش رفت دکھانا"""
    try:
        import streamlit as st
    except ImportError:
        return

    step = runner.current_step
    if not step:
        return
    total = runner.total_steps
    idx = runner.current_index + 1
    st.progress(idx / total, text=f"مرحلہ {idx} از {total}")
    st.markdown(f"### {step['title'].get('ur', step['title'].get('en', ''))}")
    if step.get("topics"):
        st.caption(" • ".join(step["topics"]))


def render_completeness(completeness: Dict) -> None:
    """مکملیت اسکور — کون سی جہت ادھوری ہے"""
    try:
        import streamlit as st
    except ImportError:
        return

    pct = completeness["percent"]
    st.markdown(f"**کیس کی مکملیت: {pct}%**")
    for dim, v in completeness["dimensions"].items():
        icon = {"full": "✅", "partial": "⚠️", "empty": "❌"}[v["state"]]
        st.markdown(f"{icon} {dim}")
    for s in completeness["suggestions"]:
        st.info(f"💡 {s}")


def render_remedies(remedies: List[dict], top_n: int = 5) -> None:
    """رینک شدہ ادویات کے کارڈ"""
    try:
        import streamlit as st
    except ImportError:
        return

    for i, r in enumerate(remedies[:top_n], 1):
        st.markdown(
            f"""
            <div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px 16px;margin-bottom:10px;">
                <b>{i}. {r['remedy']}</b> — اسکور: <b>{r['score']}</b><br>
                <small>میچ شدہ ربرکس: {r['rubric_count']} • اوسط درجہ: {r['avg_grade']}</small>
            </div>
            """,
            unsafe_allow_html=True,
        )


def render_differential(matrix: Dict) -> None:
    """تفریق میٹرکس ٹیبل"""
    try:
        import pandas as pd
        import streamlit as st
    except ImportError:
        return

    if not matrix["rows"]:
        st.info("کافی امتیازی ربرکس نہیں ملے")
        return
    data = {r["rubric"]: r["cells"] for r in matrix["rows"]}
    df = pd.DataFrame(data).T
    st.dataframe(df)


def render_miasm(profile: Dict) -> None:
    """میازم پروفائل بار چارٹ"""
    try:
        import streamlit as st
    except ImportError:
        return

    if not profile:
        return
    for m, v in profile.items():
        st.markdown(f"**{m}** — {v['percent']}%")
        st.progress(min(v["percent"] / 100, 1.0))
