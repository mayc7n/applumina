package com.lumina.domain.study.repository;

import com.lumina.domain.study.entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, UUID> {
    List<StudySession> findByUserIdOrderByStartedAtDesc(UUID userId);
    Optional<StudySession> findFirstByUserIdAndEndedAtIsNullOrderByStartedAtDesc(UUID userId);
    Optional<StudySession> findByIdAndUserId(UUID id, UUID userId);
}
