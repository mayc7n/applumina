package com.lumina.domain.study.repository;

import com.lumina.domain.study.entity.StudySubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudySubjectRepository extends JpaRepository<StudySubject, UUID> {
    List<StudySubject> findByUserIdAndArchivedFalseOrderByCreatedAtAsc(UUID userId);
    Optional<StudySubject> findByIdAndUserIdAndArchivedFalse(UUID id, UUID userId);
}
