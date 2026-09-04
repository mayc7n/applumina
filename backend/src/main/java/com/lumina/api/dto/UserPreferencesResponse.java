package com.lumina.api.dto;

import java.math.BigDecimal;
import java.util.Map;

public record UserPreferencesResponse(
    String theme, String accentColor, short weekStartsOn, BigDecimal dailyGoalHours,
    Map<String, Boolean> notificationSettings, Map<String, Object> focusSettings,
    Map<String, Object> privacySettings, Map<String, Object> dashboardLayout
) {}
