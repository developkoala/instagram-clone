from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest
from app.utils.security import (
    get_password_hash, verify_password, 
    create_access_token, create_refresh_token,
    verify_token, generate_uuid
)
from app.utils.database_utils import (
    get_user_by_email, get_user_by_username,
    execute_query
)
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    # Check email duplicate
    if get_user_by_email(request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용 중인 이메일입니다."
        )
    
    # Check username duplicate
    if get_user_by_username(request.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용 중인 사용자 이름입니다."
        )
    
    # Create new user
    user_id = generate_uuid()
    hashed_password = get_password_hash(request.password)
    
    query = """
        INSERT INTO users (id, email, username, hashed_password, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """
    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    execute_query(query, (
        user_id, request.email, request.username, 
        hashed_password, now, now
    ))
    
    return {
        "message": "User created successfully",
        "user_id": user_id
    }

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    # Get user
    user = get_user_by_email(request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(request.password, user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create tokens
    access_token = create_access_token(user['id'])
    refresh_token = create_refresh_token(user['id'])
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user['id'],
            "username": user['username'],
            "email": user['email'],
            "profile_picture": user['profile_picture']
        }
    )

@router.post("/refresh")
async def refresh_token(request: RefreshRequest):
    # Verify refresh token
    user_id = verify_token(request.refresh_token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Create new access token
    access_token = create_access_token(user_id)
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.delete("/logout")
async def logout():
    # Client should delete tokens
    return {"message": "Logged out successfully"}