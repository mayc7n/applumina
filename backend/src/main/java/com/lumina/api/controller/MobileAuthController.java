package com.lumina.api.controller;

import com.lumina.api.dto.ApiResponse;
import com.lumina.api.dto.AuthTokenResponse;
import com.lumina.api.dto.LoginRequest;
import com.lumina.api.dto.LogoutRequest;
import com.lumina.api.dto.MobileAuthTokenResponse;
import com.lumina.api.dto.RefreshTokenRequest;
import com.lumina.api.dto.RegisterRequest;
import com.lumina.application.service.AuthService;
import com.lumina.application.service.AuthSessionContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth/mobile")
@RequiredArgsConstructor
public class MobileAuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<MobileAuthTokenResponse>> register(
        @Valid @RequestBody RegisterRequest request,
        HttpServletRequest httpRequest
    ) {
        return tokenResponse(authService.register(request, sessionContext(httpRequest)), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<MobileAuthTokenResponse>> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest
    ) {
        return tokenResponse(authService.login(request, sessionContext(httpRequest)), HttpStatus.OK);
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<MobileAuthTokenResponse>> refresh(
        @Valid @RequestBody RefreshTokenRequest request,
        HttpServletRequest httpRequest
    ) {
        return tokenResponse(
            authService.refresh(request.refreshToken(), sessionContext(httpRequest)),
            HttpStatus.OK
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request.refreshToken());
        return noStore(ApiResponse.success(null, "Sessão encerrada"), HttpStatus.OK);
    }

    private ResponseEntity<ApiResponse<MobileAuthTokenResponse>> tokenResponse(
        AuthTokenResponse tokens,
        HttpStatus status
    ) {
        return noStore(ApiResponse.success(MobileAuthTokenResponse.from(tokens)), status);
    }

    private <T> ResponseEntity<ApiResponse<T>> noStore(ApiResponse<T> body, HttpStatus status) {
        return ResponseEntity.status(status)
            .cacheControl(CacheControl.noStore())
            .header(HttpHeaders.PRAGMA, "no-cache")
            .body(body);
    }

    private AuthSessionContext sessionContext(HttpServletRequest request) {
        return AuthSessionContext.mobile(
            request.getHeader("X-Device-Type"),
            request.getHeader("X-Device-Name"),
            request.getHeader(HttpHeaders.USER_AGENT)
        );
    }
}
