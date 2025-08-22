import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dummyStories } from '../../data/dummyData';
import { useAuth } from "../../hooks/useAuth";
import CreatePostModal from '../post/CreatePostModal';
import { getImageUrl } from '../../utils/imageUrl';

const Stories: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreatePost, setShowCreatePost] = useState(false);

  const handleStoryClick = () => {
    // 새 게시물 만들기 모달 열기
    setShowCreatePost(true);
  };

  return (
    <div className="bg-white border border-instagram-border rounded-lg p-4 mb-6">
      <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
        {/* Current user story */}
        <button className="flex-shrink-0" onClick={handleStoryClick}>
          <div className="flex flex-col items-center space-y-1">
            <div className="relative">
              <div className="bg-white p-[2px] border-2 border-muksta-orange">
                {user?.profile_picture ? (
                  <img
                    src={getImageUrl(user.profile_picture) || ''}
                    alt={user?.username || 'me'}
                    className="w-14 h-14 object-cover"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      const sibling = target.nextElementSibling as HTMLElement;
                      if (sibling) sibling.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-14 h-14 bg-gradient-to-br from-muksta-orange to-muksta-red flex items-center justify-center text-lg font-semibold text-white ${user?.profile_picture ? 'hidden' : ''}`}>
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 bg-muksta-orange rounded-full p-1 border-2 border-white">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
            <span className="text-xs truncate w-16 text-center">오늘의 한끼</span>
          </div>
        </button>
        
        {/* Other users' stories */}
        {dummyStories.map((story) => {
          const hasUnviewed = story.unviewed_count > 0;
          return (
            <button 
              key={story.id} 
              className="flex-shrink-0"
              onClick={() => navigate(`/profile/${story.user.username}`)}
            >
              <div className="flex flex-col items-center space-y-1">
                <div className={`relative ${hasUnviewed ? 'p-[2px] bg-gradient-to-tr from-mukstagram-yellow via-muksta-orange to-muksta-red' : 'p-[2px] bg-gray-300'}`}>
                  <div className="bg-white p-[2px]">
                    <img
                      src={story.user.profile_picture}
                      alt={story.user.username}
                      className="w-14 h-14 object-cover"
                    />
                  </div>
                </div>
                <span className="text-xs truncate w-16 text-center">
                  {story.user.username}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
      />
    </div>
  );
};

export default Stories;