"""
materia_medica.py — میٹیریا میڈیکا تصدیق کی تہہ (کوانٹ پر مبنی) — نسخہ 2.1
-----------------------------------------------------------------------
ریپرٹورائزیشن کے ٹاپ امیدوار دوائوں کی تصدیق کلینک کے اپنے میٹیریا
میڈिका ڈیٹا سے (Qdrant vector collection: "homeopathy_knowledge")۔

طریقہ:
  1. ہر دوا کے لیے کوئری: "{دوا} materia medica keynotes + کلیدی علامات"
  2. ویکٹر سرچ سے تعلق رکھنے والی 2-3 کتابوں کی صفحہ ٹکڑے (chunks) لاتے ہیں
  3. مقامی میچ ریٹ: مریض کی علامات کے الفاظ کتنے ٹکڑوں میں ملتے ہیں
  4. یہ مضمون + فیصد حتمی نسخے کے ایل ایل ایم پرامپٹ میں جاتا ہے —
     تاکہ ماڈل اپنی "یادداشت" سے نہیں بلکہ حقیقی کتابوں سے فیصلہ کرے۔

بغیر کلید / ناکامی کی صورت میں خالی واپس ہوتا ہے (graceful fallback) —
نسخہ وہی پرانا طریقے سے بن جاتا ہے۔
"""
from __future__ import annotations

import os
import re
from typing import Dict, List, Optional


def _key(name: str) -> str:
    """کلید — env یا Streamlit Cloud secrets سے"""
    v = os.getenv(name)
    if v and v.strip():
        return v.strip()
    try:
        import streamlit as st
        if name in st.secrets:
            v = st.secrets[name]
            if v and str(v).strip():
                return str(v).strip()
    except Exception:
        pass
    return ""


# ڈیفالٹ کلینک کا کوانٹ (URL secret میں موجود ہو تو وہ ہی استعمال ہوگا)
QDRANT_URL = os.getenv(
    "QDRANT_URL",
    "https://e37c800f-86fe-4d68-adcc-f5079c12ed64.us-west-2-0.aws.cloud.qdrant.io:6333",
).strip()
QDRANT_API_KEY = _key("QDRANT_API_KEY")
COLLECTION = os.getenv("COLLECTION_NAME", "homeopathy_knowledge").strip()

_EMBED_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

