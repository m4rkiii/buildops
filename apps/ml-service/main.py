from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

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
