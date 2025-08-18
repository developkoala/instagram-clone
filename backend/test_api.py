import requests
import json
import time

BASE_URL = "http://localhost:8000"

# Test data
test_user1 = {
    "email": "test1@example.com",
    "username": "testuser1",
    "password": "password123"
}

test_user2 = {
    "email": "test2@example.com", 
    "username": "testuser2",
    "password": "password456"
}

def print_response(name, response):
    print(f"\n{'='*50}")
    print(f"Test: {name}")
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except:
        print(f"Response: {response.text}")
    print(f"{'='*50}")

def test_auth_endpoints():
    print("\n" + "="*60)
    print("TESTING AUTH ENDPOINTS")
    print("="*60)
    
    # 1. Register user 1
    response = requests.post(f"{BASE_URL}/api/auth/register", json=test_user1)
    print_response("Register User 1", response)
    
    # 2. Register user 2
    response = requests.post(f"{BASE_URL}/api/auth/register", json=test_user2)
    print_response("Register User 2", response)
    
    # 3. Try duplicate registration
    response = requests.post(f"{BASE_URL}/api/auth/register", json=test_user1)
    print_response("Register Duplicate (Should Fail)", response)
    
    # 4. Login user 1
    login_data = {
        "email": test_user1["email"],
        "password": test_user1["password"]
    }
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    print_response("Login User 1", response)
    
    if response.status_code == 200:
        token1 = response.json()["access_token"]
    else:
        token1 = None
    
    # 5. Login user 2
    login_data = {
        "email": test_user2["email"],
        "password": test_user2["password"]
    }
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    print_response("Login User 2", response)
    
    if response.status_code == 200:
        token2 = response.json()["access_token"]
    else:
        token2 = None
    
    # 6. Wrong password
    login_data = {
        "email": test_user1["email"],
        "password": "wrongpassword"
    }
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    print_response("Login Wrong Password (Should Fail)", response)
    
    return token1, token2

def test_user_endpoints(token1, token2):
    print("\n" + "="*60)
    print("TESTING USER ENDPOINTS")
    print("="*60)
    
    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}
    
    # 1. Get current user profile
    response = requests.get(f"{BASE_URL}/api/users/profile", headers=headers1)
    print_response("Get Current User Profile", response)
    
    # 2. Update profile
    update_data = {
        "bio": "안녕하세요! 테스트 계정입니다.",
        "website": "https://example.com",
        "full_name": "테스트 유저"
    }
    response = requests.put(f"{BASE_URL}/api/users/profile", json=update_data, headers=headers1)
    print_response("Update Profile", response)
    
    # 3. Get updated profile
    response = requests.get(f"{BASE_URL}/api/users/profile", headers=headers1)
    print_response("Get Updated Profile", response)
    
    # 4. Get other user profile
    response = requests.get(f"{BASE_URL}/api/users/testuser2", headers=headers1)
    print_response("Get Other User Profile", response)
    
    if response.status_code == 200:
        user2_id = response.json()["id"]
    else:
        user2_id = None
    
    # 5. Follow user
    if user2_id:
        response = requests.post(f"{BASE_URL}/api/users/{user2_id}/follow", headers=headers1)
        print_response("Follow User 2", response)
    
    # 6. Try to follow again (should fail)
    if user2_id:
        response = requests.post(f"{BASE_URL}/api/users/{user2_id}/follow", headers=headers1)
        print_response("Follow Again (Should Fail)", response)
    
    # 7. Check following status
    response = requests.get(f"{BASE_URL}/api/users/testuser2", headers=headers1)
    print_response("Check Following Status", response)
    
    # 8. Unfollow user
    if user2_id:
        response = requests.delete(f"{BASE_URL}/api/users/{user2_id}/follow", headers=headers1)
        print_response("Unfollow User 2", response)
    
    return user2_id