# مختصر نام → مکمل نام (ویکٹر سرچ کے لیے مکمل نام بہتر نتائج دیتے ہیں)
REMEDY_FULL_NAMES = {
    "acon": "Aconitum napellus", "aeth": "Aethusa cynapium",
    "aloe": "Aloe socotrina", "alum": "Alumina",
    "am-c": "Ammonium carbonicum", "am-m": "Ammonium muriaticum",
    "am-mov": "Ammonium moviatum", "ambr": "Amber",
    "ant-c": "Antimonium crudum", "ant-t": "Antimonium tartaricum",
    "apis": "Apis mellifica", "arg-n": "Argentum nitricum",
    "arg-m": "Argentum metallicum", "arn": "Arnica montana",
    "ars": "Arsenicum album", "ars-i": "Arsenicum iodatum",
    "asaf": "Asa foetida", "aur": "Aurum metallicum",
    "bar-c": "Barium carbonicum", "bar-m": "Barium muriaticum",
    "bell": "Belladonna", "bism": "Bismuthum",
    "bry": "Bryonia alba", "bug-b": "Bugleweed (Lycopus virginicus)",
    "calc": "Calcarea carbonica", "calc-p": "Calcarea phosphorica",
    "caust": "Causticum", "cham": "Chamomilla", "chel": "Chelidonium majus",
    "chin": "China (Cinchona officinalis)", "coc-c": "Coca",
    "coff": "Coffea cruda", "colch": "Colchicum",
    "con-c": "Conium maculatum", "crea": "Creosotum",
    "croc": "Crocus sativus", "cupr": "Cuprum metallicum",
    "cupr-am": "Cuprum ammonio-aceticum", "cupr-as": "Cuprum arsenicosum",
    "cupr-i": "Cuprum iodatum", "cur-i": "Curare",
    "daphn": "Daphne indica", "dat-d": "Datura stramonium",
    "dch": "Digitalis purpurea", "dig": "Digitalis purpurea",
    "dros": "Drosera rotundifolia", "dulc": "Dulcamara",
    "eup-c": "Eupatorium cannabinum", "eup-per": "Eupatorium perfoliatum",
    "fer": "Ferrum metallicum", "fer-ph": "Ferrum phosphoricum",
    "gels": "Gelsemium sempervirens", "graph": "Graphites",
    "glon": "Glonoinum", "hep": "Hepatica", "hepa": "Hepatica",
    "hes": "Helleborus niger", "hfp": "Helleborus foetidus",
    "ign": "Ignatia amara", "ipule": "Ipecacuanha", "ipul": "Ipecacuanha",
    "k-al": "Kali alumina", "k-bich": "Kali bichromicum",
    "k-car": "Kali carbonicum", "k-caust": "Kali causticum",
    "k-i": "Kali iodatum", "k-p": "Kali phosphoricum",
    "k-sul": "Kali sulphuricum", "kali-c": "Kali carbonicum",
    "kali-p": "Kali phosphoricum", "kre": "Kreosotum",
    "lac-c": "Lactuca virosa", "led": "Ledum palustre",
    "lil": "Lilium tigridum", "lic": "Lycopus virginicus",
    "licop": "Lycopodium clavatum", "lice": "Lycopodium clavatum",
    "lyc": "Lycopodium clavatum", "mag-c": "Magnesia carbonica",
    "mag-ph": "Magnesia phosphorica", "merc": "Mercurius solubilis",
    "merc-c": "Mercurius cyanidas", "merc-i": "Mercurius iodatus ruber",
    "med": "Medorrhinum", "mang": "Manganum", "mez": "Mezereum",
    "mosch": "Moschus", "nat-c": "Natrum carbonicum",
    "nat-m": "Natrum muriaticum", "nat-s": "Natrum sulphuricum",
    "nat-vol": "Natrum volatile c/a", "nux-m": "Nux moschata",
    "nux-v": "Nux vomica", "nux-vom": "Nux vomica",
    "opho": "Ophioplon (Aconitum)", "ops": "Opium",
    "osca": "Osmum caryophoratum", "ph-ac": "Phosphoric acid",
    "ph-ar": "Phosphorus", "phos": "Phosphorus", "phos-ph": "Phosphorus",
    "plat": "Platinum", "plb": "Plumbum metallicum",
    "puls": "Pulsatilla", "rat": "Ratanhia (Kochia scoparia)",
    "rh": "Rhododendron chrysanthum", "rhus": "Rhus toxicodendron",
    "rhus-tox": "Rhus toxicodendron", "samb": "Sambucus nigra",
    "sep": "Sepia", "sil": "Silicea", "silic": "Silicea",
    "spig": "Spigelia anthelmia", "squ": "Squilla maritima",
    "staph": "Staphysagria", "stic": "Sticta pulmonaria",
    "sul": "Sulphur", "sulph": "Sulphur", "sul-i": "Sulphur iodatum",
    "thu": "Thuja occidentalis", "thuj": "Thujaplicina",
    "ver-a": "Veratrum album", "ver-v": "Veratrum viride",
    "verat-v": "Veratrum viride", "verat-a": "Veratrum album",
    "vio": "Viola odorata",
}


def _full_name(remedy: str) -> str:
    """مختصر کوڈ → مکمل نام (آگے پیچھے دونوں سمتوں میں)"""
    r = str(remedy).strip().lower()
    if r in REMEDY_FULL_NAMES:
        return REMEDY_FULL_NAMES[r]
    return str(remedy).strip()


_client = None
_embedder = None


def available() -> bool:
    """کیا تصدیق کی تہہ چلا سکتی ہے (کلید موجود ہے؟)"""
    return bool(QDRANT_URL and QDRANT_API_KEY)


def _get_client():
    global _client
    if _client is None:
        from qdrant_client import QdrantClient
        _client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=60)
    return _client


def _get_embedder():
    global _embedder
    if _embedder is None:
        from fastembed import TextEmbedding
        _embedder = TextEmbedding(_EMBED_MODEL)
    return _embedder


def _symptom_tokens(symptoms: List[str]) -> set:
    """علامات کے معنی والے الفاظ (انگریزی/اردو دونوں)"""
    tokens = set()
    for s in symptoms:
        for w in re.findall(r"[a-zA-Z]{3,}|[\u0600-\u06FF]{3,}", str(s)):
            tokens.add(w.lower())
    return tokens


