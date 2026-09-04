package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Builder
public record DashboardDataDto(
    List<TaskResponse> todayTasks,
    List<HabitResponse> habits,
    List<String> todayCompletions,
    List<GoalResponse> activeGoals,
    FocusStatsDto focusStats,
    int streak, int longestStreak,
    List<WeeklyDataPointDto> weeklyData,
    List<ActivityItemDto> recentActivity,
    boolean moodCheckedIn
) {}
