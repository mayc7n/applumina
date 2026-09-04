package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Builder
public record GoalMilestoneResponse(
    String id, String title, String description, Double targetValue,
    String dueDate, String completedAt, int orderIndex
) {}
