CREATE POLICY visible_workout_media ON workout_media
    FOR SELECT
    USING (
        user_id = lumina_current_user_id()
        OR EXISTS (
            SELECT 1
            FROM social_posts post
            WHERE post.content->>'mediaId' = workout_media.id::text
              AND (
                  post.user_id = lumina_current_user_id()
                  OR (
                      (
                          post.privacy = 'PUBLIC'
                          OR (post.privacy = 'FRIENDS' AND EXISTS (
                              SELECT 1 FROM friendships friendship
                              WHERE friendship.status = 'ACCEPTED'
                                AND ((friendship.requester_id = lumina_current_user_id() AND friendship.addressee_id = post.user_id)
                                  OR (friendship.addressee_id = lumina_current_user_id() AND friendship.requester_id = post.user_id))
                          ))
                      )
                      AND NOT EXISTS (
                          SELECT 1 FROM user_blocks block
                          WHERE (block.blocker_id = lumina_current_user_id() AND block.blocked_id = post.user_id)
                             OR (block.blocker_id = post.user_id AND block.blocked_id = lumina_current_user_id())
                      )
                  )
              )
        )
    );
