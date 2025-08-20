# 데이터베이스 스키마 문서

## 개요
Instagram 클론 애플리케이션의 데이터베이스 구조 - PostgreSQL(프로덕션) / SQLite(개발) 지원

## 데이터베이스 설정

### 환경별 설정
- **개발 환경**: SQLite (`instagram_clone.db`)
- **프로덕션 환경**: PostgreSQL 
  ```
  postgresql://instagram_user:instagram_pass123@localhost/instagram_clone
  ```

### 특징
- UUID 기반 Primary Key
- Cascade Delete 적용
- 인덱스 최적화
- 중복 방지 Unique 제약

## 테이블 구조

### 1. users (사용자)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | VARCHAR(36) | PK | UUID |
| email | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | 이메일 주소 |
| username | VARCHAR(30) | UNIQUE, NOT NULL, INDEX | 사용자명 |
| bio | TEXT | NULL | 자기소개 |
| profile_picture | VARCHAR(500) | NULL | 프로필 사진 URL |
| website | VARCHAR(200) | NULL | 웹사이트 |
| is_private | BOOLEAN | DEFAULT FALSE | 비공개 계정 여부 |
| is_verified | BOOLEAN | DEFAULT FALSE | 인증 계정 여부 |
| hashed_password | VARCHAR(255) | NOT NULL | 암호화된 비밀번호 |
| created_at | TIMESTAMP | DEFAULT NOW | 생성일시 |
| updated_at | TIMESTAMP | DEFAULT NOW | 수정일시 |

**인덱스:**
- `idx_users_email` (UNIQUE)
- `idx_users_username` (UNIQUE)

### 2. posts (게시물)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | VARCHAR(36) | PK | UUID |
| user_id | VARCHAR(36) | FK → users.id, NOT NULL | 작성자 |
| caption | TEXT | NULL | 게시물 설명 |
| location | VARCHAR(100) | NULL | 위치 정보 |
| is_archived | BOOLEAN | DEFAULT FALSE | 보관 여부 |
| comments_disabled | BOOLEAN | DEFAULT FALSE | 댓글 비활성화 |
| created_at | TIMESTAMP | DEFAULT NOW | 생성일시 |
| updated_at | TIMESTAMP | DEFAULT NOW | 수정일시 |

### 3. post_images (게시물 이미지)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | VARCHAR(36) | PK | UUID |
| post_id | VARCHAR(36) | FK → posts.id, NOT NULL | 게시물 ID |
| image_url | VARCHAR(500) | NOT NULL | 이미지 URL |
| position | INTEGER | DEFAULT 0 | 이미지 순서 |
| width | INTEGER | NULL | 이미지 너비 |
| height | INTEGER | NULL | 이미지 높이 |
| created_at | TIMESTAMP | DEFAULT NOW | 생성일시 |

### 4. comments (댓글)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | VARCHAR(36) | PK | UUID |
| post_id | VARCHAR(36) | FK → posts.id, NOT NULL | 게시물 ID |
| user_id | VARCHAR(36) | FK → users.id, NOT NULL | 작성자 |
| parent_comment_id | VARCHAR(36) | FK → comments.id, NULL | 부모 댓글 (답글) |
| content | TEXT | NOT NULL | 댓글 내용 |
| created_at | TIMESTAMP | DEFAULT NOW | 생성일시 |
| updated_at | TIMESTAMP | DEFAULT NOW | 수정일시 |

### 5. likes (좋아요)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | VARCHAR(36) | PK | UUID |
| user_id | VARCHAR(36) | FK → users.id, NOT NULL | 사용자 ID |
| post_id | VARCHAR(36) | FK → posts.id, NOT NULL | 게시물 ID |
| created_at | TIMESTAMP | DEFAULT NOW | 생성일시 |

**제약조건:**
- UNIQUE (`user_id`, `post_id`) - 중복 좋아요 방지

### 6. follows (팔로우)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | VARCHAR(36) | PK | UUID |
| follower_id | VARCHAR(36) | FK → users.id, NOT NULL | 팔로워 ID |
| following_id | VARCHAR(36) | FK → users.id, NOT NULL | 팔로잉 ID |
| created_at | TIMESTAMP | DEFAULT NOW | 생성일시 |

**제약조건:**
- UNIQUE (`follower_id`, `following_id`) - 중복 팔로우 방지

### 7. saved_posts (저장한 게시물)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| user_id | VARCHAR(36) | PK, FK → users.id | 사용자 ID |
| post_id | VARCHAR(36) | PK, FK → posts.id | 게시물 ID |
| created_at | TIMESTAMP | DEFAULT NOW | 생성일시 |

**제약조건:**
- Composite PK (`user_id`, `post_id`)
- UNIQUE (`user_id`, `post_id`) - 중복 저장 방지

### 8. conversations (대화)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | TEXT | PK | UUID |
| participant1_id | TEXT | FK → users.id, NOT NULL | 참여자1 |
| participant2_id | TEXT | FK → users.id, NOT NULL | 참여자2 |
| created_at | TEXT | DEFAULT NOW | 생성일시 |
| updated_at | TEXT | DEFAULT NOW | 수정일시 |

