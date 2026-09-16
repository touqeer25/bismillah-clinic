# -*- coding: utf-8 -*-
"""
symptom_grading.py — نسخہ 4.0
«کینٹ کا مکمل طریقہ کار: علامت سے لے کر دوا تک»

یہ ماڈیول اُس طریقے کو کوڈ بناتا ہے جو کینٹ نے "Use of the Repertory"،
"How to Study the Repertory"، "How to Use the Repertory" میں لکھا، اور
ٹائلر و ویر (Tyler & Weir) نے "Repertorising" میں مرحلہ وار بیان کیا۔

بنیادی اصول:
  1. علامات دو طرح کی ہیں:
       GENERAL  (جنرل)   — «I» والی بات: مریض بطورِ مجموعی۔ (لیٹنگ عام، گرمی/سردی، موسم، وقت…)
       PARTICULAR (پارٹ) — «My» والی بات: کسی جزو کی۔ (میرا سر، میرا پیٹ…)
     جنرل پہلے تولے جاتے ہیں، پارٹ آخر میں۔
  2. درجہ بندی (Tyler & Weir کا «GRADING OF SYMPTOMS»):
        درجہ 1: ذہنی/جذباتی علامات (اگر نمایاں ہوں)
        درجہ 2: بطورِ مجموعی جسمانی ردِعمل — وقت/موسم، گرمی/سردی، نمی/خشکی، ٹھنڈ/طوفان،
                حالت/دباؤ/حرکت/جھٹکا/چھونا
        درجہ 3: شدید خواہشات و نفرتیں (longings/loathings)
        پھر   : حیض کی حالت (ماہواری سے پہلے/دوران/بعد عمومی بگاڑ)
        آخر میں: پارٹیکولر (خاص عضو کی علامات) — مگر «عجیب/انوکھا» ہو تو اعلیٰ درجہ
  3. معائنہ/بیماری کی نفی = علامت نہیں (pathognomonic/common) — اِس سے دوا نہیں چنی جاتی۔
  4. «modality کو علامت نہ سمجھیں» — علامت = احساس یا حالت، موڈیلٹی صرف اُس کی تبدیلی ہے۔
  5. «eliminating symptom»: کوئی ایک دو نمایاں جنرل (مثلاً «گرمی سے بگاڑ») سے مخالف
     مزاج کی دوائیں شروع ہی میں خارج کر دی جاتی ہیں — مگر صرف اُس وقت جب وہ نمایاں ہو۔
  6. جنرل اور پارٹ الٹے بھی ہو سکتے ہیں (Ars. سردی سے بگڑتا ہے مگر اُس کا سردرد سردی سے بہتر) —
     اِس لیے پارٹ کی موڈیلٹی کو عام نہ کیا جائے۔
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

try:
    from homeo_core.engine import rubric_grammar as _RG
except Exception:
    _RG = None

# ------------------------------------------------------------------ #
# 1) دوا کی گرم/سرد شناخت — ریپرٹری کے جنرل ربرکس سے (خود ڈیٹا سے نکالی گئی)
# ------------------------------------------------------------------ #
# یہ وہی ربرکیں ہیں جو کینٹ/ٹائلر کے «predominantly hot/cold remedies» کا مآخذ ہیں
_COLD_RUBRICS = [
    "GENERALITIES - Cold - in general - agg.",
    "CONDITIONS OF AGGRAVATION AND AMELIORATION IN GENERAL - Cold - in general - agg.",
    "CONDITIONS OF AGGRAVATION AND AMELIORATION IN GENERAL - Cold - agg., when becoming",
    "CONDITIONS OF AGGRAVATION AND AMELIORATION IN GENERAL - Warmth - of bed, amel.",
    "CONDITIONS OF AGGRAVATION AND AMELIORATION IN GENERAL - Warmth - of stove, amel.",
    "MODALITIES - Aggravation - Cold",
    "MODALITIES - Aggravation - Air - cold, dry",
    "MODALITIES - Aggravation - Weather - dry, cold",
    "MODALITIES - Ameliorations - Warmth, heat",
    "MODALITIES - Ameliorations - Warmth, heat - applications",
]
_HOT_RUBRICS = [
    "CONDITIONS OF AGGRAVATION AND AMELIORATION IN GENERAL - Warmth - in general - agg.",
    "CONDITIONS OF AGGRAVATION AND AMELIORATION IN GENERAL - Warmth - of air, agg.",
    "CONDITIONS OF AGGRAVATION AND AMELIORATION IN GENERAL - Cold - amel., becoming",
    "MODALITIES - Aggravation - Warmth, heat",
    "MODALITIES - Aggravation - Room, heated",
    "MODALITIES - Aggravation - Weather - hot",
    "MODALITIES - Aggravation - Overheating",
    "MODALITIES - Ameliorations - Cold",
    "MODALITIES - Ameliorations - Cold - applications, washing",
    "MODALITIES - Ameliorations - Bathing - cold",
]
_THERMAL_CACHE = "remedy_thermal.json"


def build_thermal_profile(repo=None) -> dict:
    """ہر دوا کا سردی/گرمی کا رجحان — ریپرٹری کے جنرل ربرکس سے گن کر
    repo نہ دیں تو خود اِس ماڈیول کے راستے سے ریپو کی جڑ ڈھونڈ لی جاتی ہے
    (homeo_core/engine/… → parents[2] = ریپو کی جڑ)"""
    if repo is None:
        repo = Path(__file__).resolve().parents[2]
    repo = Path(repo)
    cache = repo / "homeo_core" / "data" / _THERMAL_CACHE
    if cache.exists():
        try:
            return json.loads(cache.read_text(encoding="utf-8"))
        except Exception:
            pass
    cold: Dict[str, float] = {}
    hot: Dict[str, float] = {}
    files = ["conditions_of_aggravation_and_amelioration_in_general.json", "generalities.json",
             "modalities.json", "generals.json"]
    rows: List[dict] = []
    for f in [repo / "synthesis91_raw_chapters" / x for x in files]:
        if not f.exists():
            continue
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except Exception:
            continue
        items = data if isinstance(data, list) else list(data.values())
        rows.extend(items)
    want_cold = {p.lower() for p in _COLD_RUBRICS}
    want_hot = {p.lower() for p in _HOT_RUBRICS}
    for it in rows:
        path = str(it.get("path", "")).lower()
        if path not in want_cold and path not in want_hot:
            continue
        bucket = cold if path in want_cold else hot
        for rem, grade in (it.get("r") or {}).items():
            try:
                g = float(grade)
            except Exception:
                g = 1.0
            bucket[rem] = bucket.get(rem, 0.0) + g
    out = {"cold": cold, "hot": hot, "rubrics_cold": _COLD_RUBRICS, "rubrics_hot": _HOT_RUBRICS}
    try:
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    except Exception:
        pass
    return out


# ------------------------------------------------------------------ #
# 1-ب) دوا کا مزاج: گرم / سرد — ڈاکٹر گبسن ملر کی فہرست (ماخوذ از کینٹ کے کاموں سے)
# ------------------------------------------------------------------ #
# «REMEDIES PREDOMINANTLY AGGRAVATED BY COLD / BY HEAT» — یہ فہرست ریپرٹری کے اندازے پر مقدم ہے،
# کیونکہ یہ خود کینٹ کے کاموں سے نکالی گئی ہے۔
# شدت: 5 = کینٹ کے کاموں میں نمایاں (بڑے حروف) · 3 = فہرست میں شامل
_GIBSON_COLD = {
    "ars": 5, "bar-c": 5, "calc": 5, "calc-p": 5, "caps": 5, "caust": 5,
    "chin": 5, "dulc": 5, "ferr": 5, "graph": 5, "hep": 5, "hyper": 5,
    "kali-ar": 5, "kali-c": 5, "mag-c": 5, "mag-p": 5, "mosch": 5, "nit-ac": 5,
    "nux-v": 5, "phos": 5, "psor": 5, "pyrog": 5, "ran-b": 5, "rhus-t": 5,
    "rumx": 5, "sabad": 5, "sep": 5, "sil": 5, "spig": 5, "stront-c": 5,
    "abrot": 3, "acet-ac": 3, "acon": 3, "agar": 3, "agn": 3, "alum": 3,
    "alum-p": 3, "alum-sil": 3, "am-c": 3, "apoc": 3, "ars-s-f": 3, "asar": 3,
    "aur": 3, "aur-ar": 3, "aur-s": 3, "bad": 3, "bar-m": 3, "bell": 3,
    "benz-ac": 3, "borx": 3, "brom": 3, "cadm-met": 3, "calc-ar": 3, "calc-f": 3,
    "calc-sil": 3, "camph": 3, "canth": 3, "carb-an": 3, "carb-v": 3, "carbn-s": 3,
    "card-m": 3, "caul": 3, "cham": 3, "chel": 3, "cimic": 3, "cist": 3,
    "cocc": 3, "coff": 3, "colch": 3, "cycl": 3, "euphr": 3, "ferr-ar": 3,
    "form": 3, "guaj": 3, "hell": 3, "helon": 3, "hyos": 3, "ign": 3,
    "kali-bi": 3, "kali-chl": 3, "kali-p": 3, "kali-sil": 3, "kalm": 3, "kreos": 3,
    "lac-d": 3, "mag-m": 3, "mang": 3, "mur-ac": 3, "nat-ar": 3, "nat-c": 3,
    "ox-ac": 3, "petr": 3, "ph-ac": 3, "plb": 3, "podo": 3, "rheum": 3,
    "rhod": 3, "ruta": 3, "stann": 3, "staph": 3, "stram": 3, "sul-ac": 3,
    "ther": 3, "valer": 3, "viol-t": 3, "zinc": 3,
}

_GIBSON_HOT = {
    "apis": 5, "arg-n": 5, "fl-ac": 5, "iod": 5, "kali-i": 5, "kali-s": 5,
    "nat-m": 5, "nat-s": 5, "plat": 5, "puls": 5, "sabin": 5, "sec": 5,
    "aesc": 3, "all-c": 3, "aloe": 3, "ambr": 3, "asaf": 3, "aur-i": 3,
    "aur-m": 3, "bar-i": 3, "bry": 3, "calad": 3, "calc-i": 3, "calc-s": 3,
    "cham": 3, "coc-c": 3, "coloc": 3, "croc": 3, "dros": 3, "ferr-i": 3,
    "grat": 3, "lach": 3, "led": 3, "lil-t": 3, "lyc": 3, "nicc": 3,
    "op": 3, "pic-ac": 3, "ptel": 3, "spong": 3, "sul-i": 3, "sulph": 3,
    "thuj": 3, "tub": 3, "ust": 3, "vesp": 3, "vib": 3,
}

# دونوں انتہاؤں پر حساس — اِن کی «جنرل» کبھی خارج نہیں کرتی (گبسن ملر)
# MERC.: دائمی میں سردی سے، حاد میں گرمی سے بگڑتی ہے · Ant-cr.: گرمی اور سردی دونوں سے
_GIBSON_BOTH = ["ant-c", "cinnb", "ip", "merc", "nat-c"]

_GIBSON_NOTE = {
    "merc": "دائمی امراض میں سردی سے، حاد میں گرمی سے بگاڑ (گبسن ملر)",
    "ant-c": "گرمی اور سردی دونوں سے بگاڑ؛ بہت سی علامات گرمی سے بہتر",
    "cinnb": "دونوں انتہاؤں پر حساس",
    "ip": "دونوں انتہاؤں پر حساس",
    "nat-c": "دونوں انتہاؤں پر حساس",
}


def thermal_lean(profile, remedy):
    """دوا کا رجحان: 'chilly' | 'warm' | 'neutral' + شدت (0..1)
    پہلے گبسن ملر کی فہرست (کینٹ کے کاموں سے)، پھر ریپرٹری کے جنرل ربرکس سے اندازہ"""
    if remedy in _GIBSON_BOTH:
        return "neutral", 1.0
    sev = _GIBSON_COLD.get(remedy)
    if sev:
        return "chilly", (1.0 if sev >= 5 else 0.6)
    sev = _GIBSON_HOT.get(remedy)
    if sev:
        return "warm", (1.0 if sev >= 5 else 0.6)
    c = float((profile.get("cold") or {}).get(remedy, 0) or 0)
    h = float((profile.get("hot") or {}).get(remedy, 0) or 0)
    tot = c + h
    # محافظتی قاعدہ (ٹائلر-ویر: «وہ دوا نہ کھو بیٹھو جسے ڈھونڈ رہے ہو») —
    # ریپرٹری کا اندازہ اُسی وقت مانا جائے گا جب ثبوت کافی ہو (کل وزن 5 یا زیادہ)
    if tot < 5:
        return "neutral", 0.0
    diff = (c - h) / tot
    if diff >= 0.45:
        return "chilly", abs(diff)
    if diff <= -0.45:
        return "warm", abs(diff)
    return "neutral", abs(diff)


def thermal_source(remedy):
    """رجحان کہاں سے آیا: گبسن ملر کی فہرست یا ریپرٹری کا اندازہ"""
    if remedy in _GIBSON_BOTH:
        return "دونوں انتہاؤں پر حساس (گبسن ملر)"
    if remedy in _GIBSON_COLD:
        return "گبسن ملر: سردی سے بگاڑ"
    if remedy in _GIBSON_HOT:
        return "گبسن ملر: گرمی سے بگاڑ"
    return "ریپرٹری کے جنرل ربرکس سے اندازہ"


# ------------------------------------------------------------------ #
# 2) علامت کی درجہ بندی
# ------------------------------------------------------------------ #
_MENTAL_RX = re.compile(
    r"\b(anxiet|anxious|fear|fears|dread|afraid|anger|angry|irritab|weep|weeping|cry|crying|"
    r"sad|sadness|grief|despair|depress|consol|jealous|envy|hatred|hate|love|desire for company|"
    r"aversion to company|talk|talking|absent|forget|memory|confus|delir|restless|restlessness|"
    r"impatien|hurry|hurried|fright|terror|panic|mood|moody|excitable|excitement|"
    r"indifferent|indifference|sensitive|offended|suspicious)\b", re.I)
_GENERAL_RX = re.compile(
    r"\b(i feel|i am|i have|i cannot|i can not|i want|i crave|i dread|i hate|i love|i get|i becomes?|"
    r"altogether|as a whole|generally|whole body|entire)\b", re.I)
_WHOLEBODY_RX = re.compile(
    r"\b(heat|cold|warm|warmth|weather|storm|thunder|rain|damp|dry|open air|air|sun|"
    r"morning|evening|night|day|time|season|summer|winter|spring|autumn|"
    r"rest|motion|exertion|walking|lying|sitting|standing|position|pressure|touch|jar|"
    r"sleep|sleeping|eating|food|drink|perspiration|sweat|menses|menstruation)\b", re.I)
_CRAVING_RX = re.compile(
    r"\b(crave|craving|desire|desires|longing|aversion|averse|dislike|loathe|hatred of food|"
    r"appetite|thirst|hunger)\b", re.I)
_MENSES_RX = re.compile(r"\b(menses|menstruat|period|periods|m.p\.)\b", re.I)
_LIKES_RX = re.compile(r"\b(likes?|dislikes?|fond of|prefers?)\b", re.I)
_I_RX = re.compile(r"\b(i|me|my self|myself)\b", re.I)
_MY_RX = re.compile(r"\bmy\b", re.I)
_PECULIAR_RX = re.compile(
    r"\b(as if|as though|strange|peculiar|unusual|unaccountable|odd|queer|never|only|"
    r"especially|otherwise|in spite|yet|although|but)\b", re.I)
_PATHOGNOMONIC_RX = re.compile(
    r"\b(no organic|organic lesion|auscultation|x-?ray|ultrasound|ecg|ekg|report|test|"
    r"examination|diagnosis|lesion|tumour|tumor|ulcer|abscess|fever with thirst)\b", re.I)
_COMMON_RX = re.compile(
    r"^(thirst|hunger|weakness|pain|fatigue|tiredness|fever|cough|cold|headache|vomiting|"
    r"diarrhoea|constipation|sleeplessness)\b", re.I)


def _text(sym: str) -> str:
    return " ".join(str(sym or "").split())


# وجہ/مناسبے کا فقرہ — اُس کے الفاظ علامت کا درجہ نہیں بدلتے
_CAUSE_CLAUSE_RX = re.compile(
    r"(?:brought on by|coming on after|first coming on after|due to|because of|after|before|since)"
    r"\s+[a-z-]+(?:\s+[a-z-]+)?"
    r"|from\s+[a-z-]+(?:\s+[a-z-]+)?"
    r"|[a-z-]+\s+brings?\s+on\s+[a-z-]+(?:\s+[a-z-]+)?"
    r"|brought\s+on\s+by\s+[a-z-]+(?:\s+[a-z-]+)?", re.I)
# جنرل ہونے کی نشانی — «مجموعی» کا صریح اشارہ یا بگاڑ/بہتری کی کیفیت
_GENERAL_MARK_RX = re.compile(
    r"\b(in general|as a whole|altogether|generally|whole body|entire|"
    r"worse|worse from|agg|aggravat\w*|intoleran\w*|cannot bear|can't bear|"
    r"better|ameliorat\w*|reliev\w*)\b", re.I)


def grade_symptom(sym: str, parts: Optional[dict] = None) -> dict:
    """ایک (مکمل) علامت کا درجہ اور شناخت — کینٹ/ٹائلر کے مطابق"""
    t = _text(sym)
    parts = parts or {}
    # وجہ والے فقرے الگ کر دیں (excitement بطورِ وجہ «دماغی علامت» نہیں)
    t_head = _CAUSE_CLAUSE_RX.sub(" ", t)
    # موڈیلٹی والے فعل بھی الگ («on talking» — یہ ذہنی علامت نہیں، شرط ہے)
    t_head = re.sub(r"\b(on|while|during|after|before|from|by|when)\s+"
                    r"(talking|speaking|walking|motion|eating|drinking|lying|sitting|standing|"
                    r"sleep|sleeping|sweating)\b", " ", t_head, flags=re.I)
    if t_head.strip() in ("", ","):
        t_head = t
    mental = bool(_MENTAL_RX.search(t_head))
    has_loc = bool(parts.get("location"))
    has_sens = bool(parts.get("sensation"))
    has_comp = bool(parts.get("complaint"))
    # جنرل: یا تو صریح مجموعی عبارت ہو، یا کیفیت (بگاڑ/بہتری) کا اشارہ ہو
    body_general = (bool(_WHOLEBODY_RX.search(t_head))
                    and bool(_GENERAL_MARK_RX.search(t_head)))
    if not has_loc and not has_sens and not has_comp and bool(_GENERAL_RX.search(t_head)):
        body_general = True
    craving = bool(_CRAVING_RX.search(t))
    menses = bool(_MENSES_RX.search(t))
    peculiar = bool(_PECULIAR_RX.search(t))
    pathognomonic = bool(_PATHOGNOMONIC_RX.search(t))
    common = bool(_COMMON_RX.search(t)) and len(t.split()) <= 4
    if pathognomonic:
        grade, name = 0, "معائنہ/بیماری کی اطلاع (علامت نہیں)"
    elif mental:
        grade, name = 1, "ذہنی/جذباتی (درجہ 1)"
    elif craving:
        grade, name = 3, "خواہش/نفرت (درجہ 3)"
    elif menses:
        grade, name = 4, "حیض کی حالت"
    elif body_general:
        grade, name = 2, "بطورِ مجموعی جسمانی ردِعمل (درجہ 2)"
    elif has_loc or has_sens or has_comp:
        grade, name = 5, "پارٹیکولر (کسی عضو کی)"
    else:
        grade, name = 5, "پارٹیکولر"
    if peculiar and grade >= 2:
        name += " — عجیب/انوکھا"
    if common:
        name += " — عام (کم قیمت)"
    return {"symptom": t, "grade": grade, "grade_name": name, "mental": mental,
            "general": body_general, "craving": craving, "menses": menses,
            "peculiar": peculiar, "pathognomonic": pathognomonic, "common": common,
            "i_self": bool(_I_RX.search(t)), "my_part": bool(_MY_RX.search(t)),
            "sensation_present": has_sens, "modality_only": (not has_sens and not has_comp and bool(parts.get("modality")))}


# ------------------------------------------------------------------ #
# 3) excluding/eliminating symptoms + تضاد کی جانچ
# ------------------------------------------------------------------ #
_ELIM_RX = {
    "heat": re.compile(r"\b(worse|agg|aggravat\w*|intoleran\w*|cannot bear|can't bear)\b[^.]{0,20}\b(heat|warmth|warm|sun|summer)\b"
                       r"|\b(heat|warmth|summer|sun)\b[^.]{0,20}\b(worse|agg|aggravat\w*|intoleran\w*)\b", re.I),
    "cold": re.compile(r"\b(worse|agg|aggravat\w*|intoleran\w*|cannot bear|can't bear)\b[^.]{0,20}\b(cold|chill|winter|draught)\b"
                       r"|\b(cold|chill|winter)\b[^.]{0,20}\b(worse|agg|aggravat\w*|intoleran\w*)\b", re.I),
    "storm": re.compile(r"\b(storm|thunder|lightning)\b", re.I),
    "damp": re.compile(r"\b(damp|wet weather)\b", re.I),
    "consolation": re.compile(r"\bconsolat\w*\b", re.I),
    "motion": re.compile(r"\b(motion|movement|exertion|walking)\b[^.]{0,15}\b(worse|agg|aggravat)\b"
                         r"|\b(worse|agg|aggravat\w*)\b[^.]{0,15}\b(motion|movement|walking)\b", re.I),
}


def find_eliminating(graded: List[dict]) -> List[dict]:
    """نمایاں جنرل/ذہنی علامات جو «eliminating symptom» بن سکتی ہیں
    (کینٹ: «a few only, and only if strongly marked»)"""
    out = []
    for g in graded:
        if g["grade"] in (0, 5):
            continue
        t = g["symptom"]
        for key, rx in _ELIM_RX.items():
            if rx.search(t):
                # «worse from heat» جیسا مختصر مگر نمایاں جنرل بھی eliminating ہے
                pol = bool(re.search(r"worse|agg|aggravat|cannot bear|intoleran|averse|"
                                     r"better|amel|reliev|suit", t, re.I))
                strong = (len(t.split()) >= 3) or (key in ("heat", "cold") and pol)
                out.append({"symptom": t, "kind": key, "grade": g["grade"], "strong": strong})
    # صرف نمایاں (strong) والی، زیادہ سے زیادہ 3
    out = [o for o in out if o["strong"]][:3]
    return out


def contradiction_check(graded: List[dict], parts_map: Optional[Dict[str, dict]] = None) -> List[dict]:
    """جنرل اور پارٹ کا تضاد (Ars./Lyc./Phos. کی طرح): ایک ہی کیفیت کا الٹا اثر"""
    out = []
    parts_map = parts_map or {}
    gen = {}
    for g in graded:
        if g["grade"] == 2:
            t = g["symptom"].lower()
            for k in ("heat", "cold", "motion", "pressure"):
                if k in t:
                    pol = "agg" if re.search(r"worse|agg|aggravat", t) else (
                        "amel" if re.search(r"better|amel|reliev", t) else "")
                    if pol:
                        gen[k] = pol
    for g in graded:
        if g["grade"] != 5:
            continue
        t = g["symptom"].lower()
        for k, pol in gen.items():
            if k not in t:
                continue
            p2 = "agg" if re.search(r"worse|agg|aggravat|brings? on", t) else (
                "amel" if re.search(r"better|amel|reliev|best", t) else "")
            if p2 and p2 != pol:
                out.append({"general": k, "general_pol": pol, "particular": g["symptom"],
                            "particular_pol": p2,
                            "note": "جنرل اور پارٹ اُلٹے ہیں — پارٹ کی موڈیلٹی کو عام نہ کریں (کینٹ)"})
    return out


# ------------------------------------------------------------------ #
# 4) پورا کیس جانچنا: ترتیب، درجے، excluding، تضاد
# ------------------------------------------------------------------ #
_GRADE_WEIGHT = {1: 3.0, 2: 2.2, 3: 1.6, 4: 1.3, 5: 1.0, 0: 0.0}
_GRADE_ORDER = {1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 0: 5}


def grade_case(symptoms: List[str], parts_map: Optional[Dict[str, dict]] = None) -> dict:
    parts_map = parts_map or {}
    graded = [grade_symptom(s, parts_map.get(s)) for s in symptoms]
    graded.sort(key=lambda g: (_GRADE_ORDER.get(g["grade"], 9), -_GRADE_WEIGHT.get(g["grade"], 1)))
    eliminated = find_eliminating(graded)
    contradictions = contradiction_check(graded)
    counts = {}
    for g in graded:
        counts[g["grade_name"].split(" (")[0]] = counts.get(g["grade_name"].split(" (")[0], 0) + 1

    # ---- کیس کی مکملیت (کینٹ: «Many cases are presented with no generals and no mental symptoms …
    #      When a successful prescription is made on such symptoms it is scarcely more than a "lucky hit"») ----
    n_mental = sum(1 for g in graded if g["mental"] and g["grade"] == 1)
    n_general = sum(1 for g in graded if g["general"])
    n_craving = sum(1 for g in graded if g["craving"])
    n_menses = sum(1 for g in graded if g["menses"])
    n_part = sum(1 for g in graded if g["grade"] == 5)
    n_pec = sum(1 for g in graded if g["peculiar"])
    notes = []
    if n_mental == 0:
        notes.append("کوئی ذہنی/جذباتی علامت نہیں — کینٹ کے مطابق یہ پہلا اور سب سے بڑا نقص ہے "
                     "(«A strongly marked mental symptom will always rule out any number of poorly-marked symptoms»)")
    if n_general == 0:
        notes.append("بطورِ مجموعی کوئی جنرل علامت نہیں (گرمی/سردی، موسم، وقت، حرکت/آرام…) — "
                     "اِن کے بغیر «eliminating symptom» بھی نہیں بن سکتی")
    if n_craving == 0:
        notes.append("خواہش/نفرت (longings/loathings) نہیں — درجہ 3 کی علامت غائب ہے")
    if n_pec == 0:
        notes.append("کوئی «عجیب/انوکھا» (strange, rare, peculiar) نشان نہیں ملا")
    verdict = ("کیس مکمل ہے (ذہنی + جنرل موجود)" if n_mental and n_general else
               "کیس ادھورا ہے — محض پارٹیکولر (کسی عضو کی) علامات پر دوا چنی جا رہی ہے"
               if n_part and not n_mental and not n_general else
               "کیس جزوی طور پر مکمل ہے — مزید جنرل/ذہنی علامات درکار ہیں")
    completeness = {
        "mental": n_mental, "general": n_general, "craving": n_craving, "menses": n_menses,
        "particular": n_part, "peculiar": n_pec,
        "verdict": verdict, "notes": notes,
        "kent_quote": "ذہنی علامات سب سے اعلیٰ درجہ رکھتی ہیں؛ اُن کے بعد بطورِ مجموعی جنرل "
                      "(گرمی/سردی، موسم، وقت)؛ پھر خواہشات و نفرتیں؛ پارٹیکولر آخر میں۔",
    }
    return {
        "completeness": completeness,
        "graded": graded,
        "weights": {g["symptom"]: _GRADE_WEIGHT.get(g["grade"], 1.0) for g in graded},
        "eliminating": eliminated,
        "contradictions": contradictions,
        "counts": counts,
        "order": [g["symptom"] for g in graded],
    }


if __name__ == "__main__":
    import sys
    from homeo_core.engine.word_policy import _find_repo_root
    repo = _find_repo_root(Path(sys.argv[1] if len(sys.argv) > 1 else "."))
    prof = build_thermal_profile(repo)
    print("دوا کی گرم/سرد شناخت (ریپرٹری سے):")
    for rem in ("ars", "phos", "nux-v", "sep", "puls", "sulph", "lyc", "lach", "nat-m", "calc", "sil", "bell"):
        print(f"   {rem:8s} → {thermal_lean(prof, rem)}")
