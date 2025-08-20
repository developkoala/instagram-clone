#!/bin/bash

# =========================================
# Instagram Clone 로컬 배포 스크립트 (테스트용)
# =========================================
# 이 파일은 로컬 테스트용입니다.
# 실제 서버 배포 스크립트는 GitHub Actions가 자동으로 생성합니다.

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

# 배포 시작
echo "========================================="
echo "🚀 Instagram Clone Deployment (Local Test)"
echo "========================================="
log_info "배포 시작: $(date '+%Y-%m-%d %H:%M:%S')"

# 프로젝트 경로 (로컬 경로로 수정)
PROJECT_DIR="$(pwd)"
log_info "프로젝트 경로: $PROJECT_DIR"

# 1. Git 상태 확인
log_info "📊 Git 상태 확인 중..."
git status

# 2. Backend 의존성 설치
log_info "📦 Backend 패키지 확인 중..."
cd $PROJECT_DIR/backend

# 가상환경 확인
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    log_success "가상환경 활성화"
else
    log_warning "가상환경이 없습니다. 생성을 권장합니다: python -m venv venv"
fi

# 3. 데이터베이스 마이그레이션 (로컬은 SQLite 사용)
if [ -f "alembic.ini" ]; then
    log_info "🗄️ 데이터베이스 마이그레이션 확인 중..."
    alembic current
fi

# 4. Frontend 확인
if [ -d "$PROJECT_DIR/frontend" ]; then
    log_info "📦 Frontend 패키지 확인 중..."
    cd $PROJECT_DIR/frontend
    
    if [ ! -d "node_modules" ]; then
        log_warning "node_modules가 없습니다. 'npm install' 실행을 권장합니다."
    else
        log_success "Frontend 패키지 설치됨"
    fi
fi

# 5. 환경 변수 확인
cd $PROJECT_DIR
log_info "🔐 환경 변수 파일 확인 중..."

if [ -f "backend/.env" ]; then
    log_success "Backend .env 파일 존재"
    echo "   현재 환경: $(grep ENVIRONMENT backend/.env | cut -d'=' -f2 || echo 'development')"
else
    log_warning "Backend .env 파일이 없습니다"
fi

if [ -f "frontend/.env" ]; then
    log_success "Frontend .env 파일 존재"
else
    log_warning "Frontend .env 파일이 없습니다"
fi

# 6. 실행 가능한 명령어 안내
echo ""
echo "========================================="
log_success "🎉 로컬 테스트 준비 완료!"
echo "========================================="
echo ""
echo "📌 다음 명령어로 서비스를 시작할 수 있습니다:"
echo ""
echo "   # 전체 서비스 시작 (권장)"
echo "   ${GREEN}npm run dev${NC}"
echo ""
echo "   # Backend만 시작"
echo "   ${GREEN}cd backend && uvicorn app.main:app --reload${NC}"
echo ""
echo "   # Frontend만 시작"
echo "   ${GREEN}cd frontend && npm run dev${NC}"
echo ""
echo "========================================="