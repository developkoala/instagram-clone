# Instagram Clone API Documentation

## 목차
1. [인증 API](#인증-api)
2. [사용자 API](#사용자-api)
3. [게시물 API](#게시물-api)
4. [메시지 API](#메시지-api)
5. [웹소켓 API](#웹소켓-api)
6. [관리자 API](#관리자-api)

## Base URL
- Development: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`

## 인증 방식
모든 보호된 엔드포인트는 JWT Bearer 토큰이 필요합니다:
```
Authorization: Bearer {access_token}
```

---

## 인증 API

### 회원가입
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securePassword123"
}

Response 201:
{
  "message": "User created successfully",
  "user_id": "uuid"
}
```

### 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response 200:
{
  "access_token": "jwt-token",
  "refresh_token": "refresh-token",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "user@example.com"
  }
}
```

### 토큰 갱신
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "refresh-token"
}

Response 200:
{
  "access_token": "new-jwt-token",
  "token_type": "bearer"
}
```

---

## 사용자 API

### 현재 사용자 프로필
```http
GET /api/users/profile
Authorization: Bearer {token}

Response 200:
{
  "id": "uuid",
  "username": "johndoe",
  "email": "user@example.com",
  "full_name": "John Doe",
  "bio": "개발자입니다",
  "profile_picture": "/uploads/profiles/uuid.jpg",
  "followers_count": 150,
  "following_count": 200,
  "posts_count": 25
}
```

### 특정 사용자 프로필
```http
GET /api/users/{username}
Authorization: Bearer {token}

Response 200:
{
  "id": "uuid",
  "username": "johndoe",
  "full_name": "John Doe",
  "bio": "개발자입니다",
  "is_following": false,
  "followers_count": 150,
  "following_count": 200,
  "posts_count": 25
}
```

### 팔로우/언팔로우
```http
POST /api/users/{username}/follow
Authorization: Bearer {token}

Response 200:
{
  "message": "Successfully followed user",
  "is_following": true
}
```

```http
DELETE /api/users/{username}/follow
Authorization: Bearer {token}

Response 200:
{
  "message": "Successfully unfollowed user",
  "is_following": false
}
```

---

## 게시물 API

### 게시물 생성
```http
POST /api/posts
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "caption": "게시물 내용",
  "location": "Seoul, Korea",
  "images": [file1, file2, file3]  // 최대 10개
}

Response 201:
{
  "id": "post-uuid",
  "caption": "게시물 내용",
  "images": [
    {"url": "/uploads/posts/img1.jpg", "position": 0},
    {"url": "/uploads/posts/img2.jpg", "position": 1}
  ],
  "created_at": "2024-01-01T12:00:00Z"
}
```

### 피드 가져오기
```http
GET /api/posts/feed?page=1&limit=10
Authorization: Bearer {token}

Response 200:
{
  "posts": [
    {
      "id": "post-uuid",
      "user": {
        "id": "user-uuid",
        "username": "johndoe",
        "profile_picture": "/uploads/profiles/user.jpg"
      },
      "caption": "게시물 내용",
      "images": [...],
      "likes_count": 42,
      "comments_count": 5,
      "is_liked": false,
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "has_next": true,
  "page": 1
}
```

### 좋아요/좋아요 취소
```http
POST /api/posts/{post_id}/like
Authorization: Bearer {token}

Response 200:
{
  "message": "Post liked",
  "is_liked": true,
  "likes_count": 43
}
```

---

## 메시지 API

### 대화 목록 조회
```http
GET /api/messages/conversations
Authorization: Bearer {token}

Response 200:
[
  {
    "id": "conversation-uuid",
    "participant": {
      "id": "user-uuid",
      "username": "janedoe",
      "profile_picture": "/uploads/profiles/jane.jpg"
    },
    "last_message": {
      "content": "안녕하세요!",
      "created_at": "2024-01-01T12:00:00Z",
      "is_own": false
    },
    "unread_count": 2,
    "updated_at": "2024-01-01T12:00:00Z"
  }
]
```

### 메시지 전송
```http
POST /api/messages/conversations/{conversation_id}/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "안녕하세요!",
  "message_type": "text"
}

Response 200:
{
  "id": "message-uuid",
  "content": "안녕하세요!",
  "message_type": "text",
  "created_at": "2024-01-01T12:00:00Z",
  "is_read": false
}
```

### 대화방 생성/조회
```http
POST /api/messages/conversations/{user_id}
Authorization: Bearer {token}

Response 200:
{
  "conversation_id": "conversation-uuid"
}
```

---

## 웹소켓 API

### 연결
```
ws://localhost:8000/api/ws/connect?token={jwt_token}
```

### 메시지 타입

#### 수신 메시지
```json
// 초기 연결 데이터
{
  "type": "initial_data",
  "online_users": ["user-id-1", "user-id-2"],
  "user_id": "current-user-id"
}

// 새 메시지 수신
{
  "type": "new_message",
  "conversation_id": "conv-uuid",
  "message": {
    "id": "msg-uuid",
    "content": "메시지 내용",
    "sender": {...},
    "is_own": false,
    "created_at": "2024-01-01T12:00:00Z"
  }
}

// 온라인 상태 변경
{
  "type": "online_status",
  "user_id": "user-uuid",
  "is_online": true
}
```

#### 송신 메시지
```json
// Ping (연결 유지)
{
  "type": "ping"
}

// 채팅방 참여
{
  "type": "join_room",
  "room_id": "conversation-id"
}

// 타이핑 상태
{
  "type": "typing",
  "room_id": "conversation-id"
}
```

---

## 관리자 API

### 관리자 로그인
```http
POST /api/admin/login
Authorization: Basic admin:pass123

Response 200:
{
  "access_token": "admin-jwt-token",
  "token_type": "bearer",
  "role": "admin"
}
```

### 사용자 목록
```http
GET /api/admin/users?page=1&limit=20&q=search
Authorization: Bearer {admin_token}

Response 200:
{
  "users": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "page": 1,
  "has_next": true,
  "total": 100
}
```

### 통계 대시보드
```http
GET /api/admin/stats
Authorization: Bearer {admin_token}

Response 200:
{
  "totals": {
    "users": 1234,
    "posts": 5678,
    "likes": 12345,
    "comments": 3456
  },
  "recent": {
    "users": [...],
    "posts": [...]
  },
  "daily": {
    "users": [...],
    "posts": [...]
  }
}
```

---

## 에러 응답

### 400 Bad Request
```json
{
  "detail": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting
- 인증되지 않은 사용자: 100 requests/hour
- 인증된 사용자: 1000 requests/hour
- 파일 업로드: 50 requests/hour

## File Upload Limits
- 프로필 사진: 최대 5MB (JPEG, PNG)
- 게시물 이미지: 최대 10MB per file, 최대 10개 파일
- 지원 형식: JPEG, PNG, GIF, WebP