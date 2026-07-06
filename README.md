# 🧬 GeneTrust — CRISPR Guide RNA Optimisation Platform

**GeneTrust** is a full-stack bioinformatics web application that uses **DNABERT-2**, a transformer model pre-trained on the human genome, to analyse and optimise 20-mer CRISPR-Cas9 guide RNA sequences. It predicts the optimal single-base mutation to improve guide efficiency, calculates biochemical properties, and provides an AI-powered research assistant.

---

## 🧪 Use Cases

| Use Case | Description |
|---|---|
| **Guide RNA Optimisation** | Submit a 20-mer DNA sequence and receive an AI-predicted single-base edit that maximises structural similarity to high-efficiency reference targets |
| **Batch Sequence Analysis** | Upload or paste multiple 20-mer sequences at once for parallel DNABERT-2 scoring |
| **Sequence Alignment & Comparison** | Pairwise global alignment (Needleman–Wunsch) between two sequences with match/mismatch/gap stats and GC/Tm comparison |
| **Off-Target Risk Scoring** | Heuristic CRISPR off-target risk analysis based on seed-region mismatches and GC content — flags HIGH / MEDIUM / LOW risk variants |
| **NCBI Gene Import** | Search human genes by name (e.g. *CFTR*, *HBB*, *HTT*) and auto-import a curated 20-mer for immediate analysis |
| **AI Research Assistant** | Context-aware chat powered by **Llama 3.3 70B** (via Groq) with full prediction context, specialised in CRISPR, genomics, and molecular biology |
| **Prediction History** | Per-user history of all past analyses, stored in MongoDB |
| **PDF Report Export** | Export analysis results as a formatted PDF report |

---

## 🤖 Models Used

