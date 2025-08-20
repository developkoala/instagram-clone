"""
Database utility functions with SQLite and PostgreSQL support
"""
import os
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.config import get_settings

# Get database URL from settings
settings = get_settings()

class DatabaseConnection:
    """Abstract database connection wrapper"""
    
    def __init__(self, conn):
        self.conn = conn
        self.cursor = None
    
    def execute(self, query: str, params: tuple = ()):
        """Execute query with proper parameter formatting"""
        raise NotImplementedError
    
    def fetchone(self):
        """Fetch one row"""
        raise NotImplementedError
    
    def fetchall(self):
        """Fetch all rows"""
        raise NotImplementedError
    
    def commit(self):
        """Commit transaction"""
        self.conn.commit()
    
    def close(self):
        """Close connection"""
        if self.cursor:
            self.cursor.close()
        self.conn.close()

class PostgreSQLConnection(DatabaseConnection):
    """PostgreSQL connection wrapper"""
    
    def __init__(self, conn):
        super().__init__(conn)
        from psycopg2.extras import RealDictCursor
        self.cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    def execute(self, query: str, params: tuple = ()):
        """Execute query with %s placeholders"""
        self.cursor.execute(query, params)
        return self.cursor
    
    def fetchone(self):
        """Fetch one row as dict"""
        row = self.cursor.fetchone()
        return dict(row) if row else None
    
    def fetchall(self):
        """Fetch all rows as list of dicts"""
        rows = self.cursor.fetchall()
        return [dict(row) for row in rows]

class SQLiteConnection(DatabaseConnection):
    """SQLite connection wrapper"""
    
    def __init__(self, conn):
        super().__init__(conn)
        conn.row_factory = self._dict_factory
        self.cursor = conn.cursor()
    
    @staticmethod
    def _dict_factory(cursor, row):
        """Convert SQLite row to dict"""
        fields = [column[0] for column in cursor.description]
        return dict(zip(fields, row))
    
    def execute(self, query: str, params: tuple = ()):
        """Execute query with ? placeholders"""
        # Convert %s to ? for SQLite
        query = query.replace('%s', '?')
        self.cursor.execute(query, params)
        return self.cursor
    
    def fetchone(self):
        """Fetch one row as dict"""
        return self.cursor.fetchone()
    
    def fetchall(self):
        """Fetch all rows as list of dicts"""
        return self.cursor.fetchall()

def get_db_connection() -> DatabaseConnection:
    """Get database connection with appropriate wrapper"""
    db_url = settings.database_url
    
    if db_url.startswith('sqlite'):
        # SQLite connection
        import sqlite3
        db_path = db_url.replace('sqlite:///', '')
        conn = sqlite3.connect(db_path)
        return SQLiteConnection(conn)
    
    elif db_url.startswith('postgresql'):
        # PostgreSQL connection
        import psycopg2
        
        # Parse PostgreSQL URL
        db_url = db_url.replace('postgresql://', '')
        
        # Handle different URL formats
        if '@' in db_url:
            user_pass, host_db = db_url.split('@')
            if ':' in user_pass:
                user, password = user_pass.split(':', 1)
            else:
                user = user_pass
                password = ''
            
            if '/' in host_db:
                host_part, database = host_db.split('/', 1)
                if ':' in host_part:
                    host, port = host_part.split(':')
                    port = int(port)
                else:
                    host = host_part
                    port = 5432
            else:
                host = host_db
                database = 'instagram_clone'
                port = 5432
        else:
            # Fallback to defaults
            host = "localhost"
            port = 5432
            database = "instagram_clone"
            user = "instagram_user"
            password = "instagram_pass123"
        
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password
        )
        return PostgreSQLConnection(conn)
    
    else:
        raise ValueError(f"Unsupported database URL: {db_url}")

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
    conn.execute(query, params)

    is_select = query.lstrip().upper().startswith("SELECT")
    if is_select:
        if fetch_one:
            row = conn.fetchone()
            conn.close()
            return row
        # default for SELECT is fetch_all
        rows = conn.fetchall()
        conn.close()
        return rows
    else:
        conn.commit()
        conn.close()
        return None

