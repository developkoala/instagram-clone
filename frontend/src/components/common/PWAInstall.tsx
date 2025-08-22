import React, { useState, useEffect } from 'react';
import { pwaManager } from '../../utils/pwa';

const PWAInstall: React.FC = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // iOS 체크
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // PWA 설치 가능 이벤트 리스너
    const handleInstallAvailable = () => {
      if (!pwaManager.installed) {
        setShowInstallPrompt(true);
      }
    };

    // PWA 업데이트 가능 이벤트 리스너
    const handleUpdateAvailable = () => {
      setShowUpdatePrompt(true);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  const handleInstall = async () => {
    const result = await pwaManager.promptInstall();
    if (result) {
      setShowInstallPrompt(false);
    }
  };

  const handleUpdate = async () => {
    await pwaManager.applyUpdate();
    setShowUpdatePrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // 24시간 동안 다시 표시하지 않음
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // iOS 설치 가이드
  if (isIOS && showInstallPrompt && !pwaManager.installed) {
    return (
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-2xl p-4 z-50 border border-muksta-orange/20">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <img src="/favicon-32x32.png" alt="먹스타그램" className="w-8 h-8 mr-3" />
            <h3 className="font-bold text-gray-900">먹스타그램 설치</h3>
          </div>
          <button
            onClick={() => setShowInstallPrompt(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">
          홈 화면에 추가하여 앱처럼 사용하세요!
        </p>
        
        <div className="bg-muksta-cream rounded-lg p-3 text-sm">
          <p className="font-semibold mb-2">iOS 설치 방법:</p>
          <ol className="space-y-1 text-gray-600">
            <li>1. Safari 하단의 공유 버튼 탭 <span className="inline-block">􀈂</span></li>
            <li>2. "홈 화면에 추가" 선택 <span className="inline-block">􀎞</span></li>
            <li>3. "추가" 탭</li>
          </ol>
        </div>
      </div>
    );
  }

  // 일반 설치 프롬프트
  if (showInstallPrompt && !pwaManager.installed) {
    return (
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-2xl p-4 z-50 border border-muksta-orange/20">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <img src="/favicon-32x32.png" alt="먹스타그램" className="w-8 h-8 mr-3" />
            <h3 className="font-bold text-gray-900">먹스타그램 설치</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          홈 화면에 추가하여 더 빠르고 편리하게 이용하세요!
        </p>
        
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-2">📱</span> 오프라인 지원
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-2">🔔</span> 푸시 알림
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="mr-2">⚡</span> 빠른 실행
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleInstall}
            className="flex-1 bg-gradient-to-r from-muksta-orange to-muksta-yellow text-white font-semibold py-2 px-4 rounded-lg hover:shadow-lg transition-shadow"
          >
            설치하기
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            나중에
          </button>
        </div>
      </div>
    );
  }

  // 업데이트 프롬프트
  if (showUpdatePrompt) {
    return (
      <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-muksta-green to-green-500 text-white rounded-xl shadow-xl p-4 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🔄</span>
            <div>
              <h3 className="font-bold">새 버전 사용 가능</h3>
              <p className="text-sm opacity-90">앱을 업데이트하세요</p>
            </div>
          </div>
          <button
            onClick={handleUpdate}
            className="bg-white text-muksta-green font-semibold py-1 px-3 rounded-lg text-sm"
          >
            업데이트
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default PWAInstall;