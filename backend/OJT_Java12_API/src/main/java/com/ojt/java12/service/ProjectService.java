package com.ojt.java12.service;

import com.ojt.java12.dto.request.AddMemberRequest;
import com.ojt.java12.dto.request.CreateProjectRequest;
import com.ojt.java12.dto.request.UpdateProjectRequest;
import com.ojt.java12.dto.response.PagedResponse;
import com.ojt.java12.dto.response.ProjectDetailResponse;
import com.ojt.java12.dto.response.ProjectMemberResponse;
import com.ojt.java12.dto.response.ProjectResponse;

import java.util.List;

public interface ProjectService {

    List<ProjectResponse> getAccessibleProjects();

    PagedResponse<ProjectResponse> searchAccessibleProjects(int page, int size, String search);

    ProjectDetailResponse getProjectById(Long id);

    ProjectResponse createProject(CreateProjectRequest request);

    ProjectResponse updateProject(Long id, UpdateProjectRequest request);

    void deleteProject(Long id);

    ProjectMemberResponse addMember(Long projectId, AddMemberRequest request);

    void removeMember(Long projectId, Long memberUserId);
}
