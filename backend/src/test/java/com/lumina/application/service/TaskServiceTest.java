package com.lumina.application.service;

import com.lumina.api.dto.CreateTaskRequest;
import com.lumina.api.dto.UpdateTaskRequest;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.task.entity.RecurrenceType;
import com.lumina.domain.task.entity.Task;
import com.lumina.domain.task.entity.TaskPriority;
import com.lumina.domain.task.repository.LabelRepository;
import com.lumina.domain.task.repository.TaskProjectRepository;
import com.lumina.domain.task.repository.TaskRepository;
import com.lumina.domain.user.entity.User;
import com.lumina.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {
    @Mock private TaskRepository taskRepository;
    @Mock private TaskProjectRepository projectRepository;
    @Mock private LabelRepository labelRepository;
    @Mock private UserRepository userRepository;

    private TaskService taskService;
    private UUID userId;
    private UUID taskId;
    private Task task;

    @BeforeEach
    void setUp() {
        taskService = new TaskService(taskRepository, projectRepository, labelRepository, userRepository);
        userId = UUID.randomUUID();
        taskId = UUID.randomUUID();
        task = Task.builder()
            .id(taskId)
            .user(User.builder().id(userId).build())
            .title("Caminhar")
            .priority(TaskPriority.MEDIUM)
            .dueDate(LocalDate.of(2030, 6, 10))
            .recurrenceType(RecurrenceType.DAILY)
            .labels(new LinkedHashSet<>())
            .build();
    }

    @Test
    void doesNotExposeAnotherUsersTask() {
        UUID anotherUserId = UUID.randomUUID();
        when(taskRepository.findByIdAndUserIdAndDeletedAtIsNull(taskId, anotherUserId))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.findById(anotherUserId, taskId))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage("Tarefa não encontrada");
    }

    @Test
    void createsOnlyOneNextOccurrenceWhenRecurringTaskIsCompleted() {
        when(taskRepository.findByIdAndUserIdAndDeletedAtIsNull(taskId, userId)).thenReturn(Optional.of(task));
        when(taskRepository.existsByRecurrenceSourceIdAndDueDateAndDeletedAtIsNull(
            taskId, LocalDate.of(2030, 6, 11)
        )).thenReturn(false);

        var response = taskService.toggleComplete(userId, taskId);

        assertThat(response.status()).isEqualTo("DONE");
        ArgumentCaptor<Task> nextTask = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository).save(nextTask.capture());
        assertThat(nextTask.getValue().getDueDate()).isEqualTo(LocalDate.of(2030, 6, 11));
        assertThat(nextTask.getValue().getRecurrenceSourceId()).isEqualTo(taskId);
        assertThat(nextTask.getValue().getStatus().name()).isEqualTo("TODO");
    }

    @Test
    void doesNotDuplicateAnExistingRecurringOccurrence() {
        when(taskRepository.findByIdAndUserIdAndDeletedAtIsNull(taskId, userId)).thenReturn(Optional.of(task));
        when(taskRepository.existsByRecurrenceSourceIdAndDueDateAndDeletedAtIsNull(
            taskId, LocalDate.of(2030, 6, 11)
        )).thenReturn(true);

        taskService.toggleComplete(userId, taskId);

        verify(taskRepository, never()).save(any());
    }

    @Test
    void movesTaskBackToInboxWhenProjectIsCleared() {
        UUID projectId = UUID.randomUUID();
        task.setProjectId(projectId);
        task.setInbox(false);
        task.setEstimatedMins(30);
        when(taskRepository.findByIdAndUserIdAndDeletedAtIsNull(taskId, userId)).thenReturn(Optional.of(task));
        UpdateTaskRequest request = new UpdateTaskRequest(
            null, null, null, null, null, null, null, 0, "", null, null, null
        );

        var response = taskService.update(userId, taskId, request);

        assertThat(response.projectId()).isNull();
        assertThat(response.estimatedMins()).isNull();
        assertThat(task.isInbox()).isTrue();
        verifyNoInteractions(projectRepository);
    }

    @Test
    void rejectsALabelOwnedByAnotherUser() {
        String foreignLabelId = UUID.randomUUID().toString();
        when(labelRepository.findAllByIdInAndUserId(anyList(), eq(userId))).thenReturn(java.util.List.of());
        CreateTaskRequest request = new CreateTaskRequest(
            "Planejar semana", null, null, null, null, null, null, null,
            java.util.List.of(foreignLabelId), null, null
        );

        assertThatThrownBy(() -> taskService.create(userId, request))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage("Etiqueta não encontrada");
        verify(taskRepository, never()).save(any());
    }
}
