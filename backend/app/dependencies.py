"""
FastAPI 의존성 주입
"""

from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.utils.security import verify_token
from app.utils.database_utils import get_user_by_id

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """현재 인증된 사용자 가져오기"""
    token = credentials.credentials
    
    print(f"Token verification for: {token[:20]}..." if token else "No token")
    
    # 토큰 검증
    user_id = verify_token(token)
    print(f"User ID from token: {user_id}")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 사용자 조회
    user = get_user_by_id(user_id)
    print(f"User found: {user.get('username') if user else 'Not found'}")
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

async def get_current_user_optional(authorization: Optional[str] = Header(None, alias="Authorization")):
    """현재 인증된 사용자 가져오기 (선택적)"""
    if not authorization:
        return None
    
    try:
        # Bearer 토큰 파싱
        if authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            user_id = verify_token(token)
            if user_id:
                user = get_user_by_id(user_id)
                if not user:
                    # 토큰은 유효하지만 사용자가 없는 경우 None 반환
                    return None
                return user
    except Exception as e:
        print(f"Optional auth error: {e}")
        pass
    
    return None

async def get_current_user_ws(token: str):
    """웹소켓용 현재 인증된 사용자 가져오기"""
    # 토큰 검증
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    # 사용자 조회
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    return user