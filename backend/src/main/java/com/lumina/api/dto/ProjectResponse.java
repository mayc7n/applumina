package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Builder
public record ProjectResponse(
    String id, String name, String description,
    String color, String icon, int orderIndex, int taskCount
) {}
