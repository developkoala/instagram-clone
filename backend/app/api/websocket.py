"""
WebSocket 엔드포인트 - 실시간 알림, 채팅, 온라인 상태
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import Dict, Set, List
import json
import asyncio
from datetime import datetime
from app.dependencies import get_current_user_ws
from app.utils.database_utils import execute_query
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ws", tags=["WebSocket"])

# 연결된 클라이언트 관리
class ConnectionManager:
    def __init__(self):
        # user_id -> WebSocket 매핑
        self.active_connections: Dict[str, WebSocket] = {}
        # 온라인 사용자 추적
        self.online_users: Set[str] = set()
        # 채팅방 관리 (room_id -> Set[user_id])
        self.chat_rooms: Dict[str, Set[str]] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.online_users.add(user_id)
        logger.info(f"User {user_id} connected via WebSocket")
        
        # 다른 사용자들에게 온라인 상태 알림
        await self.broadcast_online_status(user_id, True)
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        self.online_users.discard(user_id)
        logger.info(f"User {user_id} disconnected from WebSocket")
    
    async def send_personal_message(self, message: str, user_id: str):
        """특정 사용자에게 메시지 전송"""
        print(f"🎯 Attempting to send message to user {user_id}")
        print(f"📋 Active connections: {list(self.active_connections.keys())}")
        
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            try:
                print(f"✅ Sending message to {user_id}: {message}")
                await websocket.send_text(message)
                print(f"📤 Message sent successfully to {user_id}")
            except Exception as e:
                print(f"❌ Error sending message to {user_id}: {e}")
                logger.error(f"Error sending message to {user_id}: {e}")
        else:
            print(f"⚠️ User {user_id} not found in active connections")
    
    async def broadcast_online_status(self, user_id: str, is_online: bool):
        """온라인 상태 변경 브로드캐스트"""
        message = json.dumps({
            "type": "online_status",
            "user_id": user_id,
            "is_online": is_online,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # 해당 사용자를 팔로우하는 모든 사용자에게 알림
        followers = execute_query(
            "SELECT follower_id FROM follows WHERE following_id = %s",
            (user_id,)
        )
        
        for follower in followers:
            follower_id = follower['follower_id']
            if follower_id in self.active_connections:
                await self.send_personal_message(message, follower_id)
    
    async def send_notification(self, user_id: str, notification_type: str, data: dict):
        """실시간 알림 전송"""
        message = json.dumps({
            "type": "notification",
            "notification_type": notification_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        })
        await self.send_personal_message(message, user_id)
    
    async def join_chat_room(self, user_id: str, room_id: str):
        """채팅방 참여"""
        if room_id not in self.chat_rooms:
            self.chat_rooms[room_id] = set()
        self.chat_rooms[room_id].add(user_id)
        logger.info(f"User {user_id} joined chat room {room_id}")
    
    def leave_chat_room(self, user_id: str, room_id: str):
        """채팅방 나가기"""
        if room_id in self.chat_rooms:
            self.chat_rooms[room_id].discard(user_id)
            if not self.chat_rooms[room_id]:
                del self.chat_rooms[room_id]
    
    async def send_chat_message(self, room_id: str, sender_id: str, message: str):
        """채팅 메시지 전송"""
        chat_data = {
            "type": "chat_message",
            "room_id": room_id,
            "sender_id": sender_id,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # 채팅방의 모든 참여자에게 메시지 전송
        if room_id in self.chat_rooms:
            for user_id in self.chat_rooms[room_id]:
                if user_id in self.active_connections:
                    await self.send_personal_message(json.dumps(chat_data), user_id)
    
    def get_online_users(self) -> List[str]:
        """현재 온라인 사용자 목록 반환"""
        return list(self.online_users)

# 전역 연결 관리자
manager = ConnectionManager()

@router.websocket("/connect")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    """웹소켓 연결 엔드포인트"""
    # 토큰 검증 및 사용자 정보 가져오기
    try:
        user = await get_current_user_ws(token)
        user_id = user['id']
    except Exception as e:
        logger.error(f"WebSocket authentication failed: {e}")
        await websocket.close(code=4001, reason="Authentication failed")
        return
    
    # 연결 수락 및 관리
    await manager.connect(user_id, websocket)
    
    try:
        # 초기 데이터 전송 (온라인 사용자 목록)
        online_users = manager.get_online_users()
        await websocket.send_text(json.dumps({
            "type": "initial_data",
            "online_users": online_users,
            "user_id": user_id
        }))
        
        # 메시지 수신 대기
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # 메시지 타입에 따른 처리
            if message["type"] == "ping":
                # 연결 유지용 ping-pong
                await websocket.send_text(json.dumps({"type": "pong"}))
                
            elif message["type"] == "chat_message":
                # 채팅 메시지 처리
                room_id = message.get("room_id")
                text = message.get("message")
                if room_id and text:
                    # DB에 메시지 저장
                    execute_query(
                        """INSERT INTO messages (id, sender_id, receiver_id, content, created_at) 
                           VALUES (hex(randomblob(16)), %s, %s, %s, datetime('now'))""",
                        (user_id, room_id, text)
                    )
                    # 실시간 전송
                    await manager.send_chat_message(room_id, user_id, text)
                    
            elif message["type"] == "join_room":
                # 채팅방 참여
                room_id = message.get("room_id")
                if room_id:
                    await manager.join_chat_room(user_id, room_id)
                    
            elif message["type"] == "leave_room":
                # 채팅방 나가기
                room_id = message.get("room_id")
                if room_id:
                    manager.leave_chat_room(user_id, room_id)
                    
            elif message["type"] == "typing":
                # 타이핑 상태 전송
                room_id = message.get("room_id")
                if room_id and room_id in manager.chat_rooms:
                    typing_data = {
                        "type": "user_typing",
                        "user_id": user_id,
                        "room_id": room_id
                    }
                    for other_user_id in manager.chat_rooms[room_id]:
                        if other_user_id != user_id:
                            await manager.send_personal_message(
                                json.dumps(typing_data), 
                                other_user_id
                            )
                            
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        await manager.broadcast_online_status(user_id, False)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(user_id)
        await manager.broadcast_online_status(user_id, False)

# 다른 API에서 알림 전송용 함수
async def send_realtime_notification(user_id: str, notification_type: str, data: dict):
    """다른 API 엔드포인트에서 실시간 알림을 보낼 때 사용"""
    await manager.send_notification(user_id, notification_type, data)

# 온라인 사용자 목록 조회 API
@router.get("/online-users")
async def get_online_users():
    """현재 온라인 사용자 목록 조회"""
    return {"online_users": manager.get_online_users()}