from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base

class Follow(Base):
    __tablename__ = "follows"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    follower_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    following_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Unique constraint to prevent duplicate follows
    __table_args__ = (UniqueConstraint('follower_id', 'following_id', name='_follower_following'),)
    
    # Relationships
    follower = relationship("User", foreign_keys=[follower_id], back_populates="following")
    following = relationship("User", foreign_keys=[following_id], back_populates="followers")