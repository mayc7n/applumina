package com.lumina.api.dto;

import lombok.Builder;

@Builder
public record StudySessionResponse(
    String id, String subjectId, String title, String notes,
    int durationMins, Short quality, String sessionDate,
    String startedAt, String endedAt
) {}
