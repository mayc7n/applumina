package com.lumina.domain.user.repository;

import com.lumina.domain.user.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {
    List<UserSession> findByUserIdAndActiveTrueAndExpiresAtAfterOrderByLastUsedAtDesc(UUID userId, Instant now);
    Optional<UserSession> findByIdAndUserIdAndActiveTrue(UUID id, UUID userId);
    boolean existsByIdAndUserIdAndActiveTrueAndExpiresAtAfter(UUID id, UUID userId, Instant now);

    @Modifying
    @Query("update UserSession session set session.active=false where session.user.id=:userId and session.active=true")
    int revokeAllByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("""
        update UserSession session set session.active=false
        where session.user.id=:userId and session.active=true and session.id<>:currentSessionId
        """)
    int revokeOthers(@Param("userId") UUID userId, @Param("currentSessionId") UUID currentSessionId);
}
