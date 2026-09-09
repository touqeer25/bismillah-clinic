import os
import re
import json
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from fastembed import TextEmbedding
import google.generativeai as genai

# .env لوڈ کریں
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env"))

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "homeopathy_knowledge")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY or not QDRANT_URL or not QDRANT_API_KEY:
    print("⚠️ انتباہ: .env فائل میں API Keys مکمل نہیں ہیں۔")

genai.configure(api_key=GEMINI_API_KEY)
llm_model = genai.GenerativeModel("models/gemini-flash-latest")

qdrant_client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
    timeout=60,
    check_compatibility=False
)
embedding_model = TextEmbedding(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

app = FastAPI(title="Bismillah Clinic AI Engine")

# کلینک ایپ (Browser/Local) کے ساتھ CORS کھوئلیں
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class Step1Request(BaseModel):
    chief_complaint: str
    case_type: str = "🔴 حاد (Acute)"
    search_mode: str = "books"  # 'books' or 'ai'

class Step2Request(BaseModel):
    chief_complaint: str
    case_type: str
    selected_answers: List[str]
    extra_notes: Optional[str] = ""
    search_mode: str = "books"

class Step3Request(BaseModel):
    chief_complaint: str
    case_type: str
    selected_answers: List[str]
    extra_notes: Optional[str] = ""
    candidate_remedies: List[dict]
    search_mode: str = "books"


def search_qdrant(query: str, limit: int = 8, min_score: float = 0.25):
    try:
        query_vector = list(embedding_model.embed([query]))[0].tolist()
        results = qdrant_client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            limit=limit
        ).points
        filtered = [r for r in results if (r.score or 0) >= min_score]
        return filtered
    except Exception as e:
        print(f"Qdrant Search Error: {e}")
        return []

def format_context(results):
    if not results:
        return ""
    ctx = ""
    for i, r in enumerate(results, 1):
        p = r.payload or {}
        ctx += f"\n[Source {i}] Book: {p.get('book_name','?')} | Page: {p.get('page_number','?')} | Score: {r.score:.2f}\n{p.get('text','')}\n"
    return ctx

def extract_json(text: str):
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.IGNORECASE)
    if fence:
        text = fence.group(1).strip()
    a, b = text.find("{"), text.rfind("}")
    if a != -1 and b != -1 and b > a:
        text = text[a:b+1]
    return json.loads(text)


@app.get("/")
def health_check():
    return {"status": "online", "clinic": "Bismillah Homeopathic Clinic AI Engine"}


@app.post("/api/ai/step1-categories")
def generate_step1_categories(req: Step1Request):
    context = ""
    if req.search_mode == "books":
        results = search_qdrant(req.chief_complaint, limit=6)
        context = format_context(results)
        if not context:
            raise HTTPException(status_code=404, detail="کتب موڈ: آپ کی اپلوڈ شدہ کتب میں اس شکایت پر مواد نہیں ملا۔")

    prompt = f"""
Chief complaint: "{req.chief_complaint}"
Case type: "{req.case_type}"

Context:
{context if context else 'General Homeopathic Case Taking Knowledge'}

Create interactive case-taking categories in Urdu.
Return ONLY valid JSON:
{{
  "categories": [
    {{"category": "کیٹگری کا اردو نام", "options": ["آپشن 1", "آپشن 2", "آپشن 3", "آپشن 4"]}}
  ]
}}
Rules:
- 5 to 7 categories in Urdu.
- 3 to 6 short clickable options each.
- No remedy names.
- JSON only.
"""
    try:
        resp = llm_model.generate_content(prompt)
        data = extract_json(resp.text)
        return {"status": "success", "categories": data.get("categories", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/step2-candidates")
def generate_step2_candidates(req: Step2Request):
    answers_str = "، ".join(req.selected_answers)
    full_symptoms = f"Chief: {req.chief_complaint}. Details: {answers_str}. Notes: {req.extra_notes}"
    
    results = search_qdrant(full_symptoms, limit=8)
    context = format_context(results)

    if req.search_mode == "books" and not context:
        raise HTTPException(status_code=404, detail="کتب موڈ: اس علامت کے لیے کتب میں مناسب حوالہ نہیں ملا۔")

    prompt = f"""
Case type: {req.case_type}
Chief: {req.chief_complaint}
Selected Details: {answers_str}
Notes: {req.extra_notes}

Books Context:
{context}

Return ONLY valid JSON:
{{
  "candidates": [
    {{
      "remedy": "Remedy Name",
      "urdu_name": "اردو نام",
      "why": "کیوں میچ ہوتی ہے (مختصر اردو)",
      "keynotes": ["نکتہ 1", "نکتہ 2"],
      "source": "حوالہ (کتاب اور صفحہ)"
    }}
  ],
  "diff_categories": [
    {{"category": "تفریقی کیٹگری", "options": ["A", "B", "C"]}}
  ]
}}
- 3 to 4 candidate remedies.
- 2 to 3 differential categories with short Urdu options.
- JSON only.
"""
    try:
        resp = llm_model.generate_content(prompt)
        data = extract_json(resp.text)
        
        sources = []
        for r in results:
            p = r.payload or {}
            sources.append({"book": p.get("book_name"), "page": p.get("page_number"), "score": r.score})

        return {
            "status": "success",
            "candidates": data.get("candidates", []),
            "diff_categories": data.get("diff_categories", []),
            "sources": sources
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/step3-prescription")
def generate_step3_prescription(req: Step3Request):
    answers_str = "، ".join(req.selected_answers)
    if req.extra_notes:
        answers_str += f"۔ اضافی: {req.extra_notes}"

    full_symptoms = f"Chief: {req.chief_complaint}. All symptoms: {answers_str}"
    results = search_qdrant(full_symptoms, limit=10)
    context = format_context(results)

    if req.search_mode == "books" and not context:
        raise HTTPException(status_code=404, detail="کتب موڈ: ڈیٹا بیس میں کافی مواد نہیں ملا۔")

    prompt = f"""
Case type: {req.case_type}
Chief: {req.chief_complaint}
All symptoms: {answers_str}
Candidates considered: {json.dumps(req.candidate_remedies, ensure_ascii=False)}

Books Context:
{context}

Write the FINAL prescription in URDU with the following structure:
### 💊 منتخب کردہ بہترین دوائی
### 📖 دلیل (میٹیریا میڈیکا سے تصدیق)
### ⚡ طاقت اور خوراک (Potency & Dose)
### 🔄 فالو اپ اور احتیاط
### 📚 حوالہ جات

Note:
Must provide professional homeopathic reasoning.
"""
    try:
        resp = llm_model.generate_content(prompt)
        sources = []
        for r in results:
            p = r.payload or {}
            sources.append({"book": p.get("book_name"), "page": p.get("page_number"), "score": r.score})

        return {
            "status": "success",
            "prescription": resp.text,
            "sources": sources
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    print("🚀 Bismillah Clinic AI Server starting on http://localhost:8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)