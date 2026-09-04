package com.lumina.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.domain.user.entity.User;
import com.lumina.domain.user.entity.UserStatus;
import com.lumina.domain.user.repository.RefreshTokenRepository;
import com.lumina.domain.user.repository.UserPreferencesRepository;
import com.lumina.domain.user.repository.UserRepository;
import com.lumina.domain.user.repository.UserSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    @Mock private UserRepository userRepository;
    @Mock private UserPreferencesRepository preferencesRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private UserSessionRepository userSessionRepository;
    @Mock private JdbcTemplate jdbcTemplate;
    @Mock private ObjectMapper objectMapper;
    @Mock private PasswordEncoder passwordEncoder;

    private UserService userService;
    private User user;

    @BeforeEach
    void setUp() {
        userService = new UserService(
            userRepository,
            preferencesRepository,
            refreshTokenRepository,
            userSessionRepository,
            jdbcTemplate,
            objectMapper,
            passwordEncoder
        );
        user = User.builder()
            .id(UUID.randomUUID())
            .email("pessoa@example.com")
            .username("pessoa")
            .displayName("Pessoa")
            .passwordHash("password-hash")
            .avatarUrl("private/avatar.jpg")
            .bio("Informação pessoal")
            .twoFactorSecret("private-secret")
            .status(UserStatus.ACTIVE)
            .build();
        when(userRepository.findActiveById(user.getId())).thenReturn(Optional.of(user));
    }

    @Test
    void requiresTheCurrentPasswordBeforeDeletingTheAccount() {
        when(passwordEncoder.matches("senha-incorreta", "password-hash")).thenReturn(false);

        assertThatThrownBy(() -> userService.deleteAccount(
            user.getId(),
            "pessoa@example.com",
            "senha-incorreta"
        ))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Senha incorreta");

        assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
        verifyNoInteractions(refreshTokenRepository, userSessionRepository);
        verify(jdbcTemplate, never()).update(any(String.class), any(Object[].class));
    }

    @Test
    void deletesAccountDataAndRevokesEverySession() {
        when(passwordEncoder.matches("senha-correta", "password-hash")).thenReturn(true);

        userService.deleteAccount(
            user.getId(),
            "pessoa@example.com",
            "senha-correta"
        );

        verify(userRepository).delete(user);
        verify(refreshTokenRepository).revokeAllActiveByUserId(eq(user.getId()), any(Instant.class));
        verify(userSessionRepository).revokeAllByUserId(user.getId());
        verify(jdbcTemplate).update(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)",
            user.getId(),
            "ACCOUNT_DELETED",
            "USER",
            user.getId()
        );
    }
}
