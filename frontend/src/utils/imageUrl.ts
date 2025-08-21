/**
 * 이미지 URL을 절대 URL로 변환
 */
export const getImageUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  
  // 이미 절대 URL인 경우 (http:// 또는 https://로 시작)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Unsplash 이미지는 그대로 반환
    if (url.includes('unsplash.com')) {
      return url;
    }
    return url;
  }
  
  // 상대 경로인 경우 (/uploads/... 등)
  // HTTPS 환경에서는 현재 origin 사용, 아니면 상대 경로 그대로 반환
  if (typeof window !== 'undefined') {
    // 프로필 이미지의 경우 캐시 무효화를 위해 타임스탬프 추가
    if (url.includes('/uploads/profiles/')) {
      return `${url}?t=${Date.now()}`;
    }
    return url;
  }
  
  return url;
};