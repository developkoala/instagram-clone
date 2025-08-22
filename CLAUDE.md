# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Muksta is a fully-functional Instagram clone - a full-stack social media application with React 19/TypeScript frontend and FastAPI/Python backend, featuring real-time messaging via WebSockets.

**Live Demo**: [https://muksta.com](https://muksta.com)
**Repository**: [https://github.com/developkoala/instagram-clone](https://github.com/developkoala/instagram-clone)

## Essential Commands

### Development
```bash
# Start both frontend and backend (recommended)
npm run dev

# Frontend only (from frontend/)
npm run dev         # Start dev server on :5173
npm run build       # Production build
npm run lint        # Run ESLint

# Backend only (from backend/)
python -m uvicorn app.main:app --reload --port 8000

# Generate test data
npm run create-sample-data
```

### Testing & Quality
```bash
# Frontend
cd frontend && npm run build:strict  # TypeScript strict mode check
cd frontend && npm run lint          # ESLint check
cd frontend && npm run build         # Production build test

# Backend
cd backend && python -m pytest       # Run tests (if configured)
cd backend && python -m mypy app/    # Type checking (if configured)
```

## Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript 5.6 + Vite 6 + TailwindCSS 3.4 + React Query (TanStack) + React Router v7
- **Backend**: FastAPI + SQLAlchemy 2.0 + Pydantic v2 + JWT Auth + SQLite/PostgreSQL
- **Real-time**: WebSocket for messaging, notifications, online status
- **File Storage**: Local filesystem in `backend/uploads/` (S3 compatible in production)
- **Process Management**: PM2 (production)
- **CI/CD**: GitHub Actions

### Key Architecture Patterns

#### Frontend State Management
- **React Query** for server state (API data caching/synchronization)
- **Context API** for global state (Auth, Toast notifications, WebSocket)
- All API calls go through `src/services/api.ts` with centralized axios instance

#### Backend API Structure
- **Route Handlers** in `backend/app/api/` - each file handles a specific domain
- **Pydantic Schemas** for request/response validation in `backend/app/schemas/`
- **SQLAlchemy Models** in `backend/app/models/` - one model per file
- **Dependency Injection** via FastAPI for auth (`get_current_user`)

#### WebSocket Architecture
- Frontend `WebSocketContext` manages single persistent connection
- Backend `websocket.py` handles connection lifecycle and message routing
- Real-time features: messaging, notifications, online status
- Auto-reconnection with exponential backoff

#### Authentication Flow
1. Login/register returns JWT access & refresh tokens
2. Access token stored in localStorage as `access_token`
3. Refresh token stored in localStorage as `refresh_token`
4. Axios interceptor adds `Authorization: Bearer <token>` header
5. Backend validates via `get_current_user` dependency
6. Auto-refresh on 401 using refresh token

### Database Relationships
- **Users** ↔ **Posts**: One-to-many (author)
- **Users** ↔ **Follows**: Many-to-many (self-referential)
- **Posts** ↔ **Likes**: Many-to-many via Like model
- **Posts** ↔ **Comments**: One-to-many with nested replies
- **Users** ↔ **Messages**: Via Conversations (many-to-many)

## Production Configuration

Uses PM2 for process management (`ecosystem.config.js`):
- Frontend served on port 3000 (reverse proxied via Nginx)
- Backend API on port 8000
- Auto-restart and log management configured
- SSL/HTTPS via Let's Encrypt
- Domain: muksta.com

## Important Files to Know

### Configuration
- `backend/app/config.py` - All backend settings and environment variables
- `frontend/src/services/api.ts` - API base URL and axios configuration
- `backend/.env` & `frontend/.env` - Environment variables

### Core Business Logic
- `backend/app/api/posts.py` - Main feed algorithm, post creation
- `backend/app/api/websocket.py` - Real-time messaging implementation
- `frontend/src/contexts/AuthContext.tsx` - Authentication state management
- `frontend/src/pages/Feed.tsx` - Main feed with infinite scroll

### Admin System
- `backend/app/api/admin.py` - Admin API endpoints
- `frontend/src/pages/admin/*` - Admin dashboard components

## Common Development Tasks

### Adding a New API Endpoint
1. Create route handler in `backend/app/api/<domain>.py`
2. Add Pydantic schemas in `backend/app/schemas/`
3. Include router in `backend/app/main.py`
4. Add frontend API service in `frontend/src/services/api.ts`
5. Use React Query hook in component

### Adding Real-time Features
1. Add message type to WebSocket handler in `backend/app/api/websocket.py`
2. Update `frontend/src/contexts/WebSocketContext.tsx` to handle new message type
3. Dispatch events from backend using WebSocket manager

### Database Migrations
Currently using SQLAlchemy with manual migrations. For schema changes:
1. Update models in `backend/app/models/`
2. Development: Drop and recreate tables using `python create_tables.py`
3. Production: Write manual migration scripts
4. Future: Consider implementing Alembic for automated migrations

## API Documentation

FastAPI auto-generates interactive API docs at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

For detailed API endpoints, see [API_DOCS.md](API_DOCS.md)

## Recent Issues & Solutions

### Like Button State Synchronization (Fixed)
- **Issue**: Posts in profile grid showed incorrect like state
- **Solution**: Fetch full post data when clicking posts in profile
- **File**: `frontend/src/pages/profile/Profile.tsx`

### Mixed Content & CORS (Fixed)
- **Issue**: HTTPS/HTTP mixed content warnings
- **Solution**: Use relative paths and protocol-aware WebSocket connections
- **Files**: `frontend/src/utils/imageUrl.ts`, `frontend/src/contexts/WebSocketContext.tsx`

## Performance Optimizations

### Frontend
- React Query for efficient data caching
- Infinite scroll with intersection observer
- Image lazy loading
- Code splitting with React.lazy

### Backend
- Database query optimization with indexes
- Connection pooling
- Response caching where appropriate
- Async request handling