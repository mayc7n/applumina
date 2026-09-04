package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateLabelRequest(
    @NotBlank @Size(max = 50) String name,
    String color, String icon
) {}
