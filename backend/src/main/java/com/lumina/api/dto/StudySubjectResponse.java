package com.lumina.api.dto;

import lombok.Builder;

@Builder
public record StudySubjectResponse(
    String id, String name, String description, String color,
    String icon, Double goalHours, boolean isArchived, String createdAt
) {}
