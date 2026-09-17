"""
rubric_mapper.py — علامت → ربرک میپنگ (گہری، این ایل پی + ایل ایل ایم)
---------------------------------------------------------------------
ہر علامت کو کینٹ/سنتھیسس ریپرٹری کے قریب ترین ربرکس میں بدلتا ہے۔

گہری بہتریاں (نسخہ 2.0):
  1) مترادفات/ہم معنی الفاظ (synonyms) — "worse from" → "agg."
  2) رومن اردو کلیدی الفاظ — "dard" → pain، "pyas" → thirst
  3) دو لفظی فقرے (bigrams) — "cold water" کا درست ملان
  4) ایل ایل ایم کی مدد سے ربرک کا انتخاب — وجہ + اعتماد کے ساتھ (کیش شدہ)
  5) اردو علامات کی صورت میں ایل ایل ایم راستہ (لفظی مماثلت اردو میں نہیں چلتی)

ڈیٹا سورسز (sources.py دیکھیں):
  kent/      : kent_chapters/*.json        — درجہ 1-3
  synthesis/ : synthesis91_raw_chapters/*.json — درجہ 1-4 + path + sources
  general/   : repertory_chapters/*.json   — درجہ 1-3 (بڑے حروف کے نام)
"""

from __future__ import annotations

import json
import math
import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# ڈیٹا ڈائریکٹری — ماحولیاتی متغیر سے بدلی جا سکتی ہے
DATA_DIR = Path(
    os.getenv("HOMEOPATHY_DATA_DIR", Path(__file__).resolve().parents[2] / "kent_chapters")
)

# عمومی (جنرلز) ابواب — ان کا وزن زیادہ ہو گا
GENERAL_CHAPTERS = {
    "generalities", "appetite", "sleep", "perspiration", "sweat",
    "urine", "stool", "chill", "fever", "heat_and_fever_in_general",
    "clinical", "blood", "heart_&_circulation", "conditions_in_general",
    "modalities", "conditions_of_aggravation_and_amelioration_in_general",
    "sensations_and_complaints_in_general", "generals",
}

MIND_CHAPTERS = {"mind", "gemuet"}

# جرمن ابواب (کینٹ ڈی) — جہتی درجہ بندی کے لیے
GERMAN_MIND_CHAPTERS = {"gemuet"}
GERMAN_GENERAL_CHAPTERS = {
    "allgemeines", "fieber", "frost", "schlaf", "schweiss", "schwindel",
}

# بھرتی الفاظ (فیلر) — یہ نہ علامت میں معنی رکھتے ہیں نہ ربرک میں
_FILLER = {
    "can", "could", "would", "shall", "should", "may", "might", "must",
    "best", "better", "worse", "now", "more", "most", "also", "even",
    "feels", "feel", "feeling", "felt", "seems", "seemed", "appears",
    "like", "if", "as", "of", "the", "is", "was", "were", "been", "being",
    "times", "time", "sometimes", "occasionally", "occasional", "frequent",
    "frequently", "frequentness", "repeated", "repeatedly", "general",
    "generally", "especially", "special", "particularly", "particular",
    "mainly", "mostly", "usually", "often", "again", "still", "yet",
    "gets", "getting", "got", "goes", "going", "came", "comes", "coming",
    "takes", "took", "made", "makes", "does", "did", "had", "has", "have",
    "very", "quite", "rather", "somewhat", "slightly", "little", "bit",
    "much", "many", "lot", "lots", "total", "completely", "entirely",
    "cannot_be", "type", "kind", "sort", "way", "thing", "things",
}

_STOPWORDS = {
    "the", "of", "in", "on", "at", "when", "while", "after", "before", "during",
    "and", "or", "from", "to", "for", "as", "is", "are", "be",
    "a", "an", "his", "her", "she", "he", "it", "its", "their", "see", "saw",
    "my", "me", "i", "you", "very", "much", "too", "some", "have", "has",
    "great", "intense", "severe", "lots", "excessive", "bohat",
    # نوٹ: "with"/"without" اب اسٹاپ ورڈ نہیں — ہم راہ علامات
    # ("anxiety with restlessness") اور نفی ("without sweating") کے لیے ضروری ہیں
    # نسخہ 4.7: "zyada" اسٹاپ ورڈ سے نکالا گیا — یہ «زیادہ» ہے، ROMAN_URDU میں
    # «increased» کا لفظی ترجمہ دیا جاتا ہے (بھوک زیادہ → appetite increased)
}

# ------------------------------------------------------------------ #
# رومن اردو: دستوری الفاظ (ہٹانے کے لیے) + دو لفظی فقرے (نسخہ 2.1)
# ------------------------------------------------------------------ #
_UR_GRAMMATICAL = {
    "ka", "ki", "ke", "hai", "hain", "tha", "thi", "the", "ko", "mein",
    "par", "bhi", "thoda", "thora", "thodi", "bahut", "bohot", "kafi",
    "zara", "bas", "wala", "wali", "jo", "na", "ya", "jab", "kiya", "karo",
    # (نسخہ 3.2) مزید دستوری الفاظ
    "aur", "se", "tak", "phir", "ab", "to", "hi", "wo", "woh", "ye", "yeh",
    "is", "us", "in", "un", "kuch", "koi", "sab", "har", "jab", "tab", "kab",
    "mera", "meri", "tera", "uska", "uski", "apna", "apni", "kuch", "bahut",
    # (نسخہ 4.7) «لگتی/لگتا/لگتے ہیں» — دستوری فعل
    "lagti", "lagta", "lagte", "lag", "raha", "rahi", "rahe",
    # (نسخہ 4.8) «آتا/آتی/آتے ہے» — دستوری فعل (neend aati hai)
    "aata", "aati", "aate",
}

_UR_PHRASES = {
    "se barhti": "agg", "se barhta": "agg", "se barhi": "agg",
    "se barhe": "agg", "se barhna": "agg", "se badhti": "agg",
    "se badhta": "agg", "se barha": "agg", "se badh": "agg",
    "se behtar": "amel", "se behtari": "amel", "se rahat": "amel",
    "se aasaan": "amel", "se kami": "amel", "se kam": "amel",
    "ke baad": "after", "ki baad": "after",
    "ke waqt": "during", "ki waqt": "during", "ke doran": "during",
    "raat ko": "night", "subah ko": "morning", "sham ko": "evening",
    "dopehar ko": "afternoon",
    # (نسخہ 4.8) «سر درد» — اردو کا ایک لفظ، ریپرٹری کا ایک لفظ (headache)
    "sar dard": "headache", "sar dukh": "headache", "sir dard": "headache",
}

# ------------------------------------------------------------------ #
# مترادفات — علامت اور ربرک دونوں کو ایک "معیاری" شکل میں ڈھالتے ہیں
# ------------------------------------------------------------------ #
# ------------------------------------------------------------------ #
# ⚠️ «لفظ بلفظ» کی پالیسی (نسخہ 3.2) — صارف کی اصولی ہدایت
#    ریپرٹری کے الفاظ پروور کے احساسات کی وجہ سے منتخب کیے گئے ہیں،
#    اس لیے اُن کے synonyms بنانا غلط ہے۔ یہاں صرف تین چیزیں اجازت یافتہ ہیں:
#      1) ہجے کی مختلف صورتیں (dyspnoea/dyspnea، œ/oe) — ایک ہی لفظ
#      2) ایک ہی لفظ کی شکلیں (tooth/teeth، squeeze/squeezed) — صرفی صورت
#      3) ریپرٹری کے اپنے مخففات (worse → agg. ، better → amel.)
#    باقی کچھ نہیں۔ جو لفظ میسر نہ ہو، وہ «غیر موجود» رپورٹ میں جائے گا
#    (نیچے explain_words دیکھیں) — انجن چپکے سے بدلے گا نہیں۔
# ------------------------------------------------------------------ #
try:
    from .word_policy import (SPELLING_VARIANTS as _SP, SAME_WORD_FORMS as _SWF,
                              REPERTORY_ABBREV as _ABBR)
except Exception:                                   # الگ سے چلانے پر
    _SP, _SWF, _ABBR = {}, {}, {}

SYNONYM_MAP = dict(_ABBR)          # صرف ریپرٹری کے اپنے مخففات
SYNONYM_MAP.update(_SWF)           # اور ایک ہی لفظ کی شکلیں
# نوٹ: پہلے یہاں 73 «اصل مترادف» تھے (sadness→grief، rage→anger، cool→cold،
#      insomnia→sleeplessness، movement→motion وغیرہ) — وہ سب ہٹا دیے گئے ہیں،
#      کیونکہ ریپرٹری اِن سب کو الگ الگ لفظ مانتی ہے (sadness 181 ربرکس، grief 96 ربرکس)۔

# ------------------------------------------------------------------ #
# رومن اردو کلیدی الفاظ → انگریزی (مقامی مماثلت کے لیے)
# ------------------------------------------------------------------ #
# ------------------------------------------------------------------ #
# رومن اردو → انگریزی: **لفظی ترجمہ** (ہر اردو لفظ کا اپنا ایک مطلب)
# ⚠️ یہ «مترادف سازی» نہیں ہے — مریض نے جو اردو لفظ کہا، اُس کا انگریزی
#    متبادل دیا جا رہا ہے۔ یہی وجہ ہے کہ pait → abdomen (stomach نہیں)
#    اور udasi → sadness (grief نہیں) ہے — کیونکہ نہ abdomen اور stomach
#    ایک لفظ ہیں، نہ sadness اور grief۔
# ------------------------------------------------------------------ #
ROMAN_URDU = {
    # درد و علامات
    "dard": "pain", "takleef": "pain", "jalan": "burning", "khujli": "itching",
    "soojan": "swelling", "sujan": "swelling", "jhonka": "spasm", "dhadkan": "palpitation",
    "kanpna": "trembling", "kanpana": "trembling", "phoolna": "swelling",
    "khansi": "cough", "nazla": "coryza", "hichki": "hiccough", "qay": "vomiting",
    "ulti": "vomiting", "matli": "nausea", "bukhar": "fever", "bukhaar": "fever",
    # اعضا
    "sar": "head", "aankh": "eye", "ankh": "eye", "kaan": "ear", "naak": "nose",
    "gala": "throat", "galay": "throat", "daant": "teeth", "zabaan": "tongue",
    "hont": "lips", "seenah": "chest", "seenay": "chest", "dil": "heart",
    "pait": "abdomen", "peeth": "back", "kamar": "lumbar", "hath": "hand",
    "paon": "foot", "pair": "foot", "taang": "leg", "ghutna": "knee",
    "kandha": "shoulder", "joron": "joints", "haddi": "bone", "naaf": "navel",
    "bal": "hair", "nakseer": "nosebleed", "saans": "respiration",
    # حالت و موڈیلٹی
    "harkat": "motion", "aaram": "rest", "paani": "water", "thanda": "cold",
    "thandi": "cold", "thand": "cold", "garam": "hot", "garmi": "heat", "sona": "sleep",
    "neend": "sleep", "bhook": "appetite", "bhok": "appetite", "khana": "food",
    "akela": "alone", "akeli": "alone",                       # اکلا
    "dhoop": "sun", "sooraj": "sun", "suraj": "sun",           # دھوپ / سورج
    # وقت
    "rat": "night", "subah": "morning", "sham": "evening", "dopehar": "afternoon",
    "din": "day", "khwab": "dreams", "jagna": "waking", "uthna": "rising",
    # خارجی اخراجات
    "khoon": "blood", "pasina": "sweat", "peshab": "urine", "qabz": "constipation",
    "dast": "diarrhoea", "pyas": "thirst",
    # نسخہ 4.7: مقدار/پتھری — لفظی ترجمے (مترادف سازی نہیں)
    "ziyada": "increased", "zyada": "increased",       # «زیادہ» = increased
    "kam": "diminished", "kami": "diminished",         # «کم» = diminished
    "pathri": "stone", "pathree": "stone",             # «پتھری» = stone
    "nahin": "no", "nahi": "no", "nhi": "no",          # نفی — ٹوکن "no" (test_negation_tokens)
    "bina": "no",                                       # «بغیر» = without → "no"
    # ذہنی
    "ghabrahat": "restlessness", "khauf": "fear", "dar": "fear", "gham": "grief",
    "udasi": "sadness", "ghussa": "anger", "tayesh": "rage", "khushi": "cheerful",
    "yaad": "memory",
    # جسمانی عمومی
    "kamzori": "weakness", "kamzor": "weakness", "thakan": "tiredness",
    "chakkar": "dizziness", "mota": "obese", "patla": "thin", "zor": "strength",
    "tezi": "fast", "aahista": "slow", "bara": "large",
    # کھانے پینے
    "meetha": "sweets", "khatta": "sour", "kadwa": "bitter", "namkeen": "salty",
    "tel": "oil", "doodh": "milk", "sharbat": "juice", "chai": "tea",
    "gosht": "meat", "sabzi": "vegetable", "roti": "bread", "daal": "lentils",
    "masala": "spices",
    # رنگ
    "pila": "yellow", "surkh": "red", "safaid": "white", "kala": "black", "hara": "green",
}


# ------------------------------------------------------------------ #
# نفی اور تضاد کی پہچان (نسخہ 2.4) — "cannot lie down" ≠ "lie down"
# ------------------------------------------------------------------ #
_NEG_MARKERS = (
    "cannot", "can not", "can't", "cant", "unable", "no ", "not ", "not,",
    "without", "never", "nahi", "nahin", "bina", "absence", "absent",
    "none", "no.", "nothing", "fails to", "unable to",
)

_IDF_MAX = 25.0
_IDF_UNSEEN = 1.0

# شرائط/اعضا کے الفاظ — ربرک میں ہوں مگر بیمار نے نہ بتائے ہوں تو سزا
_SCOPE_TOKENS = {
    "agg", "amel", "during", "while", "left", "right", "side", "morning",
    "evening", "night", "day", "motion", "rest", "lying", "sitting", "standing",
    "walking", "pressure", "touch", "after", "before", "open", "air", "warm",
    "cold_drink", "eating", "drinking", "sleep", "stool", "urine", "menses",
    "cough", "inspiration", "expiration", "swallowing", "talking", "exertion",
}

_CONTRAST_MARKERS = ("alternating", "alternates", "or ", "either", "with ", "and ", "both")

# متضاد جوڑے — ایک طرف کا لفظ دوسری طرف ہو تو معنٰی اُلٹ ہو جاتا ہے
ANTONYM_PAIRS = (
    ("heat", "cold"),
    ("amel", "agg"),
    ("increase", "decrease"),
    ("asleep", "wake"),
    ("amelioration", "aggravation"),
)

# ------------------------------------------------------------------ #
# نسخہ 4.7: «موڈیلٹی-اصول» — صارف کا اصول:
#   «جہاں علامت کے ساتھ موڈیلٹی ہو وہاں موڈیلٹی ملا کر ربرک، اور جہاں
#    موڈیلٹی نہ ہو وہاں صرف مین ربرک» —
#   یعنی مریض نے بگاڑ/بہتری/وقت نہیں بتایا تو شرط-والی ربرک («CONSTIPATION
#   amel.»، «Foot, heat agg.»، «Feet, heat, after») مین ربرک سے آگے نہیں جا سکتیں
# ------------------------------------------------------------------ #
_SYM_POLARITY_RX = re.compile(
    r"\b(agg|amel|worse|worst|better|best|aggravat\w*|ameliorat\w*)\b")
_SYM_TIME_RX = re.compile(
    r"\b(during|after|before|while|when|morning|evening|night|noon|afternoon|"
    r"daytime|forenoon|midnight|midday|sunrise|sunset)\b")
_RB_POLARITY_RX = re.compile(
    r"\b(agg\.|amel\.|aggravat\w*|ameliorat\w*|worse|worst|better|best)\b")
_RB_TIME_RX = _SYM_TIME_RX
# وہ وقت-الفاظ جو ٹوکنائزیشن کے بعد بھی بچ جاتے ہیں (بقیہ اسٹاپ ورڈ ہیں)
_RB_TIME_WORDS = {"morning", "evening", "night", "noon", "afternoon", "daytime",
                  "forenoon", "midnight", "midday", "sunrise", "sunset"}


