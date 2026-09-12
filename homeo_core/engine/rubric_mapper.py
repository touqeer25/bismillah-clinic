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

_STOPWORDS = {
    "the", "of", "in", "on", "at", "when", "while", "after", "before", "during",
    "and", "or", "with", "without", "from", "to", "for", "as", "is", "are", "be",
    "a", "an", "his", "her", "she", "he", "it", "its", "their", "see", "saw",
    "my", "me", "i", "you", "very", "much", "too", "some", "have", "has",
    "great", "intense", "severe", "lots", "excessive", "zyada", "bohat",
}

# ------------------------------------------------------------------ #
# مترادفات — علامت اور ربرک دونوں کو ایک "معیاری" شکل میں ڈھالتے ہیں
# ------------------------------------------------------------------ #
SYNONYM_MAP = {
    # بڑھنا / گھٹنا
    "worse": "agg", "worst": "agg", "aggravation": "agg", "aggravated": "agg",
    "aggravates": "agg", "exacerbated": "agg", "exacerbation": "agg",
    "increases": "agg", "increased": "agg", "intensified": "agg", "intensifies": "agg",
    "better": "amel", "amelioration": "amel", "ameliorated": "amel", "ameliorates": "amel",
    "relief": "amel", "relieved": "amel", "relieves": "amel", "relieving": "amel",
    "improved": "amel", "improves": "amel", "improvement": "amel", "decreased": "amel",
    "decreases": "amel", "less": "amel",
    # حرکت
    "motion": "motion", "movement": "motion", "moving": "motion", "moved": "motion", "move": "motion",
    # حرارت / سردی
    "warmth": "heat", "warm": "heat", "hot": "heat", "heat": "heat", "heated": "heat",
    "cool": "cold", "chilly": "cold", "cold": "cold", "chill": "cold", "chills": "cold",
    # پیاس / پانی
    "thirsty": "thirst", "thirst": "thirst", "thirstless": "thirstless",
    "drink": "drinking", "drinks": "drinking", "drinking": "drinking", "water": "water",
    # نیند
    "asleep": "sleep", "sleeping": "sleep", "sleep": "sleep", "sleepless": "sleeplessness",
    "sleeplessness": "sleeplessness", "insomnia": "sleeplessness",
    # وقت
    "night": "night", "nightly": "night", "nights": "night", "nocturnal": "night",
    "morning": "morning", "forenoon": "forenoon",
    "evening": "evening", "afternoon": "afternoon",
    # لمس
    "touch": "touch", "touched": "touch", "touching": "touch",
    # کھانسی
    "cough": "cough", "coughing": "cough",
    # درد
    "pain": "pain", "pains": "pain", "painful": "pain", "aching": "aching", "ache": "aching",
    "sore": "sore", "soreness": "sore",
    # جلن / خارش
    "burning": "burning", "burn": "burning", "burns": "burning",
    "itching": "itching", "itch": "itching", "itchy": "itching", "itches": "itching",
    # ذہنی
    "fear": "fear", "fearful": "fear", "fright": "fear", "frightened": "fear", "scared": "fear",
    "anxiety": "anxiety", "anxious": "anxiety", "apprehension": "anxiety",
    "grief": "grief", "sadness": "grief", "sad": "grief", "sorrow": "grief", "grieving": "grief",
    "anger": "anger", "angry": "anger", "rage": "anger", "vexation": "anger", "vexed": "anger",
    "irritability": "irritability", "irritable": "irritability", "irritated": "irritability",
    "weeping": "weeping", "weep": "weeping", "crying": "weeping", "cries": "weeping", "cry": "weeping",
    # معدہ / آنت
    "constipation": "constipation", "constipated": "constipation",
    "diarrhea": "diarrhea", "diarrhoea": "diarrhea",
    "vomiting": "vomiting", "vomit": "vomiting", "vomits": "vomiting",
    "nausea": "nausea", "nauseated": "nausea", "nauseous": "nausea",
    # دیگر عمومیات
    "vertigo": "vertigo", "dizziness": "vertigo", "dizzy": "vertigo", "giddiness": "vertigo",
    "weakness": "weakness", "weak": "weakness",
    "fatigue": "fatigue", "tired": "fatigue", "tiredness": "fatigue", "exhaustion": "fatigue",
    "prostration": "prostration", "prostrated": "prostration",
    "sweat": "sweat", "sweating": "sweat", "perspiration": "sweat", "perspiring": "sweat",
    "urine": "urine", "urination": "urine", "urinating": "urine", "urinary": "urine",
    "menses": "menses", "menstruation": "menses", "menstrual": "menses", "period": "menses",
    "fever": "fever", "feverish": "fever",
    "headache": "headache",
}

