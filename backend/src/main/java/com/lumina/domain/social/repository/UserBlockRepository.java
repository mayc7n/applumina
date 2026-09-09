package com.lumina.domain.social.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.lumina.domain.social.entity.UserBlock;

@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, UUID> {
    @Modifying(flushAutomatically = true)
    @Query(value = """
        INSERT INTO user_blocks (blocker_id, blocked_id)
        VALUES (:blockerId, :blockedId)
        ON CONFLICT (blocker_id, blocked_id) DO NOTHING
        """, nativeQuery = true)
    int createIfAbsent(@Param("blockerId") UUID blockerId, @Param("blockedId") UUID blockedId);

    @Query("""
        SELECT COUNT(userBlock) > 0
        FROM UserBlock userBlock
        WHERE (userBlock.blockerId = :firstUserId AND userBlock.blockedId = :secondUserId)
           OR (userBlock.blockerId = :secondUserId AND userBlock.blockedId = :firstUserId)
        """)
    boolean existsBetween(
        @Param("firstUserId") UUID firstUserId,
        @Param("secondUserId") UUID secondUserId
    );

    @Query("""
        SELECT userBlock
        FROM UserBlock userBlock
        WHERE userBlock.blockerId = :blockerId
        ORDER BY userBlock.createdAt DESC, userBlock.id ASC
        """)
    List<UserBlock> findByBlockerId(@Param("blockerId") UUID blockerId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
        DELETE FROM UserBlock userBlock
        WHERE userBlock.blockerId = :blockerId
          AND userBlock.blockedId = :blockedId
        """)
    int deleteOwned(@Param("blockerId") UUID blockerId, @Param("blockedId") UUID blockedId);
}
