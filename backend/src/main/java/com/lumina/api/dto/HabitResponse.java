package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Builder
public record HabitResponse(
    String id, String name, String description, String icon, String color,
    String habitType, String frequency, List<Integer> frequencyDays,
    BigDecimal targetValue, String targetUnit, String startDate,
    String reminderTime, int orderIndex,
    HabitStreakResponse streak, String createdAt
) {}
