import React, { useEffect, useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { Post } from '../../types';
import { formatDistanceToNow } from '../../utils/dateUtils';
import { useAuth } from "../../hooks/useAuth";
import { postService } from '../../services/post.service';
import { useToast } from '../../hooks/useToast';
import LoginPromptModal from '../common/LoginPromptModal';
import { getImageUrl } from '../../utils/imageUrl';
import { useNavigate } from 'react-router-dom';

interface Comment {
  id: string;
  user: {
    username: string;
    profile_picture?: string;
  };
  content: string;
  created_at: string;
  likes_count: number;
  is_liked: boolean;
}

interface PostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

const PostModal: React.FC<PostModalProps> = ({ post, isOpen, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false); // 모바일에서 댓글 모두 보기 상태
  const { isAuthenticated, user } = useAuth();
  const [forceUpdate, setForceUpdate] = useState(0);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // 모달이 열릴 때 초기값 설정
    setIsLiked(post.is_liked);
    setLikesCount(post.likes_count);
    setCurrentImageIndex(0);
    setShowAllComments(false); // 모달이 열릴 때 댓글 섹션 초기화
    
    (async () => {
      try {
        const list = await postService.getComments(post.id, 1, 20);
        const transformedComments: Comment[] = list.comments.map(comment => ({
          ...comment,
          user: {
            username: comment.user.username,
            profile_picture: comment.user.profile_picture
          },
          likes_count: 0,
          is_liked: false
        }));
        setComments(transformedComments);
      } catch {
        // Comment loading failed - ignore silently
      }
    })();
  }, [post.id, post.is_liked, post.likes_count]);

  // 프로필 이미지 변경 감지
  useEffect(() => {
    const handleProfilePictureUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.profile_picture !== undefined) {
        // 리렌더링 트리거
        setForceUpdate(prev => prev + 1);
      }
    };

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    };
  }, []);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? post.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === post.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      setLoginPromptMessage('좋아요를 표시하려면 로그인이 필요합니다.');
      setShowLoginPrompt(true);
      return;
    }

    try {
      if (isLiked) {
        const res = await postService.unlikePost(post.id);
        setIsLiked(res.is_liked);
        setLikesCount(res.likes_count);
      } else {
        const res = await postService.likePost(post.id);
        setIsLiked(res.is_liked);
        setLikesCount(res.likes_count);
      }
    } catch {
      showToast('요청을 처리하지 못했습니다.', 'error');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCommentSubmit();
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim() || isSubmitting) return;
    
    if (!isAuthenticated) {
      setLoginPromptMessage('댓글을 작성하려면 로그인이 필요합니다.');
      setShowLoginPrompt(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await postService.addComment(post.id, comment);
      // 새 댓글을 리스트에 추가
      const newComment: Comment = {
        id: Date.now().toString(),
        user: {
          username: user?.username || 'Unknown',
          profile_picture: user?.profile_picture
        },
        content: comment,
        created_at: new Date().toISOString(),
        likes_count: 0,
        is_liked: false
      };
      setComments([...comments, newComment]);
      setComment('');
      showToast('댓글이 작성되었습니다.', 'success');
    } catch {
      showToast('댓글 작성에 실패했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        if (diffMinutes === 0) {
          return '방금 전';
        }
        return `${diffMinutes}분 전`;
      }
      return `${diffHours}시간 전`;
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const formatKoreanDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        if (diffMinutes === 0) {
          return '방금 전';
        }
        return `${diffMinutes}분 전`;
      }
      return `${diffHours}시간 전`;
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Desktop Version */}
      <div 
        className="hidden md:flex fixed inset-0 z-50 items-center justify-center bg-black bg-opacity-70"
        onClick={() => {
          // 로그인 유도 모달이 열려있으면 PostModal을 닫지 않음
          if (!showLoginPrompt) {
            onClose();
          }
        }}
      >
        <div 
          className="relative w-full max-w-7xl h-[90vh] mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-full bg-black rounded-lg overflow-hidden">
            {/* 이미지 섹션 */}
            <div className="flex-1 relative bg-black flex items-center justify-center">
            <img
              src={getImageUrl(post.images[currentImageIndex].image_url)}
              alt={`Post ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain cursor-zoom-in"
              onClick={() => setShowImageZoom(true)}
              onError={() => {
                // 이미지 로드 실패 시 조용히 처리
              }}
            />
            
            {/* 이미지 네비게이션 */}
            {post.images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-2 hover:bg-opacity-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-2 hover:bg-opacity-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* 이미지 인디케이터 */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                  {post.images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 댓글 섹션 */}
          <div className="w-[400px] bg-white flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                {(user && user.username === post.user.username ? user.profile_picture : post.user.profile_picture) ? (
                  <img
                    src={getImageUrl(user && user.username === post.user.username ? user.profile_picture : post.user.profile_picture)}
                    alt={post.user.username}
                    className="w-10 h-10 object-cover border-2 border-mukstagram-border"
                    key={forceUpdate}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-muksta-orange to-muksta-red flex items-center justify-center text-sm font-semibold text-white border-2 border-mukstagram-border">
                    {post.user.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p 
                    className="font-semibold text-sm cursor-pointer hover:underline"
                    onClick={() => {
                      onClose();
                      navigate(`/profile/${post.user.username}`);
                    }}
                  >
                    {post.user.username}
                  </p>
                  {post.location && (
                    <p className="text-xs text-gray-500">{post.location}</p>
                  )}
                </div>
              </div>
              {/* 삭제 버튼 (본인 게시물일 때만 표시) */}
              {user && user.username === post.user.username && (
                <button
                  onClick={async () => {
                    if (window.confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
                      try {
                        await postService.deletePost(post.id);
                        showToast('게시물이 삭제되었습니다.', 'success');
                        onClose();
                        window.location.reload();
                      } catch {
                        showToast('게시물 삭제에 실패했습니다.', 'error');
                      }
                    }
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            {/* 캡션 및 댓글 영역 */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* 캡션 */}
              <div className="flex gap-3 mb-4">
                {(user && user.username === post.user.username ? user.profile_picture : post.user.profile_picture) ? (
                  <img
                    src={getImageUrl(user && user.username === post.user.username ? user.profile_picture : post.user.profile_picture)}
                    alt={post.user.username}
                    className="w-8 h-8 object-cover flex-shrink-0 border border-mukstagram-border"
                    key={`${forceUpdate}-caption`}
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-muksta-orange to-muksta-red flex items-center justify-center text-sm font-semibold flex-shrink-0 text-white border border-mukstagram-border">
                    {post.user.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm">
                    <span 
                      className="font-semibold mr-2 cursor-pointer hover:underline"
                      onClick={() => {
                        onClose();
                        navigate(`/profile/${post.user.username}`);
                      }}
                    >
                      {post.user.username}
                    </span>
                    <span className="whitespace-pre-wrap">{post.caption}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(post.created_at))}
                  </p>
                </div>
              </div>

              {/* 댓글들 */}
              <div className="space-y-4">
                {comments.map((c) => (
                  <div className="flex gap-3" key={c.id}>
                    {c.user?.profile_picture ? (
                      <img
                        src={getImageUrl(c.user.profile_picture)}
                        alt={c.user?.username}
                        className="w-8 h-8 object-cover border border-mukstagram-border"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-muksta-orange to-muksta-red flex items-center justify-center text-sm font-semibold text-white border border-mukstagram-border">
                        {c.user?.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm">
                        <span 
                          className="font-semibold mr-2 cursor-pointer hover:underline"
                          onClick={() => {
                            onClose();
                            navigate(`/profile/${c.user?.username}`);
                          }}
                        >
                          {c.user?.username}
                        </span>
                        <span className="whitespace-pre-wrap">{c.content}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatKoreanDate(c.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="border-t">
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={async () => {
                      if (!isAuthenticated) {
                        setLoginPromptMessage('좋아요를 표시하려면 로그인이 필요합니다.');
                        setShowLoginPrompt(true);
                        return;
                      }
                      try {
                        let response;
                        if (isLiked) {
                          response = await postService.unlikePost(post.id);
                        } else {
                          response = await postService.likePost(post.id);
                        }
                        setIsLiked(response.is_liked);
                        setLikesCount(response.likes_count);
                      } catch (error: any) {
                        console.error('Like/Unlike error:', error);
                        console.error('Error response:', error.response?.data);
                        console.error('Error status:', error.response?.status);
                        
                        if (error.response?.status === 400) {
                          const errorDetail = error.response?.data?.detail;
                          console.log('400 Error detail:', errorDetail);
                          
                          // 이미 좋아요한 경우 상태 동기화
                          if (errorDetail === 'Already liked this post') {
                            setIsLiked(true);
                            showToast('이미 좋아요를 누르셨습니다.', 'info');
                          } else if (errorDetail === 'Not liked this post') {
                            setIsLiked(false);
                            showToast('좋아요를 취소할 수 없습니다.', 'info');
                          } else {
                            showToast(errorDetail || '요청을 처리할 수 없습니다.', 'error');
                          }
                        } else if (error.code === 'ERR_NETWORK') {
                          showToast('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.', 'error');
                        } else {
                          showToast('작업에 실패했습니다.', 'error');
                        }
                      }
                    }}
                    className="hover:opacity-70"
                  >
                    <Heart
                      size={24}
                      className={isLiked ? 'fill-red-500 text-red-500' : ''}
                    />
                  </button>
                  <button 
                    onClick={() => {
                      if (!isAuthenticated) {
                        setLoginPromptMessage('댓글을 작성하려면 로그인이 필요합니다.');
                        setShowLoginPrompt(true);
                        return;
                      }
                      const commentInput = document.querySelector('input[placeholder="댓글 달기..."]') as HTMLInputElement;
                      if (commentInput) {
                        commentInput.focus();
                      }
                    }}
                    className="hover:opacity-70"
                  >
                    <MessageCircle size={24} />
                  </button>
                </div>
              </div>
              
              <div className="px-4 pb-2">
                <p className="font-semibold text-sm">
                  좋아요 {likesCount.toLocaleString()}개
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatKoreanDate(post.created_at)}
                </p>
              </div>
            </div>

            {/* 댓글 입력 */}
            <div className="border-t p-4">
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCommentSubmit();
                }}
              >
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onMouseDown={(e) => {
                    if (!isAuthenticated) {
                      e.preventDefault();
                      e.stopPropagation();
                      setLoginPromptMessage('댓글을 작성하려면 로그인이 필요합니다.');
                      setShowLoginPrompt(true);
                    }
                  }}
                  onFocus={(e) => {
                    e.stopPropagation();
                    if (!isAuthenticated) {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAuthenticated) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="댓글 달기..."
                  className="flex-1 outline-none text-sm"
                />
                <button
                  type="submit"
                  className={`text-sm font-semibold ${
                    comment.trim() && !isSubmitting ? 'text-instagram-accent' : 'text-instagram-accent opacity-50'
                  }`}
                  disabled={!comment.trim() || isSubmitting}
                >
                  게시
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Mobile Version */}
      <div className="md:hidden fixed inset-0 z-50 bg-white flex flex-col">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button onClick={onClose} className="p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-semibold">게시물</span>
          <div className="w-6" /> {/* Spacer for centering */}
        </div>

        {/* Mobile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* User Info */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-3">
              {(user && user.username === post.user.username ? user.profile_picture : post.user.profile_picture) ? (
                <img
                  src={getImageUrl(user && user.username === post.user.username ? user.profile_picture : post.user.profile_picture)}
                  alt={post.user.username}
                  className="w-8 h-8 rounded-full object-cover"
                  key={`mobile-${forceUpdate}`}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-sm font-semibold text-white">
                  {post.user.username?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p 
                  className="font-semibold text-sm"
                  onClick={() => {
                    onClose();
                    navigate(`/profile/${post.user.username}`);
                  }}
                >
                  {post.user.username}
                </p>
                {post.location && (
                  <p className="text-xs text-gray-500">{post.location}</p>
                )}
              </div>
            </div>
            {user && user.username === post.user.username && (
              <button
                onClick={async () => {
                  if (window.confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
                    try {
                      await postService.deletePost(post.id);
                      showToast('게시물이 삭제되었습니다.', 'success');
                      onClose();
                      window.location.reload();
                    } catch {
                      showToast('게시물 삭제에 실패했습니다.', 'error');
                    }
                  }
                }}
                className="text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>

          {/* Image Carousel */}
          <div className="relative">
            <img
              src={getImageUrl(post.images[currentImageIndex].image_url)}
              alt={`Post ${currentImageIndex + 1}`}
              className="w-full"
            />
            
            {/* Image Navigation for Mobile */}
            {post.images.length > 1 && (
              <>
                {currentImageIndex > 0 && (
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                {currentImageIndex < post.images.length - 1 && (
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                
                {/* Image Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                  {post.images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <button onClick={handleLike}>
                  <svg 
                    className={`w-6 h-6 transition-colors ${isLiked ? 'text-red-500 fill-current' : ''}`}
                    fill={isLiked ? 'currentColor' : 'none'} 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button onClick={() => document.getElementById('mobile-comment-input')?.focus()}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
                <button>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
                  </svg>
                </button>
              </div>
              <button>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>

            {/* Likes Count */}
            {likesCount > 0 && (
              <p className="font-semibold text-sm mb-2">좋아요 {likesCount.toLocaleString()}개</p>
            )}

            {/* Caption */}
            {post.caption && (
              <div className="mb-2">
                <span className="font-semibold text-sm mr-2">{post.user.username}</span>
                <span className="text-sm">{post.caption}</span>
              </div>
            )}

            {/* View all comments link */}
            {comments.length > 0 && !showAllComments && (
              <button 
                className="text-gray-500 text-sm mb-2"
                onClick={() => setShowAllComments(true)}
              >
                댓글 {comments.length}개 모두 보기
              </button>
            )}

            {/* Comments Preview - show only 2 comments when not expanded */}
            {!showAllComments && comments.slice(0, 2).map((comment) => (
              <div key={comment.id} className="mb-1">
                <span className="font-semibold text-sm mr-2">{comment.user.username}</span>
                <span className="text-sm">{comment.content}</span>
              </div>
            ))}

            {/* Post Time */}
            <p className="text-xs text-gray-500 mt-2">{formatRelativeTime(post.created_at)}</p>
          </div>

          {/* Comments Section - Only show when expanded */}
          {showAllComments && (
            <div className="border-t px-3 py-3">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold">댓글</div>
                <button 
                  onClick={() => setShowAllComments(false)}
                  className="text-gray-500 text-sm"
                >
                  닫기
                </button>
              </div>
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 mb-3">
                  {comment.user.profile_picture ? (
                    <img
                      src={getImageUrl(comment.user.profile_picture)}
                      alt={comment.user.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xs font-semibold text-white">
                      {comment.user.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div>
                      <span className="font-semibold text-sm mr-2">{comment.user.username}</span>
                      <span className="text-sm">{comment.content}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{formatRelativeTime(comment.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Comment Input - Fixed at bottom */}
        <div className="sticky bottom-0 bg-white border-t px-3 py-2">
          <form onSubmit={handleAddComment} className="flex items-center gap-2">
            <input
              id="mobile-comment-input"
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onFocus={(e) => {
                if (!isAuthenticated) {
                  e.preventDefault();
                  setLoginPromptMessage('댓글을 작성하려면 로그인이 필요합니다.');
                  setShowLoginPrompt(true);
                }
              }}
              onClick={(e) => {
                if (!isAuthenticated) {
                  e.preventDefault();
                }
              }}
              placeholder="댓글 달기..."
              className="flex-1 outline-none text-sm py-2 px-3 bg-gray-50 rounded-full"
            />
            {comment.trim() && (
              <button
                type="submit"
                className="text-sm font-semibold text-instagram-accent"
                disabled={!comment.trim() || isSubmitting}
              >
                게시
              </button>
            )}
          </form>
        </div>
      </div>
      
      {/* 로그인 유도 모달 */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message={loginPromptMessage}
      />
      
      {/* 이미지 확대 모달 */}
      {showImageZoom && (
        <div 
          className="fixed inset-0 z-[60] bg-black bg-opacity-90 flex items-center justify-center"
          onClick={() => setShowImageZoom(false)}
        >
          <img
            src={getImageUrl(post.images[currentImageIndex].image_url)}
            alt={`Post ${currentImageIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain cursor-zoom-out"
            onClick={(e) => {
              e.stopPropagation();
              setShowImageZoom(false);
            }}
          />
          {/* 이미지 네비게이션 (확대 모드) */}
          {post.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => 
                    prev === 0 ? post.images.length - 1 : prev - 1
                  );
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-2 hover:bg-opacity-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) => 
                    prev === post.images.length - 1 ? 0 : prev + 1
                  );
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-2 hover:bg-opacity-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default PostModal;