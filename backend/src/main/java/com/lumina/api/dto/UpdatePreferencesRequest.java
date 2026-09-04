package com.lumina.api.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Map;

public record UpdatePreferencesRequest(
    @Pattern(regexp = "^(light|dark|system)$") String theme,
    @Size(max = 20) String accentColor,
    @Min(0) @Max(6) Short weekStartsOn,
    @DecimalMin("0.5") @DecimalMax("24.0") BigDecimal dailyGoalHours,
    @Size(max = 50) Map<String, Boolean> notificationSettings,
    @Size(max = 50) Map<String, Object> focusSettings,
    @Size(max = 50) Map<String, Object> privacySettings,
    @Size(max = 50) Map<String, Object> dashboardLayout
) {}
