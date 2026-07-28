-- Migration: 005_create_notifications.sql
CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('SMS', 'EMAIL', 'IN_APP')),
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_project ON notifications(project_id);
