# -*- coding: utf-8 -*-
"""
urdu_script.py — اردو رسم الخط کا آف لائن راستہ (نسخہ 5.0)
=============================================================
⚠️ بنیادی اصول (صارف کی ہدایت):
   مریض ریپرٹری نہیں جانتا — وہ اپنی زبان میں بولتا/لکھتا ہے۔
   اردو رسم الخط میں لکھی علامت کو انجن کی انگریزی کلیدوں میں بدلنا ہے:
     1) براہِ راست جدول (URDU_WORDS / URDU_PHRASES) — منتخب کلینیکل لغت
     2) ریورس انڈیکس (glossary_en_ur.json کے اردو معنی سے الٹی تلاش)
   جو لفظ کہیں معروف نہ ہو — وہ چھوٹ جاتا ہے (آن لائن LLM راستہ پہلے سے ہے)۔

   ترتیب: پہلے فقرہ (دو الفاظ)، پھر لفظ۔ اعراب/ہائے اختلاف پہلے یکساں ہوتے ہیں۔
   انگریزی/رومن الفاظ (ملے جلے جملے میں) اپنی جگہ رہتے ہیں۔

اِستعمال (اندرونی):
    from homeo_core.engine import urdu_script as us
    us.has_urdu("پیٹ میں جلن")            # True
    us.rewrite_urdu("پیٹ میں جلن")        # "abdomen burning"
    us.explain_urdu("صبح سر درد")         # {'صبح': 'morning', ...} — جانچ کے لیے
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Dict, List

# ------------------------------------------------------------------ #
# 1) یکسانی — اعراب، ہائے اختلاف، عربی/اردو حروف کا فرق
# ------------------------------------------------------------------ #

# زبر، زیر، پیش، تنوین، جمع، تشدید، جزم، مدّ، خالی جگہ اور ZWJ/ZWNJ
_STRIP_CHARS = "\u064b\u064c\u064d\u064e\u064f\u0650\u0651\u0652\u0670\u0640\u200c\u200d\u200e\u200f"

_UNIFY = {
    "\u0629": "\u06c1",   # ة → ہ
    "\u064a": "\u06cc",   # عربی ي → اردو ی
    "\u0649": "\u06cc",   # ى → ی
    "\u0643": "\u06a9",   # عربی ك → اردو ک
    "\u0623": "\u0627",   # أ → ا
    "\u0625": "\u0627",   # إ → ا
}
# نسخہ 5.1: ھ (دو چشمی ہے) لفظ کے آخر میں ہی ہ→ہ بنتی ہے —
# درمیان میں ھ = بھ/پھ/تھ/ٹھ/جھ/چھ/دھ/ڈھ/ڑھ/کھ/گھ کا حصہ ہے
# («آنکھ» کو «آنکہ» بنانا غلطی تھی — آنکھوں جیسے الفاظ ٹوٹ جاتے تھے)

_UR_RX = re.compile(r"[\u0600-\u06FF\u0750-\u077F]")
_WORD_RX = re.compile(r"[\u0600-\u06FF\u0750-\u077F]+")

_URDU_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")


def normalize(text: str) -> str:
    """اردو متن کی یکسانی — اعراب ہٹانا، ہے/ی/ک کے اختلاف مٹانا
    (نسخہ 5.1: لفظ کے آخر والی ھ → ہ — درمیان والی ھ برقرار)"""
    t = str(text)
    for ch in _STRIP_CHARS:
        t = t.replace(ch, "")
    for k, v in _UNIFY.items():
        t = t.replace(k, v)
    t = t.translate(_URDU_DIGITS)
    # ھ → ہ صرف لفظ کے آخر میں («آنکھوں» محفوظ رہے، «اوچھا» نہیں تو ٹھیک)
    words = []
    for w in t.split(" "):
        if w.endswith("\u06be"):
            w = w[:-1] + "\u06c1"
        words.append(w)
    t = " ".join(words)
    return " ".join(t.split())


def has_urdu(text: str) -> bool:
    """متن میں اردو رسم الخط کا کوئی حرف ہے؟"""
    return bool(_UR_RX.search(str(text)))


# ------------------------------------------------------------------ #
# 2) براہِ راست جدول — منتخب کلینیکل لغت (اردو → انگریزی کلید)
#    رکھیا: صرف وہی مفہوم جو ریپرٹری ربرک کی زبان میں ہے
# ------------------------------------------------------------------ #

URDU_WORDS: Dict[str, str] = {
    # ---- جگہیں (سر تا پاؤں) ----
    "سر": "head", "ماتھا": "forehead", "پیشانی": "forehead", "کنپٹی": "temple",
    "کنپٹیاں": "temples", "آنکھ": "eyes", "آنکھیں": "eyes", "آنکھوں": "eyes", "پپوٹا": "eyelids",
    "پپوٹے": "eyelids", "کان": "ears", "ناک": "nose", "نتھنے": "nostrils",
    "منہ": "mouth", "ہونٹ": "lips", "دانت": "teeth", "دانت": "teeth",
    "مسوڑھے": "gums", "زبان": "tongue", "گلا": "throat", "ٹانسل": "tonsils",
    "گردن": "neck", "گدی": "nape", "کندھا": "shoulders", "کندھے": "shoulders",
    "بازو": "arm", "کہنی": "elbow", "کلائی": "wrist", "ہاتھ": "hands",
    "ہتھیلی": "palm", "انگلی": "fingers", "انگلیاں": "fingers", "انگوٹھا": "thumb",
    "ناخن": "nails", "سینہ": "chest", "پسلیں": "ribs", "پیٹ": "abdomen",
    "ناف": "umbilicus", "معدہ": "stomach", "جگر": "liver", "دل": "heart",
    "پھیپھڑے": "lungs", "پھوپھڑے": "lungs", "گردے": "kidneys", "گردہ": "kidneys",
    "مثانہ": "bladder", "خاجہ": "inguinal", "کمر": "back", "پیٹھ": "back",
    "کولے": "iliac", "ساڑھے": "nates", "مقعد": "anus", "خصیے": "testes",
    "دبان": "scrotum", "جلد": "skin", "بال": "hair", "ران": "thigh",
    "گھٹنا": "knee", "گھٹنے": "knee", "پنڈلی": "tibia", "ٹخنہ": "ankle",
    "پاؤں": "feet", "ایڑی": "heel", "تلوا": "sole", "ٹانگ": "leg",
    "ہڈی": "bone", "دل کا": "heart",
    # ---- احساسات ----
    "درد": "pain", "دکھ": "pain", "دکھن": "pain", "دردهون": "pain",
    "جلن": "burning", "جلتا": "burning", "جلتی": "burning",
    "جل": "burning", "جلی": "burning", "جلے": "burning",
    "چبھن": "stitching", "چبھتا": "stitching", "چبھتی": "stitching",
    "چبھے": "stitching",
    "سوئی": "stitching", "کھنچاؤ": "drawing", "کھنچتا": "drawing",
    "مروڑ": "cramping", "مروڑا": "cramping", "مرڑ": "cramping",
    "دباؤ": "pressing", "داب": "pressing", "دبے": "pressing",
    "سوجن": "swelling", "سوجا": "swollen", "سوجی": "swollen",
    "خارش": "itching", "کھجلی": "itching", "کھجتا": "itching",
    "دھڑکن": "palpitation", "دھڑکتا": "beating", "چکر": "vertigo",
    "بےہوشی": "unconsciousness", "کمزوری": "weakness", "تھکاوٹ": "weariness",
    "سستی": "lassitude", "بےدلی": "lassitude",
    "جکڑن": "stiffness", "اکڑن": "stiffness",
    "کھودتا": "boring", "چباتا": "gnawing", "چیرتا": "tearing",
    "پھاڑتا": "tearing", "گدگدی": "tickling", "جھنجھناہٹ": "tingling",
    "رینگنا": "crawling", "رینگتی": "crawling", "سن": "numbness",
    "سننا": "numbness", "بےحس": "numbness",
    "دھبے": "spots", "دھبہ": "spots", "پھنسیاں": "eruptions", "پھنسی": "eruption",
    "چھالے": "vesicles", "زخم": "ulcers", "پیپ": "pus",
    "دھڑک": "beating", "پکڑ": "gripping",
    # ---- شکایات ----
    "کھانسی": "cough", "بلغم": "expectoration", "سانس": "breathing",
    "بخار": "fever", "تپ": "fever", "سردی": "cold", "گرمی": "heat",
    "پسینہ": "sweat", "متلی": "nausea", "قے": "vomiting", "الیجی": "vomiting",
    "دست": "diarrhoea", "لوچ": "diarrhoea", "قبض": "constipation",
    "اپھارہ": "distension", "گیس": "flatus", "پاخانہ": "stool",
    "پیشاب": "urine", "بول": "urine", "نکسیر": "epistaxis",
    "بھوک": "appetite", "پیاس": "thirst", "نیند": "sleep", "خواب": "dreams",
    "بےخوابی": "sleeplessness", "چکر آنا": "vertigo",
    "دو بدو": None,
    # ---- ذہنی ----
    "خوف": "fear", "ڈر": "fear", "گھبراہٹ": "anxiety", "پریشانی": "anxiety",
    "بےچینی": "restlessness", "غصہ": "anger", "غصے": "anger",
    "ناراض": "irritable", "چڑچڑا": "irritable", "رونا": "weeping",
    "آنسو": "tears", "اداسی": "sadness", "غم": "grief", "مایوسی": "despair",
    "اکیلا": "alone", "اکیلے": "alone", "حافظہ": "memory", "بھولنا": "forgetful",
    "خیالات": "thoughts", "وہم": "delusions", "فکر": "worries",
    "جھنجھلاہٹ": "irritable",
    # ---- خواہش/نفرت و خوراک ----
    "خواہش": "desire", "نفرت": "aversion", "ناپسند": "aversion",
    "میٹھا": "sweets", "نمک": "salt", "نمکین": "salt", "کھٹا": "sour",
    "کڑوا": "bitter", "دودھ": "milk", "چائے": "tea", "کافی": "coffee",
    "پانی": "water", "روٹی": "bread", "گوشت": "meat", "انڈے": "eggs",
    "چاول": "rice", "مکھن": "butter", "شراب": "wine", "تمباکو": "tobacco",
    "سگریٹ": "smoking", "پان": None,
    # ---- وقت ----
    "صبح": "morning", "شام": "evening", "رات": "night", "دوپہر": "afternoon",
    "دن": "day", "پیشین": "forenoon", "آدھی رات": "midnight",
    # ---- سمت/جگہ ----
    "دائیں": "right", "بائیں": "left", "اوپر": "upper", "نیچے": "lower",
    "اندر": "inner", "باہر": "external", "پیچھے": "posterior", "آگے": "anterior",
    # ---- موڈیلٹی (پولرٹی کے کلیدی الفاظ) ----
    "بگڑتا": "agg", "بگڑتی": "agg", "بگڑتے": "agg", "بگڑنا": "agg",
    "بگاڑ": "agg", "خراب": "agg", "بڑھتا": "agg", "بڑھتی": "agg",
    "بہتر": "amel", "بہتری": "amel", "ٹھیک": "amel", "آرام": "amel",
    "کم ہوتا": "amel",
    # ---- حرکت/حالت ----
    "چلتے": "walking", "چلنے": "walking", "ہلتے": "motion", "ہلنے": "motion",
    "لیٹنے": "lying", "لیٹ": "lying", "بیٹھنے": "sitting", "بیٹھ": "sitting",
    "کھانے": "eating", "کھا": "eating", "پینے": "drinking", "پی": "drinking",
    "چھوتے": "touch", "چھونے": "touch", "دبانے": "pressure",
    "ہوا": "air", "دھوپ": "sun", "سیڑھیاں": "stairs", "جھک": "stooping",
    "جھکتا": "stooping", "جھکتی": "stooping", "جھکنا": "stooping",
    "اٹھتے": "rising", "اٹھنا": "rising", "کھڑے": "standing",
    # ---- درجہ ----
    "شدید": "violent", "تکھا": "violent", "ہلکا": "mild", "بار بار": "frequent",
}
URDU_WORDS = {normalize(k): v for k, v in URDU_WORDS.items() if v}   # کلیدیں بھی یکساں (ھ→ہ وغیرہ)

URDU_PHRASES: Dict[str, str] = {
    "نیند نہیں": "sleeplessness", "نیند نہ آئے": "sleeplessness",
    # نسخہ 5.1: عام ملا جلا صورت — فاصلے کے ساتھ بھی لکھی جاتی ہیں
    "بے خوابی": "sleeplessness", "بے ہوشی": "unconsciousness",
    "آدھے سر": "hemicrania", "آدھے دن": "hemicrania",
    "نیند نہیں": "sleeplessness", "کھلی ہوا": "open air", "بچہ دانی": "uterus", "ماہواری کی": "menses",
    "اکیلے رہنا": "wants to be alone", "دل دھڑکنا": "palpitation",
    "جی متلنا": "nausea", "سانس پھول": "breathless",
    "سردی سے": "cold", "گرمی سے": "heat", "بار بار": "frequent",
    # نسخہ 5.1: سردی لگنا — ریپرٹری کا اپنا سرِعنوان CHILLINESS
    "سردی لگتی": "chilliness", "سردی لگتی ہے": "chilliness", "سردی لگ رہی": "chilliness",
    "دن میں": "daytime", "رات کو": "night", "دوپہر کو": "afternoon",
    "کھانے کے": "eating", "نہ سوئے": "sleeplessness",
    "سر درد": "headache", "درد سر": "headache", "سردرد": "headache",
    "درد پیٹ": "abdomen", "پیشاب میں": "urine",
}
URDU_PHRASES = {normalize(k): v for k, v in URDU_PHRASES.items() if v}

# ریورس انڈیکس میں بےکار اردو الفاظ (معنی فقرات سے آتے ہیں)
_GENERIC_UR = {
    "کا", "کی", "کے", "سے", "میں", "کو", "پر", "ہے", "ہیں", "ہو", "ہونا",
    "ہوتا", "ہوتی", "ہوں", "تھا", "تھی", "تھے", "جیسا", "جیسے", "والا",
    "والے", "والی", "نما", "سا", "احساس", "بہت", "زیادہ", "کم", "ایک",
    "وغیرہ", "بھی", "اور", "یا", "کہ", "جب", "تک", "ساتھ", "بغیر",
    "گی", "گا", "گے", "کر", "کرنے", "لگتا", "لگتی", "ہوا", "ہوئی", "ہوئے",
    "دوران", "بعد", "پہلے", "مگر", "لیکن", "صرف", "ضرور", "درد", "بدن",
    "نہیں", "نہ", "آنا", "جانا", "اپنے", "اپنی", "ان", "اس", "یہ", "وہ",
    # نسخہ 5.1: معاون فعل («اکیلے رہنا چاہتا ہے» میں «چاہتا» شور بنے گا)
    "چاہتا", "چاہتی", "چاہتے", "چاہنا", "چاہے", "چاہیے", "چاہئے",
}

# ------------------------------------------------------------------ #
# 3) ریورس انڈیکس — glossary_en_ur.json کے اردو معنی سے الٹی تلاش
# ------------------------------------------------------------------ #

_REV: Dict[str, List[str]] = {}
_REV_LOADED = False

_GLOSSARY_PATH = Path(__file__).resolve().parents[2] / "glossary_en_ur.json"


def _reverse() -> Dict[str, List[str]]:
    """لغت لوڈ — ایک بار؛ {اردو لفظ: [انگریزی کلید، ...]} (فراوانی کی ترتیب میں)"""
    global _REV, _REV_LOADED
    if _REV_LOADED:
        return _REV
    _REV_LOADED = True
    try:
        g = json.loads(_GLOSSARY_PATH.read_text(encoding="utf-8"))
        words = g.get("words", {})
        # words فراوانی کی ترتیب میں ہیں (مرحلہ 1 میںfreq کے حساب سے لکھے گئے)
        for en, e in words.items():
            if str(e.get("part")) in ("structural", "pending"):
                continue
            ur = str(e.get("ur", ""))
            if not ur:
                continue
            # نسخہ 5.1: پرانتستھیسی توضیحات نہیں — («sparks = چنگاریاں
            # (آنکھوں کے سامنے)» سے «آنکھوں» sparks پر نہیں پوائنٹ کرے)
            ur = re.sub(r"\([^)]*\)", " ", ur)
            for uw in _WORD_RX.findall(normalize(ur)):
                if len(uw) < 2 or uw in _GENERIC_UR:
                    continue
                lst = _REV.setdefault(uw, [])
                if en not in lst:
                    lst.append(en)
    except Exception:
        _REV = {}
    return _REV


_SUFFIXES = ("نے", "نا", "تے", "تی", "تا", "کر", "یں", "وں", "ے", "ا", "ی")


def _lookup(word: str) -> str:
    """ایک اردو لفظ کی انگریزی کلید — جدول پہلے، ریورس بعد میں،
    پھر صرفی سابقہ اتر کر (جھکنے → جھک) دوبارہ کوشش
    (نسخہ 5.1: داخل بھی پہلے یکساں — ھ→ہ وغیرہ)"""
    word = normalize(word)
    en = URDU_WORDS.get(word)
    if en:
        return en
    rev = _reverse().get(word)
    if rev:
        return rev[0]
    for suf in _SUFFIXES:
        if word.endswith(suf) and len(word) > len(suf) + 1:
            base = word[:-len(suf)]
            en = URDU_WORDS.get(base)
            if en:
                return en
            rev = _reverse().get(base)
            if rev:
                return rev[0]
            break                      # صرف پہلا موزوں سابقہ
    return ""


def explain_urdu(text: str) -> Dict[str, str]:
    """جانچ کے لیے — ہر اردو لفظ کا کیا ترجمہ ہوا (یا خالی)"""
    t = normalize(text)
    out: Dict[str, str] = {}
    for w in _WORD_RX.findall(t):
        out[w] = URDU_WORDS.get(w) or (_reverse().get(w, [""])[0] if _reverse().get(w) else "")
    return out


# ------------------------------------------------------------------ #
# 4) دوبارہ لکھائی — پورا جملہ انگریزی کلیدوں میں
# ------------------------------------------------------------------ #

def rewrite_urdu(text: str) -> str:
    """اردو رسم الخط کا جملہ → انگریزی کلیدوں کا جملہ
    - ملا جلا متن (رومن+اردو) بھی چلتا ہے — غیر اردو الفاظ اپنی جگہ
    - فقرہ پہلے (دو الفاظ)، پھر لفظ
    - نامعروف اردو لفظ حذف (ٹوکنائزیشن میں ویسے بھی ضائع ہوتا)
    """
    if not has_urdu(text):
        return str(text)
    t = normalize(text)
    words = t.split()
    out: List[str] = []
    i = 0
    n = len(words)
    while i < n:
        if i + 1 < n:
            pair = words[i] + " " + words[i + 1]
            en = URDU_PHRASES.get(pair)
            if en:
                out.append(en)
                i += 2
                continue
        w = words[i]
        if _UR_RX.search(w):
            en = _lookup(w)
            if en:
                out.append(en)
            # نامعروف اردو لفظ → چھوٹ گیا
        else:
            out.append(w)          # انگریزی/رومن لفظ اپنی جگہ
        i += 1
    return " ".join(out)
