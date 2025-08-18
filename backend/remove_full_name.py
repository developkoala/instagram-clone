"""
데이터베이스에서 full_name 컬럼을 제거하는 마이그레이션 스크립트
"""

import sqlite3
import os

def main():
    # 데이터베이스 경로
    db_path = "instagram_clone.db"
    
    if not os.path.exists(db_path):
        print(f"❌ 데이터베이스 파일 {db_path}을 찾을 수 없습니다.")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 백업을 위해 기존 테이블의 데이터를 확인
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"📊 총 {user_count}명의 사용자 데이터가 있습니다.")
        
        # 새로운 테이블 생성 (full_name 없이)
        print("🔨 새로운 users 테이블 구조 생성 중...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users_new (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE NOT NULL,
                bio TEXT,
                profile_picture TEXT,
                website TEXT,
                is_private BOOLEAN DEFAULT 0,
                is_verified BOOLEAN DEFAULT 0,
                hashed_password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 기존 데이터 마이그레이션 (full_name 제외)
        print("📦 데이터 마이그레이션 중...")
        cursor.execute("""
            INSERT INTO users_new (
                id, email, username, bio, profile_picture, website,
                is_private, is_verified, hashed_password, created_at, updated_at
            )
            SELECT 
                id, email, username, bio, profile_picture, website,
                is_private, is_verified, hashed_password, created_at, updated_at
            FROM users
        """)
        
        # 기존 테이블 삭제 및 새 테이블 이름 변경
        print("🔄 테이블 교체 중...")
        cursor.execute("DROP TABLE users")
        cursor.execute("ALTER TABLE users_new RENAME TO users")
        
        # 인덱스 재생성
        print("📇 인덱스 재생성 중...")
        cursor.execute("CREATE INDEX idx_users_email ON users(email)")
        cursor.execute("CREATE INDEX idx_users_username ON users(username)")
        
        conn.commit()
        print("✅ full_name 컬럼이 성공적으로 제거되었습니다!")
        
        # 마이그레이션 후 확인
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        print("\n📋 업데이트된 users 테이블 구조:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()