package com.lumina.infrastructure.security;

import com.lumina.domain.user.entity.User;
import com.lumina.domain.user.entity.UserRole;
import com.lumina.domain.user.repository.UserRepository;
import com.lumina.domain.user.repository.UserSessionRepository;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {
    @Mock private JwtService jwtService;
    @Mock private UserRepository userRepository;
    @Mock private UserSessionRepository userSessionRepository;
    @Mock private FilterChain filterChain;

    private JwtAuthenticationFilter filter;
    private UUID userId;
    private UUID sessionId;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtService, userRepository, userSessionRepository);
        userId = UUID.randomUUID();
        sessionId = UUID.randomUUID();
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticatesProtectedSessionEndpointWhenSessionIsActive() throws Exception {
        prepareValidToken(true);
        MockHttpServletRequest request = authorizedRequest("/auth/sessions");

        filter.doFilter(request, new MockHttpServletResponse(), filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal())
            .extracting("sessionId")
            .isEqualTo(sessionId);
    }

    @Test
    void rejectsAccessTokenAfterItsSessionWasRevoked() throws Exception {
        prepareValidToken(false);

        filter.doFilter(
            authorizedRequest("/tasks"),
            new MockHttpServletResponse(),
            filterChain
        );

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    private void prepareValidToken(boolean activeSession) {
        when(jwtService.isValid("access-value")).thenReturn(true);
        when(jwtService.isAccessToken("access-value")).thenReturn(true);
        when(jwtService.extractUserId("access-value")).thenReturn(userId.toString());
        when(jwtService.extractSessionId("access-value")).thenReturn(sessionId);
        when(userRepository.findActiveById(userId)).thenReturn(Optional.of(User.builder()
            .id(userId)
            .email("pessoa@example.com")
            .role(UserRole.USER)
            .build()));
        when(userSessionRepository.existsByIdAndUserIdAndActiveTrueAndExpiresAtAfter(
            eq(sessionId),
            eq(userId),
            any(Instant.class)
        )).thenReturn(activeSession);
    }

    private MockHttpServletRequest authorizedRequest(String path) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
        request.setServletPath(path);
        request.addHeader("Authorization", "Bearer access-value");
        return request;
    }
}
