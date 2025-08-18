# Instagram Clone Backend - SQLite Database

## 📦 데이터베이스 구조

### 테이블 목록 (7개)
1. **users** - 사용자 정보
2. **posts** - 게시물
3. **post_images** - 게시물 이미지
4. **likes** - 좋아요
5. **follows** - 팔로우 관계
6. **comments** - 댓글
7. **saved_posts** - 저장한 게시물

## 🚀 빠른 시작

### 1. 데이터베이스 초기화
```bash
python3 database.py
```

### 2. 샘플 데이터 생성
```bash
python3 create_sample_data.py
```

### 3. 데이터 초기화 (모든 데이터 삭제)
```bash
python3 create_sample_data.py clear
```

## 📊 데이터베이스 관리

### 구조 확인
```python
from database import check_database_structure
check_database_structure()
```

### 통계 확인
```python
from database import get_table_stats
get_table_stats()
```

### 전체 초기화
```python
from database import drop_all_tables, init_database
drop_all_tables()  # 모든 테이블 삭제
init_database()    # 테이블 재생성
```

## 🧪 테스트 계정

샘플 데이터 생성 후 사용 가능한 계정:

| 이메일 | 사용자명 | 비밀번호 |
|--------|----------|----------|
| test@example.com | test | password123 |
| john@example.com | john | password123 |
| jane@example.com | jane | password123 |
| mike@example.com | mike | password123 |
| sarah@example.com | sarah | password123 |

**모든 계정의 비밀번호는 `password123` 입니다.**

## 📁 파일 구조

```
backend/
├── database.py           # 데이터베이스 초기화 및 관리
├── create_sample_data.py # 샘플 데이터 생성
├── instagram_clone.db    # SQLite 데이터베이스 파일
└── uploads/              # 업로드 파일 저장소
    ├── profiles/         # 프로필 사진
    └── posts/           # 게시물 이미지
```

## 🔍 주요 기능

### database.py
- `init_database()`: 데이터베이스 및 테이블 생성
- `get_connection()`: 데이터베이스 연결 반환
- `check_database_structure()`: 테이블 구조 확인
- `get_table_stats()`: 각 테이블의 레코드 수 확인
- `drop_all_tables()`: 모든 테이블 삭제

### create_sample_data.py
- `create_sample_data()`: 테스트용 샘플 데이터 생성
- `clear_all_data()`: 모든 데이터 삭제 (테이블 구조는 유지)
- `get_password_hash()`: 비밀번호 해싱

## 📝 샘플 데이터 내용

- **사용자**: 10명
- **게시물**: 각 사용자당 3-8개 (총 약 50개)
- **이미지**: 각 게시물당 1-3개
- **좋아요**: 랜덤 생성
- **팔로우**: 각 사용자가 2-6명 팔로우
- **댓글**: 각 게시물당 0-7개
- **저장**: 각 사용자가 1-5개 게시물 저장

## ⚠️ 주의사항

1. 실제 프로덕션에서는 bcrypt 등 더 안전한 비밀번호 해싱 사용 필요
2. SQLite는 동시 쓰기 작업에 제한이 있음
3. 대용량 트래픽에는 PostgreSQL이나 MySQL 권장
4. 파일 업로드는 실제로는 클라우드 스토리지 사용 권장

## 🔮 다음 단계

1. FastAPI를 사용한 API 엔드포인트 구현
2. JWT 기반 인증 시스템 구현
3. 파일 업로드 기능 구현
4. 프론트엔드와 API 연동