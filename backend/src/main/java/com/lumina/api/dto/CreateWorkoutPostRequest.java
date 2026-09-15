package com.lumina.api.dto;

import jakarta.validation.constraints.Size;

public record CreateWorkoutPostRequest(String privacy, @Size(max = 280) String caption) {}
