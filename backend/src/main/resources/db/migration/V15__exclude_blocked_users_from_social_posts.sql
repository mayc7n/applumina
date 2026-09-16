DROP POLICY social_post_visible_read ON social_posts;

CREATE POLICY social_post_visible_read ON social_posts
    FOR SELECT
    USING (
        user_id = lumina_current_user_id()
        OR (
            (
                privacy = 'PUBLIC'
                OR (privacy = 'FRIENDS' AND EXISTS (
                    SELECT 1 FROM friendships friendship
                    WHERE friendship.status = 'ACCEPTED'
                      AND ((friendship.requester_id = lumina_current_user_id() AND friendship.addressee_id = social_posts.user_id)
                        OR (friendship.addressee_id = lumina_current_user_id() AND friendship.requester_id = social_posts.user_id))
                ))
            )
            AND NOT EXISTS (
                SELECT 1 FROM user_blocks block
                WHERE (block.blocker_id = lumina_current_user_id() AND block.blocked_id = social_posts.user_id)
                   OR (block.blocker_id = social_posts.user_id AND block.blocked_id = lumina_current_user_id())
            )
        )
    );
