package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Builder
public record TaskDetailResponse(
    String id, String title, String description, String status,
    String priority, String dueDate, Integer estimatedMins,
    List<TaskResponse> subtasks, String createdAt
) {}
