# 🔐 환경 설정 가이드 (필독!)

## ⚠️ 중요: 서버 환경 설정 파일 수정 금지

이 문서는 **반드시 준수해야 할** 환경 설정 규칙을 명시합니다.

---

## 📌 핵심 원칙

### 🚫 절대 수정 금지 사항
- **서버의 `backend/.env` 파일의 DATABASE_URL**
- **서버는 반드시 PostgreSQL 사용**
- **로컬에서 서버 환경 설정 변경 시도 금지**

### ✅ 환경별 데이터베이스 설정

#### 1. 로컬 개발 환경
```bash
# backend/.env.local 또는 backend/.env.development
DATABASE_URL=sqlite:///./instagram_clone.db
ENVIRONMENT=development
```

#### 2. 서버 운영 환경 (수정 금지!)
```bash
# backend/.env (서버에서만 직접 관리)
DATABASE_URL=postgresql://instagram_user:instagram_pass123@localhost/instagram_clone
ENVIRONMENT=production
```

---

## 📁 파일 구조 및 용도

### 환경 설정 파일들
```
backend/
├── .env                 # 서버 전용 (Git 제외, 수정 금지)
├── .env.example         # 설정 예시 (Git 포함)
├── .env.local          # 로컬 개발용 (Git 제외)
└── .env.development    # 로컬 개발용 대안 (Git 제외)

frontend/
├── .env                # 프론트엔드 환경변수 (Git 제외)
└── .env.example        # 설정 예시 (Git 포함)
```

---

## 🔧 올바른 작업 방법

### 1. 로컬에서 처음 시작할 때
```bash
# Backend 설정
cd backend
cp .env.example .env.local
# .env.local 파일 편집하여 SQLite 경로 설정

# Frontend 설정  
cd ../frontend
cp .env.example .env
# 필요한 환경변수 설정
```

### 2. 환경변수 추가/변경이 필요할 때
- ✅ `.env.example` 파일만 수정
- ✅ 변경사항을 문서화
- ❌ 실제 `.env` 파일은 커밋하지 않음

### 3. 배포 시
- GitHub Actions가 자동으로 코드만 업데이트
- 서버의 `.env` 파일은 그대로 유지됨
- 데이터베이스 연결은 변경되지 않음

---

## 🛡️ 보안 규칙

1. **`.env` 파일은 절대 Git에 커밋하지 않기**
   - `.gitignore`에 반드시 포함
   - 실수로 커밋한 경우 즉시 제거

2. **민감한 정보 관리**
   - API 키, 비밀번호는 환경변수로만 관리
   - 코드에 하드코딩 금지
   - `.env.example`에는 실제 값 대신 설명만 포함

3. **환경 분리**
   - 개발과 운영 환경을 명확히 구분
   - 각 환경에 맞는 설정 파일 사용

---

## 📝 체크리스트

배포 전 확인사항:
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는가?
- [ ] `.env.example`이 최신 상태인가?
- [ ] DATABASE_URL을 변경하려 하지 않았는가?
- [ ] 민감한 정보가 코드에 포함되지 않았는가?
- [ ] 로컬과 서버 설정이 분리되어 있는가?

---

## ⚡ 문제 해결

### 서버에서 데이터베이스 연결 실패 시
```bash
# 서버에 SSH 접속 후
cd /var/www/muksta/backend
cat .env  # DATABASE_URL 확인
# PostgreSQL 연결 문자열이 맞는지 확인
# SQLite로 변경하지 말 것!
```

### 로컬에서 개발 시
```bash
# SQLite 사용
export DATABASE_URL=sqlite:///./instagram_clone.db
python app/main.py
```

---

## 🚨 경고

**이 규칙을 위반하면:**
- 서버 장애 발생 가능
- 데이터 손실 위험
- 배포 실패

**반드시 이 문서를 숙지하고 준수하세요!**

---

*Last Updated: 2025-08-23*
*문서 버전: 1.0*