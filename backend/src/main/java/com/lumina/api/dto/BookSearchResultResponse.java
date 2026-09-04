package com.lumina.api.dto;

public record BookSearchResultResponse(
    String googleBooksId, String title, String author,
    String coverUrl, Integer totalPages, String genre
) {}
