"""
flow_runner.py — کنفیگریشن سے چلنے والا فلو کنٹرولر
---------------------------------------------------
ایک ہی کلاس دونوں فلو چلاتی ہے:
    acute_flow.json    (4 مراحل)
    chronic_flow.json  (8 مراحل + میازم + فالو اپ)

فرق صرف کنفیگریشن میں ہے — کوڈ ایک ہی رہتا ہے۔
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional

from ..engine import differential, followup, miasm, potency, repertorizer, rubric_mapper, sources

CONFIG_DIR = Path(__file__).resolve().parents[1] / "config"

# وہ جہتیں جن کی بنیاد پر "مکملیت اسکور" بنتا ہے
COMPLETENESS_DIMENSIONS = [
    "chief",        # بنیادی شکایت و وجہ
    "mind",         # ذہنی/جذباتی
    "generals",     # عمومیات (پیاس/حرارت/بھوک)
    "sleep",        # نیند و خواب
    "history",      # ماضی + خاندان
    "miasm",        # میازم اشارے
    "modalities",   # موڈیلٹیز
    "causation",    # وجہ بیماری
]


class FlowRunner:
    """کنفیگریشن لوڈ کر کے مراحل چلاتا ہے"""

    def __init__(self, case_type: str):
        self.case_type = "chronic" if case_type == "chronic" else "acute"
        self.config = self._load_config()
        self.answers: Dict[str, dict] = {}   # step_id -> جمع شدہ جوابات
        self.current_index = 0

    # ---------------- کنفیگریشن ----------------
    def _load_config(self) -> dict:
        fname = f"{self.case_type}_flow.json"
        fpath = CONFIG_DIR / fname
        if not fpath.exists():
            raise FileNotFoundError(f"کنفیگریشن نہیں ملی: {fpath}")
        return json.loads(fpath.read_text(encoding="utf-8"))

    @property
    def steps(self) -> List[dict]:
        return self.config["steps"]

    @property
    def total_steps(self) -> int:
        return len(self.steps)

    @property
    def current_step(self) -> Optional[dict]:
        if 0 <= self.current_index < self.total_steps:
            return self.steps[self.current_index]
        return None

    def next(self) -> Optional[dict]:
        """اگلے مرحلے پر جانا؛ ختم ہو تو None"""
        if self.current_index < self.total_steps - 1:
            self.current_index += 1
            return self.current_step
        return None

    def back(self) -> Optional[dict]:
        if self.current_index > 0:
            self.current_index -= 1
            return self.current_step
        return None

    def set_answers(self, step_id: str, data: dict) -> None:
        self.answers[step_id] = data

    # ---------------- مکملیت اسکور ----------------
    def completeness(self) -> Dict:
        """
        کون سی جہتیں دریافت ہو چکی ہیں اور کون سی ادھوری ہیں؟
        فیصد + ہر جہت کی حالت (مکمل/جزوی/خالی) + اگلی تجاویز
        """
        dims = {}
        for d in COMPLETENESS_DIMENSIONS:
            state, detail = self._dimension_state(d)
            dims[d] = {"state": state, "detail": detail}

        full = sum(1 for v in dims.values() if v["state"] == "full")
        partial = sum(1 for v in dims.values() if v["state"] == "partial")
        total = len(dims)
        percent = round(((full + 0.5 * partial) / total) * 100)

        # اگلے سوالات کی تجویز — خالی/جزوی جہتوں میں سے
        suggestions = []
        for d, v in dims.items():
            if v["state"] in ("empty", "partial"):
                suggestions.append(self._suggest_question(d))

        return {
            "percent": percent,
            "dimensions": dims,
            "suggestions": suggestions,
        }

    def _dimension_state(self, dim: str) -> tuple:
        """(state, detail) — full/partial/empty"""
        # متعلقہ اسٹیپ کا جواب موجود؟
        for step in self.steps:
            if step["id"] == dim and step["id"] in self.answers:
                data = self.answers[step["id"]]
                # dict یا list کی لمبائی سے اندازہ
                n = len(data) if hasattr(data, "__len__") else 1
                if n >= 3:
                    return "full", f"{n} اندراجات"
                if n >= 1:
                    return "partial", f"{n} اندراجات"
                return "empty", ""
        return "empty", ""

    def _suggest_question(self, dim: str) -> str:
        suggestions = {
            "chief": "بنیادی شکایت کا محل، احساس اور دورانیہ واضح کریں",
            "mind": "ذہنی جہت ادھوری ہے — غم، خوف، غصہ یا اضطراب پر سوال کریں",
            "generals": "عمومیات ادھوری — پیاس، بھوک، گرم/سرد طبیعت پوچھیں",
            "sleep": "نیند اور خواب ابھی دریافت نہیں ہوئے",
            "history": "ماضی کی بیماریاں اور خاندانی رجحان پوچھیں",
            "miasm": "میازم کے اشارے اکٹھے کریں (جلد، نمو، تخریب، کمزوری)",
            "modalities": "بڑھنے/گھٹنے کے اسباب ضرور پوچھیں",
            "causation": "بیماری کی وجہ (سردی، غصہ، صدمہ) معلوم کریں",
        }
        return suggestions.get(dim, f"{dim} جہت مکمل کریں")

    # ---------------- مرکزی پائپ لائن ----------------
    def run_repertorization(self, symptoms: List[str]) -> Dict:
        """
        علامات → (ملٹی سورس) ربرکس → اسکور → (میازم فلٹر) → تفریق
        مکمل پائپ لائن ایک فنکشن میں۔

        سورسز اور ایل ایل ایم کا استعمال کنفیگریشن سے آتا ہے:
            "sources": ["kent", "synthesis"], "use_llm_rubrics": true
        """
        weights = self.config.get("dimension_weights")
        source_names = self.config.get("sources", ["kent"])
        use_llm = self.config.get("use_llm_rubrics", True)

        # 1+2) علامات → ربرکس → ملٹی سورس اسکورنگ
        out = repertorizer.repertorize_multi(
            symptoms,
            source_names=source_names,
            dimension_weights=weights,
            use_llm=use_llm,
        )
        results = out["remedies"]

        # 3) میازم (صرف کرانک میں)
        miasm_profile = None
        if self.config.get("miasm_enabled"):
            miasm_profile = miasm.analyze_miasm(symptoms)
            dom = miasm.dominant_miasm(miasm_profile)
            results = miasm.filter_by_miasm(results, dom)

        # 4) تفریق میٹرکس
        matrix = differential.build_differential_matrix(results)

        return {
            "remedies": results,
            "miasm_profile": miasm_profile,
            "miasm_dominant": miasm.dominant_miasm(miasm_profile) if miasm_profile else None,
            "differential": matrix,
            "rubrics_used": out.get("rubrics_used", []),
            "sources": out.get("sources", []),
        }

    def run_potency(self, sensitivity: str = "medium") -> Dict:
        return potency.recommend_potency(self.case_type, sensitivity)

    def run_followup(self, response: str, progress: Optional[Dict] = None) -> Dict:
        decision = followup.decide(response)
        if progress is not None:
            decision["hering"] = followup.hering_check(progress)
        return decision


# ------------------------------------------------------------------ #
# آسان مددگار
# ------------------------------------------------------------------ #
def load_flow(case_type: str) -> FlowRunner:
    return FlowRunner(case_type)
