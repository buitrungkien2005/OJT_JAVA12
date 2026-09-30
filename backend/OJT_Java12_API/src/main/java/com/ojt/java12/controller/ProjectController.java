package com.ojt.java12.controller;

import com.ojt.java12.dto.request.AddMemberRequest;
import com.ojt.java12.dto.request.CreateProjectRequest;
import com.ojt.java12.dto.request.UpdateProjectRequest;
import com.ojt.java12.dto.response.PagedResponse;
import com.ojt.java12.dto.response.ProjectDetailResponse;
import com.ojt.java12.dto.response.ProjectMemberResponse;
import com.ojt.java12.dto.response.ProjectResponse;
import com.ojt.java12.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Endpoints for creating, managing, and accessing projects and members")
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    @Operation(summary = "Get user projects", description = "Returns all projects accessible to the current user (or all projects if admin)")
    @ApiResponse(responseCode = "200", description = "Projects retrieved successfully")
    public ResponseEntity<List<ProjectResponse>> getAccessibleProjects() {
        List<ProjectResponse> response = projectService.getAccessibleProjects();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    @Operation(summary = "Search projects", description = "Returns paged projects with optional name/description search")
    @ApiResponse(responseCode = "200", description = "Projects retrieved successfully")
    public ResponseEntity<PagedResponse<ProjectResponse>> searchAccessibleProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        PagedResponse<ProjectResponse> response = projectService.searchAccessibleProjects(page, size, search);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project details", description = "Returns project details including members and document count")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Project details retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Not a member or owner"),
            @ApiResponse(responseCode = "404", description = "Project not found")
    })
    public ResponseEntity<ProjectDetailResponse> getProjectById(@PathVariable Long id) {
        ProjectDetailResponse response = projectService.getProjectById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    @Operation(summary = "Create project", description = "Creates a new project with current user as owner")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Project created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request")
    })
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody CreateProjectRequest request) {
        ProjectResponse response = projectService.createProject(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update project", description = "Updates project details (owner or admin only)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Project updated successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden - owner or admin only"),
            @ApiResponse(responseCode = "404", description = "Project not found")
    })
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProjectRequest request
    ) {
        ProjectResponse response = projectService.updateProject(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete project", description = "Deletes a project and associated files (owner or admin only)")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Project deleted successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden - owner or admin only"),
            @ApiResponse(responseCode = "404", description = "Project not found")
    })
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members")
    @Operation(summary = "Add project member", description = "Adds a registered user as a project member by email")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Member added successfully"),
            @ApiResponse(responseCode = "400", description = "User already a member"),
            @ApiResponse(responseCode = "404", description = "User or project not found"),
            @ApiResponse(responseCode = "403", description = "Forbidden - owner or admin only")
    })
    public ResponseEntity<ProjectMemberResponse> addMember(
            @PathVariable Long id,
            @Valid @RequestBody AddMemberRequest request
    ) {
        ProjectMemberResponse response = projectService.addMember(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}/members/{userId}")
    @Operation(summary = "Remove project member", description = "Removes a member from the project (owner or admin only)")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Member removed successfully"),
            @ApiResponse(responseCode = "400", description = "Cannot remove project owner"),
            @ApiResponse(responseCode = "404", description = "Member not found"),
            @ApiResponse(responseCode = "403", description = "Forbidden - owner or admin only")
    })
    public ResponseEntity<Void> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        projectService.removeMember(id, userId);
        return ResponseEntity.noContent().build();
    }
}