def _is_negative(text: str) -> bool:
    """کیا علامت میں نفی ہے؟ (cannot / no / without / nahi ...)"""
    t = " " + str(text).lower() + " "
    return any(m in t for m in _NEG_MARKERS)


def _top_level_segments(text: str) -> int:
    """بریکٹ کے اندر کے کاما چھوڑ کر سطح-1 حصے گننا
    «APPETITE, increased (hunger in general)» → 2
    «APPETITE, increased, intermittent, in (See Chill)» → 4"""
    n, depth = 1, 0
    for ch in str(text):
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth = max(0, depth - 1)
        elif ch == "," and depth == 0:
            n += 1
    return n


_STEM_KEEP = {
    "lying", "lying_down", "menses", "measles", "news", "less", "is", "was",
    "this", "his", "gas", "pus", "pass", "press", "dress", "glass", "class",
    "abscess", "process", "excess", "success", "witness", "business",
}


def _stem(w: str) -> str:
    """ہلکا اسٹیمنگ — numb/numbness، shiver/shivering، finger/fingers ایک مانے جائیں"""
    if w in _STEM_KEEP or len(w) <= 4:
        return w
    for suf in ("nesses", "ness", "ings", "ing", "ies", "ied", "edly", "ed", "es", "s"):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            base = w[: -len(suf)]
            if suf == "ies":
                base += "y"
            if base.endswith("e") and len(base) > 3:   # cease/ceasing → ceas
                base = base[:-1]
            return base
    if w.endswith("e") and len(w) > 4 and w not in _STEM_KEEP:
        return w[:-1]                                   # "cease" → "ceas" (دونوں طرف یکساں)
    return w


_SPELL_CACHE: Dict[str, List[str]] = {}


def _edit_distance(a: str, b: str, maxd: int = 2) -> int:
    """سادہ Levenshtein — صرف ہجے کا فرق پکڑنے کے لیے"""
    if a == b:
        return 0
    if abs(len(a) - len(b)) > maxd:
        return maxd + 1
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + int(ca != cb)))
        if min(cur) > maxd:
            return maxd + 1
        prev = cur
    return prev[-1]


def _is_latin(text: str) -> bool:
    """کیا متن لاطینی/رومن رسم الخط میں ہے؟ (اردو رسم الخط کی پہچان)"""
    return bool(re.search(r"[A-Za-z]", text))


def _canonical(token: str) -> str:
    """ایک لفظ کو معیاری شکل میں ڈھالنا"""
    return SYNONYM_MAP.get(token, token)


# کینٹ ریپرٹری میں œ/æ جیسے لگیچر اور ڈائیکریٹک حروف عام ہیں
# (dyspnœa، hyperæmia، mammæ) — بغیر مرمت یہ الفاظ ٹوٹ جاتے ہیں
_LIGATURES = {
    "\u0153": "oe", "\u0152": "oe",   # œ Œ
    "\u00e6": "ae", "\u00c6": "ae",   # æ Æ
    "\u00df": "ss",                    # ß
}
_DIACRITICS = {
    "\u00e1": "a", "\u00e0": "a", "\u00e2": "a", "\u00e4": "a", "\u00e3": "a", "\u00e5": "a",
    "\u00e9": "e", "\u00e8": "e", "\u00ea": "e", "\u00eb": "e",
    "\u00ed": "i", "\u00ec": "i", "\u00ee": "i", "\u00ef": "i",
    "\u00f3": "o", "\u00f2": "o", "\u00f4": "o", "\u00f6": "o", "\u00f5": "o",
    "\u00fa": "u", "\u00f9": "u", "\u00fb": "u", "\u00fc": "u",
    "\u00f1": "n", "\u00e7": "c", "\u0101": "a", "\u0113": "e", "\u012b": "i", "\u014d": "o",
}


_SEE_RX = re.compile(r"\((?:see|see also|see\ also)[^)]*\)", re.I)


def _strip_refs(text: str) -> str:
    """ربرک کے "(See X)" حوالے صاف کرنا — ورنہ جھوٹے میچ بنتے ہیں
    (مثلاً "DRAWN backward (See Falling)" میں "Falling" کہیں اور کی علامت ہے)"""
    return _SEE_RX.sub(" ", str(text))


# ڈیٹا میں cp1252 کے ٹوٹے حروف (کینٹ کی پرانی فائل سے) — ہجے کی مرمت
_CP1252_FIX = {
    "\x9c": "oe", "\x8c": "OE",      # œ Œ (چھوٹا/بڑا حرف الگ)
    "\x91": "'", "\x92": "'",        # ' '
    "\x93": '"', "\x94": '"',        # " "
    "\x96": "-", "\x97": "-",        # – —
    "\xa0": " ", "\x85": " ",        # ناقابلِ طبع فاصلہ
    "\x8a": "s", "\x9a": "s", "\x8e": "z", "\x9e": "z",
}


def _unligature(text: str) -> str:
    """œ/æ اور ڈائیکریٹک حروف کو سادہ لاطینی میں بدلنا
    (+ cp1252 کے ٹوٹے حروف کی مرمت: dyspn\x9ca → dyspnoea)"""
    for k, v in _CP1252_FIX.items():
        text = text.replace(k, v)
    for k, v in _LIGATURES.items():
        text = text.replace(k, v)
    for k, v in _DIACRITICS.items():
        text = text.replace(k, v)
    return text


def _tokenize(text: str) -> List[str]:
    """متن کو صاف کر کے الفاظ کی فہرست بنانا
    نسخہ 4.7: ہائفن-والے الفاظ کے حصے بھی شامل («gall-stones» → gall-stones،
    gall، stones) — تاکہ «gall stone»/«gallstone» سے بھی میچ لگے"""
    text = _unligature(_strip_refs(str(text).lower()))
    text = re.sub(r"[^a-z0-9\s-]", " ", text)
    words = [w.strip("-") for w in text.split() if w.strip("-")]
    out = []
    for w in words:
        if not w or w in _STOPWORDS:
            continue
        out.append(w)
        if "-" in w:
            for part in w.split("-"):
                if part and part not in _STOPWORDS:
                    out.append(part)
    return out


def _tokens_canonical(text: str) -> List[str]:
    """متن کے الفاظ — دو لفظی فقرے + دستوری الفاظ + رومن اردو + مترادفات"""
    raw = _tokenize(text)
    out: List[str] = []
    i = 0
    while i < len(raw):
        if i + 1 < len(raw):
            pair = raw[i] + " " + raw[i + 1]
            if pair in _UR_PHRASES:          # "se barhti" → agg
                # نسخہ 4.8: فقرے کی پیداوار پر بھی وہی راستہ — ہجے + اسٹیم
                # (ورنہ "sar dard"→headache کا ٹوکن "headache" رہ جاتا، ربرک "headach")
                c = _canonical(_UR_PHRASES[pair])
                c = _SP.get(c, c)
                if c not in _FILLER:
                    out.append(_stem(c))
                i += 2
                continue
        w = raw[i]
        if w in _UR_GRAMMATICAL:             # "ka/ki/hai/..." چھپا دیا
            i += 1
            continue
        w = ROMAN_URDU.get(w, w)             # رومن اردو → انگریزی
        c = _canonical(w)                    # ریپرٹری کا مخفف / ایک ہی لفظ کی شکل
        c = _SP.get(c, c)                    # ہجے کی صورت (dyspnea → dyspnoea)
        if c in _FILLER:                     # بھرتی لفظ → چھوڑ دیں
            i += 1
            continue
        c = _stem(c)                         # ایک ہی لفظ کی صرفی صورت
        out.append(c)
        if "-" in c:                         # نسخہ 4.7: ہائفن-والے لفظ کے حصے بھی
            for part in c.split("-"):
                if part and part not in _STOPWORDS:
                    out.append(_stem(part))
        i += 1
    # (نسخہ 4.8) مرکب شکایت: head + pain (سر درد) = ریپرٹری کا اپنا لفظ «headache»
    # — جب دونوں لفظ ساتھ ساتھ آئیں اور headache ابھی نہ بنے ہو
    for _j in range(len(out) - 1):
        if out[_j] == "head" and out[_j + 1] == "pain":
            out.append(_stem("headache"))
            break
    return out


def _bigrams(tokens: List[str]) -> List[str]:
    """نسخہ 4.7: ترتیب سے آزاد بائی گرام — «burning feet» اور «feet burning»
    دونوں کا گرام «burn_foot» بنتا ہے۔ پہلے ترتیب-منحصر گرام کی وجہ سے
    «burning feet» کا میچ «Foot, burning» سے نہیں لگتا تھا (اور رومن اردو
    «paon mein jalan» کی ترتیب قریب قریب ربرک جیسی ہونے سے لگ جاتا تھا) —
    یعنی نتیجہ علامت کے الفاظ کی ترتیب پر منحصر تھا، جو غلطی تھی۔"""
    return ["_".join(sorted(tokens[i:i + 2])) for i in range(len(tokens) - 1)]


# ------------------------------------------------------------------ #
# ابوابی رہنمائی — علامت کا جسمانی/مرضی لفظ جس باب کی طرف اشارہ کرے
# ------------------------------------------------------------------ #
CHAPTER_HINTS = {
    "cough": ["cough", "coughing", "khansi"],
    "expectoration": ["expectoration", "sputum", "phlegm", "balgham"],
    "head": ["head", "headache", "migraine", "sar"],
    "eye": ["eye", "eyes", "vision", "aankh"],
    "ear": ["ear", "ears", "hearing", "kaan"],
    "nose": ["nose", "coryza", "sneeze", "sneezing", "naak", "nazla"],
    "throat": ["throat", "tonsil", "gala"],
    "stomach": ["stomach", "thirst", "thirsty", "appetite", "hunger", "hungry",
                "nausea", "vomiting", "vomit", "maida", "pait", "pyas", "qay", "matli",
                "increased"],
    "abdomen": ["abdomen", "belly", "pait", "gall", "gallstone", "gallbladder",
                "gall-stone", "gall-bladder", "stone", "calculus"],
    "rectum": ["rectum", "constipation", "qabz", "piles", "hemorrhoid", "haemorrhoid",
               "fissure", "anus"],
    "stool": ["stool", "constipation", "diarrhea", "diarrhoea", "qabz", "dast"],
    "urine": ["urine", "urination", "urinary", "peshab", "stone", "calculus"],
    "kidneys": ["kidney", "kidneys", "stone", "calculus", "gravel"],
    "genitalia_female": ["menses", "menstrual", "menstruation"],
    "skin": ["skin", "itching", "itch", "eruption", "rash", "khujli"],
    "sleep": ["sleep", "dream", "dreams", "insomnia", "neend"],
    "mind": ["anxiety", "fear", "grief", "anger", "sadness", "depression",
             "irritability", "weeping", "khauf", "gham", "ghussa", "ghabrahat"],
    "extremities": ["hand", "hands", "foot", "feet", "leg", "legs", "arm", "arms",
                    "joint", "joints", "knee", "knees", "shoulder", "toe", "toes",
                    "finger", "fingers", "thigh", "thighs", "hath", "paon", "joron"],
    "back": ["back", "spine", "peeth", "kamar"],
    "chest": ["chest", "heart", "palpitation", "seenah"],
    "fever": ["fever", "chill", "chills", "bukhar"],
    "vertigo": ["vertigo", "dizzy", "dizziness", "chakkar"],
    # نسخہ 2.4: سانس، لیٹنے/بیٹھنے کی حالت، اور تھکن کے اضافے
    "respiration": ["dyspnoea", "dyspnea", "breath", "breathing", "respiration",
                    "asthma", "asthmatic", "saans", "suffocation"],
    "generalities": ["lying", "lying_down", "sitting", "standing", "walking",
                     "rest"],
    # (نسخہ 4.7) پہلے یہاں "extremities" کی دوہری کلید تھی — یکجا کر دیا
}


# اکیلا یہ لفظ مل جائے تو بھی علامت کے معنی پورے نہیں ہوتے
_WEAK_HITS = {
    "first", "second", "third", "last", "next", "other", "others", "both",
    "all", "any", "one", "two", "three", "day", "time", "left", "right",
    "side", "part", "sides", "upper", "lower", "great", "small", "little",
    "cold", "heat", "pain", "attack", "attacks", "during", "before", "after",
    # صفتی/مقداری الفاظ — یہ اکیلا کوئی علامت نہیں بناتے
    "irregular", "interval", "intervals", "repeated", "severe", "long", "short",
    "sudden", "gradual", "slow", "fast", "quick", "mild", "violent", "intense",
    "constant", "intermittent", "periodic", "occasional", "frequent", "more",
    "less", "many", "few", "old", "new", "same", "different", "normal",
}

_QUALIFIER_TOKENS: set = set()


def _qualifier_tokens() -> set:
    """شرائط/اعضا کے وہ الفاظ جن کے بغیر علامت ادھوری ہے (کیش شدہ)"""
    global _QUALIFIER_TOKENS
    if not _QUALIFIER_TOKENS:
        toks = set(_SCOPE_TOKENS)
        for kws in CHAPTER_HINTS.values():
            for k in kws:
                toks.add(_stem(_canonical(k)))
        _QUALIFIER_TOKENS = toks
    return _QUALIFIER_TOKENS


def _qualifier_penalty(rb_tokens: List[str], sym_tokens: List[str]) -> float:
    """ربرک میں ایسی شرط/عضو جو بیمار نے نہیں بتایا → نمبر گریں
    مثلاً "violent palpitation" کے لیے "PALPITATION heart, stool, during" غلط ہے"""
    quals = _qualifier_tokens()
    extra = {t for t in set(rb_tokens) if t in quals and t not in sym_tokens}
    if not extra:
        return 1.0
    return max(0.5, 0.78 ** len(extra))


# نسخہ 4.7: باب-اشارے کے کلیدی الفاظ کی اسٹیمڈ شکلیں (match اسی سے ہوتا ہے)
_CHAPTER_HINTS_STEMMED: dict = {}

# نسخہ 4.8: عضو-لفظ → اُس کے ابواب (رینج-میپ) — باب-بنیاد مقام کے لیے
# («burning in stomach» میں "stomach" stomach-باب کی ربرکوں کے متن میں نہیں ہوتا،
#  مقام خود باب کے نام میں ہے — organ-گارڈ کو باب بھی دیکھنا ہوگا)
_ORGAN_CHAPTERS: Dict[str, set] = {}
for _ch, _kws in CHAPTER_HINTS.items():
    for _kw in _kws:
        _ORGAN_CHAPTERS.setdefault(_stem(_canonical(_kw)), set()).add(_ch)


def _chapter_hint(tokens: List[str]) -> set:
    """علامت کے الفاظ کی بنیاد پر متعلقہ ابواب کا اندازہ
    نسخہ 4.7: موازنہ اسٹیمڈ شکلوں سے — پہلے خام الفاظ سے موازنہ تھا،
    اس لیے «appetite»→«appetit» اور «increased»→«increas» کا اشارہ
    کبھی نہیں لگتا تھا اور درست باب کو ×1.20 بونس نہیں ملتا تھا"""
    if not _CHAPTER_HINTS_STEMMED:
        for ch, kws in CHAPTER_HINTS.items():
            _CHAPTER_HINTS_STEMMED[ch] = {_stem(_canonical(k)) for k in kws}
    hints = set()
    for tok in tokens:
        for chap, kws in _CHAPTER_HINTS_STEMMED.items():
            if tok in kws:
                hints.add(chap)
    return hints


