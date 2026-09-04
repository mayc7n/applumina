package com.lumina.infrastructure.security;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {
    private final JwtService jwtService = new JwtService(
        "segredo-local-comprido-o-suficiente-para-hmac-sha-256-lumina",
        900_000,
        2_592_000_000L
    );

    @Test
    void keepsSessionIdentityInAccessAndRefreshTokens() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();

        String accessToken = jwtService.generateAccessToken(
            userId,
            "pessoa@example.com",
            "USER",
            "FREE",
            sessionId
        );
        String refreshToken = jwtService.generateRefreshToken(userId, sessionId);

        assertThat(jwtService.extractSessionId(accessToken)).isEqualTo(sessionId);
        assertThat(jwtService.extractSessionId(refreshToken)).isEqualTo(sessionId);
        assertThat(jwtService.isAccessToken(accessToken)).isTrue();
        assertThat(jwtService.isRefreshToken(refreshToken)).isTrue();
    }
}
