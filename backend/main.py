from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import pdfplumber
from docx import Document
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

MODEL_PATH = "legalbert_legal_model"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)

model.eval()

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
        return "Unsupported file type"
    
def clean_text(text):
    # Remove timestamps like 2/22/26, 5:52 PM
    text = re.sub(r'\d{1,2}/\d{1,2}/\d{2,4}.*?PM', '', text)

    # Remove multiple spaces
    text = re.sub(r'\s+', ' ', text)

    # Remove page numbers like Page 1, Page 2
    text = re.sub(r'Page \d+', '', text)

    return text.strip()
    
def split_into_clauses(text):
    pattern = r'\n?\s*\d+(?:\.\d+)*\.\s'
    parts = re.split(pattern, text)

    clauses = []
    for c in parts:
        if c and isinstance(c, str):
            c = c.strip()
            if len(c) > 50:
                clauses.append(c)

    return clauses

def classify_clause(text):
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=512
    )

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        prediction = torch.argmax(logits, dim=1).item()

    return prediction

@app.post("/api/analyze")
async def analyze_contract(file: UploadFile = File(...)):

    upload_folder = "uploads"
    os.makedirs(upload_folder, exist_ok=True)

    file_path = os.path.join(upload_folder, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    extracted_text = extract_text(file_path)
    cleaned_text = clean_text(extracted_text)

    print("----- Cleaned Text Preview -----")
    print(cleaned_text[:500])

    clauses = split_into_clauses(cleaned_text)

    results = []

    for clause in clauses[:10]:   # limit for testing
        label = classify_clause(clause)
        results.append({
            "clause": clause,
            "predicted_label": label
        })

    print(f"Total clauses detected: {len(clauses)}")

    return {
        "message": "File processed successfully",
        "filename": file.filename,
        "total_clauses": len(clauses),
        "clauses_preview": clauses[:5],
        "result": results
    }