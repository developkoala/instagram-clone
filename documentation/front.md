# 프론트엔드 문서

## 프로젝트 개요
React 19 + TypeScript + Vite 기반의 Instagram 클론 프론트엔드 애플리케이션

## 기술 스택

### 핵심 기술
- **React**: 19.1.0 - 최신 React 버전 사용
- **TypeScript**: 5.8.3 - 타입 안정성 보장
- **Vite**: 7.0.4 - 빠른 개발 환경 및 빌드
- **React Router**: 7.7.1 - SPA 라우팅
- **TailwindCSS**: 3.4.17 - 유틸리티 기반 스타일링

### 상태 관리 및 데이터 페칭
- **React Query**: 5.84.1 - 서버 상태 관리 및 캐싱
- **Context API**: 전역 상태 관리 (인증, 토스트, WebSocket)
- **Axios**: 1.11.0 - HTTP 클라이언트

### UI 라이브러리
- **Lucide React**: 536.0 - 아이콘 시스템
- **Custom Components**: 자체 제작 UI 컴포넌트

## 구현된 기능

### 1. 인증 시스템
- ✅ 회원가입 (이메일, 사용자명, 비밀번호)
- ✅ 로그인/로그아웃
- ✅ JWT 토큰 기반 인증
- ✅ 자동 토큰 갱신
- ✅ Protected Routes

### 2. 피드 및 포스트
- ✅ 메인 피드 (팔로우한 사용자 + 추천)
- ✅ 무한 스크롤
- ✅ 포스트 작성 (다중 이미지 업로드)
- ✅ 이미지 회전 및 편집
- ✅ EXIF 오리엔테이션 자동 처리
- ✅ 좋아요/댓글 기능
- ✅ 포스트 저장 (북마크)
- ✅ 포스트 상세 보기 모달

### 3. 프로필
- ✅ 사용자 프로필 페이지
- ✅ 프로필 사진 업로드
- ✅ 프로필 편집 (bio, 웹사이트 등)
- ✅ 팔로우/언팔로우 기능
- ✅ 게시물 그리드 뷰
- ✅ 팔로워/팔로잉 수 표시

### 4. 탐색 (Explore)
- ✅ 인기 게시물 그리드
- ✅ 추천 사용자 섹션
- ✅ 무한 스크롤
- ✅ 게시물 미리보기 호버 효과

### 5. 실시간 메시징
- ✅ WebSocket 기반 실시간 채팅
- ✅ 대화 목록
- ✅ 읽지 않은 메시지 표시
- ✅ 온라인 상태 표시
- ✅ 자동 재연결 로직

### 6. 알림
- ✅ 실시간 알림 수신
- ✅ 알림 카테고리 분류 (오늘/이번주/이번달/이전)
- ✅ 좋아요/팔로우/댓글 알림
- ✅ 알림에서 바로 팔로우 액션

### 7. 스토리
- ✅ 스토리 표시
- ✅ 스토리 생성 인터페이스

### 8. 검색
- ✅ 사용자 검색
- ✅ 실시간 검색 결과

### 9. 설정
- ✅ 프로필 설정
- ✅ 비밀번호 변경
- ✅ 도움말 및 정보

### 10. 관리자 페이지
- ✅ 별도 관리자 로그인
- ✅ 사용자 관리
- ✅ 게시물 관리
- ✅ 대시보드

## 프로젝트 구조

