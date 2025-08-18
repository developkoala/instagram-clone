"""
Create test accounts from TEST_ACCOUNTS.md
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import engine
from app.models import User
from app.utils.security import get_password_hash
import uuid
from datetime import datetime

# Test accounts data
test_accounts = [
    {
        "email": "travel@example.com",
        "password": "password123",
        "username": "여행하는_일상",
        "full_name": "Travel Blogger",
        "bio": "세계 여행 중 🌍 | 사진으로 남기는 순간들 📸"
    },
    {
        "email": "foodie@example.com",
        "password": "password123",
        "username": "맛집탐방러",
        "full_name": "Food Explorer",
        "bio": "맛집 헌터 🍔 | 미식가의 일상 🍝"
    },
    {
        "email": "fitness@example.com",
        "password": "password123",
        "username": "헬스인생",
        "full_name": "Fitness Trainer",
        "bio": "운동은 삶이다 💪 | 건강한 라이프스타일 🏃‍♂️"
    },
    {
        "email": "art@example.com",
        "password": "password123",
        "username": "아트갤러리_서울",
        "full_name": "Art Curator",
        "bio": "예술과 함께하는 일상 🎨 | 서울 갤러리 큐레이터"
    },
    {
        "email": "tech@example.com",
        "password": "password123",
        "username": "테크리뷰어",
        "full_name": "Tech Reviewer",
        "bio": "최신 기술 리뷰 💻 | 가젯 매니아 📱"
    },
    {
        "email": "test@gmail.com",
        "password": "12345",
        "username": "test_gmail",
        "full_name": "Test Gmail User",
        "bio": "Gmail test account"
    }
]

# Create session
db = Session(bind=engine)

print("Creating test accounts...")
created_count = 0
updated_count = 0

for account in test_accounts:
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == account["email"]) | (User.username == account["username"])
    ).first()
    
    if existing_user:
        print(f"User {account['email']} already exists! Updating password...")
        existing_user.hashed_password = get_password_hash(account["password"])
        existing_user.username = account["username"]
        existing_user.full_name = account["full_name"]
        existing_user.bio = account["bio"]
        updated_count += 1
    else:
        # Create new user
        user = User(
            id=str(uuid.uuid4()),
            email=account["email"],
            username=account["username"],
            full_name=account["full_name"],
            bio=account["bio"],
            is_verified=False,
            hashed_password=get_password_hash(account["password"]),
            created_at=datetime.utcnow()
        )
        db.add(user)
        created_count += 1
        print(f"Created user: {account['email']}")

db.commit()
db.close()

print(f"\n✅ Complete!")
print(f"Created: {created_count} accounts")
print(f"Updated: {updated_count} accounts")
print("\nYou can now login with these accounts:")
for account in test_accounts:
    print(f"  Email: {account['email']}, Password: {account['password']}")