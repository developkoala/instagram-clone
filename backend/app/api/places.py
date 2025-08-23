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
    category_group_code: Optional[str] = Query("FD6,CE7", description="카테고리 그룹 코드"),
    size: int = Query(10, description="검색 결과 개수", le=15)
):
    """
    카카오 지도 API를 통한 장소 검색
    
    카테고리 코드:
    - FD6: 음식점
    - CE7: 카페
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://dapi.kakao.com/v2/local/search/keyword.json",
                params={
                    "query": query,
                    "category_group_code": category_group_code,
                    "size": size
                },
                headers={
                    "Authorization": f"KakaoAK {KAKAO_API_KEY}"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"카카오 API 오류: {response.text}"
                )
            
            return response.json()
            
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