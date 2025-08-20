#!/bin/bash

# ============================================
# Muksta 서버 초기 설정 스크립트
# ============================================

set -e  # 에러 발생 시 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "========================================="
echo "🚀 Muksta Server Setup"
echo "========================================="

# 1. 프로젝트 경로 설정
PROJECT_DIR="/var/www/muksta"
log_info "프로젝트 경로: $PROJECT_DIR"

# 2. 디렉토리 생성
log_info "디렉토리 생성 중..."
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR
cd $PROJECT_DIR

# 3. 코드 클론 (첫 설치 시)
if [ ! -d ".git" ]; then
    log_info "GitHub에서 코드 클론 중..."
    git clone https://github.com/developkoala/instagram-clone.git .
    log_success "코드 클론 완료"
else
    log_info "기존 코드 업데이트 중..."
    git pull origin main
    log_success "코드 업데이트 완료"
fi

# 4. Backend 설정
log_info "Backend 설정 중..."
cd $PROJECT_DIR/backend

# Python 가상환경 생성
if [ ! -d "venv" ]; then
    python3 -m venv venv
    log_success "가상환경 생성 완료"
fi

# 패키지 설치
source venv/bin/activate
pip install -r requirements.txt
log_success "Backend 패키지 설치 완료"

# 환경 변수 파일 생성 (없는 경우)
if [ ! -f ".env" ]; then
    log_info "Backend .env 파일 생성 중..."
    cat > .env << EOF
# Environment
ENVIRONMENT=production

# Database (PostgreSQL for production)
DATABASE_URL=postgresql://muksta_user:your_password@localhost/muksta_db

# Security
SECRET_KEY=$(openssl rand -hex 32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# Frontend URL
FRONTEND_URL=https://muksta.com
EOF
    log_warning ".env 파일이 생성되었습니다. 데이터베이스 정보를 수정해주세요!"
fi

# 5. PostgreSQL 데이터베이스 설정
log_info "PostgreSQL 데이터베이스 확인 중..."
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw muksta_db; then
    log_info "데이터베이스 생성 중..."
    sudo -u postgres createdb muksta_db
    sudo -u postgres createuser muksta_user
    echo "데이터베이스 비밀번호를 설정해주세요:"
    sudo -u postgres psql -c "ALTER USER muksta_user WITH PASSWORD 'your_password';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE muksta_db TO muksta_user;"
    log_success "데이터베이스 생성 완료"
fi

# 6. Alembic 마이그레이션
log_info "데이터베이스 마이그레이션 중..."
alembic upgrade head || log_warning "마이그레이션 실패 또는 이미 최신 상태"

# 7. Frontend 설정
log_info "Frontend 설정 중..."
cd $PROJECT_DIR/frontend

# Node 패키지 설치
npm install
log_success "Frontend 패키지 설치 완료"

# 프로덕션 빌드
npm run build
log_success "Frontend 빌드 완료"

# 8. Nginx 설정
log_info "Nginx 설정 중..."
if [ -f "$PROJECT_DIR/nginx.conf" ]; then
    sudo cp $PROJECT_DIR/nginx.conf /etc/nginx/sites-available/muksta
    sudo ln -sf /etc/nginx/sites-available/muksta /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
    log_success "Nginx 설정 완료"
else
    log_warning "nginx.conf 파일이 없습니다. 수동으로 설정해주세요."
fi

# 9. PM2 설정
log_info "PM2 프로세스 설정 중..."
cd $PROJECT_DIR

# PM2 ecosystem 파일 생성
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'muksta-backend',
    script: 'uvicorn',
    args: 'app.main:app --host 127.0.0.1 --port 8000',
    cwd: '/var/www/muksta/backend',
    interpreter: '/var/www/muksta/backend/venv/bin/python',
    env: {
      ENVIRONMENT: 'production'
    },
    error_file: '/var/www/muksta/logs/backend-error.log',
    out_file: '/var/www/muksta/logs/backend-out.log',
    log_file: '/var/www/muksta/logs/backend-combined.log',
    time: true
  }]
};
EOF

# 로그 디렉토리 생성
mkdir -p $PROJECT_DIR/logs

# PM2 프로세스 시작
pm2 start ecosystem.config.js
pm2 save
pm2 startup
log_success "PM2 설정 완료"

# 10. SSL 인증서 설정 (Let's Encrypt)
log_info "SSL 인증서 설정을 원하시나요? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d muksta.com -d www.muksta.com
    log_success "SSL 인증서 설정 완료"
fi

# 11. 상태 확인
echo ""
echo "========================================="
log_success "🎉 서버 설정 완료!"
echo "========================================="
echo ""
log_info "서비스 상태:"
pm2 list
echo ""
log_info "다음 단계:"
echo "  1. backend/.env 파일에서 데이터베이스 정보 수정"
echo "  2. Nginx SSL 설정 확인"
echo "  3. 방화벽 설정 (ufw allow 80,443/tcp)"
echo ""
echo "========================================="