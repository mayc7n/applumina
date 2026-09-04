package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record UpdateTaskRequest(
    @Size(max = 500) String title,
    @Size(max = 10_000) String description,
    String priority,
    String status,
    String dueDate,
    String dueTime,
    String scheduledFor,
    @Min(0) @Max(10_080) Integer estimatedMins,
    String projectId,
    @Size(max = 50) List<String> labelIds,
    String recurrenceType,
    String reminderAt
) {}
