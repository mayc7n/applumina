package com.lumina.api.dto;

public record SocialFeedItemResponse(
    String id, SocialUserResponse user, String type, String title,
    String description, String emoji, int likeCount, boolean liked, String createdAt,
    String mediaUrl
) {
    public SocialFeedItemResponse(
        String id, SocialUserResponse user, String type, String title,
        String description, String emoji, int likeCount, boolean liked, String createdAt
    ) {
        this(id, user, type, title, description, emoji, likeCount, liked, createdAt, null);
    }
}
