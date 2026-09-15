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
from typing import Dict, List, Optional

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
    "great", "intense", "severe", "lots", "excessive", "zyada", "bohat",
    # نوٹ: "with"/"without" اب اسٹاپ ورڈ نہیں — ہم راہ علامات
    # ("anxiety with restlessness") اور نفی ("without sweating") کے لیے ضروری ہیں
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
    "thandi": "cold", "garam": "hot", "garmi": "heat", "sona": "sleep",
    "neend": "sleep", "bhook": "appetite", "bhok": "appetite", "khana": "food",
    # وقت
    "rat": "night", "subah": "morning", "sham": "evening", "dopehar": "afternoon",
    "din": "day", "khwab": "dreams", "jagna": "waking", "uthna": "rising",
    # خارجی اخراجات
    "khoon": "blood", "pasina": "sweat", "peshab": "urine", "qabz": "constipation",
    "dast": "diarrhoea", "pyas": "thirst",
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


def _is_negative(text: str) -> bool:
    """کیا علامت میں نفی ہے؟ (cannot / no / without / nahi ...)"""
    t = " " + str(text).lower() + " "
    return any(m in t for m in _NEG_MARKERS)


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
    "\x9c": "oe", "\x8c": "oe",      # œ Œ
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
    """متن کو صاف کر کے الفاظ کی فہرست بنانا"""
    text = _unligature(_strip_refs(str(text).lower()))
    text = re.sub(r"[^a-z0-9\s-]", " ", text)
    words = [w.strip("-") for w in text.split() if w.strip("-")]
    return [w for w in words if w and w not in _STOPWORDS]


def _tokens_canonical(text: str) -> List[str]:
    """متن کے الفاظ — دو لفظی فقرے + دستوری الفاظ + رومن اردو + مترادفات"""
    raw = _tokenize(text)
    out: List[str] = []
    i = 0
    while i < len(raw):
        if i + 1 < len(raw):
            pair = raw[i] + " " + raw[i + 1]
            if pair in _UR_PHRASES:          # "se barhti" → agg
                out.append(_canonical(_UR_PHRASES[pair]))
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
        out.append(_stem(c))                 # ایک ہی لفظ کی صرفی صورت
        i += 1
    return out


def _bigrams(tokens: List[str]) -> List[str]:
    return ["_".join(tokens[i:i + 2]) for i in range(len(tokens) - 1)]


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
                "nausea", "vomiting", "vomit", "maida", "pait", "pyas", "qay", "matli"],
    "abdomen": ["abdomen", "belly", "pait"],
    "rectum": ["rectum", "piles", "hemorrhoid", "haemorrhoid"],
    "stool": ["stool", "constipation", "diarrhea", "diarrhoea", "qabz", "dast"],
    "urine": ["urine", "urination", "urinary", "peshab"],
    "genitalia_female": ["menses", "menstrual", "menstruation"],
    "skin": ["skin", "itching", "itch", "eruption", "rash", "khujli"],
    "sleep": ["sleep", "dream", "dreams", "insomnia", "neend"],
    "mind": ["anxiety", "fear", "grief", "anger", "sadness", "depression",
             "irritability", "weeping", "khauf", "gham", "ghussa", "ghabrahat"],
    "extremities": ["hand", "hands", "foot", "feet", "leg", "arm", "joint", "joints",
                    "knee", "shoulder", "hath", "paon", "joron"],
    "back": ["back", "spine", "peeth", "kamar"],
    "chest": ["chest", "heart", "palpitation", "seenah"],
    "fever": ["fever", "chill", "chills", "bukhar"],
    "vertigo": ["vertigo", "dizzy", "dizziness", "chakkar"],
    # نسخہ 2.4: سانس، لیٹنے/بیٹھنے کی حالت، اور تھکن کے اضافے
    "respiration": ["dyspnoea", "dyspnea", "breath", "breathing", "respiration",
                    "asthma", "asthmatic", "saans", "suffocation"],
    "generalities": ["lying", "lying_down", "sitting", "standing", "walking",
                     "rest"],
    "extremities": ["hand", "hands", "foot", "feet", "leg", "legs", "arm", "arms",
                    "joint", "joints", "knee", "knees", "shoulder", "toe", "toes",
                    "finger", "fingers", "thigh", "thighs", "hath", "paon", "joron"],
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


