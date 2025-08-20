"""
사용자 관련 API 엔드포인트
"""

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Query
from typing import Optional
from app.schemas.user import UserProfile, UserProfileUpdate
from app.schemas.auth import ChangePasswordRequest
from app.dependencies import get_current_user, get_current_user_optional
from app.utils.database_utils import (
    execute_query, get_user_by_username, get_user_by_id,
    is_following, format_datetime
)
from app.utils.security import verify_password, get_password_hash
from datetime import datetime
import os
import shutil
from PIL import Image, ImageOps
from app.utils.security import generate_uuid

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/profile")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """현재 사용자 프로필 조회"""
    # 팔로워/팔로잉 수 조회
    followers_count = execute_query(
        "SELECT COUNT(*) as count FROM follows WHERE following_id = %s",
        (current_user['id'],), fetch_one=True
    )['count']
    
    following_count = execute_query(
        "SELECT COUNT(*) as count FROM follows WHERE follower_id = %s",
        (current_user['id'],), fetch_one=True
    )['count']
    
    posts_count = execute_query(
        "SELECT COUNT(*) as count FROM posts WHERE user_id = %s",
        (current_user['id'],), fetch_one=True
    )['count']
    
    return {
        "id": current_user['id'],
        "username": current_user['username'],
        "email": current_user['email'],
        "bio": current_user['bio'],
        "profile_picture": current_user['profile_picture'],
        "website": current_user['website'],
        "followers_count": followers_count,
        "following_count": following_count,
        "posts_count": posts_count
    }

@router.get("/suggestions")
async def get_user_suggestions(
    limit: int = Query(5, ge=1, le=50),
    page: int = Query(1, ge=1),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """팔로우 추천 사용자 목록
    
    - 팔로워 수 기준 정렬
    - 로그인 상태라면 본인과 이미 팔로우한 사용자는 제외
    """
    offset = (page - 1) * limit
    
    if current_user:
        # 로그인 사용자: 본인/이미 팔로우한 사용자 제외
        base_query = """
            SELECT 
                u.id, u.username, u.profile_picture, u.bio,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count
            FROM users u
            WHERE u.id != %s
              AND u.id NOT IN (
                SELECT following_id FROM follows WHERE follower_id = %s
              )
            ORDER BY followers_count DESC, u.created_at DESC
            LIMIT %s OFFSET %s
        """
        users = execute_query(base_query, (current_user['id'], current_user['id'], limit, offset))
        
        count_query = """
            SELECT COUNT(*) as count
            FROM users u
            WHERE u.id != %s
              AND u.id NOT IN (
                SELECT following_id FROM follows WHERE follower_id = %s
              )
        """
        total = execute_query(count_query, (current_user['id'], current_user['id']), fetch_one=True)['count']
    else:
        # 비로그인: 전체에서 상위 사용자 추천
        base_query = """
            SELECT 
                u.id, u.username, u.profile_picture, u.bio,
                (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count
            FROM users u
            ORDER BY followers_count DESC, u.created_at DESC
            LIMIT %s OFFSET %s
        """
        users = execute_query(base_query, (limit, offset))
        
        count_query = "SELECT COUNT(*) as count FROM users"
        total = execute_query(count_query, (), fetch_one=True)['count']
    
    # is_following은 추천 목록 특성상 False로 간주 (이미 제외됨)
    for u in users:
        u['is_following'] = False
    
    return {
        "users": users,
        "count": len(users),
        "page": page,
        "has_next": offset + limit < total,
        "total": total,
    }

@router.get("/search")
async def search_users(
    q: str = Query(..., min_length=1, description="검색어"),
    limit: int = Query(10, ge=1, le=50)
):
    """사용자 검색"""
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

@router.get("/{username}", response_model=UserProfile)
async def get_user_profile(username: str, current_user: Optional[dict] = Depends(get_current_user_optional)):
    """특정 사용자 프로필 조회"""
    user = get_user_by_username(username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # 팔로워/팔로잉 수 조회
    followers_count = execute_query(
        "SELECT COUNT(*) as count FROM follows WHERE following_id = %s",
        (user['id'],), fetch_one=True
    )['count']
    
    following_count = execute_query(
        "SELECT COUNT(*) as count FROM follows WHERE follower_id = %s",
        (user['id'],), fetch_one=True
    )['count']
    
    posts_count = execute_query(
        "SELECT COUNT(*) as count FROM posts WHERE user_id = %s",
        (user['id'],), fetch_one=True
    )['count']
    
    # 팔로우 여부 확인 (로그인한 경우에만)
    is_following_user = False
    if current_user:
        is_following_user = is_following(current_user['id'], user['id'])
    
    return UserProfile(
        id=user['id'],
        username=user['username'],
        bio=user['bio'],
        profile_picture=user['profile_picture'],
        website=user['website'],
        followers_count=followers_count,
        following_count=following_count,
        posts_count=posts_count,
        is_following=is_following_user
    )

@router.put("/profile")
async def update_profile(
    update_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """프로필 수정"""
    updates = []
    params = []
    
    if update_data.bio is not None:
        updates.append("bio = %s")
        params.append(update_data.bio)
    
    if update_data.website is not None:
        updates.append("website = %s")
        params.append(update_data.website)
    
    if update_data.email is not None:
        updates.append("email = %s")
        params.append(update_data.email)
    
    if updates:
        updates.append("updated_at = %s")
        params.append(datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'))
        params.append(current_user['id'])
        
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
        execute_query(query, tuple(params))
    
    # 업데이트된 사용자 정보 반환
    updated_user = get_user_by_id(current_user['id'])
    
    return {
        "message": "프로필이 성공적으로 업데이트되었습니다",
        "user": {
            "id": updated_user['id'],
            "username": updated_user['username'],
            "email": updated_user['email'],
            "bio": updated_user['bio'],
            "website": updated_user['website']
        }
    }

@router.post("/profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """프로필 사진 업로드"""
    # 파일 확장자 확인
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PNG, JPG, JPEG, GIF are allowed"
        )
    
    # 업로드 디렉토리 생성
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "profiles")
    os.makedirs(upload_dir, exist_ok=True)
    
    # 파일명 생성
    file_extension = file.filename.split('.')[-1]
    file_name = f"{current_user['id']}.{file_extension}"
    file_path = os.path.join(upload_dir, file_name)
    
    # 파일 저장
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 이미지 열기 및 EXIF 오리엔테이션 처리
    img = Image.open(file_path)
    
    # EXIF 데이터에 따라 이미지 회전 (모바일 카메라 이슈 해결)
    img = ImageOps.exif_transpose(img)
    
    # RGB로 변환
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # 정사각형으로 크롭
    width, height = img.size
    size = min(width, height)
    left = (width - size) // 2
    top = (height - size) // 2
    right = left + size
    bottom = top + size
    img = img.crop((left, top, right, bottom))
    
    # 리사이즈
    img = img.resize((400, 400), Image.Resampling.LANCZOS)
    
    # 파일 형식에 따라 저장
    if file_extension.lower() in ['jpg', 'jpeg']:
        img.save(file_path, 'JPEG', quality=85)
    else:
        img.save(file_path, 'PNG')
    
    # DB 업데이트
    profile_picture_url = f"/uploads/profiles/{file_name}"
    query = "UPDATE users SET profile_picture = %s, updated_at = %s WHERE id = %s"
    execute_query(query, (
        profile_picture_url,
        datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
        current_user['id']
    ))
    
    return {
        "message": "프로필 사진이 성공적으로 업데이트되었습니다",
        "profile_picture": profile_picture_url
    }

@router.post("/{user_id}/follow")
async def follow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """팔로우"""
    # 자기 자신은 팔로우 불가
    if user_id == current_user['id']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot follow yourself"
        )
    
    # 대상 사용자 확인
    target_user = get_user_by_id(user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # 이미 팔로우 중인지 확인
    if is_following(current_user['id'], user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already following this user"
        )
    
    # 팔로우 추가
    query = "INSERT INTO follows (id, follower_id, following_id, created_at) VALUES (%s, %s, %s, %s)"
    execute_query(query, (
        generate_uuid(),
        current_user['id'],
        user_id,
        datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    ))
    
    return {
        "message": "Successfully followed user",
        "is_following": True
    }

@router.delete("/{user_id}/follow")
async def unfollow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """언팔로우"""
    # 팔로우 중인지 확인
    if not is_following(current_user['id'], user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not following this user"
        )
    
    # 팔로우 삭제
    query = "DELETE FROM follows WHERE follower_id = %s AND following_id = %s"
    execute_query(query, (current_user['id'], user_id))
    
    return {
        "message": "Successfully unfollowed user",
        "is_following": False
    }


@router.get("/{username}/followers")
async def get_followers(
    username: str,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """팔로워 목록 조회"""
    user = get_user_by_username(username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    offset = (page - 1) * limit
    
    # 팔로워 조회
    query = """
        SELECT u.id, u.username, u.profile_picture
        FROM users u
        JOIN follows f ON u.id = f.follower_id
        WHERE f.following_id = %s
        ORDER BY f.created_at DESC
        LIMIT %s OFFSET %s
    """
    followers = execute_query(query, (user['id'], limit, offset))
    
    # 각 팔로워에 대해 현재 사용자의 팔로우 여부 확인
    for follower in followers:
        follower['is_following'] = is_following(current_user['id'], follower['id'])
    
    # 전체 개수
    total = execute_query(
        "SELECT COUNT(*) as count FROM follows WHERE following_id = %s",
        (user['id'],), fetch_one=True
    )['count']
    
    return {
        "users": followers,
        "total": total,
        "page": page,
        "has_next": offset + limit < total
    }

@router.get("/{username}/following")
async def get_following(
    username: str,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """팔로잉 목록 조회"""
    user = get_user_by_username(username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    offset = (page - 1) * limit
    
    # 팔로잉 조회
    query = """
        SELECT u.id, u.username, u.profile_picture
        FROM users u
        JOIN follows f ON u.id = f.following_id
        WHERE f.follower_id = %s
        ORDER BY f.created_at DESC
        LIMIT %s OFFSET %s
    """
    following = execute_query(query, (user['id'], limit, offset))
    
    # 각 사용자에 대해 현재 사용자의 팔로우 여부 확인
    for user_item in following:
        user_item['is_following'] = is_following(current_user['id'], user_item['id'])
    
    # 전체 개수
    total = execute_query(
        "SELECT COUNT(*) as count FROM follows WHERE follower_id = %s",
        (user['id'],), fetch_one=True
    )['count']
    
    return {
        "users": following,
        "total": total,
        "page": page,
        "has_next": offset + limit < total
    }

@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """비밀번호 변경"""
    # 현재 비밀번호 확인
    if not verify_password(request.current_password, current_user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="현재 비밀번호가 올바르지 않습니다"
        )
    
    # 새 비밀번호 해싱
    new_hashed = get_password_hash(request.new_password)
    
    # DB 업데이트
    query = "UPDATE users SET hashed_password = %s, updated_at = %s WHERE id = %s"
    execute_query(query, (
        new_hashed,
        datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
        current_user['id']
    ))
    
    return {"message": "비밀번호가 성공적으로 변경되었습니다"}