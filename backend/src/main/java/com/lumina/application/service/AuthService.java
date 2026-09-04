package com.lumina.application.service;

import com.lumina.api.dto.*;
import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.api.middleware.GlobalExceptionHandler.ConflictException;
import com.lumina.domain.user.entity.RefreshToken;
import com.lumina.domain.user.entity.User;
import com.lumina.domain.user.entity.UserStatus;
import com.lumina.domain.user.repository.RefreshTokenRepository;
import com.lumina.domain.user.repository.UserRepository;
import com.lumina.infrastructure.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthTokenResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        String username = request.username().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Já existe uma conta com este e-mail");
        }
        if (userRepository.existsByUsername(username)) {
            throw new ConflictException("Este nome de usuário já está em uso");
        }

        User user = User.builder()
            .email(email)
            .username(username)
            .displayName(request.displayName().trim())
            .passwordHash(passwordEncoder.encode(request.password()))
            .status(UserStatus.ACTIVE)
            .emailVerified(true)
            .build();

        userRepository.save(user);
        return issueTokenPair(user);
    }

    @Transactional
    public AuthTokenResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(email, request.password())
        );

        User user = userRepository.findByEmailAndDeletedAtIsNull(email)
            .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        user.updateLastSeen();
        return issueTokenPair(user);
    }

    @Transactional
    public AuthTokenResponse refresh(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) throw invalidRefreshToken();
        if (!jwtService.isValid(rawToken) || !jwtService.isRefreshToken(rawToken)) {
            throw invalidRefreshToken();
        }

        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(hash(rawToken))
            .orElseThrow(this::invalidRefreshToken);

        if (!storedToken.isUsable()) {
            refreshTokenRepository.revokeAllActiveByUserId(
                storedToken.getUser().getId(),
                Instant.now()
            );
            throw invalidRefreshToken();
        }

        UUID tokenUserId = UUID.fromString(jwtService.extractUserId(rawToken));
        if (!storedToken.getUser().getId().equals(tokenUserId)) {
            storedToken.revoke();
            throw invalidRefreshToken();
        }

        storedToken.markUsed();
        return issueTokenPair(storedToken.getUser());
    }

    @Transactional
    public void logout(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return;
        refreshTokenRepository.findByTokenHash(hash(rawToken))
            .filter(RefreshToken::isUsable)
            .ifPresent(RefreshToken::revoke);
    }

    private AuthTokenResponse issueTokenPair(User user) {
        String accessToken = jwtService.generateAccessToken(
            user.getId(),
            user.getEmail(),
            user.getRole().name(),
            user.getPlan().name()
        );
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        refreshTokenRepository.save(RefreshToken.builder()
            .user(user)
            .tokenHash(hash(refreshToken))
            .expiresAt(jwtService.extractExpiration(refreshToken))
            .build());

        return AuthTokenResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .expiresIn(Math.toIntExact(jwtService.getAccessExpirationSeconds()))
            .requiresTwoFactor(false)
            .build();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private BusinessException invalidRefreshToken() {
        return new BusinessException(
            "INVALID_REFRESH_TOKEN",
            "Sessão expirada. Entre novamente.",
            HttpStatus.UNAUTHORIZED
        );
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }
}
