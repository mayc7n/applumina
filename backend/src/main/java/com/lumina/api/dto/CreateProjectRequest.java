package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateProjectRequest(
    @NotBlank @Size(max = 100) String name,
    @Size(max = 500) String description,
    @Size(max = 20) String color,
    @Size(max = 50) String icon
) {}
