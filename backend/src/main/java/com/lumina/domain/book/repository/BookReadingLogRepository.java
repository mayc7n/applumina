package com.lumina.domain.book.repository;

import com.lumina.domain.book.entity.BookReadingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BookReadingLogRepository extends JpaRepository<BookReadingLog, UUID> {
    List<BookReadingLog> findByBookIdOrderByLoggedAtDesc(UUID bookId);
}
