"""
메시지 관련 API 엔드포인트
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.utils.database_utils import execute_query, format_datetime
from app.utils.security import generate_uuid
from datetime import datetime
import json

router = APIRouter(prefix="/api/messages", tags=["Messages"])

# 기존 웹소켓 매니저 임포트
from app.api.websocket import manager

class MessageCreate(BaseModel):
    content: str
    message_type: str = "text"

class ConversationResponse(BaseModel):
    id: str
    participant: dict
    last_message: Optional[dict]
    unread_count: int
    updated_at: str

class MessageResponse(BaseModel):
    id: str
    content: str
    sender: dict
    message_type: str
    is_read: bool
    created_at: str

@router.get("/conversations")
async def get_conversations(
    current_user: dict = Depends(get_current_user)
):
    """사용자의 대화 목록 조회"""
    query = """
        SELECT c.id, c.participant1_id, c.participant2_id, c.updated_at,
               u1.username as p1_username, u1.profile_picture as p1_profile,
               u2.username as p2_username, u2.profile_picture as p2_profile,
               latest_msg.content as last_message_content, 
               latest_msg.created_at as last_message_time,
               latest_msg.sender_id as last_message_sender,
               (SELECT COUNT(*) FROM messages 
                WHERE conversation_id = c.id 
                  AND sender_id != ? 
                  AND is_read = 0) as unread_count
        FROM conversations c
        LEFT JOIN users u1 ON c.participant1_id = u1.id
        LEFT JOIN users u2 ON c.participant2_id = u2.id
        LEFT JOIN (
            SELECT DISTINCT m1.conversation_id, m1.content, m1.created_at, m1.sender_id
            FROM messages m1
            INNER JOIN (
                SELECT conversation_id, MAX(created_at) as max_time
                FROM messages
                GROUP BY conversation_id
            ) m2 ON m1.conversation_id = m2.conversation_id AND m1.created_at = m2.max_time
        ) latest_msg ON c.id = latest_msg.conversation_id
        WHERE c.participant1_id = ? OR c.participant2_id = ?
        ORDER BY c.updated_at DESC
    """
    
    conversations = execute_query(query, (current_user['id'], current_user['id'], current_user['id']))
    
    result = []
    for conv in conversations:
        # 상대방 정보 선택
        if conv['participant1_id'] == current_user['id']:
            participant = {
                'id': conv['participant2_id'],
                'username': conv['p2_username'],
                'profile_picture': conv['p2_profile']
            }
        else:
            participant = {
                'id': conv['participant1_id'],
                'username': conv['p1_username'],
                'profile_picture': conv['p1_profile']
            }
        
        last_message = None
        if conv['last_message_content']:
            last_message = {
                'content': conv['last_message_content'],
                'created_at': format_datetime(conv['last_message_time']),
                'is_own': conv['last_message_sender'] == current_user['id']
            }
        
        result.append({
            'id': conv['id'],
            'participant': participant,
            'last_message': last_message,
            'unread_count': conv['unread_count'],
            'updated_at': format_datetime(conv['updated_at'])
        })
    
    return result

@router.post("/conversations/{user_id}")
async def create_or_get_conversation(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """대화방 생성 또는 기존 대화방 조회"""
    if user_id == current_user['id']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create conversation with yourself"
        )
    
    # participant ID 정렬
    p1_id = min(current_user['id'], user_id)
    p2_id = max(current_user['id'], user_id)
    
    # 기존 대화방 확인 (정렬된 ID로)
    existing_query = """
        SELECT id FROM conversations 
        WHERE participant1_id = ? AND participant2_id = ?
    """
    existing = execute_query(existing_query, (p1_id, p2_id), fetch_one=True)
    
    if existing:
        return {"conversation_id": existing['id']}
    
    # 새 대화방 생성
    conversation_id = generate_uuid()
    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    
    create_query = """
        INSERT INTO conversations (id, participant1_id, participant2_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
    """
    execute_query(create_query, (conversation_id, p1_id, p2_id, now, now))
    
    return {"conversation_id": conversation_id}

@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    page: int = 1,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """대화방 메시지 조회"""
    # 대화방 참여 권한 확인
    conv_check = """
        SELECT id FROM conversations 
        WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)
    """
    conversation = execute_query(conv_check, (conversation_id, current_user['id'], current_user['id']), fetch_one=True)
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    offset = (page - 1) * limit
    
    messages_query = """
        SELECT m.id, m.content, m.message_type, m.is_read, m.created_at,
               u.id as sender_id, u.username, u.profile_picture
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
    """
    
    messages = execute_query(messages_query, (conversation_id, limit, offset))
    
    # 메시지를 읽음 처리 (상대방이 보낸 메시지만)
    mark_read_query = """
        UPDATE messages 
        SET is_read = 1 
        WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
    """
    execute_query(mark_read_query, (conversation_id, current_user['id']))
    
    result = []
    for msg in messages:
        result.append({
            'id': msg['id'],
            'content': msg['content'],
            'message_type': msg['message_type'],
            'sender': {
                'id': msg['sender_id'],
                'username': msg['username'],
                'profile_picture': msg['profile_picture']
            },
            'is_own': msg['sender_id'] == current_user['id'],
            'is_read': bool(msg['is_read']),
            'created_at': format_datetime(msg['created_at'])
        })
    
    # 시간순으로 정렬 (오래된 것부터)
    result.reverse()
    
    return {
        'messages': result,
        'page': page,
        'has_next': len(messages) == limit
    }

@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    message_data: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    """메시지 전송"""
    print(f"🎬 Message send API called - User: {current_user['username']}, Conversation: {conversation_id}, Content: {message_data.content}")
    # 대화방 참여 권한 확인
    conv_query = """
        SELECT participant1_id, participant2_id FROM conversations 
        WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)
    """
    conversation = execute_query(conv_query, (conversation_id, current_user['id'], current_user['id']), fetch_one=True)
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # 메시지 저장
    message_id = generate_uuid()
    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    
    insert_query = """
        INSERT INTO messages (id, conversation_id, sender_id, content, message_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """
    execute_query(insert_query, (message_id, conversation_id, current_user['id'], message_data.content, message_data.message_type, now))
    
    # 대화방 업데이트 시간 갱신
    update_conv_query = """
        UPDATE conversations SET updated_at = ? WHERE id = ?
    """
    execute_query(update_conv_query, (now, conversation_id))
    
    # 상대방 ID 찾기
    recipient_id = conversation['participant2_id'] if conversation['participant1_id'] == current_user['id'] else conversation['participant1_id']
    
    # 웹소켓으로 실시간 메시지 전송
    # 수신자에게 보낼 메시지
    recipient_message_data = {
        'type': 'new_message',
        'conversation_id': conversation_id,
        'message': {
            'id': message_id,
            'content': message_data.content,
            'message_type': message_data.message_type,
            'sender': {
                'id': current_user['id'],
                'username': current_user['username'],
                'profile_picture': current_user.get('profile_picture')
            },
            'is_own': False,  # 수신자 관점에서는 false
            'is_read': False,
            'created_at': format_datetime(now)
        }
    }
    
    # 발신자에게 보낼 메시지 (본인이 보낸 메시지 확인용)
    sender_message_data = {
        'type': 'new_message',
        'conversation_id': conversation_id,
        'message': {
            'id': message_id,
            'content': message_data.content,
            'message_type': message_data.message_type,
            'sender': {
                'id': current_user['id'],
                'username': current_user['username'],
                'profile_picture': current_user.get('profile_picture')
            },
            'is_own': True,  # 발신자 관점에서는 true
            'is_read': False,
            'created_at': format_datetime(now)
        }
    }
    
    print(f"🚀 Sending WebSocket message to recipient {recipient_id}")
    await manager.send_personal_message(json.dumps(recipient_message_data), recipient_id)
    
    print(f"📤 Sending WebSocket message to sender {current_user['id']}")
    await manager.send_personal_message(json.dumps(sender_message_data), current_user['id'])
    
    print(f"📡 WebSocket messages sent successfully to both users")
    
    return {
        'id': message_id,
        'content': message_data.content,
        'message_type': message_data.message_type,
        'created_at': format_datetime(now),
        'is_read': False
    }

