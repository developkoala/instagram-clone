# Instagram 클론 - 백엔드 개발 명세서 (MVP 버전)

## 기술 스택
- **프레임워크**: FastAPI 0.104+
- **데이터베이스**: SQLite (개발/프로덕션 공통)
- **인증**: JWT (JSON Web Tokens)
- **파일 저장**: 로컬 파일 시스템
- **이미지 처리**: Pillow
- **검증**: Pydantic
- **CORS**: FastAPI CORS Middleware

## 프로젝트 구조
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 애플리케이션 진입점
│   ├── database.py             # SQLite 데이터베이스 연결
│   ├── dependencies.py         # 의존성 주입
│   ├── schemas/                # Pydantic 스키마
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── post.py
│   │   ├── comment.py
│   │   └── auth.py
│   ├── api/                    # API 라우터
│   │   ├── __init__.py
│   │   ├── auth.py             # 인증 관련
│   │   ├── users.py            # 사용자 관련
│   │   ├── posts.py            # 게시물 관련
│   │   └── comments.py         # 댓글 관련
│   └── utils/                  # 유틸리티 함수
│       ├── __init__.py
│       ├── security.py         # JWT, 암호화
│       └── database_utils.py   # DB 헬퍼 함수
├── uploads/                    # 업로드된 파일 저장소
│   ├── profiles/              # 프로필 사진
│   └── posts/                 # 게시물 이미지
├── instagram_clone.db          # SQLite 데이터베이스 파일
├── requirements.txt
├── .env.example
└── README.md
```

## 데이터베이스 스키마 (SQLite)

### 1. users 테이블
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,  -- UUID
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,  -- 선택사항
    bio TEXT,
    profile_picture TEXT,
    website TEXT,
    is_private BOOLEAN DEFAULT 0,
    is_verified BOOLEAN DEFAULT 0,
    hashed_password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### 2. posts 테이블
```sql
CREATE TABLE posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    caption TEXT,
    location TEXT,
    is_archived BOOLEAN DEFAULT 0,
    comments_disabled BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

### 3. post_images 테이블
```sql
CREATE TABLE post_images (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX idx_post_images_post_id ON post_images(post_id);
```

### 4. comments 테이블
```sql
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
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
```

### 5. likes 테이블
```sql
CREATE TABLE likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
```

### 6. follows 테이블
```sql
CREATE TABLE follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
```

### 7. saved_posts 테이블
```sql
CREATE TABLE saved_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX idx_saved_posts_user_id ON saved_posts(user_id);
CREATE INDEX idx_saved_posts_post_id ON saved_posts(post_id);
```

## Requirements.txt
```
fastapi
uvicorn[standard]
python-jose[cryptography]
passlib[bcrypt]
python-multipart
Pillow
pydantic
python-dotenv
PyJWT
requests
```

## API 엔드포인트 명세

### 인증 관련 API

#### 1. 회원가입
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

Error 400:
{
  "detail": "이미 사용 중인 이메일입니다."
}
```

#### 2. 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response 200:
{
  "access_token": "jwt-access-token",
  "refresh_token": "jwt-refresh-token",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "user@example.com",
    "full_name": null,
    "profile_picture": null
  }
}

Error 401:
{
  "detail": "Invalid email or password"
}
```

#### 3. 토큰 갱신
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "jwt-refresh-token"
}

Response 200:
{
  "access_token": "new-jwt-access-token",
  "token_type": "bearer"
}
```

#### 4. 로그아웃
```http
DELETE /api/auth/logout
Authorization: Bearer {access_token}

Response 200:
{
  "message": "Logged out successfully"
}
```

### 사용자 관련 API

#### 1. 현재 사용자 프로필
```http
GET /api/users/profile
Authorization: Bearer {access_token}

Response 200:
{
  "id": "uuid",
  "username": "johndoe",
  "email": "user@example.com",
  "full_name": "John Doe",
  "bio": "개발자입니다",
  "profile_picture": "url",
  "website": "https://johndoe.dev",
  "followers_count": 150,
  "following_count": 200,
  "posts_count": 25
}
```

#### 2. 특정 사용자 프로필 조회
```http
GET /api/users/{username}
Authorization: Bearer {access_token}

Response 200:
{
  "id": "uuid",
  "username": "johndoe",
  "full_name": "John Doe",
  "bio": "개발자입니다",
  "profile_picture": "url",
  "website": "https://johndoe.dev",
  "followers_count": 150,
  "following_count": 200,
  "posts_count": 25,
  "is_following": false
}
```

#### 3. 프로필 수정
```http
PUT /api/users/profile
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "full_name": "John Doe Updated",
  "bio": "새로운 소개글",
  "website": "https://newsite.com"
}

