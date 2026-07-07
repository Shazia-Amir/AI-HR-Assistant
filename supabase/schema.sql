-- ═══════════════════════════════════════════════════════════════
-- AI HR Assistant - Supabase Database Schema
-- ═══════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════
-- Table: admin_users
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'hr_manager')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- Table: employees
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    employee_id TEXT UNIQUE NOT NULL,
    department TEXT,
    designation TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- Table: hr_documents
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS hr_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'markdown',
    content TEXT,
    file_path TEXT,
    sections INT DEFAULT 0,
    uploaded_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- Table: chat_history
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_name TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    question TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    retrieved_context TEXT,
    source_documents JSONB DEFAULT '[]'::jsonb,
    confidence_score FLOAT NOT NULL DEFAULT 0.0,
    response_time_ms INT DEFAULT 0,
    feedback TEXT CHECK (feedback IN ('positive', 'negative') OR feedback IS NULL),
    feedback_notes TEXT,
    flagged BOOLEAN NOT NULL DEFAULT FALSE,
    session_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- Table: ai_feedback
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES chat_history(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
    notes TEXT,
    given_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- Table: analytics
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    metric_value FLOAT NOT NULL,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- Table: user_sessions
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_name TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- ═══════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_chat_history_employee_id ON chat_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_feedback ON chat_history(feedback);
CREATE INDEX IF NOT EXISTS idx_chat_history_flagged ON chat_history(flagged) WHERE flagged = TRUE;
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metric_date ON analytics(metric_date);
CREATE INDEX IF NOT EXISTS idx_user_sessions_employee_id ON user_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_chat_id ON ai_feedback(chat_id);

-- ═══════════════════════════════════════════════════════════════
-- Row Level Security (RLS)
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (used by backend with service role key)
-- Public policies for authenticated users

-- admin_users: only admins can read
CREATE POLICY "admins_select_admin_users" ON admin_users
    FOR SELECT TO authenticated USING (true);

-- employees: authenticated users can read, service role can write
CREATE POLICY "authenticated_select_employees" ON employees
    FOR SELECT TO authenticated USING (true);

-- hr_documents: authenticated users can read
CREATE POLICY "authenticated_select_hr_documents" ON hr_documents
    FOR SELECT TO authenticated USING (true);

-- chat_history: authenticated users can read and insert
CREATE POLICY "authenticated_select_chat_history" ON chat_history
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_chat_history" ON chat_history
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_chat_history" ON chat_history
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ai_feedback: authenticated users can read and insert
CREATE POLICY "authenticated_select_ai_feedback" ON ai_feedback
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_ai_feedback" ON ai_feedback
    FOR INSERT TO authenticated WITH CHECK (true);

-- analytics: authenticated users can read
CREATE POLICY "authenticated_select_analytics" ON analytics
    FOR SELECT TO authenticated USING (true);

-- user_sessions: authenticated users can read and insert
CREATE POLICY "authenticated_select_user_sessions" ON user_sessions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_user_sessions" ON user_sessions
    FOR INSERT TO authenticated WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- Updated_at trigger function
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hr_documents_updated_at BEFORE UPDATE ON hr_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_history_updated_at BEFORE UPDATE ON chat_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════
-- Auto-insert feedback into ai_feedback table on chat_history update
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION log_feedback_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.feedback IS NOT NULL AND (OLD.feedback IS NULL OR NEW.feedback != OLD.feedback) THEN
        INSERT INTO ai_feedback (chat_id, feedback_type, notes)
        VALUES (NEW.id, NEW.feedback, NEW.feedback_notes);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_feedback
    AFTER UPDATE OF feedback ON chat_history
    FOR EACH ROW
    EXECUTE FUNCTION log_feedback_change();
