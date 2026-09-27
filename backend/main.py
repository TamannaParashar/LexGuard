from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import re
import torch
import asyncio
import pdfplumber
from docx import Document
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from datasets import load_dataset
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from required_clause_definitions import REQUIRED_CLAUSE_DEFINITIONS
import json

# ==================================================
# APP INITIALIZATION
# ==================================================

app = FastAPI(title="LexGuard API", version="1.0.0")

allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:80",
        "http://localhost",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:80",
        "http://127.0.0.1"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "LexGuard API is running"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


# ==================================================
# LOAD MODELS
# ==================================================

MODEL_PATH = "legalbert_ledgar_model"

print("Loading embedding model...")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
print("Embedding model loaded.")

print("Precomputing required clause embeddings...")
PRECOMPUTED_DEFINITION_EMBEDDINGS = {}

for contract_type, clauses_dict in REQUIRED_CLAUSE_DEFINITIONS.items():
    PRECOMPUTED_DEFINITION_EMBEDDINGS[contract_type] = {
        name: embedding_model.encode(text)
        for name, text in clauses_dict.items()
    }

print("Definition embeddings ready.")

try:
    print("Loading LegalBERT model...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    legalbert_model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
    legalbert_model.eval()

    ledgar = load_dataset("lex_glue", "ledgar")
    real_label_names = ledgar["train"].features["label"].names

    print("LegalBERT loaded successfully.")
    print("Total labels:", len(real_label_names))
except Exception as e:
    print("Warning: Failed to load LegalBERT natively.", e)
    # Fallbacks for testing environments without models downloading properly
    real_label_names = ["Clause"] * 100

# ==================================================
# GEMINI INITIALIZATION
# ==================================================

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-2.5-flash")

HIGH_RISK_LABELS = {
    "Termination", "Indemnification", "Limitation of Liability", 
    "Payment", "Confidentiality", "Governing Law", "Dispute Resolution",
    "Non-Compete", "Remedies", "Waivers", "Taxes", "Audit",
    "Intellectual Property", "Warranty"
}

# ==================================================
# TEXT EXTRACTION
# ==================================================

def extract_text(file_path):
    if file_path.endswith(".pdf"):
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += (page.extract_text() or "") + "\n"
        return text

    elif file_path.endswith(".docx"):
        doc = Document(file_path)
        return "\n\n".join([para.text for para in doc.paragraphs])

    return ""

# ==================================================
# CLEAN TEXT
# ==================================================

def clean_text(text):
    # Remove headers/footers like 'Page 1'
    text = re.sub(r'(?i)Page \d+ of \d+', '', text)
    text = re.sub(r'(?i)Page \d+', '', text)
    
    # Replace single newlines with space, but preserve double newlines to keep paragraphs
    # regex matches \n not preceded or followed by another \n
    text = re.sub(r'(?<!\n)\n(?!\n)', ' ', text)
    
    # Replace multiple spaces/tabs with single space
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()

# ==================================================
# SPLIT INTO CLAUSES
# ==================================================

def split_into_clauses(text):
    # Split by double newline OR numbered lists (e.g., 1., 1.1.) to handle both cleanly formatted docs and strict numbered contracts
    pattern = r'\n{2,}|(?:^|\n)\s*\d+(?:\.\d+)*\.\s'
    parts = re.split(pattern, text)

    clauses = []
    for c in parts:
        c = c.strip()
        if len(c) > 30: # adjusted from 50 to capture short definitions
            clauses.append(c)

    # Fallback: if the document failed to split (e.g., bad PDF layout leading to a massive wall of text), chunk by sentences
    if len(clauses) <= 2 and len(text) > 1500:
        clauses = []
        sents = re.split(r'(?<=[.!?])\s+', text)
        current_chunk = ""
        for s in sents:
            current_chunk += s + " "
            if len(current_chunk) > 600: # roughly a standard paragraph size
                clauses.append(current_chunk.strip())
                current_chunk = ""
        if current_chunk.strip():
            clauses.append(current_chunk.strip())

    return clauses

# ==================================================
# CLAUSE CLASSIFICATION
# ==================================================

def predict_clause(clause_text):
    try:
        inputs = tokenizer(
            clause_text,
            truncation=True,
            padding=True,
            max_length=512,
            return_tensors="pt"
        )

        with torch.no_grad():
            outputs = legalbert_model(**inputs)
            logits = outputs.logits
            predicted_class = torch.argmax(logits, dim=1).item()

        return predicted_class
    except Exception:
        return 0

# ==================================================
# GEMINI RISK ANALYSIS (BATCHED)
# ==================================================

async def get_ai_analysis_batch(clauses_data):
    """
    clauses_data: list of dicts [{"id": int, "text": str, "label": str}]
    """
    if not clauses_data:
        return []

    prompt = f"""
    You are a legal UX writer for a modern SaaS contract analysis dashboard.
    Analyze the following contract clauses.
    
    Respond ONLY with a valid JSON array where each object has this EXACT structure:
    {{
      "id": (the integer id provided),
      "risk_level": "high | medium | low",
      "plain_issue_title": "Short 5-8 word headline",
      "plain_issue_explanation": "Explain the problem in simple English. Max 3 short sentences.",
      "why_it_matters": "Explain in simple business terms.",
      "quick_risk_points": ["max 10 words", "max 10 words"],
      "recommended_fix_summary": "One simple sentence explaining what to change.",
      "improved_clause_text": "The FULL rewritten, safer version of the clause. DO NOT use ellipses (...) or truncate! You MUST write the complete revised text."
    }}
    
    Clauses to analyze:
    """
    
    for item in clauses_data:
        prompt += f"\n--- CLAUSE ID: {item['id']} ---\nSuggested Type: {item['label']}\nText: \"\"\"{item['text']}\"\"\"\n"

    try:
        response = await gemini_model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)

    except Exception as e:
        print("AI batch parsing error:", e)
        return [
            {
                "id": item["id"],
                "risk_level": "medium",
                "plain_issue_title": "Analysis unavailable",
                "plain_issue_explanation": "We could not analyze this clause.",
                "why_it_matters": "Manual legal review is recommended.",
                "quick_risk_points": ["AI parsing failed."],
                "recommended_fix_summary": "Please review manually.",
                "improved_clause_text": item["text"]
            } for item in clauses_data
        ]

