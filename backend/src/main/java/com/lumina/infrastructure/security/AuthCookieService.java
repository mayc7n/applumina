package com.lumina.infrastructure.security;

import com.lumina.api.dto.AuthTokenResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Arrays;

@Component
public class AuthCookieService {
    public static final String ACCESS_COOKIE = "lumina_access";
    public static final String REFRESH_COOKIE = "lumina_refresh";

    private final JwtService jwtService;
    private final boolean secure;

    public AuthCookieService(
        JwtService jwtService,
        @Value("${lumina.security.cookies.secure:true}") boolean secure
    ) {
        this.jwtService = jwtService;
        this.secure = secure;
    }

    public void write(HttpServletResponse response, AuthTokenResponse tokens) {
        add(response, ACCESS_COOKIE, tokens.accessToken(), jwtService.getAccessExpirationSeconds());
        add(response, REFRESH_COOKIE, tokens.refreshToken(), jwtService.getRefreshExpirationSeconds());
    }

    public String refreshToken(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
            .filter(cookie -> REFRESH_COOKIE.equals(cookie.getName()))
            .map(Cookie::getValue)
            .findFirst()
            .orElse(null);
    }

    public void clear(HttpServletResponse response) {
        add(response, ACCESS_COOKIE, "", 0);
        add(response, REFRESH_COOKIE, "", 0);
    }

    private void add(HttpServletResponse response, String name, String value, long maxAgeSeconds) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
            .httpOnly(true)
            .secure(secure)
            .sameSite("Strict")
            .path("/")
            .maxAge(Duration.ofSeconds(maxAgeSeconds))
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
