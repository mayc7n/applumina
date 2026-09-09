package com.lumina.domain.social.repository;

import com.lumina.domain.social.entity.Friendship;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.*;

public interface FriendshipRepository extends JpaRepository<Friendship, UUID> {
    @Query(value = """
        SELECT count(*) FROM pg_advisory_xact_lock(hashtextextended(
            LEAST(CAST(:first AS text), CAST(:second AS text)) || ':' ||
            GREATEST(CAST(:first AS text), CAST(:second AS text)), 0))
        """, nativeQuery = true)
    long lockPair(@Param("first") UUID first, @Param("second") UUID second);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM Friendship f WHERE (f.requester.id=:a AND f.addressee.id=:b) OR (f.requester.id=:b AND f.addressee.id=:a)")
    int deleteBetween(@Param("a") UUID first, @Param("b") UUID second);

    @Query("SELECT f FROM Friendship f WHERE (f.requester.id=:uid OR f.addressee.id=:uid) AND f.status='ACCEPTED'")
    List<Friendship> findAcceptedByUserId(@Param("uid") UUID userId, Pageable pageable);

    @Query("SELECT f FROM Friendship f WHERE f.addressee.id=:uid AND f.status='PENDING'")
    List<Friendship> findPendingForUser(@Param("uid") UUID userId, Pageable pageable);

    @Query("SELECT f FROM Friendship f WHERE (f.requester.id=:a AND f.addressee.id=:b) OR (f.requester.id=:b AND f.addressee.id=:a)")
    Optional<Friendship> findBetween(@Param("a") UUID first, @Param("b") UUID second);

    Optional<Friendship> findByIdAndAddresseeIdAndStatus(UUID id, UUID addresseeId, String status);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM Friendship f WHERE f.requester.id=:requesterId AND f.addressee.id=:targetId AND f.status='PENDING'")
    int deletePendingSentTo(@Param("requesterId") UUID requesterId, @Param("targetId") UUID targetId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM Friendship f WHERE f.id=:requestId AND f.addressee.id=:userId AND f.status='PENDING'")
    int deletePendingReceived(@Param("requestId") UUID requestId, @Param("userId") UUID userId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM Friendship f WHERE f.status='ACCEPTED' AND ((f.requester.id=:userId AND f.addressee.id=:friendId) OR (f.requester.id=:friendId AND f.addressee.id=:userId))")
    int deleteAcceptedBetween(@Param("userId") UUID userId, @Param("friendId") UUID friendId);
}
