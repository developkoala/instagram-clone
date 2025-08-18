import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface WebSocketContextType {
  isConnected: boolean;
  onlineUsers: string[];
  sendMessage: (type: string, data: any) => void;
  subscribeToNotifications: (callback: (notification: any) => void) => void;
  unsubscribeFromNotifications: (callback: (notification: any) => void) => void;
  subscribeToChatMessage: (callback: (message: any) => void) => void;
  unsubscribeFromChatMessage: (callback: (message: any) => void) => void;
  subscribeToOnlineStatus: (callback: (status: any) => void) => void;
  unsubscribeFromOnlineStatus: (callback: (status: any) => void) => void;
  joinChatRoom: (roomId: string) => void;
  leaveChatRoom: (roomId: string) => void;
  sendChatMessage: (roomId: string, message: string) => void;
  sendTypingStatus: (roomId: string) => void;
  setActiveConversation: (conversationId: string | null) => void;
  activeConversationId: string | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 이벤트 리스너 관리
  const notificationListeners = useRef<Set<(notification: any) => void>>(new Set());
  const chatListeners = useRef<Set<(message: any) => void>>(new Set());
  const onlineStatusListeners = useRef<Set<(status: any) => void>>(new Set());

  // 웹소켓 연결
  const connect = useCallback(() => {
    if (!isAuthenticated || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      // console.log('⚠️ No access token found for WebSocket connection');
      return;
    }

    try {
      const wsUrl = `ws://127.0.0.1:8000/api/ws/connect?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // console.log('✅ WebSocket connected successfully');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // Ping 메시지 주기적으로 전송 (30초마다)
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        // console.log('❌ WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
        
        // Ping interval 정리
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        // 재연결 시도
        if (isAuthenticated && reconnectAttemptsRef.current < 5) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          // console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current})`);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [isAuthenticated]);

  // 메시지 처리
  const handleMessage = useCallback((data: any) => {
    // console.log('🌐 WebSocket raw message received:', data);
    
    switch (data.type) {
      case 'initial_data':
        setOnlineUsers(data.online_users || []);
        break;
        
      case 'online_status':
        // 온라인 상태 변경 알림
        onlineStatusListeners.current.forEach(listener => listener(data));
        if (data.is_online) {
          setOnlineUsers(prev => [...new Set([...prev, data.user_id])]);
        } else {
          setOnlineUsers(prev => prev.filter(id => id !== data.user_id));
        }
        break;
        
      case 'notification':
        // 실시간 알림
        notificationListeners.current.forEach(listener => listener(data));
        // 토스트 메시지 표시
        if (data.notification_type === 'follow') {
          showToast('새로운 팔로워가 있습니다!', 'info');
        } else if (data.notification_type === 'like') {
          showToast('누군가 게시물을 좋아합니다!', 'info');
        } else if (data.notification_type === 'comment') {
          showToast('새로운 댓글이 달렸습니다!', 'info');
        }
        break;
        
      case 'chat_message':
      case 'new_message':
        // 채팅 메시지
        // console.log('📨 Forwarding chat message to listeners:', chatListeners.current.size, 'listeners');
        chatListeners.current.forEach(listener => listener(data));
        
        // 새 메시지 토스트 알림 
        // 조건: 1) 본인이 보낸 메시지가 아님 
        //      2) 현재 활성 대화가 아니거나 활성 대화가 없을 때
        if (data.message && !data.message.is_own) {
          if (activeConversationId !== data.conversation_id) {
            const senderName = data.message.sender?.username || '알 수 없는 사용자';
            const messagePreview = data.message.content?.length > 50 
              ? data.message.content.substring(0, 50) + '...' 
              : data.message.content;
            
            // 토스트 클릭 시 해당 대화로 이동
            const handleToastClick = () => {
              // 대화 상대의 username으로 메시지 페이지 이동
              window.location.href = `/messages?user=${data.message.sender?.username}`;
            };
            
            showToast(
              `💬 ${senderName}: ${messagePreview}`,
              'info',
              5000, // 5초 동안 표시
              handleToastClick
            );
          }
        }
        break;
        
      case 'user_typing':
        // 타이핑 상태
        chatListeners.current.forEach(listener => listener(data));
        break;
        
      case 'pong':
        // Ping-Pong 응답
        break;
        
      default:
        // console.log('❓ Unknown message type:', data.type, data);
    }
  }, [showToast, activeConversationId]);

  // 메시지 전송
  const sendMessage = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...data }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  // 채팅방 참여
  const joinChatRoom = useCallback((roomId: string) => {
    sendMessage('join_room', { room_id: roomId });
  }, [sendMessage]);

  // 채팅방 나가기
  const leaveChatRoom = useCallback((roomId: string) => {
    sendMessage('leave_room', { room_id: roomId });
  }, [sendMessage]);

  // 채팅 메시지 전송
  const sendChatMessage = useCallback((roomId: string, message: string) => {
    sendMessage('chat_message', { room_id: roomId, message });
  }, [sendMessage]);

  // 타이핑 상태 전송
  const sendTypingStatus = useCallback((roomId: string) => {
    sendMessage('typing', { room_id: roomId });
  }, [sendMessage]);

  // 이벤트 구독/해제 함수들
  const subscribeToNotifications = useCallback((callback: (notification: any) => void) => {
    notificationListeners.current.add(callback);
  }, []);

  const unsubscribeFromNotifications = useCallback((callback: (notification: any) => void) => {
    notificationListeners.current.delete(callback);
  }, []);

  const subscribeToChatMessage = useCallback((callback: (message: any) => void) => {
    chatListeners.current.add(callback);
  }, []);

  const unsubscribeFromChatMessage = useCallback((callback: (message: any) => void) => {
    chatListeners.current.delete(callback);
  }, []);

  const subscribeToOnlineStatus = useCallback((callback: (status: any) => void) => {
    onlineStatusListeners.current.add(callback);
  }, []);

  const unsubscribeFromOnlineStatus = useCallback((callback: (status: any) => void) => {
    onlineStatusListeners.current.delete(callback);
  }, []);

  // 활성 대화 설정
  const setActiveConversation = useCallback((conversationId: string | null) => {
    setActiveConversationId(conversationId);
    // console.log('🎯 Active conversation set to:', conversationId);
  }, []);

  // 연결 관리
  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      // 로그아웃 시 연결 종료
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      setOnlineUsers([]);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isAuthenticated, connect]);

  const value = {
    isConnected,
    onlineUsers,
    sendMessage,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    subscribeToChatMessage,
    unsubscribeFromChatMessage,
    subscribeToOnlineStatus,
    unsubscribeFromOnlineStatus,
    joinChatRoom,
    leaveChatRoom,
    sendChatMessage,
    sendTypingStatus,
    setActiveConversation,
    activeConversationId,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};