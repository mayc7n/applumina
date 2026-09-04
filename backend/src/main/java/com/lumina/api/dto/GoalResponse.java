package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Builder
public record GoalResponse(
    String id, String title, String description, String icon, String color,
    String status, String period, String startDate, String endDate,
    Double targetValue, Double currentValue, String unit, Double progressPct,
    boolean isPublic, int milestoneCount, int completedMilestoneCount,
    List<GoalMilestoneResponse> milestones,
    String completedAt, String createdAt
) {}
