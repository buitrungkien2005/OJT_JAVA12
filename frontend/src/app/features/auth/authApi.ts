import { apiClient } from '../../../shared/api/apiClient';
import { AuthResponse, LoginRequest, RegisterRequest } from '../../types/auth';
import { UserResponse } from '../../types/user';

export const authApi = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  async getCurrentUser(): Promise<UserResponse> {
    const res = await apiClient.get<UserResponse>('/auth/me');
    return res.data;
  },
};
