# 프로젝트 설치 및 실행 가이드

## 프로젝트 개요
**Muksta (먹스타그램)** - Instagram 클론을 기반으로 한 음식 사진 전문 SNS 서비스

### 기술 스택
- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS
- **Backend**: FastAPI + Python 3.8+
- **Database**: PostgreSQL (프로덕션) / SQLite (개발)
- **Real-time**: WebSocket
- **Deployment**: PM2 + Nginx

## 시스템 요구사항

### 최소 요구사항
- Node.js 16.0 이상
- Python 3.8 이상
- npm 또는 yarn
- Git

### 권장 사양
- OS: Ubuntu 20.04 LTS / macOS 12+ / Windows 10+
- RAM: 4GB 이상
- Storage: 10GB 이상 여유 공간

## 빠른 시작 (Quick Start)

### 원스텝 설치 및 실행
```bash
# 저장소 클론
git clone https://github.com/developkoala/instagram-clone.git muksta
cd muksta

# 자동 설정 및 실행
npm run setup
npm run dev
```

**접속 주소:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/docs

## 상세 설치 가이드

### 1. 저장소 클론
```bash
git clone https://github.com/developkoala/instagram-clone.git muksta
cd muksta
```

### 2. 환경 변수 설정

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

`.env` 파일 편집:
```env
# Database
DATABASE_URL=sqlite:///./instagram_clone.db  # 개발용
# DATABASE_URL=postgresql://user:pass@localhost/dbname  # 프로덕션용

# JWT
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
REFRESH_TOKEN_EXPIRE_DAYS=7

# Admin
ADMIN_PASSWORD=admin123

# Frontend
FRONTEND_URL=http://localhost:5173

# Server
HOST=127.0.0.1
PORT=8000
```

#### Frontend (.env)
```bash
cd ../frontend
cp .env.example .env
```

`.env` 파일 편집:
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

### 3. Backend 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv

# Linux/Mac
source venv/bin/activate

# Windows
venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 데이터베이스 초기화 (SQLite)
python init_database.py

# 서버 실행
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 5. 테스트 데이터 생성 (선택사항)

```bash
# 프로젝트 루트에서
npm run create-sample-data
```

## 프로덕션 배포

### 1. 서버 환경 준비

#### 필수 패키지 설치
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3-pip python3-venv nodejs npm postgresql nginx

# CentOS/RHEL
sudo yum install python3-pip python3-venv nodejs npm postgresql nginx
```

### 2. PostgreSQL 설정

```bash
# PostgreSQL 설치 후
sudo -u postgres psql

CREATE DATABASE instagram_clone;
CREATE USER instagram_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE instagram_clone TO instagram_user;
\q
```

### 3. 프로젝트 배포

```bash
# 프로젝트 클론
cd /var/www
sudo git clone https://github.com/developkoala/instagram-clone.git muksta
sudo chown -R $USER:$USER muksta
cd muksta

# Backend 설정
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# .env 파일 설정 (PostgreSQL URL로 변경)
nano .env
# DATABASE_URL=postgresql://instagram_user:your_password@localhost/instagram_clone

# 데이터베이스 마이그레이션
python migrate_to_postgres.py

# Frontend 빌드
cd ../frontend
npm install
npm run build
```

### 4. PM2 설정

```bash
# PM2 설치
npm install -g pm2

# 프로젝트 루트에서
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Nginx 설정

`/etc/nginx/sites-available/muksta` 파일 생성:
```nginx
server {
    listen 80;
    server_name muksta.com www.muksta.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /api/ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static files
    location /uploads {
        alias /var/www/muksta/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

활성화:
```bash
sudo ln -s /etc/nginx/sites-available/muksta /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 개발 워크플로우

### 브랜치 전략
```bash
main          # 프로덕션 브랜치
├── develop   # 개발 통합 브랜치
    ├── feature/기능명  # 기능 개발
    ├── fix/버그명      # 버그 수정
    └── hotfix/긴급수정 # 긴급 패치
```

### 코드 변경 및 배포

#### 1. 로컬 개발
```bash
# 기능 브랜치 생성
git checkout -b feature/new-feature

# 개발 및 테스트
npm run dev

# 커밋
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin feature/new-feature
```

#### 2. 서버 배포
```bash
# 서버에서
cd /var/www/muksta
git pull origin main

# Backend 재시작
pm2 restart instagram-backend

# Frontend 재빌드 (필요시)
cd frontend
npm run build
pm2 restart instagram-frontend
```

### 자동 배포 스크립트

`deploy.sh` 생성:
```bash
#!/bin/bash

# Git pull
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
npm run build

# Restart services
pm2 restart all

echo "배포 완료!"
```

## 문제 해결

### 자주 발생하는 문제

#### 1. 포트 충돌
```bash
# 포트 사용 확인
lsof -i :8000
lsof -i :5173

# 프로세스 종료
kill -9 [PID]
```

#### 2. 데이터베이스 연결 오류
```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# 연결 테스트
psql -U instagram_user -d instagram_clone
```

#### 3. CORS 오류
Backend의 `app/main.py`에서 CORS 설정 확인:
```python
allow_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://muksta.com"
]
```

#### 4. WebSocket 연결 실패
- 방화벽 설정 확인
- Nginx WebSocket 프록시 설정 확인
- 프론트엔드 WebSocket URL 확인

### 로그 확인

```bash
# PM2 로그
pm2 logs

# Nginx 로그
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Backend 로그
tail -f backend/logs/app.log
```

## 모니터링

### PM2 모니터링
```bash
# 프로세스 상태
pm2 status

# 실시간 모니터링
pm2 monit

# 메모리/CPU 사용량
pm2 list
```

### 헬스 체크
```bash
# API 상태
curl http://localhost:8000/health

# Frontend 상태
curl http://localhost:5173
```

## 백업 및 복구

### 데이터베이스 백업

#### PostgreSQL
```bash
# 백업
pg_dump -U instagram_user instagram_clone > backup_$(date +%Y%m%d).sql

# 복구
psql -U instagram_user instagram_clone < backup_20240101.sql
```

#### SQLite
```bash
# 백업
sqlite3 instagram_clone.db ".backup backup_$(date +%Y%m%d).db"

# 복구
cp backup_20240101.db instagram_clone.db
```

### 파일 백업
```bash
# 업로드 파일 백업
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/
```

## 성능 최적화

### Frontend 최적화
- 빌드 시 코드 압축
- 이미지 lazy loading
- 코드 스플리팅

### Backend 최적화
- 데이터베이스 인덱스 최적화
- 이미지 리사이징
- 캐싱 전략

### 서버 최적화
- Nginx 캐싱 설정
- PM2 클러스터 모드
- CDN 적용 (선택사항)

## 보안 설정

### 필수 보안 조치
1. 환경 변수 보호 (.env 파일 권한)
2. HTTPS 설정 (Let's Encrypt)
3. 방화벽 설정
4. SQL Injection 방지
5. XSS 방지
6. Rate Limiting

### HTTPS 설정 (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d muksta.com -d www.muksta.com
```

## 지원 및 문의

### 도움말
- API 문서: http://localhost:8000/docs
- 프로젝트 저장소: https://github.com/developkoala/instagram-clone

### 버그 리포트
GitHub Issues에 버그를 보고해주세요.

### 라이선스
MIT License