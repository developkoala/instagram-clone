#!/usr/bin/env python3
"""
웹소켓 연결 테스트 스크립트
"""

import asyncio
import websockets
import json

async def test_websocket():
    # 실제 로그인해서 토큰 얻기
    import requests
    
    # 먼저 코더로 로그인
    login_response = requests.post(
        "http://localhost:8000/api/auth/login",
        json={"email": "coder@gmail.com", "password": "password123"}
    )
    
    if login_response.status_code == 200:
        token = login_response.json()["access_token"]
        print(f"✅ 로그인 성공! 토큰: {token[:20]}...")
        
        # 웹소켓 연결
        uri = f"ws://127.0.0.1:8000/api/ws/connect?token={token}"
        
        try:
            async with websockets.connect(uri) as websocket:
                print("✅ 웹소켓 연결 성공!")
                
                # 메시지 수신 대기
                print("📡 메시지 수신 대기 중...")
                while True:
                    message = await websocket.recv()
                    data = json.loads(message)
                    print(f"📨 수신된 메시지: {json.dumps(data, indent=2, ensure_ascii=False)}")
                    
        except Exception as e:
            print(f"❌ 웹소켓 연결 실패: {e}")
    else:
        print(f"❌ 로그인 실패: {login_response.text}")

if __name__ == "__main__":
    asyncio.run(test_websocket())