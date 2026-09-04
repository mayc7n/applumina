package com.lumina.infrastructure.security;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import com.lumina.domain.user.repository.UserRepository;
import com.lumina.domain.user.repository.UserSessionRepository;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Component @RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final UserSessionRepository userSessionRepository;

    private static final Set<String> PUBLIC_AUTH_PATHS = Set.of(
        "/auth/register",
        "/auth/login",
        "/auth/refresh",
        "/auth/logout",
        "/auth/forgot-password",
        "/auth/reset-password",
        "/auth/verify-email"
    );

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest req,@NonNull HttpServletResponse res,@NonNull FilterChain chain) throws ServletException, IOException {
        String token = extractToken(req);
        if (token != null && jwtService.isValid(token) && jwtService.isAccessToken(token)) {
            try {
                UUID userId = UUID.fromString(jwtService.extractUserId(token));
                var user = userRepository.findActiveById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Inactive user"));
                UUID sessionId = jwtService.extractSessionId(token);
                if (sessionId != null && !userSessionRepository
                    .existsByIdAndUserIdAndActiveTrueAndExpiresAtAfter(sessionId, userId, Instant.now())) {
                    throw new IllegalArgumentException("Inactive session");
                }
                var principal = UserPrincipal.builder()
                    .userId(user.getId())
                    .sessionId(sessionId)
                    .email(user.getEmail())
                    .role(user.getRole().name()).build();
                var auth = new UsernamePasswordAuthenticationToken(principal, null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + principal.getRole())));
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception e) { SecurityContextHolder.clearContext(); }
        }
        chain.doFilter(req, res);
    }

    private String extractToken(HttpServletRequest req) {
        String h = req.getHeader("Authorization");
        if (StringUtils.hasText(h) && h.startsWith("Bearer ")) return h.substring(7);
        if (req.getCookies() == null) return null;
        for (Cookie cookie : req.getCookies()) {
            if (AuthCookieService.ACCESS_COOKIE.equals(cookie.getName())) return cookie.getValue();
        }
        return null;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        String p = req.getServletPath();
        return PUBLIC_AUTH_PATHS.contains(p)
            || p.startsWith("/auth/mobile/")
            || p.startsWith("/auth/oauth2/")
            || p.startsWith("/actuator/health")
            || p.startsWith("/v3/api-docs")
            || p.startsWith("/swagger-ui");
    }
}
