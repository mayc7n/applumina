-- The application sets lumina.user_id locally inside each authenticated transaction.
-- FORCE makes policies apply to the table owner used by the current single-role deployment.
CREATE OR REPLACE FUNCTION lumina_current_user_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
    SELECT NULLIF(current_setting('lumina.user_id', true), '')::UUID
$$;

DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'user_preferences', 'subscriptions', 'task_projects', 'labels',
        'habits', 'habit_completions', 'goals', 'goal_check_ins',
        'journal_entries', 'books', 'book_reading_logs', 'focus_sessions',
        'focus_statistics', 'study_subjects', 'study_sessions', 'user_achievements',
        'notifications', 'daily_snapshots', 'audit_logs'
    ] LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
        EXECUTE format(
            'CREATE POLICY own_rows ON %I FOR ALL USING (user_id = lumina_current_user_id()) WITH CHECK (user_id = lumina_current_user_id())',
            table_name
        );
    END LOOP;
END $$;

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;
CREATE POLICY task_owner_write ON tasks
    FOR ALL
    USING (user_id = lumina_current_user_id())
    WITH CHECK (user_id = lumina_current_user_id());
CREATE POLICY task_friend_feed_read ON tasks
    FOR SELECT
    USING (
        user_id = lumina_current_user_id()
        OR EXISTS (
            SELECT 1 FROM friendships friendship
            WHERE friendship.status = 'ACCEPTED'
              AND ((friendship.requester_id = lumina_current_user_id() AND friendship.addressee_id = tasks.user_id)
                OR (friendship.addressee_id = lumina_current_user_id() AND friendship.requester_id = tasks.user_id))
        )
    );

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships FORCE ROW LEVEL SECURITY;
CREATE POLICY friendship_participants ON friendships
    FOR ALL
    USING (requester_id = lumina_current_user_id() OR addressee_id = lumina_current_user_id())
    WITH CHECK (requester_id = lumina_current_user_id() OR addressee_id = lumina_current_user_id());

ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels FORCE ROW LEVEL SECURITY;
CREATE POLICY task_label_owner ON task_labels
    FOR ALL
    USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_labels.task_id AND tasks.user_id = lumina_current_user_id()))
    WITH CHECK (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_labels.task_id AND tasks.user_id = lumina_current_user_id()));

ALTER TABLE habit_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_streaks FORCE ROW LEVEL SECURITY;
CREATE POLICY habit_streak_owner ON habit_streaks
    FOR ALL
    USING (EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_streaks.habit_id AND habits.user_id = lumina_current_user_id()))
    WITH CHECK (EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_streaks.habit_id AND habits.user_id = lumina_current_user_id()));

ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones FORCE ROW LEVEL SECURITY;
CREATE POLICY goal_milestone_owner ON goal_milestones
    FOR ALL
    USING (EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_milestones.goal_id AND goals.user_id = lumina_current_user_id()))
    WITH CHECK (EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_milestones.goal_id AND goals.user_id = lumina_current_user_id()));

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts FORCE ROW LEVEL SECURITY;
CREATE POLICY social_post_owner_write ON social_posts
    FOR ALL
    USING (user_id = lumina_current_user_id())
    WITH CHECK (user_id = lumina_current_user_id());
CREATE POLICY social_post_visible_read ON social_posts
    FOR SELECT
    USING (
        privacy = 'PUBLIC'
        OR user_id = lumina_current_user_id()
        OR (privacy = 'FRIENDS' AND EXISTS (
            SELECT 1 FROM friendships friendship
            WHERE friendship.status = 'ACCEPTED'
              AND ((friendship.requester_id = lumina_current_user_id() AND friendship.addressee_id = social_posts.user_id)
                OR (friendship.addressee_id = lumina_current_user_id() AND friendship.requester_id = social_posts.user_id))
        ))
    );

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes FORCE ROW LEVEL SECURITY;
CREATE POLICY post_like_owner ON post_likes
    FOR ALL
    USING (user_id = lumina_current_user_id())
    WITH CHECK (user_id = lumina_current_user_id());

UPDATE achievements SET icon = CASE code
    WHEN 'FIRST_TASK' THEN 'check-circle'
    WHEN 'TASK_STREAK_7' THEN 'flame'
    WHEN 'HABIT_STREAK_7' THEN 'zap'
    WHEN 'HABIT_STREAK_30' THEN 'diamond'
    WHEN 'HABIT_STREAK_100' THEN 'trophy'
    WHEN 'FIRST_JOURNAL' THEN 'pen-line'
    WHEN 'JOURNAL_STREAK_7' THEN 'book-open'
    WHEN 'FIRST_BOOK' THEN 'book-marked'
    WHEN 'BOOKS_10' THEN 'graduation'
    WHEN 'FOCUS_1H' THEN 'timer'
    WHEN 'FOCUS_10H' THEN 'zap'
    WHEN 'FOCUS_100H' THEN 'brain'
    WHEN 'GOAL_COMPLETED' THEN 'target'
    WHEN 'STREAK_365' THEN 'star'
    ELSE icon
END;