# ------------------------------------------------------------------ #
# رومن اردو کلیدی الفاظ → انگریزی (مقامی مماثلت کے لیے)
# ------------------------------------------------------------------ #
ROMAN_URDU = {
    "dard": "pain", "khansi": "cough", "bukhar": "fever", "bukhaar": "fever",
    "pyas": "thirst", "sardi": "cold", "garmi": "heat", "neend": "sleep",
    "khoon": "blood", "sar": "head", "pait": "stomach", "maida": "stomach",
    "peeth": "back", "kamar": "back", "rat": "night", "subah": "morning",
    "sham": "evening", "dopehar": "afternoon", "din": "day", "jalan": "burning",
    "khujli": "itching", "qabz": "constipation", "dast": "diarrhea", "peshab": "urine",
    "pasina": "sweat", "ghabrahat": "anxiety", "khauf": "fear", "gham": "grief",
    "ghussa": "anger", "tension": "anxiety", "nazla": "coryza", "hichki": "hiccough",
    "qay": "vomiting", "matli": "nausea", "kamzori": "weakness", "thakan": "fatigue",
    "chakkar": "vertigo", "yaad": "memory", "naak": "nose", "kaan": "ear",
    "aankh": "eye", "ankh": "eye", "gala": "throat", "galay": "throat",
    "seenah": "chest", "seenay": "chest", "joron": "joints", "saans": "respiration",
    "bal": "hair", "daant": "teeth", "zabaan": "tongue", "hont": "lips",
    "hath": "hands", "paon": "feet", "pair": "feet", "naaf": "navel",
    "kandha": "shoulder", "taang": "leg", "ghutna": "knee", "nakseer": "nosebleed",
}


def _is_latin(text: str) -> bool:
    """کیا متن لاطینی/رومن رسم الخط میں ہے؟ (اردو رسم الخط کی پہچان)"""
    return bool(re.search(r"[A-Za-z]", text))


def _canonical(token: str) -> str:
    """ایک لفظ کو معیاری شکل میں ڈھالنا"""
    return SYNONYM_MAP.get(token, token)


def _tokenize(text: str) -> List[str]:
    """متن کو صاف کر کے الفاظ کی فہرست بنانا"""
    text = str(text).lower()
    text = re.sub(r"[^a-z0-9\s-]", " ", text)
    words = [w.strip("-") for w in text.split() if w.strip("-")]
    return [w for w in words if w and w not in _STOPWORDS]


