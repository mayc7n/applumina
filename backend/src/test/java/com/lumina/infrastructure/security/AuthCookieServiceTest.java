package com.lumina.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumina.api.dto.AuthTokenResponse;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthCookieServiceTest {
    @Test
    void tokensAreNotSerializedInTheApiResponse() throws Exception {
        AuthTokenResponse response = tokens();

        String json = new ObjectMapper().writeValueAsString(response);

        assertThat(json).doesNotContain("access-value", "refresh-value", "accessToken", "refreshToken");
        assertThat(json).contains("\"expiresIn\":900");
    }

    @Test
    void writesProtectedAuthenticationCookies() {
        JwtService jwtService = mock(JwtService.class);
        when(jwtService.getAccessExpirationSeconds()).thenReturn(900L);
        when(jwtService.getRefreshExpirationSeconds()).thenReturn(2_592_000L);
        AuthCookieService service = new AuthCookieService(jwtService, true);
        MockHttpServletResponse response = new MockHttpServletResponse();

        service.write(response, tokens());

        List<String> cookies = response.getHeaders("Set-Cookie");
        assertThat(cookies).hasSize(2).allSatisfy(cookie -> assertThat(cookie)
            .contains("HttpOnly", "Secure", "SameSite=Strict", "Path=/"));
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
