from pydantic import BaseModel, Field
from typing import Optional, List
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

class AIDigestRequest(BaseModel):
    project_name: str = Field(..., example="Nairobi Express Interchange")
    project_type: str = Field(..., example="Infrastructure")
    county: str = Field(..., example="Nairobi")
    nca_contractor_grade: Optional[str] = Field("NCA 1", example="NCA 1")
    budget_ksh: float = Field(..., gt=0, example=850000000.0)
    planned_duration_days: int = Field(..., gt=0, example=365)
    completed_milestones_count: int = Field(0, ge=0, example=2)
    total_milestones_count: int = Field(1, ge=1, example=5)
    current_delay_days: int = Field(0, ge=0, example=15)
    delay_risk_score: Optional[float] = Field(0.25, ge=0.0, le=1.0)
    cost_overrun_pct: Optional[float] = Field(5.2, ge=0.0)

class AIDigestResponse(BaseModel):
    executive_summary: str
    schedule_variance_analysis: str
    financial_overrun_forecast: str
    key_risk_drivers: List[str]
    recommended_mitigations: List[str]
    model_version: str = Field(..., json_schema_extra={"example": "digest-nlp-v1.0.0"})
    timestamp: str = Field(..., json_schema_extra={"example": "2026-07-28T10:00:00.000Z"})

class AnomalyCheckRequest(BaseModel):
    project_type: str = Field(..., json_schema_extra={"example": "Commercial"})
    county: str = Field(..., json_schema_extra={"example": "Nairobi"})
    nca_contractor_grade: Optional[str] = Field("NCA 1", json_schema_extra={"example": "NCA 1"})
    budget_ksh: float = Field(..., gt=0, json_schema_extra={"example": 450000000.0})
    planned_duration_days: int = Field(..., gt=0, json_schema_extra={"example": 365})
    completed_milestones_count: int = Field(0, ge=0, json_schema_extra={"example": 2})
    total_milestones_count: int = Field(1, ge=1, json_schema_extra={"example": 5})
    current_delay_days: int = Field(0, ge=0, json_schema_extra={"example": 5})

class AnomalyCheckResponse(BaseModel):
    is_anomaly: bool
    anomaly_score: float
    detected_outliers: List[str]
    model_version: str = Field(..., json_schema_extra={"example": "anomaly-iforest-v1.0.0"})
    timestamp: str

class ScheduleForecastRequest(BaseModel):
    planned_start_date: str = Field(..., json_schema_extra={"example": "2026-01-01"})
    planned_end_date: str = Field(..., json_schema_extra={"example": "2026-12-31"})
    completed_milestones_count: int = Field(0, ge=0, json_schema_extra={"example": 3})
    total_milestones_count: int = Field(1, ge=1, json_schema_extra={"example": 10})
    current_delay_days: int = Field(0, ge=0, json_schema_extra={"example": 14})

class ScheduleForecastResponse(BaseModel):
    projected_completion_date: str
    estimated_schedule_drift_days: int
    confidence_level: str
    velocity_rate_milestones_per_month: float
    model_version: str = Field(..., json_schema_extra={"example": "schedule-prophet-v1.0.0"})
    timestamp: str