Response 200:
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "full_name": "John Doe Updated",
    "bio": "새로운 소개글",
    "website": "https://newsite.com"
  }
}
```

#### 4. 프로필 사진 업로드
```http
POST /api/users/profile-picture
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

{
  "file": <image_file>
}

Response 200:
{
  "message": "Profile picture updated successfully",
  "profile_picture": "/uploads/profiles/uuid.jpg"
}
```

#### 5. 팔로우/언팔로우
```http
POST /api/users/{user_id}/follow
Authorization: Bearer {access_token}

Response 200:
{
  "message": "Successfully followed user",
  "is_following": true
}

Error 400:
{
  "detail": "Already following this user"
}

DELETE /api/users/{user_id}/follow
Authorization: Bearer {access_token}

Response 200:
{
  "message": "Successfully unfollowed user",
  "is_following": false
}
```

#### 6. 팔로워/팔로잉 목록
```http
GET /api/users/{username}/followers?page=1&limit=20
Authorization: Bearer {access_token}

Response 200:
{
  "users": [
    {
      "id": "uuid",
      "username": "follower1",
      "full_name": "Follower One",
      "profile_picture": "url",
      "is_following": true
    }
  ],
  "total": 150,
  "page": 1,
  "has_next": true
}

GET /api/users/{username}/following?page=1&limit=20
Authorization: Bearer {access_token}

Response 200:
{
  "users": [
    {
      "id": "uuid",
      "username": "following1",
      "full_name": "Following One",
      "profile_picture": "url",
      "is_following": true
    }
  ],
  "total": 200,
  "page": 1,
  "has_next": true
}
```

### 게시물 관련 API

#### 1. 피드 조회
```http
GET /api/posts/feed?page=1&limit=10
Authorization: Bearer {access_token}

Response 200:
[
  {
    "id": "uuid",
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "profile_picture": "url"
    },
    "images": [
      {
        "id": "uuid",
        "image_url": "/uploads/posts/image1.jpg",
        "position": 0
      }
    ],
    "caption": "멋진 사진입니다",
    "location": "Seoul, Korea",
    "likes_count": 45,
    "comments_count": 12,
    "is_liked": true,
    "is_saved": false,
    "created_at": "2024-01-20T12:00:00Z"
  }
]
```

#### 2. 탐색 페이지 게시물
```http
GET /api/posts/explore?page=1&limit=21
Authorization: Bearer {access_token}

Response 200:
{
  "posts": [
    {
      "id": "uuid",
      "images": [
        {
          "image_url": "/uploads/posts/image1.jpg"
        }
      ],
      "likes_count": 120
    }
  ],
  "page": 1,
  "has_next": true
}
```

#### 3. 게시물 생성
```http
POST /api/posts
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "caption": "새로운 게시물입니다",
  "location": "Seoul, Korea",
  "image_urls": ["/uploads/test1.jpg", "/uploads/test2.jpg"]
}

Response 200:
{
  "message": "Post created successfully",
  "post_id": "uuid"
}
```

#### 4. 게시물 상세 조회
```http
GET /api/posts/{post_id}
Authorization: Bearer {access_token}

Response 200:
{
  "id": "uuid",
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "profile_picture": "url"
  },
  "images": [
    {
      "id": "uuid",
      "image_url": "/uploads/posts/image1.jpg",
      "position": 0
    }
  ],
  "caption": "멋진 사진입니다",
  "location": "Seoul, Korea",
  "likes_count": 45,
  "comments_count": 12,
  "is_liked": true,
  "is_saved": false,
  "created_at": "2024-01-20T12:00:00Z"
}
```

#### 5. 게시물 삭제
```http
DELETE /api/posts/{post_id}
Authorization: Bearer {access_token}

Response 200:
{
  "message": "Post deleted successfully"
}

Error 403:
{
  "detail": "You don't have permission to delete this post"
}
```

#### 6. 좋아요/좋아요 취소
```http
POST /api/posts/{post_id}/like
Authorization: Bearer {access_token}

Response 200:
{
  "message": "Post liked successfully",
  "is_liked": true,
  "likes_count": 46
}

Error 400:
{
  "detail": "Already liked this post"
}

DELETE /api/posts/{post_id}/like
Authorization: Bearer {access_token}

Response 200:
{
  "message": "Post unliked successfully",
  "is_liked": false,
  "likes_count": 45
}
```

#### 7. 게시물 저장/저장 취소
```http
POST /api/posts/{post_id}/save
Authorization: Bearer {access_token}

Response 200:
{
  "message": "Post saved successfully",
  "is_saved": true
}

DELETE /api/posts/{post_id}/save
Authorization: Bearer {access_token}

