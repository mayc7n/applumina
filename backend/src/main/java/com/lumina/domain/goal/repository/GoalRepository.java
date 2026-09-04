package com.lumina.domain.goal.repository;
import com.lumina.domain.goal.entity.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface GoalRepository extends JpaRepository<Goal,UUID> {
    List<Goal> findByUserIdOrderByCreatedAtDesc(UUID uid);
    List<Goal> findByUserIdAndStatusOrderByCreatedAtDesc(UUID uid, GoalStatus status);
    Optional<Goal> findByIdAndUserId(UUID id, UUID userId);
}
