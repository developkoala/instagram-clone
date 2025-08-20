"""
게시물 관련 API 엔드포인트
"""

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import List, Optional
from app.dependencies import get_current_user, get_current_user_optional
from app.utils.database_utils import (
    execute_query, get_user_by_id, get_post_with_details,
    is_post_liked, is_post_saved, format_datetime
)
from app.utils.security import generate_uuid
from datetime import datetime
import os
import shutil
from PIL import Image, ImageOps

router = APIRouter(prefix="/api/posts", tags=["Posts"])

@router.get("/feed")
async def get_feed(
    page: int = 1,
    limit: int = 10,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """피드 조회 - 로그인하지 않은 사용자도 접근 가능"""
    offset = (page - 1) * limit
    
    if current_user:
        # 로그인한 사용자 - 팔로우한 사용자들의 게시물 조회
        query = """
            SELECT DISTINCT p.*, 
                   u.username, u.profile_picture,
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN follows f ON p.user_id = f.following_id
            WHERE (f.follower_id = %s OR p.user_id = %s)
              AND p.is_archived = false
            ORDER BY p.created_at DESC
            LIMIT %s OFFSET %s
        """
        posts = execute_query(query, (current_user['id'], current_user['id'], limit, offset))
    else:
        # 로그인하지 않은 사용자 - 모든 게시물 조회
        query = """
            SELECT p.*, 
                   u.username, u.profile_picture,
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.is_archived = false
            ORDER BY p.created_at DESC
            LIMIT %s OFFSET %s
        """
        posts = execute_query(query, (limit, offset))
    
    # 각 게시물에 대한 이미지와 좋아요/저장 정보 추가
    result = []
    for post in posts:
        # 이미지 조회
        images_query = "SELECT id, image_url, position FROM post_images WHERE post_id = %s ORDER BY position"
        images = execute_query(images_query, (post['id'],))
        
        # 좋아요/저장 여부 (로그인한 경우에만)
        is_liked = is_post_liked(post['id'], current_user['id']) if current_user else False
        is_saved = is_post_saved(post['id'], current_user['id']) if current_user else False
        
        result.append({
            "id": post['id'],
            "user": {
                "id": post['user_id'],
                "username": post['username'],
                "profile_picture": post['profile_picture']
            },
            "images": images,
            "caption": post['caption'],
            "location": post['location'],
            "likes_count": post['likes_count'],
            "comments_count": post['comments_count'],
            "is_liked": is_liked,
            "is_saved": is_saved,
            "created_at": format_datetime(post['created_at'])
        })
    
    return result

@router.get("/explore")
async def get_explore_posts(
    page: int = 1,
    limit: int = 21,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """탐색 페이지 게시물"""
    offset = (page - 1) * limit
    
    # 인기 게시물 조회 (좋아요 수 기준)
    if current_user:
        # 로그인한 경우: 자신의 게시물 제외
        query = """
            SELECT p.id,
                   (SELECT image_url FROM post_images WHERE post_id = p.id ORDER BY position LIMIT 1) as image_url,
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count
            FROM posts p
            WHERE p.is_archived = false
              AND p.user_id != %s
            ORDER BY likes_count DESC, p.created_at DESC
            LIMIT %s OFFSET %s
        """
        posts = execute_query(query, (current_user['id'], limit, offset))
        
        # 전체 개수 (페이징용)
        total_query = "SELECT COUNT(*) as count FROM posts WHERE is_archived = false AND user_id != %s"
        total = execute_query(total_query, (current_user['id'],), fetch_one=True)['count']
    else:
        # 비로그인한 경우: 모든 게시물
        query = """
            SELECT p.id,
                   (SELECT image_url FROM post_images WHERE post_id = p.id ORDER BY position LIMIT 1) as image_url,
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count
            FROM posts p
            WHERE p.is_archived = false
            ORDER BY likes_count DESC, p.created_at DESC
            LIMIT %s OFFSET %s
        """
        posts = execute_query(query, (limit, offset))
        
        # 전체 개수 (페이징용)
        total_query = "SELECT COUNT(*) as count FROM posts WHERE is_archived = false"
        total = execute_query(total_query, (), fetch_one=True)['count']
    
    # 결과 포맷팅
    result = []
    for post in posts:
        if post['image_url']:  # 이미지가 있는 게시물만
            result.append({
                "id": post['id'],
                "images": [{"image_url": post['image_url']}],
                "likes_count": post['likes_count']
            })
    
    return {
        "posts": result,
        "page": page,
        "has_next": offset + limit < total
    }

@router.get("/saved")
async def get_saved_posts(
    page: int = 1,
    limit: int = 12,
    current_user: dict = Depends(get_current_user)
):
    """저장한 게시물 조회"""
    offset = (page - 1) * limit
    
    query = """
        SELECT p.*, 
               u.username, u.profile_picture,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
               (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN saved_posts sp ON p.id = sp.post_id
        WHERE sp.user_id = %s
        ORDER BY sp.created_at DESC
        LIMIT %s OFFSET %s
    """
    
    posts = execute_query(query, (current_user['id'], limit, offset))
    
    # 각 게시물에 대한 이미지 정보 추가
    result = []
    for post in posts:
        # 첫 번째 이미지만 조회
        image_query = "SELECT image_url FROM post_images WHERE post_id = %s ORDER BY position LIMIT 1"
        image = execute_query(image_query, (post['id'],), fetch_one=True)
        
        result.append({
            "id": post['id'],
            "user": {
                "id": post['user_id'],
                "username": post['username'],
                "profile_picture": post['profile_picture']
            },
            "images": [{"image_url": image['image_url']}] if image else [],
            "caption": post['caption'],
            "likes_count": post['likes_count'],
            "is_liked": is_post_liked(post['id'], current_user['id']),
            "is_saved": True
        })
    
    # 전체 개수
    total_query = "SELECT COUNT(*) as count FROM saved_posts WHERE user_id = %s"
    total = execute_query(total_query, (current_user['id'],), fetch_one=True)['count']
    
    return {
        "posts": result,
        "page": page,
        "has_next": offset + limit < total
    }

@router.get("/{post_id}")
async def get_post_detail(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """게시물 상세 조회"""
    post = get_post_with_details(post_id)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # 응답 포맷팅
    return {
        "id": post['id'],
        "user": {
            "id": post['user_id'],
            "username": post['username'],
            "profile_picture": post['profile_picture']
        },
        "images": [
            {
                "id": img['id'],
                "image_url": img['image_url'],
                "position": img['position']
            } for img in post['images']
        ],
        "caption": post['caption'],
        "location": post['location'],
        "likes_count": post['likes_count'],
        "is_liked": is_post_liked(post_id, current_user['id']),
        "created_at": format_datetime(post['created_at'])
    }

@router.post("")
async def create_post(
    caption: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    images: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    """게시물 작성"""
    if not images or len(images) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one image is required"
        )
    
    if len(images) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 images allowed"
        )
    
    # 게시물 생성
    post_id = generate_uuid()
    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    
    post_query = """
        INSERT INTO posts (id, user_id, caption, location, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    execute_query(post_query, (post_id, current_user['id'], caption, location, now, now))
    
    # 이미지 업로드 및 저장
    # 절대 경로 사용
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    upload_dir = os.path.join(backend_dir, "uploads", "posts")
    os.makedirs(upload_dir, exist_ok=True)
    
    saved_images = []
    for idx, image_file in enumerate(images):
        # 파일 확장자 확인
        if not image_file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
            # 게시물 삭제 (롤백)
            execute_query("DELETE FROM posts WHERE id = %s", (post_id,))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file format for {image_file.filename}"
            )
        
        # 파일 저장
        image_id = generate_uuid()
        file_extension = image_file.filename.split('.')[-1]
        file_name = f"{image_id}.{file_extension}"
        file_path = os.path.join(upload_dir, file_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image_file.file, buffer)
        
        # 이미지 열기 및 EXIF 오리엔테이션 처리
        img = Image.open(file_path)
        
        # EXIF 데이터에 따라 이미지 회전 (모바일 카메라 이슈 해결)
        img = ImageOps.exif_transpose(img)
        
        # RGB로 변환 (투명도 제거)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # 최대 크기 제한 (1080px)
        max_size = 1080
        if img.width > max_size or img.height > max_size:
            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        # 이미지 정보 저장
        width, height = img.size
        img.save(file_path, quality=85)
        
        # DB에 이미지 정보 저장
        image_url = f"/uploads/posts/{file_name}"
        image_query = """
            INSERT INTO post_images (id, post_id, image_url, position, width, height, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        execute_query(image_query, (image_id, post_id, image_url, idx, width, height, now))
        
        saved_images.append({
            "id": image_id,
            "image_url": image_url,
            "position": idx
        })
    
    return {
        "message": "Post created successfully",
        "post": {
            "id": post_id,
            "caption": caption,
            "location": location,
            "images": saved_images,
            "created_at": format_datetime(now)
        }
    }

@router.delete("/{post_id}")
async def delete_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """게시물 삭제"""
    # 게시물 조회
    post = execute_query(
        "SELECT * FROM posts WHERE id = %s",
        (post_id,), fetch_one=True
    )
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # 권한 확인
    if post['user_id'] != current_user['id']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this post"
        )
    
    # 이미지 파일 삭제
    images = execute_query(
        "SELECT image_url FROM post_images WHERE post_id = %s",
        (post_id,)
    )
    
    # 절대 경로 사용
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    for image in images:
        file_path = os.path.join(backend_dir, image['image_url'].lstrip('/'))
        if os.path.exists(file_path):
            os.remove(file_path)
    
    # DB에서 관련 데이터를 먼저 삭제 (외래키 제약 조건 때문에)
    execute_query("DELETE FROM post_images WHERE post_id = %s", (post_id,))
    execute_query("DELETE FROM likes WHERE post_id = %s", (post_id,))
    execute_query("DELETE FROM comments WHERE post_id = %s", (post_id,))
    execute_query("DELETE FROM saved_posts WHERE post_id = %s", (post_id,))
    # 마지막으로 게시물 삭제
    execute_query("DELETE FROM posts WHERE id = %s", (post_id,))
    
    return {"message": "Post deleted successfully"}

@router.post("/{post_id}/like")
async def like_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """게시물 좋아요"""
    # 게시물 확인
    post = execute_query(
        "SELECT * FROM posts WHERE id = %s",
        (post_id,), fetch_one=True
    )
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # 이미 좋아요했는지 확인
    if is_post_liked(post_id, current_user['id']):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already liked this post"
        )
    
    # 좋아요 추가 (중복 시 무시)
    try:
        query = "INSERT INTO likes (user_id, post_id) VALUES (%s, %s)"
        execute_query(query, (
            current_user['id'],
            post_id
        ))
    except Exception as e:
        # SQLite의 경우 IntegrityError, PostgreSQL의 경우 다른 에러일 수 있음
        error_message = str(e).lower()
        if 'unique' in error_message or 'duplicate' in error_message or 'constraint' in error_message:
            # 이미 좋아요한 경우 - 무시하고 진행
            pass
        else:
            # 다른 에러는 다시 발생
            raise
    
    # 좋아요 수 조회
    likes_count = execute_query(
        "SELECT COUNT(*) as count FROM likes WHERE post_id = %s",
        (post_id,), fetch_one=True
    )['count']
    
    # 게시물 작성자에게 웹소켓으로 알림 전송 (자신이 좋아요한 경우 제외)
    if post['user_id'] != current_user['id']:
        from app.api.websocket import manager
        import json
        
        notification_data = {
            'type': 'notification',
            'notification_type': 'like',
            'user': {
                'id': current_user['id'],
                'username': current_user['username'],
                'profile_picture': current_user.get('profile_picture')
            },
            'post': {
                'id': post_id,
                'post_image': None  # 나중에 첫 번째 이미지 URL 추가할 수 있음
            },
            'message': f"{current_user['username']}님이 게시물을 좋아합니다.",
            'created_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        await manager.send_personal_message(json.dumps(notification_data), post['user_id'])
    
    return {
        "message": "Post liked successfully",
        "is_liked": True,
        "likes_count": likes_count
    }

@router.delete("/{post_id}/like")
async def unlike_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """게시물 좋아요 취소"""
    # 좋아요 확인
    if not is_post_liked(post_id, current_user['id']):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not liked this post"
        )
    
    # 좋아요 삭제
    query = "DELETE FROM likes WHERE user_id = %s AND post_id = %s"
    execute_query(query, (current_user['id'], post_id))
    
    # 좋아요 수 조회
    likes_count = execute_query(
        "SELECT COUNT(*) as count FROM likes WHERE post_id = %s",
        (post_id,), fetch_one=True
    )['count']
    
    return {
        "message": "Post unliked successfully",
        "is_liked": False,
        "likes_count": likes_count
    }

@router.post("/{post_id}/save")
async def save_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """게시물 저장"""
    # 게시물 확인
    post = execute_query(
        "SELECT * FROM posts WHERE id = %s",
        (post_id,), fetch_one=True
    )
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # 이미 저장했는지 확인
    if is_post_saved(post_id, current_user['id']):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already saved this post"
        )
    
    # 저장 추가
    query = "INSERT INTO saved_posts (id, user_id, post_id, created_at) VALUES (%s, %s, %s, %s)"
    execute_query(query, (
        generate_uuid(),
        current_user['id'],
        post_id,
        datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    ))
    
    return {
        "message": "Post saved successfully",
        "is_saved": True
    }

