"""
Add test@gmail.com user to existing database
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

# Create session
db = Session(bind=engine)

# Check if user already exists
existing_user = db.query(User).filter(User.email == "test@gmail.com").first()
if existing_user:
    print("User test@gmail.com already exists!")
    # Update password
    existing_user.hashed_password = get_password_hash("12345")
    db.commit()
    print("Password updated to: 12345")
else:
    # Create new user
    user = User(
        id=str(uuid.uuid4()),
        email="test@gmail.com",
        username="test_gmail",
        full_name="Test Gmail User",
        bio="Gmail test account",
        is_verified=False,
        hashed_password=get_password_hash("12345"),
        created_at=datetime.utcnow()
    )
    db.add(user)
    db.commit()
    print("User created successfully!")
    print("Email: test@gmail.com")
    print("Password: 12345")

db.close()