"""
followup.py — فالو اپ ماڈیول (دوسری تجویز کا فیصلہ)
--------------------------------------------------
علاج کے بعد کی حالت کی بنیاد پر فیصلہ:
    دوا دہرائیں / بدلیں / انتظار کریں

ساتھ ہی ہیرنگ کے قانون (قوانینِ شفا) کے مطابق سمت کی جانچ۔
"""

from __future__ import annotations

from typing import Dict, List

RESPONSE_TYPES = {
    "improved": "بہتری (عمومی)",
    "aggravated_then_improved": "پہلے بڑھنا، پھر بہتری",
    "no_change": "کوئی تبدیلی نہیں",
    "worse": "خرابی / نئی علامات",
}


def decide(response: str, hering_compliant: bool = True, severity: str = "mild") -> Dict:
    """
    response: "improved" | "aggravated_then_improved" | "no_change" | "worse"
    hering_compliant: کیا بہتری ہیرنگ کے اصول پر ہے؟
    severity: اگریویشن کی شدت ("mild" | "strong")
    """
    decision = {
        "action": "",
        "reason": "",
        "wait": True,  # کیا انتظار کریں؟
        "next_steps": [],
    }

    if response == "improved":
        if hering_compliant:
            decision["action"] = "دوا برقرار رکھیں"
            decision["reason"] = "بہتری ہیرنگ کے اصول کے مطابق صحیح سمت میں ہے — علاج درست ہے"
            decision["wait"] = True
            decision["next_steps"] = ["خوراک/وقفہ طے کریں", "اگلا فالو اپ وقت مقرر کریں"]
        else:
            decision["action"] = "دوا برقرار، مگر مشاہدہ جاری"
            decision["reason"] = "بہتری ہے مگر سمت ہیرنگ کے اصول پر نہیں — نگرانی رکھیں"
            decision["wait"] = True
            decision["next_steps"] = ["علامات کی ترتیب نوٹ کریں", "قریبی فالو اپ رکھیں"]

    elif response == "aggravated_then_improved":
        if severity == "strong":
            decision["action"] = "خوراک کم کریں یا پوٹینسی گھٹائیں"
            decision["reason"] = "شدید ہومیوپیتھک اگریویشن — طاقت/خوراک زیادہ ہے"
            decision["wait"] = True
            decision["next_steps"] = ["کم طاقت پر دوبارہ غور کریں"]
        else:
            decision["action"] = "انتظار کریں"
            decision["reason"] = "معمولی ابتدائی اگریویشن کے بعد بہتری — قدرتی عمل، مداخلت نہ کریں"
            decision["wait"] = True
            decision["next_steps"] = ["اگلے 24-48 گھنٹے مشاہدہ کریں"]

    elif response == "no_change":
        decision["action"] = "کیس کا دوبارہ جائزہ لیں"
        decision["reason"] = "کوئی ردِعمل نہیں — ربرکس، پوٹینسی یا خوراک میں کمی ہو سکتی ہے"
        decision["wait"] = False
        decision["next_steps"] = [
            "منتخب علامات دوبارہ دیکھیں",
            "ریپرٹورائزیشن دہرائیں",
            "پوٹینسی/خوراک پر نظر ثانی کریں",
        ]

    elif response == "worse":
        decision["action"] = "نئے کیس کے طور پر لیں"
        decision["reason"] = "نئی/بڑھتی علامات — غالباً نیا مرحلہ یا غلط انتخاب"
        decision["wait"] = False
        decision["next_steps"] = [
            "تازہ کیس ٹیکنگ کریں",
            "نئی ریپرٹورائزیشن کریں",
            "سپریشن/رکاوٹ کا جائزہ لیں",
        ]

    return decision


def hering_check(progress_notes: Dict) -> Dict:
    """
    ہیرنگ کے قانون کے چار اصولوں کی جانچ۔
    progress_notes keys: direction, center_to_periphery, organ_priority, reverse_order
    """
    notes = {
        "direction": "اوپر سے نیچے (سردرد پہلے، پھر پاؤں)",
        "center_to_periphery": "اندر سے باہر (اعضاء پہلے، پھر جلد)",
        "organ_priority": "اہم عضو پہلے، غیر اہم بعد میں",
        "reverse_order": "پرانی علامات الٹی ترتیب میں واپس",
    }
    checks = {}
    for key, desc in notes.items():
        val = progress_notes.get(key)
        checks[key] = {
            "desc": desc,
            "observed": bool(val),
            "detail": val if val else None,
        }
    checks["compliant"] = all(c["observed"] for c in checks.values())
    return checks
