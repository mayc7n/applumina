package com.lumina.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record CreateStudySessionRequest(
    String subjectId,
    @Min(1) @Max(1_440) Integer durationMins,
    @Size(max = 300) String title,
    @Size(max = 2_000) String notes,
    @Min(1) @Max(5) Short quality
) {}
