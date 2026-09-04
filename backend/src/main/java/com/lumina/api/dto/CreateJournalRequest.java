package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateJournalRequest(
    @Size(max = 300) String title,
    @NotBlank @Size(max = 100_000) String content,
    String mood, String energy,
    @Size(max = 50) List<@Size(max = 50) String> tags, String entryDate
) {}
