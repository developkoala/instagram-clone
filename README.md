# Muksta Clone

Muksta 클론 프로젝트입니다. React, TypeScript, Tailwind CSS (프론트엔드)와 FastAPI, SQLAlchemy (백엔드)를 사용하여 구현했습니다.

[![Deploy Status](https://github.com/developkoala/instagram-clone/actions/workflows/deploy.yml/badge.svg)](https://github.com/developkoala/instagram-clone/actions)

## 프로젝트 구조

```
muksta/
├── frontend/          # React + TypeScript 프론트엔드
├── backend/           # FastAPI 백엔드
├── front.md          # 프론트엔드 명세서
├── backend.md        # 백엔드 명세서
├── db.md            # 데이터베이스 설계 명세서
└── guide.md         # 전체 프로젝트 가이드
```

## 시작하기

### 프로젝트 실행

```bash
npm run dev
```

첫 실행 시 자동으로:
- 모든 dependencies 설치
- Python 가상환경 생성
- 백엔드와 프론트엔드 동시 실행

접속 주소:
- 프론트엔드: http://localhost:5173
- 백엔드 API 문서: http://localhost:8000/docs

### 시스템 요구사항
- Node.js 16+
- Python 3.8+
- npm 또는 yarn

## 주요 기능

### 구현된 기능
- ✅ 사용자 인증 (회원가입, 로그인, JWT 토큰)
- ✅ 메인 피드 (무한 스크롤)
- ✅ 사용자 프로필 (프로필 편집, 팔로워/팔로잉 목록)
- ✅ 게시물 기능 (작성, 수정, 삭제, 다중 이미지 업로드)
- ✅ 게시물 좋아요
- ✅ 댓글 시스템 (작성, 삭제)
- ✅ 팔로우/언팔로우
- ✅ 탐색 페이지 (트렌딩 게시물)
- ✅ Direct Message (실시간 채팅)
- ✅ 웹소켓 실시간 통신
- ✅ 실시간 채팅 알림 (토스트 알림)
- ✅ 실시간 시간 업데이트
- ✅ 반응형 디자인
- ✅ Instagram 스타일 UI
- ✅ 관리자 페이지 (/admin)

### 구현 예정 기능
- 스토리 기능
- 검색 기능 개선
- 게시물 저장 기능
- 해시태그 시스템
- 푸시 알림

## 테스트 계정

### 샘플 데이터 생성 (권장)
백엔드가 실행 중일 때:
```bash
npm run create-sample-data
```

### 또는 직접 계정 생성
1. http://localhost:5173/register 에서 새 계정 생성
2. 생성한 계정으로 로그인

## 기술 스택

### 프론트엔드
- React 18+
- TypeScript
- Tailwind CSS
- React Router v6
- Axios
- React Query

### 백엔드
- FastAPI
- SQLAlchemy (ORM 모델)
- Raw SQL (쿼리 실행)
- SQLite (개발) / PostgreSQL (프로덕션)
- Alembic (데이터베이스 마이그레이션)
- JWT 인증
- Pydantic
- WebSocket (실시간 통신)
- Uvicorn (ASGI 서버)

## 데이터베이스 마이그레이션 (Alembic)

### 환경별 자동 감지
- `.env` 파일의 `DATABASE_URL`에 따라 자동으로 SQLite 또는 PostgreSQL 사용
- 로컬 개발: `sqlite:///./instagram_clone.db`
- 프로덕션: `postgresql://user:password@host/dbname`

### 마이그레이션 명령어

```bash
# 새 마이그레이션 생성
cd backend
./venv/bin/alembic revision --autogenerate -m "설명"

# 마이그레이션 적용
./venv/bin/alembic upgrade head

# 마이그레이션 되돌리기
./venv/bin/alembic downgrade -1

# 현재 상태 확인
./venv/bin/alembic current

# 마이그레이션 히스토리
./venv/bin/alembic history
```

### 새로운 환경 설정
1. PostgreSQL 사용 시:
   ```bash
   # .env 파일 수정
   DATABASE_URL=postgresql://username:password@localhost/dbname
   
   # 데이터베이스 생성 후 마이그레이션 실행
   ./venv/bin/alembic upgrade head
   ```

2. SQLite 사용 시 (기본):
   ```bash
   # .env 파일 (또는 기본값 사용)
   DATABASE_URL=sqlite:///./instagram_clone.db
   
   # 마이그레이션 실행
   ./venv/bin/alembic upgrade head
   ```

## 개발 가이드

자세한 개발 가이드는 각 명세서 파일을 참고하세요:
- `front.md`: 프론트엔드 개발 가이드
- `backend.md`: 백엔드 API 명세
- `db.md`: 데이터베이스 스키마
- `guide.md`: 전체 프로젝트 가이드
