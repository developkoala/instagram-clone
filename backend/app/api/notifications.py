"""
알림 관련 API 엔드포인트
"""

from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from app.dependencies import get_current_user
from app.utils.database_utils import execute_query, format_datetime
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("/")
async def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """사용자 알림 목록 조회"""
    offset = (page - 1) * limit
    
    # 알림 조회 쿼리 - 팔로우, 좋아요, 댓글 알림을 모두 가져옴
    query = """
        SELECT * FROM (
            SELECT 
                'follow' as type,
                f.follower_id as user_id,
                u.username,
                u.profile_picture,
                NULL as post_id,
                NULL as comment_id,
                NULL as comment_content,
                f.created_at as created_at,
                (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = f.follower_id) as is_following
            FROM follows f
            JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = ?
            
            UNION ALL
            
            SELECT 
                'like' as type,
                l.user_id,
                u.username,
                u.profile_picture,
                l.post_id,
                NULL as comment_id,
                NULL as comment_content,
                l.created_at as created_at,
                0 as is_following
            FROM likes l
            JOIN users u ON l.user_id = u.id
            JOIN posts p ON l.post_id = p.id
            WHERE p.user_id = ? AND l.user_id != ?
            
            UNION ALL
            
            SELECT 
                'comment' as type,
                c.user_id,
                u.username,
                u.profile_picture,
                c.post_id,
                c.id as comment_id,
                c.content as comment_content,
                c.created_at as created_at,
                0 as is_following
            FROM comments c
            JOIN users u ON c.user_id = u.id
            JOIN posts p ON c.post_id = p.id
            WHERE p.user_id = ? AND c.user_id != ?
        )
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    """
    
    notifications = execute_query(
        query, 
        (
            current_user['id'], current_user['id'],  # for follow check
            current_user['id'], current_user['id'],  # for likes
            current_user['id'], current_user['id'],  # for comments
            limit, offset
        )
    )
    
    # 포스트 이미지 정보 추가
    result = []
    for idx, notif in enumerate(notifications):
        # 고유한 ID 생성 (타입, 사용자ID, 시간, 포스트ID, 인덱스 조합)
        unique_id_parts = [
            notif['type'],
            notif['user_id'],
            str(notif.get('post_id', '')),
            str(notif.get('comment_id', '')),
            notif['created_at'],
            str(idx)
        ]
        unique_id = '_'.join(filter(None, unique_id_parts))
        
        notif_data = {
            "id": unique_id,
            "type": notif['type'],
            "user": {
                "id": notif['user_id'],
                "username": notif['username'],
                "profile_picture": notif['profile_picture']
            },
            "created_at": format_datetime(notif['created_at'])
        }
        
        # 팔로우 알림인 경우
        if notif['type'] == 'follow':
            notif_data['is_following'] = bool(notif['is_following'])
        
        # 좋아요나 댓글 알림인 경우 포스트 이미지 추가
        if notif['post_id']:
            post_image = execute_query(
                "SELECT image_url FROM post_images WHERE post_id = ? ORDER BY position LIMIT 1",
                (notif['post_id'],),
                fetch_one=True
            )
            if post_image:
                notif_data['post_image'] = post_image['image_url']
            notif_data['post_id'] = notif['post_id']
        
        # 댓글 알림인 경우 댓글 내용 추가
        if notif['comment_content']:
            notif_data['comment'] = notif['comment_content']
        
        result.append(notif_data)
    
    return {
        "notifications": result,
        "page": page,
        "limit": limit
    }

@router.get("/count")
async def get_notification_count(
    current_user: dict = Depends(get_current_user)
):
    """읽지 않은 알림 개수 조회"""
    # 최근 24시간 이내의 알림 개수
    yesterday = (datetime.utcnow() - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')
    
    query = """
        SELECT COUNT(*) as count FROM (
            SELECT created_at FROM follows 
            WHERE following_id = ? AND created_at > ?
            
            UNION ALL
            
            SELECT l.created_at FROM likes l
            JOIN posts p ON l.post_id = p.id
            WHERE p.user_id = ? AND l.user_id != ? AND l.created_at > ?
            
            UNION ALL
            
            SELECT c.created_at FROM comments c
            JOIN posts p ON c.post_id = p.id
            WHERE p.user_id = ? AND c.user_id != ? AND c.created_at > ?
        )
    """
    
    result = execute_query(
        query,
        (
            current_user['id'], yesterday,
            current_user['id'], current_user['id'], yesterday,
            current_user['id'], current_user['id'], yesterday
        ),
        fetch_one=True
    )
    
    return {"count": result['count'] if result else 0}