package com.lumina.application.service;

import com.lumina.api.dto.RegisterRequest;
import com.lumina.api.middleware.GlobalExceptionHandler.ConflictException;
import com.lumina.domain.user.repository.RefreshTokenRepository;
import com.lumina.domain.user.repository.UserRepository;
import com.lumina.infrastructure.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
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

    private void assertGenericRegistrationConflict() {
        assertThatThrownBy(() -> authService.register(request))
            .isInstanceOf(ConflictException.class)
            .hasMessage("Não foi possível usar estes dados para criar a conta");
    }
}
