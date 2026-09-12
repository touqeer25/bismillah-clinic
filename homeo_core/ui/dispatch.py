"""
dispatch.py — دونوں انٹری پوائنٹس (app.py / advanced_assistant.py) کا مشترکہ ڈسپیچر
--------------------------------------------------------------------------------
ایک ہی اسٹریم لٹ ایپ دونوں صفحات چلاتی ہے — فرق صرف ?view= کوئری پیرامیٹر سے:

    ?embed=true&lang=ur            → پرانا AI ہومیو اسسٹنٹ (AI Diagnosis — ai_diagnosis.py)
    ?embed=true&lang=ur&view=ai2   → ایڈوانس اسسٹنٹ 2.0 (نیا اڈاپٹو اسسٹنٹ — homeo_core)

اس طرح index.html کے دونوں ٹیبز ایک ہی ایپ پر مگر الگ الگ صفحات دکھاتے ہیں،
اور ڈیٹا آپس میں مکس نہیں ہوتا۔
"""
from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _view() -> str:
    try:
        v = st.query_params.get("view", "")
    except Exception:
        v = ""
    if isinstance(v, list):
        v = v[0] if v else ""
    return str(v or "").strip().lower()


def run() -> None:
    if _view() == "ai2":
        # ---- ایڈوانس اسسٹنٹ 2.0 (نیا اڈاپٹو اسسٹنٹ) ----
        from homeo_core.ui.streamlit_page import render_app

        render_app()
    else:
        # ---- پرانا AI ہومیو اسسٹنٹ (AI Diagnosis) ----
        old = ROOT / "ai_diagnosis.py"
        g = dict(globals())
        g["__file__"] = str(old)
        exec(compile(old.read_text(encoding="utf-8"), str(old), "exec"), g)
