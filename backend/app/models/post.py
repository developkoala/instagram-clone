from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    caption = Column(Text)
    location = Column(String(100))
    is_archived = Column(Boolean, default=False)
    comments_disabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="posts")
    images = relationship("PostImage", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")
    saved_by = relationship("SavedPost", back_populates="post", cascade="all, delete-orphan")

class PostImage(Base):
    __tablename__ = "post_images"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String(36), ForeignKey("posts.id"), nullable=False)
    image_url = Column(String(500), nullable=False)
    position = Column(Integer, default=0)
    width = Column(Integer)
    height = Column(Integer)
    
    # Relationships
    post = relationship("Post", back_populates="images")