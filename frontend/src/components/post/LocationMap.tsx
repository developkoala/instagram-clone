import React from 'react';
import { ExternalLink, MapPin } from 'lucide-react';

interface LocationMapProps {
  location: string;
  className?: string;
}

const LocationMap: React.FC<LocationMapProps> = ({ location, className = '' }) => {
  // location 문자열에서 장소명과 주소 분리
  const parseLocation = (loc: string) => {
    // "장소명 | 주소" 형식으로 저장되어 있다고 가정
    const parts = loc.split(' | ');
    if (parts.length === 2) {
      return { name: parts[0], address: parts[1] };
    }
    return { name: loc, address: loc };
  };

  const { name, address } = parseLocation(location);

  // 카카오맵에서 검색 (주소만 사용)
  const openInKakaoMap = () => {
    // "장소명 | 주소" 형식인 경우 주소만 추출
    const searchText = address !== name ? address : location;
    const searchQuery = encodeURIComponent(searchText);
    window.open(`https://map.kakao.com/link/search/${searchQuery}`, '_blank');
  };

  return (
    <div className={`${className}`}>
      <div 
        className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={openInKakaoMap}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-muksta-orange/10 rounded-lg">
            <MapPin className="text-muksta-orange" size={20} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{name}</p>
            {name !== address && (
              <p className="text-xs text-gray-600 mt-1">{address}</p>
            )}
            <p className="text-xs text-muksta-orange mt-2 flex items-center gap-1">
              <ExternalLink size={12} />
              카카오맵에서 보기
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationMap;