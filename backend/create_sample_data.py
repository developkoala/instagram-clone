"""
Instagram Clone Sample Data Generator
테스트용 샘플 데이터 생성 스크립트 (Pure SQLite)
"""

import sqlite3
import uuid
import hashlib
from datetime import datetime, timedelta
import random
import os

DATABASE_PATH = "instagram_clone.db"

def get_password_hash(password):
    """간단한 비밀번호 해싱 (실제로는 bcrypt 사용 권장)"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_sample_data():
    """샘플 데이터 생성"""
    
    # 데이터베이스가 없으면 먼저 생성
    if not os.path.exists(DATABASE_PATH):
        print("❌ 데이터베이스가 없습니다. 먼저 database.py를 실행해주세요.")
        return
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    print("🎲 샘플 데이터 생성 시작...")
    
    # 1. 샘플 사용자 생성
    users = [
        ('minjun@example.com', '김민준', '김민준', '안녕하세요! 사진 찍는걸 좋아합니다 📸', 'https://minjun.blog'),
        ('jiwoo@example.com', '이지우', '이지우', '여행과 음식을 사랑해요 ✈️🍕', None),
        ('seoyeon@example.com', '박서연', '박서연', '개발자 | 커피 중독자 ☕', 'https://github.com/seoyeon'),
        ('hajun@example.com', '최하준', '최하준', '일상을 기록합니다 🌸', None),
        ('yujin@example.com', '정유진', '정유진', '운동과 건강한 삶 💪', 'https://yujin.fitness'),
        ('soyeon@example.com', '강소연', '강소연', '예술과 디자인 🎨', None),
        ('jaehyun@example.com', '윤재현', '윤재현', '맛집 탐방가 🍜', None),
        ('minji@example.com', '조민지', '조민지', '패션과 뷰티 💄', 'https://minji.style'),
        ('woojin@example.com', '한우진', '한우진', '자연과 캠핑 ⛺', None),
        ('test@example.com', '테스트', '테스트 유저', '테스트 계정입니다', None)
    ]
    
    user_ids = []
    print("\n👥 사용자 생성 중...")
    
    for email, username, full_name, bio, website in users:
        user_id = str(uuid.uuid4())
        user_ids.append((user_id, username))
        hashed_password = get_password_hash('password123')  # 모든 사용자 동일한 비밀번호
        
        # 프로필 사진 URL - Unsplash의 랜덤 프로필 이미지
        profile_pictures = [
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
            "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop",
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop",
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop",
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop",
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop",
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop"
        ]
        profile_picture = profile_pictures[len(user_ids) % len(profile_pictures)]
        
        try:
            cursor.execute('''
                INSERT INTO users (id, email, username, full_name, bio, profile_picture, website, hashed_password)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, email, username, full_name, bio, profile_picture, website, hashed_password))
            print(f"  ✅ {username} 생성 완료")
        except sqlite3.IntegrityError:
            print(f"  ⚠️  {username} 이미 존재함")
    
    # 2. 샘플 게시물 생성
    captions = [
        "오늘의 일상 ☀️",
        "맛있는 점심 😋",
        "주말 나들이 🌳",
        "새로운 시작! #motivation",
        "행복한 순간들 ❤️",
        "여행의 기록 ✈️ #travel",
        "카페에서 ☕ #coffee",
        "운동 완료! 💪 #fitness",
        "좋은 아침입니다 🌅",
        "오늘도 화이팅! 🎯",
        "멋진 풍경 🏔️",
        "저녁 노을 🌇",
        "책 읽는 시간 📚",
        "요리 시간! 🍳",
        "산책 중 발견 🌼"
    ]
    
    locations = ["Seoul, Korea", "Busan, Korea", "Jeju Island", "Tokyo, Japan", 
                 "New York, USA", "Paris, France", "London, UK", None, None, None]
    
    print("\n📸 게시물 생성 중...")
    post_count = 0
    all_post_ids = []
    
    for user_id, username in user_ids:
        # 각 사용자당 3-8개의 게시물 생성
        num_posts = random.randint(3, 8)
        
        for i in range(num_posts):
            post_id = str(uuid.uuid4())
            all_post_ids.append(post_id)
            caption = random.choice(captions)
            location = random.choice(locations)
            
            # 랜덤한 과거 날짜 생성 (최근 60일 이내)
            days_ago = random.randint(0, 60)
            hours_ago = random.randint(0, 23)
            created_at = datetime.now() - timedelta(days=days_ago, hours=hours_ago)
            
            cursor.execute('''
                INSERT INTO posts (id, user_id, caption, location, created_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (post_id, user_id, caption, location, created_at))
            
            # 실제 이미지 URL 목록 (Unsplash에서 가져온 다양한 이미지)
            post_images = [
                "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1522770179533-24471fcdba45?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1444418776041-9c7e33cc5a9c?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1533827432537-70133748f5c8?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1567306301408-9b74779a11af?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1471357674240-e1a485acb3e1?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1589118949245-7d38baf380d6?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1493612276216-ee3925520721?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1476362555312-ab9e108a0b7e?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1547586696-ea22b4d4235d?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1559703248-dcaaec9fab78?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1496412705862-e0088f16f791?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1502444330042-d86ff428d4e2?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1080&h=1080&fit=crop",
                "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=1080&h=1080&fit=crop"
            ]
            
            # 각 게시물당 1-3개의 이미지 추가
            num_images = random.randint(1, 3)
            for j in range(num_images):
                image_id = str(uuid.uuid4())
                # 랜덤한 이미지 선택
                image_url = random.choice(post_images)
                
                cursor.execute('''
                    INSERT INTO post_images (id, post_id, image_url, position)
                    VALUES (?, ?, ?, ?)
                ''', (image_id, post_id, image_url, j))
            
            post_count += 1
    
    print(f"  ✅ 총 {post_count}개 게시물 생성 완료")
    
    # 3. 랜덤 좋아요 생성
    print("\n❤️ 좋아요 생성 중...")
    like_count = 0
    
    for post_id in all_post_ids:
        # 각 게시물당 0-8명이 좋아요
        num_likes = random.randint(0, min(8, len(user_ids)))
        if num_likes > 0:
            likers = random.sample([uid for uid, _ in user_ids], num_likes)
            for liker_id in likers:
                try:
                    cursor.execute('''
                        INSERT INTO likes (user_id, post_id)
                        VALUES (?, ?)
                    ''', (liker_id, post_id))
                    like_count += 1
                except sqlite3.IntegrityError:
                    pass  # 이미 좋아요한 경우 무시
    
    print(f"  ✅ 총 {like_count}개 좋아요 생성 완료")
    
    # 4. 랜덤 팔로우 관계 생성
    print("\n👥 팔로우 관계 생성 중...")
    follow_count = 0
    
    for follower_id, follower_name in user_ids:
        # 각 사용자가 2-6명을 팔로우
        num_following = random.randint(2, min(6, len(user_ids)-1))
        potential_following = [(uid, uname) for uid, uname in user_ids if uid != follower_id]
        following_list = random.sample(potential_following, num_following)
        
        for following_id, following_name in following_list:
            try:
                cursor.execute('''
                    INSERT INTO follows (follower_id, following_id)
                    VALUES (?, ?)
                ''', (follower_id, following_id))
                follow_count += 1
            except sqlite3.IntegrityError:
                pass  # 이미 팔로우한 경우 무시
    
    print(f"  ✅ 총 {follow_count}개 팔로우 관계 생성 완료")
    
    # 5. 랜덤 댓글 생성
    print("\n💬 댓글 생성 중...")
    comment_count = 0
    
    comment_texts = [
        "멋진 사진이네요! 👍",
        "좋아요! ❤️",
        "대박 ㅋㅋㅋ",
        "너무 예뻐요 😍",
        "최고입니다!",
        "좋은 하루 보내세요~",
        "멋져요! 🔥",
        "와우! 😮",
        "굿굿 👏",
        "저도 가고 싶어요!",
        "부럽네요 ㅎㅎ",
        "잘 봤습니다!",
        "화이팅! 💪",
        "감사합니다 🙏",
        "너무 좋아요!"
    ]
    
    for post_id in all_post_ids:
        # 각 게시물당 0-7개의 댓글
        num_comments = random.randint(0, 7)
        
        for _ in range(num_comments):
            comment_id = str(uuid.uuid4())
            commenter_id = random.choice([uid for uid, _ in user_ids])
            comment_text = random.choice(comment_texts)
            
            # 랜덤한 시간 생성 (게시물 생성 이후)
            hours_after = random.randint(1, 48)
            comment_time = datetime.now() - timedelta(hours=hours_after)
            
            cursor.execute('''
                INSERT INTO comments (id, post_id, user_id, content, created_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (comment_id, post_id, commenter_id, comment_text, comment_time))
            comment_count += 1
    
    print(f"  ✅ 총 {comment_count}개 댓글 생성 완료")
    
    # 6. 랜덤 저장 게시물 생성
    print("\n🔖 저장한 게시물 생성 중...")
    save_count = 0
    
    for user_id, username in user_ids:
        # 각 사용자가 1-5개의 게시물을 저장
        num_saves = random.randint(1, min(5, len(all_post_ids)))
        saved_posts = random.sample(all_post_ids, num_saves)
        
        for post_id in saved_posts:
            try:
                cursor.execute('''
                    INSERT INTO saved_posts (user_id, post_id)
                    VALUES (?, ?)
                ''', (user_id, post_id))
                save_count += 1
            except sqlite3.IntegrityError:
                pass  # 이미 저장한 경우 무시
    
    print(f"  ✅ 총 {save_count}개 저장 완료")
    
    # 커밋 및 종료
    conn.commit()
    conn.close()
    
    print("\n" + "=" * 50)
    print("🎉 모든 샘플 데이터 생성 완료!")
    print("=" * 50)
    print("\n📝 테스트 계정 정보:")
    print("  이메일: test@example.com")
    print("  비밀번호: password123")
    print("\n💡 모든 계정의 비밀번호는 'password123' 입니다.")

def clear_all_data():
    """모든 데이터 삭제 (테이블 구조는 유지)"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    print("\n⚠️  모든 데이터 삭제 중...")
    
    # 순서 중요: 외래키 제약 때문에 역순으로 삭제
    tables = ['saved_posts', 'comments', 'likes', 'follows', 'post_images', 'posts', 'users']
    
    for table in tables:
        cursor.execute(f'DELETE FROM {table}')
        print(f"  ❌ {table} 데이터 삭제됨")
    
    conn.commit()
    conn.close()
    print("\n✅ 모든 데이터가 삭제되었습니다.")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'clear':
        # python create_sample_data.py clear 로 실행하면 데이터 삭제
        clear_all_data()
    else:
        # 기본: 샘플 데이터 생성
        create_sample_data()
        
        # 생성된 데이터 통계 확인
        from database import get_table_stats
        get_table_stats()