"""
게시물 관련 Pydantic 스키마
"""

from pydantic import BaseModel
from typing import Optional, List

class PostCreate(BaseModel):
    caption: Optional[str] = None
    location: Optional[str] = None