### Core Prediction Engine
- **[DNABERT-2-117M](https://huggingface.co/zhihan1996/DNABERT-2-117M)** (`zhihan1996/DNABERT-2-117M`)
  - A 117M-parameter BERT-style transformer pre-trained on multi-species genomes using k-mer tokenisation
  - Used to generate token embeddings for 20-mer guide RNA sequences
  - Cosine similarity against curated reference embeddings is used to score sequence quality and identify the weakest nucleotide position
  - Runs on **CPU** (no GPU required)

### AI Research Assistant
- **Llama 3.3 70B Versatile** (served via [Groq API](https://console.groq.com/))
  - Bioinformatics-specialised assistant with a domain-specific system prompt
  - Context-aware: receives the current prediction result and NCBI gene metadata alongside user messages
  - Falls back gracefully when no API key is configured

### Bioinformatics Libraries
- **BioPython** — Pairwise alignment (`Bio.Align`), melting temperature (`Bio.SeqUtils.MeltingTemp`), molecular weight
- **NCBI E-utilities** — Live gene sequence retrieval (esearch + efetch)

---

## ✨ Features

### Backend (FastAPI + Python)
- 🔐 **JWT Authentication** — Register/login with bcrypt password hashing, 7-day token expiry
- 🧬 **Sequence Prediction** — DNABERT-2 embedding + cosine similarity scoring; returns edited sequence, efficiency gain, GC%, Tm, MW
- 📦 **Batch Prediction** — Process multiple sequences in a single request
- ↔️ **Sequence Comparison** — Global pairwise alignment with detailed match/mismatch/gap breakdown
- 🎯 **Off-Target Analysis** — Enumerates all 1-mismatch and top 2-mismatch variants; scores by seed region penalty and GC thermodynamics
- 🔬 **NCBI Integration** — Fetches real RefSeq human gene sequences; curated 20-mer targets for CFTR, HBB, HEXA, HTT
- 🤖 **AI Chat** — Multi-turn Groq/Llama conversation with prediction + NCBI context injection
- 📊 **History API** — Per-user prediction history stored in MongoDB (Motor async driver)

### Frontend (React 19 + TypeScript + Vite)
- 🖥️ **Dashboard** — Single-page app with tabbed navigation
- 📈 **Stats Tab** — Visual summary of user prediction history
- 🧪 **Batch Analysis** — Paste multiple sequences, see all results in a table
- 🔍 **Gene Explorer** — Search NCBI and load gene sequences with one click
- ⚠️ **Off-Target Panel** — Interactive risk table with HIGH/MEDIUM/LOW colour coding
- 💬 **AI Assistant** — Floating chat panel with markdown rendering and prediction context
- 📄 **PDF Export** — Download formatted analysis reports (jsPDF + jsPDF-AutoTable)
- 🎨 **Animations** — Smooth transitions via Framer Motion

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Framer Motion, Lucide Icons |
| Backend | FastAPI, Python 3.11+, Uvicorn |
| ML | PyTorch, HuggingFace Transformers (DNABERT-2), BioPython |
| Database | MongoDB (async via Motor) |
| Auth | JWT (PyJWT), bcrypt |
| AI Chat | Groq API (Llama 3.3 70B) |
| Styling | Vanilla CSS |

---

## ⚙️ Local Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** and **npm**
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)
- **Groq API Key** (free at [console.groq.com](https://console.groq.com/)) — optional, for AI chat

---

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/genetrust-react-fastapi.git
cd genetrust-react-fastapi
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt
# Also install biopython and groq (if not already in requirements)
pip install biopython groq
```

#### Create `backend/.env`

```env
MONGO_URI=mongodb://localhost:27017
DB_NAME=genetrust
JWT_SECRET=your_super_secret_key_here
GROQ_API_KEY=your_groq_api_key_here   # Optional — enables AI chat
```

#### Start the Backend

```bash
# From the backend/ directory (venv activated)
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive API docs: `http://localhost:8000/docs`

> **Note:** On first startup, DNABERT-2 (~500 MB) will be automatically downloaded from HuggingFace. This may take a few minutes.

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create frontend/.env
echo "VITE_API_URL=http://localhost:8000" > .env

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

### 4. MongoDB

If running locally, start MongoDB:

```bash
mongod --dbpath /usr/local/var/mongodb   # macOS (Homebrew)
# or
brew services start mongodb-community    # macOS (Homebrew service)
```

Or point `MONGO_URI` in `backend/.env` to your **MongoDB Atlas** connection string.

---

## 📁 Project Structure

```
genetrust-react-fastapi/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, all API routes
│   │   ├── ml_service.py    # DNABERT-2 model, sequence analysis, off-target scoring
│   │   ├── ai_chat.py       # Groq/Llama AI assistant
│   │   ├── ncbi_service.py  # NCBI E-utilities integration
│   │   ├── auth.py          # JWT auth routes
│   │   ├── database.py      # MongoDB (Motor) connection
│   │   └── models.py        # Pydantic request/response models
│   ├── requirements.txt
│   └── .env                 # (not committed) secrets
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx       # Main app shell + prediction UI
│   │   │   ├── AIAssistant.tsx     # Chat panel
│   │   │   ├── BatchAnalysis.tsx   # Batch sequence input
│   │   │   ├── CompareSequences.tsx
│   │   │   ├── GeneExplorer.tsx    # NCBI gene search
│   │   │   ├── OffTargetPanel.tsx  # Off-target risk table
│   │   │   ├── StatsTab.tsx        # History & stats
│   │   │   └── Auth.tsx            # Login / Register forms
│   │   ├── types.ts
│   │   └── App.tsx
│   ├── package.json
│   └── .env                 # (not committed) VITE_API_URL
│
└── README.md
```

---

## 🔑 Environment Variables Summary

| Variable | Location | Description |
|---|---|---|
| `MONGO_URI` | `backend/.env` | MongoDB connection string |
| `DB_NAME` | `backend/.env` | Database name (default: `genetrust`) |
| `JWT_SECRET` | `backend/.env` | Secret key for signing JWTs |
| `GROQ_API_KEY` | `backend/.env` | Groq API key for AI chat (optional) |
| `VITE_API_URL` | `frontend/.env` | Backend API base URL |

---

## 📄 License

MIT — feel free to use, modify, and distribute.
