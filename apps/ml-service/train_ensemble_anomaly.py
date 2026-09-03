import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

def train_ensemble_and_anomaly_models():
    base_dir = os.path.dirname(__file__)
    csv_path = os.path.join(base_dir, '..', '..', 'db', 'seed', 'synthetic_projects.csv')
    models_dir = os.path.join(base_dir, 'models')
    rf_artifact_path = os.path.join(models_dir, 'ensemble_rf_v1.joblib')
    anomaly_artifact_path = os.path.join(models_dir, 'anomaly_iforest_v1.joblib')

    assert os.path.exists(csv_path), f"Synthetic dataset CSV not found at {csv_path}"
    os.makedirs(models_dir, exist_ok=True)

    print(f"Loading synthetic dataset from {csv_path}...")
    df = pd.read_csv(csv_path)

    categorical_features = ['project_type', 'county', 'nca_contractor_grade']
    numeric_features = [
        'budget_ksh', 'planned_duration_days', 'completed_milestones_count',
        'total_milestones_count', 'current_delay_days'
    ]
    target = 'delayed'

    X = df[categorical_features + numeric_features]
    y = df[target]

    # Train/test split for Random Forest Classifier
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features),
            ('num', StandardScaler(), numeric_features)
        ]
    )

    # 1. Random Forest Model Pipeline
    rf_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            random_state=42
        ))
    ])

    print("Training Random Forest Classifier (Ensemble component)...")
    rf_pipeline.fit(X_train, y_train)

    y_pred = rf_pipeline.predict(X_test)
    y_prob = rf_pipeline.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_prob)
    print(f"[Random Forest] Accuracy: {acc*100:.2f}%, ROC-AUC: {roc_auc:.4f}")

    joblib.dump(rf_pipeline, rf_artifact_path)
    print(f"[PASS] Saved Random Forest model artifact to: {rf_artifact_path}")

    # 2. Isolation Forest Anomaly Detection Pipeline
    anomaly_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('anomaly_detector', IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42
        ))
    ])

    print("Training Isolation Forest Anomaly Detector...")
    anomaly_pipeline.fit(X)

    joblib.dump(anomaly_pipeline, anomaly_artifact_path)
    print(f"[PASS] Saved Isolation Forest model artifact to: {anomaly_artifact_path}")

    return {
        'rf_accuracy': acc,
        'rf_roc_auc': roc_auc,
        'rf_artifact': rf_artifact_path,
        'anomaly_artifact': anomaly_artifact_path
    }

if __name__ == '__main__':
    train_ensemble_and_anomaly_models()
