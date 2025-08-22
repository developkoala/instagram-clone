import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../../types';
import PostCard from '../../components/post/PostCard';
import Stories from '../../components/home/Stories';
import Loading from '../../components/common/Loading';
import PostModal from '../../components/post/PostModal';
import { postService } from '../../services/post.service';
import { userService } from '../../services/user.service';
import { useAuth } from "../../hooks/useAuth";
import { getImageUrl } from '../../utils/imageUrl';
import { useToast } from '../../hooks/useToast';

const Feed: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [sidebarSuggestions, setSidebarSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsPosition, setSuggestionsPosition] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadFeed();
    if (isAuthenticated) {
      loadSidebarSuggestions();
    }
  }, [isAuthenticated]);

  // 게시물이 로드된 후 추천 사용자 자동 로드
  useEffect(() => {
    if (isAuthenticated && posts.length > 3 && !showSuggestions && suggestedUsers.length === 0) {
      // 1초 후에 추천 사용자 로드
      const timer = setTimeout(() => {
        loadSuggestedUsers();
      }, 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, isAuthenticated, showSuggestions, suggestedUsers.length]);

  const loadSidebarSuggestions = async () => {
    try {
      // 사이드바용 추천 사용자 5명 가져오기 (팔로우하지 않은 사용자만)
      const response = await userService.getSuggestedUsers(5);
      setSidebarSuggestions(response.users);
    } catch (err) {
      console.error('Failed to load sidebar suggestions:', err);
    }
  };

  const loadSuggestedUsers = async () => {
    setLoadingSuggestions(true);
    try {
      // 추천 사용자를 가져옴 (팔로우하지 않은 사용자만)
      const response = await userService.getSuggestedUsers(10);
      setSuggestedUsers(response.users);
      setShowSuggestions(true);
      // 랜덤 위치 설정 (3~8번째 게시물 사이)
      setSuggestionsPosition(Math.floor(Math.random() * 6) + 3);
    } catch (err) {
      showToast('추천 사용자를 불러오지 못했습니다.', 'error');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleFollowUser = async (userId: string, username: string, fromSidebar = false) => {
    try {
      await userService.followUser(userId);
      showToast(`${username}님을 팔로우했습니다.`, 'success');
      // 팔로우 후 피드 새로고침
      loadFeed();
      
      if (fromSidebar) {
        // 사이드바 추천 목록에서 제거하고 새로운 추천 가져오기
        setSidebarSuggestions(prev => prev.filter(u => u.id !== userId));
        // 목록이 비어있으면 새로운 추천 로드
        if (sidebarSuggestions.length <= 1) {
          loadSidebarSuggestions();
        }
      } else {
        // 메인 추천 목록에서 제거
        setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
        if (suggestedUsers.length <= 1) {
          setShowSuggestions(false);
        }
      }
    } catch (err) {
      showToast('팔로우에 실패했습니다.', 'error');
    }
  };

  const loadFeed = async () => {
    try {
      const limit = 10;
      // getFeed는 이미 비로그인 상태도 지원함
      const data = await postService.getFeed(1, limit);
      setPosts(data);
      setPage(1);
      setHasMore(data.length === limit);
    } catch (err: any) {
      setError('피드를 불러오지 못했습니다');
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    try {
      const nextPage = page + 1;
      const limit = 10;
      const data = await postService.getFeed(nextPage, limit);
      setPosts((prev) => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(data.length === limit);
    } catch (e) {
      // ignore incremental errors
    } finally {
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      });
    }, { rootMargin: '200px 0px' });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelRef.current, page, hasMore]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="max-w-2xl mx-auto pt-6 px-4 md:px-0">
      <div className="md:flex md:space-x-6">
        {/* Main Feed */}
        <div className="flex-1">
          {/* Stories - Only show when authenticated */}
          {isAuthenticated && <Stories />}

          {/* Posts */}
          {error && (
            <div className="bg-white border border-instagram-border rounded-lg p-8 text-center mb-6">
              <p className="text-instagram-gray">{error}</p>
              <button
                onClick={loadFeed}
                className="mt-4 text-instagram-accent font-semibold"
              >
                다시 시도
              </button>
            </div>
          )}

          {posts.length === 0 && !error ? (
            isAuthenticated ? (
              <>
                <div className="bg-white border border-instagram-border rounded-lg p-8 text-center">
                  <h2 className="text-2xl font-light mb-2">Muksta에 오신 것을 환영합니다</h2>
                  <p className="text-instagram-gray mb-4">
                    사람들을 팔로우하면 그들이 게시한 사진과 동영상을 여기서 볼 수 있습니다.
                  </p>
                  <button 
                    onClick={loadSuggestedUsers}
                    disabled={loadingSuggestions}
                    className="btn-primary"
                  >
                    {loadingSuggestions ? '불러오는 중...' : '팔로우할 사람 찾기'}
                  </button>
                </div>

                {/* 추천 사용자 목록 */}
                {showSuggestions && suggestedUsers.length > 0 && (
                  <div className="bg-white border border-instagram-border rounded-lg mt-4 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-mukstagram-dark">🍽️ 맛집 헌터 추천</h3>
                      <button 
                        onClick={() => setShowSuggestions(false)}
                        className="text-sm text-instagram-gray hover:text-black"
                      >
                        닫기
                      </button>
                    </div>
                    <div className="space-y-4">
                      {suggestedUsers.map((suggestedUser) => (
                        <div key={suggestedUser.id} className="flex items-center">
                          <Link to={`/profile/${suggestedUser.username}`} className="flex items-center flex-1">
                            <div className="w-10 h-10 overflow-hidden mr-3 border-2 border-mukstagram-border">
                              {suggestedUser.profile_picture ? (
                                <img 
                                  src={getImageUrl(suggestedUser.profile_picture)}
                                  alt={suggestedUser.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-gray-500">
                                    {suggestedUser.username[0].toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{suggestedUser.username}</p>
                              {suggestedUser.bio && (
                                <p className="text-xs text-instagram-gray truncate">{suggestedUser.bio}</p>
                              )}
                            </div>
                          </Link>
                          <button
                            onClick={() => handleFollowUser(suggestedUser.id, suggestedUser.username)}
                            className="text-instagram-accent text-sm font-semibold hover:text-blue-700"
                          >
                            팔로우
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white border border-instagram-border rounded-lg p-8 text-center">
                <p className="text-instagram-gray">게시물이 없습니다.</p>
              </div>
            )
          ) : (
            posts.map((post, index) => (
              <React.Fragment key={post.id}>
                <PostCard 
                  post={post} 
                  onClick={() => setSelectedPost(post)}
                />
                {/* 랜덤 위치에 추천 사용자 섹션 삽입 */}
                {isAuthenticated && showSuggestions && suggestedUsers.length > 0 && index === suggestionsPosition && (
                  <div className="bg-white border border-instagram-border rounded-lg my-6 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">추천</h3>
                      <button 
                        onClick={() => setShowSuggestions(false)}
                        className="text-sm text-instagram-gray hover:text-black"
                      >
                        닫기
                      </button>
                    </div>
                    <div className="space-y-4">
                      {suggestedUsers.slice(0, 5).map((suggestedUser) => (
                        <div key={suggestedUser.id} className="flex items-center">
                          <Link to={`/profile/${suggestedUser.username}`} className="flex items-center flex-1">
                            <div className="w-10 h-10 overflow-hidden mr-3 border-2 border-mukstagram-border">
                              {suggestedUser.profile_picture ? (
                                <img 
                                  src={getImageUrl(suggestedUser.profile_picture)}
                                  alt={suggestedUser.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-gray-500">
                                    {suggestedUser.username[0].toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{suggestedUser.username}</p>
                              {suggestedUser.bio && (
                                <p className="text-xs text-instagram-gray truncate">{suggestedUser.bio}</p>
                              )}
                            </div>
                          </Link>
                          <button
                            onClick={() => handleFollowUser(suggestedUser.id, suggestedUser.username)}
                            className="text-instagram-accent text-sm font-semibold hover:text-blue-700"
                          >
                            팔로우
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))
          )}
          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} />
          {isFetchingMore && (
            <div className="py-6">
              <Loading />
            </div>
          )}
        </div>

        {/* Sidebar - Desktop Only, Show only when authenticated */}
        {isAuthenticated && (
          <aside className="hidden lg:block w-80">
            <div className="sticky top-20">
              {/* User Info */}
              <div className="flex items-center space-x-4 mb-6">
                <Link 
                  to={`/profile/${user?.username || 'my_account'}`}
                  className="block w-14 h-14 overflow-hidden bg-gradient-to-br from-mukstagram-primary to-mukstagram-accent flex-shrink-0 border-2 border-mukstagram-primary"
                >
                  {user?.profile_picture ? (
                    <img 
                      src={getImageUrl(user.profile_picture)}
                      alt={user?.username || 'me'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const sibling = target.nextElementSibling as HTMLElement;
                        if (sibling) sibling.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center text-lg font-semibold text-white ${user?.profile_picture ? 'hidden' : ''}`}>
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                </Link>
                <div className="flex-1">
                  <Link to={`/profile/${user?.username || 'my_account'}`} className="font-semibold hover:underline">
                    {user?.username || 'me'}
                  </Link>
                  <p className="text-sm text-instagram-gray">{user?.email || ''}</p>
                </div>
              </div>

              {/* Suggestions */}
              {sidebarSuggestions.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-mukstagram-dark">
                      🍽️ 맛집 헌터 추천
                    </h3>
                    <Link 
                      to="/explore/people/suggested"
                      className="text-xs font-semibold hover:text-instagram-gray"
                    >
                      모두 보기
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {sidebarSuggestions.map((suggestedUser) => (
                      <div key={suggestedUser.id} className="flex items-center">
                        <Link 
                          to={`/profile/${suggestedUser.username}`}
                          className="w-8 h-8 overflow-hidden mr-3 flex-shrink-0 border border-mukstagram-border"
                        >
                          {suggestedUser.profile_picture ? (
                            <img 
                              src={getImageUrl(suggestedUser.profile_picture)} 
                              alt={suggestedUser.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-mukstagram-primary to-mukstagram-accent flex items-center justify-center">
                              <span className="text-xs font-semibold text-white">
                                {suggestedUser.username[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/profile/${suggestedUser.username}`}
                            className="text-sm font-semibold hover:underline block truncate"
                          >
                            {suggestedUser.username}
                          </Link>
                          <p className="text-xs text-instagram-gray truncate">
                            {suggestedUser.followers_count > 0 
                              ? `팔로워 ${suggestedUser.followers_count}명` 
                              : '회원님을 위한 추천'}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleFollowUser(suggestedUser.id, suggestedUser.username, true)}
                          className="text-mukstagram-primary text-xs font-semibold hover:text-mukstagram-accent ml-2"
                        >
                          팔로우
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </aside>
        )}
      </div>
      
      {/* Post Modal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
      
      {/* Footer - Moved to bottom */}
      <footer className="mt-12 pb-8">
        <div className="text-xs text-instagram-gray space-y-1 text-center">
          <div className="space-x-1">
            <a href="#" className="hover:underline">소개</a>
            <span>·</span>
            <a href="#" className="hover:underline">도움말</a>
            <span>·</span>
            <a href="#" className="hover:underline">홍보 센터</a>
            <span>·</span>
            <a href="#" className="hover:underline">API</a>
            <span>·</span>
            <a href="#" className="hover:underline">채용</a>
            <span>·</span>
            <a href="#" className="hover:underline">개인정보처리방침</a>
          </div>
          <p className="uppercase">© 2025 Muksta Clone</p>
        </div>
      </footer>
    </div>
  );
};

export default Feed;