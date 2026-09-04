package com.lumina.application.service;

import com.lumina.api.dto.*;
import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.api.middleware.GlobalExceptionHandler.ConflictException;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.focus.entity.*;
import com.lumina.domain.focus.repository.*;
import com.lumina.domain.task.repository.TaskRepository;
import com.lumina.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FocusService {
    private final FocusSessionRepository sessionRepository;
    private final FocusStatisticsRepository statisticsRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    @Transactional
    public FocusSessionResponse start(UUID userId, StartFocusSessionRequest request) {
        if (sessionRepository.findActiveByUserId(userId).isPresent()) {
            throw new ConflictException("Já existe uma sessão de foco ativa");
        }
        if (request.plannedMins() < 1 || request.plannedMins() > 720) {
            throw validation("A sessão deve durar entre 1 e 720 minutos");
        }
        UUID taskId = parseUuid(request.taskId());
        if (taskId != null && taskRepository.findByIdAndUserIdAndDeletedAtIsNull(taskId, userId).isEmpty()) {
            throw new ResourceNotFoundException("Tarefa não encontrada");
        }
        FocusSession session = sessionRepository.save(FocusSession.builder()
            .user(userRepository.getReferenceById(userId))
            .mode(parseEnum(FocusMode.class, request.mode(), "modo"))
            .taskId(taskId).plannedMins(request.plannedMins()).build());
        return toResponse(session);
    }

    @Transactional
    public FocusSessionResponse complete(UUID userId, UUID sessionId, CompleteFocusSessionRequest request) {
        FocusSession session = getActiveSession(userId, sessionId);
        Instant completedAt = Instant.now();
        int elapsed = Math.toIntExact(Math.max(1, ChronoUnit.MINUTES.between(session.getStartedAt(), completedAt)));
        session.setActualMins(Math.min(elapsed, 720));
        session.setCompletedAt(completedAt);
        session.setStatus(SessionStatus.COMPLETED);
        if (request != null) {
            session.setNotes(trimToNull(request.notes()));
            if (request.focusScore() != null) {
                if (request.focusScore() < 0 || request.focusScore() > 10) {
                    throw validation("A nota de foco deve estar entre 0 e 10");
                }
                session.setFocusScore(BigDecimal.valueOf(request.focusScore()));
            }
        }
        sessionRepository.flush();
        refreshStatistics(userId);
        return toResponse(session);
    }

    @Transactional
    public void abandon(UUID userId, UUID sessionId) {
        FocusSession session = getActiveSession(userId, sessionId);
        session.setActualMins(Math.toIntExact(Math.max(0,
            ChronoUnit.MINUTES.between(session.getStartedAt(), Instant.now()))));
        session.setCompletedAt(Instant.now());
        session.setStatus(SessionStatus.ABANDONED);
    }

    @Transactional(readOnly = true)
    public List<FocusSessionResponse> history(UUID userId, LocalDate from, LocalDate to) {
        LocalDate safeTo = to != null ? to : LocalDate.now();
        LocalDate safeFrom = from != null ? from : safeTo.minusDays(29);
        if (safeFrom.isAfter(safeTo)) throw validation("O período de consulta é inválido");
        ZoneId zone = ZoneId.systemDefault();
        return sessionRepository.findByUserIdAndPeriod(
                userId, safeFrom.atStartOfDay(zone).toInstant(),
                safeTo.plusDays(1).atStartOfDay(zone).toInstant())
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public FocusStatsResponse stats(UUID userId) {
        FocusStatistics stats = statisticsRepository.findByUserId(userId).orElseGet(FocusStatistics::new);
        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(today.getDayOfWeek().getValue() - 1L);
        int weekly = sessionRepository.sumFocusMinsByUserAndPeriod(
            userId, weekStart.atStartOfDay(zone).toInstant(),
            today.plusDays(1).atStartOfDay(zone).toInstant());
        return FocusStatsResponse.builder()
            .totalSessions(stats.getTotalSessions()).totalFocusMins(stats.getTotalFocusMins())
            .avgSessionMins(stats.getAvgSessionMins()).avgFocusScore(stats.getAvgFocusScore())
            .longestStreakDays(stats.getLongestStreakDays()).currentStreakDays(stats.getCurrentStreakDays())
            .weeklyMins(weekly).build();
    }

    private void refreshStatistics(UUID userId) {
        List<FocusSession> completed = sessionRepository.findByUserIdAndPeriod(
                userId, Instant.EPOCH, Instant.now().plusSeconds(1))
            .stream().filter(session -> session.getStatus() == SessionStatus.COMPLETED).toList();
        int totalMinutes = completed.stream().mapToInt(FocusSession::getActualMins).sum();
        BigDecimal averageMinutes = completed.isEmpty() ? BigDecimal.ZERO
            : BigDecimal.valueOf(totalMinutes).divide(BigDecimal.valueOf(completed.size()), 1, RoundingMode.HALF_UP);
        List<BigDecimal> scores = completed.stream().map(FocusSession::getFocusScore).filter(Objects::nonNull).toList();
        BigDecimal averageScore = scores.isEmpty() ? BigDecimal.ZERO
            : scores.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(scores.size()), 1, RoundingMode.HALF_UP);

        Set<LocalDate> dates = new TreeSet<>();
        ZoneId zone = ZoneId.systemDefault();
        completed.forEach(session -> dates.add(session.getStartedAt().atZone(zone).toLocalDate()));
        int longest = 0;
        int run = 0;
        LocalDate previous = null;
        for (LocalDate date : dates) {
            run = previous != null && date.equals(previous.plusDays(1)) ? run + 1 : 1;
            longest = Math.max(longest, run);
            previous = date;
        }
        int current = 0;
        LocalDate cursor = LocalDate.now();
        if (!dates.contains(cursor)) cursor = cursor.minusDays(1);
        while (dates.contains(cursor)) {
            current++;
            cursor = cursor.minusDays(1);
        }

        FocusStatistics stats = statisticsRepository.findByUserId(userId)
            .orElseGet(() -> FocusStatistics.builder().userId(userId).build());
        stats.setTotalSessions(completed.size());
        stats.setTotalFocusMins(totalMinutes);
        stats.setAvgSessionMins(averageMinutes);
        stats.setAvgFocusScore(averageScore);
        stats.setLongestStreakDays(longest);
        stats.setCurrentStreakDays(current);
        statisticsRepository.save(stats);
    }

    private FocusSession getActiveSession(UUID userId, UUID sessionId) {
        FocusSession session = sessionRepository.findByIdAndUserId(sessionId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Sessão de foco não encontrada"));
        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new ConflictException("Esta sessão de foco já foi encerrada");
        }
        return session;
    }

    private FocusSessionResponse toResponse(FocusSession session) {
        return FocusSessionResponse.builder()
            .id(session.getId().toString()).mode(session.getMode().name()).status(session.getStatus().name())
            .plannedMins(session.getPlannedMins()).actualMins(session.getActualMins())
            .breaksTaken(session.getBreaksTaken())
            .focusScore(session.getFocusScore() != null ? session.getFocusScore().doubleValue() : null)
            .notes(session.getNotes()).taskId(session.getTaskId() != null ? session.getTaskId().toString() : null)
            .startedAt(string(session.getStartedAt())).completedAt(string(session.getCompletedAt())).build();
    }

    private UUID parseUuid(String value) {
        if (!StringUtils.hasText(value)) return null;
        try { return UUID.fromString(value); }
        catch (IllegalArgumentException exception) { throw validation("Tarefa inválida"); }
    }

    private <E extends Enum<E>> E parseEnum(Class<E> type, String value, String field) {
        try { return Enum.valueOf(type, value.trim().toUpperCase(Locale.ROOT)); }
        catch (RuntimeException exception) { throw validation("Valor inválido para " + field); }
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
