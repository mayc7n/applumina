package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateGoalRequest(
    @NotBlank @Size(max = 200) String title,
    @Size(max = 10_000) String description,
    @Size(max = 50) String icon,
    @Size(max = 20) String color,
    @NotBlank String period,
    String startDate, String endDate,
    @Positive Double targetValue,
    @Size(max = 50) String unit,
    Boolean isPublic
) {}