class RubricIndex:
    """ربرکس کا inverted index — تیز، فقرے سے آگاہ تلاش"""

    def __init__(self, data_dir: Optional[Path] = None, chapters: Optional[List[str]] = None,
                 name: str = "kent", grade_max: int = 3):
        self.data_dir = Path(data_dir or DATA_DIR)
        self.name = name
        self.grade_max = grade_max
        self._chapters = chapters
        self.rubrics: Dict[str, dict] = {}   # "chapter::key" -> {"t","chapter","key","path",...}
        self._index: Dict[str, List[str]] = {}
        self._df: Dict[str, int] = {}        # ہر گرام کتنے ربرکس میں ہے (مخصوصیت کے لیے)
        self.N = 0                           # کل ربرکس
        self._chap_cache: Dict[str, dict] = {}  # باب کا پارس شدہ ڈیٹا (دوبارہ پارسنگ سے بچاؤ)
        self._load()

    # ---------------- لوڈنگ ----------------
    def _load(self) -> None:
        chapter_keys = self._chapters
        if chapter_keys is None:
            try:
                idx = json.loads((self.data_dir / "_index.json").read_text(encoding="utf-8"))
                if isinstance(idx, list):
                    chapter_keys = [c["key"] for c in idx]
                elif isinstance(idx, dict):
                    chapter_keys = list(idx.keys())
            except Exception:
                chapter_keys = [p.stem for p in self.data_dir.glob("*.json") if p.stem != "_index"]

        for key in chapter_keys:
            fpath = self.data_dir / f"{key}.json"
            if not fpath.exists():
                continue
            try:
                data = json.loads(fpath.read_text(encoding="utf-8"))
            except Exception:
                continue
            for rk, rv in data.items():
                if not isinstance(rv, dict):
                    continue
                text = rv.get("t", "")
                if not text:
                    continue
                rid = f"{key}::{rk}"
                # نسخہ 3.4: ٹوٹے حروف کی مرمت — صرف ہجے (dyspn\x9ca → dyspnoea)، معنی نہیں
                text = _unligature(text)
                self.rubrics[rid] = {
                    "t": text,
                    "chapter": key,
                    "key": rk,
                    "path": _unligature(rv.get("path", "") or ""),
                    "source_count": rv.get("source_count"),
                    "sources_sample": rv.get("sources_sample"),
                }
                # یونی گرام + بائی گرام دونوں کو index کریں
                toks = _tokens_canonical(_strip_refs(text))
                grams = set(toks) | set(_bigrams(toks))
                for g in grams:
                    self._index.setdefault(g, []).append(rid)
                    self._df[g] = self._df.get(g, 0) + 1
        self.N = max(len(self.rubrics), 1)

    def idf(self, gram: str) -> float:
        """کسی لفظ/فقرے کی مخصوصیت — جو گرام کم ربرکس میں ہو، وہ زیادہ قیمتی ہے
        (pain / right / side جیسے عام الفاظ کا وزن خودبخود گر جاتا ہے)"""
        df = self._df.get(gram, 0)
        if df <= 0:
            return _IDF_UNSEEN      # یہ لفظ کسی ربرک میں نہیں → نہ فائدہ نہ نقصان
        return min(_IDF_MAX, max(0.15, math.log(self.N / df) ** 1.3))

    def load_rubric(self, rid: str) -> dict:
        """ربرک کا اصل خام ریکارڈ (بشمول r: {دوا: درجہ})
        نوٹ: پورا باب صرف ایک بار پارس ہوتا ہے — بعد میں میموری سے (فیز 0 مرمت)"""
        chapter, key = rid.split("::", 1)
        data = self._chap_cache.get(chapter)
        if data is None:
            fpath = self.data_dir / f"{chapter}.json"
            try:
                data = json.loads(fpath.read_text(encoding="utf-8"))
                self._chap_cache[chapter] = data
            except Exception:
                return {}
        rec = data.get(key, {})
        return rec if isinstance(rec, dict) else {}

    # ---------------- تلاش (نسخہ 2.4: مخصوصیت کے وزن + پہرے) ---------------- #
    def search(self, symptom: str, top_k: int = 10, min_words: int = 1,
               strict: bool = True) -> List[dict]:
        """
        علامت کے قریب ترین ربرکس — اب چھ فلٹر لگے ہیں:
          1) بھرتی الفاظ (can, feels, as if, frequent...) حذف
          2) ہلکا اسٹیمنگ (numbness = numb، chattering = chatter)
          3) IDF: عام الفاظ (pain, right, side) کا وزن خودبخود کم
          4) نفی کا پہرا: "cannot lie down" ≠ "lie down"
          5) متضاد لفظ کا پہرا: cold ↔ heat، amel ↔ agg
          6) کم از کم دو اہم الفاظ (یا ایک بہت مخصوص لفظ)
        جو امیدوار رد ہوں وہ rejected_reason کے ساتھ واپس آتے ہیں (تشخیص کے لیے)۔
        """
        tokens = _tokens_canonical(symptom)
        if not tokens:
            return []
        sym_neg = _is_negative(symptom)
        grams = set(tokens) | set(_bigrams(tokens))
        w = {g: self.idf(g) * (1.7 if "_" in g else 1.0) for g in grams}
        total_w = sum(w.values()) or 1.0

        content = [t for t in tokens]
        anchor = max(tokens, key=lambda t: self.idf(t))
        anchor_idf = self.idf(anchor)
        hints = _chapter_hint(tokens)

        raw_hits: Dict[str, float] = {}
        for g in grams:
            for rid in self._index.get(g, []):
                raw_hits[rid] = raw_hits.get(rid, 0.0) + w[g]

        out: List[dict] = []
        for rid in raw_hits:
            rb = self.rubrics[rid]
            rb_low = rb["t"].lower()
            rb_tokens = _tokens_canonical(_strip_refs(rb["t"]))
            rb_grams = set(rb_tokens) | set(_bigrams(rb_tokens))
            matched = grams & rb_grams
            matched_w = sum(w[g] for g in matched)
            coverage = matched_w / total_w
            hit_u = {g for g in matched if "_" not in g}

            # نسخہ 4.7: موڈیلٹی-اصول کے جھنڈے — ایک بار، لوپ سے پہلے
            sym_low = str(symptom).lower()
            sym_pol = bool(_SYM_POLARITY_RX.search(sym_low)) or "agg" in tokens or "amel" in tokens
            sym_time = bool(_SYM_TIME_RX.search(sym_low)) or bool(set(tokens) & _RB_TIME_WORDS)
            sym_plain = not sym_pol and not sym_time and len(tokens) <= 3
            sym_nseg_lim = _top_level_segments(symptom)

            reason = ""
            # (الف) نفی کا تضاد
            rb_neg = _is_negative(rb["t"]) or "cannot" in rb_low or "unable" in rb_low
            if strict and sym_neg != rb_neg:
                reason = "نفی کا تضاد (نفی ↔ اثبات)"
            # (ب) متضاد لفظ
            if not reason:
                for a, b in ANTONYM_PAIRS:
                    if a in tokens and b in rb_grams and b not in tokens:
                        reason = f"متضاد لفظ ({b})"
                        break
                    if b in tokens and a in rb_grams and a not in tokens:
                        reason = f"متضاد لفظ ({a})"
                        break
            # (ج) دو اہم الفاظ، ورنہ ایک بہت مخصوص لفظ
            # (ج2) عضو/مقام کا لفظ: علامت میں عضو ہے تو ربرک میں بھی ہونا لازمی
            sym_organs = {t for t in tokens if t in _qualifier_tokens()}
            if not reason and strict and sym_organs and not (sym_organs & set(rb_tokens)):
                # نسخہ 4.8: پریفکس-بردار — مریض کا عضو ربرک کے لفظ کا پہلا حصہ ہو تو ملایا جائے
                # («sar dard» کا "head" ← ربرک کا "headache") — ورنہ سر-باب کی درست ربرک رد ہو جاتی تھی
                _rb_pref = {_pref(t) for t in rb_tokens}
                _pref_ok = any(_pref(o) in _rb_pref for o in sym_organs)
                # نسخہ 4.8: باب-بنیاد مقام — عضو کا اپنا باب ہو تو متن میں لفظ نہ بھی ہو تو چلے گا
                # («PAIN, burning» (stomach باب) ← «burning in stomach»)
                _chap_ok = any(rb["chapter"] in _ORGAN_CHAPTERS.get(o, set())
                               for o in sym_organs)
                if not _pref_ok and not _chap_ok:
                    reason = "عضو کا لفظ ربرک میں نہیں"
            if not reason and strict:
                head_tok = rb_tokens[0] if rb_tokens else ""
                strong_single = (
                    len(hit_u) == 1
                    and max(self.idf(g) for g in hit_u) >= 5.0
                    and len(rb_tokens) <= 5
                    and not (hit_u & _WEAK_HITS)          # "first"، "attack" جیسے کمزور الفاظ اکیلا نہ چلیں
                    and (len(rb_tokens) <= 2 or next(iter(hit_u)) == head_tok)
                )
                if len(content) >= 2 and len(hit_u) < 2 and not strong_single:
                    reason = "صرف ایک عام لفظ ملا"
                elif len(content) < 2:
                    if anchor_idf < 2.5:
                        reason = "بہت عام لفظ (اکیلا)"
                    elif hit_u & _WEAK_HITS:
                        reason = "ادھوری علامت (صرف صفت/سمت)"
            # (ج3) ایک لفظ کی علامت: ربرک کا موضوع وہی لفظ ہو (لمبے فقرے کے آخر میں نہ ہو)
            if not reason and strict and len(content) < 2 and rb_tokens:
                if next(iter(hit_u), "") != rb_tokens[0] and len(rb_tokens) > 3:
                    reason = "ربرک اس لفظ کے بارے میں نہیں"
            # (د) کوریج کی حد
            if not reason and coverage < (0.30 if strict else 0.12):
                reason = "کوریج کم"

            # ابواب کی مطابقت
            chapter_ok = rb["chapter"] in hints
            shadow_chapter = bool(hints) and not chapter_ok and \
                rb["chapter"] not in GENERAL_CHAPTERS and rb["chapter"] not in MIND_CHAPTERS

            rb_w = sum(self.idf(g) * (1.7 if "_" in g else 1.0) for g in rb_grams) or 1.0
            tightness = min(matched_w / rb_w, 1.0)
            # ایک لفظ کی علامت ہو تو مختصر ربرک کو ترجیح (لمبے فقرے میں دب نہ جائے)
            cov_w = 0.80 if len(content) >= 3 else (0.74 if len(content) == 2 else 0.68)
            score = (coverage * cov_w + tightness * (1 - cov_w)) * 100
            if chapter_ok:
                score *= 1.20
            if shadow_chapter:
                score *= 0.55
            if not hints:
                # علامت میں کوئی عضو نہیں → عمومی/ذہنی باب بہتر، عضو کے باب کمزور
                if rb["chapter"] in GENERAL_CHAPTERS:
                    score *= 1.15
                elif rb["chapter"] not in MIND_CHAPTERS:
                    score *= 0.85
            score *= _qualifier_penalty(rb_tokens, tokens)   # غیر بتائی گئی شرائط پر سزا
            # نسخہ 4.7: موڈیلٹی-اصول — مریض نے رخ/وقت نہیں بتایا تو وہ ربرک نہیں
            rb_pol = bool(_RB_POLARITY_RX.search(rb_low))
            rb_time = bool(_RB_TIME_RX.search(rb_low))
            if rb_pol and not sym_pol:
                score *= 0.55        # ربرک بگاڑ/بہتری کی ہے — مریض نے رخ نہیں بتایا
            if rb_time and not sym_time:
                score *= 0.72        # ربرک وقت کی شرط رکھتی ہے — مریض نے وقت نہیں بتایا
            # نسخہ 4.7: مین ربرک کی ترجیح — سادہ علامت پر ہر اضافی شرط موڈیلٹی ہے:
            # جتنی کم سطحیں ( topLevel کاما)، اُتنی قریب مین ربرک
            if sym_plain:
                n_seg = _top_level_segments(rb["t"])
                if n_seg <= max(2, sym_nseg_lim):
                    score *= 1.25
                elif n_seg >= 4:
                    score *= 0.80
            if anchor in hit_u:                       # بنیادی لفظ ملا → بونس
                score *= 1.10
            elif anchor_idf >= 4.0:                   # بنیادی لفظ غائب → سزا
                score *= 0.60
            if rb_tokens and any(g == rb_tokens[0] for g in hit_u):
                score *= 1.08                         # ربرک اُسی لفظ سے شروع ہو رہی ہے
            if reason:
                score *= 0.05

            out.append({
                "rubric_id": rid,
                "chapter": rb["chapter"],
                "text": rb["t"],
                "path": rb.get("path", ""),
                "score": round(score, 2),
                "coverage": round(coverage, 3),
                "matched": sorted(matched),
                "anchor": anchor,
                "rejected_reason": reason,
            })

        out.sort(key=lambda r: (-r["score"], -r["coverage"]))
        if strict:
            good = [r for r in out if not r["rejected_reason"]]
            return good[:top_k]
        return out[:top_k]

    # ---------------- «غیر موجود الفاظ» کی رپورٹ ---------------- #
    def unmatched_words(self, symptom: str) -> List[dict]:
        """جو الفاظ اِس ریپرٹری میں نہیں ملے — معالج کو دکھانے کے لیے"""
        out = []
        for w, cands in self.word_check(symptom)["unknown"].items():
            out.append({"word": w, "spelling_candidates": cands})
        return out

    def explain(self, symptom: str, top_k: int = 5) -> dict:
        """یہ علامت کیوں کوئی ربرک نہیں بن سکی — UI میں دکھانے کے لیے خلاصہ"""
        tokens = _tokens_canonical(symptom)
        acc = self.search(symptom, top_k=top_k, strict=True)
        if acc:
            return {"accepted": acc, "reason": "", "tokens": tokens}
        allr = self.search(symptom, top_k=3, strict=False)
        reason = allr[0].get("rejected_reason") if allr else "کوئی ملتا جلتا ربرک نہیں"
        return {"accepted": [], "reason": reason or "کوریج کم", "tokens": tokens,
                "nearest": allr[0].get("text", "") if allr else ""}

    # ---------------- «لفظ بلفظ» جانچ (نسخہ 3.2) ---------------- #
    def word_check(self, symptom: str) -> dict:
        """علامت کے الفاظ کی جانچ — کون سا لفظ اِس ریپرٹری میں اصلًا موجود ہے
        اور کون سا نہیں۔ (کوئی مترادف تجویز نہیں — صرف ہجے کی صورت)"""
        toks = _tokens_canonical(symptom)
        known, unknown = {}, {}
        for t in toks:
            n = len(self._index.get(t, []))
            if n:
                known[t] = n
            else:
                unknown[t] = self._spelling_candidates(t)
        return {"known": known, "unknown": unknown}

    def _spelling_candidates(self, tok: str, limit: int = 4) -> List[str]:
        """اِسی لفظ کی ہجے والی قریب ترین صورتیں (معنی کے قریب نہیں)"""
        if tok in _SPELL_CACHE:
            return _SPELL_CACHE[tok]
        if len(tok) < 4:
            _SPELL_CACHE[tok] = []
            return []
        out = []
        for cand in self._index.keys():
            if "_" in cand or abs(len(cand) - len(tok)) > 2:
                continue
            if cand[0] != tok[0]:
                continue
            if _edit_distance(tok, cand, 2) <= 1 and len(tok) > 5:
                out.append((len(self._index[cand]), cand))
        out.sort(reverse=True)
        res = [c for (_n, c) in out[:limit]]
        _SPELL_CACHE[tok] = res
        return res

    def dimensions(self, chapter: str) -> str:
        """باب کی جہت — mind / generals / particulars (جرمن ابواب سمیت)"""
        if chapter in MIND_CHAPTERS or chapter in GERMAN_MIND_CHAPTERS:
            return "mind"
        if chapter in GENERAL_CHAPTERS or chapter in GERMAN_GENERAL_CHAPTERS:
            return "generals"
        return "particulars"


# ------------------------------------------------------------------ #
# ایل ایل ایم کی مدد سے ربرک کا انتخاب (کیش شدہ)
# ------------------------------------------------------------------ #
_llm_cache: Dict[str, List[dict]] = {}

_translate_cache: Dict[str, str] = {}

_expand_cache: Dict[str, List[str]] = {}

_CACHE_LIMIT = 500


def _cache_put(cache: Dict, key: str, value) -> None:
    """کیش میں رکھنا — حجم کی حد کے ساتھ (بے پناہ بڑھنا روکنے کے لیے)"""
    if len(cache) >= _CACHE_LIMIT:
        try:
            cache.pop(next(iter(cache)))
        except Exception:
            pass
    cache[key] = value


