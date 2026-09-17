CREATE POLICY visible_post_likes ON post_likes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM social_posts post
            WHERE post.id = post_likes.post_id
        )
    );
