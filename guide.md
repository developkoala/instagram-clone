# Instagram 클론 프로젝트 - 전체 개발 가이드

## 📋 프로젝트 개요

### 목표
완전한 기능의 Instagram 클론 웹 애플리케이션을 개발하여 소셜 미디어 플랫폼의 핵심 기능들을 구현합니다.

### 기술 스택
- **Frontend**: React 18+ with TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python), SQLAlchemy
- **Database**: SQLite (개발) / PostgreSQL (프로덕션)
- **인증**: JWT (JSON Web Tokens)
- **실시간**: WebSocket
- **파일 저장**: 로컬 파일 시스템 / AWS S3
- **배포**: Vercel (Frontend) / Railway/Heroku (Backend)

## 🚀 빠른 시작 가이드

### 개발 환경 설정

#### 1. 프로젝트 클론 및 초기 설정
```bash
# 프로젝트 디렉토리 생성
mkdir instagram-clone
cd instagram-clone

# 프론트엔드와 백엔드 디렉토리 생성
mkdir frontend backend
```

#### 2. 백엔드 설정
```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# FastAPI 및 의존성 설치
pip install fastapi uvicorn sqlalchemy alembic python-jose[cryptography] passlib[bcrypt] python-multipart pillow aiofiles python-dotenv

# requirements.txt 생성
pip freeze > requirements.txt

# 프로젝트 구조 생성
mkdir -p app/{models,schemas,api,services,utils}
touch app/{__init__.py,main.py,config.py,database.py,dependencies.py}
touch app/models/{__init__.py,user.py,post.py,comment.py}
touch app/schemas/{__init__.py,user.py,post.py,auth.py}
touch app/api/{__init__.py,auth.py,users.py,posts.py}
touch app/services/{__init__.py,auth_service.py,user_service.py}
touch app/utils/{__init__.py,security.py}
```

#### 3. 프론트엔드 설정
```bash
cd ../frontend

# React 앱 생성 (TypeScript 템플릿)
npx create-react-app . --template typescript

# 필수 의존성 설치
npm install axios react-router-dom @types/react-router-dom
npm install -D tailwindcss postcss autoprefixer
npm install react-query @tanstack/react-query

# Tailwind CSS 설정
npx tailwindcss init -p
```

## 📁 프로젝트 구조

```
instagram-clone/
├── frontend/                    # React 프론트엔드
│   ├── public/
│   ├── src/
│   │   ├── components/         # 재사용 컴포넌트
│   │   │   ├── common/        # 공통 컴포넌트
│   │   │   ├── layout/        # 레이아웃 컴포넌트
│   │   │   ├── post/          # 게시물 관련
│   │   │   └── user/          # 사용자 관련
│   │   ├── pages/             # 페이지 컴포넌트
│   │   │   ├── auth/          # 인증 관련
│   │   │   ├── home/          # 홈 피드
│   │   │   ├── profile/       # 프로필
│   │   │   ├── explore/       # 탐색
│   │   │   └── messages/      # 메시징
│   │   ├── contexts/          # React Context
│   │   ├── hooks/             # 커스텀 훅
│   │   ├── services/          # API 서비스
│   │   ├── utils/             # 유틸리티
│   │   ├── types/             # TypeScript 타입
│   │   └── styles/            # 스타일
│   ├── package.json
│   └── tailwind.config.js
└── backend/                     # FastAPI 백엔드
    ├── app/
    │   ├── models/             # SQLAlchemy 모델
    │   ├── schemas/            # Pydantic 스키마
    │   ├── api/                # API 라우터
    │   ├── services/           # 비즈니스 로직
    │   ├── utils/              # 유틸리티
    │   ├── main.py             # 앱 진입점
    │   ├── config.py           # 설정
    │   └── database.py         # DB 연결
    ├── migrations/             # DB 마이그레이션
    ├── uploads/                # 업로드 파일
    ├── requirements.txt
    └── .env
```

## 🔧 개발 단계별 가이드

### Phase 1: 기본 인프라 구축 (1-2주)

#### 백엔드 기본 설정
1. **FastAPI 앱 생성**
```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, users, posts
from app.database import engine, Base

app = FastAPI(title="Instagram Clone API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(posts.router, prefix="/api/posts", tags=["posts"])

@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)
```

2. **데이터베이스 연결 설정**
```python
# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./instagram.db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### 프론트엔드 기본 설정
1. **라우터 설정**
```tsx
// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import Home from './pages/home/Feed';
import Login from './pages/auth/Login';
import Profile from './pages/profile/Profile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/profile/:username" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

### Phase 2: 사용자 인증 시스템 (1주)

#### 백엔드 인증 구현
1. **JWT 토큰 유틸리티**
2. **사용자 모델 및 스키마**
3. **인증 API 엔드포인트**
4. **비밀번호 해싱 및 검증**

#### 프론트엔드 인증 구현
1. **AuthContext 생성**
2. **로그인/회원가입 폼**
3. **JWT 토큰 관리**
4. **Private Route 구현**

### Phase 3: 사용자 프로필 관리 (1주)

#### 구현 기능
- 프로필 조회 및 수정
- 프로필 사진 업로드
- 팔로우/언팔로우 기능
- 팔로워/팔로잉 목록

### Phase 4: 게시물 시스템 (2주)

#### 구현 기능
- 게시물 작성 (다중 이미지 업로드)
- 게시물 피드 조회
- 좋아요/저장 기능
- 해시태그 시스템
- 사용자 태그 기능

### Phase 5: 댓글 시스템 (1주)

#### 구현 기능
- 댓글 작성/수정/삭제
- 대댓글 (중첩 댓글)
- 댓글 좋아요
- 실시간 댓글 업데이트

