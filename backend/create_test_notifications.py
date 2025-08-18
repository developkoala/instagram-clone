"""
테스트용 알림 생성 스크립트
"""

import sqlite3
from datetime import datetime, timedelta
import random
from app.utils.security import generate_uuid

def create_test_notifications():
    conn = sqlite3.connect('instagram_clone.db')
    cursor = conn.cursor()
    
    try:
        # 모든 사용자 조회
        cursor.execute("SELECT id, username FROM users LIMIT 10")
        users = cursor.fetchall()
        
        if len(users) < 2:
            print("사용자가 2명 이상 필요합니다.")
            return
        
        print(f"총 {len(users)}명의 사용자를 찾았습니다.")
        
        # 첫 번째 사용자를 대상으로 알림 생성
        target_user = users[0]
        target_user_id, target_username = target_user
        print(f"\n대상 사용자: {target_username} (ID: {target_user_id})")
        
        # 대상 사용자의 게시물 조회
        cursor.execute("SELECT id FROM posts WHERE user_id = ? LIMIT 5", (target_user_id,))
        posts = cursor.fetchall()
        
        if not posts:
            # 게시물이 없으면 생성
            post_id = generate_uuid()
            cursor.execute("""
                INSERT INTO posts (id, user_id, caption, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
            """, (
                post_id,
                target_user_id,
                "테스트 게시물입니다.",
                datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
                datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
            ))
            posts = [(post_id,)]
            print(f"테스트 게시물 생성: {post_id}")
        
        # 다른 사용자들이 활동 생성
        now = datetime.utcnow()
        
        for i, user in enumerate(users[1:6], 1):  # 최대 5명의 다른 사용자
            user_id, username = user
            print(f"\n{username}의 활동 생성 중...")
            
            # 1. 팔로우 알림 생성
            try:
                # 이미 팔로우 중인지 확인
                cursor.execute("""
                    SELECT COUNT(*) FROM follows 
                    WHERE follower_id = ? AND following_id = ?
                """, (user_id, target_user_id))
                
                if cursor.fetchone()[0] == 0:
                    follow_time = now - timedelta(hours=i * 2)
                    cursor.execute("""
                        INSERT INTO follows (follower_id, following_id, created_at)
                        VALUES (?, ?, ?)
                    """, (user_id, target_user_id, follow_time.strftime('%Y-%m-%d %H:%M:%S')))
                    print(f"  - {username}이(가) {target_username}을(를) 팔로우")
            except sqlite3.IntegrityError:
                print(f"  - {username}은(는) 이미 {target_username}을(를) 팔로우 중")
            
            # 2. 좋아요 알림 생성
            if posts:
                post_id = posts[0][0]
                try:
                    # 이미 좋아요를 눌렀는지 확인
                    cursor.execute("""
                        SELECT COUNT(*) FROM likes 
                        WHERE user_id = ? AND post_id = ?
                    """, (user_id, post_id))
                    
                    if cursor.fetchone()[0] == 0:
                        like_time = now - timedelta(hours=i * 3 + 1)
                        cursor.execute("""
                            INSERT INTO likes (user_id, post_id, created_at)
                            VALUES (?, ?, ?)
                        """, (user_id, post_id, like_time.strftime('%Y-%m-%d %H:%M:%S')))
                        print(f"  - {username}이(가) 게시물에 좋아요")
                except sqlite3.IntegrityError:
                    print(f"  - {username}은(는) 이미 이 게시물에 좋아요를 누름")
            
            # 3. 댓글 알림 생성
            if posts:
                post_id = posts[0][0]
                comment_id = generate_uuid()
                comment_time = now - timedelta(hours=i)
                comments = [
                    "정말 멋진 사진이네요! 👍",
                    "와우! 대단해요!",
                    "좋은 게시물 감사합니다 😊",
                    "멋져요! 👏",
                    "최고예요!"
                ]
                comment_text = random.choice(comments)
                
                cursor.execute("""
                    INSERT INTO comments (id, post_id, user_id, content, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    comment_id,
                    post_id,
                    user_id,
                    comment_text,
                    comment_time.strftime('%Y-%m-%d %H:%M:%S'),
                    comment_time.strftime('%Y-%m-%d %H:%M:%S')
                ))
                print(f"  - {username}이(가) 댓글 작성: '{comment_text}'")
        
        # 일주일 전, 한달 전 알림도 추가
        if len(users) > 6:
            # 일주일 전 알림
            week_ago_user = users[6]
            user_id, username = week_ago_user
            follow_time = now - timedelta(days=8)
            
            try:
                cursor.execute("""
                    SELECT COUNT(*) FROM follows 
                    WHERE follower_id = ? AND following_id = ?
                """, (user_id, target_user_id))
                
                if cursor.fetchone()[0] == 0:
                    cursor.execute("""
                        INSERT INTO follows (follower_id, following_id, created_at)
                        VALUES (?, ?, ?)
                    """, (user_id, target_user_id, follow_time.strftime('%Y-%m-%d %H:%M:%S')))
                    print(f"\n일주일 전: {username}이(가) {target_username}을(를) 팔로우")
            except:
                pass
        
        if len(users) > 7:
            # 한달 전 알림
            month_ago_user = users[7]
            user_id, username = month_ago_user
            
            # 한달 전 팔로우
            follow_time = now - timedelta(days=35)
            try:
                cursor.execute("""
                    SELECT COUNT(*) FROM follows 
                    WHERE follower_id = ? AND following_id = ?
                """, (user_id, target_user_id))
                
                if cursor.fetchone()[0] == 0:
                    cursor.execute("""
                        INSERT INTO follows (follower_id, following_id, created_at)
                        VALUES (?, ?, ?)
                    """, (user_id, target_user_id, follow_time.strftime('%Y-%m-%d %H:%M:%S')))
                    print(f"한달 전: {username}이(가) {target_username}을(를) 팔로우")
            except:
                pass
            
            # 한달 전 좋아요
            if posts:
                post_id = posts[0][0]
                like_time = now - timedelta(days=32)
                try:
                    cursor.execute("""
                        INSERT INTO likes (user_id, post_id, created_at)
                        VALUES (?, ?, ?)
                    """, (user_id, post_id, like_time.strftime('%Y-%m-%d %H:%M:%S')))
                    print(f"한달 전: {username}이(가) 게시물에 좋아요")
                except:
                    pass
        
        conn.commit()
        print("\n✅ 테스트 알림이 성공적으로 생성되었습니다!")
        print(f"📌 {target_username} 계정으로 로그인하면 알림을 확인할 수 있습니다.")
        
    except Exception as e:
        print(f"오류 발생: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    create_test_notifications()