def _tokens_canonical(text: str) -> List[str]:
    """متن کے الفاظ — رومن اردو کی تبدیلی + مترادفات + معیاری کاری"""
    raw = _tokenize(text)
    out = []
    for w in raw:
        w = ROMAN_URDU.get(w, w)   # رومن اردو → انگریزی
        out.append(_canonical(w))  # مترادف → معیاری
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
}


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
                toks = _tokens_canonical(text)
                for w in set(toks):
                    self._index.setdefault(w, []).append(rid)
                for bg in set(_bigrams(toks)):
                    self._index.setdefault(bg, []).append(rid)

    def load_rubric(self, rid: str) -> dict:
        """ربرک کا اصل خام ریکارڈ (بشمول r: {دوا: درجہ})"""
        chapter, key = rid.split("::", 1)
        fpath = self.data_dir / f"{chapter}.json"
        try:
            data = json.loads(fpath.read_text(encoding="utf-8"))
            rec = data.get(key, {})
            return rec if isinstance(rec, dict) else {}
        except Exception:
            return {}

    # ---------------- تلاش ----------------
    def search(self, symptom: str, top_k: int = 10, min_words: int = 1) -> List[dict]:
        """علامت کے قریب ترین ربرکس (لفظی/فقرے کی مماثلت + اسکورنگ)"""
        tokens = _tokens_canonical(symptom)
        if not tokens:
            return []
        grams = set(tokens) | set(_bigrams(tokens))
        hints = _chapter_hint(tokens)

        scores: Dict[str, float] = {}
        for g in grams:
            for rid in self._index.get(g, []):
                # بائی گرام مماثلت کا وزن دوگنا
                w = 2.0 if "_" in g else 1.0
                scores[rid] = scores.get(rid, 0.0) + w

        if not scores:
            return []

        results = []
        for rid, raw in scores.items():
            rb = self.rubrics[rid]
            rb_tokens = _tokens_canonical(rb["t"])
            matched = set(grams) & (set(rb_tokens) | set(_bigrams(rb_tokens)))
            if len(matched) < min_words:
                continue
            # کوریج: علامت کے کتنے حصے ملے (بائی گرام کو زیادہ وزن)
            cover_num = sum(2.0 if "_" in m else 1.0 for m in matched)
            cover_den = sum(2.0 if "_" in m else 1.0 for m in grams)
            coverage = cover_num / max(cover_den, 1)
            specificity = raw / max(len(rb_tokens), 1)
            score = (coverage * 0.6 + min(specificity, 1.0) * 0.4) * 100
            # ابوابی رہنمائی: متعلقہ باب کے ربرکس کو ترجیح
            if rb["chapter"] in hints:
                score *= 1.4
            results.append({
                "rubric_id": rid,
                "chapter": rb["chapter"],
                "text": rb["t"],
                "path": rb.get("path", ""),
                "score": round(score, 2),
                "coverage": round(coverage, 3),
            })

        results.sort(key=lambda r: (-r["score"], -r["coverage"]))
        return results[:top_k]

    def dimensions(self, chapter: str) -> str:
        """باب کی جہت — mind / generals / particulars"""
        if chapter in MIND_CHAPTERS:
            return "mind"
        if chapter in GENERAL_CHAPTERS:
            return "generals"
        return "particulars"


# ------------------------------------------------------------------ #
# ایل ایل ایم کی مدد سے ربرک کا انتخاب (کیش شدہ)
# ------------------------------------------------------------------ #
_llm_cache: Dict[str, List[dict]] = {}

_translate_cache: Dict[str, str] = {}


def _llm_translate_symptom(symptom: str) -> str:
    """اردو رسم الخط کی علامت کو انگریزی ریپرٹری الفاظ میں بدلنا (کیش شدہ)"""
    from . import llm

    key = symptom.strip()
    if key in _translate_cache:
        return _translate_cache[key]
    try:
        raw, _ = llm.ask_llm(
            "You are a homeopathic repertory translator. "
            "Convert this patient symptom into concise English repertory keywords. "
            "Keep modality terms like 'worse from' or 'better from'.\n\n"
            f'Symptom: "{symptom}"\n\n'
            "Return ONLY the English keywords, comma-separated, no explanation.",
            require_json=False,
            temperature=0.0,
        )
        out = str(raw).strip()
        if out and _is_latin(out):
            _translate_cache[key] = out
            return out
    except Exception:
        pass
    _translate_cache[key] = ""
    return ""


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
            _llm_cache[key] = out
            return out
    except Exception:
        pass
    return None


def map_symptom_deep(symptom: str, index: Optional[RubricIndex] = None,
                     top_k: int = 5, use_llm: bool = True) -> List[dict]:
    """
    گہری علامت→ربرک میپنگ:
      مقامی مماثلت + (اختیاری) ایل ایل ایم کا انتخاب — اعتماد اور وجہ کے ساتھ

    اردو رسم الخط کی صورت میں ایل ایل ایم سے انگریزی ریپرٹری الفاظ میں
    ترجمہ کر کے تلاش کی جاتی ہے (لفظی مماثلت اردو متن پر نہیں چلتی)۔
    """
    index = index or get_index()
    local = index.search(symptom, top_k=12)

    if not local:
        # اردو رسم الخط: LLM سے انگریزی ریپرٹری الفاظ میں ترجمہ کر کے دوبارہ تلاش
        if use_llm and not _is_latin(symptom):
            translated = _llm_translate_symptom(symptom)
            if translated:
                local = index.search(translated, top_k=12)
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
