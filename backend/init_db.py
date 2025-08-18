import sqlite3
import os

# Database path
DB_PATH = "instagram_clone.db"

# Remove existing database
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)
    print(f"Removed existing database: {DB_PATH}")

# Create new database
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Create tables
tables = [
    """
    CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        full_name TEXT,
        bio TEXT,
        profile_picture TEXT,
        website TEXT,
        is_private BOOLEAN DEFAULT 0,
        is_verified BOOLEAN DEFAULT 0,
        hashed_password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE posts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        caption TEXT,
        location TEXT,
        is_archived BOOLEAN DEFAULT 0,
        comments_disabled BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE post_images (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        image_url TEXT NOT NULL,
        position INTEGER DEFAULT 0,
        width INTEGER,
        height INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        parent_comment_id TEXT,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        post_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_id TEXT NOT NULL,
        following_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id),
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE saved_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        post_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
    """
]

# Create indexes
indexes = [
    "CREATE INDEX idx_users_email ON users(email)",
    "CREATE INDEX idx_users_username ON users(username)",
    "CREATE INDEX idx_posts_user_id ON posts(user_id)",
    "CREATE INDEX idx_posts_created_at ON posts(created_at DESC)",
    "CREATE INDEX idx_post_images_post_id ON post_images(post_id)",
    "CREATE INDEX idx_comments_post_id ON comments(post_id)",
    "CREATE INDEX idx_comments_user_id ON comments(user_id)",
    "CREATE INDEX idx_likes_post_id ON likes(post_id)",
    "CREATE INDEX idx_likes_user_id ON likes(user_id)",
    "CREATE INDEX idx_follows_follower_id ON follows(follower_id)",
    "CREATE INDEX idx_follows_following_id ON follows(following_id)",
    "CREATE INDEX idx_saved_posts_user_id ON saved_posts(user_id)",
    "CREATE INDEX idx_saved_posts_post_id ON saved_posts(post_id)"
]

# Execute table creation
for table in tables:
    cursor.execute(table)
    print(f"Created table: {table.split()[2]}")

# Execute index creation
for index in indexes:
    cursor.execute(index)
    print(f"Created index: {index.split()[2]}")

conn.commit()
conn.close()

print("\nDatabase initialized successfully!")
print(f"Database location: {os.path.abspath(DB_PATH)}")