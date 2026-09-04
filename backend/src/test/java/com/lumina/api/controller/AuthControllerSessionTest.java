package com.lumina.api.controller;

import com.lumina.api.dto.UserSessionResponse;
import com.lumina.application.service.AuthService;
import com.lumina.infrastructure.security.AuthCookieService;
import com.lumina.infrastructure.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerSessionTest {
    @Mock private AuthService authService;
    @Mock private AuthCookieService authCookieService;

    private AuthController controller;
    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        controller = new AuthController(authService, authCookieService);
        principal = UserPrincipal.builder()
            .userId(UUID.randomUUID())
            .sessionId(UUID.randomUUID())
            .email("pessoa@example.com")
            .role("USER")
            .build();
    }

    @Test
    void identifiesTheCurrentSessionWithoutExposingSensitiveData() {
        UserSessionResponse session = UserSessionResponse.builder()
            .id(principal.getSessionId().toString())
            .deviceType("MOBILE_ANDROID")
            .deviceName("Pixel de teste")
            .current(true)
            .build();
        when(authService.sessions(principal.getUserId(), principal.getSessionId()))
            .thenReturn(List.of(session));

        var response = controller.sessions(principal);

        assertThat(response.data()).containsExactly(session);
        assertThat(response.data().getFirst().ipAddress()).isNull();
    }

    @Test
    void closesEveryOtherSessionButKeepsTheCurrentOne() {
        var response = controller.revokeOtherSessions(principal);

        verify(authService).revokeOtherSessions(principal.getUserId(), principal.getSessionId());
        assertThat(response.message()).isEqualTo("Outras sessões encerradas");
    }
}
