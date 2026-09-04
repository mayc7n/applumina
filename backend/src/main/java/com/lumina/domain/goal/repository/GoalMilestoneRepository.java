package com.lumina.domain.goal.repository;

import com.lumina.domain.goal.entity.GoalMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GoalMilestoneRepository extends JpaRepository<GoalMilestone, UUID> {
    List<GoalMilestone> findByGoalIdOrderByOrderIndexAsc(UUID goalId);
    long countByGoalId(UUID goalId);
    long countByGoalIdAndCompletedAtIsNotNull(UUID goalId);
}
