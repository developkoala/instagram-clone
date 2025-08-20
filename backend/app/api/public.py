"""
Public API endpoints - No authentication required
"""

from fastapi import APIRouter, Query
from app.utils.database_utils import execute_query

router = APIRouter(prefix="/api/public", tags=["Public"])

@router.get("/search/users")
async def search_users(
    q: str = Query("", description="검색어"),
    limit: int = Query(10, ge=1, le=50)
):
    """사용자 검색 (인증 불필요)"""
    
    if q:
        # 검색어가 있을 때
        search_pattern = f"%{q}%"
        query = """
            SELECT id, username, profile_picture, bio,
                   (SELECT COUNT(*) FROM follows WHERE following_id = users.id) as followers_count
            FROM users
            WHERE username LIKE %s
            ORDER BY 
                CASE 
                    WHEN username LIKE %s THEN 0
                    WHEN username LIKE %s THEN 1
                    ELSE 2
                END,
                followers_count DESC
            LIMIT %s
        """
        
        # 정확한 매칭을 우선순위로 정렬
        exact_pattern = q
        start_pattern = f"{q}%"
        
        users = execute_query(
            query, 
            (search_pattern, exact_pattern, start_pattern, limit)
        )
    else:
        # 검색어가 없을 때 - 전체 사용자를 팔로워 순으로 정렬
        query = """
            SELECT id, username, profile_picture, bio,
                   (SELECT COUNT(*) FROM follows WHERE following_id = users.id) as followers_count
            FROM users
            ORDER BY followers_count DESC, created_at DESC
            LIMIT %s
        """
        users = execute_query(query, (limit,))
    
    result = []
    for user in users:
        user_data = {
            "id": user['id'],
            "username": user['username'],
            "profile_picture": user['profile_picture'],
            "bio": user['bio'],
            "followers_count": user['followers_count']
        }
        
        result.append(user_data)
    
    return {"users": result, "count": len(result)}