# ==================================================
# SEMANTIC COVERAGE
# ==================================================

SIMILARITY_THRESHOLD = 0.60

def calculate_semantic_coverage(clauses, contract_type):
    required_clauses = PRECOMPUTED_DEFINITION_EMBEDDINGS.get(contract_type, {})

    if not required_clauses:
        return 0, [], []

    if not clauses:
        return 0, [], list(required_clauses.keys())

    covered_clauses = []
    missing_clauses = []

    # split clauses into sentences for much higher embedding accuracy against keywords
    sentences = []
    for clause in clauses:
        sents = re.split(r'(?<=[.!?])\s+', clause)
        sentences.extend([s for s in sents if len(s) > 15])

    if not sentences:
        return 0, [], list(required_clauses.keys())

    sentence_embeddings = embedding_model.encode(sentences)

    for clause_name, definition_embedding in required_clauses.items():
        max_similarity = 0

        for sentence_embedding in sentence_embeddings:
            similarity = cosine_similarity(
                [definition_embedding],
                [sentence_embedding]
            )[0][0]

            max_similarity = max(max_similarity, similarity)

        if max_similarity >= SIMILARITY_THRESHOLD:
            covered_clauses.append(clause_name)
        else:
            missing_clauses.append(clause_name)

    coverage_score = (len(covered_clauses) / len(required_clauses)) * 100

    return round(coverage_score, 2), covered_clauses, missing_clauses

# ==================================================
# API ENDPOINT
# ==================================================

@app.post("/api/analyze")
async def analyze_contract(file: UploadFile = File(...), contract_type: str = Form(...)):

    upload_folder = "uploads"
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        extracted_text = extract_text(file_path)
        cleaned_text = clean_text(extracted_text)
        clauses = split_into_clauses(cleaned_text)

        coverage_score, covered_clauses, missing_clauses = calculate_semantic_coverage(
            clauses, contract_type
        )

        batch_payload = []
        results = []

        # Classify all clauses and determine which ones need Gemini
        for i, clause in enumerate(clauses):
            predicted_label_id = predict_clause(clause)
            raw_label_name = real_label_names[predicted_label_id]

            # Only run expensive Gemini API on relevant/high-risk clauses
            is_high_risk = any(hr in raw_label_name for hr in HIGH_RISK_LABELS)

            if is_high_risk:
                batch_payload.append({
                    "id": i,
                    "text": clause,
                    "label": raw_label_name
                })
            else:
                # Generate standard analysis locally
                results.append({
                    "id": i,
                    "clause": clause,
                    "predicted_label_name": raw_label_name,
                    "risk_level": "low",
                    "analysis": {
                        "risk_level": "low",
                        "plain_issue_title": "Standard Clause",
                        "plain_issue_explanation": f"This appears to be a standard {raw_label_name} clause.",
                        "why_it_matters": "Routine operational term. Low inherent risk.",
                        "quick_risk_points": ["Standard terms"],
                        "recommended_fix_summary": "No changes needed.",
                        "improved_clause_text": clause
                    }
                })

        # Execute Gemini API in batches
        ai_analyses_map = {}
        batch_size = 10
        chunks = [batch_payload[i:i + batch_size] for i in range(0, len(batch_payload), batch_size)]

        tasks = [get_ai_analysis_batch(chunk) for chunk in chunks]
        batch_results = await asyncio.gather(*tasks)

        # Flatten batch responses and map by id
        for batch_res in batch_results:
            for res in batch_res:
                ai_analyses_map[res["id"]] = res

        # Combine AI results with the pre-filtered results
        for item in batch_payload:
            i = item["id"]
            ai_data = ai_analyses_map.get(i, {
                "risk_level": "medium",
                "plain_issue_title": "Analysis unavailable",
                "plain_issue_explanation": "AI failed.",
                "why_it_matters": "Review manually.",
                "quick_risk_points": [],
                "recommended_fix_summary": "Review manually.",
                "improved_clause_text": item["text"]
            })

            results.append({
                "id": i,
                "clause": item["text"],
                "predicted_label_name": item["label"],
                "risk_level": ai_data.get("risk_level", "medium"),
                "analysis": ai_data
            })

        # Sort results to restore chronological document order
        results.sort(key=lambda x: x["id"])

        # Clean up 'id' before returning as it was internal
        for res in results:
            del res["id"]

        return {
            "message": "File processed successfully",
            "filename": file.filename,
            "contract_type": contract_type,
            "total_clauses": len(clauses),
            "coverage_score": coverage_score,
            "covered_clauses": covered_clauses,
            "missing_clauses": missing_clauses,
            "result": results
        }

    finally:
        # Always clean up the uploaded file after processing
        if os.path.exists(file_path):
            os.remove(file_path)