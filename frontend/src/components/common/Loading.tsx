import React from 'react';

const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          {/* 음식 아이콘들이 회전하는 애니메이션 */}
          <div className="text-5xl animate-bounce-slow">🍔</div>
          <div className="absolute top-0 left-0 text-5xl animate-spin-slow opacity-50">🍕</div>
          <div className="absolute top-0 left-0 text-5xl animate-pulse-slow opacity-30">🍜</div>
        </div>
        <p className="text-mukstagram-primary font-medium animate-pulse">맛있는 순간을 불러오는 중...</p>
      </div>
    </div>
  );
};

export default Loading;