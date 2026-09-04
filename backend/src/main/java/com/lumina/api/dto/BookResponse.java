package com.lumina.api.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record BookResponse(
    String id, String title, String author, String coverUrl,
    Integer totalPages, int currentPage, String status,
    Short rating, String review, String genre,
    String startedAt, String finishedAt, List<String> tags,
    int progressPct, String createdAt, String updatedAt
) {}
