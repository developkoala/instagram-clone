import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { userService } from '../../services/user.service';
import { messageService, Conversation, Message } from '../../services/message.service';
import { useAuth } from "../../hooks/useAuth";
import { useWebSocket } from '../../hooks/useWebSocket';
import { useToast } from '../../hooks/useToast';
import { getImageUrl } from '../../utils/imageUrl';
import RelativeTime from '../../components/common/RelativeTime';

const Messages: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updateKey, setUpdateKey] = useState(0);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { subscribeToChatMessage, unsubscribeFromChatMessage, setActiveConversation } = useWebSocket();
  const { showToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 스크롤을 맨 아래로 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 대화 목록 로드
  const loadConversations = async () => {
    try {
      const data = await messageService.getConversations();
      // console.log('📋 Loading conversations:', data);
      
      // 중복 제거: ID 기준으로 유니크한 대화만 유지
      const uniqueConversations = data.reduce((acc: Conversation[], current: Conversation) => {
        const existing = acc.find(conv => conv.id === current.id);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      // console.log('✨ Unique conversations:', uniqueConversations);
      setConversations(uniqueConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      showToast('대화 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 메시지 로드
  const loadMessages = async (conversationId: string) => {
    try {
      const data = await messageService.getMessages(conversationId);
      setMessages(data.messages);
      // 메시지 로드 후 스크롤을 맨 아래로
      setTimeout(scrollToBottom, 100);
      
      // 메시지를 읽었으므로 대화 목록의 unread_count를 0으로 업데이트
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unread_count: 0 }
          : conv
      ));
    } catch (error) {
      console.error('Failed to load messages:', error);
      showToast('메시지를 불러오는데 실패했습니다.', 'error');
    }
  };

  // 메시지 전송
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation || sending) return;

    // console.log('📤 Sending message to conversation:', selectedConversation.id);
    setSending(true);
    try {
      await messageService.sendMessage(selectedConversation.id, {
        content: messageText.trim()
      });
      
      // console.log('✅ Message sent successfully');
      // 웹소켓으로 메시지를 받을 것이므로 여기서는 상태 업데이트하지 않음
      setMessageText('');
      // 메시지 전송 후 입력창에 다시 포커스
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      showToast('메시지 전송에 실패했습니다.', 'error');
    } finally {
      setSending(false);
    }
  };

  // 웹소켓 메시지 수신 - useCallback과 useRef로 최적화
  const selectedConversationRef = useRef(selectedConversation);
  selectedConversationRef.current = selectedConversation;

  useEffect(() => {
    const handleNewMessage = (data: { message: { sender?: { username: string }; content: string; is_own: boolean }; conversation_id: string; [key: string]: unknown }) => {
      // console.log('🔥 WebSocket message received in Messages:', data);
      const currentConversation = selectedConversationRef.current;
      // console.log('📍 Current conversation ID:', currentConversation?.id);
      // console.log('📨 Message conversation ID:', data.conversation_id);
      
      // 현재 선택된 대화인 경우 메시지 추가
      if (currentConversation?.id === data.conversation_id) {
        // console.log('✅ Adding message to current conversation');
        // console.log('📝 Message data:', data.message);
        
        // 새 메시지 추가
        setMessages(prev => {
          const newMessage: Message = {
            id: Date.now().toString(), // WebSocket data might not have id
            content: data.message.content,
            message_type: 'text',
            is_own: data.message.is_own,
            is_read: false,
            created_at: new Date().toISOString(),
            sender: {
              id: 'unknown',
              username: data.message.sender?.username || 'Unknown',
              profile_picture: undefined // Profile picture not available in WebSocket data
            }
          };
          return [...prev, newMessage];
        });
          
        // 새 메시지 수신 시 스크롤을 맨 아래로
        setTimeout(scrollToBottom, 100);
      } else {
        // console.log('⚠️ Message is for different conversation or no conversation selected');
      }
      
      // 대화 목록 실시간 업데이트
      // console.log('📋 Updating conversation list with new message');
      loadConversations();
    };

    if (user && subscribeToChatMessage) {
      // console.log('🔌 Subscribing to chat messages');
      subscribeToChatMessage(handleNewMessage);
      return () => {
        // console.log('🔌 Unsubscribing from chat messages');
        unsubscribeFromChatMessage(handleNewMessage);
      };
    }
  }, [user, subscribeToChatMessage, unsubscribeFromChatMessage]); // 함수와 user만 dependency로

  // 초기 로드 및 URL 파라미터 처리
  useEffect(() => {
    if (!user) return;
    
    const targetUser = searchParams.get('user');
    if (targetUser) {
      // URL 파라미터가 있을 때
      userService.getUserProfile(targetUser)
        .then(async (userProfile) => {
          try {
            // 대화방 생성 또는 조회
            const { conversation_id } = await messageService.createOrGetConversation(userProfile.id);
            
            // 새로운 대화 객체 생성
            const newConversation: Conversation = {
              id: conversation_id,
              participant: {
                id: userProfile.id,
                username: userProfile.username,
                profile_picture: userProfile.profile_picture
              },
              last_message: undefined,
              unread_count: 0,
              updated_at: new Date().toISOString()
            };
            
            setSelectedConversation(newConversation);
            setActiveConversation(conversation_id); // 활성 대화 설정
            await loadMessages(conversation_id);
            await loadConversations(); // 대화 목록도 업데이트
          } catch (error) {
            console.error('Failed to create conversation:', error);
            showToast('대화를 시작할 수 없습니다.', 'error');
          }
        })
        .catch(error => {
          console.error('Failed to load user profile:', error);
          showToast('사용자를 찾을 수 없습니다.', 'error');
          // 실패해도 대화 목록은 로드
          loadConversations();
        });
    } else {
      // URL 파라미터가 없을 때만 대화 목록 로드
      loadConversations();
    }
  }, [searchParams, user, showToast]);
  
  // 컴포넌트 언마운트 시 활성 대화 초기화
  useEffect(() => {
    return () => {
      setActiveConversation(null);
    };
  }, []); // 빈 배열로 변경 - 마운트 시 한 번만 실행

  // 프로필 이미지 변경 감지
  useEffect(() => {
    const handleProfilePictureUpdate = () => {
      setUpdateKey(prev => prev + 1);
      // 대화 목록 새로고침
      if (user) {
        loadConversations();
      }
    };

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    };
  }, [user]);

  // 대화 선택 시 메시지 로드
  const handleConversationSelect = async (conversation: Conversation) => {
    // console.log('🎯 Selecting conversation:', conversation);
    setSelectedConversation(conversation);
    setActiveConversation(conversation.id); // 활성 대화 설정 - 이 대화의 알림은 안 뜸
    await loadMessages(conversation.id);
    
    // 메시지 읽음 처리 API 호출
    try {
      await messageService.markAsRead(conversation.id);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
    
    // 대화 목록에서 해당 대화의 읽지 않은 메시지 수를 0으로 업데이트
    setConversations(prev => prev.map(conv => 
      conv.id === conversation.id 
        ? { ...conv, unread_count: 0 }
        : conv
    ));
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-108px)] md:h-[calc(100vh-60px)] bg-white items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-108px)] md:h-[calc(100vh-60px)] bg-white">
      {/* Sidebar - Chat List (Hidden on mobile when conversation is selected) */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-96 border-r border-instagram-border flex-col`}>
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-instagram-border">
          <h2 className="text-base font-semibold">{user?.username || 'Messages'}</h2>
        </div>

        {/* Messages Tab */}
        <div className="border-b border-instagram-border">
          <div className="py-2 md:py-3 text-center font-semibold text-sm md:text-base">
            메시지
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              아직 대화가 없습니다
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => handleConversationSelect(conversation)}
                className={`w-full p-3 md:p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-gray-50' : ''
                }`}
              >
                <div className="relative">
                  {(user && user.username === conversation.participant.username ? user.profile_picture : conversation.participant.profile_picture) ? (
                    <img
                      key={`list-${updateKey}`}
                      src={getImageUrl(user && user.username === conversation.participant.username ? user.profile_picture : conversation.participant.profile_picture)}
                      alt={conversation.participant.username}
                      className="w-12 h-12 md:w-14 md:h-14 object-cover border-2 border-mukstagram-border"
                    />
                  ) : (
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-mukstagram-primary to-mukstagram-accent flex items-center justify-center text-white font-semibold border-2 border-mukstagram-border">
                      {conversation.participant.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-sm ${conversation.unread_count > 0 ? 'font-semibold' : ''}`}>
                    {conversation.participant.username}
                  </p>
                  <div className={`text-sm flex items-center gap-1 ${conversation.unread_count > 0 ? 'font-semibold' : 'text-gray-500'}`}>
                    {conversation.last_message ? (
                      <>
                        <span>
                          {conversation.last_message.content.length > 40 
                            ? conversation.last_message.content.substring(0, 40) + '...' 
                            : conversation.last_message.content}
                        </span>
                        <span>·</span>
                        <RelativeTime 
                          date={conversation.last_message.created_at}
                          className="text-xs text-gray-500"
                          updateInterval={30000}
                        />
                      </>
                    ) : (
                      '새 대화를 시작하세요'
                    )}
                  </div>
                </div>
                {conversation.unread_count > 0 && (
                  <div className="w-2 h-2 bg-instagram-accent rounded-full"></div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Window (Full screen on mobile) */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col w-full">
          {/* Chat Header */}
          <div className="p-3 md:p-4 border-b border-instagram-border flex items-center">
            {/* Back button for mobile */}
            <button 
              onClick={() => {
                setSelectedConversation(null);
                setActiveConversation(null);
              }}
              className="md:hidden mr-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <Link to={`/profile/${selectedConversation.participant.username}`} className="flex-1 flex items-center gap-2 md:gap-3">
              {(user && user.username === selectedConversation.participant.username ? user.profile_picture : selectedConversation.participant.profile_picture) ? (
                <img
                  key={`header-${updateKey}`}
                  src={getImageUrl(user && user.username === selectedConversation.participant.username ? user.profile_picture : selectedConversation.participant.profile_picture)}
                  alt={selectedConversation.participant.username}
                  className="w-8 h-8 md:w-10 md:h-10 object-cover border border-mukstagram-border"
                />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-mukstagram-primary to-mukstagram-accent flex items-center justify-center text-white font-semibold text-sm md:text-base border border-mukstagram-border">
                  {selectedConversation.participant.username?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-sm">{selectedConversation.participant.username}</p>
              </div>
            </Link>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
            {messages.length === 0 ? (
              /* Profile Info */
              <div className="text-center py-8">
                {(user && user.username === selectedConversation.participant.username ? user.profile_picture : selectedConversation.participant.profile_picture) ? (
                  <img
                    key={`profile-${updateKey}`}
                    src={getImageUrl(user && user.username === selectedConversation.participant.username ? user.profile_picture : selectedConversation.participant.profile_picture)}
                    alt={selectedConversation.participant.username}
                    className="w-24 h-24 object-cover mx-auto mb-4 border-4 border-mukstagram-primary"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-mukstagram-primary to-mukstagram-accent flex items-center justify-center mx-auto mb-4 text-white font-semibold text-2xl border-4 border-mukstagram-primary">
                    {selectedConversation.participant.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <h3 className="font-semibold text-lg">{selectedConversation.participant.username}</h3>
                <p className="text-gray-500">@{selectedConversation.participant.username}</p>
                <Link
                  to={`/profile/${selectedConversation.participant.username}`}
                  className="inline-block mt-4 px-4 py-2 bg-instagram-secondary border border-instagram-border rounded-lg font-semibold text-sm"
                >
                  프로필 보기
                </Link>
                <p className="text-gray-500 text-sm mt-4">
                  {selectedConversation.participant.username}님과 메시지를 주고받으세요.
                </p>
              </div>
            ) : (
              /* Chat Messages */
              messages.map((msg, index) => {
                // 마지막 메시지에만 시간 표시
                const showTime = index === messages.length - 1;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${msg.is_own ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end gap-1 md:gap-2 max-w-[85%] md:max-w-[70%] ${msg.is_own ? 'flex-row-reverse' : ''}`}>
                      {!msg.is_own && (
                        <>
                          {(user && user.username === msg.sender.username ? user.profile_picture : msg.sender.profile_picture) ? (
                            <img
                              key={`msg-${updateKey}-${msg.id}`}
                              src={getImageUrl(user && user.username === msg.sender.username ? user.profile_picture : msg.sender.profile_picture)}
                              alt={msg.sender.username}
                              className="w-6 h-6 md:w-8 md:h-8 object-cover border border-mukstagram-border"
                            />
                          ) : (
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-mukstagram-primary to-mukstagram-accent flex items-center justify-center text-white font-semibold text-xs border border-mukstagram-border">
                              {msg.sender.username?.[0]?.toUpperCase()}
                            </div>
                          )}
                        </>
                      )}
                      <div>
                        <div
                          className={`px-3 py-2 md:px-4 rounded-2xl ${
                            msg.is_own
                              ? 'bg-instagram-accent text-white'
                              : 'bg-gray-100 text-black'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        {showTime && (
                          <div className="mt-1 px-2">
                            <RelativeTime 
                              date={msg.created_at}
                              className="text-xs text-gray-500"
                              updateInterval={30000}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {/* 스크롤 참조 요소 */}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-3 md:p-4 border-t border-instagram-border">
            <form className="flex items-center gap-2 md:gap-3" onSubmit={handleSendMessage}>
              <input
                ref={inputRef}
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  // Mac에서 엔터키 처리 개선
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    if (messageText.trim() && !sending) {
                      handleSendMessage(e as React.FormEvent);
                    }
                  }
                }}
                onFocus={() => {
                  // 입력창 포커스 시에도 읽음 처리
                  if (selectedConversation) {
                    setConversations(prev => prev.map(conv => 
                      conv.id === selectedConversation.id 
                        ? { ...conv, unread_count: 0 }
                        : conv
                    ));
                  }
                }}
                placeholder="메시지..."
                className="flex-1 px-3 py-2 md:px-4 bg-gray-100 rounded-full outline-none focus:bg-gray-200 text-sm md:text-base"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!messageText.trim() || sending}
                className={`px-4 py-2 md:px-6 rounded-full font-semibold text-sm transition-colors ${
                  messageText.trim() && !sending
                    ? 'bg-instagram-accent text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {sending ? '전송 중...' : '보내기'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Empty State - Show on desktop always, on mobile only when there are conversations */
        <>
          {conversations.length > 0 ? (
            <div className="hidden md:flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 border-2 border-black rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-light mb-2">내 메시지</h2>
                <p className="text-gray-500 mb-4">친구나 그룹에 비공개 사진과 메시지를 보내보세요</p>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default Messages;