@router.delete("/{post_id}/save")
async def unsave_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """게시물 저장 취소"""
    # 저장 확인
    if not is_post_saved(post_id, current_user['id']):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not saved this post"
        )
    
    # 저장 삭제
    query = "DELETE FROM saved_posts WHERE user_id = %s AND post_id = %s"
    execute_query(query, (current_user['id'], post_id))
    
    return {
        "message": "Post unsaved successfully",
        "is_saved": False
    }

@router.get("/users/{username}/posts")
async def get_user_posts(
    username: str,
    page: int = 1,
    limit: int = 12,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """사용자 게시물 조회"""
    # 사용자 조회
    user = execute_query(
        "SELECT * FROM users WHERE username = %s",
        (username,), fetch_one=True
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    offset = (page - 1) * limit
    
    # 게시물 조회
    query = """
        SELECT p.id,
               (SELECT image_url FROM post_images WHERE post_id = p.id ORDER BY position LIMIT 1) as image_url,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
               (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
        FROM posts p
        WHERE p.user_id = %s AND p.is_archived = false
        ORDER BY p.created_at DESC
        LIMIT %s OFFSET %s
    """
    
    posts = execute_query(query, (user['id'], limit, offset))
    
    # 결과 포맷팅
    result = []
    for post in posts:
        if post['image_url']:
            result.append({
                "id": post['id'],
                "images": [{"image_url": post['image_url']}],
                "likes_count": post['likes_count'],
                "comments_count": post['comments_count']
            })
    
    # 전체 개수
    total = execute_query(
        "SELECT COUNT(*) as count FROM posts WHERE user_id = %s AND is_archived = false",
        (user['id'],), fetch_one=True
    )['count']
    
    return {
        "posts": result,
        "total": total,
        "page": page,
        "has_next": offset + limit < total
    }