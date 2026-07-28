import os
import joblib
import pandas as pd
from datetime import datetime

MODEL_VERSION = "delay-xgb-v1.0.0"
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
ARTIFACT_PATH = os.path.join(MODELS_DIR, "delay_xgb_v1.joblib")

class ModelRegistry:
    def __init__(self):
        self.model_version = MODEL_VERSION
        self.pipeline = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(ARTIFACT_PATH):
            try:
                self.pipeline = joblib.load(ARTIFACT_PATH)
                print(f"[ModelRegistry] Successfully loaded trained artifact from {ARTIFACT_PATH}")
            except Exception as e:
                print(f"[ModelRegistry Warning] Failed to load model artifact: {e}")
                self.pipeline = None
        else:
            print(f"[ModelRegistry Info] Artifact {ARTIFACT_PATH} not found. Running in stub mode.")

    def predict_delay_risk(self, request_data) -> tuple[float, str, str]:
        """
        Predicts delay risk probability using trained XGBoost pipeline if available,
        or fallback estimation if un-trained.
        """
        if self.pipeline is not None:
            # Prepare pandas DataFrame matching model features
            input_df = pd.DataFrame([{
                'project_type': request_data.project_type,
                'county': request_data.county,
                'nca_contractor_grade': request_data.nca_contractor_grade or 'NCA 1',
                'budget_ksh': float(request_data.budget_ksh),
                'planned_duration_days': int(request_data.planned_duration_days),
                'completed_milestones_count': int(request_data.completed_milestones_count),
                'total_milestones_count': int(request_data.total_milestones_count),
                'current_delay_days': int(request_data.current_delay_days)
            }])

            # Perform prediction
            prob = float(self.pipeline.predict_proba(input_df)[0][1])
            prob = round(prob, 4)

            if prob >= 0.65:
                risk_level = "HIGH"
            elif prob >= 0.35:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"

            return prob, risk_level, self.model_version
        else:
            # Fallback estimation logic
            delay_ratio = request_data.current_delay_days / max(request_data.planned_duration_days, 1)
            progress_ratio = request_data.completed_milestones_count / max(request_data.total_milestones_count, 1)
            prob = min(max(0.10 + (delay_ratio * 1.5) - (progress_ratio * 0.15), 0.05), 0.95)
            prob = round(prob, 4)

            risk_level = "HIGH" if prob >= 0.65 else ("MEDIUM" if prob >= 0.35 else "LOW")
            return prob, risk_level, f"{self.model_version}-stub"

registry = ModelRegistry()
