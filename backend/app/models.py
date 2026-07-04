from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: EmailStr

    class Config:
        populate_by_name = True

class GenePredictionRequest(BaseModel):
    sequence: str

class GenePredictionResponse(BaseModel):
    originalSequence: str
    editedSequence: str
    changeIndicator: str
    efficiency: float
    changedPosition: int
    originalBase: str
    newBase: str
    message: str
    originalEfficiency: float
    gcContent: Optional[float] = None
    explanation: Optional[str] = None
    meltingTemp: Optional[float] = None
    molecularWeight: Optional[float] = None
    id: Optional[str] = None

    class Config:

        coerce_numbers_to_str = False

class BatchPredictionRequest(BaseModel):
    sequences: List[str]

class BatchPredictionResponse(BaseModel):
    results: List[GenePredictionResponse]

class SequenceCompareRequest(BaseModel):
    sequence1: str
    sequence2: str

class SequenceCompareResponse(BaseModel):
    alignment_seq1: str
    alignment_match: str
    alignment_seq2: str
    matches: int
    mismatches: int
    gaps: int
    similarity_percent: float
    seq1_tm: float
    seq2_tm: float
    seq1_mw: float
    seq2_mw: float
    seq1_gc: float
    seq2_gc: float

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    prediction_context: Optional[dict] = None
    ncbi_context: Optional[dict] = None

class ChatResponse(BaseModel):
    reply: str

class OffTargetRequest(BaseModel):
    sequence: str

class OffTargetSite(BaseModel):
    variant: str
    position: int
    original_base: str
    new_base: str
    mismatches: int
    risk: str
    score: float
    region: str

class OffTargetResponse(BaseModel):
    sites: List[OffTargetSite]
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    summary: str

