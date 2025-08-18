"""
사용자 관련 Pydantic 스키마
"""

from pydantic import BaseModel
from typing import Optional

class UserProfileUpdate(BaseModel):
    bio: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None

class UserProfile(BaseModel):
    id: str
    username: str
    bio: Optional[str]
    profile_picture: Optional[str]
    website: Optional[str]
    followers_count: int
    following_count: int
    posts_count: int
    is_following: bool = False