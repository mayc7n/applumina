package com.lumina.domain.book.repository;
import com.lumina.domain.book.entity.Book;
import com.lumina.domain.book.entity.ReadingStatus;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface BookRepository extends JpaRepository<Book,UUID> {
    List<Book> findByUserIdAndStatusOrderByUpdatedAtDesc(UUID uid, ReadingStatus status);
    List<Book> findByUserIdOrderByUpdatedAtDesc(UUID uid);
    Optional<Book> findByIdAndUserId(UUID id, UUID userId);
}
