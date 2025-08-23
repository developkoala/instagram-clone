"""
Muksta Clone - FastAPI Backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# API 라우터 임포트
from app.api import auth, users, posts, public, notifications, websocket, messages
from app.api import admin
from app.api import cmt as comments
from app.api import places

# Import settings
from app.config import get_settings

settings = get_settings()

# FastAPI 앱 생성 - 프로덕션에서는 문서 비활성화
app = FastAPI(
    title="Muksta Clone API",
    description="Muksta 클론 백엔드 API",
    version="1.0.0",
    docs_url="/docs" if settings.show_docs else None,
    redoc_url="/redoc" if settings.show_docs else None,
    openapi_url="/openapi.json" if settings.show_docs else None
)

# CORS 설정 - 환경에 따라 자동 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

# 정적 파일 서빙 (업로드된 이미지)
uploads_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
if os.path.exists(uploads_path):
    app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

# API 라우터 등록
app.include_router(auth.router)
app.include_router(public.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(comments.router)
app.include_router(notifications.router)
app.include_router(messages.router)
app.include_router(websocket.router)
app.include_router(admin.router)
app.include_router(places.router)

@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "Muksta Clone API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)