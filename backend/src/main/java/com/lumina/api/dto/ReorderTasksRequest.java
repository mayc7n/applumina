package com.lumina.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ReorderTasksRequest(@NotNull @Size(max = 1_000) List<@Valid TaskOrderItem> taskOrders) {}
