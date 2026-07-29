from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import time

from app.schemas import DelayRiskRequest, DelayRiskResponse, CostOverrunRequest, CostOverrunResponse, AIDigestRequest, AIDigestResponse
from app.registry import registry
from app.digest_engine import digest_engine

app = FastAPI(
    title="BuildOps Sentinel ML Service",
    description="Machine Learning service for construction delay risk, cost overrun forecasting, and AI executive digests",
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

@app.post("/predict/cost-overrun", response_model=CostOverrunResponse)
def predict_cost_overrun(request: CostOverrunRequest):
    """
    Predicts construction project cost overrun percentage and financial overrun amount in KSh (FR06/NFR02).
    Latency target: < 2 seconds.
    """
    start_time = time.time()

    pct, amount_ksh, model_version = registry.predict_cost_overrun(request)

    elapsed_time = time.time() - start_time
    if elapsed_time > 2.0:
        print(f"[NFR02 Warning] Cost overrun inference latency ({elapsed_time:.3f}s) exceeded 2.0s target!")

    return CostOverrunResponse(
        cost_overrun_pct=pct,
        estimated_overrun_ksh=amount_ksh,
        model_version=model_version,
        timestamp=datetime.utcnow().isoformat()
    )

@app.post("/predict/ai-digest", response_model=AIDigestResponse)
def generate_ai_digest(request: AIDigestRequest):
    """
    Generates a comprehensive AI Executive Digest report for project stakeholders (FR08/NFR02).
    Latency target: < 2 seconds.
    """
    start_time = time.time()

    digest = digest_engine.generate_digest(request)

    elapsed_time = time.time() - start_time
    if elapsed_time > 2.0:
        print(f"[NFR02 Warning] AI Digest generation latency ({elapsed_time:.3f}s) exceeded 2.0s target!")

    return AIDigestResponse(**digest)
