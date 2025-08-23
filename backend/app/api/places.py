"""
카카오 지도 API 프록시 엔드포인트
"""
from fastapi import APIRouter, HTTPException, Query
import httpx
import os
from typing import Optional

router = APIRouter(prefix="/api/places", tags=["places"])

# 카카오 API 키 (환경변수에서 가져오기)
KAKAO_API_KEY = os.getenv("KAKAO_API_KEY", "aae8cb52fc2ec33e669fda1f7cc32687")

@router.get("/search")
async def search_places(
    query: str = Query(..., description="검색어"),
    category_group_code: Optional[str] = Query("FD6", description="카테고리 그룹 코드"),
    size: int = Query(10, description="검색 결과 개수", le=15)
):
    """
    카카오 지도 API를 통한 장소 검색
    
    카테고리 코드:
    - FD6: 음식점
    - CE7: 카페
    """
    # 먼저 음식점(FD6)으로 검색, 결과가 없으면 카페(CE7)로 재검색
    try:
        results = []
        
        # 음식점 검색
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://dapi.kakao.com/v2/local/search/keyword.json",
                params={
                    "query": query,
                    "category_group_code": "FD6",
                    "size": size
                },
                headers={
                    "Authorization": f"KakaoAK {KAKAO_API_KEY}"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                results.extend(data.get("documents", []))
            
            # 카페 검색
            response = await client.get(
                "https://dapi.kakao.com/v2/local/search/keyword.json",
                params={
                    "query": query,
                    "category_group_code": "CE7",
                    "size": size
                },
                headers={
                    "Authorization": f"KakaoAK {KAKAO_API_KEY}"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                # 카페 결과 추가 (중복 제거)
                existing_ids = {r["id"] for r in results}
                for doc in data.get("documents", []):
                    if doc["id"] not in existing_ids:
                        results.append(doc)
            
            # 결과를 거리순으로 정렬 (거리 정보가 있는 경우)
            def get_distance(item):
                distance = item.get("distance", "999999")
                if distance and distance != "":
                    try:
                        return int(distance)
                    except:
                        return 999999
                return 999999
            
            results.sort(key=get_distance)
            
            # 최대 size 개수만큼만 반환
            return {
                "documents": results[:size],
                "meta": {
                    "total_count": len(results)
                }
            }
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500,
            detail=f"외부 API 요청 실패: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"서버 오류: {str(e)}"
        )