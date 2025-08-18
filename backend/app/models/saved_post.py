from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class SavedPost(Base):
    __tablename__ = "saved_posts"
    
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, primary_key=True)
    post_id = Column(String(36), ForeignKey("posts.id"), nullable=False, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Unique constraint to prevent duplicate saves (already handled by composite primary key)
    __table_args__ = (UniqueConstraint('user_id', 'post_id', name='_user_post_save'),)
    
    # Relationships
    user = relationship("User", back_populates="saved_posts")
    post = relationship("Post", back_populates="saved_by")
