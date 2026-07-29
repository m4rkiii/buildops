import os
import joblib
import pandas as pd
import numpy as np
from datetime import datetime

DELAY_MODEL_VERSION = "delay-xgb-v1.0.0"
COST_MODEL_VERSION = "cost-lgbm-v1.0.0"

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
DELAY_ARTIFACT_PATH = os.path.join(MODELS_DIR, "delay_xgb_v1.joblib")
COST_ARTIFACT_PATH = os.path.join(MODELS_DIR, "cost_lgbm_v1.joblib")

class ModelRegistry:
    def __init__(self):
        self.delay_model_version = DELAY_MODEL_VERSION
        self.cost_model_version = COST_MODEL_VERSION
        self.delay_pipeline = None
        self.cost_pipeline = None
        self._load_models()

    def _load_models(self):
        # Load XGBoost Delay Model
        if os.path.exists(DELAY_ARTIFACT_PATH):
            try:
                self.delay_pipeline = joblib.load(DELAY_ARTIFACT_PATH)
                print(f"[ModelRegistry] Loaded delay risk artifact from {DELAY_ARTIFACT_PATH}")
            except Exception as e:
                print(f"[ModelRegistry Warning] Failed to load delay model artifact: {e}")
                self.delay_pipeline = None
        else:
            print(f"[ModelRegistry Info] Delay artifact {DELAY_ARTIFACT_PATH} not found. Running in stub mode.")

        # Load LightGBM Cost Overrun Model
        if os.path.exists(COST_ARTIFACT_PATH):
            try:
                self.cost_pipeline = joblib.load(COST_ARTIFACT_PATH)
                print(f"[ModelRegistry] Loaded cost overrun artifact from {COST_ARTIFACT_PATH}")
            except Exception as e:
                print(f"[ModelRegistry Warning] Failed to load cost model artifact: {e}")
                self.cost_pipeline = None
        else:
            print(f"[ModelRegistry Info] Cost artifact {COST_ARTIFACT_PATH} not found. Running in stub mode.")

    def predict_delay_risk(self, request_data) -> tuple[float, str, str]:
        """
        Predicts delay risk probability using trained XGBoost pipeline if available,
        or fallback estimation if un-trained.
        """
        if self.delay_pipeline is not None:
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

            prob = float(self.delay_pipeline.predict_proba(input_df)[0][1])
            prob = round(prob, 4)

            risk_level = "HIGH" if prob >= 0.65 else ("MEDIUM" if prob >= 0.35 else "LOW")
            return prob, risk_level, self.delay_model_version
        else:
            delay_ratio = request_data.current_delay_days / max(request_data.planned_duration_days, 1)
            progress_ratio = request_data.completed_milestones_count / max(request_data.total_milestones_count, 1)
            prob = min(max(0.10 + (delay_ratio * 1.5) - (progress_ratio * 0.15), 0.05), 0.95)
            prob = round(prob, 4)

            risk_level = "HIGH" if prob >= 0.65 else ("MEDIUM" if prob >= 0.35 else "LOW")
            return prob, risk_level, f"{self.delay_model_version}-stub"

    def predict_cost_overrun(self, request_data) -> tuple[float, float, str]:
        """
        Predicts cost overrun percentage and financial overrun (KSh) using trained LightGBM model.
        """
        planned_duration = max(int(request_data.planned_duration_days), 1)
        completed_milestones = int(request_data.completed_milestones_count)
        total_milestones = max(int(request_data.total_milestones_count), 1)
        current_delay = int(request_data.current_delay_days)
        budget = float(request_data.budget_ksh)

        if self.cost_pipeline is not None:
            input_df = pd.DataFrame([{
                'project_type': request_data.project_type,
                'county': request_data.county,
                'nca_contractor_grade': request_data.nca_contractor_grade or 'NCA 1',
                'budget_ksh': budget,
                'planned_duration_days': planned_duration,
                'completed_milestones_count': completed_milestones,
                'total_milestones_count': total_milestones,
                'current_delay_days': current_delay,
                'delay_ratio': current_delay / planned_duration,
                'progress_ratio': completed_milestones / total_milestones,
                'is_delayed_signal': 1 if current_delay > 0 else 0
            }])

            pred_pct = float(self.cost_pipeline.predict(input_df)[0])
            cost_overrun_pct = round(max(0.0, pred_pct), 2)
            estimated_overrun_ksh = round(budget * (cost_overrun_pct / 100.0), 2)
            return cost_overrun_pct, estimated_overrun_ksh, self.cost_model_version
        else:
            delay_ratio = current_delay / planned_duration
            if current_delay > 0:
                cost_overrun_pct = round(12.5 + (delay_ratio * 25.0), 2)
            else:
                cost_overrun_pct = 1.25

            estimated_overrun_ksh = round(budget * (cost_overrun_pct / 100.0), 2)
            return cost_overrun_pct, estimated_overrun_ksh, f"{self.cost_model_version}-stub"

registry = ModelRegistry()
