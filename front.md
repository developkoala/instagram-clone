# Instagram 클론 - 프론트엔드 명세서

## 프로젝트 개요
- **프레임워크**: React 18+ with TypeScript
- **상태관리**: Context API + useReducer
- **스타일링**: Tailwind CSS
- **라우팅**: React Router v6
- **HTTP 클라이언트**: Axios
- **빌드 도구**: Vite

## 주요 기능 요구사항

### 1. 사용자 인증 시스템
- **회원가입 페이지**
  - 이메일, 사용자명, 비밀번호 입력
  - 실시간 유효성 검증
  - 중복 확인 (이메일, 사용자명)
  
- **로그인 페이지**
  - 이메일/사용자명 + 비밀번호 로그인
  - "Remember Me" 기능
  - JWT 토큰 관리
  
- **비밀번호 재설정**
  - 이메일 인증을 통한 비밀번호 재설정

### 2. 메인 피드 (홈페이지)
- **스토리 섹션**
  - 가로 스크롤 스토리 뷰어
  - 스토리 추가/보기 기능
  - 24시간 자동 삭제
  
- **게시물 피드**
  - 무한 스크롤 구현
  - 좋아요/댓글 실시간 업데이트
  - 게시물 저장 기능
  - 게시물 신고 기능

### 3. 게시물 작성 및 편집
- **게시물 작성**
  - 이미지/비디오 업로드 (최대 10장)
  - 이미지 크롭 및 필터 적용
  - 캡션 작성 (해시태그 지원)
  - 위치 태그 추가
  - 사용자 태그 기능
  
- **게시물 편집**
  - 캡션 수정
  - 태그 수정/삭제
  - 게시물 삭제

### 4. 사용자 프로필
- **프로필 뷰**
  - 프로필 사진, 팔로워/팔로잉 수
  - 게시물 그리드 뷰
  - 스토리 하이라이트
  - IGTV 비디오 섹션
  
- **프로필 편집**
  - 프로필 사진 변경
  - 소개글 편집
  - 연락처 정보 관리
  - 개인정보 설정

### 5. 검색 및 탐색
- **검색 기능**
  - 사용자명, 해시태그, 위치 검색
  - 최근 검색 기록
  - 추천 검색어
  
- **탐색 페이지**
  - 인기 게시물 그리드
  - 카테고리별 추천 콘텐츠
  - 트렌딩 해시태그

### 6. 메시징 시스템
- **Direct Message**
  - 실시간 채팅 (WebSocket)
  - 이미지/비디오 전송
  - 게시물 공유
  - 메시지 읽음 확인
  
- **채팅방 관리**
  - 채팅방 생성/삭제
  - 그룹 채팅 지원
  - 채팅 검색 기능

### 7. 알림 시스템
- **실시간 알림**
  - 좋아요, 댓글, 팔로우 알림
  - 메시지 알림
  - 태그 알림
  
- **알림 설정**
  - 알림 유형별 on/off
  - 푸시 알림 설정

## 컴포넌트 구조

### 레이아웃 컴포넌트
```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MobileBottomNav.tsx
│   │   └── Layout.tsx
```

### 페이지 컴포넌트
```
├── pages/
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── ResetPassword.tsx
│   ├── home/
│   │   ├── Feed.tsx
│   │   └── Stories.tsx
│   ├── profile/
│   │   ├── Profile.tsx
│   │   ├── EditProfile.tsx
│   │   └── Settings.tsx
│   ├── explore/
│   │   ├── Explore.tsx
│   │   └── Search.tsx
│   ├── post/
│   │   ├── CreatePost.tsx
│   │   ├── PostDetail.tsx
│   │   └── EditPost.tsx
│   └── messages/
│       ├── MessageList.tsx
│       └── ChatRoom.tsx
```

### 공통 컴포넌트
```
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Loading.tsx
│   │   └── ErrorBoundary.tsx
│   ├── post/
│   │   ├── PostCard.tsx
│   │   ├── PostActions.tsx
│   │   ├── Comments.tsx
│   │   └── ImageCarousel.tsx
│   └── user/
│       ├── UserCard.tsx
│       ├── FollowButton.tsx
│       └── AvatarImage.tsx
```

