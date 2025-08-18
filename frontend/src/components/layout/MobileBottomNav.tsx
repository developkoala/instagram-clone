import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CreatePostModal from '../post/CreatePostModal';
import { getImageUrl } from '../../utils/imageUrl';

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCreatePost, setShowCreatePost] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-instagram-border md:hidden z-50">
      <div className="flex items-center justify-around h-12">
        <Link
          to="/"
          className={`flex items-center justify-center w-full h-full ${
            isActive('/') ? 'text-instagram-dark' : 'text-instagram-gray'
          }`}
        >
          <svg className="w-6 h-6" fill={isActive('/') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        </Link>

        <Link
          to="/explore"
          className={`flex items-center justify-center w-full h-full ${
            isActive('/explore') ? 'text-instagram-dark' : 'text-instagram-gray'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isActive('/explore') ? 2 : 1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </Link>

        <button 
          onClick={() => user ? setShowCreatePost(true) : navigate('/login')}
          className="flex items-center justify-center w-full h-full text-instagram-gray"
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

        <Link
          to="/reels"
          className={`flex items-center justify-center w-full h-full ${
            isActive('/reels') ? 'text-instagram-dark' : 'text-instagram-gray'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isActive('/reels') ? 2 : 1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </Link>

        <Link
          to={`/profile/${user?.username}`}
          className={`flex items-center justify-center w-full h-full ${
            location.pathname.includes('/profile') ? 'text-instagram-dark' : 'text-instagram-gray'
          }`}
        >
          <div className="w-6 h-6 rounded-full overflow-hidden border border-instagram-border">
            {user?.profile_picture ? (
              <img
                src={getImageUrl(user.profile_picture) || ''}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-instagram-lightGray flex items-center justify-center text-xs font-semibold">
                {user?.username?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal 
        isOpen={showCreatePost} 
        onClose={() => setShowCreatePost(false)} 
      />
    </nav>
  );
};

export default MobileBottomNav;