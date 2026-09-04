package com.lumina.api.controller;

import com.lumina.api.dto.*;
import com.lumina.application.service.BookService;
import com.lumina.infrastructure.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/books")
@RequiredArgsConstructor
public class BookController {
    private final BookService bookService;

    @GetMapping
    public ApiResponse<List<BookResponse>> findAll(
        @AuthenticationPrincipal UserPrincipal principal, @RequestParam(required = false) String status
    ) {
        return ApiResponse.success(bookService.findAll(principal.getUserId(), status));
    }

    @GetMapping("/search")
    public ApiResponse<List<BookSearchResultResponse>> search(@RequestParam String query) {
        return ApiResponse.success(bookService.search(query));
    }

    @GetMapping("/{bookId}")
    public ApiResponse<BookResponse> findById(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID bookId
    ) {
        return ApiResponse.success(bookService.findById(principal.getUserId(), bookId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BookResponse> create(
        @AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody CreateBookRequest request
    ) {
        return ApiResponse.success(bookService.create(principal.getUserId(), request));
    }

    @PutMapping("/{bookId}")
    public ApiResponse<BookResponse> update(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID bookId,
        @Valid @RequestBody UpdateBookRequest request
    ) {
        return ApiResponse.success(bookService.update(principal.getUserId(), bookId, request));
    }

    @PostMapping("/{bookId}/log")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BookResponse> logReading(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID bookId,
        @Valid @RequestBody ReadingLogRequest request
    ) {
        return ApiResponse.success(bookService.logReading(principal.getUserId(), bookId, request));
    }

    @DeleteMapping("/{bookId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID bookId) {
        bookService.delete(principal.getUserId(), bookId);
    }
}
