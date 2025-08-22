import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../../types';
import ImageCarousel from './ImageCarousel';
import { useAuth } from "../../hooks/useAuth";
import { postService } from '../../services/post.service';
import { useToast } from '../../hooks/useToast';
import LoginPromptModal from '../common/LoginPromptModal';
import { getImageUrl } from '../../utils/imageUrl';

interface PostCardProps {
  post: Post;
  onUpdate?: (post: Post) => void;
  onClick?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  const [liked, setLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showHeart, setShowHeart] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const [forceUpdate, setForceUpdate] = useState(0);

  // 프로필 이미지 변경 감지
  useEffect(() => {
    const handleProfilePictureUpdate = () => {
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    };
  }, []);

  const handleLike = async () => {
    if (!isAuthenticated) {
      setLoginPromptMessage('👍 맛있다고 표시하려면 로그인이 필요합니다.');
      setShowLoginPrompt(true);
      return;
    }
    try {
      if (liked) {
        const res = await postService.unlikePost(post.id);
        setLiked(res.is_liked);
        setLikesCount(res.likes_count);
      } else {
        const res = await postService.likePost(post.id);
        setLiked(res.is_liked);
        setLikesCount(res.likes_count);
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 1000);
      }
    } catch (error: any) {
      console.error('Like/Unlike error:', error);
      if (error.response?.status === 400) {
        // 이미 좋아요한 경우 상태 동기화
        if (error.response?.data?.detail === 'Already liked this post') {
          setLiked(true);
        } else if (error.response?.data?.detail === 'Not liked this post') {
          setLiked(false);
        }
      } else if (error.code === 'ERR_NETWORK') {
        showToast('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.', 'error');
      } else {
        showToast('요청을 처리하지 못했습니다.', 'error');
      }
    }
  };

  const handleDoubleTap = () => {
    if (!isAuthenticated) {
      setLoginPromptMessage('좋아요를 표시하려면 로그인이 필요합니다.');
      setShowLoginPrompt(true);
      return;
    }
    if (!liked) {
      handleLike();
    }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
    
    if (!isAuthenticated) {
      setLoginPromptMessage('댓글을 작성하려면 로그인이 필요합니다.');
      setShowLoginPrompt(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await postService.addComment(post.id, comment);
      setComment('');
      setCommentsCount(commentsCount + 1);
      showToast('댓글이 작성되었습니다.', 'success');
    } catch {
      showToast('댓글 작성에 실패했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
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

  return (
    <article className="bg-gradient-to-br from-white to-mukstagram-secondary border-2 md:border-4 md:rounded-2xl border-mukstagram-border mb-8 shadow-lg hover:shadow-2xl transition-all hover:scale-[1.02] duration-300 overflow-hidden">
      {/* Header */}
      <header className="flex items-center p-3">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${post.user.username}`}>
            <div className="w-8 h-8 overflow-hidden border-2 border-mukstagram-border shadow-sm">
              {(user && user.username === post.user.username ? user.profile_picture : post.user.profile_picture) ? (
                <img
                  src={getImageUrl(user && user.username === post.user.username ? user.profile_picture : post.user.profile_picture) || ''}
                  alt={post.user.username}
                  className="w-full h-full object-cover"
                  key={forceUpdate}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-sm font-semibold text-white">
                  {post.user.username[0].toUpperCase()}
                </div>
              )}
            </div>
          </Link>
          <div>
            <div>
              <Link to={`/profile/${post.user.username}`} className="font-bold text-base text-mukstagram-dark hover:text-mukstagram-primary transition-colors">
                {post.user.username}
              </Link>
              <div className="flex items-center gap-1 text-xs text-mukstagram-gray">
                <span>👨‍🍳 맛집 탐험가</span>
              </div>
            </div>
            {post.location && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-mukstagram-gray">{post.location}</p>
                {/* 음식 카테고리 배지 */}
                {post.location.includes('카페') && (
                  <span className="text-xs bg-mukstagram-brown text-white px-2 py-0.5 rounded-full">☕ 카페</span>
                )}
                {(post.location.includes('한식') || post.location.includes('식당')) && (
                  <span className="text-xs bg-mukstagram-green text-white px-2 py-0.5 rounded-full">🍚 한식</span>
                )}
                {post.location.includes('일식') && (
                  <span className="text-xs bg-mukstagram-accent text-white px-2 py-0.5 rounded-full">🍱 일식</span>
                )}
                {(post.location.includes('양식') || post.location.includes('레스토랑')) && (
                  <span className="text-xs bg-mukstagram-primary text-white px-2 py-0.5 rounded-full">🍝 양식</span>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Images */}
      <div className="relative" onDoubleClick={handleDoubleTap} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        <ImageCarousel images={post.images} />
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              className="w-24 h-24 text-white drop-shadow-lg heart-animation"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            <button onClick={handleLike} className="hover:scale-110 transition-transform">
              {liked ? (
                <span className="text-2xl">👍</span>
              ) : (
                <span className="text-2xl opacity-50 hover:opacity-100">👍</span>
              )}
            </button>

            <button 
              onClick={onClick}
              className="hover:opacity-50 transition-opacity"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Likes */}
        {likesCount > 0 && (
          <button className="font-bold text-sm mb-2 hover:opacity-70">
            좋아요 {likesCount.toLocaleString()}개
          </button>
        )}

        {/* Caption */}
        {post.caption && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <Link to={`/profile/${post.user.username}`} className="font-semibold text-sm">
                {post.user.username}
              </Link>
            </div>
            <span className="text-sm whitespace-pre-wrap">{post.caption}</span>
          </div>
        )}

        {/* Comments */}
        {commentsCount > 0 && (
          <button 
            onClick={onClick}
            className="text-sm text-instagram-gray mb-1 block hover:opacity-70 text-left"
          >
            댓글 {commentsCount}개 모두 보기
          </button>
        )}

        {/* Timestamp */}
        <time className="text-xs text-instagram-gray">
          {formatKoreanDate(post.created_at)}
        </time>
      </div>

      {/* Add comment */}
      <div className="border-t border-muksta-border px-4 py-3 flex items-center">
        <input
          type="text"
          placeholder="맛 평가를 남겨주세요..."
          className="flex-1 outline-none text-sm"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleCommentSubmit();
            }
          }}
          disabled={isSubmitting}
        />
        <button 
          onClick={handleCommentSubmit}
          className="text-muksta-orange font-semibold text-sm disabled:opacity-50 hover:text-muksta-red transition-colors" 
          disabled={!comment.trim() || isSubmitting}
        >
          남기기
        </button>
      </div>
      
      {/* 로그인 유도 모달 */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message={loginPromptMessage}
      />
    </article>
  );
};

export default PostCard;