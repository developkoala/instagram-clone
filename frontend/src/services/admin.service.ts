import axios from 'axios';
import { adminApi } from './api';

const BASIC_AUTH_HEADER = 'Basic ' + btoa('admin:pass123');

export const adminService = {
  async login(): Promise<{ access_token: string; token_type: string; role: string }> {
    const res = await axios.post(
      (adminApi.defaults.baseURL || '') + '/admin/login',
      {},
      { headers: { Authorization: BASIC_AUTH_HEADER } }
    );
    const { access_token } = res.data || {};
    if (access_token) {
      localStorage.setItem('admin_access_token', access_token);
    }
    return res.data;
  },

  async getStats() {
    const { data } = await adminApi.get('/admin/stats');
    return data;
  },

  async listUsers(page = 1, limit = 20, q?: string) {
    const { data } = await adminApi.get('/admin/users', { params: { page, limit, q } });
    return data;
  },

  async deleteUser(userId: string) {
    const { data } = await adminApi.delete(`/admin/users/${userId}`);
    return data;
  },

  async listPosts(page = 1, limit = 20, userId?: string) {
    const { data } = await adminApi.get('/admin/posts', { params: { page, limit, user_id: userId } });
    return data;
  },

  async deletePost(postId: string) {
    const { data } = await adminApi.delete(`/admin/posts/${postId}`);
    return data;
  },
};


