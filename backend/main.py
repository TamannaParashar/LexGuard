from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File
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
# LOAD TRAINED LEDGAR MODEL
# ==================================================

MODEL_PATH = "legalbert_ledgar_model"

print("Loading trained LEDGAR model...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
legalbert_model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
legalbert_model.eval()

# Load real LEDGAR label names
ledgar = load_dataset("lex_glue", "ledgar")
real_label_names = ledgar["train"].features["label"].names

print("Model loaded successfully.")
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

import json

def get_ai_analysis(clause_text, label_name):

    prompt = f"""
You are a senior corporate legal risk analyst.

Clause Type: {label_name}

Analyze the following contract clause carefully:

\"\"\"{clause_text}\"\"\"

Respond ONLY in valid JSON with this exact structure:

{{
  "risk_level": "high | medium | low",
  "summary": "2 sentence executive summary of the risk.",
  "why_risky": [
    "bullet point 1",
    "bullet point 2",
    "bullet point 3"
  ],
  "business_impact": "Explain in plain English what this means for the company.",
  "recommended_revision": "Provide safer improved wording of the clause."
}}

Do not include markdown.
Do not include explanation outside JSON.
Return JSON only.
"""

    try:
        response = gemini_model.generate_content(prompt)
        text = response.text.strip()

        # Extract JSON safely
        json_start = text.find("{")
        json_end = text.rfind("}") + 1
        json_text = text[json_start:json_end]

        parsed = json.loads(json_text)

        return parsed

    except Exception as e:
        print("AI parsing error:", e)
        return {
            "risk_level": "medium",
            "summary": "Unable to analyze clause.",
            "why_risky": ["AI response parsing failed."],
            "business_impact": "Manual review recommended.",
            "recommended_revision": "Please consult legal counsel."
        }

# ==================================================
# API ENDPOINT
# ==================================================

@app.post("/api/analyze")
async def analyze_contract(file: UploadFile = File(...)):

    upload_folder = "uploads"
    os.makedirs(upload_folder, exist_ok=True)

    file_path = os.path.join(upload_folder, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    extracted_text = extract_text(file_path)
    cleaned_text = clean_text(extracted_text)
    clauses = split_into_clauses(cleaned_text)

    results = []

    for clause in clauses[:5]:

        predicted_label_id = predict_clause(clause)
        label_name = real_label_names[predicted_label_id]

        analysis = get_ai_analysis(clause, label_name)

        results.append({
        "clause": clause,
        "predicted_label_name": label_name,
        "risk_level": analysis["risk_level"],
        "analysis": analysis
    })

    return {
        "message": "File processed successfully",
        "filename": file.filename,
        "total_clauses": len(clauses),
        "result": results
    }