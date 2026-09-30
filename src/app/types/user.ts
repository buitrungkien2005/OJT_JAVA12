export type Role = 'ADMIN' | 'OWNER' | 'USER';

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface AdminUpdateUserRequest {
  fullName: string;
  role: Role;
  active?: boolean;
}

export interface UpdateProfileRequest {
  fullName: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
