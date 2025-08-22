/**
 * UTC 시간을 한국 시간으로 변환
 */
export function toKST(dateString: string | Date): Date {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // 서버에서 이미 KST로 저장하고 있지만, 
  // 프론트엔드에서 UTC로 해석할 수 있으므로 명시적으로 처리
  if (typeof dateString === 'string' && !dateString.includes('Z') && !dateString.includes('+')) {
    // ISO 8601 형식이지만 타임존 정보가 없으면 KST로 가정
    return new Date(dateString + '+09:00');
  }
  
  return date;
}

export function formatDistanceToNow(date: Date | string): string {
  const targetDate = toKST(date);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
  
  if (seconds < 60) {
    return `${seconds}초`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}분`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}시간`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}일`;
  }
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks}주`;
  }
  
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}개월`;
  }
  
  const years = Math.floor(days / 365);
  return `${years}년`;
}