package com.lumina.application.service;

import com.lumina.api.dto.*;
import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.api.middleware.GlobalExceptionHandler.ConflictException;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.study.entity.*;
import com.lumina.domain.study.repository.*;
import com.lumina.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StudyService {
    private final StudySubjectRepository subjectRepository;
    private final StudySessionRepository sessionRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<StudySubjectResponse> subjects(UUID userId) {
        return subjectRepository.findByUserIdAndArchivedFalseOrderByCreatedAtAsc(userId)
            .stream().map(this::toSubject).toList();
    }

    @Transactional
    public StudySubjectResponse createSubject(UUID userId, CreateStudySubjectRequest request) {
        BigDecimal goalHours = request.goalHours() != null ? BigDecimal.valueOf(request.goalHours()) : null;
        if (goalHours != null && goalHours.compareTo(BigDecimal.ZERO) <= 0) {
            throw validation("A meta de horas deve ser maior que zero");
        }
        StudySubject subject = subjectRepository.save(StudySubject.builder()
            .user(userRepository.getReferenceById(userId)).name(request.name().trim())
            .description(trimToNull(request.description()))
            .color(StringUtils.hasText(request.color()) ? request.color().trim() : "#6366f1")
            .icon(StringUtils.hasText(request.icon()) ? request.icon().trim() : "graduation-cap")
            .goalHours(goalHours).build());
        return toSubject(subject);
    }

    @Transactional(readOnly = true)
    public List<StudySessionResponse> sessions(UUID userId) {
        return sessionRepository.findByUserIdOrderByStartedAtDesc(userId).stream()
            .map(this::toSession).toList();
    }

    @Transactional
    public StudySessionResponse createSession(UUID userId, CreateStudySessionRequest request) {
        StudySubject subject = getOptionalSubject(userId, request.subjectId());
        Integer duration = request.durationMins();
        if (duration != null && (duration < 1 || duration > 1440)) {
            throw validation("A duração deve estar entre 1 e 1440 minutos");
        }
        if (duration == null && sessionRepository.findFirstByUserIdAndEndedAtIsNullOrderByStartedAtDesc(userId).isPresent()) {
            throw new ConflictException("Já existe uma sessão de estudo ativa");
        }
        Instant startedAt = Instant.now();
        StudySession session = sessionRepository.save(StudySession.builder()
            .user(userRepository.getReferenceById(userId)).subject(subject)
            .title(trimToNull(request.title())).notes(trimToNull(request.notes()))
            .durationMins(duration != null ? duration : 0).quality(validateQuality(request.quality()))
            .startedAt(startedAt).endedAt(duration != null ? startedAt.plus(duration, ChronoUnit.MINUTES) : null)
            .build());
        return toSession(session);
    }

    @Transactional
    public StudySessionResponse endSession(UUID userId, UUID sessionId, Short quality, String notes) {
        StudySession session = sessionRepository.findByIdAndUserId(sessionId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Sessão de estudo não encontrada"));
        if (session.getEndedAt() != null) throw new ConflictException("Esta sessão já foi encerrada");
        session.setEndedAt(Instant.now());
        session.setDurationMins(Math.toIntExact(Math.max(1,
            ChronoUnit.MINUTES.between(session.getStartedAt(), session.getEndedAt()))));
        if (quality != null) session.setQuality(validateQuality(quality));
        if (notes != null) session.setNotes(trimToNull(notes));
        return toSession(session);
    }

    private StudySubject getOptionalSubject(UUID userId, String subjectId) {
        if (!StringUtils.hasText(subjectId)) return null;
        try {
            return subjectRepository.findByIdAndUserIdAndArchivedFalse(UUID.fromString(subjectId), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Matéria não encontrada"));
        } catch (IllegalArgumentException exception) {
            throw validation("Matéria inválida");
        }
    }

    private Short validateQuality(Short quality) {
        if (quality != null && (quality < 1 || quality > 5)) {
            throw validation("A qualidade deve estar entre 1 e 5");
        }
        return quality;
    }

    private StudySubjectResponse toSubject(StudySubject subject) {
        return StudySubjectResponse.builder()
            .id(subject.getId().toString()).name(subject.getName()).description(subject.getDescription())
            .color(subject.getColor()).icon(subject.getIcon())
            .goalHours(subject.getGoalHours() != null ? subject.getGoalHours().doubleValue() : null)
            .isArchived(subject.isArchived()).createdAt(string(subject.getCreatedAt())).build();
    }

    private StudySessionResponse toSession(StudySession session) {
        return StudySessionResponse.builder()
            .id(session.getId().toString())
            .subjectId(session.getSubject() != null ? session.getSubject().getId().toString() : null)
            .title(session.getTitle()).notes(session.getNotes()).durationMins(session.getDurationMins())
            .quality(session.getQuality()).sessionDate(string(session.getSessionDate()))
            .startedAt(string(session.getStartedAt())).endedAt(string(session.getEndedAt())).build();
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
