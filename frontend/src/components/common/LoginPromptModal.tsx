import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ 
  isOpen, 
  onClose, 
  message = "이 기능을 사용하려면 로그인이 필요합니다." 
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    navigate('/login');
  };

  const handleRegister = () => {
    onClose();
    navigate('/register');
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">로그인이 필요해요</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleLogin}
            className="w-full bg-instagram-accent text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
          >
            로그인
          </button>
          
          <button
            onClick={handleRegister}
            className="w-full border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            회원가입
          </button>
        </div>
        
        <button
          onClick={onClose}
          className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
        >
          나중에 하기
        </button>
      </div>
    </div>
  );
};

export default LoginPromptModal;