#!/usr/bin/env python3
"""
좋아요 API 테스트 스크립트
"""
import requests
import json

# 설정
BASE_URL = "http://localhost:8000"
TEST_EMAIL = "coder@muksta.com"  # 테스트 계정
TEST_PASSWORD = "coder123"

def test_like_api():
    # 1. 로그인
    print("1. 로그인 중...")
    login_response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    
    if login_response.status_code != 200:
        print(f"❌ 로그인 실패: {login_response.status_code}")
        print(login_response.text)
        return
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"✅ 로그인 성공")
    
    # 2. 피드 가져오기 (게시물 ID 획득)
    print("\n2. 피드 가져오기...")
    feed_response = requests.get(
        f"{BASE_URL}/api/posts/feed",
        headers=headers
    )
    
    if feed_response.status_code != 200:
        print(f"❌ 피드 가져오기 실패: {feed_response.status_code}")
        return
    
    posts = feed_response.json()
    if not posts:
        print("❌ 게시물이 없습니다")
        return
    
    post_id = posts[0]["id"]
    print(f"✅ 첫 번째 게시물 ID: {post_id}")
    
    # 3. 좋아요 테스트
    print(f"\n3. 게시물 {post_id}에 좋아요...")
    like_response = requests.post(
        f"{BASE_URL}/api/posts/{post_id}/like",
        headers=headers
    )
    
    print(f"응답 상태: {like_response.status_code}")
    print(f"응답 내용: {like_response.text}")
    
    if like_response.status_code == 200:
        print("✅ 좋아요 성공")
        data = like_response.json()
        print(f"   - is_liked: {data.get('is_liked')}")
        print(f"   - likes_count: {data.get('likes_count')}")
    elif like_response.status_code == 400:
        print("⚠️ 400 Bad Request")
        try:
            error_data = like_response.json()
            print(f"   - Error: {error_data.get('detail')}")
        except:
            print(f"   - Raw response: {like_response.text}")
    else:
        print(f"❌ 좋아요 실패")
    
    # 4. 좋아요 취소 테스트
    print(f"\n4. 게시물 {post_id}에서 좋아요 취소...")
    unlike_response = requests.delete(
        f"{BASE_URL}/api/posts/{post_id}/like",
        headers=headers
    )
    
    print(f"응답 상태: {unlike_response.status_code}")
    print(f"응답 내용: {unlike_response.text}")
    
    if unlike_response.status_code == 200:
        print("✅ 좋아요 취소 성공")
        data = unlike_response.json()
        print(f"   - is_liked: {data.get('is_liked')}")
        print(f"   - likes_count: {data.get('likes_count')}")
    elif unlike_response.status_code == 400:
        print("⚠️ 400 Bad Request")
        try:
            error_data = unlike_response.json()
            print(f"   - Error: {error_data.get('detail')}")
        except:
            print(f"   - Raw response: {unlike_response.text}")

if __name__ == "__main__":
    print("=" * 50)
    print("좋아요 API 테스트")
    print("=" * 50)
    
    try:
        test_like_api()
    except requests.exceptions.ConnectionError:
        print("\n❌ 백엔드 서버에 연결할 수 없습니다.")
        print("   서버가 실행 중인지 확인하세요:")
        print("   cd backend && python -m uvicorn app.main:app --reload --port 8000")
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
    
    print("\n" + "=" * 50)