# Instagram Clone Backend API

## 🚀 시작하기

### 1. 패키지 설치
```bash
pip install -r requirements.txt
```

### 2. 데이터베이스 초기화
```bash
python3 database.py
python3 create_sample_data.py
```

### 3. 서버 실행
```bash
# 방법 1: 실행 스크립트 사용
./run.sh

# 방법 2: 직접 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 📖 API 문서

서버 실행 후 아래 URL에서 확인:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🧪 테스트 계정

```
이메일: test@example.com
비밀번호: password123
```

모든 테스트 계정의 비밀번호는 `password123`입니다.

## 📁 프로젝트 구조

```
backend/
├── app/
│   ├── api/           # API 엔드포인트
│   │   ├── auth.py    # 인증 관련
│   │   ├── users.py   # 사용자 관련
│   │   ├── posts.py   # 게시물 관련
│   │   └── comments.py # 댓글 관련
│   ├── schemas/       # Pydantic 스키마
│   ├── utils/         # 유틸리티 함수
│   ├── dependencies.py # 의존성 주입
│   └── main.py        # FastAPI 앱
├── uploads/           # 업로드된 파일
├── instagram_clone.db # SQLite DB
└── requirements.txt
```

## 🔑 주요 API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신
- `DELETE /api/auth/logout` - 로그아웃

### 사용자
- `GET /api/users/profile` - 현재 사용자 프로필
- `GET /api/users/{username}` - 특정 사용자 프로필
- `PUT /api/users/profile` - 프로필 수정
- `POST /api/users/profile-picture` - 프로필 사진 업로드
- `POST /api/users/{user_id}/follow` - 팔로우
- `DELETE /api/users/{user_id}/follow` - 언팔로우

### 게시물
- `GET /api/posts/feed` - 피드 조회
- `GET /api/posts/explore` - 탐색 게시물
- `GET /api/posts/{post_id}` - 게시물 상세
- `POST /api/posts` - 게시물 작성
- `DELETE /api/posts/{post_id}` - 게시물 삭제
- `POST /api/posts/{post_id}/like` - 좋아요
- `DELETE /api/posts/{post_id}/like` - 좋아요 취소

### 댓글
- `GET /api/posts/{post_id}/comments` - 댓글 조회
- `POST /api/posts/{post_id}/comments` - 댓글 작성
- `DELETE /api/comments/{comment_id}` - 댓글 삭제