Response 200:
{
  "message": "Post unsaved successfully",
  "is_saved": false
}
```

#### 8. 저장한 게시물 조회
```http
GET /api/posts/saved?page=1&limit=12
Authorization: Bearer {access_token}

Response 200:
{
  "posts": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "username": "johndoe",
        "profile_picture": "url"
      },
      "images": [
        {
          "image_url": "/uploads/posts/image1.jpg"
        }
      ],
      "caption": "저장한 게시물",
      "likes_count": 45,
      "is_liked": true,
      "is_saved": true
    }
  ],
  "page": 1,
  "has_next": false
}
```

#### 9. 사용자 게시물 조회
```http
GET /api/posts/users/{username}/posts?page=1&limit=12
Authorization: Bearer {access_token}

Response 200:
{
  "posts": [
    {
      "id": "uuid",
      "images": [
        {
          "image_url": "/uploads/posts/image1.jpg"
        }
      ],
      "likes_count": 45,
      "comments_count": 12
    }
  ],
  "total": 25,
  "page": 1,
  "has_next": true
}
```

### 댓글 관련 API

#### 1. 댓글 조회
```http
GET /api/posts/{post_id}/comments
Authorization: Bearer {access_token}

Response 200:
[
  {
    "id": "uuid",
    "content": "멋진 사진이네요!",
    "created_at": "2024-01-20T12:00:00Z",
    "user": {
      "id": "uuid",
      "username": "commenter1",
      "profile_picture": "url"
    }
  }
]
```

#### 2. 댓글 작성
```http
POST /api/posts/{post_id}/comments
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "멋진 사진이네요!"
}

Response 200:
{
  "message": "Comment created successfully",
  "comment_id": "uuid"
}
```

#### 3. 답글 작성
```http
POST /api/posts/{post_id}/comments
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "content": "감사합니다!",
  "parent_comment_id": "parent-comment-uuid"
}

Response 200:
{
  "message": "Comment created successfully",
  "comment_id": "uuid"
}
```

#### 4. 댓글 삭제
```http
DELETE /api/comments/{comment_id}
Authorization: Bearer {access_token}

Response 200:
{
  "message": "Comment deleted successfully"
}

Error 403:
{
  "detail": "You don't have permission to delete this comment"
}
```

## 환경 변수 (.env)
```env
# Database
DATABASE_URL=sqlite:///./instagram_clone.db

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=30

# CORS
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_EXTENSIONS=["jpg", "jpeg", "png", "gif"]
UPLOAD_PATH=./uploads
```

## 실행 방법

### 1. 가상환경 생성 및 활성화
```bash
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
# or
venv\Scripts\activate  # Windows
```

### 2. 패키지 설치
```bash
pip install -r requirements.txt
```

### 3. 데이터베이스 초기화
```bash
python init_db.py
```

### 4. 서버 실행
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# or
python simple_server.py
```

### 5. API 문서 확인
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 테스트

### API 테스트
```bash
python test_api.py
```

## 보안 고려사항

1. **비밀번호**: bcrypt 또는 SHA256으로 해시 처리
2. **JWT 토큰**: 
   - Access Token: 30분 만료
   - Refresh Token: 30일 만료
3. **CORS**: 프로덕션에서는 특정 도메인만 허용
4. **파일 업로드**: 
   - 파일 크기 제한 (10MB)
   - 허용된 확장자만 업로드
   - 파일명 UUID로 변경
5. **SQL Injection**: 파라미터 바인딩 사용
6. **Rate Limiting**: 프로덕션에서 구현 필요

## 성능 최적화

1. **데이터베이스 인덱스**: 자주 조회되는 필드에 인덱스 생성
2. **이미지 최적화**: 
   - 썸네일 생성
   - 이미지 리사이징 (최대 1080px)
   - WebP 포맷 지원 고려
3. **캐싱**: Redis 도입 고려
4. **페이지네이션**: 모든 목록 API에 적용
5. **N+1 쿼리 문제**: JOIN 사용으로 해결

## 향후 개선사항

1. **실시간 기능**: WebSocket을 통한 실시간 알림
2. **스토리 기능**: 24시간 후 자동 삭제
3. **DM 기능**: 1:1 및 그룹 메시지
4. **검색 기능**: 사용자, 해시태그, 위치 검색
5. **알림 시스템**: 좋아요, 댓글, 팔로우 알림
6. **이메일 인증**: 회원가입 시 이메일 확인
7. **2단계 인증**: 추가 보안 옵션
8. **CDN**: 이미지 서빙 최적화
9. **모니터링**: 로깅 및 에러 추적
10. **테스트**: 단위 테스트 및 통합 테스트 추가