### Phase 6: 검색 및 탐색 (1주)

#### 구현 기능
- 사용자명/해시태그 검색
- 인기 게시물 탐색
- 추천 사용자
- 검색 기록 관리

### Phase 7: 실시간 기능 (1-2주)

#### 구현 기능
- WebSocket 연결
- Direct Message 시스템
- 실시간 알림
- 온라인 상태 표시

### Phase 8: 스토리 기능 (1주)

#### 구현 기능
- 스토리 업로드
- 스토리 뷰어
- 24시간 자동 삭제
- 스토리 조회자 목록

## 🛠️ 개발 도구 및 설정

### 코드 품질 도구

#### ESLint & Prettier (프론트엔드)
```json
// .eslintrc.json
{
  "extends": [
    "react-app",
    "react-app/jest"
  ],
  "rules": {
    "no-unused-vars": "warn",
    "no-console": "warn"
  }
}
```

#### Black & Flake8 (백엔드)
```bash
pip install black flake8
```

### 환경 변수 관리

#### 백엔드 (.env)
```env
DATABASE_URL=sqlite:///./instagram.db
SECRET_KEY=your-super-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

#### 프론트엔드 (.env)
```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WEBSOCKET_URL=ws://localhost:8000/ws
```

## 📱 반응형 디자인 가이드

### 브레이크포인트
```css
/* Tailwind CSS 기본 브레이크포인트 */
sm: 640px   /* 모바일 landscape */
md: 768px   /* 태블릿 */
lg: 1024px  /* 데스크톱 */
xl: 1280px  /* 큰 데스크톱 */
```

### 레이아웃 전략
- **모바일 우선 (Mobile First)** 디자인
- **플렉시블 그리드** 시스템
- **터치 친화적** 인터페이스
- **적응형 이미지** 처리

## 🧪 테스트 전략

### 백엔드 테스트
```python
# tests/test_auth.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register_user():
    response = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "password": "password123",
        "full_name": "Test User"
    })
    assert response.status_code == 201

def test_login_user():
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
```

### 프론트엔드 테스트
```tsx
// src/components/__tests__/LoginForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import LoginForm from '../auth/LoginForm';

test('renders login form', () => {
  render(<LoginForm />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});

test('submits form with valid data', async () => {
  render(<LoginForm />);
  
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' }
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'password123' }
  });
  
  fireEvent.click(screen.getByRole('button', { name: /login/i }));
  
  // 로그인 로직 검증
});
```

## 🚀 배포 가이드

### 프론트엔드 배포 (Vercel)
```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 배포
vercel

# 환경 변수 설정
vercel env add REACT_APP_API_URL
```

### 백엔드 배포 (Railway/Heroku)
```dockerfile
# Dockerfile
FROM python:3.11

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 데이터베이스 마이그레이션
```bash
# Alembic 초기화
alembic init migrations

# 마이그레이션 생성
alembic revision --autogenerate -m "Initial migration"

# 마이그레이션 적용
alembic upgrade head
```

## 📊 성능 최적화

### 프론트엔드 최적화
1. **코드 스플리팅**
   - React.lazy() 사용
   - 라우트별 청크 분리

2. **이미지 최적화**
   - WebP 포맷 사용
   - 레이지 로딩 구현
   - 이미지 압축

3. **캐싱 전략**
   - React Query 사용
   - 브라우저 캐시 활용

### 백엔드 최적화
1. **데이터베이스 최적화**
   - 적절한 인덱스 생성
   - 쿼리 최적화
   - 연결 풀링

2. **API 성능**
   - 페이지네이션 구현
   - 응답 캐싱
   - 압축 사용

## 🔒 보안 가이드

### 인증 보안
- **JWT 토큰** 만료 시간 설정
- **Refresh Token** 로테이션
- **HTTPS** 사용 강제
- **CORS** 적절한 설정

### 데이터 보안
- **SQL Injection** 방지 (ORM 사용)
- **XSS** 방지 (입력 검증)
- **파일 업로드** 보안 (확장자/크기 제한)
- **Rate Limiting** 구현

## 🐛 디버깅 및 로깅

### 백엔드 로깅
```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.2f}s")
    return response
```

### 프론트엔드 에러 처리
```tsx
// src/components/ErrorBoundary.tsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

## 📚 추가 리소스

### 유용한 라이브러리
- **Frontend**: 
  - react-hook-form (폼 관리)
  - react-spring (애니메이션)
  - react-intersection-observer (무한 스크롤)
  
- **Backend**:
  - celery (백그라운드 작업)
  - redis (캐싱)
  - sentry (에러 모니터링)

### 학습 자료
- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [React 공식 문서](https://reactjs.org/)
- [SQLAlchemy 문서](https://docs.sqlalchemy.org/)
- [Tailwind CSS 문서](https://tailwindcss.com/)

## 🎯 마일스톤 및 일정

### 총 개발 기간: 8-10주

| 주차 | 목표 | 주요 기능 |
|------|------|-----------|
| 1-2주 | 기본 인프라 | 프로젝트 설정, 인증 시스템 |
| 3주 | 사용자 관리 | 프로필, 팔로우 기능 |
| 4-5주 | 게시물 시스템 | 작성, 조회, 좋아요 |
| 6주 | 댓글 시스템 | 댓글, 대댓글 기능 |
| 7주 | 검색/탐색 | 검색, 추천 기능 |
| 8-9주 | 실시간 기능 | 메시징, 알림 |
| 10주 | 최적화/배포 | 성능 최적화, 배포 |

이 가이드를 따라 단계적으로 개발하면 완성도 높은 Instagram 클론을 구축할 수 있습니다. 각 단계에서 충분한 테스트와 리팩토링을 거쳐 안정적인 애플리케이션을 만들어보세요!