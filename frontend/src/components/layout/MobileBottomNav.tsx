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

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-muksta-border md:hidden z-50 safe-bottom">
      <div className="flex items-center justify-around h-14">
        <Link
          to="/"
          className={`flex items-center justify-center w-full h-full transition-all ${
            isActive('/') ? 'scale-110' : ''
          }`}
        >
          <span className={`text-2xl ${isActive('/') ? 'drop-shadow-md' : ''}`}>
            {isActive('/') ? '🏠' : '🏘️'}
          </span>
        </Link>

        <Link
          to="/explore"
          className={`flex items-center justify-center w-full h-full transition-all ${
            isActive('/explore') ? 'scale-110' : ''
          }`}
        >
          <span className={`text-2xl ${isActive('/explore') ? 'drop-shadow-md' : ''}`}>
            {isActive('/explore') ? '🧭' : '🔍'}
          </span>
        </Link>

        <button 
          onClick={() => user ? setShowCreatePost(true) : navigate('/login')}
          className="flex items-center justify-center w-full h-full transition-all active:scale-95"
        >
          <span className="text-2xl bg-gradient-to-r from-muksta-orange to-muksta-yellow rounded-lg p-1">
            ➕
          </span>
        </button>

        <Link
          to="/notifications"
          className={`flex items-center justify-center w-full h-full transition-all ${
            isActive('/notifications') ? 'scale-110' : ''
          }`}
        >
          <span className={`text-2xl ${isActive('/notifications') ? 'drop-shadow-md' : ''}`}>
            {isActive('/notifications') ? '🔔' : '🔕'}
          </span>
        </Link>

        <Link
          to={user ? `/profile/${user?.username}` : '/login'}
          className={`flex items-center justify-center w-full h-full transition-all ${
            location.pathname.includes('/profile') ? 'scale-110' : ''
          }`}
        >
          {user?.profile_picture ? (
            <div className={`w-7 h-7 rounded-full overflow-hidden border-2 ${
              location.pathname.includes('/profile') ? 'border-muksta-orange' : 'border-muksta-border'
            }`}>
              <img
                src={getImageUrl(user.profile_picture) || ''}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <span className={`text-2xl ${location.pathname.includes('/profile') ? 'drop-shadow-md' : ''}`}>
              {location.pathname.includes('/profile') ? '👤' : '👥'}
            </span>
          )}
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