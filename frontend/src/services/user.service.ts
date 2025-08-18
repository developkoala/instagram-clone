import api, { publicApi } from './api';
import { UserProfile } from '../types';

interface SearchResult {
  id: string;
  username: string;
  profile_picture: string;
  bio: string;
  followers_count: number;
  is_following?: boolean;
}

export const userService = {
  async getUserProfile(username: string): Promise<UserProfile> {
    const response = await api.get<UserProfile>(`/users/${username}`);
    return response.data;
  },

  async getCurrentUserProfile(): Promise<any> {
    const response = await api.get('/users/profile');
    return response.data;
  },

  async followUser(userId: string): Promise<{ message: string; is_following: boolean }> {
    const response = await api.post(`/users/${userId}/follow`);
    return response.data;
  },

  async unfollowUser(userId: string): Promise<{ message: string; is_following: boolean }> {
    const response = await api.delete(`/users/${userId}/follow`);
    return response.data;
  },

  async getFollowers(username: string, page = 1, limit = 20) {
    const response = await api.get(`/users/${encodeURIComponent(username)}/followers`, { params: { page, limit } });
    return response.data as { users: Array<{ id: string; username: string; full_name?: string; profile_picture?: string; is_following: boolean }>; total: number; page: number; has_next: boolean };
  },

  async getFollowing(username: string, page = 1, limit = 20) {
    const response = await api.get(`/users/${encodeURIComponent(username)}/following`, { params: { page, limit } });
    return response.data as { users: Array<{ id: string; username: string; full_name?: string; profile_picture?: string; is_following: boolean }>; total: number; page: number; has_next: boolean };
  },

  async uploadProfilePicture(file: File): Promise<{ message: string; profile_picture: string }>{
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/users/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async searchUsers(query: string, limit = 10): Promise<{ users: SearchResult[]; count: number }> {
    const response = await publicApi.get('/public/search/users', {
      params: { q: query, limit }
    });
    return response.data;
  },

  async getSuggestedUsers(limit = 10): Promise<{ users: SearchResult[]; count: number }> {
    try {
      const response = await api.get('/users/suggestions', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      // 실패 시 빈 배열 반환
      return { users: [], count: 0 };
    }
  },

  async updateProfile(data: { bio?: string; website?: string; email?: string }): Promise<any> {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  async changePassword(data: { current_password: string; new_password: string }): Promise<any> {
    const response = await api.post('/users/change-password', data);
    return response.data;
  },
};