def _llm_translate_symptom(symptom: str, index_name: str = "kent") -> str:
    """علامت کو مطلوبہ ریپرٹری کی زبان میں کلیدی الفاظ میں بدلنا (کیش شدہ)
    - انگریزی ریپرٹریز: اردو/رومن → انگریزی
    - جرمن کینٹ (kent_de): اردو/رومن/انگریزی → جرمن
    """
    from . import llm

    key = f"{index_name}::{symptom.strip()}"
    if key in _translate_cache:
        return _translate_cache[key]

    if index_name == "kent_de":
        prompt = (
            "You are a homeopathic repertory translator. "
            "Convert this patient symptom into concise GERMAN repertory keywords "
            "(as used in German homeopathic repertories, e.g. 'Husten', "
            "'Besserung durch Bewegung', 'Verschlechterung bei Bewegung', 'Nachts'). "
            "Keep modality phrases in German.\n\n"
            f'Symptom: "{symptom}"\n\n'
            "Return ONLY the German keywords, comma-separated, no explanation."
        )
        ok = lambda s: bool(re.search(r"[A-Za-zÄÖÜäöüß]", s))
    else:
        prompt = (
            "You are a homeopathic repertory translator. "
            "Convert this patient symptom into concise English repertory keywords. "
            "Keep modality terms like 'worse from' or 'better from'.\n\n"
            f'Symptom: "{symptom}"\n\n'
            "Return ONLY the English keywords, comma-separated, no explanation."
        )
        ok = _is_latin

    try:
        raw, _ = llm.ask_llm(prompt, require_json=False, temperature=0.0)
        out = str(raw).strip().strip('"').strip()
        if out and ok(out):
            _cache_put(_translate_cache, key, out)
            return out
    except Exception:
        pass
    _cache_put(_translate_cache, key, "")
    return ""


def _llm_expand_symptom(symptom: str, index_name: str = "kent") -> List[str]:
    """کم اعتماد میچ پر: لے سے 2-3 متبادل فارمولے (کیش شدہ)"""
    from . import llm

    key = f"expand::{index_name}::{symptom.strip().lower()}"
    if key in _expand_cache:
        return _expand_cache[key]

    lang = "GERMAN (as in German homeopathic repertories)" if index_name == "kent_de" else "English"
    prompt = (
        f"You are a homeopathic repertory scholar. The patient symptom below did not "
        f"clearly match any repertory rubric. Suggest 2 to 3 alternative concise phrasings "
        f"in {lang} that a repertory would likely use for the SAME clinical meaning "
        f"(different wording, e.g. 'cannot sleep' -> 'insomnia', 'sleeplessness, nights'). "
        f"Keep modality terms.\n\n"
        f'Symptom: "{symptom}"\n\n'
        'Return ONLY valid JSON: {"variants":["...","..."]}'
    )
    try:
        raw, _ = llm.ask_llm(prompt, require_json=True, temperature=0.2)
        data = llm.extract_json(raw)
        variants = [str(v).strip() for v in data.get("variants", []) if str(v).strip()][:3]
        _cache_put(_expand_cache, key, variants)
        return variants
    except Exception:
        _cache_put(_expand_cache, key, [])
        return []


# ------------------------------------------------------------------ #
# (نسخہ 2.4) متبادل طبی الفاظ — جب لفظی مماثلت ناکام ہو
# ------------------------------------------------------------------ #
SYMPTOM_ALIASES = (
    (r"\bheart attacks?\b", "heart spasm"),
    (r"\bheart (stopped|stops|stopping)\b", "heart ceasing"),
    (r"\b(stopped|stops)\s+(followed by|then)", "ceasing followed by"),
    (r"\baccouchement\b", "childbirth"),
    (r"\bafter (childbirth|delivery|pregnancy)\b", "childbirth after"),
    (r"\bapex of (the )?heart\b", "heart trembling"),
    (r"\bback (feels )?(drawn|drawn backward|bending backward)\b", "back drawn backward"),
    (r"\bshivering with chattering of teeth\b", "chattering teeth"),
    (r"\bfingers? numb\b", "fingers numbness"),
    (r"\bnumb(ness)? of the (right|left) (leg|arm)\b", r"\1 \2 numbness"),
)

# لمبی علامت کو جوڑنے والے الفاظ پر توڑنے کے لیے
_SPLIT_RX = re.compile(
    r"\s(?:with|and|followed by|from|during|while|before|after|as if|like|that|which)\s"
)


def _alias_variants(symptom: str) -> List[str]:
    """علامت کے متبادل فارمولے (مقامی، ایل ایل ایم کے بغیر)"""
    out = []
    for pat, rep in SYMPTOM_ALIASES:
        if re.search(pat, symptom, flags=re.I):
            v = re.sub(pat, rep, symptom, flags=re.I).strip()
            if v.lower() != symptom.lower():
                out.append(v)
    return out[:4]


def _sub_symptoms(symptom: str) -> List[str]:
    """لمبی علامت کے ٹکڑے — ہر ٹکڑا الگ جانچا جائے"""
    parts = [p.strip(" ,.;:") for p in _SPLIT_RX.split(str(symptom))]
    return [p for p in parts if len(p.split()) >= 1 and len(p) >= 4][:5]


def select_rubrics_llm(symptom: str, candidates: List[dict], index: RubricIndex,
                       max_pick: int = 3) -> Optional[List[dict]]:
    """
    ایل ایل ایم سے کہا جاتا ہے کہ دیے گئے امیدوار ربرکس میں سے بہترین کا انتخاب کرے۔

    واپسی: [{rubric_id, text, chapter, confidence, rationale}] یا ناکامی پر None
    """
    from . import llm

    key = f"{index.name}::{symptom.strip().lower()}"
    if key in _llm_cache:
        return _llm_cache[key]

    if len(candidates) > 10:
        candidates = candidates[:10]

    numbered = []
    for i, c in enumerate(candidates, 1):
        # نسخہ 4.7: سادہ مین ربرک کی نشان دہی — تاکہ ایل ایل ایم موڈیلٹی-اصول لاگو کر سکے
        tag = " [main rubric]" if str(c.get("text", "")).count(",") <= 1 and "(" not in str(c.get("text", "")) else ""
        numbered.append(f"{i}. [{c['chapter']}]{tag} {c['text']}")

    prompt = f"""You are an expert classical homeopath and repertory scholar.
Convert the patient symptom into the best matching repertory rubric(s).

Symptom: "{symptom}"

Candidate rubrics (pre-filtered by keyword matching):
{chr(10).join(numbered)}

Rules:
- Choose 1 to {max_pick} rubrics that genuinely represent the symptom.
- MODALITY RULE: if the patient stated NO modality (no worse/better, no time,
  no condition), prefer the PLAIN MAIN rubric. Pick a sub-rubric only when its
  extra condition words are actually stated by the patient
  (e.g. for "constipation" prefer "CONSTIPATION" over "CONSTIPATION, painful").
- If the patient DID state a modality, map it to the rubric that carries that
  same modality (e.g. "cough worse from motion" -> the motion-agg. rubric).
- Do NOT invent rubrics; only pick from the numbered list.
- confidence: 0.0 to 1.0 (how sure you are this rubric matches the symptom).

Return ONLY valid JSON:
{{"selections":[{{"candidate_id":1,"confidence":0.9,"rationale":"short reason"}}]}}"""

    try:
        raw, _ = llm.ask_llm(prompt, require_json=True)
        data = llm.extract_json(raw)
        sels = data.get("selections", [])
        out = []
        for s in sels:
            cid = s.get("candidate_id")
            try:
                i = int(cid) - 1
            except (TypeError, ValueError):
                continue
            if 0 <= i < len(candidates):
                c = candidates[i]
                out.append({
                    "rubric_id": c["rubric_id"],
                    "chapter": c["chapter"],
                    "text": c["text"],
                    "path": c.get("path", ""),
                    "score": c["score"],
                    "confidence": round(float(s.get("confidence", 0.7)), 2),
                    "rationale": str(s.get("rationale", ""))[:140],
                })
        if out:
            _cache_put(_llm_cache, key, out)
            return out
    except Exception:
        pass
    return None


def _merge_candidates(base: List[dict], extra: List[dict]) -> List[dict]:
    """دو امیدوار فہرستیں ملاؤ — ایک ہی ربرک میں سے بہترین اسکور رکھو"""
    merged: Dict[str, dict] = {}
    for c in list(base) + list(extra):
        rid = c.get("rubric_id")
        if not rid:
            continue
        if rid not in merged or (c.get("score", 0) or 0) > (merged[rid].get("score", 0) or 0):
            merged[rid] = c
    out = list(merged.values())
    out.sort(key=lambda c: -(c.get("score", 0) or 0))
    return out


# ------------------------------------------------------------------ #
# نسخہ 3.4: جزو بمقابلہ جزو — «شرط ادھوری» ربرک رد
# ------------------------------------------------------------------ #
# اصول (کاما کے قانون سے): ربرک ایک مکمل جملہ ہے — ہر کاما ایک شرط۔
# اگر ربرک میں ایسی شرط ہو جو مریض کے بولے گئے الفاظ میں نہیں، تو وہ ربرک
# اِس کیس کی نہیں — رد کر کے معالج کو دکھائیں کہ کون سی شرط نہیں بتائی گئی۔
try:
    from homeo_core.engine import rubric_grammar as _RG
    _RG_LOC = {str(k).lower() for k in _RG.LOCATION_UR}
    _RG_SENS = {str(k).lower() for k in _RG.SENSATION_UR}
    _RG_MOD = {str(k).lower() for k in _RG.MODALITY_UR}
    _RG_TIME = {str(k).lower() for k in _RG.TIME_UR}
    _RG_COMP = {str(k).lower() for k in _RG.COMPLAINT_UR}
    _RG_MENTAL = {str(k).lower() for k in _RG.MENTAL_UR}
except Exception:  # احتیاط
    _RG_LOC, _RG_SENS, _RG_MOD, _RG_TIME, _RG_COMP, _RG_MENTAL = (set(),) * 6

# شکایت کے وہ نام جو ربرک کے سرِ فہرست آتے ہیں (کردار کی پہچان — مترادف نہیں)
_EXTRA_COMPLAINT = {
    "retching", "vomiting", "nausea", "jerks", "jerk", "restlessness", "dyspnoea", "dyspnea",
    "palpitation", "palpitations", "spasm", "spasms", "sciatica", "dryness", "thirst", "hunger",
    "cough", "sneezing", "hiccough", "hiccup", "yawning", "sighing", "weeping", "laughing",
    "faintness", "fainting", "convulsion", "convulsions", "paralysis", "trembling", "fluttering",
    "chattering", "shivering", "chilliness", "flushes", "itching", "eruption", "diarrhoea",
    "diarrhea", "constipation", "perspiration", "sweat", "haemorrhage", "hemorrhage",
    "sleeplessness", "vertigo", "dizziness", "headache", "cramp", "cramps", "stiffness",
    # (نسخہ 4.8) "pain" بھی شکایت کا نام ہے — ورنہ «PAIN, headache in general»
    # جیسی ربرک کا سرِ جملہ صرف «PAIN» بنتا تھا (کردار sens) اور مریض کے لفظ
    # «headache» سے سرِ غائب نہ معفو ہوتا («headache from sun» رد ہو جاتی تھی)
    "pain", "pains", "ache", "aches",
    "swelling", "oedema", "edema", "ulcer", "ulcers", "discharge", "menses", "menstruation",
    "hoarseness", "soreness", "smarting", "burning", "numbness", "weakness", "debility",
    "pulse", "beating", "beats", "pulsation", "pulsations", "rhythm", "fluttering",
    "attack", "attacks", "paroxysm", "paroxysms", "fit", "fits", "episode", "spell", "spells",
    "anxious", "anxiety", "restless", "restlessness", "danger", "dread", "sad", "sadness",
    "sorrow", "sorrowful", "uneasy", "terror", "panic", "terrified", "afraid", "weeping",
    "groaning", "moaning", "screaming", "shouting", "sobbing", "complaining", "sighing",
}
# وہ شرائط جو ربرک میں ہوں تو کیس میں بھی ہونی چاہئیں — ورنہ ربرک رد (جزو بمقابلہ جزو)
_STRICT_EXTRA = {
    # خاص کیفیتیں (احساس کی دوسری تہہ)
    "stitching", "sticking", "drawing", "burning", "itching", "tearing", "cutting", "boring",
    "pressing", "sore", "bruised", "smarting", "griping", "shooting", "lancinating", "crawling",
    "formication", "pulsating", "throbbing", "stinging", "gnawing", "digging", "bursting",
    "splitting", "ulcerative", "itching", "cramping", "gripping", "writhing",
    # خاص شرائط (موڈیلٹی / وقت)
    "talking", "eating", "drinking", "stool", "urination", "menses", "menstruation", "coughing",
    "sneezing", "exertion", "motion", "walking", "climbing", "ascending", "stooping", "touch",
    "pressure", "noise", "light", "swallowing", "breathing", "inspiration", "expiration",
    "waking", "sleeping", "coition", "morning", "evening", "night", "midnight", "noon",
    "afternoon", "periodical", "intervals", "regular", "lying", "sitting", "standing",
    # بیماریوں/خرابیوں کے نام — مریض نے نہ بتائے ہوں تو ربرک رد
    "hydropericardium", "pericarditis", "aneurism", "aneurysm", "hypertrophy", "dilatation",
    "fever", "ague", "typhoid", "cholera", "measles", "scarlatina", "pneumonia", "influenza",
    "rheumatism", "gout", "asthma", "phthisis", "consumption", "diphtheria", "erysipelas",
    "valvular", "organic", "lesion", "tubercular", "tuberculosis", "syphilitic", "syphilis",
    "cancer", "cancerous", "tumour", "tumor", "polypus", "calculus", "stone", "dropsy",
    "ascites", "jaundice", "diabetes", "epileptic", "hysterical", "apoplectic", "sprained",
    "dislocation", "fracture", "involuntary", "convulsive",
}
# عضو کے خاندان (کون سا عضو کس حصے میں ہے) — میچ کے لیے، ریپرٹری کا لفظ خود نہیں بدلتا
_REGION = {
    "leg": "lower", "legs": "lower", "knee": "lower", "knees": "lower", "foot": "lower",
    "feet": "lower", "toe": "lower", "toes": "lower", "calf": "lower", "calves": "lower",
    "ankle": "lower", "heel": "lower", "thigh": "lower", "hip": "lower", "shin": "lower",
    "sciatica": "lower", "lower limbs": "lower", "nates": "lower", "soles": "lower",
    "arm": "upper", "arms": "upper", "hand": "upper", "hands": "upper", "finger": "upper",
    "fingers": "upper", "thumb": "upper", "thumbs": "upper", "wrist": "upper",
    "elbow": "upper", "shoulder": "upper", "upper limbs": "upper", "forearm": "upper",
    "axilla": "upper", "axillae": "upper", "armpit": "upper",
    "head": "head", "occiput": "head", "vertex": "head", "forehead": "head", "temple": "head",
    "temples": "head", "scalp": "head", "brain": "head",
    "abdomen": "abdomen", "abdominal": "abdomen", "belly": "abdomen", "navel": "abdomen",
    "gall": "abdomen", "gallstone": "abdomen", "gallbladder": "abdomen",   # نسخہ 4.7
    "stomach": "stomach", "gastric": "stomach", "epigastrium": "stomach",
    "chest": "chest", "breast": "chest", "throat": "throat", "mouth": "mouth", "tongue": "mouth",
    "tooth": "teeth", "teeth": "teeth", "nose": "nose", "ear": "ear", "ears": "ear",
    "eye": "eye", "eyes": "eye", "face": "face", "bladder": "bladder", "rectum": "rectum",
    "skin": "skin", "blood": "blood",
    "back": "back", "spine": "back", "lumbar": "back", "sacrum": "back", "coccyx": "back",
    "neck": "back", "nape": "back",
    "chest": "chest", "heart": "chest", "breast": "chest", "breasts": "chest",
    "diaphragm": "chest", "pectoral": "chest",
    "abdomen": "abdomen", "stomach": "abdomen", "liver": "abdomen", "spleen": "abdomen",
    "intestines": "abdomen", "belly": "abdomen", "navel": "abdomen",
    "uterus": "pelvis", "ovaries": "pelvis", "bladder": "pelvis", "kidneys": "pelvis",
    "rectum": "pelvis", "haemorrhoids": "pelvis", "hemorrhoids": "pelvis", "prostate": "pelvis",
    "mouth": "face", "teeth": "face", "tooth": "face", "tongue": "face", "throat": "face",
    "nose": "face", "ear": "face", "ears": "face", "eye": "face", "eyes": "face",
    "face": "face", "lips": "face", "chin": "face", "cheek": "face", "cheeks": "face",
    "skin": "skin", "glands": "skin",
    "pulse": "circ", "circulation": "circ", "blood": "circ", "veins": "circ",
    "respiration": "resp", "breathing": "resp", "lungs": "resp", "cough": "resp",
}

