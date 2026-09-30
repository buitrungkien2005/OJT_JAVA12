import { apiClient } from '../../shared/api/apiClient';
import {
  AdminUpdateUserRequest,
  ChangePasswordRequest,
  PagedResponse,
  UpdateProfileRequest,
  UserResponse,
} from '../types/user';

export const userApi = {
  // Admin endpoints
  async getAllUsers(page = 0, size = 10, search?: string): Promise<PagedResponse<UserResponse>> {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('size', String(size));
    if (search && search.trim()) {
      params.set('search', search.trim());
    }
    const res = await apiClient.get<PagedResponse<UserResponse>>(`/users?${params.toString()}`);
    return res.data;
  },

  async getUserById(id: number): Promise<UserResponse> {
    const res = await apiClient.get<UserResponse>(`/users/${id}`);
    return res.data;
  },

  async updateUserAsAdmin(id: number, data: AdminUpdateUserRequest): Promise<UserResponse> {
    const res = await apiClient.put<UserResponse>(`/users/${id}`, data);
    return res.data;
  },

  async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },

  // Current user profile endpoints
  async getProfile(): Promise<UserResponse> {
    const res = await apiClient.get<UserResponse>('/users/profile');
    return res.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UserResponse> {
    const res = await apiClient.put<UserResponse>('/users/profile', data);
    return res.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.put('/users/profile/password', data);
  },
};
