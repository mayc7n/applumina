package com.lumina.api.controller;

import com.lumina.api.dto.*;
import com.lumina.application.service.AuthService;
import com.lumina.infrastructure.security.AuthCookieService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final AuthCookieService authCookieService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> register(
        @Valid @RequestBody RegisterRequest request,
        HttpServletResponse response
    ) {
        AuthTokenResponse tokens = authService.register(request);
        authCookieService.write(response, tokens);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(tokens, "Conta criada com sucesso"));
    }

    @PostMapping("/login")
    public ApiResponse<AuthTokenResponse> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletResponse response
    ) {
        AuthTokenResponse tokens = authService.login(request);
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
        AuthTokenResponse tokens = authService.refresh(rawToken);
        authCookieService.write(response, tokens);
        return ApiResponse.success(tokens);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(authCookieService.refreshToken(request));
        authCookieService.clear(response);
        return ApiResponse.success(null, "Sessão encerrada");
    }
}
