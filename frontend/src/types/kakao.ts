export interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string; // 경도
  y: string; // 위도
  place_url: string;
  distance: string;
}

export interface KakaoSearchResponse {
  meta: {
    same_name: {
      region: string[];
      keyword: string;
      selected_region: string;
    };
    pageable_count: number;
    total_count: number;
    is_end: boolean;
  };
  documents: KakaoPlace[];
}

export interface SelectedPlace {
  id: string;
  name: string;
  address: string;
  roadAddress?: string;
  category: string;
  phone?: string;
  latitude: number;
  longitude: number;
  url?: string;
}