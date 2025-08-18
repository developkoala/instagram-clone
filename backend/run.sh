#!/bin/bash

# Instagram Clone Backend 실행 스크립트

echo "🚀 Instagram Clone Backend 시작 중..."

# 가상환경 활성화 (있는 경우)
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# 필요한 패키지 설치
echo "📦 패키지 설치 중..."
pip install -r requirements.txt

# 데이터베이스 초기화 (필요한 경우)
if [ ! -f "instagram_clone.db" ]; then
    echo "🗄️ 데이터베이스 초기화 중..."
    python3 database.py
    python3 create_sample_data.py
fi

# FastAPI 서버 실행
echo "✅ 서버 시작: http://localhost:8000"
echo "📖 API 문서: http://localhost:8000/docs"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000