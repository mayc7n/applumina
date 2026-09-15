package com.lumina.domain.workout.repository;

import java.util.Optional;
import java.util.UUID;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.lumina.domain.workout.entity.WorkoutMedia;

public interface WorkoutMediaRepository extends JpaRepository<WorkoutMedia, UUID> {
    Optional<WorkoutMedia> findByWorkoutIdAndUserId(UUID workoutId, UUID userId);
    List<WorkoutMedia> findByWorkoutIdInAndUserId(Collection<UUID> workoutIds, UUID userId);
}
