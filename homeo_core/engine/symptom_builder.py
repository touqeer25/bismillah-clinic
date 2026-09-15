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
            m = re.search(r"\b(after|before|during|by|since|because of)\s+([a-z ]{3,24})", raw)
            if m:
                parts["causation"].append(f"{m.group(2).strip()} ({m.group(1)})")
        return {k: v for k, v in parts.items() if v}

    # ---------- اہم خانے خالی ہوں تو سوال ----------
    def questions(self, text: str, parts: Dict[str, List[str]]) -> List[str]:
        q: List[str] = []
        has_anchor = bool(parts.get("location") or parts.get("complaint") or parts.get("sensation"))
        if not has_anchor:
            q.append(f"«{text[:40]}» — یہ کس عضو/شکایت کی بات ہے؟ (مقام)")
        if not parts.get("sensation") and parts.get("location"):
            q.append(f"«{text[:40]}» — «{parts['location'][0]}» میں کیا احساس ہے؟ (سینسیشن)")
        if not parts.get("modality") and not parts.get("amel_agg"):
            q.append(f"«{text[:40]}» — کس حالت میں بڑھتا/کم ہوتا ہے؟ (موڈیلٹی/کمی زیادتی)")
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


def build_symptoms(items: List[str], vocab=None, max_attach: int = 3) -> dict:
    """ٹکڑوں کی فہرست → مکمل علامات (اجزاء + خالی خانوں کے سوالات)"""
    B = SymptomBuilder()
    # 1) صفائی + مکرر ہٹانا
    seen, phrases = set(), []
    for it in items:
        t = " ".join(str(it or "").split())
        if not t:
            continue
        key = tuple(sorted(_toks(t)))
        if not key or key in seen:
            continue
        seen.add(key)
        phrases.append(t)

    # 2) جو ٹکڑا کسی بڑی علامت کے اندر مکمل موجود ہے — الگ نہ گنیں
    tset = [set(_toks(p)) for p in phrases]
    keep: List[bool] = [True] * len(phrases)
    for i, p in enumerate(phrases):
        if not tset[i]:
            keep[i] = False
            continue
        for j, q in enumerate(phrases):
            if i == j or not keep[i]:
                continue
            if tset[i] < tset[j]:          # مکمل طور پر اندر موجود (dup)
                keep[i] = False
            elif tset[i] == tset[j] and i > j:
                keep[i] = False
    phrases = [p for p, k in zip(phrases, keep) if k]
    tset = [set(_toks(p)) for p in phrases]

    # 3) ٹکڑے (بغیر لنگر) کو گھر (host) میں ضم کرنا — «جُڑے ٹکڑوں کی قطار» کا قاعدہ
    def anchored(p: str) -> bool:
        for w in _toks(p):
            if B.role(w) in ("complaint", "location", "sensation"):
                return True
        return False

    STOPFILL = {"on", "at", "of", "the", "a", "an", "in", "to", "from", "by", "with", "and",
                "as", "if", "for", "is", "are", "was", "were", "it", "its", "his", "her",
                "then", "than", "they", "their", "feels", "feel", "feeling", "seems", "seems",
                "times", "time", "especially", "frequent", "frequently", "very", "much", "more",
                "down", "up", "back", "about", "over", "under", "after", "before", "during",
                "coming", "brings", "brought", "cannot", "can", "will", "not", "no", "first",
                "both", "each", "other", "same", "all", "any", "some", "day", "days"}
    # نفی/آرام والی موڈیلٹی اپنی علامت ہوتی ہے (cannot lie down، can lie best left side)
    _NEG_MOD_RX = re.compile(r"\b(cannot|can not|will not|unable|has to|must)\b", re.I)
    _AMEL_SELF_RX = re.compile(r"\b(best|better|ameliorat|reliev|comfortable|prefer)\b", re.I)

    def meaningful(p: str) -> set:
        return {w for w in _toks(p) if w not in STOPFILL}

    # نسبتی الفاظ — یہ پہلے بتائی گئی علامت کی تشریح ہوتے ہیں، نئی علامت نہیں
    _COMPARATIVE_RX = re.compile(
        r"\b(more|less|worse than|better than|than they were|than before|than usual|"
        r"again|still|as before|as usual)\b", re.I)

    def own_symptom(p: str) -> bool:
        toks = _toks(p)
        roles = [B.role(t) for t in toks]
        has_loc = "location" in roles
        has_name = any(r in ("complaint", "location", "sensation") for r in roles)
        # (ب) نئے اکیسے نام — مگر صرف دماغی لفظ اکیلا نہیں (وہ عموماً وجہ ہوتا ہے)
        if len(toks) == 1 and has_name:
            if roles[0] == "complaint" and toks[0] in B.MENT:
                return False
            return True
        # (ا) مقام + کوئی دوسرا جزو → اپنی مکمل علامت
        if has_loc and any(r in ("complaint", "sensation", "modality") for r in roles):
            return True
        # (ج) نفی والی موڈیلٹی یا آرام کی بات → اپنی علامت
        if _NEG_MOD_RX.search(p) or _AMEL_SELF_RX.search(p):
            return True
        # (د) شکایت/احساس + کیفیت — مگر نسبتی الفاظ والی بات پرانی علامت کی تشریح ہے
        if has_name and not _COMPARATIVE_RX.search(p):
            if _AGG_RX.search(p) or _AMEL_RX.search(p) or len([r for r in roles if r]) >= 2:
                return True
        return False

    hosts: List[dict] = []
    frag_run_host: Optional[int] = None      # جُڑے ٹکڑوں کی قطار کا گھر
    prev_src: Optional[int] = None
    for idx, p in enumerate(phrases):
        if own_symptom(p):
            hosts.append({"text": p, "extra": [], "src": [idx]})
            frag_run_host = None
            prev_src = idx
            continue
        # ٹکڑا: (1) اُس گھر میں جس کے اصل الفاظ ملتے ہیں
        target = None
        mt = meaningful(p)
        best_overlap = 0
        for hi in range(len(hosts)):
            ov = len(mt & meaningful(hosts[hi]["text"]))
            if ov > best_overlap:
                best_overlap, target = ov, hi
        # (2) ورنہ پچھلی قطار کا گھر
        if target is None and frag_run_host is not None and prev_src is not None and idx - prev_src <= 3:
            target = frag_run_host
        # (3) ورنہ قریب ترین مکمل علامت
        if target is None and hosts:
            target = min(range(len(hosts)),
                         key=lambda hi: min(abs(idx - sr) for sr in hosts[hi]["src"]))
        if target is not None:
            hosts[target]["extra"].append(p)
            hosts[target]["src"].append(idx)
            frag_run_host = target
        else:
            hosts.append({"text": p, "extra": [], "src": [idx]})
            frag_run_host = len(hosts) - 1
        prev_src = idx

    # 4) اجزاء نکالنا + سوالات
    out = []
    for h in hosts:
        text = h["text"] + (", " + ", ".join(h["extra"]) if h["extra"] else "")
        parts = B.components(text)
        out.append({
            "symptom": h["text"],
            "complete": text,
            "parts": parts,
            "questions": B.questions(h["text"], parts),
            "merged": h["extra"],
            "score": len([k for k in parts if k in ("location", "sensation", "modality",
                                                    "side", "amel_agg", "extension")]),
        })
    out.sort(key=lambda x: -x["score"])
    seen_q, questions = set(), []
    for sy in out:
        for q in sy["questions"]:
            if q not in seen_q:
                seen_q.add(q)
                questions.append(q)
    return {"symptoms": out, "questions": questions,
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
