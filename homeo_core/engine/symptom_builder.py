# -*- coding: utf-8 -*-
"""
symptom_builder.py — نسخہ 3.6
«علامات جمع کرنا نہیں — مکمل کرنا»

مریض کی کیس ہسٹری سے جو ٹکڑے نکلتے ہیں (کاما/سطر سے)، وہ اکیلے مکمل علامت نہیں ہوتے۔
معالج بھی کیس لیتے وقت علامت کو مکمل کرتا ہے، یعنی اُس کے اجزاء طے کرتا ہے:

    مقام (location) · سینسیشن (sensation) · موڈیلٹی (modality) · سمت (side)
    کمی/زیادتی (amel/agg) · پھیلاؤ (extension) · ہمراہ (concomitant) · وجہ (causation)

یہ ماڈیول:
  1) ٹکڑوں کو جوڑتا ہے (ٹکڑا اپنی اصل علامت میں ضم ہوتا ہے)
  2) مکرر ٹکڑے ہٹاتا ہے (جو کسی بڑی علامت کے اندر پہلے سے موجود ہیں)
  3) ہر مکمل علامت کے اجزاء کے خانے بھرتا ہے
  4) جو خانہ خالی رہے، اُس کے لیے معالج/مریض سے پوچھنے والا سوال بناتا ہے

نتیجہ: مکمل علامات → پھر ربرکس (پہلے فائل نہیں، پہلے مکمل علامت)۔
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

try:
    from homeo_core.engine import rubric_grammar as _RG
except Exception:  # احتیاط
    _RG = None


# ------------------------------------------------------------------ #
# 1) اجزاء کی نشانیاں (ربرک گرامر کی لغتوں سے + چند اضافی)
# ------------------------------------------------------------------ #
def _voc(name: str) -> set:
    if _RG is None:
        return set()
    return {str(k).lower() for k in getattr(_RG, name, {}) or {}}


_EXTRA_LOCATION = {
    "heart", "apex", "occiput", "spine", "back", "chest", "leg", "legs", "knee", "knees",
    "toe", "toes", "finger", "fingers", "thumb", "throat", "mouth", "teeth", "tooth", "axilla",
    "arm", "arms", "hand", "hands", "foot", "feet", "head", "abdomen", "stomach", "eye", "eyes",
    "ear", "ears", "nose", "face", "neck", "shoulder", "skin", "chest", "diaphragm", "sides",
    "side", "mammae", "breast", "navel", "kidney", "kidneys", "bladder", "uterus",
}
_EXTRA_SENSATION = {
    "drawn", "drawing", "numb", "numbness", "coldness", "cold", "heat", "warmth", "squeezed",
    "squeezing", "stopped", "stopping", "rushing", "rush", "trembling", "tremor", "chattering",
    "shivering", "shuddering", "groaning", "moaning", "weakness", "weak", "palpitation",
    "dyspnoea", "dyspnea", "spasms", "pain", "pains", "aching", "soreness", "burning", "itching",
    "dryness", "thirst", "hunger", "vertigo", "dizziness", "faintness", "weight", "heaviness",
}
_EXTRA_COMPLAINT = {
    "attacks", "attack", "palpitation", "dyspnoea", "dyspnea", "spasm", "spasms", "breath",
    "breathing", "vomiting", "retching", "cough", "sneezing", "menses", "menstruation",
    "stool", "urine", "urination", "sleep", "sleeplessness", "eruption", "rash", "fever",
    "chill", "chilliness", "perspiration", "sweat", "hiccough", "yawning", "sighing",
}
_EXTRA_MODALITY = {
    "lying", "lie", "sitting", "sit", "standing", "walking", "motion", "rest", "talking",
    "eating", "drinking", "sleeping", "waking", "pressure", "touch", "exertion", "stool",
    "urination", "menses", "coughing", "sneezing", "swallowing", "breathing", "inspiration",
    "expiration", "climbing", "ascending", "descending", "stooping", "carrying", "noise",
    "light", "air", "cold", "warmth", "heat", "storm", "night", "day", "morning", "evening",
}
_EXTRA_TIME = {"morning", "evening", "night", "midnight", "noon", "afternoon", "day", "days",
               "hours", "minutes", "periodical", "periodic", "intervals", "regular", "irregular",
               "frequent", "frequently", "sometimes", "always", "sudden", "gradual", "slow", "fast"}

# وجہ (causation) — یہ الفاظ «کیوں/کب سے» بتاتے ہیں
_CAUSE_MARK = ("after", "before", "during", "from", "by", "since", "because", "on", "at", "coming", "brought")
# «کب» — عرصہ، وقفہ، بار بار ہونا
_WHEN_RX = re.compile(
    r"for\s+\w+\s+(?:year|years|month|months|week|weeks|day|days)"
    r"|for\s+\d+|since\s+\w+|\w+\s+years?|\d+\s*years?"
    r"|irregular intervals|at intervals|regular intervals|periodical|periodic"
    r"|frequent|frequently|at times|sometimes|often|always|daily|nightly"
    r"|morning|evening|night|midnight|noon|afternoon"
    r"|now more severe|now worse|now better|sudden|gradually|thirteen years", re.I)
# وجہ صرف وہی مناسبے جو واقعی وجہ بتاتے ہیں (وقت/پھیلاؤ والے «from/on» نہیں)
_WHY_RX = re.compile(
    r"(?:brought on by|coming on after|first coming on after|due to|because of|after|before|since)"
    r"\s+([a-z]{3,24})", re.I)
_WHY_LEAD_RX = re.compile(r"([a-z]{3,24})\s+(?:brings? on|brought on|causes?|excites?)\s+", re.I)
_HOW_RX = re.compile(
    r"(lying|lie|sitting|sit|standing|walking|motion|rest|talking|eating|drinking|sleeping|"
    r"exertion|pressure|touch|climbing|stooping|swallowing|breathing|on the|during|while|"
    r"with|when|as if|feels as if|sensation)", re.I)
# کمی/زیادتی
_AGG_RX = re.compile(r"(worse|worst|aggravat|agg\b|more severe|increas|brings? on|brought on|violent|intense|severe)", re.I)
_AMEL_RX = re.compile(r"(better|best|ameliorat|amel\b|reliev|eases?|comfortable|prefer)", re.I)
# پھیلاؤ
_EXT_RX = re.compile(r"\b(from|to|extending|extends|down|up|upward|downward|spreading|radiat|towards?|into)\b", re.I)
# ہمراہ (concomitant)
_CONC_RX = re.compile(r"\b(with|along with|accompanied)\b", re.I)


def _norm(t: str) -> str:
    return re.sub(r"[^a-zæœß]", "", str(t or "").lower())


def _stem(w: str) -> str:
    w = _norm(w)
    for suf in ("ings", "ing", "edly", "ed", "ness", "es", "s"):
        if len(w) > 4 and w.endswith(suf):
            return w[: -len(suf)]
    return w


# ------------------------------------------------------------------ #
# 2) اجزاء نکالنا
# ------------------------------------------------------------------ #
class SymptomBuilder:
    """ٹکڑوں کو مکمل علامات میں ڈھالتا ہے (اجزاء کے خانوں کے ساتھ)"""

    def __init__(self) -> None:
        self.LOC = _voc("LOCATION_UR") | _EXTRA_LOCATION
        self.SENS = _voc("SENSATION_UR") | _EXTRA_SENSATION
        self.MOD = _voc("MODALITY_UR") | _EXTRA_MODALITY
        self.TIME = _voc("TIME_UR") | _EXTRA_TIME
        self.COMP = _voc("COMPLAINT_UR") | _EXTRA_COMPLAINT
        self.MENT = _voc("MENTAL_UR")

    # ---------- الفاظ کے کردار ----------
    def role(self, word: str) -> str:
        w = _norm(word)
        if not w:
            return ""
        if w in self.COMP or w in self.MENT:
            return "complaint"
        if w in self.LOC:
            return "location"
        if w in self.SENS:
            return "sensation"
        if w in self.MOD:
            return "modality"
        if w in self.TIME:
            return "time"
        st = _stem(w)
        for voc, name in ((self.COMP, "complaint"), (self.LOC, "location"),
                          (self.SENS, "sensation"), (self.MOD, "modality"), (self.TIME, "time")):
            for k in voc:
                if _stem(k) == st and len(st) >= 4:
                    return name
        return ""

    # ---------- ایک علامت کے اجزاء کے خانے ----------
    def components(self, text: str) -> Dict[str, List[str]]:
        words = [w for w in re.split(r"[^A-Za-zæœß'-]+", str(text)) if w]
        raw = str(text).lower()
        parts: Dict[str, List[str]] = {
            "location": [], "sensation": [], "modality": [], "side": [], "time": [],
            "complaint": [], "causation": [], "amel_agg": [], "extension": [], "concomitant": [],
            "how": [], "when": [], "why": [],
        }
        for w in words:
            r = self.role(w)
            if r and w.lower() not in parts[r]:
                parts[r].append(w)
        # سمت
        for sd in ("left", "right"):
            if re.search(r"\b" + sd, raw) and sd not in parts["side"]:
                parts["side"].append(sd)
        # کمی/زیادتی
        if _AGG_RX.search(raw):
            parts["amel_agg"].append("بڑھتا/زیادہ (agg)")
        if _AMEL_RX.search(raw):
            parts["amel_agg"].append("کم/بہتر (amel)")
        # پھیلاؤ
        if _EXT_RX.search(raw):
            m = re.search(r"from\s+([a-z ]{3,20}?)\s+to\s+([a-z ]{3,20})", raw)
            if m:
                parts["extension"].append(f"{m.group(1).strip()} سے {m.group(2).strip()} تک")
            else:
                parts["extension"].append("پھیلاؤ کا ذکر موجود")
        # ہمراہ
        if _CONC_RX.search(raw):
            m = re.search(r"\bwith\s+([a-z ,-]{3,40})", raw)
            parts["concomitant"].append(m.group(1).strip() if m else "ہمراہ ذکر موجود")
        # وجہ (پھیلاؤ والے «from A to B» کو وجہ نہ سمجھیں)
        if not re.search(r"from\s+[a-z ]{3,20}?\s+to\s+[a-z ]{3,20}", raw):
            m = re.search(r"\b(after|before|since|because of|brought on by|coming on after)\s+([a-z ]{3,24})", raw)
            if m:
                parts["causation"].append(f"{m.group(2).strip()} ({m.group(1)})")
        # ---- کیسے / کب / کیوں (how / when / why) ----
        # «کیسے» — علامت کن حالتوں میں ہوتی/بدلتی ہے
        if parts["modality"]:
            parts["how"].append("، ".join(parts["modality"]))
        if parts["amel_agg"]:
            parts["how"].extend(parts["amel_agg"])
        if parts["concomitant"]:
            parts["how"].append("ہمراہ: " + "، ".join(parts["concomitant"]))
        # «کب» — عرصہ/وقفہ/وقت
        for m in re.findall(_WHEN_RX, raw):
            m = " ".join(str(m).split())
            if m and m.lower() not in [x.lower() for x in parts["when"]]:
                parts["when"].append(m)
        if parts["time"]:
            joined = " ".join(parts["when"]).lower()
            for t in parts["time"]:
                t = str(t).lower()
                if t in ("on", "at", "in", "of") or t in joined:
                    continue
                parts["when"].append(t)
        # «کیوں» — وجہ/مناسبہ
        for m in _WHY_RX.finditer(raw):
            why = m.group(1).strip()
            if why in ("the", "a", "an") or why in parts["why"]:
                continue
            parts["why"].append(why)
        for m in _WHY_LEAD_RX.finditer(raw):      # «excitement brings on…»
            why = m.group(1).strip()
            if self.role(why) in ("location", "modality", "time", "sensation"):
                continue                          # «side brings on» جیسی بات سبب نہیں
            if why not in parts["why"]:
                parts["why"].append(why + " (سبب)")
        if parts["causation"]:
            for c in parts["causation"]:
                if c not in parts["why"]:
                    parts["why"].append(c)
        return {k: v for k, v in parts.items() if v}

    # ---------- اہم خانے خالی ہوں تو سوال ----------
    def questions(self, text: str, parts: Dict[str, List[str]]) -> List[str]:
        q: List[str] = []
        short = text[:40]
        has_anchor = bool(parts.get("location") or parts.get("complaint") or parts.get("sensation"))
        if not has_anchor:
            q.append(f"«{short}» — یہ کس عضو/شکایت کی بات ہے؟ (مقام)")
        if not parts.get("sensation") and parts.get("location"):
            q.append(f"«{short}» — «{parts['location'][0]}» میں کیا احساس ہے؟ (سینسیشن)")
        # کیسے (how)
        if not parts.get("how"):
            q.append(f"«{short}» — کیسے؟ کس حالت میں (لیٹنے/بیٹھنے/بات کرنے/کھانے…) بڑھتا یا کم ہوتا ہے؟ (how)")
        # کب (when)
        if not parts.get("when"):
            q.append(f"«{short}» — کب؟ کس وقت/وقفے سے ہوتا ہے، اور کتنے عرصے سے؟ (when)")
        # کیوں (why)
        if not parts.get("why"):
            q.append(f"«{short}» — کیوں؟ کس وجہ/مناسبے سے ہوتا ہے؟ (why)")
        sided = ("arm", "leg", "hand", "foot", "eye", "ear", "cheek", "breast", "mamma",
                 "kidney", "ovary", "shoulder", "knee", "toe", "finger", "thigh", "axilla")
        if (not parts.get("side") and parts.get("location")
                and any(str(w).lower() in sided for w in parts.get("location", []))):
            q.append(f"«{text[:40]}» — کون سی سمت؟ (دایاں/بایاں یا دونوں)")
        return q


# ------------------------------------------------------------------ #
# 3) ٹکڑوں کو جوڑنا اور مکرر ہٹانا
# ------------------------------------------------------------------ #
def _toks(text: str) -> List[str]:
    return [_norm(w) for w in re.split(r"[^A-Za-zæœß'-]+", str(text)) if len(_norm(w)) > 1]


def _narrative_tokens() -> set:
    """کیس ہسٹری/معائنے کے الفاظ (ربرک نہیں بنتے)"""
    try:
        from homeo_core.engine.word_policy import _NARRATIVE_WORDS
        return set(_NARRATIVE_WORDS)
    except Exception:
        return set()


_NARR_RX = re.compile(
    r"\b(auscultation|x-?ray|ultrasound|ecg|ekg|examination|examined|report|test|scan|"
    r"investigation|diagnosis|allopathic|no organic|organic lesion|no lesion)\b", re.I)
# وجہ/عرصہ والے فقرے — یہ نئی علامت نہیں، کسی علامت کی تفصیل ہیں
_CAUSE_CLAUSE_RX = re.compile(
    r"^\s*(?:first\s+)?(?:coming on|brought on|due to|because of|since|for\s+\d|for\s+\w+\s+year)", re.I)
_FRAG_RX = re.compile(r"^\s*(?:irregular|regular|at)\s+intervals|^\s*(?:more|less|now)\b", re.I)
_NEG_MOD = re.compile(r"\b(cannot|can not|will not|unable|has to|must)\b", re.I)
_AMEL_SELF = re.compile(r"\b(best|better|ameliorat|reliev|comfortable|prefer)\b", re.I)
_CAUSE_VERB = re.compile(r"(brings? on|brought on|causes?|excites?|produc(?:es|ed))", re.I)

# نسخہ 4.2: دماغی علامتیں اپنی الگ علامت ہیں — کسی اور علامت میں نہیں جڑتیں
# (کینٹ: «نمایاں ذہنی علامت بہت سی کمزور علامتوں کو رد کر دیتی ہے»)
_MIND_RX = re.compile(
    r"\b(suspici|offen[dc]|fidget|depress|indifferen|fear|afraid|anxiet|anxious|dread|"
    r"irritab|impatien|discontent|hurr|hasty|weep|crying|cry|sad|grief|anger|angry|jealous|"
    r"envy|mood|excitable|excite|sensitiv|consolation|cheerful|hopeless|despair|restless|"
    r"quick tempered|compan|alone|delusion|memor|concentrat|confus|absent|delir)", re.I)
# جو فقرہ موڈیلٹی (بڑھنا/کم ہونا/وقت/حالت) سے شروع ہو وہ ٹکڑا ہے، اپنی علامت نہیں
_MOD_START_RX = re.compile(
    r"^\s*(?:better|worse|ameliorat|aggravat|<|>|at\s+\d|from|after|before|during|on\s+|in\s+|with\s+|when\b)", re.I)
_QUALIFIER_ONLY = {"irregular", "regular", "intervals", "offensive", "offensiv", "gradually",
                   "sometimes", "often", "occasionally", "always", "never", "again", "still",
                   "somewhat", "rather", "quite", "very", "much", "slight", "severe", "violent",
                   "great", "little", "less", "more", "now", "then", "afterwards", "offensive,"}

_STOPFILL = {"on", "at", "of", "the", "a", "an", "in", "to", "from", "by", "with", "and",
             "as", "if", "for", "is", "are", "was", "were", "it", "its", "his", "her",
             "then", "than", "they", "their", "feels", "feel", "feeling", "seems", "times",
             "time", "especially", "frequent", "frequently", "very", "much", "more", "down",
             "up", "back", "about", "over", "under", "after", "before", "during", "coming",
             "brings", "brought", "cannot", "can", "will", "not", "no", "first", "both",
             "each", "other", "same", "all", "any", "some", "day", "days", "subject", "now",
             "severe", "violent", "slight", "great", "about", "into"}


def _meaningful(toks: List[str], B: "SymptomBuilder") -> set:
    out = set()
    for t in toks:
        if t in _STOPFILL or len(t) <= 2:
            continue
        out.add(t)
    return out


def _key_of(text: str, B: "SymptomBuilder"):
    """علامت کا موضوع: شکایت (ترجیحاً غیر دماغی) یا عضو+احساس یا موڈیلٹی (نفی/آرام کے ساتھ)"""
    toks = _toks(text)
    roles = [B.role(t) for t in toks]
    raw = str(text).lower()
    # «excitement brings on palpitation» — «excitement» وجہ ہے، شکایت نہیں
    drop = set()
    for m in _CAUSE_VERB.finditer(raw):
        before = raw[: m.start()].strip().split()
        for w in before[-2:]:
            drop.add(_norm(w))
    # ذہنی/جذباتی علامت — اپنی علامت (درجہ 1)
    mm = _MIND_RX.search(raw)
    if mm and not re.search(r"\b(craves?|craving|desires?|aversion|averse|loathes?|dislikes?)\b", raw):
        return ("m", mm.group(1).lower())
    comps = [t for t, r in zip(toks, roles) if r == "complaint" and t not in drop]
    locs = [t for t, r in zip(toks, roles) if r == "location"]
    sens = [t for t, r in zip(toks, roles) if r == "sensation"]
    mods = [t for t, r in zip(toks, roles) if r == "modality"]
    # خواہش/نفرت اپنی علامت ہے (درجہ 3)
    m = re.search(r"\b(craves?|craving|desires?|aversion|averse|loathes?|dislikes?)\b\s*([a-z-]+)?", raw)
    if m and m.group(2):
        return ("cr", m.group(2))
    if comps:
        return ("c", comps[0])
    if locs and sens:
        return ("ls", locs[0], sens[0])
    if locs:
        return ("l", locs[0])
    if sens:
        return ("s", sens[0])
    if mods and (_NEG_MOD.search(text) or _AMEL_SELF.search(text)):
        pol = "neg" if _NEG_MOD.search(text) else "amel"
        return ("m", mods[0], pol)
    # آخری سہارا: موڈیلٹی/حالت سے شروع نہ ہو اور کوئی بامعنی لفظ ہو → اپنا موضوع
    if not _MOD_START_RX.match(raw):
        for t in toks:
            if t in _STOPFILL or t in _QUALIFIER_ONLY or len(t) <= 2:
                continue
            return ("x", t)
    return None


def build_symptoms(items: List[str], vocab=None, max_attach: int = 3) -> dict:
    """ٹکڑوں کی فہرست → مکمل علامات
    (مقام · سینسیشن · موڈیلٹی · سمت · کمی/زیادتی · پھیلاؤ + کیسے/کب/کیوں)"""
    B = SymptomBuilder()
    narr_words = _narrative_tokens()

    # ---------- (0) صفائی، مکرر ہٹانا، اور «کیس ہسٹری» الگ کرنا ----------
    seen, phrases, narratives = set(), [], []
    for it in items:
        t = " ".join(str(it or "").split())
        if not t:
            continue
        key = tuple(sorted(_toks(t)))
        if not key or key in seen:
            continue
        seen.add(key)
        toks = _toks(t)
        n_ratio = (sum(1 for w in toks if w in narr_words) / max(1, len(toks)))
        if _NARR_RX.search(t) and not B.role(toks[0] if toks else ""):
            narratives.append(t)
            continue
        phrases.append(t)

    # ---------- (1) مکمل علامتیں (ایک موضوع = ایک مکمل علامت) ----------
    groups: Dict[tuple, List[int]] = {}
    frag_idx: List[int] = []
    for idx, ph in enumerate(phrases):
        if _CAUSE_CLAUSE_RX.search(ph) or _FRAG_RX.search(ph):
            frag_idx.append(idx)
            continue
        k = _key_of(ph, B)
        if k is None:
            frag_idx.append(idx)
            continue
        groups.setdefault(k, []).append(idx)

    hosts: List[dict] = []
    for k, idxs in groups.items():
        # سب سے مختصر اور بامعنی فقرہ = مکمل علامت کا نام (باقی اُس کی تفصیل)
        def rank(ix):
            toks = _toks(phrases[ix])
            r = [B.role(t) for t in toks]
            return (0 if ("location" in r and "complaint" in r) else 1, len(toks))
        main = sorted(idxs, key=rank)[0]
        extras = [phrases[ix] for ix in idxs if ix != main]
        hosts.append({"text": phrases[main], "extra": extras, "src": list(idxs), "key": k})

    # ---------- (2) ٹکڑے: قریب ترین مکمل علامت میں ----------
    for ix in frag_idx:
        if not hosts:
            hosts.append({"text": phrases[ix], "extra": [], "src": [ix], "key": None})
            continue
        tgt = min(range(len(hosts)),
                  key=lambda hi: min(abs(ix - sr) for sr in hosts[hi]["src"]))
        hosts[target if False else tgt]["extra"].append(phrases[ix])
        hosts[tgt]["src"].append(ix)

    # ---------- (2.5) جو مکمل علامت دوسری کے اندر سما جائے → یکجا ----------
    i = 0
    while i < len(hosts):
        ti = _meaningful(_toks(hosts[i]["text"]), B)
        merged = False
        for j in range(len(hosts)):
            if i == j:
                continue
            tj = _meaningful(_toks(hosts[j]["text"]), B)
            if ti and tj and ti <= tj:
                hosts[j]["extra"].append(hosts[i]["text"])
                hosts[j]["extra"].extend(hosts[i]["extra"])
                hosts[j]["src"].extend(hosts[i]["src"])
                hosts.pop(i)
                merged = True
                break
        if not merged:
            i += 1

    # ---------- (3) اجزاء + کیسے/کب/کیوں + سوالات ----------
    out = []
    for h in hosts:
        extra = [e for e in dict.fromkeys(h["extra"]) if e]      # مکرر ہٹائیں
        text = h["text"] + (", " + ", ".join(extra) if extra else "")
        parts = B.components(text)
        out.append({
            "symptom": h["text"],
            "complete": text,
            "parts": parts,
            "questions": B.questions(h["text"], parts),
            "merged": extra,
            "hww": {"how": parts.get("how", []), "when": parts.get("when", []), "why": parts.get("why", [])},
            "hww_ok": int(bool(parts.get("how"))) + int(bool(parts.get("when"))) + int(bool(parts.get("why"))),
            "score": (3 if (parts.get("location") and parts.get("sensation")) else 0)
                     + (2 if parts.get("modality") else 0)
                     + int(bool(parts.get("how"))) + int(bool(parts.get("when"))) + int(bool(parts.get("why"))),
        })
    out.sort(key=lambda x: (-x["hww_ok"], -x["score"]))
    seen_q, questions = set(), []
    for sy in out:
        for q in sy["questions"]:
            if q not in seen_q:
                seen_q.add(q)
                questions.append(q)
    return {"symptoms": out, "questions": questions, "narrative": narratives,
            "raw_count": len(items), "complete_count": len(out)}


# ------------------------------------------------------------------ #
# 4) سادہ آزمائش: python3 homeo_core/engine/symptom_builder.py
# ------------------------------------------------------------------ #
if __name__ == "__main__":
    import sys
    from homeo_core.engine.word_policy import RepertoryVocabulary
    repo = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
    raw = [l.strip() for l in sys.stdin.read().splitlines() if l.strip()]
    v = RepertoryVocabulary(repo)
    res = build_symptoms(raw, v)
    print(f"ٹکڑے: {res['raw_count']} → مکمل علامات: {res['complete_count']}")
    for s in res["symptoms"]:
        print(f"\n■ {s['symptom']}")
        if s["merged"]:
            print(f"   ضم ہوئے ٹکڑے: {' | '.join(s['merged'])}")
        for k, vv in s["parts"].items():
            print(f"   {k:12s}: {'، '.join(vv)}")
        for q in s["questions"]:
            print(f"   ❓ {q}")
