package com.lumina.api.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateFriendRequest(@NotNull UUID userId) {}
