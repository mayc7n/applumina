package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record UpdateHabitRequest(
    String name, String description, String icon, String color,
    String frequency, List<Integer> frequencyDays,
    BigDecimal targetValue, String targetUnit,
    String startDate, String endDate, String reminderTime
) {}
