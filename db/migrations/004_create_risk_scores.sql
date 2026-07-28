-- Migration: 004_create_risk_scores.sql
CREATE TABLE IF NOT EXISTS risk_scores (
    score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    score_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delay_risk_prob DOUBLE PRECISION NOT NULL,
    cost_overrun_pct DOUBLE PRECISION NOT NULL,
    model_version VARCHAR(50) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_risk_scores_project ON risk_scores(project_id);
