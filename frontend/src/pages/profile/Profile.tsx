import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { UserProfile, Post } from '../../types';
import { useAuth } from "../../hooks/useAuth";
import Loading from '../../components/common/Loading';
import PostModal from '../../components/post/PostModal';
import { userService } from '../../services/user.service';
import { postService } from '../../services/post.service';
import { getImageUrl } from '../../utils/imageUrl';

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: authUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [updateKey, setUpdateKey] = useState(0);

  const isOwnProfile = username === authUser?.username;

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const response = await userService.uploadProfilePicture(file);
      
      // 프로필 데이터 새로고침
      const profileData = await userService.getCurrentUserProfile();
      
      // AuthContext 업데이트 (이것이 자동으로 이벤트 발생시킴)
      updateUser({
        ...profileData,
        profile_picture: response.profile_picture
      });
      
    } catch {
      console.error('Failed to upload profile picture:', error);
    }
  };

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username]);

  // 프로필 이미지 변경 감지
  useEffect(() => {
    const handleProfilePictureUpdate = () => {
      setUpdateKey(prev => prev + 1);
    };

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    };
  }, []);


  const loadProfile = async () => {
    if (!username) return;
    
    try {
      setLoading(true);
      try {
        const profileData = await userService.getUserProfile(username);
        setProfile(profileData);
        setIsFollowing(profileData.is_following);
        const userPostsResp = await postService.getUserPosts(username, 1, 12);
        // 변환: 썸네일 카드용 데이터 -> Post 타입으로
        const posts: Post[] = userPostsResp.posts.map((p: any) => ({
          id: p.id,
          caption: '',
          location: '',
          created_at: new Date().toISOString(),
          user: { id: profileData.id, email: '', username: username, full_name: profileData.full_name || '', is_private: false, is_verified: false, created_at: new Date().toISOString() },
          images: [{ id: p.id, image_url: p.images[0]?.image_url || '', position: 0 }],
          likes_count: p.likes_count,
          comments_count: p.comments_count,
          is_liked: false,
        }));
        setUserPosts(posts);
      } catch {
        setError('프로필을 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    } catch {
      setError('프로필을 불러오지 못했습니다');
      setLoading(false);
    }
  };

  const handleFollow = () => {
    if (!profile) return;
    (async () => {
      try {
        if (isFollowing) {
          const res = await userService.unfollowUser(profile.id);
          setIsFollowing(res.is_following);
          setProfile({
            ...profile,
            followers_count: profile.followers_count - 1,
            is_following: res.is_following,
          });
        } else {
          const res = await userService.followUser(profile.id);
          setIsFollowing(res.is_following);
          setProfile({
            ...profile,
            followers_count: profile.followers_count + 1,
            is_following: res.is_following,
          });
        }
      } catch {
        // ignore
      }
    })();
  };


  if (loading) {
    return <Loading />;
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto mt-16 text-center">
        <h2 className="text-2xl font-light mb-2">죄송합니다. 이 페이지를 사용할 수 없습니다.</h2>
        <p className="text-instagram-gray">
          해당 링크가 잘못되었거나 페이지가 삭제되었을 수 있습니다.
        </p>
        <Link to="/" className="text-instagram-accent mt-4 inline-block">
          Muksta으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-16">
      {/* Profile Header */}
      <header className="mb-12">
        <div className="flex flex-col md:flex-row items-center md:items-start">
          {/* Profile Picture */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-4 md:mb-0 md:mr-12 relative">
            {(isOwnProfile && authUser?.profile_picture) || (!isOwnProfile && profile.profile_picture) ? (
              <img
                key={updateKey}
                src={getImageUrl(isOwnProfile ? authUser?.profile_picture : profile.profile_picture)}
                alt={profile.username}
                className="w-full h-full object-cover"
                onError={() => {
                  // 이미지 로드 에러 처리
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <span className="text-3xl text-white font-semibold">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {isOwnProfile && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity flex items-center justify-center group"
                >
                  <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureChange}
                />
              </>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            {/* Username and Actions */}
            <div className="flex flex-col md:flex-row items-center md:items-center mb-4 space-y-4 md:space-y-0">
              <h1 className="text-xl font-light md:mr-8">{profile.username}</h1>
              
              <div className="flex items-center space-x-2">
                {isOwnProfile ? (
                  <>
                    <Link
                      to="/accounts/edit"
                      className="px-4 py-1.5 bg-instagram-secondary border border-instagram-border rounded font-semibold text-sm"
                    >
                      프로필 편집
                    </Link>
                    <button 
                      className="p-2"
                      onClick={() => navigate('/settings')}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleFollow}
                      className={`px-6 py-1.5 rounded font-semibold text-sm ${
                        isFollowing
                          ? 'bg-instagram-secondary border border-instagram-border text-black'
                          : 'bg-instagram-accent text-white'
                      }`}
                    >
                      {isFollowing ? '팔로잉' : '팔로우'}
                    </button>
                    <button 
                      onClick={() => navigate(`/messages?user=${profile.username}`)}
                      className="px-6 py-1.5 bg-instagram-secondary border border-instagram-border rounded font-semibold text-sm hover:bg-gray-100 transition-colors"
                    >
                      메시지
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center md:justify-start space-x-10 mb-4">
              <div>
                게시물 <span className="font-semibold">{profile.posts_count}</span>
              </div>
              <button>
                팔로워 <span className="font-semibold">{profile.followers_count.toLocaleString()}</span>
              </button>
              <button>
                팔로잉 <span className="font-semibold">{profile.following_count.toLocaleString()}</span>
              </button>
            </div>

            {/* Bio */}
            {profile.full_name && (
              <div className="font-semibold">{profile.full_name}</div>
            )}
            {profile.bio && (
              <div className="whitespace-pre-wrap">{profile.bio}</div>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-instagram-link font-semibold"
              >
                {profile.website}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-t border-instagram-border">
        <div className="flex justify-center">
          <button
            className="py-3 px-4 flex items-center space-x-2 border-t -mt-px border-black"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <rect fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" width="18" x="3" y="3"/>
              <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="9.015" x2="9.015" y1="3" y2="21"/>
              <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="14.985" x2="14.985" y1="3" y2="21"/>
              <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="21" x2="3" y1="9.015" y2="9.015"/>
              <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="21" x2="3" y1="14.985" y2="14.985"/>
            </svg>
            <span className="text-xs uppercase tracking-wider font-semibold">게시물</span>
          </button>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="mt-4">
        <div className="grid grid-cols-3 gap-1 md:gap-7">
            {userPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="relative aspect-square overflow-hidden group cursor-pointer"
              >
                <img
                  src={getImageUrl(post.images[0].image_url)}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Failed to load image:', post.images[0].image_url);
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                    // 에러 시 대체 이미지 또는 메시지 표시
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.error-message')) {
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'error-message w-full h-full bg-gray-200 flex items-center justify-center text-gray-500';
                      errorDiv.textContent = '이미지 로드 실패';
                      parent.appendChild(errorDiv);
                    }
                  }}
                />
                {post.images.length > 1 && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-4 h-4 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex items-center space-x-6 text-white">
                    <div className="flex items-center space-x-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">{post.likes_count}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">{post.comments_count}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
};

export default Profile;