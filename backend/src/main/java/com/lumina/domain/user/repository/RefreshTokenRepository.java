package com.lumina.domain.user.repository;

import com.lumina.domain.user.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("""
        update RefreshToken token
        set token.revokedAt = :revokedAt
        where token.user.id = :userId
          and token.revokedAt is null
          and token.usedAt is null
        """)
    int revokeAllActiveByUserId(@Param("userId") UUID userId, @Param("revokedAt") Instant revokedAt);

    @Modifying
    @Query("""
        update RefreshToken token set token.revokedAt=:revokedAt
        where token.session.id=:sessionId and token.revokedAt is null and token.usedAt is null
        """)
    int revokeAllActiveBySessionId(@Param("sessionId") UUID sessionId, @Param("revokedAt") Instant revokedAt);

    @Modifying
    @Query("""
        update RefreshToken token set token.revokedAt=:revokedAt
        where token.user.id=:userId and token.revokedAt is null and token.usedAt is null
          and (token.session is null or token.session.id<>:currentSessionId)
        """)
    int revokeAllActiveExceptSession(
        @Param("userId") UUID userId,
        @Param("currentSessionId") UUID currentSessionId,
        @Param("revokedAt") Instant revokedAt
    );
}
