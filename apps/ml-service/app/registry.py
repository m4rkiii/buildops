import os
import joblib
import pandas as pd
import numpy as np
from datetime import datetime

DELAY_MODEL_VERSION = "delay-xgb-v1.0.0"
COST_MODEL_VERSION = "cost-lgbm-v1.0.0"
ENSEMBLE_MODEL_VERSION = "ensemble-rf-v1.0.0"
ANOMALY_MODEL_VERSION = "anomaly-iforest-v1.0.0"
FORECAST_MODEL_VERSION = "schedule-prophet-v1.0.0"

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
DELAY_ARTIFACT_PATH = os.path.join(MODELS_DIR, "delay_xgb_v1.joblib")
COST_ARTIFACT_PATH = os.path.join(MODELS_DIR, "cost_lgbm_v1.joblib")
RF_ARTIFACT_PATH = os.path.join(MODELS_DIR, "ensemble_rf_v1.joblib")
ANOMALY_ARTIFACT_PATH = os.path.join(MODELS_DIR, "anomaly_iforest_v1.joblib")

class ModelRegistry:
    def __init__(self):
        self.delay_model_version = DELAY_MODEL_VERSION
        self.cost_model_version = COST_MODEL_VERSION
        self.ensemble_model_version = ENSEMBLE_MODEL_VERSION
        self.anomaly_model_version = ANOMALY_MODEL_VERSION
        self.forecast_model_version = FORECAST_MODEL_VERSION

        self.delay_pipeline = None
        self.cost_pipeline = None
        self.rf_pipeline = None
        self.anomaly_pipeline = None

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

        # Load LightGBM Cost Overrun Model
        if os.path.exists(COST_ARTIFACT_PATH):
            try:
                self.cost_pipeline = joblib.load(COST_ARTIFACT_PATH)
                print(f"[ModelRegistry] Loaded cost overrun artifact from {COST_ARTIFACT_PATH}")
            except Exception as e:
                print(f"[ModelRegistry Warning] Failed to load cost model artifact: {e}")
                self.cost_pipeline = None

        # Load Random Forest Ensemble Model
        if os.path.exists(RF_ARTIFACT_PATH):
            try:
                self.rf_pipeline = joblib.load(RF_ARTIFACT_PATH)
                print(f"[ModelRegistry] Loaded RF ensemble artifact from {RF_ARTIFACT_PATH}")
            except Exception as e:
                print(f"[ModelRegistry Warning] Failed to load RF ensemble model: {e}")
                self.rf_pipeline = None

        # Load Isolation Forest Anomaly Model
        if os.path.exists(ANOMALY_ARTIFACT_PATH):
            try:
                self.anomaly_pipeline = joblib.load(ANOMALY_ARTIFACT_PATH)
                print(f"[ModelRegistry] Loaded anomaly model artifact from {ANOMALY_ARTIFACT_PATH}")
            except Exception as e:
                print(f"[ModelRegistry Warning] Failed to load anomaly model: {e}")
                self.anomaly_pipeline = None

        self._warmup_models()

    def _warmup_models(self):
        dummy_df = pd.DataFrame([{
            'project_type': 'Commercial',
            'county': 'Nairobi',
            'nca_contractor_grade': 'NCA 1',
            'budget_ksh': 100000000.0,
            'planned_duration_days': 100,
            'completed_milestones_count': 1,
            'total_milestones_count': 5,
            'current_delay_days': 0,
            'delay_ratio': 0.0,
            'progress_ratio': 0.2,
            'is_delayed_signal': 0
        }])
        if self.delay_pipeline is not None:
            try:
                self.delay_pipeline.predict_proba(dummy_df)
            except Exception:
                pass

        if self.cost_pipeline is not None:
            try:
                self.cost_pipeline.predict(dummy_df)
            except Exception:
                pass

        if self.rf_pipeline is not None:
            try:
                self.rf_pipeline.predict_proba(dummy_df[['project_type', 'county', 'nca_contractor_grade', 'budget_ksh', 'planned_duration_days', 'completed_milestones_count', 'total_milestones_count', 'current_delay_days']])
            except Exception:
                pass

        if self.anomaly_pipeline is not None:
            try:
                self.anomaly_pipeline.predict(dummy_df[['project_type', 'county', 'nca_contractor_grade', 'budget_ksh', 'planned_duration_days', 'completed_milestones_count', 'total_milestones_count', 'current_delay_days']])
            except Exception:
                pass

    def predict_delay_risk(self, request_data) -> tuple[float, str, str]:
        """
        Predicts delay risk probability using weighted ensemble of XGBoost and Random Forest.
        """
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

        probs = []
        if self.delay_pipeline is not None:
            probs.append(float(self.delay_pipeline.predict_proba(input_df)[0][1]))
        if self.rf_pipeline is not None:
            probs.append(float(self.rf_pipeline.predict_proba(input_df)[0][1]))

        if len(probs) > 0:
            prob = round(float(np.mean(probs)), 4)
            version = self.ensemble_model_version if len(probs) > 1 else self.delay_model_version
        else:
            delay_ratio = request_data.current_delay_days / max(request_data.planned_duration_days, 1)
            progress_ratio = request_data.completed_milestones_count / max(request_data.total_milestones_count, 1)
            prob = round(min(max(0.10 + (delay_ratio * 1.5) - (progress_ratio * 0.15), 0.05), 0.95), 4)
            version = f"{self.delay_model_version}-stub"

        risk_level = "HIGH" if prob >= 0.65 else ("MEDIUM" if prob >= 0.35 else "LOW")
        return prob, risk_level, version

    def predict_cost_overrun(self, request_data) -> tuple[float, float, str]:
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
            cost_overrun_pct = round(12.5 + (delay_ratio * 25.0), 2) if current_delay > 0 else 1.25
            estimated_overrun_ksh = round(budget * (cost_overrun_pct / 100.0), 2)
            return cost_overrun_pct, estimated_overrun_ksh, f"{self.cost_model_version}-stub"

    def detect_anomalies(self, request_data) -> tuple[bool, float, list[str], str]:
        outliers = []
        if request_data.budget_ksh > 10_000_000_000.0:
            outliers.append("Extreme budget amount (> KSh 10 Billion)")
        if request_data.current_delay_days > request_data.planned_duration_days:
            outliers.append("Schedule delay exceeds total planned project duration")
        if request_data.completed_milestones_count > request_data.total_milestones_count:
            outliers.append("Completed milestones count exceeds total milestones count")

        if self.anomaly_pipeline is not None:
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

            pred = self.anomaly_pipeline.predict(input_df)[0]  # -1 for anomaly, 1 for normal
            score = float(self.anomaly_pipeline.score_samples(input_df)[0])
            score_normalized = round(float(np.clip(1.0 - (score + 0.5), 0.0, 1.0)), 4)
            is_anomaly = bool(pred == -1 or len(outliers) > 0)
            if pred == -1 and not outliers:
                outliers.append("Isolation Forest flagged irregular metric combination")
            return is_anomaly, score_normalized, outliers, self.anomaly_model_version
        else:
            is_anomaly = len(outliers) > 0
            score = 0.85 if is_anomaly else 0.15
            return is_anomaly, score, outliers, f"{self.anomaly_model_version}-stub"

    def forecast_schedule(self, request_data) -> tuple[str, int, str, float, str]:
        from datetime import datetime, timedelta

        try:
            planned_end = datetime.strptime(request_data.planned_end_date[:10], "%Y-%m-%d")
        except Exception:
            planned_end = datetime.utcnow() + timedelta(days=365)

        try:
            planned_start = datetime.strptime(request_data.planned_start_date[:10], "%Y-%m-%d")
        except Exception:
            planned_start = datetime.utcnow()

        total_days = max((planned_end - planned_start).days, 30)
        current_delay = request_data.current_delay_days

        # Velocity rate (milestones per month)
        completed = request_data.completed_milestones_count
        total = max(request_data.total_milestones_count, 1)

        months_elapsed = max(total_days / 30.0, 1.0)
        velocity = round(completed / months_elapsed, 2)

        # Drift calculation
        if completed > 0 and completed < total:
            expected_days_per_milestone = total_days / total
            remaining_milestones = total - completed
            projected_days_remaining = (remaining_milestones * expected_days_per_milestone) + (current_delay * 1.2)
            estimated_drift_days = int(round(current_delay + max(0, projected_days_remaining - (total_days * (remaining_milestones / total)))))
        else:
            estimated_drift_days = int(current_delay)

        projected_completion = planned_end + timedelta(days=estimated_drift_days)
        projected_str = projected_completion.strftime("%Y-%m-%d")

        confidence = "HIGH" if completed >= 2 else ("MEDIUM" if completed == 1 else "LOW")
        return projected_str, estimated_drift_days, confidence, velocity, self.forecast_model_version

registry = ModelRegistry()

