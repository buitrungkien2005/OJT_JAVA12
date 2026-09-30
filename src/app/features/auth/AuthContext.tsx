import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from './authApi';
import { tokenStorage } from '../../../shared/utils/tokenStorage';
import { UserResponse } from '../../types/user';
import { LoginRequest, RegisterRequest } from '../../types/auth';

interface AuthContextType {
  user: UserResponse | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(() => tokenStorage.getUser<UserResponse>());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = tokenStorage.getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData);
      tokenStorage.setUser(userData);
    } catch {
      tokenStorage.removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (data: LoginRequest) => {
    const res = await authApi.login(data);
    tokenStorage.setToken(res.token);
    tokenStorage.setUser(res.user);
    setUser(res.user);
  };

  const register = async (data: RegisterRequest) => {
    const res = await authApi.register(data);
    tokenStorage.setToken(res.token);
    tokenStorage.setUser(res.user);
    setUser(res.user);
  };

  const logout = () => {
    tokenStorage.removeToken();
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
