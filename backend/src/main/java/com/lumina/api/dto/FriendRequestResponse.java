package com.lumina.api.dto;

public record FriendRequestResponse(
    String id, SocialUserResponse user, String createdAt
) {}
