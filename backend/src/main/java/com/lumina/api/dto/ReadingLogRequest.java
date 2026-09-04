package com.lumina.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ReadingLogRequest(
    @NotNull @Min(1) Integer pagesRead,
    @Min(1) Integer durationMins,
    String note
) {}
