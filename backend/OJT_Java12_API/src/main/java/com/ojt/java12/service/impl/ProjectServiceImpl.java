package com.ojt.java12.service.impl;

import com.ojt.java12.dto.request.AddMemberRequest;
import com.ojt.java12.dto.request.CreateProjectRequest;
import com.ojt.java12.dto.request.UpdateProjectRequest;
import com.ojt.java12.dto.response.PagedResponse;
import com.ojt.java12.dto.response.ProjectDetailResponse;
import com.ojt.java12.dto.response.ProjectMemberResponse;
import com.ojt.java12.dto.response.ProjectResponse;
import com.ojt.java12.dto.response.UserResponse;
import com.ojt.java12.entity.Document;
import com.ojt.java12.entity.Project;
import com.ojt.java12.entity.ProjectMember;
import com.ojt.java12.entity.User;
import com.ojt.java12.repository.DocumentRepository;
import com.ojt.java12.repository.ProjectMemberRepository;
import com.ojt.java12.repository.ProjectRepository;
import com.ojt.java12.repository.UserRepository;
import com.ojt.java12.service.ProjectService;
import com.ojt.java12.service.StorageService;
import com.ojt.java12.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final SecurityUtil securityUtil;

    @Override
    @Transactional(readOnly = true)
    public List<ProjectResponse> getAccessibleProjects() {
        User currentUser = getCurrentUser();
        List<Project> projects;

        if (securityUtil.isAdmin()) {
            projects = projectRepository.findAll(Sort.by("updatedAt").descending());
        } else {
            projects = projectRepository.findAccessibleProjectsForUser(currentUser.getId());
        }

        return projects.stream().map(this::toProjectResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ProjectResponse> searchAccessibleProjects(int page, int size, String search) {
        User currentUser = getCurrentUser();
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by("updatedAt").descending());

        Long filterUserId = securityUtil.isAdmin() ? null : currentUser.getId();
        Page<Project> projectPage = projectRepository.searchAccessibleProjects(filterUserId, search, pageable);

        return new PagedResponse<>(
                projectPage.getContent().stream().map(this::toProjectResponse).toList(),
                projectPage.getNumber(),
                projectPage.getSize(),
                projectPage.getTotalElements(),
                projectPage.getTotalPages(),
                projectPage.isLast()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectDetailResponse getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Project not found with id: " + id));

        User currentUser = getCurrentUser();
        boolean isOwner = project.getOwner().getId().equals(currentUser.getId());
        boolean isMember = projectMemberRepository.existsByProjectIdAndUserId(id, currentUser.getId());

        if (!isOwner && !isMember && !securityUtil.isAdmin()) {
            throw new AccessDeniedException("You do not have access to this project");
        }

        List<ProjectMemberResponse> memberResponses = project.getMembers().stream()
                .map(m -> new ProjectMemberResponse(
                        m.getId(),
                        toUserResponse(m.getUser()),
                        m.getJoinedAt()
                ))
                .toList();

        return new ProjectDetailResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                toUserResponse(project.getOwner()),
                memberResponses,
                project.getDocuments().size(),
                isOwner || securityUtil.isAdmin(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }

    @Override
    public ProjectResponse createProject(CreateProjectRequest request) {
        User currentUser = getCurrentUser();

        Project project = Project.builder()
                .name(request.name().trim())
                .description(request.description() != null ? request.description().trim() : "")
                .owner(currentUser)
                .build();

        Project saved = projectRepository.save(project);

        // Also add owner as a member for consistency
        ProjectMember ownerMember = ProjectMember.builder()
                .project(saved)
                .user(currentUser)
                .build();
        projectMemberRepository.save(ownerMember);

        return toProjectResponse(saved);
    }

    @Override
    public ProjectResponse updateProject(Long id, UpdateProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Project not found with id: " + id));

        checkOwnerOrAdmin(project);

        project.setName(request.name().trim());
        if (request.description() != null) {
            project.setDescription(request.description().trim());
        }

        Project updated = projectRepository.save(project);
        return toProjectResponse(updated);
    }

    @Override
    public void deleteProject(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Project not found with id: " + id));

        checkOwnerOrAdmin(project);

        // Clean up MinIO files
        List<Document> docs = documentRepository.findByProjectId(id);
        for (Document doc : docs) {
            try {
                storageService.deleteFile(doc.getObjectKey());
            } catch (Exception e) {
                log.warn("Failed to delete MinIO object for key {}: {}", doc.getObjectKey(), e.getMessage());
            }
        }

        projectRepository.delete(project);
    }

    @Override
    public ProjectMemberResponse addMember(Long projectId, AddMemberRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NoSuchElementException("Project not found with id: " + projectId));

        checkOwnerOrAdmin(project);

        String email = request.email().trim().toLowerCase();
        User newMemberUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("No registered user found with email: " + email));

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, newMemberUser.getId())) {
            throw new IllegalArgumentException("User is already a member of this project");
        }

        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(newMemberUser)
                .build();

        ProjectMember saved = projectMemberRepository.save(member);
        return new ProjectMemberResponse(saved.getId(), toUserResponse(saved.getUser()), saved.getJoinedAt());
    }

    @Override
    public void removeMember(Long projectId, Long memberUserId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NoSuchElementException("Project not found with id: " + projectId));

        checkOwnerOrAdmin(project);

        if (project.getOwner().getId().equals(memberUserId)) {
            throw new IllegalArgumentException("Cannot remove the project owner from members");
        }

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, memberUserId)
                .orElseThrow(() -> new NoSuchElementException("Member not found in project"));

        projectMemberRepository.delete(member);
    }

    private void checkOwnerOrAdmin(Project project) {
        User currentUser = getCurrentUser();
        boolean isOwner = project.getOwner().getId().equals(currentUser.getId());
        if (!isOwner && !securityUtil.isAdmin()) {
            throw new AccessDeniedException("Only the project owner or an administrator can perform this action");
        }
    }

    private User getCurrentUser() {
        String email = securityUtil.getCurrentUserEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));
    }

    private ProjectResponse toProjectResponse(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                toUserResponse(project.getOwner()),
                project.getMembers() != null ? project.getMembers().size() : 0,
                project.getDocuments() != null ? project.getDocuments().size() : 0,
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt()
        );
    }
}
