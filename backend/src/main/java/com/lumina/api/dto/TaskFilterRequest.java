package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record TaskFilterRequest(
    String status, String priority, UUID projectId,
    LocalDate dueDateFrom, LocalDate dueDateTo,
    String search, List<UUID> labelIds
) {
    public static TaskFilterRequest empty() {
        return new TaskFilterRequest(null, null, null, null, null, null, null);
    }
}
