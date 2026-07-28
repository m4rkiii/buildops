import os
from datetime import datetime

MODEL_VERSION = "delay-xgb-v1.0.0-stub"
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

class ModelRegistry:
    def __init__(self):
        self.model_version = MODEL_VERSION
        os.makedirs(MODELS_DIR, exist_ok=True)

    def predict_delay_risk(self, request_data) -> tuple[float, str, str]:
        """
        Calculates delay risk probability, risk level string, and returns model version.
        Wired with heuristic logic for D1 contract stub phase; replaced by trained XGBoost in D3/D4.
        """
        # Heuristic estimation logic for contract verification
        delay_ratio = request_data.current_delay_days / max(request_data.planned_duration_days, 1)
        progress_ratio = request_data.completed_milestones_count / max(request_data.total_milestones_count, 1)
        
        # Risk probability estimation formula
        prob = min(max(0.10 + (delay_ratio * 1.5) - (progress_ratio * 0.15), 0.05), 0.95)
        prob = round(prob, 4)

        if prob >= 0.65:
            risk_level = "HIGH"
        elif prob >= 0.35:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        return prob, risk_level, self.model_version

registry = ModelRegistry()
