"""
llm.py — ملٹی ماڈل ایل ایل ایم رنر (خودکار فال بیک کے ساتھ)
------------------------------------------------------------
app.py میں موجود ask_llm منطق کی صاف ستھری، قابلِ دوبارہ استعمال شکل۔

ترتیب (سب سے تیز پہلے): groq → gemini → glm → openrouter
کوئی انجن ناکام ہو تو خود بخود اگلا انجن آزمایا جاتا ہے۔
"""

from __future__ import annotations

import datetime
import os
import re
from typing import Optional, Tuple

# ------------------------------------------------------------------ #
# Keys — .env یا ماحولیاتی متغیرات یا اسٹریم لٹ سیکرٹس سے
# ------------------------------------------------------------------ #
def _key(name: str) -> str:
    v = os.getenv(name)
    if v and v.strip():
        return v.strip()
    # اسٹریم لٹ کلاؤڈ — سیکرٹس ماحولیاتی متغیرات نہیں ہوتے
    try:
        import streamlit as st
        if name in st.secrets:
            v = st.secrets[name]
            if v and str(v).strip():
                return str(v).strip()
    except Exception:
        pass
    return ""


GEMINI_API_KEY = _key("GEMINI_API_KEY")
GROQ_API_KEY = _key("GROQ_API_KEY")
ZAI_API_KEY = _key("ZAI_API_KEY")
OPENROUTER_API_KEY = _key("OPENROUTER_API_KEY")

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "models/gemini-flash-latest")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
ZAI_MODEL = os.getenv("ZAI_MODEL", "glm-4.5-flash")
ZAI_BASE = os.getenv("ZAI_BASE", "https://api.z.ai/api/paas/v4")
OR_MODEL = os.getenv("OR_MODEL", "openrouter/free")

# ------------------------------------------------------------------ #
# پرووائیڈر رجسٹری (فال بیک کی ترتیب = فہرست کی ترتیب)
# ------------------------------------------------------------------ #
PROVIDERS = []
if GROQ_API_KEY:
    PROVIDERS.append({"id": "groq", "label": "گروک (Groq)", "model": GROQ_MODEL})
if GEMINI_API_KEY:
    PROVIDERS.append({"id": "gemini", "label": "جیمنائی (Gemini)", "model": GEMINI_MODEL})
if ZAI_API_KEY:
    PROVIDERS.append({"id": "glm", "label": "جی ایل ایم (GLM)", "model": ZAI_MODEL})
if OPENROUTER_API_KEY:
    PROVIDERS.append({"id": "openrouter", "label": "اوپن راؤٹر", "model": OR_MODEL})

AUTO_CHAIN = [p["id"] for p in PROVIDERS]
PROVIDERS_BY_ID = {p["id"]: p for p in PROVIDERS}

_OPENAI_CLIENTS = {}
_gemini_model = None

_usage: dict = {"date": None}


def _short_err(e: Exception) -> str:
    """انجن کی غلطی کو مختصر مگر قابلِ فہم بنانا"""
    name = type(e).__name__
    sc = getattr(e, "status_code", None)
    msg = getattr(e, "message", None) or str(e)
    msg = " ".join(str(msg).split())[:110]
    return f"{name}" + (f"[{sc}]" if sc else "") + (f": {msg}" if msg else "")


def _bump_usage(pid: str) -> None:
    """روزانہ استعمال کا شمار (اسی عمل/سیشن کے دائرے میں)"""
    today = datetime.date.today().isoformat()
    if _usage.get("date") != today:
        _usage.clear()
        _usage["date"] = today
    _usage[pid] = _usage.get(pid, 0) + 1


def usage_today() -> dict:
    return {k: v for k, v in _usage.items() if k != "date"}


# ------------------------------------------------------------------ #
# انفرادی انجن کالز
# ------------------------------------------------------------------ #
def _call_openai_compat(pid: str, model: str, prompt: str, temperature: float = 0.4) -> str:
    """Groq / GLM(Z.ai) / OpenRouter — سب OpenAI-compatible"""
    if pid not in _OPENAI_CLIENTS:
        try:
            from openai import OpenAI
        except Exception:
            raise RuntimeError("openai package missing (pip install openai)")
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
    max_tokens = 4096
    if pid == "glm":
        # GLM-4.5 reasoning model: thinking tokens max_tokens کھا جاتے ہیں → content خالی
        kw2["extra_body"] = {"thinking": {"type": "disabled"}}
        max_tokens = 8192

    resp = cli.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens,
        **kw2,
    )
    msg = resp.choices[0].message if resp.choices else None
    text = (getattr(msg, "content", None) or "") if msg is not None else ""
    if not str(text).strip():
        rc = (getattr(msg, "reasoning_content", None) or "") if msg is not None else ""
        a2, b2 = rc.find("{"), rc.rfind("}")
        text = rc[a2 : b2 + 1] if (a2 != -1 and b2 > a2) else ""
    return text


def _call_gemini(prompt: str, temperature: float = 0.4) -> str:
    global _gemini_model
    if _gemini_model is None:
        import google.generativeai as genai

        genai.configure(api_key=GEMINI_API_KEY)
        _gemini_model = genai.GenerativeModel(GEMINI_MODEL)
    return _gemini_model.generate_content(
        prompt, generation_config={"temperature": temperature}
    ).text


# ------------------------------------------------------------------ #
# مرکزی کال — ترتیب سے کوشش، ناکامی پر اگلا انجن
# ------------------------------------------------------------------ #
def ask_llm(prompt: str, require_json: bool = True, engine_choice: str = "auto",
            temperature: float = 0.4) -> Tuple[str, str]:
    """
    انجنوں کو ترتیب سے آزماتا ہے؛ کسی بھی ناکامی پر خودکار فال بیک۔

    واپسی: (text, provider_label)
    """
    if not PROVIDERS:
        raise RuntimeError("کوئی اے آئی انجن دستیاب نہیں — API keys موجود نہیں")

    if engine_choice in PROVIDERS_BY_ID:
        chain = [engine_choice] + [c for c in AUTO_CHAIN if c != engine_choice]
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
                text = _call_gemini(prompt, temperature=temperature)
            else:
                text = _call_openai_compat(pid, p["model"], prompt, temperature=temperature)
            if not text or not str(text).strip():
                raise RuntimeError("empty response")
            if require_json and "{" not in str(text) and "[" not in str(text):
                raise RuntimeError("non-JSON reply -> agli engine")
            _bump_usage(pid)
            return text, p["label"]
        except Exception as e:
            errs.append(f"{p['label']}: {_short_err(e)}")
            prev_label = p["label"]
            continue

    raise RuntimeError("تمام اے آئی انجن ناکام رہے — " + "; ".join(errs))


def extract_json(text: str):
    """ایل ایل ایم جواب سے خالص JSON نکالنا (مارک ڈاؤن کوڈ بلاکس صاف کر کے)"""
    import json

    text = str(text).strip()
    m = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.I)
    if m:
        text = m.group(1).strip()
    a, b = text.find("{"), text.rfind("}")
    if a != -1 and b != -1 and b > a:
        text = text[a : b + 1]
    try:
        return json.loads(text)
    except Exception as e:
        snippet = " ".join(str(text).split())[:120]
        raise RuntimeError(f"JSON پارس نہیں ہو سکا: {snippet}") from e