def test_post_endpoints(token1, token2):
    print("\n" + "="*60)
    print("TESTING POST ENDPOINTS")
    print("="*60)
    
    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}
    
    # 1. Create post
    post_data = {
        "caption": "첫 번째 테스트 게시물입니다! 🎉",
        "location": "Seoul, Korea",
        "image_urls": ["/uploads/test1.jpg", "/uploads/test2.jpg"]
    }
    response = requests.post(f"{BASE_URL}/api/posts", json=post_data, headers=headers1)
    print_response("Create Post", response)
    
    if response.status_code == 200:
        post_id = response.json().get("post_id")
    else:
        post_id = None
    
    # 2. Create another post as user2
    post_data2 = {
        "caption": "두 번째 사용자의 게시물",
        "image_urls": ["/uploads/test3.jpg"]
    }
    response = requests.post(f"{BASE_URL}/api/posts", json=post_data2, headers=headers2)
    print_response("Create Post (User 2)", response)
    
    # 3. Get feed
    response = requests.get(f"{BASE_URL}/api/posts/feed", headers=headers1)
    print_response("Get Feed", response)
    
    # 4. Like post
    if post_id:
        response = requests.post(f"{BASE_URL}/api/posts/{post_id}/like", headers=headers2)
        print_response("Like Post", response)
    
    # 5. Try to like again (should fail)
    if post_id:
        response = requests.post(f"{BASE_URL}/api/posts/{post_id}/like", headers=headers2)
        print_response("Like Again (Should Fail)", response)
    
    # 6. Unlike post
    if post_id:
        response = requests.delete(f"{BASE_URL}/api/posts/{post_id}/like", headers=headers2)
        print_response("Unlike Post", response)
    
    return post_id

def test_comment_endpoints(token1, token2, post_id):
    print("\n" + "="*60)
    print("TESTING COMMENT ENDPOINTS")
    print("="*60)
    
    if not post_id:
        print("No post_id available for comment testing")
        return
    
    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}
    
    # 1. Create comment
    comment_data = {
        "content": "멋진 사진이네요! 👍"
    }
    response = requests.post(f"{BASE_URL}/api/posts/{post_id}/comments", json=comment_data, headers=headers2)
    print_response("Create Comment", response)
    
    if response.status_code == 200:
        comment_id = response.json().get("comment_id")
    else:
        comment_id = None
    
    # 2. Create reply
    if comment_id:
        reply_data = {
            "content": "감사합니다!",
            "parent_comment_id": comment_id
        }
        response = requests.post(f"{BASE_URL}/api/posts/{post_id}/comments", json=reply_data, headers=headers1)
        print_response("Create Reply", response)
    
    # 3. Get comments
    response = requests.get(f"{BASE_URL}/api/posts/{post_id}/comments", headers=headers1)
    print_response("Get Comments", response)

def test_api_without_auth():
    print("\n" + "="*60)
    print("TESTING WITHOUT AUTHENTICATION")
    print("="*60)
    
    # 1. Try to access protected endpoint without token
    response = requests.get(f"{BASE_URL}/api/users/profile")
    print_response("Get Profile Without Auth (Should Fail)", response)
    
    # 2. Try with invalid token
    headers = {"Authorization": "Bearer invalid_token"}
    response = requests.get(f"{BASE_URL}/api/users/profile", headers=headers)
    print_response("Get Profile With Invalid Token (Should Fail)", response)

def main():
    print("\n" + "#"*60)
    print("# INSTAGRAM CLONE API TEST SUITE")
    print("#"*60)
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"\nServer is running: {response.json()}")
    except:
        print("\nERROR: Server is not running at", BASE_URL)
        return
    
    # Run tests
    token1, token2 = test_auth_endpoints()
    
    if token1 and token2:
        user2_id = test_user_endpoints(token1, token2)
        post_id = test_post_endpoints(token1, token2)
        test_comment_endpoints(token1, token2, post_id)
    
    test_api_without_auth()
    
    print("\n" + "#"*60)
    print("# TEST SUITE COMPLETED")
    print("#"*60)

if __name__ == "__main__":
    main()