# صرف جوڑنے والے حرف — شرط نہیں
_COND_SKIP = {
    "of", "the", "a", "an", "in", "on", "at", "with", "and", "or", "from", "to", "by",
    "during", "while", "as", "if", "that", "this", "when", "after", "before", "etc", "see",
    "sensation", "internal", "external", "general", "generalities", "concomitants", "extending",
    "side", "sides", "left", "right", "upper", "lower", "part", "partial", "one", "other",
    "agg", "amel", "amelioration", "aggravation", "than", "more", "less", "not", "no",
    "cannot", "can", "will", "would", "is", "are", "was", "were", "it", "its",
    "open", "bed", "day", "weather", "storm",
}
_MULTI_COND = {}
for _k in _RG_LOC:
    if " " in _k:
        _MULTI_COND[_k] = "loc"
for _k in _RG_SENS:
    if " " in _k:
        _MULTI_COND[_k] = "sens"
for _k in _RG_MOD:
    if " " in _k:
        _MULTI_COND[_k] = "mod"

_BRANCH = {"ameliorations", "amelioration", "aggravations", "aggravation", "modalities",
           "modality", "generalities", "concomitants", "conditions", "condition", "mind",
           "sensations", "general", "etc", "agg", "amel",
           # سنتھیسس کے درجہ بندی والے (والد) عنوانات — شرط نہیں
           "inner", "pressure", "oppression", "load", "sensation", "sensations"}

_AGG_RX = re.compile(r"(?:\bagg\b|aggravat|worse|worst|brings? on|brought on|increas|more severe|severe than|violent|intense)", re.I)
_AMEL_RX = re.compile(r"(?:\bamel\b|ameliorat|better|best|reliev|eases?|comfortable|prefer)", re.I)


# عام الفاظ جو کسی ربرک کو «سہارا» نہیں دیتے (یہ ہر جگہ آ جاتے ہیں)
# نسخہ 4.2 — «درست ربرک» کی جانچ (ٹائلر-ویر: «be sure that you have your very rubric»)
# نسخہ 4.3: صرف وہ ربرک حوالہ ہے جس کے بعد کوئی شرط نہ ہو («FLATULENCE (See Rumbling)») —
# «OFFENDED, easily (See Sensitive)» حقیقی ربرک ہے، اُسے رد نہیں کرنا
_CROSSREF_RX = re.compile(r"^[A-Za-z' -]*\(\s*See[^)]*\)\s*$")


def _drop_pure_crossrefs(items: List[dict], index: "RubricIndex",
                         reject_log: Optional[List[dict]] = None) -> List[dict]:
    """نسخہ 4.7: خالی حوالہ-ربرک (See …) کا اصل پہرہ
    -----------------------------------------------
    پہلا اصول (subject_guard کا ^…$ پیٹرن) مؤثر نہیں تھا کیونکہ path+text+chapter
    کے جوڑ کے آخر میں باب کا نام ہوتا ہے جو $ کو توڑ دیتا ہے۔ مگر محض متن پر
    پیٹرن لگانا بھی غلط ہو گا: «CONSTIPATION (See Inactivity)» (213 ادویات) اور
    «OFFENDED, easily (See Sensitive)» حقیقی ربرکیں ہیں۔
    درست پہچان: حوالہ-ربرک اُسی وقت رد ہو جب اُس کے پاس ادویات ہی نہ ہوں
    («GALL stone colic (See Pain in Liver)» — r=0 — محض اشارہ ہے)۔"""
    out: List[dict] = []
    for it in items:
        t = str(it.get("text") or "").strip()
        if _CROSSREF_RX.search(t):
            rec = {}
            rid = it.get("rubric_id")
            if rid:
                try:
                    rec = index.load_rubric(rid) or {}
                except Exception:
                    rec = {}
            if not (rec.get("r") if isinstance(rec, dict) else None):
                if reject_log is not None:
                    reject_log.append({"rubric": t, "path": it.get("path", ""),
                                       "kind": "crossref",
                                       "why": "خالی حوالہ-ربرک (See …) — ادویات نہیں",
                                       "missing": []})
                continue
        out.append(it)
    return out
# الٹا درجہ/مقدار — «appetite poor» کے لیے «Appetite - excessive» غلط ہے
_DEGREE_RX = re.compile(
    r"\b(poor|want of|loss of|diminished|decreased|decrease|less|absent|lacking|suppressed|small)\b", re.I)
_DEGREE_OPP_RX = re.compile(
    r"\b(excessive|increased|increase|great|ravenous|excess|enormous|too much|avarice|bulimy|"
    r"morbid appetite|voracious)\b", re.I)
# رُخ: مریض «بہتر/کم» کہے اور ربرک بگاڑ کی ہو (اور اُلٹا)
_FIXED_STRICT_EXTRA = {"labor", "labour", "snakes", "goitre", "goiter", "writing", "reading",
                       "cheese", "swinging", "sneezing", "smoking", "onions", "coition", "coryza",
                       "bending", "kneeling", "fasting", "butter", "bread", "pastry", "wine",
                       "beer", "fright", "chagrin", "mortification", "jealousy", "bathing", "fever"}
# موضوع کے الفاظ (اگر ربرک کا سرِ جملہ اِن میں سے ہو اور مریض کے الفاظ سے نہ ملے → رد)
_FOOD_WORDS = {"fats", "fat", "fatty", "milk", "butter", "cheese", "acids", "acid", "sweets",
                "sweet", "salt", "salty", "sour", "bitter", "bread", "meat", "fish", "eggs",
                "vegetables", "fruit", "coffee", "tea", "wine", "beer", "spices", "water",
                "smoking", "tobacco", "cold food", "warm food", "sour things"}
_COMPLAINT_WORDS = {"rumbling", "gurgling", "borborygmus", "bubbling", "flatulence", "flatus",
                    "distension", "emptiness", "heaviness", "fullness", "pain", "headache",
                    "cough", "vomiting", "nausea", "burning", "cramp", "spasm", "weakness",
                    "hoarseness", "sleeplessness", "itching", "eruption", "sweat", "perspiration",
                    "palpitation", "constipation", "diarrhoea", "heartburn", "eructation",
                    "appetite", "thirst", "hunger", "weak", "faint", "sensitive"}
_SUBJECT_WORDS = {
    "abdomen", "abdominal", "stomach", "gastric", "head", "headache", "vertex", "temple", "occiput",
    "eye", "eyes", "ear", "ears", "nose", "face", "tooth", "teeth", "mouth", "tongue", "throat",
    "chest", "heart", "lung", "lungs", "back", "spine", "knee", "knees", "calf", "foot", "feet",
    "hand", "hands", "arm", "arms", "shoulder", "leg", "legs", "skin", "urine", "stool", "menses",
    "cough", "sneeze", "vomiting", "vomit", "nausea", "flatulence", "appetite", "thirst", "sleep",
    "dream", "dreams", "pain", "fear", "fears", "anxiety", "hoarseness", "eruption", "sweat",
    "perspiration", "palpitation", "respiration", "breathing", "hunger", "craving", "desire",
    "aversion", "distension", "rumbling", "eructation", "heartburn", "constipation",
} | _FOOD_WORDS | _COMPLAINT_WORDS
# عام ربرکیں (GENERALITIES/MODALITIES/MIND) — اِن پر موضوع کی شرط نہیں لگتی
_GENERIC_CHAPTERS = {"GENERALITIES", "MODALITIES", "CONDITIONS OF AGGRAVATION AND AMELIORATION IN GENERAL",
                     "MIND", "MIND - 2", "GENERALS"}


# سرِ ربرک کے ہم معنی — مریض «gets angry» کہے اور ربرک «vexation, anger» ہو
_HEAD_SYN_GROUPS = [
    {"angry", "anger", "vexation", "rage", "furious", "wrath", "indignation"},
    {"flatus", "flatulence", "rumbling", "borborygmus", "wind"},
    {"coffee", "tea", "drinks", "drink", "wine", "beer"},
    {"heat", "warmth", "warm", "hot", "summer", "sun"},
    {"cold", "chill", "chilly", "winter", "coldness"},
    {"noise", "noises", "sound", "sounds"},
    {"consolation", "consoling", "sympathy", "comforting"},
    {"menses", "menstruation", "period", "periods"},
    {"sleep", "sleeping", "sleepless", "waking", "waked"},
    {"fear", "fears", "afraid", "anxiety", "anxious", "dread"},
    {"touch", "touched", "contact", "pressure"},
    {"eating", "food", "meal", "meals", "drinking"},
    {"motion", "movement", "walking", "exertion"},
    {"storm", "thunder", "tempest"},
]


def _lax_pref(word: str, tokens: set) -> bool:
    """پہلے 4 حروف کا اشتراک (coffee ↔ coffe، anger ↔ angry)"""
    wp = _pref(word)
    return bool(wp) and any(wp == _pref(t) for t in tokens)


def _head_present(word: str, s_tokens: set, s_text: str) -> bool:
    """سرِ ربرک کیس میں ہے؟ (لفظ، اسٹیم، یا ہم معنی کے ساتھ)"""
    if _cond_present(word, s_tokens, s_text):
        return True
    if _lax_pref(word, s_tokens):
        return True
    w = str(word).lower()
    for grp in _HEAD_SYN_GROUPS:
        if w in grp:
            for g in grp:
                if _cond_present(g, s_tokens, s_text) or _lax_pref(g, s_tokens):
                    return True
    return False


def _pref(w: str) -> str:
    """تقابل کے لیے پہلے 4 حروف (aversion/averse/averse ← aver)"""
    w = re.sub(r"[^a-z]", "", str(w).lower())
    return w[:4]


_QUERY_STOP = {"for", "and", "the", "with", "from", "last", "three", "year", "years", "especially",
               "much", "very", "some", "time", "times", "after", "before", "when", "which", "has",
               "have", "been", "gets", "get", "his", "her", "him", "she", "out", "off", "not", "was",
               "were", "that", "this", "then", "than", "them", "they", "there", "into", "upon", "onto",
               "causes", "caused", "roll", "rolling", "coming", "comes", "feeling", "feels", "seems",
               "being", "while", "still", "again", "about", "over", "under", "same", "only", "also",
               "last", "next", "very", "well", "made", "makes", "take", "takes", "took"}
_POLARITY_WORDS = {"worse", "better", "agg", "amel", "aggravat", "ameliorat", "cannot", "bear",
                    "intoleran", "averse", "sensitive", "aggravated", "ameliorated"}
_REACTION_WORDS = {"anger", "angry", "coffee", "heat", "cold", "consolation", "noise", "noises",
                   "motion", "touch", "pressure", "eating", "food", "sleep", "weather", "storm",
                   "thunder", "sun", "bath", "menses", "crowd", "light", "smell", "walking"}

# عضو → ریپرٹری کا باب (باب کے مطابق ترجیح کے لیے)
_REGION_CHAPTERS = {
    "abdomen": {"abdomen", "external_abdomen", "inguinal_and_pubic_region", "stomach"},
    "stomach": {"stomach", "abdomen", "appetite"},
    "head": {"head"}, "eye": {"eye", "vision"}, "ear": {"ear", "hearing"},
    "mouth": {"mouth", "teeth", "tongue"}, "teeth": {"teeth", "mouth"}, "face": {"face"},
    "throat": {"throat", "external_throat"}, "chest": {"chest", "respiration", "cough", "expectoration"},
    "back": {"back"}, "bladder": {"bladder", "urine", "urinary_organs"}, "rectum": {"rectum", "anus_and_rectum"},
    "skin": {"skin"}, "lower": {"extremities", "lower_extremities"}, "upper": {"extremities", "upper_extremities"},
    "menses": {"genitalia_female", "genitalia_male", "urinary_organs"},
    "sleep": {"sleep"}, "dreams": {"sleep"}, "cough": {"cough", "respiration"}, "nausea": {"nausea_and_vomiting", "stomach"},
    "vomiting": {"nausea_and_vomiting", "stomach"}, "appetite": {"appetite", "stomach"},
    "thirst": {"appetite", "stomach"}, "flatulence": {"abdomen", "rectum"}, "rumbling": {"abdomen"},
    "gall": {"abdomen"}, "gallstone": {"abdomen"}, "gallbladder": {"abdomen"},   # نسخہ 4.7
    "heartburn": {"stomach", "abdomen"}, "constipation": {"rectum", "stool", "abdomen"},
    "fear": {"mind"}, "fears": {"mind"}, "anxiety": {"mind"}, "hoarseness": {"larynx_and_trachea", "throat"},
    "vertigo": {"vertigo"}, "itching": {"skin"}, "pain": set(), "perspiration": {"perspiration"},
    "sweat": {"perspiration"}, "palpitation": {"chest", "heart"}, "breathing": {"respiration"},
    "eructation": {"stomach", "abdomen"}, "distension": {"abdomen", "external_abdomen"},
    "vision": {"vision", "eye"}, "hunger": {"appetite", "stomach"}, "craving": {"appetite", "stomach"},
    "desire": {"appetite", "stomach"}, "aversion": {"appetite", "stomach"},
}

# موضوع کے ہم معنی (مریض کے لفظ → ریپرٹری کا لفظ)
_SUBJECT_ALIASES = {
    "sick": "nausea", "sickness": "nausea", "faint": "fainting", "faintish": "fainting",
    "gas": "flatulence", "wind": "flatulence", "belch": "eructation", "belching": "eructation",
    "hoarse": "hoarseness", "sleepless": "sleep", "sleeplessness": "sleep", "dreaming": "dreams",
    "dizzy": "vertigo", "giddiness": "vertigo", "giddy": "vertigo", "itch": "itching",
    "soreness": "pain", "aching": "pain", "belly": "abdomen", "bowels": "stool",
    "menses": "menses", "period": "menses", "breath": "respiration", "windy": "flatulence",
}


def _subject_stem_hit(word: str, path_words: set) -> bool:
    wp = _pref(word)
    return any(wp == _pref(x) for x in path_words)


