package com.lumina.domain.social.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.lumina.domain.social.entity.UserReport;

@Repository
public interface UserReportRepository extends JpaRepository<UserReport, UUID> {
}
