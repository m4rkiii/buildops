from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import time

from app.schemas import DelayRiskRequest, DelayRiskResponse
from app.registry import registry

app = FastAPI(
    title="BuildOps Sentinel ML Service",
    description="Machine Learning service for construction delay risk and cost overrun forecasting",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "buildops-ml-service",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/predict/delay-risk", response_model=DelayRiskResponse)
def predict_delay_risk(request: DelayRiskRequest):
    """
    Predicts construction project delay risk probability (FR05/NFR02).
    Latency target: < 2 seconds.
    """
    start_time = time.time()
    
    prob, risk_level, model_version = registry.predict_delay_risk(request)
    
    elapsed_time = time.time() - start_time
    if elapsed_time > 2.0:
        print(f"[NFR02 Warning] Inference latency ({elapsed_time:.3f}s) exceeded 2.0s target!")

    return DelayRiskResponse(
        delay_risk_prob=prob,
        risk_level=risk_level,
        model_version=model_version,
        timestamp=datetime.utcnow().isoformat()
    )
