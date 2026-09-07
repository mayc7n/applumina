package com.lumina.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumina.api.dto.AuthTokenResponse;
import com.lumina.api.dto.LoginRequest;
import com.lumina.api.dto.RegisterRequest;
import com.lumina.api.dto.RefreshTokenRequest;
import com.lumina.application.service.AuthService;
import com.lumina.infrastructure.security.AuthCookieService;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {
    @Mock private AuthService authService;
    @Mock private AuthCookieService authCookieService;

    private AuthController controller;

    @BeforeEach
    void setUp() {
        controller = new AuthController(authService, authCookieService);
    }

    @Test
    void webAuthenticationResponsesAreNotCacheableAndKeepTokensInCookies() throws Exception {
        AuthTokenResponse tokens = AuthTokenResponse.builder()
            .accessToken("access-value")
            .refreshToken("refresh-value")
            .expiresIn(900)
            .requiresTwoFactor(false)
            .build();
        when(authService.register(any(), any())).thenReturn(tokens);
        when(authService.login(any(), any())).thenReturn(tokens);
        when(authService.refresh(nullable(String.class), any())).thenReturn(tokens);

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse registerResponse = new MockHttpServletResponse();
        var register = controller.register(
            new RegisterRequest("user@example.com", "pessoa", "Pessoa", "strong-password"),
            request, registerResponse
        );
        assertThat(register.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(register.getBody().success()).isTrue();
        assertWebResponse(register.getBody());
        MockHttpServletResponse loginResponse = new MockHttpServletResponse();
        var login = controller.login(
            new LoginRequest("user@example.com", "strong-password"), request, loginResponse);
        assertThat(login.success()).isTrue();
        assertWebResponse(login);
        MockHttpServletResponse refreshResponse = new MockHttpServletResponse();
        var refresh = controller.refresh(
            request, refreshResponse, null, new RefreshTokenRequest("legacy-refresh"));
        assertThat(refresh.success()).isTrue();
        assertWebResponse(refresh);

        verify(authCookieService, times(3)).write(any(HttpServletResponse.class), any(AuthTokenResponse.class));
        assertNoStore(registerResponse);
        assertNoStore(loginResponse);
        assertNoStore(refreshResponse);
    }

    private void assertWebResponse(Object body) throws Exception {
        String json = new ObjectMapper().findAndRegisterModules().writeValueAsString(body);
        assertThat(json).doesNotContain("access-value", "refresh-value", "temp-value");
    }

    private void assertNoStore(MockHttpServletResponse response) {
        assertThat(response.getHeader(HttpHeaders.CACHE_CONTROL)).isEqualTo("no-store");
        assertThat(response.getHeader(HttpHeaders.PRAGMA)).isEqualTo("no-cache");
    }
}
