import React, { useEffect, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface RelativeTimeProps {
  date: string | Date;
  className?: string;
  prefix?: string;
  suffix?: string;
  updateInterval?: number; // 업데이트 간격 (밀리초)
}

/**
 * 실시간으로 업데이트되는 상대 시간 표시 컴포넌트
 * 예: "3분 전", "1시간 전", "어제"
 */
const RelativeTime: React.FC<RelativeTimeProps> = ({
  date,
  className = 'text-xs text-gray-500',
  prefix = '',
  suffix = ' 전',
  updateInterval = 60000 // 기본값: 1분마다 업데이트
}) => {
  const [relativeTime, setRelativeTime] = useState('');

  const updateTime = useCallback(() => {
    try {
      let dateObj: Date;
      if (typeof date === 'string') {
        // UTC 시간 문자열인 경우 'Z'를 추가하여 UTC로 명시
        const dateStr = date.includes('Z') || date.includes('+') ? date : date + 'Z';
        dateObj = new Date(dateStr);
      } else {
        dateObj = date;
      }
      
      const distance = formatDistanceToNow(dateObj, { 
        locale: ko,
        addSuffix: false 
      });
      setRelativeTime(distance);
    } catch (error) {
      console.error('Invalid date:', date, error);
      setRelativeTime('');
    }
  }, [date]);

  useEffect(() => {
    // 초기 시간 설정
    updateTime();

    // 주기적으로 시간 업데이트
    const interval = setInterval(updateTime, updateInterval);

    // 컴포넌트 언마운트 시 인터벌 정리
    return () => clearInterval(interval);
  }, [date, updateInterval, updateTime]);

  if (!relativeTime) return null;

  return (
    <span className={className}>
      {prefix}{relativeTime}{suffix}
    </span>
  );
};

export default RelativeTime;