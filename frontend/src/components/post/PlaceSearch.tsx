import React, { useState, useEffect, useCallback, useRef } from 'react';
import { KakaoPlace, SelectedPlace } from '../../types/kakao';
import { debounce } from 'lodash';

interface PlaceSearchProps {
  onPlaceSelect: (place: SelectedPlace | null) => void;
  selectedPlace?: SelectedPlace | null;
}

const PlaceSearch: React.FC<PlaceSearchProps> = ({ onPlaceSelect, selectedPlace }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KakaoPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);


  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 장소 검색 API 호출 (백엔드 프록시 사용)
  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 백엔드 API를 통해 카카오 API 호출
      const response = await fetch(
        `/api/places/search?query=${encodeURIComponent(query)}&category_group_code=FD6,CE7&size=10`
      );

      if (!response.ok) {
        throw new Error('검색 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      setSearchResults(data.documents || []);
    } catch (err) {
      console.error('Place search error:', err);
      setError('장소 검색에 실패했습니다.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 디바운스된 검색 함수
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      searchPlaces(query);
    }, 500),
    []
  );

  // 검색어 변경 처리
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // 장소 선택 처리
  const handlePlaceSelect = (place: KakaoPlace) => {
    const selected: SelectedPlace = {
      id: place.id,
      name: place.place_name,
      address: place.address_name,
      roadAddress: place.road_address_name,
      category: place.category_name,
      phone: place.phone,
      latitude: parseFloat(place.y),
      longitude: parseFloat(place.x),
      url: place.place_url,
    };

    onPlaceSelect(selected);
    setSearchQuery(place.place_name);
    setIsOpen(false);
    setSearchResults([]);
  };

  // 선택된 장소 제거
  const handleRemovePlace = () => {
    onPlaceSelect(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  // 카테고리 아이콘 반환
  const getCategoryIcon = (category: string) => {
    if (category.includes('카페')) return '☕';
    if (category.includes('한식')) return '🍚';
    if (category.includes('중식')) return '🥟';
    if (category.includes('일식')) return '🍱';
    if (category.includes('양식')) return '🍝';
    if (category.includes('치킨')) return '🍗';
    if (category.includes('피자')) return '🍕';
    if (category.includes('분식')) return '🍜';
    if (category.includes('술집') || category.includes('주점')) return '🍺';
    if (category.includes('베이커리') || category.includes('빵')) return '🥐';
    return '🍴';
  };

  return (
    <div ref={searchRef} className="relative">
      {/* 검색 입력 필드 */}
      <div className="relative">
        <input
          type="text"
          value={selectedPlace ? selectedPlace.name : searchQuery}
          onChange={handleSearchChange}
          onFocus={() => setIsOpen(true)}
          placeholder="음식점이나 카페를 검색하세요"
          className="w-full px-4 py-3 pl-10 pr-10 border-2 border-muksta-border rounded-xl focus:outline-none focus:border-muksta-orange transition-colors"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">📍</span>
        
        {/* 선택된 장소가 있으면 X 버튼 표시 */}
        {selectedPlace && (
          <button
            type="button"
            onClick={handleRemovePlace}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 선택된 장소 정보 표시 */}
      {selectedPlace && (
        <div className="mt-2 p-3 bg-muksta-cream rounded-lg border border-muksta-border">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-semibold text-muksta-dark flex items-center gap-2">
                <span>{getCategoryIcon(selectedPlace.category)}</span>
                {selectedPlace.name}
              </p>
              <p className="text-sm text-gray-600 mt-1">{selectedPlace.address}</p>
              {selectedPlace.phone && (
                <p className="text-sm text-gray-500 mt-1">📞 {selectedPlace.phone}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 검색 결과 드롭다운 */}
      {isOpen && searchQuery && !selectedPlace && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-muksta-border rounded-xl shadow-lg max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-muksta-orange"></div>
              <p className="mt-2">검색 중...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : searchResults.length > 0 ? (
            <ul className="py-2">
              {searchResults.map((place) => (
                <li key={place.id}>
                  <button
                    type="button"
                    onClick={() => handlePlaceSelect(place)}
                    className="w-full px-4 py-3 hover:bg-muksta-cream transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">
                        {getCategoryIcon(place.category_name)}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold text-muksta-dark">
                          {place.place_name}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {place.address_name}
                        </p>
                        <p className="text-xs text-muksta-orange mt-1">
                          {place.category_name}
                        </p>
                      </div>
                      {place.distance && (
                        <span className="text-xs text-gray-500">
                          {(parseInt(place.distance) / 1000).toFixed(1)}km
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default PlaceSearch;