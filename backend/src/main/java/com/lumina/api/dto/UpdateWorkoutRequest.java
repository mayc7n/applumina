package com.lumina.api.dto;

import java.time.LocalDate;

import com.lumina.domain.workout.entity.WorkoutType;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateWorkoutRequest(
    @NotNull WorkoutType type,
    @Size(max = 100) String customActivity,
    @NotNull LocalDate activityDate,
    @NotNull @Min(1) @Max(1_440) Integer durationMins,
    @Size(max = 2_000) String notes
) {}
