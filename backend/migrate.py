"""
데이터베이스 마이그레이션 스크립트
기존 데이터를 유지하면서 새로운 필드와 인덱스 추가
"""

import sqlite3
import os

def migrate_database():
    """기존 데이터베이스에 새로운 필드 추가"""
    
    if not os.path.exists('instagram_clone.db'):
        print("❌ 데이터베이스가 없습니다. database.py를 먼저 실행하세요.")
        return
    
    conn = sqlite3.connect('instagram_clone.db')
    cursor = conn.cursor()
    
    print("🔄 데이터베이스 마이그레이션 시작...")
    
    try:
        # Users 테이블 업데이트
        print("\n📝 Users 테이블 업데이트 중...")
        cursor.execute("ALTER TABLE users ADD COLUMN is_private BOOLEAN DEFAULT FALSE")
        print("  ✅ is_private 필드 추가")
        cursor.execute("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE")
        print("  ✅ is_verified 필드 추가")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("  ⚠️ Users 필드가 이미 존재합니다")
        else:
            print(f"  ❌ Users 업데이트 실패: {e}")
    
    try:
        # Posts 테이블 업데이트
        print("\n📝 Posts 테이블 업데이트 중...")
        cursor.execute("ALTER TABLE posts ADD COLUMN is_archived BOOLEAN DEFAULT FALSE")
        print("  ✅ is_archived 필드 추가")
        cursor.execute("ALTER TABLE posts ADD COLUMN comments_disabled BOOLEAN DEFAULT FALSE")
        print("  ✅ comments_disabled 필드 추가")
        cursor.execute("ALTER TABLE posts ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        print("  ✅ updated_at 필드 추가")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("  ⚠️ Posts 필드가 이미 존재합니다")
        else:
            print(f"  ❌ Posts 업데이트 실패: {e}")
    
    try:
        # Post_images 테이블 업데이트
        print("\n📝 Post_images 테이블 업데이트 중...")
        cursor.execute("ALTER TABLE post_images ADD COLUMN width INTEGER")
        print("  ✅ width 필드 추가")
        cursor.execute("ALTER TABLE post_images ADD COLUMN height INTEGER")
        print("  ✅ height 필드 추가")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("  ⚠️ Post_images 필드가 이미 존재합니다")
        else:
            print(f"  ❌ Post_images 업데이트 실패: {e}")
    
    # Comments 테이블은 복잡해서 재생성이 필요
    print("\n📝 Comments 테이블 재생성 중...")
    cursor.execute("SELECT COUNT(*) FROM comments")
    comment_count = cursor.fetchone()[0]
    
    if comment_count > 0:
        print(f"  ⚠️ 기존 댓글 {comment_count}개를 백업합니다")
        cursor.execute("""
            CREATE TABLE comments_backup AS 
            SELECT id, post_id, user_id, content, created_at 
            FROM comments
        """)
    
    cursor.execute("DROP TABLE IF EXISTS comments")
    cursor.execute('''
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
    ''')
    print("  ✅ Comments 테이블 재생성 완료")
    
    if comment_count > 0:
        cursor.execute("""
            INSERT INTO comments (id, post_id, user_id, content, created_at, updated_at)
            SELECT id, post_id, user_id, content, created_at, created_at
            FROM comments_backup
        """)
        cursor.execute("DROP TABLE comments_backup")
        print(f"  ✅ {comment_count}개 댓글 복원 완료")
    
    # 새로운 인덱스 추가
    print("\n🔍 새로운 인덱스 추가 중...")
    new_indexes = [
        ('idx_comments_parent_id', 'CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id)'),
        ('idx_comments_created_at', 'CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC)'),
        ('idx_saved_posts_post_id', 'CREATE INDEX IF NOT EXISTS idx_saved_posts_post_id ON saved_posts(post_id)'),
        ('idx_saved_posts_created_at', 'CREATE INDEX IF NOT EXISTS idx_saved_posts_created_at ON saved_posts(created_at DESC)'),
    ]
    
    for idx_name, idx_sql in new_indexes:
        try:
            cursor.execute(idx_sql)
            print(f"  ✅ {idx_name} 인덱스 추가")
        except sqlite3.OperationalError:
            print(f"  ⚠️ {idx_name} 인덱스가 이미 존재합니다")
    
    conn.commit()
    conn.close()
    
    print("\n✅ 마이그레이션 완료!")
    print("\n📊 현재 데이터베이스 상태:")
    check_database_status()

def check_database_status():
    """데이터베이스 상태 확인"""
    conn = sqlite3.connect('instagram_clone.db')
    cursor = conn.cursor()
    
    tables = ['users', 'posts', 'post_images', 'likes', 'follows', 'comments', 'saved_posts']
    
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        
        # 컬럼 정보 가져오기
        cursor.execute(f"PRAGMA table_info({table})")
        columns = cursor.fetchall()
        col_names = [col[1] for col in columns]
        
        print(f"\n{table}: {count}개 레코드")
        print(f"  컬럼: {', '.join(col_names)}")
    
    conn.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'check':
        check_database_status()
    else:
        migrate_database()