"""
advanced_assistant.py — ایڈوانس اسسٹنٹ 2.0 کا انٹری پوائنٹ (مکمل الگ ایپ)
-------------------------------------------------------------------------
چلانے کا طریقہ:
    streamlit run advanced_assistant.py

یہ صرف homeo_core کا ایڈوانس اسسٹنٹ 2.0 چلاتا ہے:
  - اکیوٹ: 4 مراحل | کرانک: 8 مراحل + میازم + فالو اپ
  - ملٹی ریپرٹری (کینٹ + سنتھیسس 9.1 + عمومی + جرمن کینٹ)
  - میٹیریا میڈیکا تصدیق (Qdrant)، پوٹینسی انجن، مکملیت اسکور

نوٹ: app.py پرانا AI ہومیو اسسٹنٹ ہے — دونوں مکمل الگ ایپس ہیں،
کوئی ڈسپیچر/?view= پیرامیٹر درکار نہیں۔
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from homeo_core.ui.streamlit_page import render_app

render_app()
