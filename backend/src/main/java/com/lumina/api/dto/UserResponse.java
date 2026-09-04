package com.lumina.api.dto;

import com.lumina.domain.user.entity.User;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String email,
    String username,
    String displayName,
    String avatarUrl,
    String bio,
    String timezone,
    String locale,
    String status,
    String role,
    String plan,
    boolean emailVerified,
    boolean twoFactorEnabled,
    boolean onboardingComplete,
    Instant lastSeenAt,
    Instant createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getUsername(),
            user.getDisplayName(),
            user.getAvatarUrl(),
            user.getBio(),
            user.getTimezone(),
            user.getLocale(),
            user.getStatus().name(),
            user.getRole().name(),
            user.getPlan().name(),
            user.isEmailVerified(),
            user.isTwoFactorEnabled(),
            user.isOnboardingComplete(),
            user.getLastSeenAt(),
            user.getCreatedAt()
        );
    }
}
