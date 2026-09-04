-- =================================================================
-- Lumina V3 — Studies and Social Tables
-- =================================================================

-- Study subjects trigger
CREATE TRIGGER trigger_study_subjects_updated_at
    BEFORE UPDATE ON study_subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Social posts/stories
CREATE TABLE social_posts (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,
    content     JSONB       NOT NULL DEFAULT '{}',
    privacy     social_privacy NOT NULL DEFAULT 'FRIENDS',
    likes_count INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Post likes
CREATE TABLE post_likes (
    post_id    UUID        NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- Indexes
CREATE INDEX idx_social_posts_user ON social_posts(user_id, created_at DESC);
CREATE INDEX idx_social_posts_feed ON social_posts(created_at DESC)
    WHERE privacy IN ('PUBLIC', 'FRIENDS');

-- Feature flag for studies
INSERT INTO feature_flags (code, description, enabled, plan_gate) VALUES
('STUDY_TIMER', 'Study session timer with subjects', TRUE, NULL)
ON CONFLICT (code) DO NOTHING;

-- Supports lookups for a user's completions on any date.
CREATE INDEX IF NOT EXISTS idx_habit_completions_today
    ON habit_completions(user_id, completed_date);
