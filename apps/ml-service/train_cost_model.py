import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from lightgbm import LGBMRegressor

def train_and_evaluate_cost_model():
    # Path setup
    base_dir = os.path.dirname(__file__)
    csv_path = os.path.join(base_dir, '..', '..', 'db', 'seed', 'synthetic_projects.csv')
    models_dir = os.path.join(base_dir, 'models')
    artifact_path = os.path.join(models_dir, 'cost_lgbm_v1.joblib')

    assert os.path.exists(csv_path), f"Synthetic dataset CSV not found at {csv_path}"
    os.makedirs(models_dir, exist_ok=True)

    print(f"Loading synthetic dataset from {csv_path}...")
    df = pd.read_csv(csv_path)

    # Feature engineering
    df['delay_ratio'] = df['current_delay_days'] / np.maximum(df['planned_duration_days'], 1)
    df['progress_ratio'] = df['completed_milestones_count'] / np.maximum(df['total_milestones_count'], 1)
    df['is_delayed_signal'] = (df['current_delay_days'] > 0).astype(int)

    categorical_features = ['project_type', 'county', 'nca_contractor_grade']
    numeric_features = [
        'budget_ksh', 'planned_duration_days', 'completed_milestones_count',
        'total_milestones_count', 'current_delay_days', 'delay_ratio', 'progress_ratio', 'is_delayed_signal'
    ]
    target = 'cost_overrun_pct'

    X = df[categorical_features + numeric_features]
    y = df[target]

    # Train / Test split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )

    # Preprocessor definition
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features),
            ('num', StandardScaler(), numeric_features)
        ]
    )

    # Define LightGBM Pipeline
    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', LGBMRegressor(
            n_estimators=120,
            max_depth=5,
            learning_rate=0.05,
            num_leaves=31,
            random_state=42,
            verbose=-1
        ))
    ])

    print("Training LightGBM Regressor for Cost Overrun Forecasting...")
    model_pipeline.fit(X_train, y_train)

    # Evaluation
    y_pred = model_pipeline.predict(X_test)
    # Clip predictions to non-negative cost overrun
    y_pred = np.clip(y_pred, 0.0, None)

    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    print("\n==========================================")
    print("    LightGBM Cost Overrun Model Metrics   ")
    print("==========================================")
    print(f"  R^2 Score: {r2:.4f}")
    print(f"  MAE:       {mae:.2f}%")
    print(f"  RMSE:      {rmse:.2f}%")
    print("==========================================\n")

    # Assert model performance baseline requirement (R2 > 0.40, MAE < 9.0%)
    assert r2 > 0.40, f"[Target Violation] R^2 {r2:.4f} is below target threshold 0.40!"
    assert mae < 9.0, f"[Target Violation] MAE {mae:.2f}% exceeds maximum 9.0% error!"

    # Save trained pipeline artifact
    joblib.dump(model_pipeline, artifact_path)
    print(f"[PASS] Successfully saved trained LightGBM cost overrun artifact to: {artifact_path}")

    return {
        'r2_score': r2,
        'mae': mae,
        'rmse': rmse,
        'artifact_path': artifact_path
    }

if __name__ == '__main__':
    train_and_evaluate_cost_model()
