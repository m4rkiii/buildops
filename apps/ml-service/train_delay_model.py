import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from xgboost import XGBClassifier

def train_and_evaluate_delay_model():
    # Path setup
    base_dir = os.path.dirname(__file__)
    csv_path = os.path.join(base_dir, '..', '..', 'db', 'seed', 'synthetic_projects.csv')
    models_dir = os.path.join(base_dir, 'models')
    artifact_path = os.path.join(models_dir, 'delay_xgb_v1.joblib')

    assert os.path.exists(csv_path), f"Synthetic dataset CSV not found at {csv_path}"
    os.makedirs(models_dir, exist_ok=True)

    print(f"Loading synthetic dataset from {csv_path}...")
    df = pd.read_csv(csv_path)

    # Define feature lists
    categorical_features = ['project_type', 'county', 'nca_contractor_grade']
    numeric_features = [
        'budget_ksh', 'planned_duration_days', 'completed_milestones_count',
        'total_milestones_count', 'current_delay_days'
    ]
    target = 'delayed'

    X = df[categorical_features + numeric_features]
    y = df[target]

    # Train / Test split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # Preprocessor definition
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features),
            ('num', StandardScaler(), numeric_features)
        ]
    )

    # Define XGBoost pipeline
    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.08,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            eval_metric='logloss'
        ))
    ])

    print("Training XGBoost Classifier...")
    model_pipeline.fit(X_train, y_train)

    # Evaluation
    y_pred = model_pipeline.predict(X_test)
    y_prob = model_pipeline.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_prob)

    print("\n==========================================")
    print("      XGBoost Model Evaluation Metrics    ")
    print("==========================================")
    print(f"  Accuracy:  {acc * 100:.2f}%")
    print(f"  Precision: {prec * 100:.2f}%")
    print(f"  Recall:    {rec * 100:.2f}%")
    print(f"  F1 Score:  {f1:.4f}")
    print(f"  ROC-AUC:   {roc_auc:.4f}")
    print("==========================================\n")

    # Assert ROC-AUC baseline requirement (> 0.75)
    assert roc_auc > 0.75, f"[Target Violation] ROC-AUC {roc_auc:.4f} is below target 0.75!"

    # Save trained pipeline artifact
    joblib.dump(model_pipeline, artifact_path)
    print(f"[PASS] Successfully saved trained model pipeline artifact to: {artifact_path}")

    return {
        'accuracy': acc,
        'precision': prec,
        'recall': rec,
        'f1_score': f1,
        'roc_auc': roc_auc,
        'artifact_path': artifact_path
    }

if __name__ == '__main__':
    train_and_evaluate_delay_model()
