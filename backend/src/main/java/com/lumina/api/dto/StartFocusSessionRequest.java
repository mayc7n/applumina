package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record StartFocusSessionRequest(
    @NotBlank String mode,
    String taskId,
    @NotNull @Min(1) @Max(1_440) Integer plannedMins
) {}
