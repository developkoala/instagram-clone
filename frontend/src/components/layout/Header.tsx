import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import CreatePostModal from '../post/CreatePostModal';
import SearchBar from '../common/SearchBar';
import { userService } from '../../services/user.service';
import { getImageUrl } from '../../utils/imageUrl';

const Header: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const { subscribeToNotifications, unsubscribeFromNotifications, subscribeToChatMessage, unsubscribeFromChatMessage, activeConversationId } = useWebSocket();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 알림 구독
  useEffect(() => {
    if (user) {
      const handleNotification = (notification: any) => {
        if (notification.type === 'notification') {
          setHasNewNotification(true);
        }
      };

      const handleChatMessage = (message: any) => {
        if (message.type === 'new_message' || message.type === 'chat_message') {
          // 현재 활성 대화가 아니고, 본인이 보낸 메시지가 아닐 때만 알림 표시
          if (message.conversation_id !== activeConversationId && !message.message?.is_own) {
            setHasNewMessage(true);
          }
        }
      };

      subscribeToNotifications(handleNotification);
      subscribeToChatMessage(handleChatMessage);
      
      return () => {
        unsubscribeFromNotifications(handleNotification);
        unsubscribeFromChatMessage(handleChatMessage);
      };
    }
  }, [user, subscribeToNotifications, unsubscribeFromNotifications, subscribeToChatMessage, unsubscribeFromChatMessage, activeConversationId]);

  // 활성 대화가 설정되면 메시지 알림 제거
  useEffect(() => {
    if (activeConversationId) {
      setHasNewMessage(false);
    }
  }, [activeConversationId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setShowDropdown(false);
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const response = await userService.uploadProfilePicture(f);
      // Get updated user profile to ensure all data is synced
      const profileData = await userService.getCurrentUserProfile();
      // Update user context with complete profile data
      updateUser({ 
        ...profileData,
        profile_picture: response.profile_picture 
      });
      setShowDropdown(false);
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-instagram-border">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="text-2xl font-semibold">
            Instagram
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block">
            <SearchBar />
          </div>

          {/* Navigation Icons */}
          <nav className="flex items-center space-x-5">
            <Link to="/" className="hover:opacity-70">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </Link>

            <Link 
              to="/messages" 
              className="hover:opacity-70 relative"
              onClick={() => setHasNewMessage(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {hasNewMessage && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </Link>

            <button 
              onClick={() => user ? setShowCreatePost(true) : navigate('/login')}
              className="hover:opacity-70"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>

            <Link to="/explore" className="hover:opacity-70">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </Link>

            <Link 
              to="/notifications" 
              className="hover:opacity-70 relative"
              onClick={() => setHasNewNotification(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {hasNewNotification && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </Link>

            {/* Profile Dropdown */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="block w-8 h-8 rounded-full overflow-hidden border border-instagram-border hover:scale-110 transition-transform"
                >
                  {user?.profile_picture ? (
                    <img
                      src={getImageUrl(user.profile_picture)}
                      alt={user.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // If image fails to load, show fallback
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const sibling = target.nextElementSibling as HTMLElement;
                        if (sibling) sibling.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-sm font-semibold text-white ${user?.profile_picture ? 'hidden' : ''}`}>
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                </button>

                {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-instagram-border py-2">
                  <Link
                    to={`/profile/${user?.username || 'my_account'}`}
                    className="block px-4 py-2 hover:bg-instagram-lightGray"
                    onClick={() => setShowDropdown(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span>프로필</span>
                    </div>
                  </Link>

                  <button
                    className="w-full text-left px-4 py-2 hover:bg-instagram-lightGray"
                    onClick={() => fileRef.current?.click()}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V8a2 2 0 00-2-2H8l-2 2H4a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>프로필 사진 변경</span>
                    </div>
                  </button>

                  <Link
                    to="/settings"
                    className="block px-4 py-2 hover:bg-instagram-lightGray"
                    onClick={() => setShowDropdown(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>설정</span>
                    </div>
                  </Link>

                  <div className="border-t border-instagram-border my-2"></div>

                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 hover:bg-instagram-lightGray"
                  >
                    로그아웃
                  </button>
                </div>
                )}
              </div>
            ) : (
              <Link 
                to="/login" 
                className="text-sm font-semibold text-instagram-accent hover:text-blue-700"
              >
                로그인
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal 
        isOpen={showCreatePost} 
        onClose={() => setShowCreatePost(false)} 
      />
      {/* Hidden file input for profile picture upload */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
    </header>
  );
};

export default Header;