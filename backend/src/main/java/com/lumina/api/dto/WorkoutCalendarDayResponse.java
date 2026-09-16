package com.lumina.api.dto;

import java.util.List;

public record WorkoutCalendarDayResponse(
    String date,
    int workoutCount,
    int totalMinutes,
    boolean hasMoment,
    List<WorkoutSummary> workouts
) {
    public record WorkoutSummary(
        String id,
        String type,
        String customActivity,
        int durationMins,
        String momentPath
    ) {}
}
