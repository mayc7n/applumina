package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateMilestoneRequest(
    @NotBlank @Size(max = 200) String title,
    @Size(max = 500) String description,
    @Positive Double targetValue,
    String dueDate
) {}
