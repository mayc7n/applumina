package com.lumina.api.dto;

import jakarta.validation.constraints.*;

import java.util.List;

public record CreateBookRequest(
    @NotBlank @Size(max = 300) String title,
    @Size(max = 300) String author,
    @Size(max = 500) String coverUrl,
    @Positive @Max(100_000) Integer totalPages,
    @Size(max = 30) String status,
    @Size(max = 100) String genre,
    @Size(max = 50) String googleBooksId,
    @Size(max = 50) List<@Size(max = 50) String> tags
) {}
