"""
potency.py — پوٹینسی اور خوراک انجن
------------------------------------
کیس کی قسم + مریض کی حساسیت کے مطابق طاقت اور وقفہ تجویز کرتا ہے۔
(حتمی فیصلہ ہمیشہ معالج کا رہے گا)
"""

from __future__ import annotations

from typing import Dict


def recommend_potency(
    case_type: str,
    sensitivity: str = "medium",
    miasm: str = None,
) -> Dict[str, str]:
    """
    case_type: "acute" | "chronic"
    sensitivity: "low" | "medium" | "high" (حساسیت / ردِعمل کی شدت)
    miasm: اختیاری — میازم کے مطابق رہنمائی
    """

    # حساسیت کی وضاحت (کم = عام، زیادہ = بچے/بزرگ/کمزور)
    if case_type == "acute":
        base = {
            "potency": "30C",
            "range": "6C تا 30C",
            "repetition": "ہر 2 تا 4 گھنٹے",
            "duration": "بہتری تک، پھر وقفہ بڑھائیں",
            "note": "حاد حالت میں بار بار خوراک — قریب سے نگرانی کریں",
        }
        if sensitivity == "high":
            base["potency"] = "6C یا 12C"
            base["repetition"] = "ہر 3 تا 4 گھنٹے، ضرورت پر"
            base["note"] = "حساس مریض — کم طاقت سے شروع کریں"
    else:
        base = {
            "potency": "200C",
            "range": "200C تا 1M",
            "repetition": "واحد خوراک",
            "duration": "ایک خوراک، پھر ردِعمل کا مشاہدہ",
            "note": "مزمن حالت میں واحد خوراک — جلد بازی نہ کریں",
        }
        if sensitivity == "high":
            base["potency"] = "LM (ایل ایم) پوٹینسی"
            base["range"] = "LM1 سے LM6 تک تدریجی"
            base["repetition"] = "روزانہ ایک خوراک (پانی میں)"
            base["note"] = "حساس/بزرگ/بچے — ایل ایم نرم اور محفوظ رہتی ہے"

    if miasm:
        base["miasm_note"] = {
            "psora": "پسورا: ابتدائی طاقت کے بعد ردِعمل دیکھ کر آہستہ بڑھائیں",
            "sycosis": "سائیکوسس: عام طور پر درمیانی طاقت + طویل وقفہ",
            "syphilis": "سائفلس: گہری کارروائی — معالج کی نگرانی لازمی",
            "tubercular": "ٹیوبرکولر: حساسیت زیادہ — کم طاقت سے آغاز بہتر",
        }.get(miasm, "")

    return base


def adjust_by_age(age: int, base: Dict[str, str]) -> Dict[str, str]:
    """عمر کے مطابق احتیاطی ترمیم"""
    out = dict(base)
    if age <= 2:
        out["potency"] = "6C / 12C"
        out["note"] = "شیر خوار — کم سے کم طاقت، معالج کی نگرانی"
    elif age >= 65:
        out["potency"] = "LM یا کم طاقت"
        out["note"] = "بزرگ مریض — نرم طاقت ترجیح"
    return out
