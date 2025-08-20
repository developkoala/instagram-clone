"""
Instagram Clone Database Setup
SQLite 데이터베이스 초기화 및 관리
"""

import sqlite3
import os
from datetime import datetime

# 데이터베이스 파일 경로
DATABASE_PATH = "instagram_clone.db"

def get_connection():
    """데이터베이스 연결을 반환"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # 딕셔너리처럼 사용 가능
    return conn

def init_database():
    """데이터베이스 초기화 및 테이블 생성"""
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    print("📦 데이터베이스 초기화 시작...")
    
    # 1. users 테이블 생성
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            full_name TEXT,
            bio TEXT,
            profile_picture TEXT,
            website TEXT,
            is_private BOOLEAN DEFAULT FALSE,
            is_verified BOOLEAN DEFAULT FALSE,
            hashed_password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    print("✅ users 테이블 생성 완료")
    
    # 2. posts 테이블 생성
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            caption TEXT,
            location TEXT,
            is_archived BOOLEAN DEFAULT FALSE,
            comments_disabled BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    print("✅ posts 테이블 생성 완료")
    
    # 3. post_images 테이블 생성
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS post_images (
            id TEXT PRIMARY KEY,
            post_id TEXT NOT NULL,
            image_url TEXT NOT NULL,
            position INTEGER DEFAULT 0,
            width INTEGER,
            height INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        )
    ''')
    print("✅ post_images 테이블 생성 완료")
    
    # 4. likes 테이블 생성
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS likes (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            post_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, post_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        )
    ''')
    print("✅ likes 테이블 생성 완료")
    
    # 5. follows 테이블 생성
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS follows (
            id TEXT PRIMARY KEY,
            follower_id TEXT NOT NULL,
            following_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(follower_id, following_id),
            FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    print("✅ follows 테이블 생성 완료")
    
    # 6. comments 테이블 생성
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS comments (
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
    ''')
    print("✅ comments 테이블 생성 완료")
    
    # 7. saved_posts 테이블 생성
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS saved_posts (
            user_id TEXT NOT NULL,
            post_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, post_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
        )
    ''')
    print("✅ saved_posts 테이블 생성 완료")
    
    # 인덱스 생성
    print("\n🔍 인덱스 생성 중...")
    
    # users 인덱스
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)')
    
    # posts 인덱스
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)')
    
    # post_images 인덱스
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_post_images_post_id ON post_images(post_id)')
    
    # likes 인덱스
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id)')
    
    # follows 인덱스
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id)')
    
    # comments 인덱스
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC)')
    
    # saved_posts 인덱스
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON saved_posts(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_saved_posts_post_id ON saved_posts(post_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_saved_posts_created_at ON saved_posts(created_at DESC)')
    
    print("✅ 모든 인덱스 생성 완료")
    
    # 커밋 및 종료
    conn.commit()
    conn.close()
    
    # uploads 디렉토리 생성
    os.makedirs('uploads/profiles', exist_ok=True)
    os.makedirs('uploads/posts', exist_ok=True)
    print("\n📁 uploads 디렉토리 생성 완료")
    
    print("\n🎉 데이터베이스 초기화 완료!")
    return True

def drop_all_tables():
    """모든 테이블 삭제 (주의: 모든 데이터가 삭제됨)"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    tables = ['saved_posts', 'comments', 'follows', 'likes', 'post_images', 'posts', 'users']
    
    for table in tables:
        cursor.execute(f'DROP TABLE IF EXISTS {table}')
        print(f"❌ {table} 테이블 삭제됨")
    
    conn.commit()
    conn.close()
    print("\n⚠️  모든 테이블이 삭제되었습니다.")

def check_database_structure():
    """데이터베이스 구조 확인"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    print("\n📊 데이터베이스 구조 확인")
    print("=" * 50)
    
    # 테이블 목록 확인
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    print("\n📋 테이블 목록:")
    for table in tables:
        print(f"  - {table[0]}")
        
        # 각 테이블의 컬럼 정보
        cursor.execute(f"PRAGMA table_info({table[0]})")
        columns = cursor.fetchall()
        
        for col in columns:
            pk = " (PK)" if col[5] else ""
            nullable = "" if col[3] else " NOT NULL"
            print(f"    • {col[1]}: {col[2]}{nullable}{pk}")
    
    # 인덱스 목록 확인
    print("\n🔍 인덱스 목록:")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='index'")
    indexes = cursor.fetchall()
    for index in indexes:
        if not index[0].startswith('sqlite_'):
            print(f"  - {index[0]}")
    
    conn.close()
    print("\n" + "=" * 50)

def get_table_stats():
    """각 테이블의 레코드 수 확인"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    print("\n📈 테이블 통계")
    print("=" * 30)
    
    tables = ['users', 'posts', 'post_images', 'likes', 'follows', 'comments', 'saved_posts']
    
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"{table:15} : {count:5} 개")
    
    conn.close()
    print("=" * 30)

if __name__ == "__main__":
    # 데이터베이스 초기화 실행
    init_database()
    
    # 구조 확인
    check_database_structure()
    
    # 통계 확인
    get_table_stats()