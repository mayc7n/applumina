package com.lumina.api.dto;

public record SocialFeedItemResponse(
    String id, SocialUserResponse user, String type, String title,
    String description, String emoji, int likeCount, boolean liked, String createdAt
) {}
