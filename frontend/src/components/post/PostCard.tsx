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
      setLoginPromptMessage('좋아요를 표시하려면 로그인이 필요합니다.');
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
    } catch {
      showToast('요청을 처리하지 못했습니다.', 'error');
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
    <article className="bg-white border-y md:border md:rounded-lg border-instagram-border mb-6">
      {/* Header */}
      <header className="flex items-center p-3">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${post.user.username}`}>
            <div className="w-8 h-8 rounded-full overflow-hidden">
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
            <Link to={`/profile/${post.user.username}`} className="font-semibold text-sm">
              {post.user.username}
            </Link>
            {post.location && (
              <p className="text-xs text-instagram-gray">{post.location}</p>
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
            <button onClick={handleLike} className="hover:opacity-50 transition-opacity">
              {liked ? (
                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
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
          <button className="font-semibold text-sm mb-2 hover:opacity-70">
            좋아요 {likesCount.toLocaleString()}개
          </button>
        )}

        {/* Caption */}
        {post.caption && (
          <div className="mb-2">
            <Link to={`/profile/${post.user.username}`} className="font-semibold text-sm mr-2">
              {post.user.username}
            </Link>
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
      <div className="border-t border-instagram-border px-3 py-2 flex items-center">
        <input
          type="text"
          placeholder="댓글 달기..."
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
          className="text-instagram-accent font-semibold text-sm disabled:opacity-50" 
          disabled={!comment.trim() || isSubmitting}
        >
          게시
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