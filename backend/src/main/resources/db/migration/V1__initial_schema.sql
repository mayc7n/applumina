CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

CREATE TYPE user_status AS ENUM ('ACTIVE','INACTIVE','SUSPENDED','PENDING_VERIFICATION','DELETED');
CREATE TYPE user_role AS ENUM ('USER','PRO','ADMIN','SUPER_ADMIN');
CREATE TYPE plan_type AS ENUM ('FREE','PRO','TEAM','ENTERPRISE');
CREATE TYPE task_status AS ENUM ('TODO','IN_PROGRESS','DONE','ARCHIVED','DELETED');
CREATE TYPE task_priority AS ENUM ('NONE','LOW','MEDIUM','HIGH','URGENT');
CREATE TYPE recurrence_type AS ENUM ('NONE','DAILY','WEEKLY','MONTHLY','YEARLY','CUSTOM');
CREATE TYPE habit_frequency AS ENUM ('DAILY','WEEKLY','MONTHLY','CUSTOM');
CREATE TYPE habit_type AS ENUM ('BUILD','QUIT');
CREATE TYPE goal_status AS ENUM ('ACTIVE','PAUSED','COMPLETED','ABANDONED');
CREATE TYPE goal_period AS ENUM ('WEEKLY','MONTHLY','QUARTERLY','YEARLY','CUSTOM');
CREATE TYPE mood_type AS ENUM ('TERRIBLE','BAD','NEUTRAL','GOOD','EXCELLENT');
CREATE TYPE energy_level AS ENUM ('VERY_LOW','LOW','MEDIUM','HIGH','VERY_HIGH');
CREATE TYPE focus_mode AS ENUM ('POMODORO','DEEP_WORK','FLOW','QUICK_BURST','CUSTOM');
CREATE TYPE session_status AS ENUM ('ACTIVE','COMPLETED','ABANDONED','PAUSED');
CREATE TYPE reading_status AS ENUM ('WANT_TO_READ','READING','COMPLETED','ABANDONED','REREADING');
CREATE TYPE social_privacy AS ENUM ('PUBLIC','FRIENDS','PRIVATE');
CREATE TYPE notification_type AS ENUM ('TASK_DUE','HABIT_REMINDER','GOAL_CHECKPOINT','FRIEND_REQUEST','FRIEND_ACTIVITY','ACHIEVEMENT','STREAK_ALERT','WEEKLY_REVIEW','SYSTEM','BILLING');
CREATE TYPE auth_provider AS ENUM ('LOCAL','GOOGLE','GITHUB','APPLE');
CREATE TYPE device_type AS ENUM ('WEB','MOBILE_IOS','MOBILE_ANDROID','DESKTOP');
CREATE TYPE billing_status AS ENUM ('ACTIVE','PAST_DUE','CANCELED','TRIALING','INCOMPLETE');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255),
    avatar_url VARCHAR(500),
    bio VARCHAR(500),
    timezone VARCHAR(100) NOT NULL DEFAULT 'America/Sao_Paulo',
    locale VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
    status user_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
    role user_role NOT NULL DEFAULT 'USER',
    plan plan_type NOT NULL DEFAULT 'FREE',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) NOT NULL DEFAULT 'system',
    accent_color VARCHAR(20) NOT NULL DEFAULT 'indigo',
    week_starts_on SMALLINT NOT NULL DEFAULT 1,
    daily_goal_hours DECIMAL(4,1) NOT NULL DEFAULT 4.0,
    notification_settings JSONB NOT NULL DEFAULT '{}',
    focus_settings JSONB NOT NULL DEFAULT '{}',
    privacy_settings JSONB NOT NULL DEFAULT '{}',
    dashboard_layout JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_type device_type NOT NULL DEFAULT 'WEB',
    device_name VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan plan_type NOT NULL DEFAULT 'FREE',
    status billing_status NOT NULL DEFAULT 'ACTIVE',
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE task_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    color VARCHAR(20) NOT NULL DEFAULT '#6366f1',
    icon VARCHAR(50),
    order_index INTEGER NOT NULL DEFAULT 0,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#6366f1',
    icon VARCHAR(50),
    UNIQUE(user_id, name)
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES task_projects(id) ON DELETE SET NULL,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status task_status NOT NULL DEFAULT 'TODO',
    priority task_priority NOT NULL DEFAULT 'NONE',
    due_date DATE,
    due_time TIME,
    scheduled_for DATE,
    estimated_mins INTEGER,
    actual_mins INTEGER,
    recurrence_type recurrence_type NOT NULL DEFAULT 'NONE',
    recurrence_rule JSONB,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_inbox BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE task_labels (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);

CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    icon VARCHAR(50),
    color VARCHAR(20) NOT NULL DEFAULT '#6366f1',
    habit_type habit_type NOT NULL DEFAULT 'BUILD',
    frequency habit_frequency NOT NULL DEFAULT 'DAILY',
    frequency_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],
    target_value DECIMAL(10,2) NOT NULL DEFAULT 1.0,
    target_unit VARCHAR(50),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    reminder_time TIME,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE habit_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL,
    value DECIMAL(10,2) NOT NULL DEFAULT 1.0,
    note VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(habit_id, completed_date)
);

CREATE TABLE habit_streaks (
    habit_id UUID PRIMARY KEY REFERENCES habits(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_completed DATE,
    total_completions INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20) NOT NULL DEFAULT '#6366f1',
    status goal_status NOT NULL DEFAULT 'ACTIVE',
    period goal_period NOT NULL DEFAULT 'YEARLY',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    target_value DECIMAL(10,2),
    current_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(50),
    progress_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE goal_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    target_value DECIMAL(10,2),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE goal_check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value DECIMAL(10,2) NOT NULL,
    note TEXT,
    mood VARCHAR(20),
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(300),
    content TEXT NOT NULL,
    mood mood_type,
    energy energy_level,
    word_count INTEGER NOT NULL DEFAULT 0,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_private BOOLEAN NOT NULL DEFAULT TRUE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    author VARCHAR(300),
    isbn VARCHAR(20),
    cover_url VARCHAR(500),
    total_pages INTEGER,
    current_page INTEGER NOT NULL DEFAULT 0,
    status reading_status NOT NULL DEFAULT 'WANT_TO_READ',
    rating SMALLINT,
    review TEXT,
    genre VARCHAR(100),
    language VARCHAR(50) DEFAULT 'pt',
    started_at DATE,
    finished_at DATE,
    google_books_id VARCHAR(50),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE book_reading_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pages_read INTEGER NOT NULL DEFAULT 0,
    duration_mins INTEGER,
    note TEXT,
    logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE focus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    mode focus_mode NOT NULL DEFAULT 'POMODORO',
    status session_status NOT NULL DEFAULT 'ACTIVE',
    planned_mins INTEGER NOT NULL,
    actual_mins INTEGER NOT NULL DEFAULT 0,
    breaks_taken INTEGER NOT NULL DEFAULT 0,
    distractions INTEGER NOT NULL DEFAULT 0,
    focus_score DECIMAL(4,1),
    notes TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE focus_statistics (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_sessions INTEGER NOT NULL DEFAULT 0,
    total_focus_mins INTEGER NOT NULL DEFAULT 0,
    avg_session_mins DECIMAL(6,1) NOT NULL DEFAULT 0,
    avg_focus_score DECIMAL(4,1) NOT NULL DEFAULT 0,
    longest_streak_days INTEGER NOT NULL DEFAULT 0,
    current_streak_days INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE study_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    color VARCHAR(20) NOT NULL DEFAULT '#6366f1',
    icon VARCHAR(50),
    goal_hours DECIMAL(6,1),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES study_subjects(id) ON DELETE SET NULL,
    title VARCHAR(300),
    notes TEXT,
    duration_mins INTEGER NOT NULL DEFAULT 0,
    quality SMALLINT,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(requester_id, addressee_id),
    CHECK(requester_id != addressee_id)
);

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(300) NOT NULL,
    icon VARCHAR(50),
    category VARCHAR(50),
    points INTEGER NOT NULL DEFAULT 0,
    is_secret BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE user_achievements (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    body VARCHAR(500),
    data JSONB DEFAULT '{}',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE daily_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    tasks_created INTEGER NOT NULL DEFAULT 0,
    habits_completed INTEGER NOT NULL DEFAULT 0,
    habits_total INTEGER NOT NULL DEFAULT 0,
    focus_mins INTEGER NOT NULL DEFAULT 0,
    study_mins INTEGER NOT NULL DEFAULT 0,
    pages_read INTEGER NOT NULL DEFAULT 0,
    mood mood_type,
    energy energy_level,
    productivity_score DECIMAL(4,1) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date)
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(300),
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    plan_gate plan_type,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_sessions_user_active ON user_sessions(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash) WHERE revoked_at IS NULL;
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_user_duedate ON tasks(user_id, due_date) WHERE deleted_at IS NULL AND status != 'DONE';
CREATE INDEX idx_tasks_project ON tasks(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_title_search ON tasks USING GIN(to_tsvector('portuguese', title));
CREATE INDEX idx_habits_user ON habits(user_id) WHERE is_archived = FALSE;
CREATE INDEX idx_habit_completions_habit_date ON habit_completions(habit_id, completed_date);
CREATE INDEX idx_habit_completions_user_date ON habit_completions(user_id, completed_date);
CREATE INDEX idx_goals_user_status ON goals(user_id, status);
CREATE INDEX idx_journal_user_date ON journal_entries(user_id, entry_date DESC);
CREATE INDEX idx_journal_search ON journal_entries USING GIN(to_tsvector('portuguese', coalesce(title,'') || ' ' || content));
CREATE INDEX idx_books_user_status ON books(user_id, status);
CREATE INDEX idx_focus_sessions_user ON focus_sessions(user_id, started_at DESC);
CREATE INDEX idx_focus_sessions_active ON focus_sessions(status) WHERE status = 'ACTIVE';
CREATE INDEX idx_daily_snapshots_user_date ON daily_snapshots(user_id, snapshot_date DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_study_sessions_user_date ON study_sessions(user_id, session_date DESC);

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_upd BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_tasks_upd BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_habits_upd BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_goals_upd BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_journal_upd BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_books_upd BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_subscriptions_upd BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_friendships_upd BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed achievements
INSERT INTO achievements (code, name, description, icon, category, points) VALUES
('FIRST_TASK','Primeiros Passos','Completou sua primeira tarefa','check-circle','tasks',10),
('TASK_STREAK_7','Semana Produtiva','Completou tarefas 7 dias seguidos','flame','tasks',50),
('HABIT_STREAK_7','Semana de Hábitos','Manteve hábito por 7 dias','zap','habits',30),
('HABIT_STREAK_30','Mestre dos Hábitos','Manteve hábito por 30 dias','diamond','habits',100),
('HABIT_STREAK_100','Hábito de Ferro','100 dias de sequência','trophy','habits',300),
('FIRST_JOURNAL','Reflexão Inicial','Escreveu primeira entrada no diário','pen-line','journal',15),
('JOURNAL_STREAK_7','Escritor Dedicado','Diário por 7 dias seguidos','book-open','journal',50),
('FIRST_BOOK','Primeiro Livro','Completou a leitura de um livro','book-marked','books',25),
('BOOKS_10','Bibliófilo','Leu 10 livros','graduation','books',100),
('FOCUS_1H','Entrando no Flow','Completou 1 hora de foco','timer','focus',20),
('FOCUS_10H','Focado','Acumulou 10 horas de foco','zap','focus',60),
('FOCUS_100H','Mestre do Foco','Acumulou 100 horas de foco','brain','focus',200),
('GOAL_COMPLETED','Meta Alcançada','Completou uma meta','target','goals',50),
('STREAK_365','Ano Completo','Usou o Lumina por 365 dias','star','streak',500);

INSERT INTO feature_flags (code, description, enabled, plan_gate) VALUES
('AI_INSIGHTS','AI-powered insights',TRUE,'PRO'),
('SOCIAL_STORIES','Social stories',TRUE,NULL),
('ADVANCED_ANALYTICS','Advanced analytics',TRUE,'PRO'),
('EXPORT_DATA','Export personal data',TRUE,NULL),
('UNLIMITED_HABITS','Unlimited habits',TRUE,NULL);