## 상태 관리 구조

### Context Providers
```typescript
// AuthContext
interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  isLoading: boolean;
}

// PostContext
interface PostContextType {
  posts: Post[];
  addPost: (post: Post) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => void;
  likePost: (id: string) => void;
  isLoading: boolean;
}

// ChatContext
interface ChatContextType {
  conversations: Conversation[];
  activeChat: Conversation | null;
  sendMessage: (message: Message) => void;
  markAsRead: (conversationId: string) => void;
  isOnline: boolean;
}
```

## API 연동 명세

### HTTP 클라이언트 설정
```typescript
// src/services/api.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 요청 인터셉터 (JWT 토큰 자동 추가)
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 주요 API 엔드포인트
```typescript
// 인증 관련
POST /auth/login
POST /auth/register
POST /auth/refresh
DELETE /auth/logout

// 사용자 관련
GET /users/profile
PUT /users/profile
GET /users/{id}
POST /users/{id}/follow
DELETE /users/{id}/follow

// 게시물 관련
GET /posts/feed
POST /posts
PUT /posts/{id}
DELETE /posts/{id}
POST /posts/{id}/like
DELETE /posts/{id}/like

// 댓글 관련
GET /posts/{id}/comments
POST /posts/{id}/comments
PUT /comments/{id}
DELETE /comments/{id}

// 메시징 관련
GET /conversations
POST /conversations
GET /conversations/{id}/messages
POST /conversations/{id}/messages
```

## 스타일링 가이드

### Tailwind CSS 설정
```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        instagram: {
          primary: '#E4405F',
          secondary: '#FAFAFA',
          accent: '#0095F6',
          dark: '#262626',
          gray: '#8E8E8E',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto'],
      },
    },
  },
  plugins: [],
};
```

### 반응형 디자인 브레이크포인트
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

## 성능 최적화

### 1. 코드 스플리팅
```typescript
// React.lazy를 사용한 페이지별 코드 스플리팅
const Home = lazy(() => import('./pages/home/Feed'));
const Profile = lazy(() => import('./pages/profile/Profile'));
const Explore = lazy(() => import('./pages/explore/Explore'));
```

### 2. 이미지 최적화
- 이미지 레이지 로딩 구현
- WebP 포맷 지원
- 이미지 압축 및 리사이징

### 3. 가상화 (Virtualization)
- 무한 스크롤 최적화
- react-window 라이브러리 활용

### 4. 메모이제이션
```typescript
// React.memo, useMemo, useCallback 적극 활용
const PostCard = React.memo(({ post }: PostCardProps) => {
  const handleLike = useCallback(() => {
    // 좋아요 로직
  }, [post.id]);
  
  return (
    // 컴포넌트 JSX
  );
});
```

## 테스트 전략

### 단위 테스트
- Jest + React Testing Library
- 컴포넌트별 테스트 작성
- 커스텀 훅 테스트

### 통합 테스트
- API 통신 테스트
- 사용자 플로우 테스트

### E2E 테스트
- Cypress를 이용한 핵심 기능 테스트
- 회원가입/로그인 플로우
- 게시물 작성/조회 플로우

## 배포 전략

### 개발 환경
```bash
npm run dev    # 로컬 개발 서버
npm run build  # 프로덕션 빌드
npm run test   # 테스트 실행
```

### 프로덕션 배포
- Vercel 또는 Netlify를 통한 자동 배포
- CI/CD 파이프라인 구성
- 환경변수 관리

## 폴더 구조
```
src/
├── components/          # 재사용 가능한 컴포넌트
├── pages/              # 페이지 컴포넌트
├── contexts/           # React Context
├── hooks/              # 커스텀 훅
├── services/           # API 서비스
├── utils/              # 유틸리티 함수
├── types/              # TypeScript 타입 정의
├── assets/             # 정적 자원 (이미지, 아이콘)
├── styles/             # 글로벌 스타일
└── __tests__/          # 테스트 파일
```