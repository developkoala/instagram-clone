#!/usr/bin/env python3
"""
이미지 URL을 상대 경로로 변경하는 스크립트
기존: http://localhost:8000/uploads/...
변경: /uploads/...
"""

import os
import sys
from pathlib import Path

# 프로젝트 루트 경로 설정
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.utils.database_utils import execute_query, get_connection
from app.config import get_settings

def fix_image_urls():
    """데이터베이스의 모든 이미지 URL을 상대 경로로 변경"""
    
    settings = get_settings()
    print(f"🔧 이미지 URL 수정 시작...")
    print(f"📦 데이터베이스: {settings.database_url}")
    
    try:
        # 1. users 테이블의 profile_picture 수정
        print("\n1️⃣ users 테이블 수정 중...")
        
        # http://localhost:8000 제거
        user_query = """
            UPDATE users 
            SET profile_picture = REPLACE(profile_picture, 'http://localhost:8000', '')
            WHERE profile_picture LIKE 'http://localhost:8000%'
        """
        execute_query(user_query)
        
        # http://127.0.0.1:8000 제거
        user_query2 = """
            UPDATE users 
            SET profile_picture = REPLACE(profile_picture, 'http://127.0.0.1:8000', '')
            WHERE profile_picture LIKE 'http://127.0.0.1:8000%'
        """
        execute_query(user_query2)
        
        # 영향받은 행 수 확인
        check_users = execute_query(
            "SELECT COUNT(*) as count FROM users WHERE profile_picture IS NOT NULL AND profile_picture != ''"
        )
        print(f"   ✅ users 테이블: {check_users[0]['count']}개 프로필 이미지")
        
        # 2. post_images 테이블의 image_url 수정
        print("\n2️⃣ post_images 테이블 수정 중...")
        
        # http://localhost:8000 제거
        post_query = """
            UPDATE post_images 
            SET image_url = REPLACE(image_url, 'http://localhost:8000', '')
            WHERE image_url LIKE 'http://localhost:8000%'
        """
        execute_query(post_query)
        
        # http://127.0.0.1:8000 제거
        post_query2 = """
            UPDATE post_images 
            SET image_url = REPLACE(image_url, 'http://127.0.0.1:8000', '')
            WHERE image_url LIKE 'http://127.0.0.1:8000%'
        """
        execute_query(post_query2)
        
        # 영향받은 행 수 확인
        check_posts = execute_query(
            "SELECT COUNT(*) as count FROM post_images"
        )
        print(f"   ✅ post_images 테이블: {check_posts[0]['count']}개 게시물 이미지")
        
        # 3. stories 테이블의 image_url 수정 (있는 경우)
        print("\n3️⃣ stories 테이블 확인 중...")
        try:
            # http://localhost:8000 제거
            story_query = """
                UPDATE stories 
                SET image_url = REPLACE(image_url, 'http://localhost:8000', '')
                WHERE image_url LIKE 'http://localhost:8000%'
            """
            execute_query(story_query)
            
            # http://127.0.0.1:8000 제거
            story_query2 = """
                UPDATE stories 
                SET image_url = REPLACE(image_url, 'http://127.0.0.1:8000', '')
                WHERE image_url LIKE 'http://127.0.0.1:8000%'
            """
            execute_query(story_query2)
            
            check_stories = execute_query(
                "SELECT COUNT(*) as count FROM stories"
            )
            print(f"   ✅ stories 테이블: {check_stories[0]['count']}개 스토리 이미지")
        except Exception as e:
            print(f"   ⚠️ stories 테이블 없음 또는 오류: {e}")
        
        # 4. messages 테이블의 image_url 수정 (있는 경우)
        print("\n4️⃣ messages 테이블 확인 중...")
        try:
            # http://localhost:8000 제거
            message_query = """
                UPDATE messages 
                SET image_url = REPLACE(image_url, 'http://localhost:8000', '')
                WHERE image_url LIKE 'http://localhost:8000%'
            """
            execute_query(message_query)
            
            # http://127.0.0.1:8000 제거
            message_query2 = """
                UPDATE messages 
                SET image_url = REPLACE(image_url, 'http://127.0.0.1:8000', '')
                WHERE image_url LIKE 'http://127.0.0.1:8000%'
            """
            execute_query(message_query2)
            
            check_messages = execute_query(
                "SELECT COUNT(*) as count FROM messages WHERE image_url IS NOT NULL AND image_url != ''"
            )
            print(f"   ✅ messages 테이블: {check_messages[0]['count']}개 메시지 이미지")
        except Exception as e:
            print(f"   ⚠️ messages 테이블 없음 또는 오류: {e}")
        
        print("\n✨ 모든 이미지 URL이 상대 경로로 변경되었습니다!")
        
        # 샘플 데이터 확인
        print("\n📋 샘플 데이터 확인:")
        
        # users 샘플
        user_samples = execute_query(
            "SELECT username, profile_picture FROM users WHERE profile_picture IS NOT NULL LIMIT 3"
        )
        if user_samples:
            print("\n👤 Users:")
            for user in user_samples:
                print(f"   - {user['username']}: {user['profile_picture']}")
        
        # post_images 샘플
        post_samples = execute_query(
            "SELECT image_url FROM post_images LIMIT 3"
        )
        if post_samples:
            print("\n📸 Posts:")
            for post in post_samples:
                print(f"   - {post['image_url']}")
        
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = fix_image_urls()
    sys.exit(0 if success else 1)