import api, { publicApi } from './api';
import { Post } from '../types';

export const postService = {
  async getFeed(page: number = 1, limit: number = 10): Promise<Post[]> {
    const response = await publicApi.get<Post[]>('/posts/feed', {
      params: { page, limit },
    });
    return response.data;
  },

  async likePost(postId: string): Promise<{ message: string; is_liked: boolean; likes_count: number }> {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  async unlikePost(postId: string): Promise<{ message: string; is_liked: boolean; likes_count: number }> {
    const response = await api.delete(`/posts/${postId}/like`);
    return response.data;
  },

  async getExplore(page: number = 1, limit: number = 21): Promise<{ posts: Array<{ id: string; images: Array<{ image_url: string }>; likes_count: number }>; page: number; has_next: boolean }>{
    const response = await api.get('/posts/explore', { params: { page, limit } });
    return response.data;
  },


  async getPostDetail(postId: string): Promise<Post> {
    const response = await api.get<Post>(`/posts/${postId}`);
    return response.data as unknown as Post;
  },

  async getPostById(postId: string): Promise<Post> {
    const response = await api.get<Post>(`/posts/${postId}`);
    return response.data as unknown as Post;
  },

  async getUserPosts(username: string, page: number = 1, limit: number = 12): Promise<{ posts: Array<{ id: string; images: Array<{ image_url: string }>; likes_count: number; comments_count: number }>; total: number; page: number; has_next: boolean }>{
    const response = await api.get(`/posts/users/${encodeURIComponent(username)}/posts`, { params: { page, limit } });
    return response.data;
  },

  async addComment(postId: string, content: string): Promise<{ comment: { id: string } }>{
    const response = await api.post(`/posts/${postId}/comments`, { content });
    return response.data;
  },

  async getComments(postId: string, page = 1, limit = 20): Promise<{ comments: Array<{ id: string; user: any; content: string; created_at: string }>; total: number; page: number; has_next: boolean }>{
    const response = await publicApi.get(`/posts/${postId}/comments`, { params: { page, limit } });
    return response.data;
  },

  async getSaved(page: number = 1, limit: number = 12): Promise<{ posts: Array<{ id: string; user: any; images: Array<{ image_url: string }>; caption?: string; likes_count: number; is_liked: boolean; is_saved: boolean }>; page: number; has_next: boolean }>{
    const response = await api.get('/posts/saved', { params: { page, limit } });
    return response.data;
  },

  async deletePost(postId: string): Promise<{ message: string }> {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  },
};