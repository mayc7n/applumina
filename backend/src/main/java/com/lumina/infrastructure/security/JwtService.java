package com.lumina.infrastructure.security;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.time.*;
import java.util.*;
import java.util.function.Function;

@Service @Slf4j
public class JwtService {
    private final SecretKey secretKey;
    private final long accessExpMs;
    private final long refreshExpMs;

    public JwtService(
        @Value("${lumina.security.jwt.secret}") String secret,
        @Value("${lumina.security.jwt.access-token-expiration}") long accessExpMs,
        @Value("${lumina.security.jwt.refresh-token-expiration}") long refreshExpMs) {
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(
            Base64.getEncoder().encodeToString(secret.getBytes())));
        this.accessExpMs = accessExpMs;
        this.refreshExpMs = refreshExpMs;
    }

    public String generateAccessToken(UUID userId, String email, String role, String plan) {
        Instant now = Instant.now();
        return Jwts.builder().id(UUID.randomUUID().toString()).subject(userId.toString())
            .claim("email", email).claim("role", role).claim("plan", plan).claim("type","access")
            .issuedAt(Date.from(now)).expiration(Date.from(now.plusMillis(accessExpMs)))
            .signWith(secretKey).compact();
    }

    public String generateRefreshToken(UUID userId) {
        Instant now = Instant.now();
        return Jwts.builder().id(UUID.randomUUID().toString()).subject(userId.toString())
            .claim("type","refresh").issuedAt(Date.from(now))
            .expiration(Date.from(now.plusMillis(refreshExpMs))).signWith(secretKey).compact();
    }

    public boolean isValid(String token) {
        try { parseClaims(token); return true; } catch (Exception e) { return false; }
    }
    public boolean isAccessToken(String token) {
        try { return "access".equals(extractClaim(token, c -> c.get("type",String.class))); } catch(Exception e){return false;}
    }
    public boolean isRefreshToken(String token) {
        try { return "refresh".equals(extractClaim(token, c -> c.get("type",String.class))); } catch(Exception e){return false;}
    }
    public String extractUserId(String token)  { return extractClaim(token, Claims::getSubject); }
    public String extractEmail(String token)   { return extractClaim(token, c -> c.get("email",String.class)); }
    public String extractRole(String token)    { return extractClaim(token, c -> c.get("role",String.class)); }
    public Instant extractExpiration(String token) { return extractClaim(token, c -> c.getExpiration().toInstant()); }
    public long getAccessExpirationSeconds() { return accessExpMs / 1000; }
    public long getRefreshExpirationSeconds() { return refreshExpMs / 1000; }
    public <T> T extractClaim(String token, Function<Claims,T> fn) { return fn.apply(parseClaims(token)); }

    private Claims parseClaims(String token) {
        return Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload();
    }
}