**제약조건:**
- UNIQUE (`participant1_id`, `participant2_id`)
- ON DELETE CASCADE

**인덱스:**
- `idx_conversations_participants` (`participant1_id`, `participant2_id`)

### 9. messages (메시지)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | TEXT | PK | UUID |
| conversation_id | TEXT | FK → conversations.id, NOT NULL | 대화 ID |
| sender_id | TEXT | FK → users.id, NOT NULL | 발신자 |
| content | TEXT | NOT NULL | 메시지 내용 |
| message_type | TEXT | DEFAULT 'text' | 메시지 타입 (text/image/file) |
| is_read | INTEGER | DEFAULT 0 | 읽음 여부 |
| created_at | TEXT | DEFAULT NOW | 생성일시 |

**제약조건:**
- ON DELETE CASCADE

**인덱스:**
- `idx_messages_conversation` (`conversation_id`, `created_at`)
- `idx_messages_sender` (`sender_id`)
- `idx_messages_unread` (`conversation_id`, `is_read`)

## 관계 다이어그램

```
users
  ├── posts (1:N)
  │   ├── post_images (1:N)
  │   ├── comments (1:N)
  │   │   └── comments (self-reference, 1:N) [답글]
  │   ├── likes (1:N)
  │   └── saved_posts (1:N)
  ├── comments (1:N)
  ├── likes (1:N)
  ├── saved_posts (1:N)
  ├── follows (follower) (1:N)
  ├── follows (following) (1:N)
  ├── conversations (participant) (1:N)
  └── messages (sender) (1:N)

conversations
  └── messages (1:N)
```

## 주요 관계 설명

### 1. 사용자 관계
- **게시물**: 한 사용자는 여러 게시물 작성 가능
- **팔로우**: 사용자 간 다대다 관계 (follows 테이블을 통한 self-join)
- **좋아요**: 사용자와 게시물 간 다대다 관계
- **저장**: 사용자와 게시물 간 다대다 관계

### 2. 게시물 관계
- **이미지**: 한 게시물에 최대 10개 이미지 (1:N)
- **댓글**: 한 게시물에 여러 댓글 (1:N)
- **좋아요**: 여러 사용자가 좋아요 가능 (N:M)

### 3. 댓글 관계
- **답글**: Self-referencing으로 댓글에 답글 가능
- **작성자**: 각 댓글은 한 명의 작성자 (N:1)

### 4. 메시지 관계
- **대화**: 두 사용자 간 1개의 대화
- **메시지**: 한 대화에 여러 메시지 (1:N)

## 인덱스 전략

### 성능 최적화 인덱스
1. **사용자 검색**: `username`, `email` 인덱스
2. **피드 조회**: `posts.user_id`, `posts.created_at`
3. **메시지 조회**: `messages.conversation_id`, `messages.created_at`
4. **읽지 않은 메시지**: `messages.is_read`
5. **팔로우 관계**: `follows.follower_id`, `follows.following_id`

## 데이터 무결성

### CASCADE 규칙
- 사용자 삭제 시 → 모든 관련 데이터 삭제
- 게시물 삭제 시 → 이미지, 댓글, 좋아요 삭제
- 대화 삭제 시 → 모든 메시지 삭제

### UNIQUE 제약
- 이메일, 사용자명 중복 방지
- 중복 좋아요 방지
- 중복 팔로우 방지
- 중복 저장 방지

## 트랜잭션 처리

### 주요 트랜잭션
1. **게시물 작성**: posts + post_images 동시 생성
2. **팔로우**: follows 생성 + 알림 발송
3. **좋아요**: likes 생성 + 알림 발송
4. **메시지 전송**: messages 생성 + WebSocket 전송

## 마이그레이션 전략

### 현재 상태
- SQLAlchemy 모델 정의
- Raw SQL 직접 실행
- 수동 테이블 생성

### 향후 개선
- [ ] Alembic 마이그레이션 도입
- [ ] 버전 관리 시스템
- [ ] 롤백 기능
- [ ] 자동 마이그레이션

## 백업 및 복구

### 백업 전략
```bash
# PostgreSQL 백업
pg_dump instagram_clone > backup.sql

# SQLite 백업
sqlite3 instagram_clone.db ".backup backup.db"
```

### 복구 전략
```bash
# PostgreSQL 복구
psql instagram_clone < backup.sql

# SQLite 복구
sqlite3 instagram_clone.db < backup.sql
```

## 성능 모니터링

### 주요 모니터링 지표
- 쿼리 실행 시간
- 인덱스 사용률
- 테이블 크기
- 연결 풀 상태

### 최적화 포인트
- N+1 쿼리 문제 해결
- 적절한 인덱스 추가
- 쿼리 캐싱
- 파티셔닝 고려

## 보안 고려사항

### 데이터 보호
- 비밀번호 bcrypt 해싱
- SQL Injection 방지 (파라미터 바인딩)
- 민감 정보 암호화
- 접근 권한 관리

### 감사 로그
- 중요 작업 로깅
- 변경 이력 추적
- 접근 로그 기록