package com.lumina.application.service;

import com.lumina.api.dto.*;
import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.journal.entity.*;
import com.lumina.domain.journal.repository.JournalRepository;
import com.lumina.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class JournalService {
    private final JournalRepository journalRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<JournalEntryResponse> findAll(UUID userId, String search) {
        String normalized = StringUtils.hasText(search) ? search.trim().toLowerCase(Locale.ROOT) : null;
        return journalRepository.findByUserIdOrderByPinnedDescDateDesc(userId).stream()
            .filter(entry -> normalized == null
                || contains(entry.getTitle(), normalized)
                || contains(entry.getContent(), normalized)
                || entry.getTags().stream().anyMatch(tag -> contains(tag, normalized)))
            .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public JournalEntryResponse findById(UUID userId, UUID entryId) {
        return toResponse(getEntry(userId, entryId));
    }

    @Transactional
    public JournalEntryResponse create(UUID userId, CreateJournalRequest request) {
        JournalEntry entry = JournalEntry.builder()
            .user(userRepository.getReferenceById(userId))
            .title(trimToNull(request.title())).content(request.content().trim())
            .mood(parseOptionalEnum(MoodType.class, request.mood(), "humor"))
            .energy(parseOptionalEnum(EnergyLevel.class, request.energy(), "energia"))
            .tags(cleanTags(request.tags()))
            .entryDate(parseOptionalDate(request.entryDate(), LocalDate.now(), "data da entrada"))
            .build();
        entry.computeWordCount();
        return toResponse(journalRepository.save(entry));
    }

    @Transactional
    public JournalEntryResponse update(UUID userId, UUID entryId, UpdateJournalRequest request) {
        JournalEntry entry = getEntry(userId, entryId);
        if (request.title() != null) entry.setTitle(trimToNull(request.title()));
        if (request.content() != null) {
            if (!StringUtils.hasText(request.content())) throw validation("O conteúdo não pode ficar vazio");
            entry.setContent(request.content().trim());
            entry.computeWordCount();
        }
        if (request.mood() != null) entry.setMood(parseOptionalEnum(MoodType.class, request.mood(), "humor"));
        if (request.energy() != null) entry.setEnergy(parseOptionalEnum(EnergyLevel.class, request.energy(), "energia"));
        if (request.tags() != null) entry.setTags(cleanTags(request.tags()));
        return toResponse(entry);
    }

    @Transactional
    public void delete(UUID userId, UUID entryId) {
        journalRepository.delete(getEntry(userId, entryId));
    }

    @Transactional
    public JournalEntryResponse togglePin(UUID userId, UUID entryId) {
        JournalEntry entry = getEntry(userId, entryId);
        entry.setPinned(!entry.isPinned());
        return toResponse(entry);
    }

    private JournalEntry getEntry(UUID userId, UUID entryId) {
        return journalRepository.findByIdAndUserId(entryId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Entrada do diário não encontrada"));
    }

    private JournalEntryResponse toResponse(JournalEntry entry) {
        return JournalEntryResponse.builder()
            .id(entry.getId().toString()).title(entry.getTitle()).content(entry.getContent())
            .mood(entry.getMood() != null ? entry.getMood().name() : null)
            .energy(entry.getEnergy() != null ? entry.getEnergy().name() : null)
            .wordCount(entry.getWordCount()).isPinned(entry.isPinned())
            .entryDate(string(entry.getEntryDate())).tags(entry.getTags())
            .createdAt(string(entry.getCreatedAt())).updatedAt(string(entry.getUpdatedAt())).build();
    }

    private boolean contains(String value, String search) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(search);
    }

    private List<String> cleanTags(List<String> tags) {
        if (tags == null) return List.of();
        return tags.stream().filter(StringUtils::hasText).map(String::trim)
            .map(tag -> tag.toLowerCase(Locale.ROOT)).distinct().limit(20).toList();
    }

    private LocalDate parseOptionalDate(String value, LocalDate fallback, String field) {
        if (!StringUtils.hasText(value)) return fallback;
        try { return LocalDate.parse(value); }
        catch (DateTimeException exception) { throw validation("Valor inválido para " + field); }
    }

    private <E extends Enum<E>> E parseOptionalEnum(Class<E> type, String value, String field) {
        if (!StringUtils.hasText(value)) return null;
        try { return Enum.valueOf(type, value.trim().toUpperCase(Locale.ROOT)); }
        catch (IllegalArgumentException exception) { throw validation("Valor inválido para " + field); }
    }

    private BusinessException validation(String message) {
        return new BusinessException("VALIDATION_ERROR", message, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String string(Object value) {
        return value != null ? value.toString() : null;
    }
}