def _subject_guard(symptom: str, items: List[dict],
                   reject_log: Optional[List[dict]] = None) -> List[dict]:
    """⛔ رد: (6) حوالہ جاتی ربرک «(See …)» (7) الٹا درجہ/مقدار (8) ربرک کا موضوع مریض کی شکایت سے نہیں ملتا
       (9) عام شرط جو مریض نے نہ بتائی (labor، snakes، writing…)"""
    if not items:
        return items
    s_raw = str(symptom).lower()
    s_toks = _tokens_canonical(symptom)
    s_pref = {_pref(t) for t in s_toks}
    s_subject = {w for w in _SUBJECT_WORDS if w in s_raw or _pref(w) in s_pref}
    s_region = _symptom_regions(s_toks, " ".join(s_toks))
    s_region_w = {w for w in _REGION if w in s_raw or _pref(w) in s_pref}
    s_deg = bool(_DEGREE_RX.search(s_raw))
    s_deg_opp = bool(_DEGREE_OPP_RX.search(s_raw))
    out: List[dict] = []
    for it in items:
        path = str(it.get("path") or it.get("text") or "")
        text = str(it.get("text") or "")
        chap = str(it.get("chapter") or "")
        low = (path + " " + text + " " + chap).lower()
        kind, why = "", ""
        if _CROSSREF_RX.search(low):
            kind, why = "crossref", "حوالہ جاتی ربرک (See …) — اپنی ربرک نہیں"
        if not kind and s_deg and _DEGREE_OPP_RX.search(low):
            kind, why = "degree", "کیس: «کمی/بہت کم» — ربرک: «زیادہ/بڑھا ہوا»"
        if not kind and s_deg_opp and _DEGREE_RX.search(low):
            kind, why = "degree", "کیس: «زیادہ» — ربرک: «کمی»"
        if not kind:
            conds = _path_conditions(path, chap)
            head = _head_words(conds)
            strict = [w for (words, _r) in conds for w in words
                      if str(w).lower() in _FIXED_STRICT_EXTRA
                      and not _cond_present(w, s_toks, " ".join(s_toks))]
            if strict:
                kind, why = "unstated", "خاص شرط نہیں بتائی: " + "، ".join(strict[:3])
        if not kind:
            # نسخہ 4.3: علامت میں شکایت اور عضو دونوں ہیں تو ربرک میں بھی شکایت لازمی
            # (ورنہ «rumbling in abdomen» کے لیے «PENDULOUS abdomen» رکھ لی جاتی ہے)
            s_comp = {w for w in _COMPLAINT_WORDS if w in s_raw or _pref(w) in s_pref}
            if s_comp and not (s_comp & (s_subject - s_region_w)) if False else False:
                pass
            if s_comp:
                pw = {str(w).lower() for w in re.findall(r"[a-z-]{3,}", low)}
                pw |= {_pref(w) for w in pw}
                comp_hit = any(_subject_stem_hit(w, pw) for w in s_comp)
                if not comp_hit:
                    kind, why = ("other_subject",
                                 "ربرک میں مریض کی شکایت («" + "، ".join(sorted(s_comp)[:3])
                                 + "») موجود نہیں")
        if not kind:
            # نسخہ 4.3: «لازم الموضوع» — چیز/شکایت (fats، salt، rumbling…) ربرک میں لازمی ہو
            required = {w for w in (s_subject & (_FOOD_WORDS | _COMPLAINT_WORDS))}
            if required:
                pw = {str(w).lower() for w in re.findall(r"[a-z-]{3,}", low)}
                pw |= {_pref(w) for w in pw}
                if not any(_subject_stem_hit(w, pw) for w in required):
                    kind, why = ("other_subject",
                                 "ربرک میں مریض کی چیز/شکایت («" + "، ".join(sorted(required)[:3])
                                 + "») موجود نہیں")
        if not kind and s_subject - _FOOD_WORDS - _COMPLAINT_WORDS:
            # مریض کا موضوع ربرک میں ہے ہی نہیں → غلط ربرک
            pw = {str(w).lower() for w in re.findall(r"[a-z-]{3,}", low)}
            pw |= {_pref(w) for w in pw}
            _subj_only = s_subject - _FOOD_WORDS - _COMPLAINT_WORDS
            subj_hit = any(_subject_stem_hit(w, pw) for w in _subj_only)
            subj_hit = subj_hit or any(any(_head_present(w, s_toks, " ".join(s_toks)) for w in g)
                                       for g in _HEAD_SYN_GROUPS if g & s_subject)
            alias_hit = any(_subject_stem_hit(_SUBJECT_ALIASES[w], pw) for w in s_subject
                            if w in _SUBJECT_ALIASES)
            region_hit = bool(s_region) and any(_subject_stem_hit(w, pw) for w in s_region)
            if not (subj_hit or alias_hit or region_hit):
                kind, why = ("other_subject",
                             "ربرک میں مریض کی شکایت («" + "، ".join(sorted(s_subject)[:3])
                             + "») یا عضو موجود نہیں")
        if not kind and chap.upper() not in _GENERIC_CHAPTERS:
            # (8) ربرک کا موضوع/عضو مریض کی شکایت سے نہیں ملتا
            conds = _path_conditions(path, chap)
            head_pref = {_pref(w) for (words, _r) in conds[:1] for w in words}
            head_subj = {w for w in _SUBJECT_WORDS if _pref(w) in head_pref}
            if head_subj and s_subject and not (head_subj & s_subject):
                # نسخہ 4.8: سرِ ربرک عام شکایت ہو تو اگلی شرط ہی مخصوص شکایت ہے
                # («PAIN, headache in general, sun…» ← مریض: «headache from sun»)
                # اگلی شرط میں مریض کا موضوع مل جائے تو رد نہیں ہوگی
                _next_pref = {_pref(w) for (words, _r) in conds[1:2] for w in words}
                _next_hit = any(_pref(w) in _next_pref for w in s_subject)
                reg = {_REGION.get(w) for w in head_subj if _REGION.get(w)}
                if not _next_hit and not (reg and reg & s_region):
                    kind, why = ("other_subject",
                                 "ربرک کا موضوع: " + "، ".join(sorted(head_subj)[:3])
                                 + " — مریض کی شکایت: " + "، ".join(sorted(s_subject)[:3]))
        if not kind:
            out.append(it)
        elif reject_log is not None:
            reject_log.append({"rubric": text, "path": path, "kind": kind, "why": why, "missing": []})
    return out


_GENERIC_SUPPORT = {"attack", "attacks", "fit", "fits", "paroxysm", "paroxysms", "spell", "spells",
                    "interval", "intervals", "day", "days", "time", "times", "period", "periods",
                    "frequent", "frequently", "sometimes", "often", "always", "generally"}

_STEM_ROLE_CACHE: Dict[str, str] = {}


def _build_stem_roles() -> Dict[str, str]:
    """صرفی شکل سے کردار — مثلاً «anxious» ← «anxiety»، «restless» ← «restlessness»"""
    m: Dict[str, str] = {}
    for voc, role in ((_RG_LOC, "loc"), (_RG_SENS, "sens"), (_RG_MOD, "mod"),
                      (_RG_TIME, "time"), (_RG_COMP, "complaint"), (_RG_MENTAL, "complaint")):
        for k in voc:
            if " " in str(k):
                continue
            st = _stem(str(k))
            if len(st) >= 4:
                m.setdefault(st, role)
    for k in _EXTRA_COMPLAINT:
        st = _stem(k)
        if len(st) >= 4:
            m.setdefault(st, "complaint")
    return m


def _cond_role(word: str) -> str:
    w = str(word).lower()
    if w in _RG_COMP or w in _RG_MENTAL or w in _EXTRA_COMPLAINT:
        return "complaint"
    if w in _RG_LOC:
        return "loc"
    if w in _RG_SENS:
        return "sens"
    if w in _RG_MOD:
        return "mod"
    if w in _RG_TIME:
        return "time"
    if not _STEM_ROLE_CACHE:
        _STEM_ROLE_CACHE.update(_build_stem_roles())
    return _STEM_ROLE_CACHE.get(_stem(w), "")


def _chapter_tokens(chapter: str) -> set:
    return {t for t in re.split(r"[^a-z]+", str(chapter or "").lower()) if len(t) > 2}


def _path_conditions(path: str, chapter: str = "") -> List[Tuple[List[str], str]]:
    """ربرک کے راستے کو شرائط میں توڑیں — ہر کاما = ایک شرط (کاما کا قانون)
    → [(شرط کے الفاظ, کردار), ...]؛ باب کا نام اور حرف نکال دیے جاتے ہیں"""
    pieces = [p.strip() for p in re.split(r"\s+-\s+|,\s*", str(path)) if p.strip()]
    cht = _chapter_tokens(chapter)
    head_dropped = False
    out: List[Tuple[List[str], str]] = []
    for piece in pieces:
        toks = [t for t in re.split(r"[^A-Za-z\u00e6\u0153\u00df'-]+", piece) if t]
        toks = [t for t in toks if t.lower() not in _COND_SKIP]
        if not toks:
            continue
        if all(t.lower() in _BRANCH for t in toks):
            continue                          # یہ شاخ کا نام ہے (Modalities/Ameliorations…)، شرط نہیں
        if not head_dropped:
            head_dropped = True
            if cht and all(t.lower() in cht for t in toks):
                continue                      # یہ باب کا نام ہے، شرط نہیں
        words: List[str] = []
        roles = []
        for t in toks:
            r = _cond_role(t)
            if r:
                roles.append(r)
            words.append(t)
        low = piece.lower()
        for key, r in ((k, v) for k, v in _MULTI_COND.items() if v in ("loc", "sens", "mod")):
            if key in low and key not in words:
                words.append(key)
                roles.append(r)
        role = roles[0] if roles else "other"
        out.append((words, role))
    return out


def _cond_present(word: str, s_tokens: List[str], s_text: str) -> bool:
    w = str(word).lower()
    if " " in w:
        return w in s_text
    c = _canonical(w)
    if not c:
        return True
    for t in s_tokens:
        if t == c or _stem(t) == _stem(c):
            return True
    return False


_REGION_STEM: Dict[str, str] = {}


def _symptom_regions(s_tokens: List[str], s_text: str) -> set:
    """مریض کے بیان میں جن عضووں کا ذکر ہوا، اُن کے حصے"""
    if not _REGION_STEM:
        for k, v in _REGION.items():
            if " " not in k:
                _REGION_STEM.setdefault(_stem(k), v)
    regs = set()
    for t in s_tokens:
        r = _REGION.get(t) or _REGION_STEM.get(t) or _REGION_STEM.get(_stem(t))
        if r:
            regs.add(r)
    for key, r in _REGION.items():
        if " " in key and key in s_text:
            regs.add(r)
    return regs


def _head_words(conds: List[Tuple[List[str], str]]) -> List[str]:
    """ربرک کا سرِ جملہ — پہلی شرط، اور اُس کے ساتھ لگے ہم کردار ٹکڑے
    (مثلاً «MOANING, groaning» ایک ہی شکایت ہے، مگر «PAIN - Knees» نہیں)"""
    if not conds:
        return []
    head = list(conds[0][0])
    for words, role in conds[1:]:
        if role != conds[0][1]:
            break
        head.extend(words)
    return head


def _apply_compat(symptom: str, items: List[dict],
                  reject_log: Optional[List[dict]] = None) -> List[dict]:
    """جزو بمقابلہ جزو جانچ — ربرک ایک مکمل جملہ ہے، ہر کاما ایک شرط:
       ⛔ رد: (1) سرِ جملہ (بنیادی شکایت) کیس میں موجود نہیں
              (2) خاص کیفیت/شرط جو مریض نے نہ بتائی (stitching، talking، intervals، hydropericardium …)
              (3) دوسرے حصے کا عضو (axillae ← مریض نے occiput/spine کہا)
              (4) الٹا رخ (Amelioration جبکہ کیس میں «بڑھتا ہے»)
              (5) الٹی سمت (left بمقابلہ right)
       ✅ رکھی: باقی — مریض کے الفاظ سے ربرک نکالنے کا فیصلہ معالج کا"""
    if not items:
        return items
    s_tokens = _tokens_canonical(symptom)
    s_text = " ".join(s_tokens)
    s_raw = str(symptom).lower()
    s_side = {w for w in ("left", "right") if w in s_raw}
    s_regions = _symptom_regions(s_tokens, s_text)
    s_agg = bool(_AGG_RX.search(s_raw))
    s_amel = bool(_AMEL_RX.search(s_raw))
    out: List[dict] = []
    for it in items:
        path = it.get("path") or it.get("text") or ""
        chap = it.get("chapter") or ""
        conds = _path_conditions(path, chap)
        low = (str(path) + " " + str(it.get("text", "")) + " " + str(chap)).lower()
        head = _head_words(conds)
        # (0) سہارا: سرِ جملہ کے علاوہ ربرک کی باقی شرائط میں سے کتنے الفاظ کیس میں موجود ہیں
        support = [w for (words, _r) in conds[1:] for w in words
                   if _cond_role(w) in ("complaint", "loc", "sens")
                   and str(w).lower() not in _GENERIC_SUPPORT]
        support_n = sum(1 for w in support if _cond_present(w, s_tokens, s_text))
        head_ok = bool(head) and any(_head_present(w, s_tokens, s_text) for w in head)
        # نسخہ 4.7: سرِ ربرک کا عضو مریض کے عضو-علاقے میں ہو تو سرِ غائب معاف
        # («gall stone» → «Liver, colic, gall-stones» — سر liver ہے مگر علاقہ abdomen ہی ہے)
        if not head_ok and head:
            head_reg = {_REGION.get(str(w).lower()) for w in head if _REGION.get(str(w).lower())}
            if head_reg and s_regions and (head_reg & s_regions):
                head_ok = True
        # نسخہ 4.8: سرِ عام شکایت (PAIN) کے بعد اگلی شرط ہی مخصوص احساس/شکایت ہو
        # («PAIN, burning» (stomach باب) ← مریض: «burning in stomach») — وہ مل جائے تو معاف
        # (باقی پہرے — خاص شرط، دوسرا عضو — آگے بھی لگتے رہتے ہیں)
        if not head_ok and head and len(conds) > 1:
            _nxt = [w for w in conds[1][0] if _cond_role(w) in ("complaint", "sens", "loc")]
            if _nxt and any(_cond_present(w, s_tokens, s_text) for w in _nxt):
                head_ok = True
        # سرِ ربرک «کمزور» ہو (pendulous جیسی صفت) تو تائید کے لیے عضو/موضوع کی جانچ آگے ہوتی ہے
        # (1) سرِ جملہ غائب اور سہارا بھی کمزور → رد
        kind, why = "", ""
        if not head_ok and support_n < 2 and not it.get("derived"):
            kind = "head"
            why = ("سرِ ربرک «" + "، ".join(head[:3]) + "» کیس میں موجود نہیں"
                   if head else "ربرک کی بنیادی شرائط کیس میں نہیں")
        # (2) خاص کیفیت/شرط — جو شرط کیس میں موجود نہیں اور اُس میں خاص لفظ ہے
        if not kind:
            strict = []
            for words, _r in conds:
                for w in words:
                    if str(w).lower() in _STRICT_EXTRA and not _cond_present(w, s_tokens, s_text):
                        strict.append(w)
            if strict:
                kind, why = "unstated", "شرط نہیں بتائی: " + "، ".join(strict[:3])
        # (3) دوسرے حصے کا عضو
        if not kind:
            for words, _r in conds:
                for w in words:
                    reg = _REGION.get(str(w).lower())
                    if reg and s_regions and reg not in s_regions:
                        kind = "other_region"
                        why = f"{w} ({reg}) ← مریض کے حصے: " + "، ".join(sorted(s_regions))
                        break
                if kind:
                    break
        # (4) الٹا رخ
        if not kind:
            rpol = "amel" if re.search(r"ameliorat|\bamel\b", low) else (
                "agg" if re.search(r"\bagg\b|aggravat", low) else "")
            if rpol == "amel" and s_agg and not s_amel:
                kind, why = "polarity", "ربرک: کم ہوتا ہے — کیس: بڑھتا ہے"
            elif rpol == "agg" and s_amel and not s_agg:
                kind, why = "polarity", "ربرک: بڑھتا ہے — کیس: کم/بہتر ہوتا ہے"
        # (5) الٹی سمت
        if not kind and s_side:
            r_side = {w for w in ("left", "right") if re.search(r"\b" + w, low)}
            if r_side and not (r_side & s_side):
                kind = "side"
                why = "ربرک: " + "، ".join(sorted(r_side)) + " ← کیس: " + "، ".join(sorted(s_side))
        if not kind:
            out.append(it)
        elif reject_log is not None:
            reject_log.append({
                "rubric": it.get("text", ""), "path": path, "kind": kind, "why": why,
                "missing": [{"piece": " ".join(words)} for (words, _r) in conds][:6],
            })
    # نسخہ 4.2: موضوع/حوالہ/درجے کی جانچ
    return _subject_guard(symptom, out, reject_log)


