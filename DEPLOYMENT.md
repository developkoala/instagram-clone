# 🚀 Muksta - Production Deployment Guide

## 📋 Table of Contents
1. [GitHub Actions CI/CD](#github-actions-cicd)
2. [Production Environment](#production-environment)
3. [Manual Deployment](#manual-deployment)
4. [Environment Variables](#environment-variables)
5. [PM2 Process Management](#pm2-process-management)
6. [Nginx Configuration](#nginx-configuration)
7. [SSL/HTTPS Setup](#sslhttps-setup)
8. [Monitoring & Logging](#monitoring--logging)

---

## GitHub Actions CI/CD

### ✨ Automatic Deployment
The project uses GitHub Actions for continuous deployment:

- **Trigger**: Push to `main` branch
- **Process**: Build → Test → Deploy
- **Target**: muksta.com (production server)

### 🔧 Workflow Files
- `.github/workflows/ci.yml` - CI checks on `develop` branch
- `.github/workflows/deploy.yml` - Auto-deploy to production

### 📊 Environment Matrix
| Environment | Database | CORS | Debug | API Docs | URL |
|------------|----------|------|-------|----------|-----|
| **Development** | SQLite | localhost:* | ✅ | ✅ | localhost:5173 |
| **Production** | PostgreSQL | muksta.com | ❌ | ✅ | muksta.com |

## Production Environment

### 🖥️ Server Specifications
- **OS**: Ubuntu 24.04 LTS
- **Python**: 3.11+
- **Node.js**: 20.x
- **Database**: PostgreSQL 15
- **Web Server**: Nginx
- **Process Manager**: PM2
- **Domain**: muksta.com
- **SSL**: Let's Encrypt

## Manual Deployment

### 📝 Deployment Steps
```bash
# 1. SSH to server
ssh user@muksta.com

# 2. Navigate to project
cd /home/username/instagram-clone

# 3. Pull latest changes
git pull origin main

# 4. Backend setup
cd backend
source venv/bin/activate
pip install -r requirements.txt

# 5. Frontend build
cd ../frontend
npm install
npm run build

# 6. Restart services with PM2
pm2 restart ecosystem.config.js
pm2 save

# 7. Reload Nginx
sudo nginx -s reload
```

## Environment Variables

### 🔐 Backend (.env)
```bash
# Production settings
DATABASE_URL=postgresql://username:password@localhost/muksta_db
SECRET_KEY=your-very-secure-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
REFRESH_TOKEN_EXPIRE_DAYS=30
CORS_ORIGINS=["https://muksta.com", "https://www.muksta.com"]
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=10485760  # 10MB
```

### 🔐 Frontend (.env.production)
```bash
VITE_API_URL=https://muksta.com/api
VITE_WS_URL=wss://muksta.com/api
VITE_APP_NAME=Muksta
```

---

## PM2 Process Management

### 💻 PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'muksta-frontend',
    script: 'serve',
    args: '-s dist -l 3000',
    cwd: './frontend',
    instances: 1,
    exec_mode: 'fork'
  },
  {
    name: 'muksta-backend',
    script: 'uvicorn',
    args: 'app.main:app --host 0.0.0.0 --port 8000',
    cwd: './backend',
    interpreter: './venv/bin/python',
    instances: 2,
    exec_mode: 'cluster'
  }]
};
```

### 🚀 PM2 Commands
```bash
# Start all services
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all

# Save current process list
pm2 save

# Setup startup script
pm2 startup systemd
```

## Nginx Configuration

### 🌐 Nginx Server Block
```nginx
# /etc/nginx/sites-available/muksta
server {
    listen 80;
    listen [::]:80;
    server_name muksta.com www.muksta.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name muksta.com www.muksta.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/muksta.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/muksta.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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
        alias /home/username/instagram-clone/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## SSL/HTTPS Setup

### 🔒 Let's Encrypt SSL
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d muksta.com -d www.muksta.com

# Auto-renewal setup
sudo certbot renew --dry-run

# Add to crontab for auto-renewal
0 0 * * * /usr/bin/certbot renew --quiet
```

## Monitoring & Logging

### 📊 Application Monitoring
```bash
# PM2 Monitoring
pm2 monit

# PM2 Web Dashboard
pm2 install pm2-web
pm2 start pm2-web

# System monitoring
htop
iotop
netstat -tuln
```

### 📝 Log Files
```bash
# PM2 logs
~/.pm2/logs/muksta-frontend-out.log
~/.pm2/logs/muksta-frontend-error.log
~/.pm2/logs/muksta-backend-out.log
~/.pm2/logs/muksta-backend-error.log

# Nginx logs
/var/log/nginx/access.log
/var/log/nginx/error.log

# Application logs
/home/username/instagram-clone/backend/logs/
```

### 📡 Log Rotation
```bash
# /etc/logrotate.d/muksta
/home/username/instagram-clone/backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Database Management

### 🗄️ PostgreSQL Setup
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE muksta_db;
CREATE USER muksta_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE muksta_db TO muksta_user;
\q

# Test connection
psql -U muksta_user -d muksta_db -h localhost
```

### 💾 Database Backup
```bash
# Backup script
#!/bin/bash
# /home/username/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/username/backups"
DB_NAME="muksta_db"
DB_USER="muksta_user"

# Create backup
pg_dump -U $DB_USER -d $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress
gzip $BACKUP_DIR/backup_$DATE.sql

# Remove old backups (keep 7 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

# Add to crontab
# 0 2 * * * /home/username/backup.sh
```

---

## Security Best Practices

### 🔐 Security Checklist
- ✅ HTTPS with SSL/TLS
- ✅ Environment variables for secrets
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (input sanitization)
- ✅ CSRF tokens
- ✅ Rate limiting
- ✅ File upload validation
- ✅ Regular security updates

### 🛡️ Firewall Configuration
```bash
# UFW setup
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Docker Deployment (Optional)

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
      - ./backend/muksta_clone.db:/app/muksta_clone.db

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

## Performance Optimization

### 🚀 Frontend Optimization
- **Image optimization**: WebP conversion, lazy loading
- **Code splitting**: Dynamic imports with React.lazy
- **Bundle optimization**: Tree shaking, minification
- **CDN**: Static assets served via CDN
- **Caching**: Browser caching headers

### ⚡ Backend Optimization
- **Database indexing**: Optimized queries
- **Connection pooling**: SQLAlchemy pool configuration
- **Async operations**: FastAPI async endpoints
- **Response caching**: Redis for frequently accessed data
- **Query optimization**: N+1 query prevention

---

## Troubleshooting

### 🔧 Common Issues

#### WebSocket Connection Failed
```bash
# Check Nginx configuration
sudo nginx -t
sudo systemctl reload nginx

# Check firewall
sudo ufw status

# Check PM2 processes
pm2 status
```

#### File Upload Issues
```bash
# Check permissions
ls -la backend/uploads
sudo chown -R www-data:www-data backend/uploads
sudo chmod -R 755 backend/uploads
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U muksta_user -d muksta_db -h localhost

# Check logs
sudo tail -f /var/log/postgresql/*.log
```

---

## Health Checks

### 🏥 Health Check Endpoints
```python
# Backend health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0",
        "database": "connected",
        "websocket": "active"
    }
```

```bash
# Monitoring script
#!/bin/bash
curl -f https://muksta.com/api/health || echo "Backend is down"
```

## CI/CD Pipeline Details

### 🔄 GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd ~/instagram-clone
            git pull origin main
            cd frontend && npm install && npm run build
            cd ../backend && source venv/bin/activate && pip install -r requirements.txt
            pm2 restart ecosystem.config.js
```

---

## Maintenance Tasks

### 📅 Regular Tasks
- **Daily**: Check logs, monitor disk space
- **Weekly**: Database backup, security updates
- **Monthly**: Performance review, dependency updates
- **Quarterly**: Security audit, capacity planning

### 🔄 Update Procedure
```bash
# 1. Backup current state
./backup.sh

# 2. Test in staging
git checkout develop
git pull origin develop
npm test && npm run build

# 3. Deploy to production
git checkout main
git merge develop
git push origin main
# GitHub Actions will handle the rest
```

---

## Resource Requirements

### 💻 Minimum Requirements
- **CPU**: 2 vCPUs
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Bandwidth**: 100GB/month

### 🚀 Recommended for Production
- **CPU**: 4 vCPUs
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **Bandwidth**: 500GB/month
- **Database**: Dedicated PostgreSQL instance

---

## Support & Contact

### 📞 Getting Help
- **Documentation**: [GitHub Wiki](https://github.com/developkoala/instagram-clone/wiki)
- **Issues**: [GitHub Issues](https://github.com/developkoala/instagram-clone/issues)
- **Discussions**: [GitHub Discussions](https://github.com/developkoala/instagram-clone/discussions)

### 👥 Contributors
- **Developer**: @developkoala
- **AI Assistant**: Claude (Anthropic)

### 📄 License
MIT License - See [LICENSE](LICENSE) file for details

---

## Quick Reference

### 🌐 URLs
- **Production**: https://muksta.com
- **API Docs**: https://muksta.com/api/docs
- **GitHub**: https://github.com/developkoala/instagram-clone

### 📋 Key Commands
```bash
# Development
npm run dev                    # Start dev servers
npm run create-sample-data     # Generate test data

# Production
pm2 status                     # Check services
pm2 logs                       # View logs
pm2 restart all                # Restart services

# Database
psql -U muksta_user -d muksta_db  # Connect to DB
pg_dump muksta_db > backup.sql    # Backup DB
```