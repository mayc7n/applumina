package com.lumina.api.dto;

public record WorkoutResponse(
    String id,
    String type,
    String customActivity,
    String activityDate,
    int durationMins,
    String notes,
    String privacy,
    String createdAt
) {}
