package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateHabitRequest(
    @NotBlank @Size(max = 200) String name,
    @Size(max = 500) String description,
    @Size(max = 50) String icon,
    @Size(max = 20) String color,
    String habitType, String frequency,
    @Size(max = 7) List<@Min(1) @Max(7) Integer> frequencyDays,
    @Positive BigDecimal targetValue,
    @Size(max = 50) String targetUnit,
    String startDate, String reminderTime
) {}
