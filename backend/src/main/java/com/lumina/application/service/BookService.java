package com.lumina.application.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.lumina.api.dto.BookResponse;
import com.lumina.api.dto.BookSearchResultResponse;
import com.lumina.api.dto.CreateBookRequest;
import com.lumina.api.dto.ReadingLogRequest;
import com.lumina.api.dto.UpdateBookRequest;
import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.book.entity.Book;
import com.lumina.domain.book.entity.BookReadingLog;
import com.lumina.domain.book.entity.ReadingStatus;
import com.lumina.domain.book.repository.BookReadingLogRepository;
import com.lumina.domain.book.repository.BookRepository;
import com.lumina.domain.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookService {
    private final BookRepository bookRepository;
    private final BookReadingLogRepository logRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<BookResponse> findAll(UUID userId, String status) {
        List<Book> books = StringUtils.hasText(status)
                ? bookRepository.findByUserIdAndStatusOrderByUpdatedAtDesc(userId, parseStatus(status))
                : bookRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        return books.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public BookResponse findById(UUID userId, UUID bookId) {
        return toResponse(getBook(userId, bookId));
    }

    @Transactional
    public BookResponse create(UUID userId, CreateBookRequest request) {
        validatePages(request.totalPages());
        ReadingStatus status = StringUtils.hasText(request.status()) ? parseStatus(request.status())
                : ReadingStatus.WANT_TO_READ;
        Book book = Book.builder()
                .user(userRepository.getReferenceById(userId)).title(request.title().trim())
                .author(trimToNull(request.author())).coverUrl(trimToNull(request.coverUrl()))
                .totalPages(request.totalPages()).status(status).genre(trimToNull(request.genre()))
                .googleBooksId(trimToNull(request.googleBooksId())).tags(cleanTags(request.tags()))
                .startedAt(isReading(status) ? LocalDate.now() : null).build();
        return toResponse(bookRepository.save(book));
    }

    @Transactional
    public BookResponse update(UUID userId, UUID bookId, UpdateBookRequest request) {
        Book book = getBook(userId, bookId);
        if (request.title() != null) {
            if (!StringUtils.hasText(request.title()))
                throw validation("O título não pode ficar vazio");
            book.setTitle(request.title().trim());
        }
        if (request.author() != null)
            book.setAuthor(trimToNull(request.author()));
        if (request.coverUrl() != null)
            book.setCoverUrl(trimToNull(request.coverUrl()));
        if (request.totalPages() != null) {
            validatePages(request.totalPages());
            book.setTotalPages(request.totalPages());
        }
        if (request.currentPage() != null)
            setCurrentPage(book, request.currentPage());
        if (request.status() != null)
            applyStatus(book, parseStatus(request.status()));
        if (request.rating() != null) {
            if (request.rating() < 1 || request.rating() > 5)
                throw validation("A avaliação deve estar entre 1 e 5");
            book.setRating(request.rating());
        }
        if (request.review() != null)
            book.setReview(trimToNull(request.review()));
        if (request.genre() != null)
            book.setGenre(trimToNull(request.genre()));
        if (request.tags() != null)
            book.setTags(cleanTags(request.tags()));
        return toResponse(book);
    }

    @Transactional
    public void delete(UUID userId, UUID bookId) {
        bookRepository.delete(getBook(userId, bookId));
    }

    @Transactional
    public BookResponse logReading(UUID userId, UUID bookId, ReadingLogRequest request) {
        Book book = getBook(userId, bookId);
        if (request.durationMins() != null && request.durationMins() > 1440) {
            throw validation("A duração da leitura é inválida");
        }
        logRepository.save(BookReadingLog.builder()
                .book(book).userId(userId).pagesRead(request.pagesRead())
                .durationMins(request.durationMins()).note(trimToNull(request.note())).build());
        setCurrentPage(book, book.getCurrentPage() + request.pagesRead());
        if (book.getStatus() == ReadingStatus.WANT_TO_READ)
            applyStatus(book, ReadingStatus.READING);
        if (book.getTotalPages() != null && book.getCurrentPage() >= book.getTotalPages()) {
            applyStatus(book, ReadingStatus.COMPLETED);
        }
        return toResponse(book);
    }

    public List<BookSearchResultResponse> search(String query) {
        if (!StringUtils.hasText(query) || query.trim().length() < 2)
            return List.of();
        try {
            JsonNode root = RestClient.create("https://www.googleapis.com")
                    .get().uri(uriBuilder -> uriBuilder.path("/books/v1/volumes")
                            .queryParam("q", query.trim()).queryParam("maxResults", 10)
                            .queryParam("langRestrict", "pt").build())
                    .retrieve().body(JsonNode.class);
            if (root == null || !root.path("items").isArray())
                return List.of();
            List<BookSearchResultResponse> results = new ArrayList<>();
            root.path("items").forEach(item -> {
                JsonNode volume = item.path("volumeInfo");
                String author = volume.path("authors").isArray() && !volume.path("authors").isEmpty()
                        ? volume.path("authors").get(0).asText()
                        : null;
                String genre = volume.path("categories").isArray() && !volume.path("categories").isEmpty()
                        ? volume.path("categories").get(0).asText()
                        : null;
                results.add(new BookSearchResultResponse(
                        item.path("id").asText(), volume.path("title").asText(),
                        author, text(volume.path("imageLinks").path("thumbnail")),
                        volume.path("pageCount").isInt() ? volume.path("pageCount").asInt() : null, genre));
            });
            return results;
        } catch (RuntimeException exception) {
            return List.of();
        }
    }

    private Book getBook(UUID userId, UUID bookId) {
        return bookRepository.findByIdAndUserId(bookId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Livro não encontrado"));
    }

    private void applyStatus(Book book, ReadingStatus status) {
        book.setStatus(status);
        if (isReading(status) && book.getStartedAt() == null)
            book.setStartedAt(LocalDate.now());
        if (status == ReadingStatus.COMPLETED) {
            book.setFinishedAt(LocalDate.now());
            if (book.getTotalPages() != null)
                book.setCurrentPage(book.getTotalPages());
        } else {
            book.setFinishedAt(null);
        }
    }

    private boolean isReading(ReadingStatus status) {
        return status == ReadingStatus.READING || status == ReadingStatus.REREADING;
    }

    private void setCurrentPage(Book book, int page) {
        if (page < 0)
            throw validation("A página atual não pode ser negativa");
        book.setCurrentPage(book.getTotalPages() != null ? Math.min(page, book.getTotalPages()) : page);
    }

    private void validatePages(Integer pages) {
        if (pages != null && pages < 1)
            throw validation("O total de páginas deve ser maior que zero");
    }

    private ReadingStatus parseStatus(String value) {
        try {
            return ReadingStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            throw validation("Status de leitura inválido");
        }
    }

    private BookResponse toResponse(Book book) {
        return BookResponse.builder()
                .id(book.getId().toString()).title(book.getTitle()).author(book.getAuthor())
                .coverUrl(book.getCoverUrl()).totalPages(book.getTotalPages()).currentPage(book.getCurrentPage())
                .status(book.getStatus().name()).rating(book.getRating()).review(book.getReview())
                .genre(book.getGenre()).startedAt(string(book.getStartedAt())).finishedAt(string(book.getFinishedAt()))
                .tags(book.getTags()).progressPct(book.getProgressPct())
                .createdAt(string(book.getCreatedAt())).updatedAt(string(book.getUpdatedAt())).build();
    }

    private List<String> cleanTags(List<String> tags) {
        if (tags == null)
            return List.of();
        return tags.stream().filter(StringUtils::hasText).map(String::trim).distinct().limit(20).toList();
    }

    private String text(JsonNode node) {
        return node.isTextual() ? node.asText().replace("http://", "https://") : null;
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private BusinessException validation(String message) {
        return new BusinessException("VALIDATION_ERROR", message, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    private String string(Object value) {
        return value != null ? value.toString() : null;
    }
}
