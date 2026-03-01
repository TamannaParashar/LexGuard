from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import re
import torch
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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

print("Loading LegalBERT model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
legalbert_model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
legalbert_model.eval()

ledgar = load_dataset("lex_glue", "ledgar")
real_label_names = ledgar["train"].features["label"].names

print("LegalBERT loaded successfully.")
print("Total labels:", len(real_label_names))

# ==================================================
# GEMINI INITIALIZATION
# ==================================================

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-2.5-flash")

# ==================================================
# TEXT EXTRACTION
# ==================================================

def extract_text(file_path):
    if file_path.endswith(".pdf"):
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
        return text

    elif file_path.endswith(".docx"):
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])

    return ""

# ==================================================
# CLEAN TEXT
# ==================================================

def clean_text(text):
    text = re.sub(r'\d{1,2}/\d{1,2}/\d{2,4}.*?PM', '', text)
    text = re.sub(r'Page \d+', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

# ==================================================
# SPLIT INTO CLAUSES
# ==================================================

def split_into_clauses(text):
    pattern = r'\n?\s*\d+(?:\.\d+)*\.\s'
    parts = re.split(pattern, text)

    clauses = []
    for c in parts:
        if isinstance(c, str):
            c = c.strip()
            if len(c) > 50:
                clauses.append(c)

    return clauses

# ==================================================
# CLAUSE CLASSIFICATION
# ==================================================

def predict_clause(clause_text):
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

# ==================================================
# GEMINI RISK ANALYSIS
# ==================================================

def get_ai_analysis(clause_text, label_name):

    prompt = f"""
    You are a legal UX writer for a modern SaaS contract analysis dashboard.

    Do NOT write like a lawyer.
    Write for business owners who are not legal experts.
    Keep language simple, clear, and short.

    Clause Type: {label_name}

    Analyze this clause:

    \"\"\"{clause_text}\"\"\"

    Respond ONLY in valid JSON using this EXACT structure:

    {{
    "risk_level": "high | medium | low",

    "plain_issue_title": "Short 5-8 word headline describing the issue",

    "plain_issue_explanation": "Explain the problem in very simple English. Maximum 3 short sentences.",

    "why_it_matters": "Explain in simple business terms what could happen.",

    "quick_risk_points": [
        "Very short bullet (max 10 words)",
        "Very short bullet (max 10 words)",
        "Very short bullet (max 10 words)"
    ],

    "recommended_fix_summary": "One simple sentence explaining what should change.",

    "improved_clause_text": "Provide a safer rewritten version of the clause."
    }}

    Rules:
    - No legal jargon.
    - No long paragraphs.
    - Keep sentences short.
    - This will be shown in small UI cards.
    - Return JSON only.
    """

    try:
        response = gemini_model.generate_content(prompt)
        text = response.text.strip()

        json_start = text.find("{")
        json_end = text.rfind("}") + 1
        json_text = text[json_start:json_end]

        return json.loads(json_text)

    except Exception as e:
        print("AI parsing error:", e)
        return {
        "risk_level": "medium",
        "plain_issue_title": "Analysis unavailable",
        "plain_issue_explanation": "We could not analyze this clause.",
        "why_it_matters": "Manual legal review is recommended.",
        "quick_risk_points": ["AI parsing failed."],
        "recommended_fix_summary": "Please review manually.",
        "improved_clause_text": "Consult legal counsel."
    }

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

    clause_embeddings = embedding_model.encode(clauses)

    for clause_name, definition_embedding in required_clauses.items():

        max_similarity = 0

        for clause_embedding in clause_embeddings:
            similarity = cosine_similarity(
                [definition_embedding],
                [clause_embedding]
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
async def analyze_contract(file: UploadFile = File(...),contract_type: str = Form(...)):

    upload_folder = "uploads"
    os.makedirs(upload_folder, exist_ok=True)

    file_path = os.path.join(upload_folder, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    extracted_text = extract_text(file_path)
    cleaned_text = clean_text(extracted_text)
    clauses = split_into_clauses(cleaned_text)
    results = []

    for clause in clauses[:10]:
        predicted_label_id = predict_clause(clause)
        raw_label_name = real_label_names[predicted_label_id]

        analysis = get_ai_analysis(clause, raw_label_name)

        results.append({
            "clause": clause,
            "predicted_label_name": raw_label_name,
            "risk_level": analysis["risk_level"],
            "analysis": analysis
        })

    coverage_score, covered_clauses, missing_clauses = calculate_semantic_coverage(
        clauses,
        contract_type
    )

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