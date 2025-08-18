import api from './api';
import { AuthResponse, LoginCredentials, RegisterData, User } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    const { access_token, refresh_token } = response.data;
    
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    
    return response.data;
  },

  async register(data: RegisterData): Promise<{ message: string; user_id: string }> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.delete('/auth/logout');
    } catch (error) {
      // If logout endpoint fails, we still want to clear local tokens
      console.warn('Logout API failed, clearing local tokens anyway:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/users/profile');
    return response.data;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },
};