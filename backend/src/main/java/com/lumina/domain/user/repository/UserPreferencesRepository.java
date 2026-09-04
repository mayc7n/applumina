package com.lumina.domain.user.repository;

import com.lumina.domain.user.entity.UserPreferences;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserPreferencesRepository extends JpaRepository<UserPreferences, UUID> {}