def _chapter_hint(tokens: List[str]) -> set:
    """علامت کے الفاظ کی بنیاد پر متعلقہ ابواب کا اندازہ"""
    hints = set()
    for tok in tokens:
        for chap, kws in CHAPTER_HINTS.items():
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
                self.rubrics[rid] = {
                    "t": text,
                    "chapter": key,
                    "key": rk,
                    "path": rv.get("path", ""),
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
        numbered.append(f"{i}. [{c['chapter']}] {c['text']}")

    prompt = f"""You are an expert classical homeopath and repertory scholar.
Convert the patient symptom into the best matching repertory rubric(s).

Symptom: "{symptom}"

Candidate rubrics (pre-filtered by keyword matching):
{chr(10).join(numbered)}

Rules:
- Choose 1 to {max_pick} rubrics that genuinely represent the symptom.
- Prefer the MOST SPECIFIC rubric that still matches (e.g. prefer "cough, motion agg."
  over a general "cough" rubric).
- A modality ("worse from motion") must map to a modality rubric.
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


def map_symptom_deep(symptom: str, index: Optional[RubricIndex] = None,
                     top_k: int = 5, use_llm: bool = True) -> List[dict]:
    """
    گہری علامت→ربرک میپنگ (نسخہ 2.1):
      1) مقامی مماثلت
      2) اردو رسم الخط → ایل ایل ایم ترجمہ کر کے دوبارہ تلاش
      3) جرمن کینٹ پر لاطینی علامت → جرمن کلیدی الفاظ میں ترجمہ
      4) کم اعتماد میچ پر ایل ایل ایم سے متبادل فارمولے (کوئری پھیلاؤ)
      5) ایل ایل ایم کا حتمی انتخاب — اعتماد اور وجہ کے ساتھ (یا مقامی فال بیک)
    """
    index = index or get_index()
    local = index.search(symptom, top_k=12)

    # (نسخہ 2.4) مقامی بچاؤ — جب لفظی مماثلت سے کچھ نہ ملے، یا لمبی علامت بکھر جائے
    toks = _tokens_canonical(symptom)
    best_cov = max((c.get("coverage", 0) or 0) for c in local) if local else 0.0
    best_score = max((c.get("score", 0) or 0) for c in local) if local else 0.0
    # متبادل الفاظ اُس وقت بھی آزمائیں جب مقامی میچ کمزور ہو (مثلاً "heart attacks" → "heart spasm")
    if not local or best_score < 40 or best_cov < 0.45:
        for v in _alias_variants(symptom):
            local = _merge_candidates(local, index.search(v, top_k=3))
    if len(toks) >= 5 and best_cov < 0.55:          # لمبی علامت → ٹکڑے الگ الگ
        for part in _sub_symptoms(symptom):
            if len(_tokens_canonical(part)) >= 1:
                local = _merge_candidates(local, index.search(part, top_k=2))
        local = local[:12]

    if use_llm:
        # اردو رسم الخط (یا خالی میچ): لے سے ریپرٹری زبان میں ترجمہ
        if not local and not _is_latin(symptom):
            translated = _llm_translate_symptom(symptom, index.name)
            if translated:
                local = index.search(translated, top_k=12)
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
                        local = _merge_candidates(local, vv)
                local = local[:12]

    if not local:
        return []

    if use_llm:
        picked = select_rubrics_llm(symptom, local, index)
        if picked:
            return picked
        # ایل ایل ایم ناکام → مقامی نتائج، اعتماد اسکور سے نکال کر
        out = []
        for c in local[:top_k]:
            out.append({
                "rubric_id": c["rubric_id"], "chapter": c["chapter"], "text": c["text"],
                "path": c.get("path", ""), "score": c["score"],
                "confidence": round(min(c["coverage"], 1.0), 2),
                "rationale": "لفظی مماثلت (ایل ایل ایم دستیاب نہیں)",
            })
        return out

    return local[:top_k]


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
