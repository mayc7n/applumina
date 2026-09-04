package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Builder
public record HabitStreakResponse(
    int currentStreak, int longestStreak,
    String lastCompleted, int totalCompletions
) {}
