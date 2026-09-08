-- Serialize writes while existing data is checked and the replacement index is installed.
LOCK TABLE friendships IN SHARE ROW EXCLUSIVE MODE;

DO $migration$
DECLARE
    duplicate_pair RECORD;
BEGIN
    SELECT
        LEAST(requester_id, addressee_id) AS first_user_id,
        GREATEST(requester_id, addressee_id) AS second_user_id,
        COUNT(*) AS friendship_count,
        ARRAY_AGG(id ORDER BY created_at, id) AS friendship_ids
    INTO duplicate_pair
    FROM friendships
    GROUP BY
        LEAST(requester_id, addressee_id),
        GREATEST(requester_id, addressee_id)
    HAVING COUNT(*) > 1
    ORDER BY first_user_id, second_user_id
    LIMIT 1;

    IF FOUND THEN
        RAISE EXCEPTION USING
            ERRCODE = '23505',
            MESSAGE = FORMAT(
                'Cannot enforce unique friendship pairs: duplicate pair for users %s and %s has %s rows (%s)',
                duplicate_pair.first_user_id,
                duplicate_pair.second_user_id,
                duplicate_pair.friendship_count,
                duplicate_pair.friendship_ids
            ),
            HINT = 'Review every duplicate pair and choose records manually. This migration deleted no rows.';
    END IF;
END
$migration$;

CREATE UNIQUE INDEX ux_friendships_user_pair
    ON friendships (
        LEAST(requester_id, addressee_id),
        GREATEST(requester_id, addressee_id)
    );

ALTER TABLE friendships
    DROP CONSTRAINT friendships_requester_id_addressee_id_key;

-- Manual rollback, preserving every row:
-- ALTER TABLE friendships ADD CONSTRAINT friendships_requester_id_addressee_id_key
--     UNIQUE (requester_id, addressee_id);
-- DROP INDEX ux_friendships_user_pair;
