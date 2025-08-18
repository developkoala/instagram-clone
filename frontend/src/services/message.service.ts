import api from './api';

export interface Conversation {
  id: string;
  participant: {
    id: string;
    username: string;
    profile_picture?: string;
  };
  last_message?: {
    content: string;
    created_at: string;
    is_own: boolean;
  };
  unread_count: number;
  updated_at: string;
}

export interface Message {
  id: string;
  content: string;
  message_type: string;
  sender: {
    id: string;
    username: string;
    profile_picture?: string;
  };
  is_own: boolean;
  is_read: boolean;
  created_at: string;
}

export interface MessageCreate {
  content: string;
  message_type?: string;
}

export const messageService = {
  // 대화 목록 조회
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get<Conversation[]>('/messages/conversations');
    return response.data;
  },

  // 대화방 생성 또는 조회
  async createOrGetConversation(userId: string): Promise<{ conversation_id: string }> {
    const response = await api.post<{ conversation_id: string }>(`/messages/conversations/${userId}`);
    return response.data;
  },

  // 대화방 메시지 조회
  async getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ messages: Message[]; page: number; has_next: boolean }> {
    const response = await api.get<{ messages: Message[]; page: number; has_next: boolean }>(
      `/messages/conversations/${conversationId}/messages`,
      { params: { page, limit } }
    );
    return response.data;
  },

  // 메시지 전송
  async sendMessage(conversationId: string, messageData: MessageCreate): Promise<Message> {
    const response = await api.post<Message>(
      `/messages/conversations/${conversationId}/messages`,
      messageData
    );
    return response.data;
  },

  // 메시지 읽음 처리
  async markAsRead(conversationId: string): Promise<void> {
    await api.post(`/messages/conversations/${conversationId}/read`);
  },

};