# -*- coding: utf-8 -*-
"""
word_policy.py — «لفظ بلفظ» کی پالیسی (نسخہ 3.2)
=================================================
⚠️ یہ ماڈیول صارف کی اُس اصولی ہدایت پر بنا ہے:

    «میٹیریا میڈیکا اور خاص کر ریپرٹری میں درج ربرکس کے الفاظ کا چناؤ بہت سوچ سمجھ کر
     اور پروور (جس پر دواؤں کی پروونگ کی گئی) کے احساسات ہوتے ہیں۔ اس لیے اُن الفاظ کے
     synonyms بنانا بھی غلط پریکٹس ہے۔ اسی لیے کیس ٹیکنگ میں مریض کے بولے گئے الفاظ کو
     اہمیت دی جاتی ہے اور کیس مریض کے الفاظ میں ہی لکھنے کی پابندی لاگو کی جاتی ہے…
     الفاظ کا ترجمہ کرتے وقت معنی اُسی لفظ کے لینے ہیں، نہ کہ کسی مترادف لفظ کے۔»

اِس کا کوڈ پر مطلب — تین اجازتیں، اور ایک پابندی:

    ✅ اجازت 1: ہجے (spelling) کی مختلف صورتیں — یہ «مترادف» نہیں، ایک ہی لفظ ہے
               (dyspnoea / dyspnea ، diarrhoea / diarrhea ، œ / oe)
    ✅ اجازت 2: ایک ہی لفظ کی شکلیں — واحد/جمع، اور فعل کی صرفی صورتیں
               (tooth/teeth ، pain/pains ، squeeze/squeezed/squeezing)
    ✅ اجازت 3: ریپرٹری کے اپنے مخففات — ریپرٹری خود لکھتی ہے «agg.» یعنی aggravated
               (worse → agg. ، better → amel. — یہ ریپرٹری کی اپنی زبان ہے)
    ⛔ پابندی : کوئی لفظ کسی دوسرے لفظ کا «ہم معنی» نہیں بنایا جائے گا
               (sadness ≠ grief ، rage ≠ anger ، cool ≠ cold ، insomnia ≠ sleeplessness
                dizzy ≠ vertigo ، tired ≠ fatigue ، movement ≠ motion ، belly ≠ abdomen)

اور اگر مریض کا لفظ ریپرٹری میں موجود ہی نہ ہو تو انجن **چپکے سے بدلے گا نہیں** —
وہ اُسے «غیر موجود لفظ» کی فہرست میں ڈالے گا اور معالج کو بتائے گا، فیصلہ معالج کا۔
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

# ------------------------------------------------------------------ #
# 1) ہجے کی مختلف صورتیں — ایک ہی لفظ، مختلف لکھاوٹ (یہ مترادف نہیں)
# ------------------------------------------------------------------ #
SPELLING_VARIANTS: Dict[str, str] = {
    # ligature (کینٹ کی چھپی کتابوں کی لکھاوٹ)
    "œ": "oe", "æ": "ae", "ß": "ss",
    # برٹش/امریکن ہجے
    "dyspnea": "dyspnoea", "dyspnoea": "dyspnoea",
    "diarrhea": "diarrhoea", "diarrhoea": "diarrhoea",
    "hemorrhage": "haemorrhage", "haemorrhage": "haemorrhage",
    "hemorrhoids": "haemorrhoids", "haemorrhoids": "haemorrhoids",
    "edema": "oedema", "oedema": "oedema",
    "esophagus": "oesophagus", "oesophagus": "oesophagus",
    "anemia": "anaemia", "anaemia": "anaemia",
    "color": "colour", "colour": "colour",
    "tumor": "tumour", "tumour": "tumour",
    "fetus": "foetus", "foetus": "foetus",
    "mammae": "mammae", "mammæ": "mammae",
    "anaesthesia": "anaesthesia", "anesthesia": "anaesthesia",
}

# ایک ہی لفظ کی شکلیں (واحد/جمع، صرفی صورتیں) — نہ کہ ہم معنی
# نوٹ: صرف اُن صورتوں میں لکھی گئی ہے جہاں لفظ بالکل وہی رہتا ہے
SAME_WORD_FORMS: Dict[str, str] = {
    # واحد/جمع
    "pains": "pain", "aches": "ache", "tooth": "teeth", "feet": "foot",
    "fingers": "finger", "toes": "toe", "ears": "ear", "eyes": "eye",
    "gums": "gum", "nails": "nail", "knees": "knee", "hands": "hand",
    "legs": "leg", "arms": "arm", "cheeks": "cheek", "lips": "lip",
    "kinds": "kind", "sides": "side", "parts": "part", "spots": "spot",
    # ایک ہی فعل کی صورتیں
    "squeezed": "squeezing", "squeeze": "squeezing", "squeezes": "squeezing",
    "cease": "ceasing", "ceased": "ceasing", "ceases": "ceasing",
    "lie": "lying", "lies": "lying", "lied": "lying",
    "sits": "sitting", "sat": "sitting",
    "walks": "walking", "walked": "walking",
    "eats": "eating", "ate": "eating",
    "drinks": "drinking", "drank": "drinking",
    "sweats": "sweating", "sweated": "sweating",
    "coughs": "coughing", "coughed": "coughing",
    "vomits": "vomiting", "vomited": "vomiting",
    "trembles": "trembling", "trembled": "trembling",
    "swells": "swelling", "swelled": "swelling",
    "burns": "burning", "burnt": "burning",
    "itches": "itching", "itched": "itching",
    "weeps": "weeping", "wept": "weeping",
    "sleeps": "sleeping", "slept": "sleeping",
    "wakes": "waking", "woke": "waking",
    "puts": "putting", "gets": "getting", "got": "getting",
    # اسم/صفتیں ایک ہی لفظ کی
    "thirsty": "thirst", "sleepy": "sleepiness", "numbness": "numb",
    "weakness": "weak", "heaviness": "heavy", "soreness": "sore",
    "tiredness": "tired", "chilliness": "chilly",
}

# ریپرٹری کے اپنے مخففات (ریپرٹری خود اِنہیں لکھتی ہے: «motion agg.»)
REPERTORY_ABBREV: Dict[str, str] = {
    "aggravated": "agg", "aggravates": "agg", "aggravation": "agg",
    "aggravating": "agg", "worse": "agg", "worst": "agg",
    "ameliorated": "amel", "ameliorates": "amel", "amelioration": "amel",
    "ameliorating": "amel", "better": "amel", "relieved": "amel", "relief": "amel",
}

# ------------------------------------------------------------------ #
# 2) ریپرٹری کی اپنی لغت (vocabulary) — الفاظ یہاں سے لئے جاتے ہیں
# ------------------------------------------------------------------ #
class RepertoryVocabulary:
    """کینٹ اور سنتھیسس کے ربرکس سے بنی «ریپرٹری کی اپنی لغت»:
    کون سا لفظ ریپرٹری میں اصلًا موجود ہے، کتنے ربرکس میں، اور کس باب میں۔"""

    def __init__(self, repo_dir: Optional[Path] = None,
                 sources: Tuple[str, ...] = ("kent_chapters", "synthesis91_raw_chapters")):
        self.repo = Path(repo_dir or os.getenv("BISMILLAH_REPO", "/tmp/bc/repo"))
        self.sources = sources
        self.words: Dict[str, dict] = {}      # لفظ → {"n": تعداد, "ch": {باب: تعداد}}
        self.rubric_count = 0
        self._load()

    # ---------- لفظ کو معیاری شکل دینا (صرف ہجے اور شکلیں) ----------
    @staticmethod
    def normalize(word: str) -> str:
        w = str(word or "").strip().lower()
        w = re.sub(r"[^a-zæœßäöüéèáàâåçñ'-]", "", w)
        for k, v in SPELLING_VARIANTS.items():
            if len(k) == 1:
                w = w.replace(k, v)
        w = w.strip("-'")
        return w

    @classmethod
    def canon(cls, word: str) -> str:
        """معیاری شکل: ہجے + صرف ایک ہی لفظ کی شکلیں"""
        w = cls.normalize(word)
        # ہجے کی صورت
        w = SPELLING_VARIANTS.get(w, w)
        # صرفی صورت
        w = SAME_WORD_FORMS.get(w, w)
        return SPELLING_VARIANTS.get(w, w)

    # ---------- لغت بنانا ----------
    def _load(self) -> None:
        cache = self.repo / "homeo_core" / "data" / "repertory_vocabulary.json"
        if cache.exists():
            try:
                d = json.loads(cache.read_text(encoding="utf-8"))
                self.words = d.get("words", {})
                self.rubric_count = d.get("rubric_count", 0)
                if self.words:
                    return
            except Exception:
                pass
        self._build()
        try:
            cache.parent.mkdir(parents=True, exist_ok=True)
            cache.write_text(json.dumps(
                {"rubric_count": self.rubric_count, "words": self.words},
                ensure_ascii=False), encoding="utf-8")
        except Exception:
            pass

    def _build(self) -> None:
        for src in self.sources:
            d = self.repo / src
            if not d.exists():
                continue
            for f in d.glob("*.json"):
                if f.stem == "_index":
                    continue
                chapter = f.stem
                try:
                    data = json.loads(f.read_text(encoding="utf-8"))
                except Exception:
                    continue
                items = data if isinstance(data, list) else list(data.values())
                for v in items:
                    if not isinstance(v, dict):
                        continue
                    text = v.get("path") or v.get("t") or ""
                    if not text:
                        continue
                    self.rubric_count += 1
                    for raw in re.split(r"[^A-Za-zæœßäöüéèáàâåçñ'-]+", str(text)):
                        w = self.canon(raw)
                        if len(w) < 3:
                            continue
                        rec = self.words.get(w)
                        if rec is None:
                            self.words[w] = {"n": 1, "ch": {chapter: 1}}
                        else:
                            rec["n"] += 1
                            rec["ch"][chapter] = rec["ch"].get(chapter, 0) + 1

    # ---------- پوچھ گچھ ----------
    def has(self, word: str) -> bool:
        return self.canon(word) in self.words

    def count(self, word: str) -> int:
        return int(self.words.get(self.canon(word), {}).get("n", 0))

    def chapters(self, word: str) -> Dict[str, int]:
        return dict(self.words.get(self.canon(word), {}).get("ch", {}))

    def closest_spellings(self, word: str, limit: int = 5) -> List[str]:
        """صرف ہجے کے قریب الفاظ (معنی کے نہیں) — تاکہ لکھاوٹ کا فرق پکڑا جائے"""
        w = self.normalize(word)
        if not w:
            return []
        out = []
        for cand in self.words:
            if abs(len(cand) - len(w)) > 2:
                continue
            # حروف کی تبدیلی کی دوری (سادہ، تیز)
            d = _edit_distance(w, cand, maxd=2)
            if d <= 1 or (d == 2 and len(w) > 6):
                out.append((d, -self.words[cand]["n"], cand))
        out.sort()
        return [c for (_d, _n, c) in out[:limit]]

    def check_words(self, words: List[str]) -> dict:
        """مریض کے الفاظ کی جانچ — کون سا ریپرٹری میں ہے، کون سا نہیں
        (کوئی مترادف تجویز نہیں — صرف ہجے کی صورت اور حقیقت)"""
        found, missing = {}, {}
        for w in words:
            w = str(w).strip()
            if not w:
                continue
            c = self.canon(w)
            if c in self.words:
                found[w] = {"canon": c, "n": self.words[c]["n"],
                            "changed": (c != self.normalize(w))}
            else:
                missing[w] = {"canon": c, "spellings": self.closest_spellings(w)}
        return {"found": found, "missing": missing,
                "rubrics": self.rubric_count, "words": len(self.words)}


def _edit_distance(a: str, b: str, maxd: int = 2) -> int:
    """سادہ Levenshtein (تیز، اوپری حد کے ساتھ)"""
    if a == b:
        return 0
    if abs(len(a) - len(b)) > maxd:
        return maxd + 1
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        if min(cur) > maxd:
            return maxd + 1
        prev = cur
    return prev[-1]


# ------------------------------------------------------------------ #
# 3) ایک کیس کی «لفظ بلفظ» رپورٹ (معالج کے سامنے رکھنے کے لیے)
# ------------------------------------------------------------------ #
# ربرک بنانے کے لیے «درکار» اجزاء کی نشانیاں — اینٹھن/احساس/شرط
_COMPONENT_HINTS = {
    "sensation": ("pain", "ache", "burning", "itching", "numb", "weak", "cold", "heat",
                  "throbbing", "stitching", "pressing", "cramp", "drawing", "sore",
                  "ceasing", "palpitation", "trembling", "squeezing", "chattering"),
    "modality": ("lying", "sitting", "standing", "walking", "motion", "rest", "eating",
                 "drinking", "cough", "touch", "pressure", "air", "sleep", "exertion",
                 "stool", "menses", "talking"),
    "location": ("head", "chest", "heart", "stomach", "abdomen", "back", "spine", "leg",
                 "arm", "hand", "finger", "foot", "knee", "throat", "mouth", "teeth",
                 "eye", "ear", "nose", "skin", "occiput", "toe", "shoulder"),
}


def word_report(text: str, vocab: RepertoryVocabulary) -> dict:
    """ایک علامت کے الفاظ کی رپورٹ: کیا موجود، کیا نہیں، اور کون سا جزو بن سکتا ہے"""
    raw = [w for w in re.split(r"[^A-Za-zæœßäöüéèáàâåçñ'-]+", str(text)) if len(w) > 2]
    res = vocab.check_words(raw)
    comp = {"location": [], "sensation": [], "modality": []}
    for w in raw:
        c = vocab.canon(w)
        for role, kws in _COMPONENT_HINTS.items():
            if any(c.startswith(k) or k.startswith(c) for k in kws):
                if w not in comp[role]:
                    comp[role].append(w)
    res["components"] = comp
    res["text"] = text
    return res


def print_case_report(symptoms: List[str], repo: Optional[Path] = None,
                      title: str = "لفظ بلفظ رپورٹ") -> dict:
    """پورے کیس کی رپورٹ — کون سا لفظ ریپرٹری میں ہے، کون سا نہیں"""
    v = RepertoryVocabulary(repo)
    print("=" * 84)
    print(f"{title} — ریپرٹری میں اِسی لفظ کی جانچ")
    print(f"ریپرٹری: {v.rubric_count} ربرکس · {len(v.words)} مختلف الفاظ")
    print("=" * 84)
    all_missing: List[str] = []
    for s in symptoms:
        r = word_report(s, v)
        miss = list(r["missing"].keys())
        all_missing.extend(miss)
        if not miss:
            print(f"\n✅ «{s[:70]}»")
        else:
            print(f"\n⚠️ «{s[:70]}»")
        print("   ملے: " + (", ".join(r["found"].keys()) or "—"))
        if miss:
            print("   ❌ ریپرٹری میں نہیں: " + ", ".join(miss))
            for m, info in r["missing"].items():
                if info["spellings"]:
                    print(f"        «{m}» کی ہجے والے قریب الفاظ: " + ", ".join(info["spellings"]))
    print("\n" + "-" * 84)
    uniq = sorted(set(all_missing))
    print(f"کل ایسے الفاظ جو ریپرٹری میں اِسی شکل میں نہیں: {len(uniq)}")
    if uniq:
        print("   " + ", ".join(uniq))
        print("   ↑ اِن کے لیے انجن کوئی متبادل نہیں چنے گا — معالج خود فیصلہ کرے گا۔")
    return {"missing": uniq, "vocab": v}


# ------------------------------------------------------------------ #
# 4) خود جانچ (ڈیمو)
# ------------------------------------------------------------------ #
if __name__ == "__main__":
    import sys
    repo = sys.argv[1] if len(sys.argv) > 1 else "/tmp/bc/repo"
    CASE = [
        "heart attacks",
        "first coming on after accouchement",
        "brought on by excitement",
        "heart feels as if squeezed",
        "dyspnea",
        "groaning from the pain",
        "cannot lie down",
        "weakness",
        "numbness of the right leg from toe to above knees",
        "cold shivering with chattering of teeth",
        "dryness of mouth and throat",
        "back feels drawn backward",
        "trembling feeling about apex of heart on talking",
        "frequent coldness from occiput down spine",
        "frequent feeling as if heart stopped followed by rush of blood to the heart",
        "violent palpitation",
        "can lie best left side",
        "lying on right side brings on palpitation and weight on left side of chest",
        "fingers numb at times",
        "excitement brings on palpitation",
        "excitement",
        "cold shivering",
        "no organic lesion discovered by auscultation",
    ]
    print_case_report(CASE, repo, "مسز صبا کا کیس")

    # ماضی کا نقصان: پہلے انجن کن الفاظ کو «بدل» دیتا تھا — وہ اب نہیں بدلیں گے
    print("\n" + "=" * 84)
    print("اب انجن اِن الفاظ کو خود سے نہیں بدلے گا (پہلے بدلتا تھا):")
    for a, b in [("sadness", "grief"), ("rage", "anger"), ("cool", "cold"),
                 ("insomnia", "sleeplessness"), ("movement", "motion"),
                 ("dizzy", "vertigo"), ("tired", "fatigue"), ("belly", "abdomen"),
                 ("itching", "itch")]:
        print(f"   {a:>10}  ≠  {b}")
