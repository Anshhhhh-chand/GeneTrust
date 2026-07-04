from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .auth import router as auth_router, verify_password, SECRET_KEY, ALGORITHM
from .database import get_db
from .models import (
    GenePredictionRequest, GenePredictionResponse,
    SequenceCompareRequest, SequenceCompareResponse,
    ChatRequest, ChatResponse,
    OffTargetRequest, OffTargetResponse, OffTargetSite,
)
from typing import List
from .ml_service import load_ml_model, analyze_sequence, align_sequences, compute_offtarget_risk
from .ai_chat import chat_with_ai
from .ncbi_service import router as ncbi_router
import jwt
from fastapi.security import OAuth2PasswordBearer

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_ml_model()
    yield

app = FastAPI(title="GeneTrust Clone API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(ncbi_router)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    return user_id

@app.post("/api/predict", response_model=GenePredictionResponse)
async def predict_sequence(request: GenePredictionRequest, current_user_id: str = Depends(get_current_user), db = Depends(get_db)):
    sequence = request.sequence.upper()
    if len(sequence) != 20:
        raise HTTPException(status_code=400, detail="Sequence must be exactly 20 characters long")
    if not all(c in ['A', 'T', 'C', 'G'] for c in sequence):
        raise HTTPException(status_code=400, detail="Sequence must contain only A, T, C, G")

    try:
        result = analyze_sequence(sequence)

        result["changedPosition"] += 1

        predictions_collection = db["predictions"]
        db_result = {
            "user_id": current_user_id,
            **result
        }
        insert_res = await predictions_collection.insert_one(db_result)
        result["id"] = str(insert_res.inserted_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/predict/history", response_model=List[GenePredictionResponse])
async def get_prediction_history(current_user_id: str = Depends(get_current_user), db = Depends(get_db)):
    try:
        predictions_collection = db["predictions"]
        cursor = predictions_collection.find({"user_id": current_user_id}).sort("_id", -1).limit(50)
        history = await cursor.to_list(length=50)

        for item in history:
            item["id"] = str(item["_id"])

            if "efficiency" in item:
                item["efficiency"] = float(item["efficiency"])
            if "originalEfficiency" in item:
                item["originalEfficiency"] = float(item["originalEfficiency"])

            item.setdefault("gcContent", None)
            item.setdefault("explanation", None)
            item.setdefault("meltingTemp", None)
            item.setdefault("molecularWeight", None)

        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict/batch", response_model=dict)
async def predict_sequence_batch(request: dict, current_user_id: str = Depends(get_current_user), db = Depends(get_db)):
    sequences = request.get("sequences", [])
    if not sequences:
        raise HTTPException(status_code=400, detail="No sequences provided")

    results = []
    predictions_collection = db["predictions"]

    for seq in sequences:
        sequence = seq.upper()
        if len(sequence) != 20 or not all(c in ['A', 'T', 'C', 'G'] for c in sequence):
            results.append({"originalSequence": sequence, "error": "Invalid sequence format (must be 20 ATCG)"})
            continue

        try:
            result = analyze_sequence(sequence)
            result["changedPosition"] += 1

            db_result = {
                "user_id": current_user_id,
                **result
            }
            insert_res = await predictions_collection.insert_one(db_result)
            result["id"] = str(insert_res.inserted_id)
            results.append(result)
        except Exception as e:
            results.append({"originalSequence": sequence, "error": str(e)})

    return {"results": results}

@app.post("/api/compare", response_model=SequenceCompareResponse)
async def compare_sequences(request: SequenceCompareRequest, current_user_id: str = Depends(get_current_user)):
    seq1 = request.sequence1.upper()
    seq2 = request.sequence2.upper()

    if not all(c in ['A', 'T', 'C', 'G', '-'] for c in seq1) or not all(c in ['A', 'T', 'C', 'G', '-'] for c in seq2):
        raise HTTPException(status_code=400, detail="Sequences must contain only A, T, C, G")

    try:
        result = align_sequences(seq1, seq2)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat", response_model=ChatResponse)
async def ai_chat(request: ChatRequest, current_user_id: str = Depends(get_current_user)):
    """Gemini-powered bioinformatics research assistant."""
    try:
        history_dicts = [{"role": m.role, "content": m.content} for m in (request.history or [])]
        reply = await chat_with_ai(
            message=request.message,
            history=history_dicts,
            prediction_context=request.prediction_context,
            ncbi_context=request.ncbi_context,
        )
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/offtarget", response_model=OffTargetResponse)
async def offtarget_analysis(request: OffTargetRequest, current_user_id: str = Depends(get_current_user)):
    """Heuristic off-target risk scoring for a 20-mer guide RNA."""
    sequence = request.sequence.upper()
    if len(sequence) != 20 or not all(c in ['A', 'T', 'C', 'G'] for c in sequence):
        raise HTTPException(status_code=400, detail="Sequence must be exactly 20 ATCG characters")

    try:
        raw_sites = compute_offtarget_risk(sequence)
        sites = [OffTargetSite(**s) for s in raw_sites]
        high = sum(1 for s in sites if s.risk == "HIGH")
        medium = sum(1 for s in sites if s.risk == "MEDIUM")
        low = sum(1 for s in sites if s.risk == "LOW")

        if high > 10:
            summary = f"⚠️ High off-target risk detected: {high} high-risk sites found. Consider redesigning the guide RNA."
        elif high > 0:
            summary = f"🔶 Moderate off-target concern: {high} high-risk and {medium} medium-risk sites."
        else:
            summary = f"✅ Low off-target risk: no high-risk sites. {medium} medium-risk sites identified."

        return OffTargetResponse(
            sites=sites,
            high_risk_count=high,
            medium_risk_count=medium,
            low_risk_count=low,
            summary=summary,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

