from pydantic import BaseModel
from datetime import datetime
from app.schemas.user import UserResponse
from app.schemas.post import PostResponse

class SavedPostCreate(BaseModel):
    post_id: str

class SavedPostResponse(BaseModel):
    user_id: str
    post_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class SavedPostWithDetails(SavedPostResponse):
    post: PostResponse
    user: UserResponse
