import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userService } from '../../services/user.service';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getImageUrl } from '../../utils/imageUrl';
import Loading from '../../components/common/Loading';

interface SuggestedUser {
  id: string;
  username: string;
  profile_picture?: string;
  bio?: string;
  followers_count: number;
  is_following: boolean;
}

const SuggestedUsers: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadSuggestedUsers();
  }, [isAuthenticated]);

  const loadSuggestedUsers = async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await userService.getSuggestedUsers(20);
      if (isLoadMore) {
        setUsers(prev => [...prev, ...response.users]);
      } else {
        setUsers(response.users);
      }
      
      // 더 이상 로드할 사용자가 없으면
      if (response.users.length < 20) {
        setHasMore(false);
      }
    } catch (error) {
      showToast('추천 사용자를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleFollowUser = async (userId: string, username: string) => {
    try {
      await userService.followUser(userId);
      showToast(`${username}님을 팔로우했습니다.`, 'success');
      
      // 팔로우한 사용자를 목록에서 제거
      setUsers(prev => prev.filter(u => u.id !== userId));
      
      // 목록이 너무 적어지면 더 로드
      if (users.length <= 5 && hasMore) {
        loadSuggestedUsers(true);
      }
    } catch (error) {
      showToast('팔로우에 실패했습니다.', 'error');
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setPage(prev => prev + 1);
      loadSuggestedUsers(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-instagram-bg flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-instagram-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg border border-instagram-border mb-4">
          <div className="p-4 border-b border-instagram-border">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold">추천</h1>
            </div>
          </div>

          {/* Users List */}
          <div className="p-4">
            {users.length > 0 ? (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center">
                    <Link 
                      to={`/profile/${user.username}`}
                      className="flex items-center flex-1 min-w-0"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden mr-3 flex-shrink-0">
                        {user.profile_picture ? (
                          <img 
                            src={getImageUrl(user.profile_picture)}
                            alt={user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {user.username[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{user.username}</p>
                        {user.bio && (
                          <p className="text-sm text-instagram-gray truncate">{user.bio}</p>
                        )}
                        <p className="text-xs text-instagram-gray">
                          팔로워 {user.followers_count}명
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleFollowUser(user.id, user.username)}
                      className="px-6 py-1.5 bg-instagram-accent text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition"
                    >
                      팔로우
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-instagram-gray">추천할 사용자가 없습니다.</p>
                <p className="text-sm text-instagram-gray mt-2">
                  더 많은 사람들과 연결되면 추천이 표시됩니다.
                </p>
              </div>
            )}

            {/* Load More Button */}
            {hasMore && users.length > 0 && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="text-instagram-accent font-semibold hover:text-blue-700 disabled:opacity-50"
                >
                  {loadingMore ? '로딩 중...' : '더 보기'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-lg border border-instagram-border p-4">
          <h2 className="font-semibold mb-2">추천 기준</h2>
          <p className="text-sm text-instagram-gray">
            회원님이 팔로우하지 않은 사용자 중 인기 있는 계정을 추천해드립니다.
            팔로워 수와 활동량을 기준으로 추천됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuggestedUsers;