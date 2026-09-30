import { apiClient } from '../../../shared/api/apiClient';
import {
  AddMemberRequest,
  CreateProjectRequest,
  ProjectDetailResponse,
  ProjectMemberResponse,
  ProjectResponse,
  UpdateProjectRequest,
} from '../../types/project';
import { PagedResponse } from '../../types/user';

export const projectApi = {
  async getAccessibleProjects(): Promise<ProjectResponse[]> {
    const res = await apiClient.get<ProjectResponse[]>('/projects');
    return res.data;
  },

  async searchAccessibleProjects(page = 0, size = 10, search?: string): Promise<PagedResponse<ProjectResponse>> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('size', String(size));
    if (search && search.trim()) {
      params.set('search', search.trim());
    }
    const res = await apiClient.get<PagedResponse<ProjectResponse>>(`/projects/search?${params.toString()}`);
    return res.data;
  },

  async getProjectById(id: number): Promise<ProjectDetailResponse> {
    const res = await apiClient.get<ProjectDetailResponse>(`/projects/${id}`);
    return res.data;
  },

  async createProject(data: CreateProjectRequest): Promise<ProjectResponse> {
    const res = await apiClient.post<ProjectResponse>('/projects', data);
    return res.data;
  },

  async updateProject(id: number, data: UpdateProjectRequest): Promise<ProjectResponse> {
    const res = await apiClient.put<ProjectResponse>(`/projects/${id}`, data);
    return res.data;
  },

  async deleteProject(id: number): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  },

  async addMember(projectId: number, data: AddMemberRequest): Promise<ProjectMemberResponse> {
    const res = await apiClient.post<ProjectMemberResponse>(`/projects/${projectId}/members`, data);
    return res.data;
  },

  async removeMember(projectId: number, userId: number): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`);
  },
};
