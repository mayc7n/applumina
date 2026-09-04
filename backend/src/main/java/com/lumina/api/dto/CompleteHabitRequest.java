package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CompleteHabitRequest(
    @Positive @DecimalMax("99999999.99") BigDecimal value,
    @Size(max = 500) String note
) {}
