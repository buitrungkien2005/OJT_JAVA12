import { UserResponse } from './user';

export interface ProjectResponse {
  id: number;
  name: string;
  description: string;
  owner: UserResponse;
  memberCount: number;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMemberResponse {
  id: number;
  user: UserResponse;
  joinedAt: string;
}

export interface ProjectDetailResponse {
  id: number;
  name: string;
  description: string;
  owner: UserResponse;
  members: ProjectMemberResponse[];
  documentCount: number;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name: string;
  description?: string;
}

export interface AddMemberRequest {
  email: string;
}
