"""
miasm.py — میازم اینالائزر (صرف کرانک فلو میں چلتا ہے)
----------------------------------------------------
علامات، ذہنی حالت، عمومیات اور خاندانی تاریخ کے "اشاروں" کی بنیاد پر
چار میازموں کا فیصدی پروفائل بناتا ہے۔

یہ صرف اے آئی اندازہ نہیں — ہر میازم کے لیے وزن دار اشاروں کی فہرست ہے۔
"""

from __future__ import annotations

from typing import Dict, List

# ہر میازم کے اشارے — (کلیدی لفظ/جملہ، وزن)
# انگریزی اور اردو رومن دونوں شامل ہیں تاکہ مریض کے الفاظ پکڑے جا سکیں
MIASM_INDICATORS: Dict[str, List[tuple]] = {
    "psora": [
        ("skin", 2), ("itching", 2), ("dryness", 2), ("خارش", 2), ("kharish", 2),
        ("anxiety", 2), ("fear", 2), ("خوف", 2), ("khauf", 2), ("bichaini", 1),
        ("worse at night", 2), ("rat ko zyada", 2), ("wants warmth", 1), ("garmi pasand", 1),
        ("sweets", 1), ("meetha", 1), ("salt", 1), ("namak", 1),
        ("constipation", 2), ("qabz", 2), ("eruptions", 2), ("rashes", 2),
        ("burning", 1), ("jalan", 1),
    ],
    "sycosis": [
        ("warts", 3), ("masay", 3), ("growths", 2), ("nodules", 2), ("tumors", 2),
        ("rheumatism", 2), ("joint pain", 2), ("joron ka dard", 2),
        ("discharge", 1), ("catarrh", 1), ("ratubat", 1),
        ("forgetful", 2), ("bhool", 2), ("secretive", 2), ("khufia", 2),
        ("obsessive", 2), ("waswas", 2), ("salty", 1), ("namkeen", 1),
        ("worse damp", 2), ("worse at night", 1),
    ],
    "syphilis": [
        ("ulcer", 3), ("destruction", 3), ("bone pain", 3), ("haddi ka dard", 3),
        ("necrosis", 3), ("suppuration", 2),
        ("indifference", 2), ("apathy", 2), ("suicidal", 3), ("khudkushi", 3),
        ("despair", 2), ("naumeedi", 2), ("worse at night", 2), ("rat ko zyada", 2),
        ("aversion to cold", 1), ("hides complaints", 1),
    ],
    "tubercular": [
        ("weight loss", 3), ("wazan kam", 3), ("emaciation", 3),
        ("cough", 1), ("weakness", 1), ("kamzori", 1),
        ("travel", 2), ("safar ki khwahish", 2), ("change", 1), ("tabdeeli", 1),
        ("restless", 2), ("impatient", 2), ("besabri", 2),
        ("tired but active", 2), ("recurring cold", 2), ("bar bar nazla", 2),
        ("aversion to heat", 1), ("bleeding", 2),
    ],
}


def _norm(text: str) -> str:
    return str(text).lower()


def analyze_miasm(
    case_texts: List[str],
    history_texts: List[str] = None,
) -> Dict[str, dict]:
    """
    case_texts:   منتخب علامات / ذہنی جہت / عمومیات کا متن
    history_texts: ماضی اور خاندانی تاریخ کا متن

    واپسی: {miasm: {"score": خام اسکور, "percent": فیصد, "matched": ملنے والے اشارے}}
    """
    history_texts = history_texts or []
    all_text = " ".join([_norm(t) for t in case_texts + history_texts])

    scores = {}
    for miasm, indicators in MIASM_INDICATORS.items():
        raw = 0
        matched = []
        for phrase, weight in indicators:
            if _norm(phrase) in all_text:
                raw += weight
                matched.append(phrase)
        scores[miasm] = {"raw": raw, "matched": matched}

    total = sum(s["raw"] for s in scores.values()) or 1
    for miasm in scores:
        scores[miasm]["percent"] = round(scores[miasm]["raw"] / total * 100, 1)

    return scores


def dominant_miasm(profile: Dict[str, dict]) -> str:
    """سب سے نمایاں میازم"""
    return max(profile, key=lambda m: profile[m]["raw"])


# اینٹی میازمیٹک ادویات — میازم کے مطابق فلٹرنگ کے لیے
ANTI_MIASMATIC = {
    "psora": ["sulph", "calc", "lyc", "psor"],
    "sycosis": ["thuj", "med", "nit-ac", "staph"],
    "syphilis": ["merc", "aur", "syph", "nit-ac"],
    "tubercular": ["tub", "calc-p", "phos", "bac"],
}


def filter_by_miasm(remedies: List[dict], miasm: str, boost: float = 1.0) -> List[dict]:
    """
    ریپرٹورائزیشن کے نتائج میں میازم مطابقت کا اعزاز (بو اسٹ) شامل کرنا۔
    """
    anti = set(ANTI_MIASMATIC.get(miasm, []))
    for r in remedies:
        if r["remedy"] in anti:
            r["score"] = round(r["score"] + boost, 2)
            r["miasm_match"] = True
        else:
            r["miasm_match"] = False
    remedies.sort(key=lambda r: -r["score"])
    return remedies