def pick_modality_rubric(obj: str, pol: str, index: Optional[RubricIndex] = None,
                         case_region: str = "", top_k: int = 2,
                         reject_log: Optional[List[dict]] = None) -> List[dict]:
    """«< anger» / «> coffee» جیسی موڈیلٹی کی اپنی ربرک — سبب کا لفظ ربرک میں لازمی،
       پھر کیس کے باب والی ربرک کو ترجیح، اور جتنے کم اضافی شرائط ہوں اُتنی بہتر"""
    index = index or get_index()
    obj = str(obj or "").strip().lower()
    if not obj:
        return []
    pol_word = "amel" if pol == "amel" else "agg"
    cands: List[dict] = []
    seen: set = set()
    # (الف) اُن تمام ربرکوں کی فہرست جو اِس سبب کا لفظ رکھتی ہیں (index کی اندرونی فہرست سے)
    rids: List[str] = []
    for word in dict.fromkeys([obj] + obj.split()):
        tok = _canonical(word)
        for g in (tok, _stem(tok), word):
            rids.extend(index._index.get(g, []) or [])
    if not rids:
        for q in (f"{pol_word} {obj}", obj):
            for c in index.search(q, top_k=10, strict=False):
                rids.append(c["rubric_id"])
    for q in (obj, f"amel {obj}", f"agg {obj}"):
        for c in index.search(q, top_k=12, strict=False):
            rids.append(c["rubric_id"])
    for rid in list(dict.fromkeys(rids))[:1500]:
        rb = index.rubrics.get(rid)
        if not rb:
            continue
        if rid in seen:
            continue
        seen.add(rid)
        cands.append({"rubric_id": rid, "chapter": rb["chapter"], "text": rb["t"],
                      "path": rb.get("path", ""), "score": 100.0 - len(rb["t"]) / 8.0,
                      "coverage": 0.8})
    ok: List[tuple] = []
    for c in cands:
        txt = str(c.get("text", "")).lower()
        toks_obj = [w for w in re.findall(r"[a-z-]{3,}", obj)]
        pw_all = {_pref(w) for w in re.findall(r"[a-z-]{3,}", txt)} | set(re.findall(r"[a-z-]{3,}", txt))
        if not all(_subject_stem_hit(w, pw_all) for w in toks_obj):
            continue
        # رُخ ملنا لازمی: «> coffee» کے لیے بگاڑ والی ربرک نہ اُٹھائی جائے (اور اُلٹا)
        has_amel = bool(re.search(r"amel|amelior|\bbetter\b", txt))
        has_agg = bool(re.search(r"\bagg\b|aggravat|\bworse\b", txt))
        if pol == "amel" and has_agg and not has_amel:
            continue
        if pol != "amel" and has_amel and not has_agg:
            continue
        chap = str(c.get("chapter", "")).lower()
        if case_region and chap == case_region:
            chap_rank = 0                      # بالکل وہی باب (سب سے بہتر)
        elif case_region and chap_rank_of(chap, case_region):
            chap_rank = 1                      # اُسی عضو کا قریبی باب
        elif chap in {"generalities", "modalities", "mind",
                      "conditions_of_aggravation_and_amelioration_in_general"}:
            chap_rank = 2                      # عام/موڈیلٹی/دماغی باب
        else:
            chap_rank = 3
        conds = _path_conditions(str(c.get("path") or c.get("text") or ""), chap)
        extra = 0
        for words, _r in conds:
            for w in words:
                wl = str(w).lower()
                if wl in _STRICT_EXTRA and wl != obj:
                    extra += 1
        # سرِ ربرک شکایت ہو (pain، cough…) — تو اُسے ترجیح
        try:
            head = _head_words(conds)
        except Exception:
            head = []
        head_ok = 0 if any(str(h).lower() in _COMPLAINT_WORDS or _subject_stem_hit(str(h), {obj}) for h in head) else 1
        ok.append((chap_rank, head_ok, extra, -float(c.get("score", 0) or 0), c))
    if not ok:
        return []
    ok.sort(key=lambda t: (t[0], t[1], t[2], t[3]))
    out = []
    for _r, _h, _e, _s, c in ok[:max(int(top_k), 1)]:
        out.append({"rubric_id": c["rubric_id"], "chapter": c.get("chapter", ""),
                    "text": c.get("text", ""), "path": c.get("path", ""),
                    "score": c.get("score"), "confidence": round(min(float(c.get("coverage", 0.6) or 0.6), 1.0), 2),
                    "derived": True, "modality": obj})
    return out


def chap_rank_of(chap: str, region: str) -> bool:
    """کیا یہ باب اِس عضو کا ہے؟"""
    ch = str(chap or "").lower()
    if not region:
        return False
    if ch == region or ch.replace("_", " ").split()[0] == region:
        return True
    for w, chs in _REGION_CHAPTERS.items():
        if region in w or w in region:
            if ch in chs:
                return True
    return False


# وقت/دن کے وہ الفاظ جو بچاؤ کے مرحلے میں «شرط» گنے جائیں (تاکہ «RUMBLING, daytime» مین ربرک پر ترجیح پائے)
_TIME_COND_WORDS = {"daytime", "forenoon", "night", "midnight", "noon", "afternoon", "evening",
                    "morning", "sunrise", "sunset", "midday", "daylight"}

_RECOVER_GENERIC_CH = {"generalities", "modalities", "mind", "sleep", "appetite", "skin",
                       "conditions_of_aggravation_and_amelioration_in_general",
                       "sensations_and_complaints_in_general"}


# نسخہ 4.6 — موضوع + حالت کے جوڑے («appetite poor» وغیرہ)
_APPE_VERDICT_RX = re.compile(
    r"\bappetite\b[^.۔]{0,30}?\b(poor|weak|lost|no|absent|defective|diminish\w*|fail\w*|bad|want\w*)\b"
    r"|\b(no|poor|weak|lost|absent|diminish\w*|defective|fail\w*|bad)\b[^.۔]{0,20}?\bappetite\b",
    re.I)
_APPE_SYN = ("want of", "without", "defective", "lost", "diminished", "wanting", "absent", "weak", "poor")
# «appetite good/fair» — یہ کوئی علامت ہی نہیں (معمول کی بات)، سو ربرک نہیں بننی چاہیے
_APPE_NORMAL_RX = re.compile(
    r"\bappetite\b[^.۔]{0,20}?\b(good|fair|normal|regular)\b"
    r"|\b(good|fair|normal)\b[^.۔]{0,12}?\bappetite\b", re.I)


def _subject_value_candidates(symptom: str, index: "RubricIndex", top_k: int = 3) -> List[dict]:
    """
    «appetite poor» جیسی علامت کے لیے اُس ریپرٹری کی اپنی ربرک ڈھونڈیں جس میں
    موضوع (appetite) اور حالت (defective/lost/want of) دونوں موجود ہوں۔

    مسئلہ جو حل ہوا: پہلے یہ علامت کینٹ کی «appetite, apyrexia, during» لے آتی تھی
    (صرف «appetite» لفظ ملا تو ربرک وہی چن لی گئی) — حالانکہ مریض کی بات «بھوک نہ لگنا» ہے۔
    """
    s = str(symptom).lower()
    out: List[dict] = []
    seen: set = set()
    if not _APPE_VERDICT_RX.search(s):
        return out
    for c in index.search("appetite lost want of defective", top_k=30, strict=False):
        if str(c.get("chapter", "")).lower() not in ("appetite", "stomach"):
            continue
        t = str(c.get("text", "")).lower()
        head = t.replace(" - ", ",").split(",")[0].strip()
        if not head.startswith("appetite"):
            continue
        if not any(w in t for w in _APPE_SYN):
            continue
        if c["rubric_id"] in seen:
            continue
        seen.add(c["rubric_id"])
        out.append(c)
        if len(out) >= top_k:
            break
    return out


def _appetite_filter(items: List[dict], symptom: str) -> List[dict]:
    """
    نسخہ 4.6 — بھوک کی حالت والی علامت کا حتمی پہرا
    ----------------------------------------------
    «appetite poor / no appetite / appetite lost» جیسی علامت میں ریپرٹری کی وہ ربرک
    قبول نہیں کی جاتی جس میں بھوک کی حالت کا کوئی لفظ («want of»، «lost»، «without»،
    «defective») موجود نہ ہو۔ پہلے یہاں «appetite, apyrexia, during» (بخار کے دوران بھوک)
    آ جاتی تھی — جو مریض کی بات ہی نہیں تھی۔
    """
    if not items:
        return items
    s_low = str(symptom).lower()
    normal = bool(_APPE_NORMAL_RX.search(s_low))
    if not normal and not _APPE_VERDICT_RX.search(s_low):
        return items
    out = []
    for c in items:
        t = str(c.get("text", "")).lower()
        head = t.replace(" - ", ",").split(",")[0].strip()
        if head.startswith("appetite") or head.startswith("hunger"):
            if normal:
                continue          # بھوک معمول کی ہے → ربرک کا سوال ہی نہیں
            if not any(w in t for w in _APPE_SYN):
                continue          # ریپرٹری کی اپنی حالت کا لفظ موجود نہیں → رد
        out.append(c)
    return out


def _drop_far_chapters(items: List[dict], case_region: str) -> List[dict]:
    """
    نسخہ 4.6 — دور کا باب صاف کریں
    ---------------------------------
    جب کیس کا نمایاں عضو معلوم ہو (case_region) اور اُس کے باب موجود ہوں، تو
    ایسی ربرکیں نکال دی جائیں جو واضح طور پر کسی دوسرے عضو کی ہیں — مثلاً
    «much rumbling in abdomen» کے لیے کینٹ کی «rumbling» (کان)۔

    شرطِ حفاظت: اگر صرف ایک بھی ربرک اصل عضو کے باب کی مل جائے تو تب ہی
    ہٹاؤ ہوتا ہے — ورنہ (جب عضو کا کوئی باب نہ ملا) فہرست جوں کی توں رہتی ہے۔
    عام ابواب (generalities، mind، appetite وغیرہ) کبھی نہیں ہٹتے۔
    """
    reg = str(case_region or "").strip().lower()
    if not reg or not items:
        return items
    home = set(_REGION_CHAPTERS.get(reg, []) or [])
    if not home:
        return items
    if not any(str(c.get("chapter", "")).lower() in home for c in items):
        return items                      # اصل عضو کا کوئی باب نہیں → کچھ نہ چھیڑیں
    keep = []
    for c in items:
        ch = str(c.get("chapter", "")).lower()
        if ch in home or ch in _RECOVER_GENERIC_CH:
            keep.append(c)
    return keep or items


def _recover_rubrics(symptom: str, index: "RubricIndex", top_k: int = 3,
                     reject_log: Optional[List[dict]] = None, case_region: str = "") -> List[dict]:
    """نسخہ 4.5: جب عام راستے سے کوئی ربرک نہ بچے تو —
       (الف) سب سے پہلے **سادہ مین ربرک** ڈھونڈیں («much rumbling in abdomen» → «RUMBLING»)
            یعنی وہی لفظ، جس کے ساتھ کوئی اضافی شرط نہ ہو۔
       (ب) اگر وہ نہ ملے تو مریض کے اصل الفاظ سے سادہ تلاش۔
       اُصول (ٹائلر-ویر): جب مریض نے کوئی موڈیلٹی نہیں بتائی تو مین ربرک لینی ہے،
       اور جب موڈیلٹی بتائی ہو («in the morning») تو اُس کے حساب سے سب ربرک۔"""
    words = [w for w in re.findall(r"[a-zA-Z-]{4,}", str(symptom).lower()) if w not in _QUERY_STOP]
    s_toks = set(_tokens_canonical(symptom))
    s_text = " ".join(s_toks)
    plain: List[tuple] = []
    seen: set = set()
    for w in words[:4]:
        for c in index.search(w, top_k=10, strict=False):
            toks = re.findall(r"[a-z-]{3,}", str(c.get("text", "")).lower())
            # لفظ ربرک میں کہیں بھی ہو (جیسے «Flatulency - Gurgling, rumbling, borborygmus»)
            if not toks or not any(t.startswith(w[:4]) for t in toks):
                continue
            if c["rubric_id"] in seen:
                continue
            seen.add(c["rubric_id"])
            path = str(c.get("path") or c.get("text") or "")
            chap = str(c.get("chapter", ""))
            conds = _path_conditions(path, chap)
            # شرطیں: جو مریض نے بتائیں (matched) اور جو نہیں بتائیں (unstated)
            matched = unstated = 0
            for ws, _r in conds[1:]:
                for x in ws:
                    if str(x).lower() in _STRICT_EXTRA or str(x).lower() in _TIME_COND_WORDS:
                        if _cond_present(x, s_toks, s_text):
                            matched += 1
                        else:
                            unstated += 1
            # باب کی ترجیح: پہلے کیس کے عضو کا باب، پھر قریبی، پھر عام/دماغی، پھر باقی
            cl = chap.lower()
            if case_region and cl == case_region:
                cr = 0
            elif case_region and chap_rank_of(cl, case_region):
                cr = 1
            elif cl in _RECOVER_GENERIC_CH:
                cr = 2
            else:
                cr = 3
            plain.append((cr, unstated, -matched, len(toks), -float(c.get("score", 0) or 0), c))
    plain.sort(key=lambda t: (t[0], t[1], t[2], t[3], t[4]))
    # جب کیس کا عضو معلوم ہو تو غیرمتعلق باب والی ربرکیں (جیسے کان کی «rumbling») نکال دیں
    if case_region:
        keep_first = [c for r, _u, _m, _n, _s, c in plain if r <= 2]
        if keep_first:
            plain = [t for t in plain if t[0] <= 2]
    cands = [c for _r, _u, _m, _n, _s, c in plain]
    if not cands:
        # (ب) عام الفاظ سے تلاش
        for q in ([words[0]] if words else []) + [" ".join(words[:2])]:
            if not q.strip():
                continue
            for c in index.search(q, top_k=6, strict=False):
                if c["rubric_id"] in seen:
                    continue
                seen.add(c["rubric_id"])
                cands.append(c)
    out: List[dict] = []
    for c in cands[:12]:
        c2 = dict(c)
        c2["derived"] = True
        c2["recovered"] = True
        # نسخہ 4.6: بچاؤ والی ربرک فہرست میں دکھے گی مگر کیس کے اسکور پر آدھا اثر ڈالے گی۔
        # وجہ: بغیر اس کمی کے، ہر وہ علامت جس سے پہلے کوئی ربرک نہ نکلتی تھی، اب ایک
        # نئی ربرک لاتی ہے — جس سے مجموعی درجہ بندی بگڑ جاتی تھی (نمونہ کیس IV کی دوا
        # درجہ 4 سے 7 پر چلی گئی تھی)۔ آدھے وزن سے نہ کوئی علامت خالی رہتی ہے، نہ ترتیب بگڑتی ہے۔
        c2["confidence"] = round(min(float(c.get("coverage", 0.5) or 0.5), 0.5), 2)
        out.append(c2)
    if not out:
        return []
    out = _drop_pure_crossrefs(out, index, reject_log)   # نسخہ 4.7
    kept = _apply_compat(symptom, out, reject_log)
    return kept[:max(int(top_k), 1)]


# ------------------------------------------------------------------ #
# نسخہ 4.8: فقرے کا تصور-ترجمہ — مریض کا فقرہ → ریپرٹری کی اپنی زبان
# ------------------------------------------------------------------ #
# «لفظ بلفظ» پالیسی لفظ کے مترادف روکتی ہے (sadness ≠ grief) — مگر جب مریض کا
# پورا فقرہ ریپرٹری میں «ایک ہی لفظ» کی صورت موجود ہو تو وہ مترادف سازی نہیں،
# ریپرٹری کی زبان میں اُس فقرے کا ترجمہ ہے:
#   • «cannot sleep» = نیند + نفی = «SLEEPLESSNESS» (کینٹ کا اپنا سرِعنوان)
#   • «wants to be alone» = «COMPANY, aversion to» (کینٹ خود «FEAR, alone,
#     of being (See Company)» لکھتا ہے — یعنی ریپرٹری خود اکلا کو صحبت سے
#     جوڑتی ہے)
#   • «insomnia» لفظ ریپرٹری میں ہے ہی نہیں — ریپرٹری اِسی تصور کو
#     «SLEEPLESSNESS» کہتی ہے
# یہ صرف نیچے فہرست شدہ تھوڑے فقروں پر لاگو ہوتا ہے — باقی الفاظ مریض کے ہی رہتے ہیں۔
_CONCEPT_PHRASES: List[Tuple["re.Pattern", str]] = [
    # نیند کی نفی → sleeplessness
    (re.compile(r"\b(?:can\s?not|can't|cant|unable\s+to)\s+(?:fall\s+)?(?:back\s+)?"
                r"(?:to\s+)?(?:be\s+)?a?slee\w*\b", re.I), "sleeplessness"),
    (re.compile(r"\binsomnia\b", re.I), "sleeplessness"),
    (re.compile(r"\bneend\s+(?:nahin|nahi|nhi|na)\b[^.۔,;]{0,15}", re.I), "sleeplessness"),
    (re.compile(r"\b(?:nahin|nahi|nhi)\s+aati\s+neend\b", re.I), "sleeplessness"),
    # اکلا → صحبت سے بیزاری (کینٹ کا اپنا حوالہ: alone (See Company))
    (re.compile(r"\bwant\w*\s+to\s+(?:be|stay|remain|sit|live)\s+alone\b", re.I),
     "aversion to company"),
    (re.compile(r"\b(?:prefers?|preferring|desires?|desiring|likes?|liking)"
                r"\s+(?:to\s+be\s+|being\s+)?alone\b", re.I), "aversion to company"),
    (re.compile(r"\bwants?\s+(?:solitude|to\s+be\s+left\s+alone)\b", re.I),
     "aversion to company"),
    (re.compile(r"\bakel[aei]\w*\s+(?:rehn|reht|rah|rahn)\w*"
                r"(?:\s+chaht\w*)?(?:\s+(?:hai|hain|thi|tha)\b)?", re.I),
     "aversion to company"),
    (re.compile(r"\bakel[aei]\w*\s+chaht\w*\s+(?:akel[aei]\w*\s+)?"
                r"(?:rehn|reht|rah|rahn)\w*(?:\s+(?:hai|hain|thi|tha)\b)?", re.I),
     "aversion to company"),
    (re.compile(r"\bakelapan\s+chaht\w*(?:\s+(?:hai|hain|thi|tha)\b)?", re.I),
     "aversion to company"),
]


