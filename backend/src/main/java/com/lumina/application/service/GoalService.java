package com.lumina.application.service;

import com.lumina.api.dto.*;
import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.goal.entity.*;
import com.lumina.domain.goal.repository.*;
import com.lumina.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class GoalService {
    private final GoalRepository goalRepository;
    private final GoalMilestoneRepository milestoneRepository;
    private final GoalCheckInRepository checkInRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<GoalResponse> findAll(UUID userId, String status) {
        GoalStatus parsedStatus = StringUtils.hasText(status) ? parseEnum(GoalStatus.class, status, "status") : null;
        List<Goal> goals = parsedStatus == null
                ? goalRepository.findByUserIdOrderByCreatedAtDesc(userId)
                : goalRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, parsedStatus);
        return goals.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public GoalDetailResponse findById(UUID userId, UUID goalId) {
        Goal goal = getGoal(userId, goalId);
        return GoalDetailResponse.builder()
            .id(goal.getId().toString()).title(goal.getTitle()).description(goal.getDescription())
            .icon(goal.getIcon()).color(goal.getColor()).status(goal.getStatus().name())
            .period(goal.getPeriod().name()).targetValue(number(goal.getTargetValue()))
            .currentValue(number(goal.getCurrentValue())).unit(goal.getUnit())
            .progressPct(number(goal.getProgressPct()))
            .milestones(milestoneRepository.findByGoalIdOrderByOrderIndexAsc(goalId).stream()
                .map(this::toMilestone).toList())
            .checkIns(checkInRepository.findByGoalIdOrderByCheckedAtDesc(goalId).stream()
                .map(this::toCheckIn).toList())
            .build();
    }

    @Transactional
    public GoalResponse create(UUID userId, CreateGoalRequest request) {
        LocalDate startDate = parseOptionalDate(request.startDate(), LocalDate.now(), "data inicial");
        LocalDate endDate = parseNullableDate(request.endDate(), "data final");
        if (endDate != null && endDate.isBefore(startDate)) {
            throw validation("A data final deve ser posterior à data inicial");
        }
        BigDecimal target = decimal(request.targetValue());
        if (target != null && target.compareTo(BigDecimal.ZERO) <= 0) {
            throw validation("O valor da meta deve ser maior que zero");
        }
        Goal goal = goalRepository.save(Goal.builder()
            .user(userRepository.getReferenceById(userId))
            .title(request.title().trim()).description(trimToNull(request.description()))
            .icon(StringUtils.hasText(request.icon()) ? request.icon().trim() : "target")
            .color(StringUtils.hasText(request.color()) ? request.color().trim() : "#8b5cf6")
            .period(parseEnum(GoalPeriod.class, request.period(), "período"))
            .startDate(startDate).endDate(endDate).targetValue(target)
            .unit(trimToNull(request.unit())).isPublic(Boolean.TRUE.equals(request.isPublic())).build());
        return toResponse(goal);
    }

    @Transactional
    public GoalResponse update(UUID userId, UUID goalId, UpdateGoalRequest request) {
        Goal goal = getGoal(userId, goalId);
        if (request.title() != null) {
            if (!StringUtils.hasText(request.title())) throw validation("O título da meta não pode ficar vazio");
            goal.setTitle(request.title().trim());
        }
        if (request.description() != null) goal.setDescription(trimToNull(request.description()));
        if (request.icon() != null) goal.setIcon(trimToNull(request.icon()));
        if (request.color() != null && StringUtils.hasText(request.color())) goal.setColor(request.color().trim());
        if (request.period() != null) goal.setPeriod(parseEnum(GoalPeriod.class, request.period(), "período"));
        if (request.status() != null) {
            GoalStatus status = parseEnum(GoalStatus.class, request.status(), "status");
            goal.setStatus(status);
            goal.setCompletedAt(status == GoalStatus.COMPLETED ? Instant.now() : null);
        }
        if (request.endDate() != null) goal.setEndDate(parseNullableDate(request.endDate(), "data final"));
        if (request.targetValue() != null) {
            BigDecimal target = decimal(request.targetValue());
            if (target.compareTo(BigDecimal.ZERO) <= 0) throw validation("O valor da meta deve ser maior que zero");
            goal.setTargetValue(target);
        }
        if (request.unit() != null) goal.setUnit(trimToNull(request.unit()));
        if (request.isPublic() != null) goal.setPublic(request.isPublic());
        if (goal.getEndDate() != null && goal.getEndDate().isBefore(goal.getStartDate())) {
            throw validation("A data final deve ser posterior à data inicial");
        }
        goal.updateProgress();
        return toResponse(goal);
    }

    @Transactional
    public void delete(UUID userId, UUID goalId) {
        goalRepository.delete(getGoal(userId, goalId));
    }

    @Transactional
    public GoalCheckInResponse checkIn(UUID userId, UUID goalId, GoalCheckInRequest request) {
        Goal goal = getGoal(userId, goalId);
        BigDecimal value = decimal(request.value());
        if (value.compareTo(BigDecimal.ZERO) < 0) throw validation("O progresso não pode ser negativo");
        GoalCheckIn checkIn = checkInRepository.save(GoalCheckIn.builder()
            .goal(goal).userId(userId).value(value)
            .note(trimToNull(request.note())).mood(trimToNull(request.mood())).build());
        goal.setCurrentValue(value);
        goal.updateProgress();
        return toCheckIn(checkIn);
    }

    @Transactional(readOnly = true)
    public List<GoalMilestoneResponse> milestones(UUID userId, UUID goalId) {
        getGoal(userId, goalId);
        return milestoneRepository.findByGoalIdOrderByOrderIndexAsc(goalId).stream()
            .map(this::toMilestone).toList();
    }

    @Transactional
    public GoalMilestoneResponse createMilestone(UUID userId, UUID goalId, CreateMilestoneRequest request) {
        Goal goal = getGoal(userId, goalId);
        GoalMilestone milestone = milestoneRepository.save(GoalMilestone.builder()
            .goal(goal).title(request.title().trim()).description(trimToNull(request.description()))
            .targetValue(decimal(request.targetValue()))
            .dueDate(parseNullableDate(request.dueDate(), "data do marco"))
            .orderIndex(Math.toIntExact(milestoneRepository.countByGoalId(goalId))).build());
        return toMilestone(milestone);
    }

    private Goal getGoal(UUID userId, UUID goalId) {
        return goalRepository.findByIdAndUserId(goalId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Meta não encontrada"));
    }

    private GoalResponse toResponse(Goal goal) {
        List<GoalMilestoneResponse> milestones = milestoneRepository.findByGoalIdOrderByOrderIndexAsc(goal.getId())
            .stream().map(this::toMilestone).toList();
        return GoalResponse.builder()
            .id(goal.getId().toString()).title(goal.getTitle()).description(goal.getDescription())
            .icon(goal.getIcon()).color(goal.getColor()).status(goal.getStatus().name())
            .period(goal.getPeriod().name()).startDate(string(goal.getStartDate()))
            .endDate(string(goal.getEndDate())).targetValue(number(goal.getTargetValue()))
            .currentValue(number(goal.getCurrentValue())).unit(goal.getUnit())
            .progressPct(number(goal.getProgressPct())).isPublic(goal.isPublic())
            .milestoneCount(milestones.size())
            .completedMilestoneCount((int) milestones.stream().filter(item -> item.completedAt() != null).count())
            .milestones(milestones).completedAt(string(goal.getCompletedAt()))
            .createdAt(string(goal.getCreatedAt())).build();
    }

    private GoalMilestoneResponse toMilestone(GoalMilestone milestone) {
        return GoalMilestoneResponse.builder()
            .id(milestone.getId().toString()).title(milestone.getTitle())
            .description(milestone.getDescription()).targetValue(number(milestone.getTargetValue()))
            .dueDate(string(milestone.getDueDate())).completedAt(string(milestone.getCompletedAt()))
            .orderIndex(milestone.getOrderIndex()).build();
    }

    private GoalCheckInResponse toCheckIn(GoalCheckIn checkIn) {
        return GoalCheckInResponse.builder()
            .id(checkIn.getId().toString()).value(number(checkIn.getValue()))
            .note(checkIn.getNote()).mood(checkIn.getMood())
            .checkedAt(string(checkIn.getCheckedAt())).build();
    }

    private BigDecimal decimal(Double value) {
        return value != null ? BigDecimal.valueOf(value) : null;
    }

    private Double number(BigDecimal value) {
        return value != null ? value.doubleValue() : null;
    }

    private LocalDate parseOptionalDate(String value, LocalDate fallback, String field) {
        return StringUtils.hasText(value) ? parseNullableDate(value, field) : fallback;
    }

    private LocalDate parseNullableDate(String value, String field) {
        if (!StringUtils.hasText(value)) return null;
        try { return LocalDate.parse(value); }
        catch (DateTimeException exception) { throw validation("Valor inválido para " + field); }
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
