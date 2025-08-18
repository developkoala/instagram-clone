from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import sqlite3
import hashlib
import secrets
import json
from datetime import datetime, timedelta
import jwt
import os

# FastAPI app
app = FastAPI(title="Instagram Clone API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Database connection
def get_db():
    conn = sqlite3.connect("instagram_clone.db")
    conn.row_factory = sqlite3.Row
    return conn

# Utils
def generate_uuid():
    return secrets.token_hex(16)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": user_id, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except:
        return None

# Dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return dict(user)

# Optional authentication dependency
async def get_current_user_optional(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return None
    
    try:
        token = auth.replace("Bearer ", "")
        user_id = verify_token(token)
        if not user_id:
            return None
        
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return None
        
        return dict(user)
    except:
        return None

# Schemas
class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    bio: Optional[str] = None
    website: Optional[str] = None
    full_name: Optional[str] = None

class CreatePost(BaseModel):
    caption: Optional[str] = None
    location: Optional[str] = None
    image_urls: List[str]

class CreateComment(BaseModel):
    content: str
    parent_comment_id: Optional[str] = None

# Root endpoint
@app.get("/")
def root():
    return {"message": "Instagram Clone API", "version": "1.0.0", "docs": "/docs"}

# Auth endpoints
@app.post("/api/auth/register", status_code=201)
def register(request: RegisterRequest):
    conn = get_db()
    cursor = conn.cursor()
    
    # Check duplicates
    cursor.execute("SELECT id FROM users WHERE email = ?", (request.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")
    
    cursor.execute("SELECT id FROM users WHERE username = ?", (request.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="이미 사용 중인 사용자 이름입니다.")
    
    # Create user with default profile picture
    user_id = generate_uuid()
    hashed_pwd = hash_password(request.password)
    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    
    # Default profile picture - using ui-avatars.com service for initial avatars
    default_profile_picture = f"https://ui-avatars.com/api/?name={request.username}&background=random&color=fff&size=150&font-size=0.4&bold=true"
    
    cursor.execute("""
        INSERT INTO users (id, email, username, hashed_password, profile_picture, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user_id, request.email, request.username, hashed_pwd, default_profile_picture, now, now))
    
    conn.commit()
    conn.close()
    
    return {"message": "User created successfully", "user_id": user_id}

@app.post("/api/auth/login")
def login(request: LoginRequest):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE email = ?", (request.email,))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not verify_password(request.password, user['hashed_password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(user['id'])
    refresh_token = create_access_token(user['id'])  # In production, use different expiry
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user['id'],
            "username": user['username'],
            "email": user['email'],
            "full_name": user['full_name'],
            "profile_picture": user['profile_picture']
        }
    }

# User endpoints
@app.get("/api/users/profile")
def get_profile(current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    
    # Get counts
    cursor.execute("SELECT COUNT(*) as count FROM posts WHERE user_id = ?", (current_user['id'],))
    posts_count = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM follows WHERE follower_id = ?", (current_user['id'],))
    following_count = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM follows WHERE following_id = ?", (current_user['id'],))
    followers_count = cursor.fetchone()['count']
    
    conn.close()
    
    return {
        "id": current_user['id'],
        "username": current_user['username'],
        "email": current_user['email'],
        "full_name": current_user['full_name'],
        "bio": current_user['bio'],
        "profile_picture": current_user['profile_picture'],
        "website": current_user['website'],
        "followers_count": followers_count,
        "following_count": following_count,
        "posts_count": posts_count
    }

@app.get("/api/users/{username}")
def get_user_profile(username: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    user_dict = dict(user)
    
    # Get counts
    cursor.execute("SELECT COUNT(*) as count FROM posts WHERE user_id = ?", (user_dict['id'],))
    posts_count = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM follows WHERE follower_id = ?", (user_dict['id'],))
    following_count = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM follows WHERE following_id = ?", (user_dict['id'],))
    followers_count = cursor.fetchone()['count']
    
    # Check if following
    cursor.execute("""
        SELECT 1 FROM follows 
        WHERE follower_id = ? AND following_id = ?
    """, (current_user['id'], user_dict['id']))
    is_following = cursor.fetchone() is not None
    
    conn.close()
    
    return {
        "id": user_dict['id'],
        "username": user_dict['username'],
        "full_name": user_dict['full_name'],
        "bio": user_dict['bio'],
        "profile_picture": user_dict['profile_picture'],
        "website": user_dict['website'],
        "followers_count": followers_count,
        "following_count": following_count,
        "posts_count": posts_count,
        "is_following": is_following
    }

@app.put("/api/users/profile")
def update_profile(update: UserUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    
    updates = []
    values = []
    
    if update.bio is not None:
        updates.append("bio = ?")
        values.append(update.bio)
    if update.website is not None:
        updates.append("website = ?")
        values.append(update.website)
    if update.full_name is not None:
        updates.append("full_name = ?")
        values.append(update.full_name)
    
    if updates:
        updates.append("updated_at = ?")
        values.append(datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'))
        values.append(current_user['id'])
        
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, values)
        conn.commit()
    
    # Get updated user
    cursor.execute("SELECT * FROM users WHERE id = ?", (current_user['id'],))
    updated_user = cursor.fetchone()
    conn.close()
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": updated_user['id'],
            "username": updated_user['username'],
            "full_name": updated_user['full_name'],
            "bio": updated_user['bio'],
            "website": updated_user['website']
        }
    }

@app.post("/api/users/{user_id}/follow")
def follow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if user_id == current_user['id']:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already following
    cursor.execute("""
        SELECT 1 FROM follows 
        WHERE follower_id = ? AND following_id = ?
    """, (current_user['id'], user_id))
    
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Already following this user")
    
    # Add follow
    cursor.execute("""
        INSERT INTO follows (follower_id, following_id, created_at)
        VALUES (?, ?, ?)
    """, (current_user['id'], user_id, datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')))
    
    conn.commit()
    conn.close()
    
    return {"message": "Successfully followed user", "is_following": True}

@app.delete("/api/users/{user_id}/follow")
def unfollow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        DELETE FROM follows 
        WHERE follower_id = ? AND following_id = ?
    """, (current_user['id'], user_id))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Not following this user")
    
    conn.commit()
    conn.close()
    
    return {"message": "Successfully unfollowed user", "is_following": False}

# Post endpoints
@app.get("/api/posts/feed")
async def get_feed(request: Request, page: int = 1, limit: int = 10):
    offset = (page - 1) * limit
    current_user = await get_current_user_optional(request)
    
    conn = get_db()
    cursor = conn.cursor()
    
    if current_user:
        # Get posts from following users for authenticated users
        cursor.execute("""
            SELECT DISTINCT p.*, u.username, u.profile_picture,
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN follows f ON p.user_id = f.following_id
            WHERE (f.follower_id = ? OR p.user_id = ?)
              AND p.is_archived = 0
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        """, (current_user['id'], current_user['id'], limit, offset))
    else:
        # Get all public posts for non-authenticated users
        cursor.execute("""
            SELECT DISTINCT p.*, u.username, u.profile_picture,
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.is_archived = 0
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        """, (limit, offset))
    
    posts = cursor.fetchall()
    result = []
    
    for post in posts:
        post_dict = dict(post)
        
        # Get images
        cursor.execute("""
            SELECT id, image_url, position 
            FROM post_images 
            WHERE post_id = ? 
            ORDER BY position
        """, (post_dict['id'],))
        images = [dict(img) for img in cursor.fetchall()]
        
        # Check if liked (only for authenticated users)
        is_liked = False
        is_saved = False
        if current_user:
            cursor.execute("""
                SELECT 1 FROM likes 
                WHERE user_id = ? AND post_id = ?
            """, (current_user['id'], post_dict['id']))
            is_liked = cursor.fetchone() is not None
            
            # Check if saved
            cursor.execute("""
                SELECT 1 FROM saved_posts 
                WHERE user_id = ? AND post_id = ?
            """, (current_user['id'], post_dict['id']))
            is_saved = cursor.fetchone() is not None
        
        result.append({
            "id": post_dict['id'],
            "user": {
                "id": post_dict['user_id'],
                "username": post_dict['username'],
                "profile_picture": post_dict['profile_picture']
            },
            "images": images,
            "caption": post_dict['caption'],
            "location": post_dict['location'],
            "likes_count": post_dict['likes_count'],
            "comments_count": post_dict['comments_count'],
            "is_liked": is_liked,
            "is_saved": is_saved,
            "created_at": post_dict['created_at']
        })
    
    conn.close()
    return result

@app.get("/api/posts/explore")
async def get_explore(request: Request, page: int = 1, limit: int = 21):
    offset = (page - 1) * limit
    current_user = await get_current_user_optional(request)
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get random posts for explore page
    cursor.execute("""
        SELECT DISTINCT p.*, u.username, u.profile_picture,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
               (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.is_archived = 0
        ORDER BY RANDOM()
        LIMIT ? OFFSET ?
    """, (limit, offset))
    
    posts = cursor.fetchall()
    result = []
    
    for post in posts:
        post_dict = dict(post)
        
        # Get first image only for explore grid
        cursor.execute("""
            SELECT id, image_url 
            FROM post_images 
            WHERE post_id = ? 
            ORDER BY position
            LIMIT 1
        """, (post_dict['id'],))
        image = cursor.fetchone()
        
        result.append({
            "id": post_dict['id'],
            "images": [{"image_url": image['image_url']}] if image else [],
            "likes_count": post_dict['likes_count'],
            "comments_count": post_dict['comments_count']
        })
    
    conn.close()
    
    return {
        "posts": result,
        "page": page,
        "has_next": len(result) == limit
    }

@app.post("/api/posts")
def create_post(post: CreatePost, current_user: dict = Depends(get_current_user)):
    if not post.image_urls:
        raise HTTPException(status_code=400, detail="At least one image is required")
    
    conn = get_db()
    cursor = conn.cursor()
    
    post_id = generate_uuid()
    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    
    # Create post
    cursor.execute("""
        INSERT INTO posts (id, user_id, caption, location, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (post_id, current_user['id'], post.caption, post.location, now, now))
    
    # Add images
    for idx, image_url in enumerate(post.image_urls):
        image_id = generate_uuid()
        cursor.execute("""
            INSERT INTO post_images (id, post_id, image_url, position, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (image_id, post_id, image_url, idx, now))
    
    conn.commit()
    conn.close()
    
    return {"message": "Post created successfully", "post_id": post_id}

@app.post("/api/posts/{post_id}/like")
def like_post(post_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if post exists
    cursor.execute("SELECT id FROM posts WHERE id = ?", (post_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if already liked
    cursor.execute("""
        SELECT 1 FROM likes 
        WHERE user_id = ? AND post_id = ?
    """, (current_user['id'], post_id))
    
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Already liked this post")
    
    # Add like
    cursor.execute("""
        INSERT INTO likes (user_id, post_id, created_at)
        VALUES (?, ?, ?)
    """, (current_user['id'], post_id, datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')))
    
    # Get new count
    cursor.execute("SELECT COUNT(*) as count FROM likes WHERE post_id = ?", (post_id,))
    likes_count = cursor.fetchone()['count']
    
    conn.commit()
    conn.close()
    
    return {"message": "Post liked successfully", "is_liked": True, "likes_count": likes_count}

@app.delete("/api/posts/{post_id}/like")
def unlike_post(post_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        DELETE FROM likes 
        WHERE user_id = ? AND post_id = ?
    """, (current_user['id'], post_id))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Not liked this post")
    
    # Get new count
    cursor.execute("SELECT COUNT(*) as count FROM likes WHERE post_id = ?", (post_id,))
    likes_count = cursor.fetchone()['count']
    
    conn.commit()
    conn.close()
    
    return {"message": "Post unliked successfully", "is_liked": False, "likes_count": likes_count}

# Comment endpoints
@app.get("/api/posts/{post_id}/comments")
def get_comments(post_id: str, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT c.*, u.username, u.profile_picture
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at DESC
    """, (post_id,))
    
    comments = []
    for comment in cursor.fetchall():
        comments.append({
            "id": comment['id'],
            "content": comment['content'],
            "created_at": comment['created_at'],
            "user": {
                "id": comment['user_id'],
                "username": comment['username'],
                "profile_picture": comment['profile_picture']
            }
        })
    
    conn.close()
    return comments

@app.post("/api/posts/{post_id}/comments")
def create_comment(post_id: str, comment: CreateComment, current_user: dict = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if post exists
    cursor.execute("SELECT id FROM posts WHERE id = ?", (post_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment_id = generate_uuid()
    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    
    cursor.execute("""
        INSERT INTO comments (id, post_id, user_id, parent_comment_id, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (comment_id, post_id, current_user['id'], comment.parent_comment_id, comment.content, now, now))
    
    conn.commit()
    conn.close()
    
    return {"message": "Comment created successfully", "comment_id": comment_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)