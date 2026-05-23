# ⚖️ LexGuard — AI-Powered Contract Analyzer

> Upload your legal agreements and let AI highlight risks, suggest improvements, and identify strong clauses instantly.

LexGuard is a full-stack web application that uses a hybrid AI pipeline — combining a fine-tuned **LegalBERT** model with **Google Gemini 2.5 Flash** — to perform deep risk analysis on legal contracts. Users can upload a PDF or DOCX contract, select the contract type, and receive a detailed clause-by-clause risk report with plain-English explanations, severity ratings, recommended fixes, and AI-rewritten safer clause alternatives.

---

## 📸 Features at a Glance

- 🔍 **Clause Classification** — LegalBERT (fine-tuned on the LEDGAR dataset) classifies every clause into legal categories (Termination, Indemnification, Payment Terms, etc.)
- 🤖 **AI Risk Analysis** — Google Gemini 2.5 Flash analyzes high-risk clauses and returns structured JSON with risk levels, plain-English explanations, and improved clause suggestions
- 📊 **Semantic Coverage Score** — Uses sentence embeddings (`all-MiniLM-L6-v2`) to check whether a contract contains all expected clause types for its category
- 📄 **Multi-format Support** — Accepts both PDF and DOCX documents, up to 10MB
- 📑 **PDF Export** — Download the full analysis report as a styled PDF via `jsPDF` + `html2canvas`
- 🎨 **Modern UI** — Dark-themed, glassmorphic React frontend with animated backgrounds and smooth transitions

---

## 🗂️ Project Structure

```
contractAnalyzer/
├── backend/                          # Python FastAPI backend
│   ├── main.py                       # Core API, AI pipeline, and endpoints
│   ├── required_clause_definitions.py# Contract-type clause definitions for semantic coverage
│   ├── legalbert_ledgar_model/       # Fine-tuned LegalBERT model files (local)
│   ├── uploads/                      # Temporary file storage (auto-cleaned after analysis)
│   └── .env                          # Environment variables (GEMINI_API_KEY)
│
└── frontend/                         # React + Vite frontend
    ├── src/
    │   ├── Home.jsx                  # Landing page: file upload, contract type selection
    │   ├── Result.jsx                # Results page: risk dashboard, clause cards, PDF export
    │   ├── App.jsx                   # Router setup (React Router v7)
    │   └── index.css                 # Global styles
    ├── public/
    │   └── homePageVideo.mp4         # Hero section background video
    ├── index.html
    ├── vite.config.js                # Vite config with /api proxy to FastAPI
    └── package.json
```

---

## 🧠 AI Pipeline (How It Works)

```
Contract Upload (PDF / DOCX)
        │
        ▼
  Text Extraction
  (pdfplumber / python-docx)
        │
        ▼
  Text Cleaning & Clause Splitting
  (regex-based paragraph & numbered-list detection)
        │
        ▼
  ┌─────────────────────────────┐
  │   LegalBERT Classification  │  ← Classifies each clause into a legal category
  │   (LEDGAR fine-tuned model) │
  └─────────────────────────────┘
        │
        ├─── High-Risk Clauses ──►  Gemini 2.5 Flash  ← Batched async risk analysis
        │                           (risk level, plain explanation, improved clause text)
        │
        └─── Standard Clauses ──►  Default "Low Risk" response (no API call)
        │
        ▼
  Semantic Coverage Check
  (SentenceTransformer cosine similarity vs. required clause definitions)
        │
        ▼
  Final JSON Response → React Frontend
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **LegalBERT for classification, Gemini for analysis** | LegalBERT is fast and free for clause categorization; Gemini handles nuanced natural-language risk explanation |
| **Only send high-risk clauses to Gemini** | Avoids unnecessary API costs; standard clauses get a default low-risk response locally |
| **Batched async Gemini calls** | Up to 10 clauses per batch, sent concurrently with `asyncio.gather` for speed |
| **Semantic coverage via embeddings** | More robust than keyword matching — uses cosine similarity against precomputed clause definition embeddings |
| **Temporary file cleanup** | Uploaded contracts are deleted from the server immediately after processing (in a `finally` block) |

---

## 📋 Supported Contract Types & Required Clauses

LexGuard checks for the presence of essential clauses per contract type using semantic similarity:

### SaaS Agreement
`Governing Law` · `Termination` · `Indemnification` · `Limitation of Liability` · `Confidentiality` · `Payment Terms` · `Service Level Agreement (SLA)` · `Data Protection` · `Dispute Resolution`

### NDA (Non-Disclosure Agreement)
`Definition of Confidential Information` · `Obligations of Receiving Party` · `Exclusions` · `Term of Confidentiality` · `Remedies` · `Governing Law`

### Employment Agreement
`Compensation` · `Termination` · `Confidentiality` · `Non-Compete` · `Intellectual Property Assignment`

### Vendor Agreement
`Scope of Services` · `Payment Terms` · `Indemnification` · `Limitation of Liability` · `Compliance with Laws`

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)
- The fine-tuned LegalBERT model files placed in `backend/legalbert_ledgar_model/`

### Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install fastapi uvicorn python-dotenv pdfplumber python-docx \
            transformers torch datasets google-generativeai \
            sentence-transformers scikit-learn

# Add your Gemini API key
# Create a .env file with:
# GEMINI_API_KEY=your_key_here

# Start the server
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies `/api` requests to the FastAPI backend at `http://localhost:8000`.

---

## 🔌 API Reference

### `POST /api/analyze`

Analyzes a contract file and returns a structured risk report.

**Request** — `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | PDF or DOCX contract (max 10MB) |
| `contract_type` | string | One of: `SaaS Agreement`, `NDA`, `Employment Agreement`, `Vendor Agreement` |

**Response** — `application/json`

```json
{
  "message": "File processed successfully",
  "filename": "contract.pdf",
  "contract_type": "NDA",
  "total_clauses": 18,
  "coverage_score": 83.33,
  "covered_clauses": ["Governing Law", "Termination", "Confidentiality"],
  "missing_clauses": ["Dispute Resolution"],
  "result": [
    {
      "clause": "Either party may terminate this agreement...",
      "predicted_label_name": "Termination",
      "risk_level": "high",
      "analysis": {
        "risk_level": "high",
        "plain_issue_title": "One-sided termination with no notice",
        "plain_issue_explanation": "The vendor can terminate immediately without cause...",
        "why_it_matters": "You could lose service access without warning.",
        "quick_risk_points": ["No notice period required", "No cure period for breach"],
        "recommended_fix_summary": "Add a 30-day notice period and a 15-day cure window.",
        "improved_clause_text": "Either party may terminate this agreement upon 30 days written notice..."
      }
    }
  ]
}
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| **FastAPI** | REST API framework |
| **LegalBERT** (LEDGAR fine-tune) | Clause classification |
| **Google Gemini 2.5 Flash** | AI risk analysis & clause rewriting |
| **SentenceTransformers** (`all-MiniLM-L6-v2`) | Semantic clause coverage scoring |
| **pdfplumber** | PDF text extraction |
| **python-docx** | DOCX text extraction |
| **PyTorch** | Model inference |

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** + **Vite 7** | UI framework & build tool |
| **React Router v7** | Client-side routing |
| **Tailwind CSS v4** | Utility-first styling |
| **Recharts** | Data visualization (coverage charts) |
| **Lucide React** | Icon library |
| **jsPDF** + **html2canvas** | PDF export |

---
