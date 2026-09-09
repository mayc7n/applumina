package com.lumina.api.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateUserBlockRequest(@NotNull UUID userId) {}
