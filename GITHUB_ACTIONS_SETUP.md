# 🚀 GitHub Actions 자동 배포 설정 가이드

## 📋 개요
GitHub의 main 브랜치에 push하면 자동으로 서버에 배포되는 CI/CD 파이프라인입니다.

## ✅ 사전 준비사항

### 1. GitHub Secrets 설정
GitHub 저장소 → Settings → Secrets and variables → Actions에서 다음 시크릿을 추가:

| Secret Name | 설명 | 예시 |
|------------|------|------|
| `SERVER_HOST` | 서버 IP 또는 도메인 | `123.456.789.0` 또는 `example.com` |
| `SERVER_USER` | SSH 접속 유저명 | `ubuntu` 또는 `ec2-user` |
| `SERVER_SSH_KEY` | SSH 개인키 (전체 내용) | `-----BEGIN RSA PRIVATE KEY-----...` |

### 2. SSH 키 생성 방법 (없는 경우)
```bash
# 로컬에서 SSH 키 생성
ssh-keygen -t rsa -b 4096 -f deploy_key -N ""

# 공개키를 서버에 추가
ssh-copy-id -i deploy_key.pub user@server_ip

# 또는 수동으로 서버의 ~/.ssh/authorized_keys에 추가
cat deploy_key.pub | ssh user@server_ip "cat >> ~/.ssh/authorized_keys"

# GitHub Secret에 개인키 내용 복사
cat deploy_key
# 이 내용을 SERVER_SSH_KEY에 붙여넣기
```

## 🔧 작동 방식

### 자동 배포 프로세스
1. **main 브랜치에 push** → GitHub Actions 트리거
2. **SSH 연결 설정** → 서버 접속
3. **deploy.sh 스크립트 생성/업데이트** → 서버에 배포 스크립트 자동 생성
4. **배포 실행**:
   - Git pull (최신 코드 가져오기)
   - pip install (Python 패키지 설치)
   - Alembic migration (DB 마이그레이션)
   - npm install & build (Frontend 빌드)
   - PM2 restart (서비스 재시작)

## 📁 파일 구조

```
.github/
└── workflows/
    └── deploy.yml       # GitHub Actions 워크플로우

deploy.sh               # 로컬 테스트용 스크립트
```

## 🖥️ 서버 초기 설정

### 1. 프로젝트 클론 (첫 배포 시)
```bash
# 서버에서 실행
sudo mkdir -p /var/www/muksta
sudo chown $USER:$USER /var/www/muksta
cd /var/www/muksta
git clone https://github.com/developkoala/instagram-clone.git .
```

### 2. Python 환경 설정
```bash
cd /var/www/muksta/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. 환경 변수 설정
```bash
# backend/.env 파일 생성
cat > backend/.env << EOF
ENVIRONMENT=production
DATABASE_URL=postgresql://user:password@localhost/dbname
SECRET_KEY=your-production-secret-key
# 기타 필요한 환경 변수
EOF
```

### 4. PM2 설치 (없는 경우)
```bash
# Node.js & PM2 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

### 5. PM2 프로세스 설정
```bash
# Backend 시작
cd /var/www/muksta/backend
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000" --name instagram-backend

# Frontend 시작 (또는 Nginx 사용)
cd /var/www/muksta/frontend
npm install
npm run build
pm2 start "npm run preview -- --port 3000" --name instagram-frontend

# PM2 저장 및 자동 시작 설정
pm2 save
pm2 startup
```

## 📊 배포 상태 확인

### GitHub Actions에서 확인
1. GitHub 저장소 → Actions 탭
2. 최근 워크플로우 실행 확인
3. ✅ 성공 또는 ❌ 실패 상태 확인

### 서버에서 확인
```bash
# PM2 프로세스 상태
pm2 status

# PM2 로그 확인
pm2 logs

# Backend 헬스체크
curl http://localhost:8000/health

# 배포 로그 확인
cat /var/www/muksta/deploy.log
```

## 🔄 수동 배포

### GitHub Actions에서 수동 실행
1. Actions 탭 → "Auto Deploy to Server"
2. "Run workflow" 버튼 클릭
3. Branch 선택 후 실행

### 서버에서 직접 실행
```bash
cd /var/www/muksta
./deploy.sh
```

## 🐛 트러블슈팅

### 1. SSH 연결 실패
```bash
# 서버에서 SSH 서비스 확인
sudo systemctl status ssh

# 방화벽 확인
sudo ufw status

# SSH 키 권한 확인
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 2. PM2 명령어를 찾을 수 없음
```bash
# PM2 전역 설치
sudo npm install -g pm2

# PATH 확인
which pm2
echo $PATH
```

### 3. 권한 오류
```bash
# 프로젝트 디렉토리 권한 설정
sudo chown -R $USER:$USER /var/www/muksta

# uploads 디렉토리 권한
chmod 755 /var/www/muksta/backend/uploads
```

### 4. 데이터베이스 연결 실패
```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# 연결 테스트
psql -h localhost -U username -d database_name
```

## 📝 배포 체크리스트

- [ ] GitHub Secrets 설정 완료
- [ ] 서버 SSH 접속 가능
- [ ] Python 3.8+ 설치
- [ ] Node.js 18+ 설치
- [ ] PM2 설치
- [ ] PostgreSQL 설정 (production)
- [ ] 환경 변수 파일 생성
- [ ] 도메인 및 SSL 설정 (선택)

## 🎯 다음 단계

1. **모니터링 설정**
   - PM2 모니터링 대시보드
   - 로그 수집 (ELK Stack)
   - 알림 설정 (Slack, Discord)

2. **백업 자동화**
   - 데이터베이스 백업
   - 업로드 파일 백업

3. **성능 최적화**
   - CDN 설정
   - 캐싱 전략
   - 로드 밸런싱

## 💡 팁

- 배포 전 로컬에서 `./deploy.sh` 실행하여 테스트
- 중요한 변경사항은 staging 브랜치에서 먼저 테스트
- 데이터베이스 마이그레이션은 백업 후 진행
- PM2 ecosystem 파일로 복잡한 설정 관리 가능

---

✨ **준비 완료!** main 브랜치에 push하면 자동으로 배포됩니다. 🚀