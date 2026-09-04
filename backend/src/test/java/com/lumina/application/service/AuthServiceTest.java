package com.lumina.application.service;

import com.lumina.api.dto.RegisterRequest;
import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.user.entity.DeviceType;
import com.lumina.domain.user.entity.RefreshToken;
import com.lumina.domain.user.entity.User;
import com.lumina.domain.user.entity.UserRole;
import com.lumina.domain.user.entity.UserSession;
import com.lumina.domain.user.entity.UserStatus;
import com.lumina.api.middleware.GlobalExceptionHandler.ConflictException;
import com.lumina.domain.user.repository.RefreshTokenRepository;
import com.lumina.domain.user.repository.UserRepository;
import com.lumina.domain.user.repository.UserSessionRepository;
import com.lumina.infrastructure.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private UserSessionRepository userSessionRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtService jwtService;

    private AuthService authService;
    private RegisterRequest request;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
            userRepository,
            refreshTokenRepository,
            userSessionRepository,
            passwordEncoder,
            authenticationManager,
            jwtService
        );
        request = new RegisterRequest(
            "pessoa@example.com",
            "pessoa",
            "Pessoa",
            "senha-segura"
        );
    }

    @Test
    void registrationConflictDoesNotRevealWhetherEmailExists() {
        when(userRepository.existsByEmail("pessoa@example.com")).thenReturn(true);

        assertGenericRegistrationConflict();
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    void registrationConflictDoesNotRevealWhetherUsernameExists() {
        when(userRepository.existsByEmail("pessoa@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("pessoa")).thenReturn(true);

        assertGenericRegistrationConflict();
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    void refreshRotatesTokenInsideTheSameSession() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        User user = activeUser(userId);
        UserSession session = activeSession(sessionId, user);
        RefreshToken storedToken = RefreshToken.builder()
            .user(user)
            .session(session)
            .tokenHash("stored-hash")
            .expiresAt(Instant.now().plusSeconds(600))
            .build();
        when(jwtService.isValid("old-refresh")).thenReturn(true);
        when(jwtService.isRefreshToken("old-refresh")).thenReturn(true);
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(storedToken));
        when(jwtService.extractUserId("old-refresh")).thenReturn(userId.toString());
        when(jwtService.extractSessionId("old-refresh")).thenReturn(sessionId);
        when(jwtService.generateRefreshToken(userId, sessionId)).thenReturn("new-refresh");
        when(jwtService.extractExpiration("new-refresh")).thenReturn(Instant.now().plusSeconds(600));
        when(jwtService.generateAccessToken(
            userId,
            user.getEmail(),
            user.getRole().name(),
            user.getPlan().name(),
            sessionId
        )).thenReturn("new-access");
        when(jwtService.getAccessExpirationSeconds()).thenReturn(900L);
        when(userSessionRepository.save(any(UserSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = authService.refresh("old-refresh", AuthSessionContext.mobile(
            "MOBILE_ANDROID",
            "Pixel de teste",
            "Lumina/teste"
        ));

        assertThat(response.accessToken()).isEqualTo("new-access");
        assertThat(response.refreshToken()).isEqualTo("new-refresh");
        assertThat(storedToken.getUsedAt()).isNotNull();
        verify(refreshTokenRepository).save(org.mockito.ArgumentMatchers.argThat(
            token -> token.getSession() == session && token.getTokenHash() != null
        ));
    }

    @Test
    void refreshReuseRevokesEverySessionForTheUser() {
        UUID userId = UUID.randomUUID();
        User user = activeUser(userId);
        RefreshToken reusedToken = RefreshToken.builder()
            .user(user)
            .tokenHash("stored-hash")
            .expiresAt(Instant.now().plusSeconds(600))
            .usedAt(Instant.now())
            .build();
        when(jwtService.isValid("reused-refresh")).thenReturn(true);
        when(jwtService.isRefreshToken("reused-refresh")).thenReturn(true);
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(reusedToken));

        assertThatThrownBy(() -> authService.refresh("reused-refresh"))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Sessão expirada. Entre novamente.");
        verify(refreshTokenRepository).revokeAllActiveByUserId(any(UUID.class), any(Instant.class));
        verify(userSessionRepository).revokeAllByUserId(userId);
    }

    @Test
    void rejectedRefreshFromAClosedDeviceDoesNotCloseTheCurrentSession() {
        UUID userId = UUID.randomUUID();
        User user = activeUser(userId);
        RefreshToken revokedToken = RefreshToken.builder()
            .user(user)
            .tokenHash("stored-hash")
            .expiresAt(Instant.now().plusSeconds(600))
            .revokedAt(Instant.now())
            .build();
        when(jwtService.isValid("revoked-refresh")).thenReturn(true);
        when(jwtService.isRefreshToken("revoked-refresh")).thenReturn(true);
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(revokedToken));

        assertThatThrownBy(() -> authService.refresh("revoked-refresh"))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Sessão expirada. Entre novamente.");

        verify(refreshTokenRepository, never()).revokeAllActiveByUserId(any(), any());
        verify(userSessionRepository, never()).revokeAllByUserId(any());
    }

    @Test
    void doesNotRenewADeletedAccount() {
        UUID userId = UUID.randomUUID();
        User deletedUser = activeUser(userId);
        deletedUser.setStatus(UserStatus.DELETED);
        RefreshToken storedToken = RefreshToken.builder()
            .user(deletedUser)
            .tokenHash("stored-hash")
            .expiresAt(Instant.now().plusSeconds(600))
            .build();
        when(jwtService.isValid("deleted-refresh")).thenReturn(true);
        when(jwtService.isRefreshToken("deleted-refresh")).thenReturn(true);
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(storedToken));
        when(jwtService.extractUserId("deleted-refresh")).thenReturn(userId.toString());

        assertThatThrownBy(() -> authService.refresh("deleted-refresh"))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Sessão expirada. Entre novamente.");

        verify(refreshTokenRepository).revokeAllActiveByUserId(eq(userId), any(Instant.class));
        verify(userSessionRepository).revokeAllByUserId(userId);
    }

    @Test
    void closesOtherSessionsWithoutRevokingTheCurrentOne() {
        UUID userId = UUID.randomUUID();
        UUID currentSessionId = UUID.randomUUID();
        when(userSessionRepository.findByIdAndUserIdAndActiveTrue(currentSessionId, userId))
            .thenReturn(Optional.of(activeSession(currentSessionId, activeUser(userId))));

        authService.revokeOtherSessions(userId, currentSessionId);

        verify(refreshTokenRepository).revokeAllActiveExceptSession(
            org.mockito.ArgumentMatchers.eq(userId),
            org.mockito.ArgumentMatchers.eq(currentSessionId),
            any(Instant.class)
        );
        verify(userSessionRepository).revokeOthers(userId, currentSessionId);
    }

    @Test
    void requiresAValidCurrentSessionBeforeClosingOneDevice() {
        UUID userId = UUID.randomUUID();
        UUID currentSessionId = UUID.randomUUID();
        UUID targetSessionId = UUID.randomUUID();
        when(userSessionRepository.findByIdAndUserIdAndActiveTrue(currentSessionId, userId))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.revokeSession(
            userId,
            currentSessionId,
            targetSessionId
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Sessão expirada. Entre novamente.");

        verifyNoInteractions(refreshTokenRepository);
    }

    @Test
    void doesNotAllowClosingAnotherUsersSession() {
        UUID userId = UUID.randomUUID();
        UUID currentSessionId = UUID.randomUUID();
        UUID anotherUsersSessionId = UUID.randomUUID();
        when(userSessionRepository.findByIdAndUserIdAndActiveTrue(currentSessionId, userId))
            .thenReturn(Optional.of(activeSession(currentSessionId, activeUser(userId))));
        when(userSessionRepository.findByIdAndUserIdAndActiveTrue(anotherUsersSessionId, userId))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.revokeSession(
            userId,
            currentSessionId,
            anotherUsersSessionId
        ))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage("Sessão não encontrada");

        verifyNoInteractions(refreshTokenRepository);
    }

    private void assertGenericRegistrationConflict() {
        assertThatThrownBy(() -> authService.register(request))
            .isInstanceOf(ConflictException.class)
            .hasMessage("Não foi possível usar estes dados para criar a conta");
    }

    private User activeUser(UUID userId) {
        return User.builder()
            .id(userId)
            .email("pessoa@example.com")
            .username("pessoa")
            .displayName("Pessoa")
            .status(UserStatus.ACTIVE)
            .role(UserRole.USER)
            .build();
    }

    private UserSession activeSession(UUID sessionId, User user) {
        return UserSession.builder()
            .id(sessionId)
            .user(user)
            .tokenHash("session-hash")
            .deviceType(DeviceType.MOBILE_ANDROID)
            .deviceName("Pixel de teste")
            .lastUsedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(600))
            .build();
    }
}
