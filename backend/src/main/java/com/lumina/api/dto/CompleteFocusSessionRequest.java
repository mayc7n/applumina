package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CompleteFocusSessionRequest(
    @Size(max = 2_000) String notes,
    @DecimalMin("1.0") @DecimalMax("5.0") Double focusScore
) {}
