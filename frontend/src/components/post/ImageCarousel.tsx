import React, { useState, useRef } from 'react';
import { PostImage } from '../../types';
import { getImageUrl } from '../../utils/imageUrl';

interface ImageCarouselProps {
  images: PostImage[];
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 최소 스와이프 거리 (픽셀)
  const minSwipeDistance = 50;

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
    setDragOffset(0);
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
    setDragOffset(0);
  };

  // 터치 이벤트 핸들러
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    // 드래그 중 실시간 오프셋 계산
    const diff = currentTouch - touchStart;
    setDragOffset(diff);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < images.length - 1) {
      // 왼쪽으로 스와이프 -> 다음 이미지
      setCurrentIndex(currentIndex + 1);
    } else if (isRightSwipe && currentIndex > 0) {
      // 오른쪽으로 스와이프 -> 이전 이미지
      setCurrentIndex(currentIndex - 1);
    }
    
    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  // 마우스 이벤트 핸들러 (데스크톱에서 드래그 지원)
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setTouchEnd(null);
    setTouchStart(e.clientX);
    setIsDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !touchStart) return;
    
    const currentTouch = e.clientX;
    setTouchEnd(currentTouch);
    
    // 드래그 중 실시간 오프셋 계산
    const diff = currentTouch - touchStart;
    setDragOffset(diff);
  };

  const onMouseUp = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
    
    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-instagram-lightGray flex items-center justify-center">
        <p className="text-instagram-gray">No image</p>
      </div>
    );
  }

  // 한 장의 이미지만 있을 때는 스와이프 없이 단순 표시
  if (images.length === 1) {
    return (
      <div className="relative aspect-square bg-black">
        <img
          src={getImageUrl(images[0].image_url)}
          alt=""
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  // 현재 보이는 이미지의 인덱스 범위 계산 (성능 최적화)
  const visibleRange = 2; // 현재 이미지 양옆 2개씩만 렌더링
  const startIdx = Math.max(0, currentIndex - visibleRange);
  const endIdx = Math.min(images.length - 1, currentIndex + visibleRange);

  return (
    <div 
      ref={containerRef}
      className="relative aspect-square bg-black select-none overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* 이미지 컨테이너 - 가로로 나열 */}
      <div 
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ 
          transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {images.map((image, index) => {
          // 성능 최적화: 보이는 범위 밖의 이미지는 placeholder
          const isInView = index >= startIdx && index <= endIdx;
          
          return (
            <div
              key={image.id}
              className="w-full h-full flex-shrink-0"
            >
              {isInView ? (
                <img
                  src={getImageUrl(image.image_url)}
                  alt=""
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                  loading={index === currentIndex ? "eager" : "lazy"}
                />
              ) : (
                <div className="w-full h-full bg-black" />
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation buttons for desktop */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 hover:bg-opacity-100 hidden md:block"
        disabled={currentIndex === 0}
        style={{ opacity: currentIndex === 0 ? 0.3 : 1 }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-1 hover:bg-opacity-100 hidden md:block"
        disabled={currentIndex === images.length - 1}
        style={{ opacity: currentIndex === images.length - 1 ? 0.3 : 1 }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(index);
              setDragOffset(0);
            }}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex 
                ? 'w-6 h-1.5 bg-white' 
                : 'w-1.5 h-1.5 bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;