package com.lumina.domain.goal.repository;

import com.lumina.domain.goal.entity.GoalCheckIn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GoalCheckInRepository extends JpaRepository<GoalCheckIn, UUID> {
    List<GoalCheckIn> findByGoalIdOrderByCheckedAtDesc(UUID goalId);
}
