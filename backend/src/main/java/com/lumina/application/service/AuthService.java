package com.lumina.application.service;

import com.lumina.api.dto.*;
import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.api.middleware.GlobalExceptionHandler.ConflictException;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.user.entity.RefreshToken;
import com.lumina.domain.user.entity.User;
import com.lumina.domain.user.entity.UserSession;
import com.lumina.domain.user.entity.UserStatus;
import com.lumina.domain.user.repository.RefreshTokenRepository;
import com.lumina.domain.user.repository.UserRepository;
import com.lumina.domain.user.repository.UserSessionRepository;
import com.lumina.infrastructure.security.JwtService;
import com.lumina.infrastructure.cache.RedisService;
import com.lumina.infrastructure.messaging.EventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Value;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserSessionRepository userSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RedisService redisService;
    private final EventPublisher eventPublisher;
    private final JdbcTemplate jdbcTemplate;

    @Value("${lumina.auth.password-reset-url:lumina://reset-password}")
    private String passwordResetUrl = "lumina://reset-password";

    private static final Duration PASSWORD_RESET_TTL = Duration.ofMinutes(15);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Transactional
    public AuthTokenResponse register(RegisterRequest request) {
        return register(request, AuthSessionContext.unknown());
    }

    @Transactional
    public AuthTokenResponse register(RegisterRequest request, AuthSessionContext context) {
        String email = normalizeEmail(request.email());
        String username = request.username().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(email) || userRepository.existsByUsername(username)) {
            throw new ConflictException("Não foi possível usar estes dados para criar a conta");
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
        return issueTokenPair(user, null, context);
    }

    @Transactional
    public AuthTokenResponse login(LoginRequest request) {
        return login(request, AuthSessionContext.unknown());
    }

    @Transactional
    public AuthTokenResponse login(LoginRequest request, AuthSessionContext context) {
        String email = normalizeEmail(request.email());
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(email, request.password())
        );

        User user = userRepository.findByEmailAndDeletedAtIsNull(email)
            .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        user.updateLastSeen();
        return issueTokenPair(user, null, context);
    }

    @Transactional(noRollbackFor = BusinessException.class)
    public AuthTokenResponse refresh(String rawToken) {
        return refresh(rawToken, AuthSessionContext.unknown());
    }

    @Transactional(noRollbackFor = BusinessException.class)
    public AuthTokenResponse refresh(String rawToken, AuthSessionContext context) {
        if (rawToken == null || rawToken.isBlank()) throw invalidRefreshToken();
        if (!jwtService.isValid(rawToken) || !jwtService.isRefreshToken(rawToken)) {
            throw invalidRefreshToken();
        }

        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(hash(rawToken))
            .orElseThrow(this::invalidRefreshToken);
        UserSession session = storedToken.getSession();

        if (!storedToken.isUsable()) {
            boolean possibleReuse = storedToken.getUsedAt() != null
                && storedToken.getRevokedAt() == null
                && (session == null || session.isUsable());
            if (possibleReuse) revokeAll(storedToken.getUser().getId());
            throw invalidRefreshToken();
        }

        UUID tokenUserId = UUID.fromString(jwtService.extractUserId(rawToken));
        if (!storedToken.getUser().getId().equals(tokenUserId)) {
            storedToken.revoke();
            throw invalidRefreshToken();
        }
        if (!storedToken.getUser().isActive()) {
            revokeAll(storedToken.getUser().getId());
            throw invalidRefreshToken();
        }

        UUID tokenSessionId = jwtService.extractSessionId(rawToken);
        if (session != null && (!session.isUsable() || !session.getId().equals(tokenSessionId))) {
            storedToken.revoke();
            session.revoke();
            throw invalidRefreshToken();
        }

        storedToken.markUsed();
        return issueTokenPair(storedToken.getUser(), session, context);
    }

    @Transactional
    public void logout(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return;
        refreshTokenRepository.findByTokenHash(hash(rawToken))
            .ifPresent(token -> {
                token.revoke();
                if (token.getSession() != null) token.getSession().revoke();
            });
    }

    @Transactional(readOnly = true)
    public List<UserSessionResponse> sessions(UUID userId, UUID currentSessionId) {
        return userSessionRepository
            .findByUserIdAndActiveTrueAndExpiresAtAfterOrderByLastUsedAtDesc(userId, Instant.now())
            .stream()
            .map(session -> UserSessionResponse.builder()
                .id(session.getId().toString())
                .deviceType(session.getDeviceType().name())
                .deviceName(session.getDeviceName())
                .lastUsedAt(string(session.getLastUsedAt()))
                .createdAt(string(session.getCreatedAt()))
                .current(session.getId().equals(currentSessionId))
                .build())
            .toList();
    }

    @Transactional
    public void revokeOtherSessions(UUID userId, UUID currentSessionId) {
        requireCurrentSession(userId, currentSessionId);
        Instant now = Instant.now();
        refreshTokenRepository.revokeAllActiveExceptSession(userId, currentSessionId, now);
        userSessionRepository.revokeOthers(userId, currentSessionId);
    }

    @Transactional
    public void revokeSession(UUID userId, UUID currentSessionId, UUID sessionId) {
        requireCurrentSession(userId, currentSessionId);
        if (sessionId.equals(currentSessionId)) {
            throw new BusinessException(
                "CURRENT_SESSION",
                "Use sair da conta para encerrar a sessão atual",
                HttpStatus.UNPROCESSABLE_ENTITY
            );
        }
        UserSession session = userSessionRepository.findByIdAndUserIdAndActiveTrue(sessionId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Sessão não encontrada"));
        refreshTokenRepository.revokeAllActiveBySessionId(sessionId, Instant.now());
        session.revoke();
    }

    public void requestPasswordReset(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        try {
            userRepository.findByEmailAndDeletedAtIsNull(email)
                .filter(User::isActive)
                .filter(user -> user.getPasswordHash() != null)
                .ifPresent(user -> {
                    byte[] bytes = new byte[32];
                    SECURE_RANDOM.nextBytes(bytes);
                    String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
                    String tokenHash = hash(token);
                    String userKey = "password-reset:user:" + user.getId();
                    String previousHash = redisService.get(userKey);
                    if (previousHash != null) redisService.delete("password-reset:token:" + previousHash);
                    redisService.set("password-reset:token:" + tokenHash, user.getId().toString(), PASSWORD_RESET_TTL);
                    redisService.set(userKey, tokenHash, PASSWORD_RESET_TTL);
                    eventPublisher.publishEmail(
                        user.getEmail(),
                        user.getDisplayName(),
                        "password-reset",
                        Map.of("url", passwordResetUrl + "?token=" + token, "locale", user.getLocale())
                    );
                });
        } catch (RuntimeException exception) {
            log.warn("Password recovery request could not be queued");
        }
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        String tokenHash = hash(rawToken);
        String userIdValue = redisService.getAndDelete("password-reset:token:" + tokenHash);
        if (userIdValue == null) throw invalidPasswordResetToken();

        UUID userId;
        try {
            userId = UUID.fromString(userIdValue);
        } catch (IllegalArgumentException exception) {
            throw invalidPasswordResetToken();
        }
        User user = userRepository.findActiveById(userId)
            .orElseThrow(this::invalidPasswordResetToken);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        redisService.delete("password-reset:user:" + userId);
        revokeAll(userId);
        jdbcTemplate.update(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)",
            userId, "PASSWORD_RESET", "USER", userId
        );
    }

    private AuthTokenResponse issueTokenPair(User user, UserSession existingSession, AuthSessionContext context) {
        AuthSessionContext safeContext = context != null ? context : AuthSessionContext.unknown();
        UserSession session = existingSession;
        if (session == null) {
            session = userSessionRepository.save(UserSession.builder()
                .user(user)
                .tokenHash(hash(UUID.randomUUID() + ":" + UUID.randomUUID()))
                .deviceType(safeContext.deviceType())
                .deviceName(safeContext.deviceName())
                .userAgent(safeContext.userAgent())
                .expiresAt(Instant.now().plusSeconds(jwtService.getRefreshExpirationSeconds()))
                .build());
        }

        String refreshToken = jwtService.generateRefreshToken(user.getId(), session.getId());
        Instant refreshExpiration = jwtService.extractExpiration(refreshToken);
        session.setTokenHash(hash(refreshToken));
        session.touch(refreshExpiration);
        userSessionRepository.save(session);
        String accessToken = jwtService.generateAccessToken(
            user.getId(),
            user.getEmail(),
            user.getRole().name(),
            user.getPlan().name(),
            session.getId()
        );

        refreshTokenRepository.save(RefreshToken.builder()
            .user(user)
            .session(session)
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

    private void requireCurrentSession(UUID userId, UUID currentSessionId) {
        if (currentSessionId == null || userSessionRepository
            .findByIdAndUserIdAndActiveTrue(currentSessionId, userId).isEmpty()) {
            throw invalidRefreshToken();
        }
    }

    private void revokeAll(UUID userId) {
        refreshTokenRepository.revokeAllActiveByUserId(userId, Instant.now());
        userSessionRepository.revokeAllByUserId(userId);
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

    private BusinessException invalidPasswordResetToken() {
        return new BusinessException(
            "INVALID_PASSWORD_RESET_TOKEN",
            "Este link expirou ou já foi utilizado",
            HttpStatus.UNPROCESSABLE_ENTITY
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

    private String string(Object value) {
        return value != null ? value.toString() : null;
    }
}