def _concept_rewrite(symptom: str) -> str:
    """فقرے کا تصور-ترجمہ — صرف فہرست شدہ فقروں پر (ورنہ متن جوں کا توں)"""
    s = str(symptom or "")
    for rx, rep in _CONCEPT_PHRASES:
        s = rx.sub(rep, s)
    return s


def map_symptom_deep(symptom: str, index: Optional[RubricIndex] = None,
                     top_k: int = 5, use_llm: bool = True,
                     reject_log: Optional[List[dict]] = None,
                     search_text: Optional[str] = None,
                     modality_obj: str = "",
                     modality_pol: str = "",
                     case_region: str = "") -> List[dict]:
    """
    گہری علامت→ربرک میپنگ (نسخہ 2.1):
      1) مقامی مماثلت
      2) اردو رسم الخط → ایل ایل ایم ترجمہ کر کے دوبارہ تلاش
      3) جرمن کینٹ پر لاطینی علامت → جرمن کلیدی الفاظ میں ترجمہ
      4) کم اعتماد میچ پر ایل ایل ایم سے متبادل فارمولے (کوئری پھیلاؤ)
      5) ایل ایل ایم کا حتمی انتخاب — اعتماد اور وجہ کے ساتھ (یا مقامی فال بیک)
    """
    index = index or get_index()
    # نسخہ 4.8: پہلے فقرے کا تصور-ترجمہ (cannot sleep → sleeplessness،
    # wants to be alone → aversion to company) — پھر سب گارڈز اسی دیکھیں گے
    _src = str(search_text or symptom)
    _rw = _concept_rewrite(_src)
    if _rw != _src:
        search_text = _rw
        symptom = _rw
    # نسخہ 4.6: اگر کال کرنے والے نے کیس کا عضو نہ بتایا ہو تو علامت کے اپنے الفاظ سے
    # پہچان لیں — ایپ کے اُن راستوں کے لیے ضروری ہے جو member/region نہیں بھیجتے
    # (ورنہ «much rumbling in abdomen» میں کینٹ کی «rumbling» (کان کا باب) اوّل آ جاتی تھی)
    if not case_region:
        try:
            _freq: Dict[str, int] = {}
            for _w in re.findall(r"[a-z-]{3,}", str(symptom).lower()):
                _r = _REGION.get(_w) or _REGION.get(_w.rstrip("s"))
                if _r and _r not in ("upper", "lower"):
                    _freq[_r] = _freq.get(_r, 0) + 1
            if _freq:
                case_region = max(_freq.items(), key=lambda kv: kv[1])[0]
        except Exception:
            pass
    # نسخہ 4.3: محض موڈیلٹی کی علامت → مخصوص راستہ (سبب کی اپنی ربرک)
    if modality_obj:
        got = pick_modality_rubric(modality_obj, modality_pol or "agg", index=index,
                                   case_region=case_region or "", top_k=max(int(top_k), 1),
                                   reject_log=reject_log)
        if got:
            return _appetite_filter(got, symptom)
    # نسخہ 4.3: «search_text» — جب علامت محض موڈیلٹی ہو («worse if he gets angry»)،
    # تو تلاش کے لیے کیس کا عضو بھی ساتھ دیا جاتا ہے (ورنہ غلط باب کی ربرک آ جاتی ہے)
    query = str(search_text or symptom)
    if query != symptom:
        symptom = query
    local = index.search(symptom, top_k=12)
    local0 = list(local)          # نسخہ 4.2: اصل امیدوار محفوظ — کوئی مرحلہ اِنہیں کھو نہ دے

    # (نسخہ 2.4) مقامی بچاؤ — جب لفظی مماثلت سے کچھ نہ ملے، یا لمبی علامت بکھر جائے
    toks = _tokens_canonical(symptom)
    best_cov = max((c.get("coverage", 0) or 0) for c in local) if local else 0.0
    best_score = max((c.get("score", 0) or 0) for c in local) if local else 0.0
    # متبادل الفاظ اُس وقت بھی آزمائیں جب مقامی میچ کمزور ہو (مثلاً "heart attacks" → "heart spasm")
    def _tag_derived(base_ids, items):
        """جو ربرکیں انجن کی اپنی کوشش (ایلئس/ٹکڑا/ترجمہ) سے آئیں — اُن پر نشان لگائیں"""
        for c in items:
            if c.get("rubric_id") not in base_ids:
                c["derived"] = True
        return items

    if not local or best_score < 40 or best_cov < 0.45:
        for v in _alias_variants(symptom):
            base_ids = {c["rubric_id"] for c in local}
            local = _tag_derived(base_ids, _merge_candidates(local, index.search(v, top_k=3)))
    if len(toks) >= 5 and best_cov < 0.55:          # لمبی علامت → ٹکڑے الگ الگ
        # نسخہ 4.2: ہر ٹکڑے سے اُس کی اپنی ربرک — ورنہ لمبی علامت کا ایک ہی پہلو سب پر چھا جاتا ہے
        # (کینٹ نے بھی «< 6 a.m.»، «< anger»، «> coffee» الگ الگ ربرکیں گنی تھیں)
        part_groups: List[dict] = []
        for part in _sub_symptoms(symptom):
            if len(_tokens_canonical(part)) >= 1:
                phits = [c for c in index.search(part, top_k=3)
                         if not _apply_compat(part, [c], None) == []]
                if phits:
                    part_groups.append({"part": part, "hits": phits[:2]})
        have = {c["rubric_id"] for c in local}
        extra: List[dict] = []
        for g in part_groups:
            for c in g["hits"]:
                if c["rubric_id"] in have:
                    continue
                have.add(c["rubric_id"])
                c2 = dict(c)
                c2["derived"] = True
                c2["part"] = g["part"]
                extra.append(c2)
        if extra:
            local = _merge_candidates(local, extra)
        local = local[:12]

    # نسخہ 4.2-ج: قابلِ قبول ابواب (مریض کے عضو/موضوع کے مطابق) — تلاش کے نتیجے کی چھانٹی کے لیے
    _GENERIC_CH = {"generalities", "modalities", "conditions_of_aggravation_and_amelioration_in_general",
                   "sensations_and_complaints_in_general", "mind", "sleep", "appetite", "skin"}
    allow: set = set()
    try:
        _regs = _symptom_regions(toks, " ".join(toks))
        _subj = {w for w in _SUBJECT_WORDS if w in str(symptom).lower()}
        for w in list(_regs) + list(_subj):
            allow |= _REGION_CHAPTERS.get(w, set())
            allow.add(w)
    except Exception:
        pass

    def _chapter_ok(ch) -> bool:
        c = str(ch or "").lower()
        if not allow:
            return True
        if c in allow or c in _GENERIC_CH:
            return True
        return c.replace("_", " ").split()[0] in allow

    # نسخہ 4.2: اگر سادہ تلاش خالی یا کمزور رہے تو ہم جوڑ (عضو + شکایت / شکایت + وقت) آزمائیں —
    # «pain» اکیلے کچھ نہیں دیتا، مگر «abdomen pain» اپنی درست ربرک لے آتا ہے
    if not local or best_cov < 0.35 or len(toks) >= 6:
        # سوال اصل الفاظ سے بنائیں (canonical شکل «coffee»→«coffe» بنا دیتی ہے، جس سے تلاش چوک جاتی ہے)
        base = [w for w in re.findall(r"[a-zA-Z-]{3,}", str(symptom).lower())
                if w not in _QUERY_STOP]
        base = [w for w in base if len(w) > 2 and w not in
                {"for", "and", "the", "with", "from", "last", "thre", "year", "years", "especially",
                 "causes", "caused", "roll", "rolling", "gets", "getting", "comes", "coming",
                 "feels", "feeling", "seems", "makes", "made", "when", "while", "again", "still",
                 "much", "very", "some", "time", "times", "after", "before", "when", "which", "has",
                 "have", "been", "gets", "get", "his", "her", "him", "she", "out", "off", "not"}]
        # نسخہ 4.2-ب: ہر پہلو (فيسٹ) کا اپنا سوال — «better coffee»، «vexation anger»، «rumbling abdomen»
        # ہر سوال سے صرف ایک بہترین ربرک لیا جاتا ہے (کینٹ: ہر علامت کی اپنی ربرک)
        base = base[:24]
        regions = [t for t in base if t in _REGION or t.rstrip("s") in _REGION]
        others = [t for t in base if t not in regions]
        # ترتیبِ ترجیح: (1) بگاڑ/بہتری + اُس کا سبب  (2) ردِعمل کے لفظ  (3) شکایت + عضو  (4) پاس پاس والے
        polar = [i for i, t in enumerate(base) if t in _POLARITY_WORDS]
        queries: List[tuple] = []
        for i in polar:
            for t in base[i + 1:i + 4]:
                if t not in _POLARITY_WORDS:
                    queries.append((base[i], t))
        for i, t in enumerate(base):
            if t in _REACTION_WORDS:
                if i > 0 and base[i - 1] in _POLARITY_WORDS:
                    queries.append((base[i - 1], t))
                queries.append((t, "abdomen") if "abdomen" in base else (t, base[0]))
        # ہم معنی کے الفاظ بھی ریپرٹری کی زبان میں آزمائیں (angry → vexation، anger)
        for t in base:
            for grp in _HEAD_SYN_GROUPS:
                if t in grp:
                    for alt in sorted(grp - {t})[:3]:
                        queries.append((alt, regions[0]) if regions else (alt, base[0]))
        queries += [(o, r) for r in regions for o in others]
        queries += [(base[i], base[i + 1]) for i in range(len(base) - 1)]
        facet_best: List[dict] = []
        seen_ids = {c["rubric_id"] for c in local}
        tries = 0
        for pair in queries:
            if tries >= 40:
                break
            tries += 1
            q = " ".join(dict.fromkeys(pair))
            if len(q) < 6:
                continue
            try:
                hits = index.search(q, top_k=4, strict=False)
            except TypeError:
                hits = index.search(q, top_k=4)
            cand = None
            for c in hits:
                if c["rubric_id"] in seen_ids:
                    continue
                if cand is None:
                    cand = c
                if _chapter_ok(c.get("chapter")):
                    cand = c
                    break
            if cand is not None:
                seen_ids.add(cand["rubric_id"])
                c2 = dict(cand)
                c2["derived"] = True
                c2["query"] = q
                facet_best.append(c2)   # ایک سوال = ایک ربرک
        if facet_best:
            # لمبی علامت: پہلوؤں کی ربرکیں اوّل (کینٹ نے بھی ایسے ہی گنی تھیں)
            local = (facet_best + local[:3] + local[3:]) if len(toks) >= 6 else (local[:2] + facet_best + local[2:])

    # نسخہ 4.6: موضوع + حالت کا جوڑا («appetite poor») → اُسی کی اپنی ربرک سب سے اوّل
    _boost = _subject_value_candidates(symptom, index)
    if _boost:
        _ids = {c["rubric_id"] for c in _boost}
        local = _boost + [c for c in local if c["rubric_id"] not in _ids]

    if use_llm:
        # اردو رسم الخط (یا خالی میچ): لے سے ریپرٹری زبان میں ترجمہ
        if not local and not _is_latin(symptom):
            translated = _llm_translate_symptom(symptom, index.name)
            if translated:
                local = _tag_derived(set(), index.search(translated, top_k=12))
        # جرمن کینٹ: لاطینی/رومن علامت کو جرمن کلیدی الفاظ میں بدل کر ملاؤ
        elif index.name == "kent_de" and _is_latin(symptom):
            translated = _llm_translate_symptom(symptom, index.name)
            if translated:
                tlocal = index.search(translated, top_k=12)
                if tlocal:
                    local = _merge_candidates(local, tlocal)
        # کم کوریج پر کوئری پھیلاؤ
        if local:
            best_cov = max((c.get("coverage", 0) or 0) for c in local)
            if best_cov < 0.5:
                for v in _llm_expand_symptom(symptom, index.name):
                    vv = index.search(v, top_k=12)
                    if vv:
                        base_ids = {c["rubric_id"] for c in local}
                        local = _tag_derived(base_ids, _merge_candidates(local, vv))
                local = local[:12]

    if len(local) < max(int(top_k), 3) and local0:
        have0 = {c["rubric_id"] for c in local}
        for c in local0:
            if c["rubric_id"] not in have0:
                local.append(c)
                have0.add(c["rubric_id"])
    if not local:
        return []

    if allow:
        local.sort(key=lambda c: 0 if _chapter_ok(c.get("chapter")) else 1)

    # نسخہ 4.7: خالی حوالہ-ربرک (See …، بغیر ادویات) پہلے صاف کریں —
    # ایل ایل ایم اور مقامی دونوں راستوں کے لیے
    local = _drop_pure_crossrefs(local, index, reject_log)
    if not local:
        return []

    if use_llm:
        picked = select_rubrics_llm(symptom, local, index)
        if picked:
            return _apply_compat(symptom, picked, reject_log)
        # ایل ایل ایم ناکام → مقامی نتائج، اعتماد اسکور سے نکال کر
        out = []
        for c in local[:14]:
            out.append({
                "rubric_id": c["rubric_id"], "chapter": c["chapter"], "text": c["text"],
                "path": c.get("path", ""), "score": c["score"],
                "confidence": round(min(c["coverage"], 1.0), 2),
                "rationale": "لفظی مماثلت (ایل ایل ایم دستیاب نہیں)",
            })
        kept = _apply_compat(symptom, out, reject_log)
        kept = _drop_far_chapters(kept, case_region or "")
        if not kept:
            # نسخہ 4.5: ایل ایل ایم دستیاب نہ ہو اور سب رد ہو جائیں → سادہ مین ربرک ڈھونڈیں
            kept = _recover_rubrics(symptom, index, top_k, reject_log, case_region or "")
        return _appetite_filter(kept[:max(int(top_k), 1)], symptom)

    # نسخہ 4.7: خالی حوالہ-ربرک صاف — پھر مطابقت کی جانچ
    kept = _apply_compat(symptom, local[:14], reject_log)
    kept = _drop_far_chapters(kept, case_region or "")
    if not kept:
        # نسخہ 4.3/4.5: سب رد ہو گئے → سادہ مین ربرک (جیسے «RUMBLING»، «AVERSION to acids»)
        kept = _recover_rubrics(symptom, index, top_k, reject_log, case_region or "")
    return _appetite_filter(kept[:max(int(top_k), 1)], symptom)


# ------------------------------------------------------------------ #
# سنگلٹن / آسان فنکشنز (پسماندہ مطابقت کے لیے)
# ------------------------------------------------------------------ #
_index_cache: Dict[str, RubricIndex] = {}


def get_index(chapters: Optional[List[str]] = None) -> RubricIndex:
    key = "all" if chapters is None else ",".join(sorted(chapters))
    if key not in _index_cache:
        _index_cache[key] = RubricIndex(chapters=chapters)
    return _index_cache[key]


def map_symptom(symptom: str, top_k: int = 5, chapters: Optional[List[str]] = None) -> List[dict]:
    """آسان فنکشن — ایک علامت کو ربرکس میں بدلنا"""
    return get_index(chapters).search(symptom, top_k=top_k)


def map_symptoms(symptoms: List[str], top_k: int = 5) -> Dict[str, List[dict]]:
    out = {}
    for s in symptoms:
        out[s] = map_symptom(s, top_k=top_k)
    return out
