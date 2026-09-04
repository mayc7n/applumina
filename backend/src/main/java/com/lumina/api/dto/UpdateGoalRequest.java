package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record UpdateGoalRequest(
    String title, String description, String icon, String color,
    String status, String period, String endDate,
    Double targetValue, String unit, Boolean isPublic
) {}
