package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Builder
public record WeeklyAnalyticsDto(
    List<DailyDataPointDto> daily,
    List<DayOfWeekDataDto> tasksByDayOfWeek,
    List<FocusDistributionDto> focusDistribution,
    List<MoodTrendDto> moodTrend,
    List<AreaBalanceDto> areaBalance,
    int productivityScore, int tasksCompleted,
    int habitRate, int focusMins, int streak,
    List<InsightDto> insights,
    java.util.Map<String, Number> trends
) {}
