package com.lumina.application.service;

import com.lumina.api.dto.*;
import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.api.middleware.GlobalExceptionHandler.ConflictException;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.task.entity.*;
import com.lumina.domain.task.repository.*;
import com.lumina.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;
    private final TaskProjectRepository projectRepository;
    private final LabelRepository labelRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<TaskResponse> findAll(UUID userId, TaskFilterRequest filter, Pageable pageable) {
        Specification<Task> specification = (root, query, cb) ->
            cb.equal(root.get("user").get("id"), userId);
        specification = specification.and((root, query, cb) -> cb.isNull(root.get("deletedAt")));

        if (StringUtils.hasText(filter.status())) {
            TaskStatus status = parseEnum(TaskStatus.class, filter.status(), "status");
            specification = specification.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (StringUtils.hasText(filter.priority())) {
            TaskPriority priority = parseEnum(TaskPriority.class, filter.priority(), "prioridade");
            specification = specification.and((root, query, cb) -> cb.equal(root.get("priority"), priority));
        }
        if (filter.projectId() != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("projectId"), filter.projectId()));
        }
        if (filter.dueDateFrom() != null) {
            specification = specification.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("dueDate"), filter.dueDateFrom()));
        }
        if (filter.dueDateTo() != null) {
            specification = specification.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("dueDate"), filter.dueDateTo()));
        }
        if (StringUtils.hasText(filter.search())) {
            String search = "%" + filter.search().trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), search),
                cb.like(cb.lower(root.get("description")), search)
            ));
        }

        Pageable effectivePageable = PageRequest.of(
            pageable.getPageNumber(),
            Math.min(pageable.getPageSize(), 100),
            pageable.getSort().isSorted() ? pageable.getSort() : Sort.by(Sort.Direction.DESC, "createdAt")
        );
        return taskRepository.findAll(specification, effectivePageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> findToday(UUID userId) {
        return mapTasks(taskRepository.findTodayTasks(userId, LocalDate.now()));
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> findUpcoming(UUID userId, int days) {
        int safeDays = Math.max(1, Math.min(days, 90));
        LocalDate today = LocalDate.now();
        return mapTasks(taskRepository.findUpcomingTasks(userId, today, today.plusDays(safeDays)));
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> findOverdue(UUID userId) {
        return mapTasks(taskRepository.findOverdueTasks(userId, LocalDate.now()));
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> findInbox(UUID userId) {
        return mapTasks(taskRepository.findInboxTasks(userId));
    }

    @Transactional(readOnly = true)
    public TaskResponse findById(UUID userId, UUID taskId) {
        return toResponse(getTask(userId, taskId));
    }

    @Transactional
    public TaskResponse create(UUID userId, CreateTaskRequest request) {
        validateProject(userId, request.projectId());
        Task task = Task.builder()
            .user(userRepository.getReferenceById(userId))
            .title(request.title().trim())
            .description(trimToNull(request.description()))
            .priority(parseOptionalEnum(TaskPriority.class, request.priority(), TaskPriority.NONE, "prioridade"))
            .dueDate(parseDate(request.dueDate(), "data de vencimento"))
            .scheduledFor(parseDate(request.scheduledFor(), "data agendada"))
            .estimatedMins(validateMinutes(request.estimatedMins()))
            .projectId(parseUuid(request.projectId(), "projeto"))
            .inbox(request.projectId() == null)
            .build();
        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse update(UUID userId, UUID taskId, UpdateTaskRequest request) {
        Task task = getTask(userId, taskId);
        if (request.title() != null) {
            if (!StringUtils.hasText(request.title())) throw validation("O título não pode ficar vazio");
            task.setTitle(request.title().trim());
        }
        if (request.description() != null) task.setDescription(trimToNull(request.description()));
        if (request.priority() != null) task.setPriority(parseEnum(TaskPriority.class, request.priority(), "prioridade"));
        if (request.status() != null) applyStatus(task, parseEnum(TaskStatus.class, request.status(), "status"));
        if (request.dueDate() != null) task.setDueDate(parseDate(request.dueDate(), "data de vencimento"));
        if (request.scheduledFor() != null) task.setScheduledFor(parseDate(request.scheduledFor(), "data agendada"));
        if (request.estimatedMins() != null) task.setEstimatedMins(validateMinutes(request.estimatedMins()));
        if (request.projectId() != null) {
            validateProject(userId, request.projectId());
            task.setProjectId(parseUuid(request.projectId(), "projeto"));
            task.setInbox(false);
        }
        return toResponse(task);
    }

    @Transactional
    public TaskResponse toggleComplete(UUID userId, UUID taskId) {
        Task task = getTask(userId, taskId);
        applyStatus(task, task.isCompleted() ? TaskStatus.TODO : TaskStatus.DONE);
        return toResponse(task);
    }

    @Transactional
    public void delete(UUID userId, UUID taskId) {
        Task task = getTask(userId, taskId);
        task.setDeletedAt(Instant.now());
        task.setStatus(TaskStatus.DELETED);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjects(UUID userId) {
        return projectRepository.findByUserIdOrderByOrderIndexAsc(userId).stream()
            .filter(project -> project.getArchivedAt() == null)
            .map(project -> ProjectResponse.builder()
                .id(project.getId().toString())
                .name(project.getName())
                .description(project.getDescription())
                .color(project.getColor())
                .icon(project.getIcon())
                .orderIndex(project.getOrderIndex())
                .taskCount(Math.toIntExact(taskRepository.countByProjectIdAndDeletedAtIsNull(project.getId())))
                .build())
            .toList();
    }

    @Transactional
    public ProjectResponse createProject(UUID userId, CreateProjectRequest request) {
        String name = request.name().trim();
        if (projectRepository.existsByNameAndUserId(name, userId)) {
            throw new ConflictException("Já existe um projeto com este nome");
        }
        int order = Math.toIntExact(projectRepository.countByUserId(userId));
        TaskProject project = projectRepository.save(TaskProject.builder()
            .user(userRepository.getReferenceById(userId))
            .name(name)
            .description(trimToNull(request.description()))
            .color(StringUtils.hasText(request.color()) ? request.color() : "#6366f1")
            .icon(trimToNull(request.icon()))
            .orderIndex(order)
            .build());
        return ProjectResponse.builder()
            .id(project.getId().toString()).name(project.getName())
            .description(project.getDescription()).color(project.getColor())
            .icon(project.getIcon()).orderIndex(project.getOrderIndex()).taskCount(0)
            .build();
    }

    @Transactional(readOnly = true)
    public List<LabelResponse> getLabels(UUID userId) {
        return labelRepository.findByUserId(userId).stream()
            .map(label -> new LabelResponse(label.getId().toString(), label.getName(), label.getColor(), label.getIcon()))
            .toList();
    }

    @Transactional
    public LabelResponse createLabel(UUID userId, CreateLabelRequest request) {
        String name = request.name().trim();
        if (labelRepository.existsByNameAndUserId(name, userId)) {
            throw new ConflictException("Já existe uma etiqueta com este nome");
        }
        Label label = labelRepository.save(Label.builder()
            .user(userRepository.getReferenceById(userId))
            .name(name)
            .color(StringUtils.hasText(request.color()) ? request.color() : "#6366f1")
            .icon(trimToNull(request.icon()))
            .build());
        return new LabelResponse(label.getId().toString(), label.getName(), label.getColor(), label.getIcon());
    }

    private Task getTask(UUID userId, UUID taskId) {
        return taskRepository.findByIdAndUserIdAndDeletedAtIsNull(taskId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada"));
    }

    private void validateProject(UUID userId, String projectId) {
        if (!StringUtils.hasText(projectId)) return;
        UUID id = parseUuid(projectId, "projeto");
        projectRepository.findByIdAndUserId(id, userId)
            .filter(project -> project.getArchivedAt() == null)
            .orElseThrow(() -> new ResourceNotFoundException("Projeto não encontrado"));
    }

    private void applyStatus(Task task, TaskStatus status) {
        task.setStatus(status);
        task.setCompletedAt(status == TaskStatus.DONE ? Instant.now() : null);
    }

    private List<TaskResponse> mapTasks(List<Task> tasks) {
        return tasks.stream().map(this::toResponse).toList();
    }

    private TaskResponse toResponse(Task task) {
        return TaskResponse.builder()
            .id(task.getId().toString()).title(task.getTitle()).description(task.getDescription())
            .status(task.getStatus().name()).priority(task.getPriority().name())
            .dueDate(string(task.getDueDate())).scheduledFor(string(task.getScheduledFor()))
            .estimatedMins(task.getEstimatedMins())
            .projectId(task.getProjectId() != null ? task.getProjectId().toString() : null)
            .recurrenceType(task.getRecurrenceType().name())
            .completedAt(string(task.getCompletedAt()))
            .createdAt(string(task.getCreatedAt())).updatedAt(string(task.getUpdatedAt()))
            .build();
    }

    private Integer validateMinutes(Integer minutes) {
        if (minutes == null) return null;
        if (minutes < 1 || minutes > 10080) throw validation("A duração estimada deve estar entre 1 e 10080 minutos");
        return minutes;
    }

    private LocalDate parseDate(String value, String field) {
        if (!StringUtils.hasText(value)) return null;
        try { return LocalDate.parse(value); }
        catch (DateTimeException exception) { throw validation("Valor inválido para " + field); }
    }

    private UUID parseUuid(String value, String field) {
        if (!StringUtils.hasText(value)) return null;
        try { return UUID.fromString(value); }
        catch (IllegalArgumentException exception) { throw validation("Valor inválido para " + field); }
    }

    private <E extends Enum<E>> E parseOptionalEnum(Class<E> type, String value, E fallback, String field) {
        return StringUtils.hasText(value) ? parseEnum(type, value, field) : fallback;
    }

    private <E extends Enum<E>> E parseEnum(Class<E> type, String value, String field) {
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
