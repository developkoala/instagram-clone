# Instagram Clone - 배포 가이드

## 목차
1. [로컬 개발 환경](#로컬-개발-환경)
2. [프로덕션 배포](#프로덕션-배포)
3. [Docker 배포](#docker-배포)
4. [환경 변수 설정](#환경-변수-설정)
5. [데이터베이스 마이그레이션](#데이터베이스-마이그레이션)
6. [모니터링 및 로깅](#모니터링-및-로깅)

---

## 로컬 개발 환경

### 빠른 시작
```bash
# 프로젝트 클론
git clone <repository-url>
cd my_instagram

# 개발 서버 실행 (자동 설치 포함)
npm run dev
```

### 수동 설치

#### 프론트엔드
```bash
cd frontend
npm install
npm run dev
```

#### 백엔드
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 개발 URL
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 프로덕션 배포

### 1. 서버 요구사항
- Ubuntu 20.04+ 또는 CentOS 8+
- Python 3.8+
- Node.js 16+
- Nginx
- PostgreSQL 13+ (권장) 또는 SQLite
- 최소 2GB RAM, 20GB Storage

### 2. 프론트엔드 배포

#### 빌드
```bash
cd frontend
npm install
npm run build
```

#### Nginx 설정
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/instagram-clone/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /uploads {
        alias /var/www/instagram-clone/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. 백엔드 배포

#### Systemd 서비스 설정
```ini
# /etc/systemd/system/instagram-backend.service
[Unit]
Description=Instagram Clone Backend
After=network.target

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/var/www/instagram-clone/backend
Environment="PATH=/var/www/instagram-clone/backend/venv/bin"
ExecStart=/var/www/instagram-clone/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

[Install]
WantedBy=multi-user.target
```

#### 서비스 시작
```bash
sudo systemctl daemon-reload
sudo systemctl enable instagram-backend
sudo systemctl start instagram-backend
```

---

## 프로덕션 환경 설정

### 실시간 기능 체크리스트
- ✅ WebSocket 연결 설정
- ✅ 실시간 메시지 전송/수신
- ✅ 채팅 알림 (토스트)
- ✅ 온라인 상태 추적
- ✅ 메시지 읽음 처리
- ✅ 실시간 시간 업데이트

## Docker 배포 (선택사항)

### Docker Compose 설정
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    volumes:
      - ./frontend/nginx.conf:/etc/nginx/nginx.conf

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SECRET_KEY=${SECRET_KEY}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/instagram_clone.db:/app/instagram_clone.db

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### Dockerfile - Frontend
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Dockerfile - Backend
```dockerfile
# backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 실행
```bash
docker-compose up -d
```

---

## 환경 변수 설정

### Backend (.env)
```env
# 데이터베이스
DATABASE_URL=sqlite:///./instagram_clone.db
# PostgreSQL 사용 시:
# DATABASE_URL=postgresql://user:password@localhost/instagram_db

# 보안
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=10080  # 7 days

# 파일 업로드
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_EXTENSIONS=jpg,jpeg,png,gif,webp

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com

# 관리자
ADMIN_USERNAME=admin
ADMIN_PASSWORD=pass123
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## 데이터베이스 마이그레이션

### SQLite → PostgreSQL
```bash
# 1. 데이터 백업
sqlite3 instagram_clone.db .dump > backup.sql

# 2. PostgreSQL 데이터베이스 생성
createdb instagram_db

# 3. 스키마 변환 및 임포트
python migrate_to_postgres.py backup.sql
```

### 데이터베이스 백업
```bash
# SQLite
sqlite3 instagram_clone.db ".backup backup.db"

# PostgreSQL
pg_dump instagram_db > backup.sql
```

---

## 모니터링 및 로깅

### 로그 설정
```python
# backend/app/core/logging.py
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        },
    },
    "handlers": {
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "logs/app.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
            "formatter": "default",
        },
    },
    "root": {
        "level": "INFO",
        "handlers": ["file"],
    },
}
```

### 헬스체크 엔드포인트
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }
```

### 모니터링 도구 추천
- **Prometheus + Grafana**: 메트릭 수집 및 시각화
- **Sentry**: 에러 트래킹
- **New Relic**: APM (Application Performance Monitoring)
- **ELK Stack**: 로그 수집 및 분석

---

## 보안 체크리스트

- [ ] HTTPS 설정 (Let's Encrypt)
- [ ] 환경 변수로 민감한 정보 관리
- [ ] SQL Injection 방지
- [ ] XSS 방지
- [ ] CSRF 토큰 구현
- [ ] Rate Limiting 설정
- [ ] 파일 업로드 검증
- [ ] 정기적인 보안 업데이트

---

## 성능 최적화

### 프론트엔드
- 이미지 최적화 (WebP 변환)
- Lazy Loading 구현
- 코드 스플리팅
- CDN 사용

### 백엔드
- 데이터베이스 인덱싱
- Redis 캐싱
- 쿼리 최적화
- 비동기 처리

---

## 트러블슈팅

### 웹소켓 연결 실패
```bash
# Nginx 설정 확인
nginx -t

# 방화벽 규칙 확인
sudo ufw status
```

### 파일 업로드 실패
```bash
# 권한 확인
ls -la backend/uploads

# 권한 설정
sudo chown -R www-data:www-data backend/uploads
sudo chmod -R 755 backend/uploads
```

### 데이터베이스 연결 실패
```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# 연결 테스트
psql -U username -d instagram_db -c "SELECT 1;"
```

---

## 지원 및 문의

- GitHub Issues: [repository-url]/issues
- Email: support@example.com
- Documentation: [repository-url]/wiki