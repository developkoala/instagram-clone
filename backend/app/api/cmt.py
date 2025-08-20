"""
댓글 관련 API 엔드포인트 (comments.py 대체)
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from app.dependencies import get_current_user, get_current_user_optional
from app.utils.database_utils import execute_query, format_datetime
from app.utils.security import generate_uuid
from app.schemas.cmt_comment import CommentCreate
from datetime import datetime

router = APIRouter(prefix="/api", tags=["Comments"])


@router.get("/posts/{post_id}/comments")
async def get_post_comments(
    post_id: str,
    page: int = 1,
    limit: int = 20,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    offset = (page - 1) * limit
    query = (
        """
        SELECT c.id, c.content, c.created_at, c.parent_comment_id,
               u.id as user_id, u.username, u.profile_picture
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = %s
        ORDER BY c.created_at DESC
        LIMIT %s OFFSET %s
        """
    )
    rows = execute_query(query, (post_id, limit, offset)) or []

    comments = [
        {
            "id": r["id"],
            "user": {
                "id": r["user_id"],
                "username": r["username"],
                "profile_picture": r["profile_picture"],
            },
            "content": r["content"],
            "created_at": format_datetime(r["created_at"]),
            "parent_comment_id": r["parent_comment_id"],
        }
        for r in rows
    ]

    total = execute_query(
        "SELECT COUNT(*) as count FROM comments WHERE post_id = %s",
        (post_id,),
        fetch_one=True,
    )["count"]

    return {
        "comments": comments,
        "total": total,
        "page": page,
        "has_next": offset + limit < total,
    }


@router.post("/posts/{post_id}/comments", status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: str,
    body: CommentCreate,
    current_user: dict = Depends(get_current_user),
):
    post = execute_query(
        "SELECT id FROM posts WHERE id = %s",
        (post_id,),
        fetch_one=True,
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment_id = generate_uuid()
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    execute_query(
        """
        INSERT INTO comments (id, post_id, user_id, parent_comment_id, content, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
            comment_id,
            post_id,
            current_user["id"],
            body.parent_comment_id,
            body.content,
            now,
            now,
        ),
    )

    # 게시물 작성자에게 웹소켓으로 알림 전송
    post_owner = execute_query(
        "SELECT user_id FROM posts WHERE id = %s",
        (post_id,),
        fetch_one=True,
    )
    
    if post_owner and post_owner['user_id'] != current_user['id']:
        from app.api.websocket import manager
        import json
        
        notification_data = {
            'type': 'notification',
            'notification_type': 'comment',
            'user': {
                'id': current_user['id'],
                'username': current_user['username'],
                'profile_picture': current_user.get('profile_picture')
            },
            'post': {
                'id': post_id,
                'post_image': None
            },
            'comment': {
                'content': body.content[:50] + ('...' if len(body.content) > 50 else '')
            },
            'message': f"{current_user['username']}님이 댓글을 남겼습니다: \"{body.content[:30] + ('...' if len(body.content) > 30 else '')}\"",
            'created_at': now
        }
        
        await manager.send_personal_message(json.dumps(notification_data), post_owner['user_id'])

    return {
        "message": "Comment created successfully",
        "comment": {
            "id": comment_id,
            "user": {
                "id": current_user["id"],
                "username": current_user["username"],
                "profile_picture": current_user["profile_picture"],
            },
            "content": body.content,
            "created_at": format_datetime(now),
            "parent_comment_id": body.parent_comment_id,
        },
    }


@router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, current_user: dict = Depends(get_current_user)):
    comment = execute_query(
        "SELECT * FROM comments WHERE id = %s",
        (comment_id,),
        fetch_one=True,
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not allowed to delete this comment")

    execute_query("DELETE FROM comments WHERE id = %s", (comment_id,))
    return {"message": "Comment deleted successfully"}


