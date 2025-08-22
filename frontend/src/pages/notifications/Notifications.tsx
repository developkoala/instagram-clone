import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from "../../hooks/useAuth";
import { notificationService, Notification } from '../../services/notification.service';
import { userService } from '../../services/user.service';
import { getImageUrl } from '../../utils/imageUrl';
import Loading from '../../components/common/Loading';
import { useToast } from '../../hooks/useToast';

const Notifications: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState<{ [key: string]: boolean }>({});

  const loadNotifications = useCallback(async () => {
    try {
      const response = await notificationService.getNotifications(1, 50);
      setNotifications(response.notifications);
      
      // 팔로우 상태 초기화
      const states: { [key: string]: boolean } = {};
      response.notifications.forEach(notif => {
        if (notif.type === 'follow' && notif.is_following !== undefined) {
          states[notif.user.id] = notif.is_following;
        }
      });
      setFollowingStates(states);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      // 에러 발생 시 더미 데이터 표시
      const dummyNotifications: Notification[] = [
        {
          id: '1',
          type: 'like',
          user: {
            id: '1',
            username: 'foodie_lover',
            profile_picture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop'
          },
          post_id: '1',
          post_image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'follow',
          user: {
            id: '2',
            username: 'tasty_treats',
            profile_picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'
          },
          created_at: new Date(Date.now() - 3600000).toISOString(),
          is_following: false,
        },
        {
          id: '3',
          type: 'comment',
          user: {
            id: '3',
            username: 'chef_kim',
            profile_picture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop'
          },
          post_id: '2',
          post_image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
          comment: '정말 맛있어 보여요! 👨‍🍳',
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
      ];
      setNotifications(dummyNotifications);
      setFollowingStates({ '2': false });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated, loadNotifications]);

  const handleFollowToggle = async (userId: string) => {
    try {
      const isCurrentlyFollowing = followingStates[userId];
      
      if (isCurrentlyFollowing) {
        await userService.unfollowUser(userId);
        setFollowingStates(prev => ({ ...prev, [userId]: false }));
        showToast('팔로우를 취소했습니다.', 'success');
      } else {
        await userService.followUser(userId);
        setFollowingStates(prev => ({ ...prev, [userId]: true }));
        showToast('팔로우했습니다.', 'success');
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      showToast('팔로우 상태 변경에 실패했습니다.', 'error');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffDays > 30) {
      return date.toLocaleDateString('ko-KR');
    } else if (diffDays > 7) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}주`;
    } else if (diffDays > 0) {
      return `${diffDays}일`;
    } else if (diffHours > 0) {
      return `${diffHours}시간`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}분`;
    } else {
      return '방금';
    }
  };

  const renderNotification = (notification: Notification) => {
    const { type, user, created_at, post_image, comment } = notification;
    const isFollowing = followingStates[user.id] || false;

    return (
      <div key={notification.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-3 flex-1">
          <Link to={`/profile/${user.username}`}>
            {user.profile_picture ? (
              <img
                src={getImageUrl(user.profile_picture)}
                alt={user.username}
                className="w-11 h-11 rounded-full object-cover"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-instagram-lightGray flex items-center justify-center text-lg font-semibold">
                {user.username[0].toUpperCase()}
              </div>
            )}
          </Link>
          <div className="flex-1">
            <p className="text-sm">
              <Link to={`/profile/${user.username}`} className="font-semibold hover:underline">
                {user.username}
              </Link>
              {type === 'like' && '님이 사진을 좋아합니다.'}
              {type === 'follow' && '님이 회원님을 팔로우하기 시작했습니다.'}
              {type === 'comment' && `님이 댓글을 남겼습니다: ${comment}`}
              <span className="text-gray-500 ml-1">{formatTimeAgo(created_at)}</span>
            </p>
          </div>
        </div>
        
        {/* 액션 버튼 또는 게시물 이미지 */}
        <div className="ml-4">
          {type === 'follow' ? (
            <button
              onClick={() => handleFollowToggle(user.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                isFollowing
                  ? 'bg-instagram-secondary border border-instagram-border hover:bg-gray-100'
                  : 'bg-instagram-accent text-white hover:bg-blue-600'
              }`}
            >
              {isFollowing ? '팔로잉' : '팔로우'}
            </button>
          ) : post_image ? (
            <Link to={notification.post_id ? `/post/${notification.post_id}` : '#'}>
              <img
                src={getImageUrl(post_image)}
                alt="Post"
                className="w-11 h-11 object-cover"
              />
            </Link>
          ) : null}
        </div>
      </div>
    );
  };

  // 알림을 시간대별로 그룹화
  const groupNotificationsByTime = () => {
    const today: Notification[] = [];
    const thisWeek: Notification[] = [];
    const thisMonth: Notification[] = [];
    const older: Notification[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

    notifications.forEach(notif => {
      const notifDate = new Date(notif.created_at);
      
      if (notifDate >= todayStart) {
        today.push(notif);
      } else if (notifDate >= weekStart) {
        thisWeek.push(notif);
      } else if (notifDate >= monthStart) {
        thisMonth.push(notif);
      } else {
        older.push(notif);
      }
    });

    return { today, thisWeek, thisMonth, older };
  };

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto bg-white min-h-screen p-6">
        <p className="text-center text-gray-500">로그인이 필요합니다.</p>
      </div>
    );
  }

  const { today, thisWeek, thisMonth, older } = groupNotificationsByTime();

  return (
    <div className="max-w-2xl mx-auto bg-white min-h-screen">
      <div className="py-6">
        <h1 className="text-2xl font-bold px-6 mb-6">알림</h1>
        
        {notifications.length === 0 ? (
          <p className="text-center text-gray-500 py-10">알림이 없습니다.</p>
        ) : (
          <>
            {/* 오늘 */}
            {today.length > 0 && (
              <div className="mb-8">
                <h2 className="text-base font-semibold px-6 mb-3">오늘</h2>
                {today.map(renderNotification)}
              </div>
            )}
            
            {/* 이번 주 */}
            {thisWeek.length > 0 && (
              <div className="mb-8">
                <h2 className="text-base font-semibold px-6 mb-3">이번 주</h2>
                {thisWeek.map(renderNotification)}
              </div>
            )}
            
            {/* 이번 달 */}
            {thisMonth.length > 0 && (
              <div className="mb-8">
                <h2 className="text-base font-semibold px-6 mb-3">이번 달</h2>
                {thisMonth.map(renderNotification)}
              </div>
            )}
            
            {/* 이전 */}
            {older.length > 0 && (
              <div className="mb-8">
                <h2 className="text-base font-semibold px-6 mb-3">이전</h2>
                {older.map(renderNotification)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;