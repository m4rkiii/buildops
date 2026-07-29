from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DelayRiskRequest(BaseModel):
    project_type: str = Field(..., example="Commercial")
    county: str = Field(..., example="Nairobi")
    nca_contractor_grade: Optional[str] = Field("NCA 1", example="NCA 1")
    budget_ksh: float = Field(..., gt=0, example=450000000.0)
    planned_duration_days: int = Field(..., gt=0, example=365)
    completed_milestones_count: int = Field(0, ge=0, example=2)
    total_milestones_count: int = Field(1, ge=1, example=5)
    current_delay_days: int = Field(0, ge=0, example=5)

class DelayRiskResponse(BaseModel):
    delay_risk_prob: float = Field(..., ge=0.0, le=1.0, example=0.18)
    risk_level: str = Field(..., example="LOW")  # LOW, MEDIUM, HIGH
    model_version: str = Field(..., example="delay-xgb-v1.0.0")
    timestamp: str = Field(..., example="2026-07-28T10:00:00.000Z")

class CostOverrunRequest(BaseModel):
    project_type: str = Field(..., example="Commercial")
    county: str = Field(..., example="Nairobi")
    nca_contractor_grade: Optional[str] = Field("NCA 1", example="NCA 1")
    budget_ksh: float = Field(..., gt=0, example=450000000.0)
    planned_duration_days: int = Field(..., gt=0, example=365)
    completed_milestones_count: int = Field(0, ge=0, example=2)
    total_milestones_count: int = Field(1, ge=1, example=5)
    current_delay_days: int = Field(0, ge=0, example=5)

class CostOverrunResponse(BaseModel):
    cost_overrun_pct: float = Field(..., ge=0.0, example=12.45)
    estimated_overrun_ksh: float = Field(..., ge=0.0, example=56025000.0)
    model_version: str = Field(..., example="cost-lgbm-v1.0.0")
    timestamp: str = Field(..., example="2026-07-28T10:00:00.000Z")
