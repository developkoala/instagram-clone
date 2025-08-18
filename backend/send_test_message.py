#!/usr/bin/env python3
"""
테스트 메시지 전송 스크립트
"""

import requests
import json

# 코딩 유저로 로그인
login_response = requests.post(
    "http://localhost:8000/api/auth/login",
    json={"email": "coding@gmail.com", "password": "password123"}
)

if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    print(f"✅ 코딩 유저 로그인 성공!")
    
    # 코더 유저 정보 가져오기
    headers = {"Authorization": f"Bearer {token}"}
    
    # 코더와의 대화방 생성 또는 가져오기
    # 코더의 ID를 직접 사용
    coder_id = "5724575b-45f3-4b2e-8d9c-a2173afe2c0f"
    print(f"📌 코더 유저 ID: {coder_id}")
    
    # 대화방 생성 또는 가져오기
    conv_response = requests.post(
        f"http://localhost:8000/api/messages/conversations/{coder_id}",
        headers=headers
    )
    
    if conv_response.status_code == 200:
        conversation_id = conv_response.json()["conversation_id"]
        print(f"💬 대화방 ID: {conversation_id}")
        
        # 메시지 전송
        message_response = requests.post(
            f"http://localhost:8000/api/messages/conversations/{conversation_id}/messages",
            json={
                "content": "안녕하세요! 웹소켓 테스트 메시지입니다.",
                "message_type": "text"
            },
            headers=headers
        )
        
        if message_response.status_code == 200:
            print("✅ 메시지 전송 성공!")
            print(f"📤 전송된 메시지: {message_response.json()}")
        else:
            print(f"❌ 메시지 전송 실패: {message_response.text}")
    else:
        print(f"❌ 대화방 생성 실패: {conv_response.text}")
else:
    print(f"❌ 로그인 실패: {login_response.text}")