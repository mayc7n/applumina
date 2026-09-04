package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Builder
public record TaskResponse(
    String id, String title, String description, String status,
    String priority, String dueDate, String dueTime, String scheduledFor,
    Integer estimatedMins, Integer actualMins, String projectId,
    String recurrenceType, String completedAt, String createdAt, String updatedAt
) {}
