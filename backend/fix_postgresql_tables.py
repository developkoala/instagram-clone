#!/usr/bin/env python3
"""
PostgreSQL 테이블 구조 확인 및 수정 스크립트
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from app.config import get_settings

def check_and_fix_tables():
    """PostgreSQL 테이블 구조 확인 및 수정"""
    settings = get_settings()
    
    # PostgreSQL 연결
    db_url = settings.database_url
    if not db_url.startswith('postgresql'):
        print("❌ 이 스크립트는 PostgreSQL에서만 실행 가능합니다.")
        return
    
    # 연결 파라미터 파싱
    db_url = db_url.replace('postgresql://', '')
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
            database = 'muksta_db'
            port = 5432
    else:
        # 기본값
        host = "localhost"
        port = 5432
        database = "muksta_db"
        user = "muksta_user"
        password = "your_password"
    
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password
        )
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print(f"✅ PostgreSQL 연결 성공: {database}@{host}")
        
        # likes 테이블 구조 확인
        cursor.execute("""
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'likes'
            ORDER BY ordinal_position
        """)
        
        columns = cursor.fetchall()
        print("\n📋 현재 likes 테이블 구조:")
        for col in columns:
            print(f"  - {col['column_name']}: {col['data_type']} (default: {col['column_default']})")
        
        # created_at 컬럼에 DEFAULT 값이 없으면 추가
        has_created_at_default = False
        for col in columns:
            if col['column_name'] == 'created_at' and col['column_default']:
                has_created_at_default = True
                break
        
        if not has_created_at_default:
            print("\n⚠️ created_at 컬럼에 DEFAULT 값이 없습니다. 추가합니다...")
            cursor.execute("""
                ALTER TABLE likes 
                ALTER COLUMN created_at 
                SET DEFAULT NOW()
            """)
            conn.commit()
            print("✅ created_at DEFAULT 값 추가 완료")
        
        # 테스트: 현재 likes 개수 확인
        cursor.execute("SELECT COUNT(*) as count FROM likes")
        result = cursor.fetchone()
        print(f"\n📊 현재 likes 테이블의 레코드 수: {result['count']}")
        
        # 최근 likes 확인
        cursor.execute("""
            SELECT l.*, u.username, p.id as post_id
            FROM likes l
            JOIN users u ON l.user_id = u.id
            JOIN posts p ON l.post_id = p.id
            ORDER BY l.created_at DESC
            LIMIT 5
        """)
        recent_likes = cursor.fetchall()
        
        if recent_likes:
            print("\n📋 최근 좋아요 5개:")
            for like in recent_likes:
                print(f"  - {like['username']}가 게시물 {like['post_id'][:8]}... 좋아요 ({like['created_at']})")
        
        # 모든 테이블에 대해 DEFAULT 값 확인
        tables = ['posts', 'post_images', 'comments', 'follows', 'saved_posts', 'notifications']
        
        for table in tables:
            cursor.execute(f"""
                SELECT column_name, column_default
                FROM information_schema.columns
                WHERE table_name = '{table}' 
                AND column_name = 'created_at'
            """)
            result = cursor.fetchone()
            if result and not result['column_default']:
                print(f"\n⚠️ {table}.created_at에 DEFAULT 값 추가 중...")
                cursor.execute(f"""
                    ALTER TABLE {table}
                    ALTER COLUMN created_at
                    SET DEFAULT NOW()
                """)
                conn.commit()
                print(f"✅ {table}.created_at DEFAULT 값 추가 완료")
        
        print("\n✅ 모든 테이블 확인 및 수정 완료!")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_and_fix_tables()