def _qdrant_filter(full_name: str, abbrev: str):
    """صرف وہ صفحات جن میں دوا کا نام (مکمل یا مختصر) موجود ہو"""
    from qdrant_client import models
    conds = [models.FieldCondition(key="text", match=models.MatchText(text=full_name))]
    a = str(abbrev).strip().lower()
    if a and a != full_name.lower():
        conds.append(models.FieldCondition(key="text", match=models.MatchText(text=a)))
    return models.Filter(must=[models.Filter(should=conds)])


def verify_remedies(
    remedies: List[str],
    symptoms: List[str],
    top_chunks: int = 3,
    max_chars: int = 700,
) -> Dict[str, dict]:
    """
    ٹاپ ادویات کی میٹیریا میڈیکا تصدیق (کوانٹ سے حقیقی صفحات)۔

    طریقہ (هر دوا کے لیے):
      1. نام کی بنیاد پر فلٹر (صرف اُس دوا کے صفحات)
      2. دو ویکٹر کوئریز: (ا) خالص نام، (ب) نام + کلیدی علامات
      3. جو ٹکڑا دوا کے نام سے شروع ہو اسے بونس (وہی اس دوا کا اپنا صفحہ ہے)
      4. علامت میچ ریٹ: مریض کی علامات کے الفاظ کتنے ٹکڑوں میں ملتے ہیں

    واپسی: {remedy: {"chunks": [{"book","page","text"}], "match_rate": 0.0-1.0}}
    ناکامی/بغیر کلید → خالی ڈکٹ (کالر خود فیصلہ کرتا ہے)
    """
    if not available() or not remedies:
        return {}
    try:
        client = _get_client()
        emb = _get_embedder()
    except Exception:
        return {}

    key_syms = [str(s).strip() for s in symptoms if str(s).strip()][:8]
    tokens = _symptom_tokens(key_syms)
    out: Dict[str, dict] = {}

    for rem in remedies[:6]:
        full = _full_name(rem)
        flt = _qdrant_filter(full, rem)
        queries = [full]
        if key_syms:
            queries.append(full + " " + ", ".join(key_syms[:3]))

        scored = []
        seen_texts = set()
        for q in queries:
            try:
                vec = list(emb.embed([q]))[0].tolist()
                try:
                    hits = client.query_points(
                        COLLECTION, query=vec, query_filter=flt,
                        limit=top_chunks + 2, with_payload=True,
                    ).points
                except Exception:
                    # ٹیکسٹ انڈیکس موجود نہ ہو تو بغیر فلٹر
                    hits = client.query_points(
                        COLLECTION, query=vec, limit=top_chunks + 2, with_payload=True,
                    ).points
            except Exception:
                continue
            head = full.split()[0].lower() if full else ""
            for h in hits:
                pl = h.payload or {}
                text = str(pl.get("text", "")).strip()
                if not text or text[:80] in seen_texts:
                    continue
                seen_texts.add(text[:80])
                own_page = 1.0 if (head and head in text[:80].lower()) else 0.0
                scored.append((float(h.score or 0) + 0.35 * own_page, pl, text))

        scored.sort(key=lambda x: -x[0])
        chunks = []
        combined = ""
        for _score, pl, text in scored[:top_chunks]:
            chunks.append({
                "book": str(pl.get("book_name", "?"))[:60],
                "page": pl.get("page_number", ""),
                "text": text[:max_chars],
            })
            combined += " " + text

        if tokens and combined:
            hit = sum(1 for w in tokens if w in combined.lower())
            rate = round(hit / len(tokens), 2)
        else:
            rate = 0.0
        out[rem] = {"chunks": chunks, "match_rate": rate}

    return out


def format_for_prompt(verdicts: Dict[str, dict]) -> str:
    """تصدیقی مضمون ایل ایل ایم پرامپٹ کے لیے"""
    if not verdicts:
        return ""
    lines = []
    for rem, v in verdicts.items():
        lines.append(f"{rem} (symptom-keynote match rate: {int(v['match_rate'] * 100)}%):")
        for c in v["chunks"][:2]:
            lines.append(f'  - [{c["book"]} p{c["page"]}] "{c["text"][:240]}"')
    return "\n".join(lines)
