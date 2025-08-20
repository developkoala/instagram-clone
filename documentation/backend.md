# 백엔드 API 문서

## 프로젝트 개요
FastAPI 기반의 Instagram 클론 백엔드 서버 - RESTful API와 WebSocket을 통한 실시간 기능 제공

## 기술 스택

### 핵심 프레임워크
- **FastAPI**: 고성능 비동기 웹 프레임워크
- **Uvicorn**: ASGI 서버
- **Python**: 3.8+

### 데이터베이스
- **PostgreSQL**: 프로덕션 데이터베이스
- **SQLite**: 개발 환경 데이터베이스
- **psycopg2**: PostgreSQL 드라이버
- **Raw SQL**: 직접 SQL 쿼리 작성 (ORM 미사용)

### 인증 및 보안
- **python-jose**: JWT 토큰 생성 및 검증
- **passlib[bcrypt]**: 비밀번호 해싱
- **JWT**: Bearer 토큰 인증

### 파일 처리
- **python-multipart**: 파일 업로드
- **Pillow**: 이미지 처리 및 최적화
- **EXIF 처리**: 모바일 이미지 방향 자동 보정

## API 엔드포인트

### 인증 API (`/api/auth`)

| 메소드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| POST | `/register` | 신규 사용자 등록 | ❌ |
| POST | `/login` | 로그인 (JWT 토큰 발급) | ❌ |
| POST | `/refresh` | 액세스 토큰 갱신 | ❌ |
| DELETE | `/logout` | 로그아웃 | ✅ |

### 사용자 API (`/api/users`)

| 메소드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| GET | `/profile` | 현재 사용자 프로필 조회 | ✅ |
| GET | `/suggestions` | 팔로우 추천 목록 | 선택적 |
| GET | `/search` | 사용자 검색 | ✅ |
| GET | `/{username}` | 특정 사용자 프로필 조회 | 선택적 |
| PUT | `/profile` | 프로필 정보 수정 | ✅ |
| POST | `/profile-picture` | 프로필 사진 업로드 | ✅ |
| POST | `/{user_id}/follow` | 사용자 팔로우 | ✅ |
| DELETE | `/{user_id}/follow` | 팔로우 취소 | ✅ |
| GET | `/{username}/followers` | 팔로워 목록 | 선택적 |
| GET | `/{username}/following` | 팔로잉 목록 | 선택적 |
| POST | `/change-password` | 비밀번호 변경 | ✅ |

### 게시물 API (`/api/posts`)

| 메소드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| GET | `/feed` | 피드 조회 (팔로우 기반) | 선택적 |
| GET | `/explore` | 탐색 페이지 (인기 게시물) | 선택적 |
| GET | `/saved` | 저장한 게시물 목록 | ✅ |
| GET | `/{post_id}` | 게시물 상세 조회 | 선택적 |
| POST | `/` | 게시물 작성 (다중 이미지) | ✅ |
| DELETE | `/{post_id}` | 게시물 삭제 | ✅ |
| POST | `/{post_id}/like` | 좋아요 | ✅ |
| DELETE | `/{post_id}/like` | 좋아요 취소 | ✅ |
| POST | `/{post_id}/save` | 게시물 저장 | ✅ |
| DELETE | `/{post_id}/save` | 저장 취소 | ✅ |
| GET | `/users/{username}/posts` | 사용자별 게시물 목록 | 선택적 |

### 댓글 API (`/api`)

| 메소드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| GET | `/posts/{post_id}/comments` | 댓글 목록 조회 | 선택적 |
| POST | `/posts/{post_id}/comments` | 댓글/답글 작성 | ✅ |
| DELETE | `/comments/{comment_id}` | 댓글 삭제 | ✅ |

### 메시지 API (`/api/messages`)

| 메소드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| GET | `/conversations` | 대화 목록 조회 | ✅ |
| POST | `/conversations/{user_id}` | 대화 생성/조회 | ✅ |
| GET | `/conversations/{conversation_id}/messages` | 메시지 조회 | ✅ |
| POST | `/conversations/{conversation_id}/messages` | 메시지 전송 | ✅ |
| POST | `/conversations/{conversation_id}/read` | 읽음 처리 | ✅ |

### 알림 API (`/api/notifications`)

| 메소드 | 엔드포인트 | 설명 | 인증 필요 |
|--------|------------|------|-----------|
| GET | `/` | 알림 목록 조회 | ✅ |
| GET | `/count` | 읽지 않은 알림 수 | ✅ |

### WebSocket API (`/api/ws`)

| 프로토콜 | 엔드포인트 | 설명 | 인증 필요 |
|----------|------------|------|-----------|
| WS | `/connect` | WebSocket 연결 | ✅ |
| GET | `/online-users` | 온라인 사용자 목록 | ✅ |

### 관리자 API (`/api/admin`)

| 메소드 | 엔드포인트 | 설명 | 권한 |
|--------|------------|------|------|
| POST | `/login` | 관리자 로그인 | Admin |
| GET | `/users` | 사용자 목록 조회 | Admin |
| DELETE | `/users/{user_id}` | 사용자 삭제 | Admin |
| GET | `/posts` | 게시물 목록 조회 | Admin |
| DELETE | `/posts/{post_id}` | 게시물 삭제 | Admin |
| GET | `/stats` | 플랫폼 통계 | Admin |

## 데이터베이스 스키마

### 주요 테이블

