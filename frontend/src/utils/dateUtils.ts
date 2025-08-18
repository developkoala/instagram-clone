export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
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