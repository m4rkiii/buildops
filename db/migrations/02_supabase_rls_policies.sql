-- BuildOps Sentinel: Supabase Database Schema & Row Level Security (RLS) Migration
-- File: db/migrations/02_supabase_rls_policies.sql

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Enable Row Level Security (RLS) on all core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. USERS TABLE POLICIES
-- Users can view their own profile
CREATE POLICY users_select_own ON users
    FOR SELECT
    USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Users can update their own profile
CREATE POLICY users_update_own ON users
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY users_admin_all ON users
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- 3. PROJECTS TABLE POLICIES
-- Contractors / Owners can perform full CRUD on their own projects
CREATE POLICY projects_owner_all ON projects
    FOR ALL
    USING (auth.uid() = owner_user_id)
    WITH CHECK (auth.uid() = owner_user_id);

-- NCA Regulators can SELECT (read-only) all projects for compliance audit
CREATE POLICY projects_nca_select ON projects
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'nca_regulator' OR auth.jwt() ->> 'role' = 'admin');

-- 4. MILESTONES TABLE POLICIES
-- Project owners can manage milestones for their projects
CREATE POLICY milestones_owner_all ON milestones
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.project_id = milestones.project_id
            AND projects.owner_user_id = auth.uid()
        )
    );

-- Read access for regulators and admins
CREATE POLICY milestones_read_regulators ON milestones
    FOR SELECT
    USING (auth.jwt() ->> 'role' IN ('nca_regulator', 'admin'));

-- 5. RISK SCORES TABLE POLICIES
-- Project owners can view risk scores for their projects
CREATE POLICY risk_scores_owner_select ON risk_scores
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.project_id = risk_scores.project_id
            AND projects.owner_user_id = auth.uid()
        )
    );

-- System service role can insert calculated risk scores
CREATE POLICY risk_scores_service_insert ON risk_scores
    FOR INSERT
    WITH CHECK (true);

-- 6. NOTIFICATIONS TABLE POLICIES
-- Project owners can view notifications assigned to their projects
CREATE POLICY notifications_owner_select ON notifications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.project_id = notifications.project_id
            AND projects.owner_user_id = auth.uid()
        )
    );

-- Service role can create alert notifications
CREATE POLICY notifications_service_insert ON notifications
    FOR INSERT
    WITH CHECK (true);
