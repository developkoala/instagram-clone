import React, { useEffect, useState } from 'react';
import { useToast } from '../../hooks/useToast';
import { CheckCircle, XCircle, MessageCircle, Info, X } from 'lucide-react';

const Toasts: React.FC = () => {
  const { toasts, removeToast } = useToast();
  const [visibleToasts, setVisibleToasts] = useState<string[]>([]);

  useEffect(() => {
    // 새로운 토스트 추가 처리
    const newToastIds = toasts.map(t => t.id).filter(id => !visibleToasts.includes(id));
    newToastIds.forEach(id => {
      setTimeout(() => {
        setVisibleToasts(prev => [...prev, id]);
      }, 10);
    });
    
    // 제거된 토스트 처리
    const currentToastIds = toasts.map(t => t.id);
    setVisibleToasts(prev => prev.filter(id => currentToastIds.includes(id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toasts]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'info':
        // 메시지 아이콘인지 체크
        if (toasts.find(t => t.message.includes('💬'))) {
          return <MessageCircle className="w-5 h-5" />;
        }
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getToastStyles = (type: string, isClickable: boolean = false) => {
    const baseStyles = "px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm flex items-center gap-3 min-w-[300px] max-w-md transition-all duration-300 transform";
    const hoverStyles = isClickable ? "hover:scale-[1.02] hover:shadow-xl" : "";
    
    switch (type) {
      case 'success':
        return `${baseStyles} ${hoverStyles} bg-green-500/90 text-white border border-green-400/30`;
      case 'error':
        return `${baseStyles} ${hoverStyles} bg-red-500/90 text-white border border-red-400/30`;
      case 'info':
        return `${baseStyles} ${hoverStyles} bg-gray-900/90 text-white border border-gray-700/30`;
      default:
        return `${baseStyles} ${hoverStyles} bg-gray-800/90 text-white border border-gray-600/30`;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${getToastStyles(t.type, !!t.onClick)} ${
            visibleToasts.includes(t.id) 
              ? 'translate-x-0 opacity-100' 
              : 'translate-x-full opacity-0'
          } ${t.onClick ? 'cursor-pointer' : ''}`}
          style={{
            animation: visibleToasts.includes(t.id) ? 'slideIn 0.3s ease-out' : ''
          }}
          onClick={() => {
            if (t.onClick) {
              t.onClick();
              removeToast(t.id);
            }
          }}
        >
          <div className="flex-shrink-0">
            {getIcon(t.type)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium leading-relaxed">
              {t.message.replace('💬 ', '')}
            </p>
          </div>
          <button 
            className="flex-shrink-0 ml-4 p-1 rounded-full hover:bg-white/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              removeToast(t.id);
            }}
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Toasts;





