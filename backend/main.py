from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import re
import torch
import pdfplumber
from docx import Document
from transformers import AutoTokenizer, AutoModelForSequenceClassification

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
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)

model.eval()

from datasets import load_dataset

ledgar = load_dataset("lex_glue", "ledgar")
true_label_names = ledgar["train"].features["label"].names

# Get label names directly from model config (NO dataset download)
label_names = model.config.id2label

print("Model loaded successfully.")
print("Total labels:", len(label_names))

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

    else:
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
        outputs = model(**inputs)
        logits = outputs.logits
        predicted_class = torch.argmax(logits, dim=1).item()

    return predicted_class

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

    # Extract + Clean
    extracted_text = extract_text(file_path)
    cleaned_text = clean_text(extracted_text)

    clauses = split_into_clauses(cleaned_text)

    results = []

    for clause in clauses[:10]:  # Limit for testing
        predicted_label_id = predict_clause(clause)

        results.append({
            "clause": clause,
            "predicted_label_id": predicted_label_id,
            "predicted_label_name": true_label_names[predicted_label_id]
        })

    return {
        "message": "File processed successfully",
        "filename": file.filename,
        "total_clauses": len(clauses),
        "clauses_preview": clauses[:5],
        "result": results
    }