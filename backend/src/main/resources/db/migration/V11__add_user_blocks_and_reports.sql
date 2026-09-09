CREATE TABLE user_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (blocker_id, blocked_id),
    CHECK (blocker_id <> blocked_id)
);

CREATE TABLE user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(40) NOT NULL,
    details VARCHAR(1000),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (reporter_id <> reported_user_id)
);

ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks FORCE ROW LEVEL SECURITY;

CREATE POLICY user_block_participants_read ON user_blocks
    FOR SELECT
    USING (
        blocker_id = lumina_current_user_id()
        OR blocked_id = lumina_current_user_id()
    );

CREATE POLICY user_block_owner_insert ON user_blocks
    FOR INSERT
    WITH CHECK (blocker_id = lumina_current_user_id());

CREATE POLICY user_block_owner_delete ON user_blocks
    FOR DELETE
    USING (blocker_id = lumina_current_user_id());

ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports FORCE ROW LEVEL SECURITY;

CREATE POLICY user_reporter_read ON user_reports
    FOR SELECT
    USING (reporter_id = lumina_current_user_id());

CREATE POLICY user_reporter_insert ON user_reports
    FOR INSERT
    WITH CHECK (reporter_id = lumina_current_user_id());
