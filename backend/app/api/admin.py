from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials, HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.utils.security import (
    create_admin_access_token,
    verify_admin_token,
)
from app.utils.database_utils import execute_query

router = APIRouter(prefix="/api/admin", tags=["Admin"])

http_basic = HTTPBasic()
http_bearer = HTTPBearer()


def ensure_admin(credentials: HTTPAuthorizationCredentials = Depends(http_bearer)):
    token = credentials.credentials
    if not verify_admin_token(token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin token required")
    return True


@router.post("/login")
async def admin_login(credentials: HTTPBasicCredentials = Depends(http_basic)):
    """베이직 인증으로 관리자 토큰 발급 (admin/pass123)"""
    if credentials.username != "admin" or credentials.password != "pass123":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin credentials")
    token = create_admin_access_token()
    return {"access_token": token, "token_type": "bearer", "role": "admin"}


# --- 회원 관리 ---
@router.get("/users", dependencies=[Depends(ensure_admin)])
async def list_users(page: int = 1, limit: int = 20, q: Optional[str] = None):
    offset = (page - 1) * limit
    base = "SELECT id, email, username, created_at FROM users"
    params: list = []
    if q:
        base += " WHERE email LIKE ? OR username LIKE ?"
        like = f"%{q}%"
        params.extend([like, like])
    count_query = f"SELECT COUNT(*) as count FROM ({base})"
    total = execute_query(count_query, tuple(params), fetch_one=True)["count"]
    query = base + " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    users = execute_query(query, tuple(params))
    return {"users": users, "page": page, "has_next": offset + limit < total, "total": total}


@router.delete("/users/{user_id}", dependencies=[Depends(ensure_admin)])
async def delete_user(user_id: str):
    user = execute_query("SELECT * FROM users WHERE id = ?", (user_id,), fetch_one=True)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    execute_query("DELETE FROM users WHERE id = ?", (user_id,))
    return {"message": "User deleted"}


# --- 게시물 관리 ---
@router.get("/posts", dependencies=[Depends(ensure_admin)])
async def list_posts(page: int = 1, limit: int = 20, user_id: Optional[str] = None):
    offset = (page - 1) * limit
    base = """
        SELECT p.id, p.user_id, u.username, p.caption, p.created_at,
               (SELECT image_url FROM post_images WHERE post_id = p.id ORDER BY position LIMIT 1) as image_url,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
               (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
    """
    params: list = []
    if user_id:
        base += " WHERE p.user_id = ?"
        params.append(user_id)
    count_query = f"SELECT COUNT(*) as count FROM ({base})"
    total = execute_query(count_query, tuple(params), fetch_one=True)["count"]
    query = base + " ORDER BY p.created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    posts = execute_query(query, tuple(params))
    return {"posts": posts, "page": page, "has_next": offset + limit < total, "total": total}


@router.delete("/posts/{post_id}", dependencies=[Depends(ensure_admin)])
async def admin_delete_post(post_id: str):
    post = execute_query("SELECT * FROM posts WHERE id = ?", (post_id,), fetch_one=True)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    # 이미지 파일까지 정리
    images = execute_query("SELECT image_url FROM post_images WHERE post_id = ?", (post_id,))
    import os
    for img in images:
        file_path = os.path.join("backend", img["image_url"].lstrip("/"))
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass
    execute_query("DELETE FROM posts WHERE id = ?", (post_id,))
    return {"message": "Post deleted"}


# --- 통계 대시보드 ---
@router.get("/stats", dependencies=[Depends(ensure_admin)])
async def get_stats():
    total_users = execute_query("SELECT COUNT(*) as count FROM users", (), fetch_one=True)["count"]
    total_posts = execute_query("SELECT COUNT(*) as count FROM posts", (), fetch_one=True)["count"]
    total_likes = execute_query("SELECT COUNT(*) as count FROM likes", (), fetch_one=True)["count"]
    total_comments = execute_query("SELECT COUNT(*) as count FROM comments", (), fetch_one=True)["count"]

    recent_users = execute_query(
        "SELECT id, email, username, created_at FROM users ORDER BY created_at DESC LIMIT 5"
    )
    recent_posts = execute_query(
        """
        SELECT p.id, u.username, p.caption, p.created_at
        FROM posts p JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC LIMIT 5
        """
    )

    # 일자별 가입/게시물 (최근 7일)
    daily_users = execute_query(
        """
        SELECT substr(created_at, 1, 10) as day, COUNT(*) as count
        FROM users
        WHERE created_at >= date('now','-6 day')
        GROUP BY day ORDER BY day
        """
    )
    daily_posts = execute_query(
        """
        SELECT substr(created_at, 1, 10) as day, COUNT(*) as count
        FROM posts
        WHERE created_at >= date('now','-6 day')
        GROUP BY day ORDER BY day
        """
    )

    return {
        "totals": {
            "users": total_users,
            "posts": total_posts,
            "likes": total_likes,
            "comments": total_comments,
        },
        "recent": {"users": recent_users, "posts": recent_posts},
        "daily": {"users": daily_users, "posts": daily_posts},
    }


