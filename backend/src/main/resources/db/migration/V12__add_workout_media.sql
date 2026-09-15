CREATE TABLE workout_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    storage_key VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    caption VARCHAR(280),
    content_type VARCHAR(100) NOT NULL,
    byte_size BIGINT NOT NULL CHECK (byte_size > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_workout_media_workout UNIQUE (workout_id),
    CONSTRAINT ck_workout_media_status CHECK (status IN ('PENDING', 'READY', 'FAILED'))
);
CREATE INDEX idx_workout_media_user ON workout_media(user_id, created_at DESC);
ALTER TABLE workout_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_media FORCE ROW LEVEL SECURITY;
CREATE POLICY own_workout_media ON workout_media FOR ALL
    USING (user_id = lumina_current_user_id())
    WITH CHECK (user_id = lumina_current_user_id());
CREATE TRIGGER trg_workout_media_upd BEFORE UPDATE ON workout_media
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