def fetch_one(query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    """Fetch single row"""
    conn = get_db_connection()
    conn.execute(query, params)
    row = conn.fetchone()
    conn.close()
    return row

def fetch_all(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """Fetch all rows"""
    conn = get_db_connection()
    conn.execute(query, params)
    rows = conn.fetchall()
    conn.close()
    return rows

def execute_insert(query: str, params: tuple = ()) -> None:
    """Execute INSERT query"""
    conn = get_db_connection()
    conn.execute(query, params)
    conn.commit()
    conn.close()

def execute_update(query: str, params: tuple = ()) -> None:
    """Execute UPDATE query"""
    conn = get_db_connection()
    conn.execute(query, params)
    conn.commit()
    conn.close()

def execute_delete(query: str, params: tuple = ()) -> None:
    """Execute DELETE query"""
    conn = get_db_connection()
    conn.execute(query, params)
    conn.commit()
    conn.close()

# Helper functions for common queries
def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    query = """
        SELECT id, email, username, bio, profile_picture, 
               website, is_private, is_verified, created_at, updated_at
        FROM users 
        WHERE id = %s
    """
    return fetch_one(query, (user_id,))

def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Get user by username"""
    query = """
        SELECT id, email, username, bio, profile_picture, 
               website, is_private, is_verified, created_at, updated_at
        FROM users 
        WHERE username = %s
    """
    return fetch_one(query, (username,))

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email"""
    query = """
        SELECT * FROM users WHERE email = %s
    """
    return fetch_one(query, (email,))

def get_post_with_details(post_id: str) -> Optional[Dict[str, Any]]:
    """Get post with user details and counts"""
    query = """
        SELECT p.*, u.username, u.profile_picture,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
               (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = %s
    """
    post = fetch_one(query, (post_id,))
    
    if post:
        # Get images for the post
        images_query = """
            SELECT * FROM post_images 
            WHERE post_id = %s 
            ORDER BY position
        """
        images = fetch_all(images_query, (post_id,))
        post['images'] = images
    
    return post

def is_following(follower_id: str, following_id: str) -> bool:
    """Check if user is following another user"""
    query = """
        SELECT COUNT(*) as count FROM follows 
        WHERE follower_id = %s AND following_id = %s
    """
    result = fetch_one(query, (follower_id, following_id))
    return result['count'] > 0 if result else False

def is_post_liked(post_id: str, user_id: str) -> bool:
    """Check if post is liked by user"""
    query = """
        SELECT COUNT(*) as count FROM likes 
        WHERE post_id = %s AND user_id = %s
    """
    result = fetch_one(query, (post_id, user_id))
    return result['count'] > 0 if result else False

def is_post_saved(post_id: str, user_id: str) -> bool:
    """Check if post is saved by user"""
    query = """
        SELECT COUNT(*) as count FROM saved_posts 
        WHERE post_id = %s AND user_id = %s
    """
    result = fetch_one(query, (post_id, user_id))
    return result['count'] > 0 if result else False

def format_datetime(dt: datetime) -> str:
    """Format datetime for response"""
    if dt:
        return dt.isoformat() if hasattr(dt, 'isoformat') else str(dt)
    return None

def get_follower_count(user_id: str) -> int:
    """Get follower count for user"""
    query = "SELECT COUNT(*) as count FROM follows WHERE following_id = %s"
    result = fetch_one(query, (user_id,))
    return result['count'] if result else 0

def get_following_count(user_id: str) -> int:
    """Get following count for user"""
    query = "SELECT COUNT(*) as count FROM follows WHERE follower_id = %s"
    result = fetch_one(query, (user_id,))
    return result['count'] if result else 0

def get_post_count(user_id: str) -> int:
    """Get post count for user"""
    query = "SELECT COUNT(*) as count FROM posts WHERE user_id = %s"
    result = fetch_one(query, (user_id,))
    return result['count'] if result else 0