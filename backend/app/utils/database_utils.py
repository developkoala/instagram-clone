import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional, List, Dict, Any
import os
from datetime import datetime
from app.config import get_settings

# Get database URL from settings
settings = get_settings()

def get_db_connection():
    """Get PostgreSQL database connection with RealDictCursor"""
    # Parse DATABASE_URL
    db_url = settings.database_url
    
    # Extract connection parameters from URL
    # Format: postgresql://user:password@host/database or postgresql://user:password@host:port/database
    if db_url.startswith('postgresql://'):
        db_url = db_url.replace('postgresql://', '')
        user_pass, host_db = db_url.split('@')
        user, password = user_pass.split(':')
        
        # Check if port is included
        if '/' in host_db:
            host_part, database = host_db.split('/', 1)
            if ':' in host_part:
                host, port = host_part.split(':')
                port = int(port)
            else:
                host = host_part
                port = 5432
        else:
            # Handle case with no database name
            host = host_db
            database = 'instagram_clone'
            port = 5432
        
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password,
            cursor_factory=RealDictCursor
        )
        return conn
    else:
        # Fallback to direct connection
        conn = psycopg2.connect(
            host="localhost",
            database="instagram_clone",
            user="instagram_user",
            password="instagram_pass123",
            cursor_factory=RealDictCursor
        )
        return conn

def execute_query(
    query: str,
    params: tuple = (),
    fetch_one: bool = False,
    fetch_all: bool = False,
):
    """Execute a query. Auto-detects SELECT to return rows.

    - For SELECT: returns one row if fetch_one else all rows
    - For non-SELECT: executes and commits, returns None
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)

    is_select = query.lstrip().upper().startswith("SELECT")
    if is_select:
        if fetch_one:
            row = cursor.fetchone()
            conn.close()
            return dict(row) if row else None
        # default for SELECT is fetch_all when explicitly requested or when caller expects list
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    else:
        conn.commit()
        conn.close()
        return None

def fetch_one(query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    """Fetch single row"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return dict(row)
    return None

def fetch_all(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """Fetch multiple rows"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

# User-related queries
def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email"""
    query = "SELECT * FROM users WHERE email = %s"
    return fetch_one(query, (email,))

def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Get user by username"""
    query = "SELECT * FROM users WHERE username = %s"
    return fetch_one(query, (username,))

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    query = "SELECT * FROM users WHERE id = %s"
    return fetch_one(query, (user_id,))

# Post-related queries
def get_posts_by_user(user_id: str, limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
    """Get posts by user"""
    query = """
        SELECT p.*, u.username, u.profile_picture
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = %s
        ORDER BY p.created_at DESC
        LIMIT %s OFFSET %s
    """
    return fetch_all(query, (user_id, limit, offset))

def get_feed_posts(user_id: str, limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
    """Get feed posts for user"""
    query = """
        SELECT p.*, u.username, u.profile_picture
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id IN (
            SELECT following_id FROM follows WHERE follower_id = %s
        ) OR p.user_id = %s
        ORDER BY p.created_at DESC
        LIMIT %s OFFSET %s
    """
    return fetch_all(query, (user_id, user_id, limit, offset))

# Follow-related queries
def is_following(follower_id: str, following_id: str) -> bool:
    """Check if user is following another user"""
    query = "SELECT 1 FROM follows WHERE follower_id = %s AND following_id = %s"
    result = fetch_one(query, (follower_id, following_id))
    return result is not None

def get_followers(user_id: str) -> List[Dict[str, Any]]:
    """Get user's followers"""
    query = """
        SELECT u.* FROM users u
        JOIN follows f ON u.id = f.follower_id
        WHERE f.following_id = %s
    """
    return fetch_all(query, (user_id,))

def get_following(user_id: str) -> List[Dict[str, Any]]:
    """Get users that user follows"""
    query = """
        SELECT u.* FROM users u
        JOIN follows f ON u.id = f.following_id
        WHERE f.follower_id = %s
    """
    return fetch_all(query, (user_id,))

# Like-related queries
def is_post_liked(user_id: str, post_id: str) -> bool:
    """Check if user liked a post"""
    query = "SELECT 1 FROM likes WHERE user_id = %s AND post_id = %s"
    result = fetch_one(query, (user_id, post_id))
    return result is not None

def get_post_likes_count(post_id: str) -> int:
    """Get number of likes for a post"""
    query = "SELECT COUNT(*) as count FROM likes WHERE post_id = %s"
    result = fetch_one(query, (post_id,))
    return result['count'] if result else 0

# Comment-related queries
def get_post_comments(post_id: str) -> List[Dict[str, Any]]:
    """Get comments for a post"""
    query = """
        SELECT c.*, u.username, u.profile_picture
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = %s
        ORDER BY c.created_at DESC
    """
    return fetch_all(query, (post_id,))

def get_post_comments_count(post_id: str) -> int:
    """Get number of comments for a post"""
    query = "SELECT COUNT(*) as count FROM comments WHERE post_id = %s"
    result = fetch_one(query, (post_id,))
    return result['count'] if result else 0

# Save-related queries  
def is_post_saved(user_id: str, post_id: str) -> bool:
    """Check if user saved a post"""
    query = "SELECT 1 FROM saved_posts WHERE user_id = %s AND post_id = %s"
    result = fetch_one(query, (user_id, post_id))
    return result is not None

def get_saved_posts(user_id: str) -> List[Dict[str, Any]]:
    """Get user's saved posts"""
    query = """
        SELECT p.*, u.username, u.profile_picture
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN saved_posts s ON p.id = s.post_id
        WHERE s.user_id = %s
        ORDER BY s.created_at DESC
    """
    return fetch_all(query, (user_id,))

# Post detail with images, like/save state, counts
def get_post_with_details(post_id: str, current_user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Get post with all details"""
    # Get post basic info
    post_query = """
        SELECT p.*, u.username, u.profile_picture,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
               (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = %s
    """
    post = fetch_one(post_query, (post_id,))
    
    if not post:
        return None
    
    # Get post images
    images_query = "SELECT * FROM post_images WHERE post_id = %s ORDER BY position"
    images = fetch_all(images_query, (post_id,))
    post['images'] = images
    
    # Get current user's like/save status
    if current_user_id:
        post['is_liked'] = is_post_liked(current_user_id, post_id)
        post['is_saved'] = is_post_saved(current_user_id, post_id)
    else:
        post['is_liked'] = False
        post['is_saved'] = False
    
    return post

def format_datetime(dt_str: str) -> str:
    """Format datetime string to ISO format"""
    if not dt_str:
        return datetime.utcnow().isoformat() + 'Z'
    try:
        # If it's already a datetime object from PostgreSQL
        if isinstance(dt_str, datetime):
            return dt_str.isoformat() + 'Z'
        # Parse PostgreSQL datetime format and convert to ISO
        dt = datetime.strptime(dt_str, '%Y-%m-%d %H:%M:%S')
        return dt.isoformat() + 'Z'
    except:
        return dt_str