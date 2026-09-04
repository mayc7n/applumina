package com.lumina.domain.social.repository;

import com.lumina.domain.social.entity.Friendship;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.*;

public interface FriendshipRepository extends JpaRepository<Friendship, UUID> {
    @Query("SELECT f FROM Friendship f WHERE (f.requester.id=:uid OR f.addressee.id=:uid) AND f.status='ACCEPTED'")
    List<Friendship> findAcceptedByUserId(@Param("uid") UUID userId);

    @Query("SELECT f FROM Friendship f WHERE f.addressee.id=:uid AND f.status='PENDING' ORDER BY f.createdAt DESC")
    List<Friendship> findPendingForUser(@Param("uid") UUID userId);

    @Query("SELECT f FROM Friendship f WHERE (f.requester.id=:a AND f.addressee.id=:b) OR (f.requester.id=:b AND f.addressee.id=:a)")
    Optional<Friendship> findBetween(@Param("a") UUID first, @Param("b") UUID second);

    Optional<Friendship> findByIdAndAddresseeIdAndStatus(UUID id, UUID addresseeId, String status);
}
