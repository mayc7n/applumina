CREATE TYPE workout_type AS ENUM (
    'WALKING',
    'RUNNING',
    'STRENGTH',
    'CYCLING',
    'SWIMMING',
    'MARTIAL_ARTS',
    'TEAM_SPORT',
    'YOGA',
    'MOBILITY',
    'PILATES',
    'CUSTOM'
);

CREATE TYPE workout_privacy AS ENUM ('PRIVATE', 'FRIENDS');

CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type workout_type NOT NULL,
    custom_activity VARCHAR(100),
    activity_date DATE NOT NULL,
    duration_mins INTEGER NOT NULL CHECK (duration_mins BETWEEN 1 AND 1440),
    notes TEXT,
    privacy workout_privacy NOT NULL DEFAULT 'PRIVATE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (type = 'CUSTOM' AND LENGTH(TRIM(custom_activity)) BETWEEN 2 AND 100)
        OR (type <> 'CUSTOM' AND custom_activity IS NULL)
    )
);

CREATE INDEX idx_workouts_user_activity_date
    ON workouts(user_id, activity_date DESC, created_at DESC);

CREATE TRIGGER trg_workouts_upd
    BEFORE UPDATE ON workouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts FORCE ROW LEVEL SECURITY;

CREATE POLICY own_workouts ON workouts
    FOR ALL
    USING (user_id = lumina_current_user_id())
    WITH CHECK (user_id = lumina_current_user_id());
