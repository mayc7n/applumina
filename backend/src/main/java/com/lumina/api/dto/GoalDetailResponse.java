package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Builder
public record GoalDetailResponse(
    String id, String title, String description, String icon, String color,
    String status, String period, Double targetValue, Double currentValue,
    String unit, Double progressPct,
    List<GoalMilestoneResponse> milestones, List<GoalCheckInResponse> checkIns
) {}