```
frontend/
├── src/
│   ├── components/        # 재사용 가능한 컴포넌트
│   │   ├── common/        # 공통 컴포넌트
│   │   ├── home/          # 홈 페이지 컴포넌트
│   │   ├── layout/        # 레이아웃 컴포넌트
│   │   ├── post/          # 게시물 관련 컴포넌트
│   │   └── story/         # 스토리 관련 컴포넌트
│   ├── contexts/          # React Context Providers
│   │   ├── AuthContext.tsx       # 인증 상태 관리
│   │   ├── ToastContext.tsx      # 토스트 알림
│   │   └── WebSocketContext.tsx  # WebSocket 연결
│   ├── pages/             # 페이지 컴포넌트
│   │   ├── admin/         # 관리자 페이지
│   │   ├── auth/          # 인증 페이지
│   │   ├── explore/       # 탐색 페이지
│   │   ├── messages/      # 메시지 페이지
│   │   └── ...
│   ├── services/          # API 서비스
│   │   ├── api.ts         # Axios 인스턴스
│   │   ├── auth.service.ts
│   │   ├── post.service.ts
│   │   └── ...
│   ├── types/             # TypeScript 타입 정의
│   └── utils/             # 유틸리티 함수
├── public/                # 정적 파일
├── .env                   # 환경 변수
├── package.json           # 의존성 및 스크립트
├── tailwind.config.js     # Tailwind 설정
├── tsconfig.json          # TypeScript 설정
└── vite.config.ts         # Vite 설정
```

## 컴포넌트 아키텍처

### 레이아웃 컴포넌트
- **Layout**: 메인 레이아웃 래퍼
- **Header**: 데스크톱 헤더 네비게이션
- **MobileBottomNav**: 모바일 하단 네비게이션

### 핵심 컴포넌트
- **PostCard**: 게시물 카드 컴포넌트
- **PostModal**: 게시물 상세 보기 모달
- **CreatePostModal**: 게시물 작성 모달 (다단계)
- **ImageCarousel**: 이미지 캐러셀
- **Stories**: 스토리 표시 컴포넌트
- **SearchBar**: 검색 바
- **RelativeTime**: 상대 시간 표시 (자동 업데이트)

## 상태 관리 전략

### Context API 활용
1. **AuthContext**
   - 사용자 인증 상태
   - 로그인/로그아웃 함수
   - 프로필 업데이트 이벤트

2. **WebSocketContext**
   - 실시간 연결 관리
   - 메시지 핸들링
   - 재연결 로직
   - 온라인 상태 추적

3. **ToastContext**
   - 전역 알림 시스템
   - 성공/에러/정보 메시지

### React Query 활용
- 서버 상태 캐싱
- 낙관적 업데이트
- 백그라운드 데이터 동기화
- 무한 스크롤 구현

## API 통합

### API 서비스 구조
```typescript
// api.ts - 메인 API 클라이언트
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

// 토큰 자동 갱신 인터셉터
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // 토큰 갱신 로직
    }
  }
);
```

### 환경 변수
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## 반응형 디자인

### 브레이크포인트
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### 모바일 최적화
- 하단 네비게이션 바
- 터치 친화적 인터페이스
- 모달 최적화
- 스와이프 제스처 지원

## 성능 최적화

### 구현된 최적화
- 이미지 lazy loading
- 무한 스크롤 가상화
- React.memo 활용
- 코드 스플리팅
- 번들 최적화

## 개발 환경 설정

### 필수 요구사항
- Node.js 16+
- npm 또는 yarn

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 린트 검사
npm run lint

# TypeScript 체크와 함께 빌드
npm run build:strict
```

## 향후 개선 사항

### 계획된 기능
- [ ] 다크 모드
- [ ] PWA 지원
- [ ] 비디오 업로드
- [ ] 릴스 기능
- [ ] 라이브 스트리밍
- [ ] 해시태그 시스템

### 성능 개선
- [ ] 이미지 CDN 적용
- [ ] Service Worker 캐싱
- [ ] 번들 사이즈 최적화
- [ ] 가상 스크롤 개선

## 테스트

### 테스트 전략
- Unit Testing: Jest + React Testing Library
- E2E Testing: Cypress
- Visual Testing: Storybook

## 배포

### 배포 환경
- Development: localhost:5173
- Production: PM2 + Nginx

### 빌드 최적화
- Tree shaking
- Code splitting
- Asset optimization
- Compression