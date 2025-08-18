from pydantic import BaseModel
from typing import Optional


class CommentCreate(BaseModel):
    content: str
    parent_comment_id: Optional[str] = None


