package com.lumina.api.controller;

import com.lumina.api.dto.*;
import com.lumina.application.service.TaskService;
import com.lumina.infrastructure.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
public class TaskController {
    private final TaskService taskService;

    @GetMapping
    public ApiResponse<Page<TaskResponse>> findAll(
        @AuthenticationPrincipal UserPrincipal principal,
        @ModelAttribute TaskFilterRequest filter,
        @PageableDefault(size = 50) Pageable pageable
    ) {
        return ApiResponse.success(taskService.findAll(principal.getUserId(), filter, pageable));
    }

    @GetMapping("/today")
    public ApiResponse<List<TaskResponse>> today(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(taskService.findToday(principal.getUserId()));
    }

    @GetMapping("/upcoming")
    public ApiResponse<List<TaskResponse>> upcoming(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(defaultValue = "7") int days
    ) {
        return ApiResponse.success(taskService.findUpcoming(principal.getUserId(), days));
    }

    @GetMapping("/overdue")
    public ApiResponse<List<TaskResponse>> overdue(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(taskService.findOverdue(principal.getUserId()));
    }

    @GetMapping("/inbox")
    public ApiResponse<List<TaskResponse>> inbox(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(taskService.findInbox(principal.getUserId()));
    }

    @GetMapping("/projects")
    public ApiResponse<List<ProjectResponse>> projects(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(taskService.getProjects(principal.getUserId()));
    }

    @PostMapping("/projects")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProjectResponse> createProject(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CreateProjectRequest request
    ) {
        return ApiResponse.success(taskService.createProject(principal.getUserId(), request));
    }

    @GetMapping("/labels")
    public ApiResponse<List<LabelResponse>> labels(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(taskService.getLabels(principal.getUserId()));
    }

    @PostMapping("/labels")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<LabelResponse> createLabel(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CreateLabelRequest request
    ) {
        return ApiResponse.success(taskService.createLabel(principal.getUserId(), request));
    }

    @GetMapping("/{taskId}")
    public ApiResponse<TaskResponse> findById(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID taskId
    ) {
        return ApiResponse.success(taskService.findById(principal.getUserId(), taskId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TaskResponse> create(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CreateTaskRequest request
    ) {
        return ApiResponse.success(taskService.create(principal.getUserId(), request));
    }

    @PutMapping("/{taskId}")
    public ApiResponse<TaskResponse> update(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID taskId,
        @Valid @RequestBody UpdateTaskRequest request
    ) {
        return ApiResponse.success(taskService.update(principal.getUserId(), taskId, request));
    }

    @PatchMapping("/{taskId}/complete")
    public ApiResponse<TaskResponse> toggleComplete(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID taskId
    ) {
        return ApiResponse.success(taskService.toggleComplete(principal.getUserId(), taskId));
    }

    @DeleteMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID taskId
    ) {
        taskService.delete(principal.getUserId(), taskId);
    }
}
