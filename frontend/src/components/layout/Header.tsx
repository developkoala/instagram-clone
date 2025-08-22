import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../../hooks/useAuth";
import { useWebSocket } from '../../hooks/useWebSocket';
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
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 스크롤 시 헤더 숨김/표시
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        // 위로 스크롤 또는 상단 근처
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // 아래로 스크롤
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // 알림 구독
  useEffect(() => {
    if (user) {
      const handleNotification = () => {
        setHasNewNotification(true);
      };

      const handleChatMessage = (message: { message: { sender?: { username: string }; content: string; is_own: boolean }; conversation_id: string; [key: string]: unknown }) => {
        // 현재 활성 대화가 아니고, 본인이 보낸 메시지가 아닐 때만 알림 표시
        if (message.conversation_id !== activeConversationId && !message.message?.is_own) {
          setHasNewMessage(true);
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
    <header className={`fixed w-full top-0 z-50 bg-white border-b border-muksta-border shadow-sm transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="max-w-5xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-1 sm:space-x-3 group">
            <span className="text-lg sm:text-2xl transition-transform group-hover:rotate-12">🍴</span>
            <span className="hidden sm:inline text-2xl transition-transform group-hover:scale-110">🍽️</span>
            <span className="hidden sm:inline text-2xl transition-transform group-hover:-rotate-12">🔪</span>
            <span className="text-lg sm:text-2xl font-bold muksta-text-gradient ml-1 sm:ml-2">먹스타그램</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block">
            <SearchBar />
          </div>

          {/* Navigation Icons */}
          <nav className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
            <Link to="/" className="hover:scale-110 transition-all group relative p-1 sm:p-0" title="맛피드">
              <span className="text-xl sm:text-2xl">🏠</span>
              <span className="hidden sm:block absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-muksta-dark">맛피드</span>
            </Link>

            <Link 
              to="/messages" 
              className="hover:scale-110 transition-all group relative p-1 sm:p-0"
              onClick={() => setHasNewMessage(false)}
              title="맛톡"
            >
              <span className="text-xl sm:text-2xl">💬</span>
              {hasNewMessage && (
                <div className="absolute top-0 right-0 sm:-top-1 sm:-right-1 w-2 h-2 bg-muksta-red rounded-full"></div>
              )}
              <span className="hidden sm:block absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-muksta-dark">맛톡</span>
            </Link>

            <button 
              onClick={() => user ? setShowCreatePost(true) : navigate('/login')}
              className="hover:scale-110 transition-all group relative p-1 sm:p-0"
              title="먹로그 작성"
            >
              <span className="text-xl sm:text-2xl">✏️</span>
              <span className="hidden sm:block absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-muksta-dark">먹로그 작성</span>
            </button>

            <Link to="/explore" className="hover:scale-110 transition-all group relative p-1 sm:p-0" title="맛집 탐험">
              <span className="text-xl sm:text-2xl">🧭</span>
              <span className="hidden sm:block absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-muksta-dark">맛집 탐험</span>
            </Link>

            <Link 
              to="/notifications" 
              className="hover:scale-110 transition-all group relative p-1 sm:p-0"
              onClick={() => setHasNewNotification(false)}
              title="맛알림"
            >
              <span className="text-xl sm:text-2xl">🔔</span>
              {hasNewNotification && (
                <div className="absolute top-0 right-0 sm:-top-1 sm:-right-1 w-2 h-2 bg-muksta-red rounded-full"></div>
              )}
              <span className="hidden sm:block absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-muksta-dark">맛알림</span>
            </Link>

            {/* Profile Dropdown */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="block w-7 h-7 sm:w-8 sm:h-8 overflow-hidden border-2 border-mukstagram-primary hover:scale-110 transition-transform shadow-md"
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
                  <div className={`w-full h-full bg-gradient-to-br from-muksta-orange to-muksta-red flex items-center justify-center text-sm font-semibold text-white ${user?.profile_picture ? 'hidden' : ''}`}>
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                </button>

                {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-muksta-border py-2">
                  <Link
                    to={`/profile/${user?.username || 'my_account'}`}
                    className="block px-4 py-2 hover:bg-muksta-lightGray transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">👤</span>
                      <span className="text-muksta-dark">맛프로필</span>
                    </div>
                  </Link>

                  <button
                    className="w-full text-left px-4 py-2 hover:bg-muksta-lightGray transition-colors"
                    onClick={() => fileRef.current?.click()}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">📷</span>
                      <span className="text-muksta-dark">프로필 사진 변경</span>
                    </div>
                  </button>

                  <Link
                    to="/settings"
                    className="block px-4 py-2 hover:bg-muksta-lightGray transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">⚙️</span>
                      <span className="text-muksta-dark">설정</span>
                    </div>
                  </Link>

                  <div className="border-t border-muksta-border my-2"></div>

                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 hover:bg-red-50 text-muksta-red transition-colors"
                  >
                    🚪 로그아웃
                  </button>
                </div>
                )}
              </div>
            ) : (
              <Link 
                to="/login" 
                className="text-sm font-semibold text-white bg-muksta-orange px-4 py-2 rounded-xl hover:bg-muksta-red transition-all"
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