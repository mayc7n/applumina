package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Builder
public record FocusStatsResponse(
    int totalSessions, int totalFocusMins,
    BigDecimal avgSessionMins, BigDecimal avgFocusScore,
    int longestStreakDays, int currentStreakDays, int weeklyMins
) {}
