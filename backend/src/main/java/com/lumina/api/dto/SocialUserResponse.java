package com.lumina.api.dto;

public record SocialUserResponse(
    String id, String displayName, String username, String avatarUrl,
    boolean isOnline, int streak, String friendshipStatus
) {}
