package com.lumina.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record UpdateJournalRequest(
    String title, String content, String mood, String energy,
    List<String> tags
) {}
