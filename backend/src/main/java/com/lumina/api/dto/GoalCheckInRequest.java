package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record GoalCheckInRequest(
    @NotNull @Positive Double value,
    @Size(max = 2_000) String note,
    @Size(max = 20) String mood
) {}
