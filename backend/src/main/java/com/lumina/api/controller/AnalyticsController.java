package com.lumina.api.controller;

import com.lumina.api.dto.ApiResponse;
import com.lumina.api.dto.DashboardDataDto;
import com.lumina.application.service.DashboardService;
import com.lumina.application.service.AnalyticsService;
import com.lumina.infrastructure.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {
    private final DashboardService dashboardService;
    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public ApiResponse<DashboardDataDto> getDashboard(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.success(dashboardService.getDashboard(principal.getUserId()));
    }

    @GetMapping("/weekly")
    public ApiResponse<com.lumina.api.dto.WeeklyAnalyticsDto> getWeekly(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) java.time.LocalDate from
    ) {
        return ApiResponse.success(analyticsService.weekly(principal.getUserId(), from));
    }
}
