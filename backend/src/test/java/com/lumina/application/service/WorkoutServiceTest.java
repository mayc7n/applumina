package com.lumina.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import com.lumina.api.dto.CreateWorkoutRequest;
import com.lumina.api.dto.UpdateWorkoutRequest;
import com.lumina.api.dto.WorkoutResponse;
import com.lumina.api.middleware.GlobalExceptionHandler.BusinessException;
import com.lumina.api.middleware.GlobalExceptionHandler.ResourceNotFoundException;
import com.lumina.domain.user.entity.User;
import com.lumina.domain.user.repository.UserRepository;
import com.lumina.domain.workout.entity.Workout;
import com.lumina.domain.workout.entity.WorkoutPrivacy;
import com.lumina.domain.workout.entity.WorkoutType;
import com.lumina.domain.workout.repository.WorkoutRepository;

@ExtendWith(MockitoExtension.class)
class WorkoutServiceTest {
    @Mock private WorkoutRepository workoutRepository;
    @Mock private UserRepository userRepository;

    private WorkoutService workoutService;
    private UUID userId;

    @BeforeEach
    void setUp() {
        workoutService = new WorkoutService(workoutRepository, userRepository);
        userId = UUID.randomUUID();
    }

    @Test
    void createsPrivateWorkoutWithNormalizedOptionalFields() {
        UUID workoutId = UUID.randomUUID();
        when(workoutRepository.save(any(Workout.class))).thenAnswer(invocation -> {
            Workout workout = invocation.getArgument(0);
            workout.setId(workoutId);
            return workout;
        });
        CreateWorkoutRequest request = new CreateWorkoutRequest(
            WorkoutType.STRENGTH,
            "  ignored  ",
            LocalDate.of(2030, 6, 10),
            45,
            "  Treino de pernas  "
        );

        var response = workoutService.create(userId, request);

        ArgumentCaptor<Workout> workout = ArgumentCaptor.forClass(Workout.class);
        verify(workoutRepository).save(workout.capture());
        assertThat(workout.getValue().getPrivacy()).isEqualTo(WorkoutPrivacy.PRIVATE);
        assertThat(workout.getValue().getCustomActivity()).isNull();
        assertThat(workout.getValue().getNotes()).isEqualTo("Treino de pernas");
        assertThat(response.id()).isEqualTo(workoutId.toString());
        assertThat(response.durationMins()).isEqualTo(45);
    }

    @Test
    void requiresANameForCustomActivity() {
        CreateWorkoutRequest request = new CreateWorkoutRequest(
            WorkoutType.CUSTOM,
            " ",
            LocalDate.of(2030, 6, 10),
            30,
            null
        );

        assertThatThrownBy(() -> workoutService.create(userId, request))
            .isInstanceOf(BusinessException.class)
            .hasMessage("Informe o nome da atividade personalizada");
        verify(workoutRepository, never()).save(any());
    }

    @Test
    void listsOnlyAuthenticatedUsersRecentWorkouts() {
        when(workoutRepository.findByUserIdOrderByActivityDateDescCreatedAtDesc(
            any(UUID.class), any(Pageable.class)
        )).thenReturn(List.of());

        assertThat(workoutService.list(userId)).isEmpty();

        ArgumentCaptor<UUID> requestedUser = ArgumentCaptor.forClass(UUID.class);
        ArgumentCaptor<Pageable> page = ArgumentCaptor.forClass(Pageable.class);
        verify(workoutRepository).findByUserIdOrderByActivityDateDescCreatedAtDesc(
            requestedUser.capture(), page.capture()
        );
        assertThat(requestedUser.getValue()).isEqualTo(userId);
        assertThat(page.getValue().getPageSize()).isEqualTo(100);
    }

    @Test
    void findsOnlyWorkoutOwnedByAuthenticatedUser() {
        UUID workoutId = UUID.randomUUID();
        Workout workout = existingWorkout(workoutId, userId);
        when(workoutRepository.findByIdAndUserId(workoutId, userId)).thenReturn(Optional.of(workout));

        assertThat(workoutService.findById(userId, workoutId).id()).isEqualTo(workoutId.toString());
    }

    @Test
    void updatesOwnedWorkoutAndPreservesPrivacy() {
        UUID workoutId = UUID.randomUUID();
        Workout workout = existingWorkout(workoutId, userId);
        workout.setPrivacy(WorkoutPrivacy.FRIENDS);
        when(workoutRepository.findByIdAndUserId(workoutId, userId)).thenReturn(Optional.of(workout));
        UpdateWorkoutRequest request = new UpdateWorkoutRequest(
            WorkoutType.CUSTOM,
            "  Escalada indoor  ",
            LocalDate.of(2030, 7, 11),
            60,
            "  Evolução técnica  "
        );

        WorkoutResponse response = workoutService.update(userId, workoutId, request);

        assertThat(response.customActivity()).isEqualTo("Escalada indoor");
        assertThat(response.durationMins()).isEqualTo(60);
        assertThat(response.notes()).isEqualTo("Evolução técnica");
        assertThat(response.privacy()).isEqualTo("FRIENDS");
    }

    @Test
    void refusesWorkoutOwnedByAnotherUser() {
        UUID workoutId = UUID.randomUUID();
        when(workoutRepository.findByIdAndUserId(workoutId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workoutService.findById(userId, workoutId))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage("Treino não encontrado");
    }

    @Test
    void deletesOnlyOwnedWorkout() {
        UUID workoutId = UUID.randomUUID();
        Workout workout = existingWorkout(workoutId, userId);
        when(workoutRepository.findByIdAndUserId(workoutId, userId)).thenReturn(Optional.of(workout));

        workoutService.delete(userId, workoutId);

        verify(workoutRepository).delete(workout);
    }

    private Workout existingWorkout(UUID workoutId, UUID ownerId) {
        return Workout.builder()
            .id(workoutId)
            .user(User.builder().id(ownerId).build())
            .type(WorkoutType.RUNNING)
            .customActivity(null)
            .activityDate(LocalDate.of(2030, 6, 10))
            .durationMins(45)
            .notes("Treino de pernas")
            .privacy(WorkoutPrivacy.PRIVATE)
            .createdAt(Instant.parse("2030-06-10T12:00:00Z"))
            .build();
    }
}