#### users
```sql
- id (UUID, PK)
- username (VARCHAR, UNIQUE)
- email (VARCHAR, UNIQUE)
- password (VARCHAR)
- profile_picture (VARCHAR)
- bio (TEXT)
- website (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### posts
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- caption (TEXT)
- location (VARCHAR)
- is_archived (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### post_images
```sql
- id (UUID, PK)
- post_id (UUID, FK)
- image_url (VARCHAR)
- position (INTEGER)
- width (INTEGER)
- height (INTEGER)
- created_at (TIMESTAMP)
```

#### comments
```sql
- id (UUID, PK)
- post_id (UUID, FK)
- user_id (UUID, FK)
- parent_id (UUID, FK, NULL)
- content (TEXT)
- created_at (TIMESTAMP)
```

#### likes
```sql
- id (UUID, PK)
- post_id (UUID, FK)
- user_id (UUID, FK)
- created_at (TIMESTAMP)
- UNIQUE(post_id, user_id)
```

#### follows
```sql
- id (UUID, PK)
- follower_id (UUID, FK)
- following_id (UUID, FK)
- created_at (TIMESTAMP)
- UNIQUE(follower_id, following_id)
```

#### conversations
```sql
- id (UUID, PK)
- user1_id (UUID, FK)
- user2_id (UUID, FK)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### messages
```sql
- id (UUID, PK)
- conversation_id (UUID, FK)
- sender_id (UUID, FK)
- content (TEXT)
- is_read (BOOLEAN)
- created_at (TIMESTAMP)
```

## WebSocket 실시간 기능

### 연결 관리
- JWT 토큰 기반 인증 (쿼리 파라미터)
- 사용자별 연결 매핑
- 자동 재연결 지원
- 연결 해제 시 정리

### 메시지 타입

#### ping/pong
```json
{
  "type": "ping"
}
```

#### 알림
```json
{
  "type": "notification",
  "data": {
    "type": "like|comment|follow",
    "from_user": {...},
    "post": {...}
  }
}
```

#### 메시지
```json
{
  "type": "new_message",
  "data": {
    "message": {...},
    "conversation": {...}
  }
}
```

#### 온라인 상태
```json
{
  "type": "online_status",
  "data": {
    "user_id": "...",
    "is_online": true
  }
}
```

## 이미지 처리

### 프로필 사진
- 자동 정사각형 크롭
- 400x400 리사이징
- EXIF 오리엔테이션 자동 보정

### 게시물 이미지
- 최대 1080px 제한
- 다중 이미지 지원 (최대 10장)
- EXIF 오리엔테이션 자동 보정
- 품질 85% 압축
- RGB 변환

### 지원 형식
- PNG
- JPG/JPEG
- GIF

## 인증 및 보안

### JWT 토큰
- **액세스 토큰**: 30일 유효
- **리프레시 토큰**: 7일 유효
- **알고리즘**: HS256
- **Bearer 스킴**: Authorization 헤더

### 비밀번호 보안
- bcrypt 해싱
- 솔트 자동 생성
- 평문 저장 없음

### CORS 설정
```python
allow_origins = [
    "http://muksta.com",
    "https://muksta.com",
    "http://localhost:5173",
    "http://localhost:3000"
]
```

## 환경 설정

### 환경 변수 (.env)
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost/dbname

# JWT
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
REFRESH_TOKEN_EXPIRE_DAYS=7

# Admin
ADMIN_PASSWORD=admin_password

# Frontend
FRONTEND_URL=http://muksta.com

# Server
HOST=127.0.0.1
PORT=8000
```

### 디렉토리 구조
```
backend/
├── app/
│   ├── api/              # API 라우터
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── posts.py
│   │   ├── messages.py
│   │   ├── websocket.py
│   │   └── admin.py
│   ├── models/           # 데이터베이스 모델
│   ├── schemas/          # Pydantic 스키마
│   ├── utils/            # 유틸리티 함수
│   │   ├── database_utils.py
│   │   └── security.py
│   ├── main.py          # FastAPI 앱
│   ├── config.py        # 설정
│   └── database.py      # DB 연결
├── uploads/             # 업로드 파일
│   ├── posts/
│   └── profiles/
├── requirements.txt     # 의존성
└── .env                # 환경 변수
```

## 성능 최적화

### 구현된 최적화
- 비동기 처리 (async/await)
- 데이터베이스 연결 풀링
- 이미지 압축 및 리사이징
- 인덱스 기반 쿼리 최적화
- 페이지네이션

### 캐싱 전략
- 정적 파일 서빙
- JWT 토큰 캐싱

## 배포

### 개발 환경
```bash
# 가상환경 설정
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
uvicorn app.main:app --reload --port 8000
```

### 프로덕션 환경
```bash
# PM2로 관리
pm2 start ecosystem.config.js

# 또는 직접 실행
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 모니터링 및 로깅

### 헬스체크
- `/health` - 서버 상태 확인
- `/` - API 버전 정보

### 로깅
- WebSocket 연결/해제 로깅
- 에러 로깅
- 요청/응답 로깅

## 테스트

### 테스트 전략
- API 엔드포인트 테스트
- WebSocket 연결 테스트
- 인증 플로우 테스트
- 파일 업로드 테스트

### Swagger 문서
- 자동 생성: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 향후 개선 사항

### 계획된 기능
- [ ] Alembic 마이그레이션 시스템
- [ ] Redis 캐싱
- [ ] 이메일 인증
- [ ] 소셜 로그인 (OAuth)
- [ ] 비디오 업로드 지원
- [ ] 해시태그 시스템
- [ ] 추천 알고리즘 고도화

### 성능 개선
- [ ] CDN 통합
- [ ] 데이터베이스 샤딩
- [ ] 마이크로서비스 아키텍처
- [ ] GraphQL 지원