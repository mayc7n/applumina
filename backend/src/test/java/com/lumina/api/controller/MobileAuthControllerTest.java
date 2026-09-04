package com.lumina.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumina.api.dto.AuthTokenResponse;
import com.lumina.api.dto.LoginRequest;
import com.lumina.api.dto.LogoutRequest;
import com.lumina.application.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MobileAuthControllerTest {
    @Mock
    private AuthService authService;

    private MobileAuthController controller;

    @BeforeEach
    void setUp() {
        controller = new MobileAuthController(authService);
    }

    @Test
    void returnsTokenPairOnlyFromDedicatedMobileEndpoint() throws Exception {
        LoginRequest request = new LoginRequest("user@example.com", "strong-password");
        when(authService.login(request)).thenReturn(tokens());

        var response = controller.login(request);
        String json = new ObjectMapper().findAndRegisterModules().writeValueAsString(response.getBody());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getCacheControl()).isEqualTo("no-store");
        assertThat(response.getHeaders().getFirst(HttpHeaders.PRAGMA)).isEqualTo("no-cache");
        assertThat(response.getHeaders()).doesNotContainKey(HttpHeaders.SET_COOKIE);
        assertThat(json).contains("access-value", "refresh-value", "\"expiresIn\":900");
    }

    @Test
    void logoutRevokesTheSubmittedRefreshToken() {
        var response = controller.logout(new LogoutRequest("refresh-value"));

        verify(authService).logout("refresh-value");
        assertThat(response.getHeaders().getCacheControl()).isEqualTo("no-store");
    }

    private AuthTokenResponse tokens() {
        return AuthTokenResponse.builder()
            .accessToken("access-value")
            .refreshToken("refresh-value")
            .expiresIn(900)
            .requiresTwoFactor(false)
            .build();
    }
}
