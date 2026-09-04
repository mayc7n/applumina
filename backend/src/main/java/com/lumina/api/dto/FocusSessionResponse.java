package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Builder
public record FocusSessionResponse(
    String id, String mode, String status, int plannedMins, int actualMins,
    int breaksTaken, Double focusScore, String notes, String taskId,
    String startedAt, String completedAt
) {}
