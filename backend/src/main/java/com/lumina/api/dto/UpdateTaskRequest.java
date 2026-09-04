package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record UpdateTaskRequest(
    String title, String description, String priority, String status,
    String dueDate, String scheduledFor, Integer estimatedMins,
    String projectId, List<String> labelIds
) {}
