import api from './api';

export interface Notification {
  id: string;
  type: 'like' | 'follow' | 'comment';
  user: {
    id: string;
    username: string;
    profile_picture?: string;
  };
  created_at: string;
  post_image?: string;
  post_id?: string;
  comment?: string;
  is_following?: boolean;
}

export interface NotificationResponse {
  notifications: Notification[];
  page: number;
  limit: number;
}

export const notificationService = {
  // 알림 목록 조회
  async getNotifications(page: number = 1, limit: number = 20): Promise<NotificationResponse> {
    const response = await api.get('/notifications', {
      params: { page, limit }
    });
    return response.data;
  },

  // 알림 개수 조회
  async getNotificationCount(): Promise<{ count: number }> {
    const response = await api.get('/notifications/count');
    return response.data;
  }
};