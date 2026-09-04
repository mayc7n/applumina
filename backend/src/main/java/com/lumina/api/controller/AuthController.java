package com.lumina.api.controller;

import com.lumina.api.dto.*;
import com.lumina.application.service.AuthService;
import com.lumina.application.service.AuthSessionContext;
import com.lumina.infrastructure.security.AuthCookieService;
import com.lumina.infrastructure.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final AuthCookieService authCookieService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> register(
        @Valid @RequestBody RegisterRequest request,
        HttpServletRequest httpRequest,
        HttpServletResponse response
    ) {
        AuthTokenResponse tokens = authService.register(request, webContext(httpRequest));
        authCookieService.write(response, tokens);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(tokens, "Conta criada com sucesso"));
    }

    @PostMapping("/login")
    public ApiResponse<AuthTokenResponse> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest,
        HttpServletResponse response
    ) {
        AuthTokenResponse tokens = authService.login(request, webContext(httpRequest));
        authCookieService.write(response, tokens);
        return ApiResponse.success(tokens);
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthTokenResponse> refresh(
        HttpServletRequest request,
        HttpServletResponse response,
        @RequestHeader(value = "X-Lumina-Legacy-Session", required = false) String legacyMigration,
        @Valid @RequestBody(required = false) RefreshTokenRequest legacyRequest
    ) {
        String rawToken = authCookieService.refreshToken(request);
        if (rawToken == null && "1".equals(legacyMigration) && legacyRequest != null) {
            rawToken = legacyRequest.refreshToken();
        }
        AuthTokenResponse tokens = authService.refresh(rawToken, webContext(request));
        authCookieService.write(response, tokens);
        return ApiResponse.success(tokens);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(authCookieService.refreshToken(request));
        authCookieService.clear(response);
        return ApiResponse.success(null, "Sessão encerrada");
    }

    @GetMapping("/sessions")
    public ApiResponse<List<UserSessionResponse>> sessions(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.success(authService.sessions(principal.getUserId(), principal.getSessionId()));
    }

    @DeleteMapping("/sessions/others")
    public ApiResponse<Void> revokeOtherSessions(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        authService.revokeOtherSessions(principal.getUserId(), principal.getSessionId());
        return ApiResponse.success(null, "Outras sessões encerradas");
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ApiResponse<Void> revokeSession(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID sessionId
    ) {
        authService.revokeSession(principal.getUserId(), principal.getSessionId(), sessionId);
        return ApiResponse.success(null, "Sessão encerrada");
    }

    private AuthSessionContext webContext(HttpServletRequest request) {
        return AuthSessionContext.web(
            request.getHeader("Sec-CH-UA-Platform"),
            request.getHeader("User-Agent")
        );
    }
}
