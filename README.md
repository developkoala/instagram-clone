# Muksta - Instagram Clone

완전히 기능하는 Instagram 클론 프로젝트입니다. React 19, TypeScript, Tailwind CSS (프론트엔드)와 FastAPI, SQLAlchemy (백엔드)를 사용하여 구현했습니다.

[![Deploy Status](https://github.com/developkoala/instagram-clone/actions/workflows/deploy.yml/badge.svg)](https://github.com/developkoala/instagram-clone/actions)
[![CI Status](https://github.com/developkoala/instagram-clone/actions/workflows/ci.yml/badge.svg)](https://github.com/developkoala/instagram-clone/actions)

🌐 **라이브 데모**: [https://muksta.com](https://muksta.com)

## 🏗️ 프로젝트 구조

```
muksta/
├── frontend/              # React 19 + TypeScript + Vite
├── backend/               # FastAPI + SQLAlchemy 2.0
├── .github/workflows/     # CI/CD 파이프라인
├── ecosystem.config.js    # PM2 프로덕션 설정
└── 문서/
    ├── README.md          # 프로젝트 개요 (현재 파일)
    ├── ENV_SETUP.md       # ⚠️ 환경 설정 규칙 (필독!)
    ├── CLAUDE.md          # Claude Code AI 가이드
    ├── DEPLOYMENT.md      # 배포 가이드
    ├── API_DOCS.md        # API 명세서
    ├── FEATURES.md        # 기능 상세 설명
    └── TEST_ACCOUNTS.md   # 테스트 계정 정보
```

## 🚀 시작하기

### 빠른 시작

```bash
# 저장소 클론
git clone https://github.com/developkoala/instagram-clone.git
cd instagram-clone

# 개발 서버 실행 (프론트엔드 + 백엔드)
npm run dev
```

첫 실행 시 자동으로:
- ✨ 모든 dependencies 설치
- 🐍 Python 가상환경 생성 및 패키지 설치
- 🗄️ SQLite 데이터베이스 초기화
- 🚀 백엔드(8000)와 프론트엔드(5173) 동시 실행

접속 주소:
- 프론트엔드: http://localhost:5173
- 백엔드 API 문서: http://localhost:8000/docs
- WebSocket: ws://localhost:8000/api/ws

### 시스템 요구사항
- Node.js 18+ (권장: 20.x)
- Python 3.8+ (권장: 3.11+)
- npm 8+ 또는 yarn
- Git

## ⚠️ 환경 설정 (중요!)

**반드시 [ENV_SETUP.md](./ENV_SETUP.md) 문서를 읽고 환경 설정 규칙을 준수하세요!**

### 빠른 설정 가이드
```bash
# Backend 환경 설정 (로컬 개발)
cd backend
cp .env.example .env.local
# SQLite 사용: DATABASE_URL=sqlite:///./instagram_clone.db

# Frontend 환경 설정
cd ../frontend
cp .env.example .env
# 필요한 API 키 설정
```

### ⛔ 절대 금지 사항
- ❌ 서버의 `backend/.env` 파일 수정 금지
- ❌ 서버 DATABASE_URL을 SQLite로 변경 금지
- ❌ `.env` 파일을 Git에 커밋 금지

자세한 내용은 **[ENV_SETUP.md](./ENV_SETUP.md)** 참조

## ✨ 주요 기능

### 핵심 기능
- ✅ **인증 시스템**: JWT 기반 보안 인증, 토큰 자동 갱신
- ✅ **게시물 관리**: 다중 이미지 업로드 (최대 10장), 캐러셀 뷰어
- ✅ **소셜 기능**: 팔로우/언팔로우, 좋아요, 댓글, 대댓글
- ✅ **실시간 메시징**: WebSocket 기반 DM, 읽음 확인, 온라인 상태
- ✅ **피드 알고리즘**: 팔로우 기반 피드, 무한 스크롤
- ✅ **탐색 페이지**: 인기 게시물 그리드, 추천 사용자
- ✅ **프로필 관리**: 프로필 사진 업로드, 바이오 편집
- ✅ **알림 시스템**: 실시간 토스트 알림
- ✅ **관리자 대시보드**: 통계, 사용자/게시물 관리 (/admin)

### UI/UX
- ✅ **반응형 디자인**: 모바일, 태블릿, 데스크톱 최적화
- ✅ **Instagram UI**: 픽셀 퍼펙트 UI 재현
- ✅ **다크 모드**: (개발 중)
- ✅ **로딩 상태**: 스켈레톤 로더, 스피너
- ✅ **에러 처리**: 사용자 친화적 에러 메시지

### 개발 예정 기능
- 📸 스토리 기능 (24시간 임시 게시물)
- 🔍 고급 검색 (사용자, 해시태그, 위치)
- 💾 게시물 저장/컬렉션
- #️⃣ 해시태그 시스템
- 🔔 푸시 알림 (FCM/APNs)
- 📺 릴스 (동영상 게시물)
- 🎥 라이브 스트리밍
- 🛍️ 쇼핑 태그

## 🧪 테스트 계정

### 샘플 데이터 생성 (권장)
```bash
# 백엔드가 실행 중일 때
npm run create-sample-data
```

생성되는 데이터:
- 👥 30명의 테스트 사용자
- 📝 100개의 게시물 (랜덤 이미지)
- 💬 댓글 및 대댓글
- ❤️ 좋아요 및 팔로우 관계
- 💌 대화 및 메시지

### 기본 테스트 계정
모든 계정의 비밀번호: `password123`

주요 계정:
- 김민준 (minjun@example.com)
- 이지우 (jiwoo@example.com)
- 박서연 (seoyeon@example.com)

자세한 내용은 [TEST_ACCOUNTS.md](TEST_ACCOUNTS.md) 참조

## 🛠️ 기술 스택

### 프론트엔드
- **React 19** - 최신 React 버전
- **TypeScript 5.6** - 타입 안정성
- **Vite 6** - 초고속 빌드 도구
- **Tailwind CSS 3.4** - 유틸리티 CSS
- **React Router v7** - 라우팅
- **React Query (TanStack Query)** - 서버 상태 관리
- **Axios** - HTTP 클라이언트
- **Lucide React** - 아이콘

### 백엔드
- **FastAPI** - 고성능 웹 프레임워크
- **SQLAlchemy 2.0** - ORM + Raw SQL 하이브리드
- **SQLite/PostgreSQL** - 데이터베이스
- **JWT (PyJWT)** - 인증 토큰
- **Pydantic v2** - 데이터 검증
- **WebSocket** - 실시간 통신
- **Pillow** - 이미지 처리
- **Uvicorn** - ASGI 서버
- **Python 3.11+** - 최신 Python

## 🚀 배포

### GitHub Actions CI/CD
- **자동 배포**: main 브랜치 푸시 시 자동 배포
- **CI 체크**: develop 브랜치에서 테스트 실행
- **빌드 검증**: TypeScript 타입 체크, ESLint

### 프로덕션 환경
- **서버**: Ubuntu 24.04 LTS
- **프로세스 관리**: PM2
- **리버스 프록시**: Nginx
- **SSL**: Let's Encrypt
- **도메인**: muksta.com

자세한 배포 가이드는 [DEPLOYMENT.md](DEPLOYMENT.md) 참조

## 🗄️ 데이터베이스

### 스키마 설계
- 11개 테이블 (users, posts, comments, likes, follows 등)
- 인덱스 최적화
- 외래 키 제약조건

### 환경별 설정
```bash
# 개발 (SQLite)
DATABASE_URL=sqlite:///./instagram_clone.db

# 프로덕션 (PostgreSQL)
DATABASE_URL=postgresql://user:pass@host/db
```

자세한 스키마는 [db.md](db.md) 참조

## 📚 문서

### 개발자 가이드
- [CLAUDE.md](CLAUDE.md) - Claude Code AI 가이드
- [API_DOCS.md](API_DOCS.md) - API 엔드포인트 명세
- [FEATURES.md](FEATURES.md) - 기능 상세 설명
- [DEPLOYMENT.md](DEPLOYMENT.md) - 배포 가이드
- [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md) - CI/CD 설정

### 기술 명세
- [front.md](front.md) - 프론트엔드 아키텍처
- [backend.md](backend.md) - 백엔드 아키텍처
- [db.md](db.md) - 데이터베이스 설계
- [guide.md](guide.md) - 전체 프로젝트 가이드

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자유롭게 사용하세요!

## 👥 개발팀

- **개발**: @developkoala
- **AI 어시스턴트**: Claude (Anthropic)

## 🙏 감사의 말

이 프로젝트는 교육 목적으로 Instagram UI/UX를 재현한 것입니다.
Meta/Instagram의 공식 프로젝트가 아닙니다.
