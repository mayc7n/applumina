package com.lumina.api.dto;

import java.util.List;

public record UpdateBookRequest(
    String title, String author, String coverUrl,
    Integer totalPages, Integer currentPage, String status,
    Short rating, String review, String genre, List<String> tags
) {}
