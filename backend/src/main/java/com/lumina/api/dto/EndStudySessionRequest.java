package com.lumina.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record EndStudySessionRequest(
    @Min(1) @Max(5) Short quality,
    @Size(max = 2_000) String notes
) {}
