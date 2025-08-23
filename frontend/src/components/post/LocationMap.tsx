import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Minimize2, ExternalLink } from 'lucide-react';

interface LocationMapProps {
  location: string;
  className?: string;
}

const LocationMap: React.FC<LocationMapProps> = ({ location, className = '' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [placeInfo, setPlaceInfo] = useState<{
    name: string;
    address: string;
    lat: number;
    lng: number;
  } | null>(null);

  // location 문자열에서 장소명과 주소 분리
  const parseLocation = (loc: string) => {
    // "장소명 | 주소" 형식으로 저장되어 있다고 가정
    const parts = loc.split(' | ');
    if (parts.length === 2) {
      return { name: parts[0], address: parts[1] };
    }
    return { name: loc, address: loc };
  };

  useEffect(() => {
    if (!mapRef.current) return;
    
    // 카카오맵 API가 로드되지 않았으면 대기
    if (!window.kakao || !window.kakao.maps) {
      console.warn('Kakao Maps API is not loaded yet');
      return;
    }

    const { name, address } = parseLocation(location);

    // 카카오맵 초기화
    window.kakao.maps.load(() => {
      const geocoder = new window.kakao.maps.services.Geocoder();

      // 주소로 좌표 검색
      geocoder.addressSearch(address, (result: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);

          const mapOption = {
            center: coords,
            level: isExpanded ? 3 : 4, // 확대 시 더 가까이
          };

          const map = new window.kakao.maps.Map(mapRef.current, mapOption);
          setMapInstance(map);

          // 마커 추가
          const marker = new window.kakao.maps.Marker({
            position: coords,
            map: map,
          });

          // 인포윈도우 추가
          const infowindow = new window.kakao.maps.InfoWindow({
            content: `<div style="padding:5px;font-size:12px;">${name}</div>`,
          });
          infowindow.open(map, marker);

          setPlaceInfo({
            name,
            address,
            lat: result[0].y,
            lng: result[0].x,
          });
        } else {
          // 주소 검색 실패 시 키워드 검색 시도
          const ps = new window.kakao.maps.services.Places();
          ps.keywordSearch(location, (data: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
              const place = data[0];
              const coords = new window.kakao.maps.LatLng(place.y, place.x);

              const mapOption = {
                center: coords,
                level: isExpanded ? 3 : 4,
              };

              const map = new window.kakao.maps.Map(mapRef.current, mapOption);
              setMapInstance(map);

              const marker = new window.kakao.maps.Marker({
                position: coords,
                map: map,
              });

              const infowindow = new window.kakao.maps.InfoWindow({
                content: `<div style="padding:5px;font-size:12px;">${place.place_name}</div>`,
              });
              infowindow.open(map, marker);

              setPlaceInfo({
                name: place.place_name,
                address: place.address_name,
                lat: place.y,
                lng: place.x,
              });
            }
          });
        }
      });
    });
  }, [location, isExpanded]);

  // 맵 크기 변경 시 재조정
  useEffect(() => {
    if (mapInstance && isExpanded) {
      setTimeout(() => {
        mapInstance.relayout();
      }, 100);
    }
  }, [isExpanded, mapInstance]);

  // 카카오맵 앱/웹으로 열기
  const openInKakaoMap = () => {
    if (placeInfo) {
      const url = `https://map.kakao.com/link/map/${encodeURIComponent(placeInfo.name)},${placeInfo.lat},${placeInfo.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <>
      {/* 작은 맵 뷰 */}
      <div className={`relative ${className}`}>
        <div 
          ref={mapRef}
          className="w-full h-32 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setIsExpanded(true)}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(true);
          }}
          className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:shadow-lg transition-shadow"
          title="지도 확대"
        >
          <Maximize2 size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            openInKakaoMap();
          }}
          className="absolute bottom-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:shadow-lg transition-shadow"
          title="카카오맵에서 보기"
        >
          <ExternalLink size={16} />
        </button>
      </div>

      {/* 확대된 맵 모달 */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold text-lg">{placeInfo?.name || location}</h3>
                {placeInfo?.address && (
                  <p className="text-sm text-gray-600 mt-1">{placeInfo.address}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={openInKakaoMap}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="카카오맵에서 보기"
                >
                  <ExternalLink size={20} />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="닫기"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 큰 맵 */}
            <div className="relative">
              <div 
                ref={isExpanded ? mapRef : undefined}
                className="w-full h-[60vh]"
              />
            </div>

            {/* 푸터 */}
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={openInKakaoMap}
                className="w-full bg-muksta-orange text-white py-3 rounded-lg hover:bg-muksta-red transition-colors font-medium"
              >
                카카오맵에서 길찾기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LocationMap;