import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "../../hooks/useAuth";
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
          to="/notifications"
          className={`flex items-center justify-center w-full h-full ${
            isActive('/notifications') ? 'text-instagram-dark' : 'text-instagram-gray'
          }`}
        >
          <svg className="w-6 h-6" fill={isActive('/notifications') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isActive('/notifications') ? 2 : 1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
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