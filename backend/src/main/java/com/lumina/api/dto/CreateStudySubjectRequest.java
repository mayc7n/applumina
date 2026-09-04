package com.lumina.api.dto;

import jakarta.validation.constraints.*;

public record CreateStudySubjectRequest(
    @NotBlank @Size(max = 200) String name,
    @Size(max = 500) String description,
    @Size(max = 20) String color,
    @Size(max = 50) String icon,
    @Positive @Max(10_000) Double goalHours
) {}
