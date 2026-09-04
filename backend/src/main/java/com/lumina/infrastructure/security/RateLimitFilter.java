package com.lumina.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumina.api.dto.ApiResponse;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {
    private static final int MAX_CLIENTS = 10_000;
    private static final Duration ENTRY_TTL = Duration.ofHours(1);

    private final ObjectMapper objectMapper;
    private final Map<String, ClientBucket> buckets = new ConcurrentHashMap<>();
    private final AtomicInteger requests = new AtomicInteger();

    @Value("${lumina.rate-limit.enabled:true}")
    private boolean enabled;

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        boolean authEndpoint = request.getServletPath().startsWith("/auth/");
        String key = clientAddress(request) + (authEndpoint ? ":auth" : ":api");
        ClientBucket client = buckets.computeIfAbsent(key, ignored -> createBucket(authEndpoint));
        client.lastSeen = Instant.now();

        if (!client.bucket.tryConsume(1)) {
            response.setStatus(429);
            response.setHeader("Retry-After", "60");
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(
                response.getOutputStream(),
                ApiResponse.error("RATE_LIMITED", "Muitas requisições. Tente novamente em instantes.")
            );
            return;
        }

        if ((requests.incrementAndGet() & 1023) == 0) evictExpiredEntries();
        filterChain.doFilter(request, response);
    }

    private ClientBucket createBucket(boolean authEndpoint) {
        long capacity = authEndpoint ? 10 : 120;
        Bandwidth limit = Bandwidth.builder()
            .capacity(capacity)
            .refillGreedy(capacity, Duration.ofMinutes(1))
            .build();
        if (buckets.size() >= MAX_CLIENTS) {
            evictExpiredEntries();
            if (buckets.size() >= MAX_CLIENTS) {
                buckets.keySet().stream().findFirst().ifPresent(buckets::remove);
            }
        }
        return new ClientBucket(Bucket.builder().addLimit(limit).build());
    }

    private void evictExpiredEntries() {
        Instant cutoff = Instant.now().minus(ENTRY_TTL);
        buckets.entrySet().removeIf(entry -> entry.getValue().lastSeen.isBefore(cutoff));
    }

    private String clientAddress(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) return forwarded.split(",", 2)[0].trim();
        return request.getRemoteAddr();
    }

    private static final class ClientBucket {
        private final Bucket bucket;
        private volatile Instant lastSeen = Instant.now();

        private ClientBucket(Bucket bucket) {
            this.bucket = bucket;
        }
    }
}
