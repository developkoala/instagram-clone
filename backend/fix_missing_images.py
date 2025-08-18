"""
누락된 이미지 파일 생성 스크립트
"""

from PIL import Image, ImageDraw, ImageFont
import os
import sqlite3
from pathlib import Path

# Backend uploads/posts 디렉토리 확인
backend_dir = os.path.dirname(os.path.abspath(__file__))
uploads_dir = os.path.join(backend_dir, 'uploads', 'posts')
os.makedirs(uploads_dir, exist_ok=True)

# DB 연결
db_path = os.path.join(backend_dir, 'instagram_clone.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 모든 이미지 URL 가져오기
cursor.execute("SELECT DISTINCT image_url FROM post_images WHERE image_url LIKE '/uploads/posts/%'")
image_urls = cursor.fetchall()

print(f"Total images in DB: {len(image_urls)}")

# 각 이미지 확인 및 생성
missing_count = 0
created_count = 0

for (image_url,) in image_urls:
    # 파일 이름 추출
    filename = image_url.split('/')[-1]
    file_path = os.path.join(uploads_dir, filename)
    
    # 파일이 존재하지 않으면 생성
    if not os.path.exists(file_path):
        missing_count += 1
        print(f"Missing: {filename}")
        
        # 간단한 테스트 이미지 생성
        # 랜덤 색상 배경
        import random
        r = random.randint(50, 200)
        g = random.randint(50, 200)
        b = random.randint(50, 200)
        
        # 720x1080 크기의 이미지 생성
        img = Image.new('RGB', (720, 1080), color=(r, g, b))
        draw = ImageDraw.Draw(img)
        
        # 중앙에 파일명 표시
        text = f"Test Image\n{filename[:8]}..."
        text_position = (360, 540)
        
        # 텍스트 배경 박스
        bbox = draw.textbbox(text_position, text, anchor='mm')
        padding = 20
        draw.rectangle(
            [(bbox[0] - padding, bbox[1] - padding), 
             (bbox[2] + padding, bbox[3] + padding)],
            fill='white'
        )
        
        # 텍스트 그리기
        draw.text(text_position, text, fill='black', anchor='mm')
        
        # 이미지 저장
        img.save(file_path, quality=85)
        created_count += 1
        print(f"Created: {file_path}")

conn.close()

print(f"\nSummary:")
print(f"- Total images in DB: {len(image_urls)}")
print(f"- Missing files: {missing_count}")
print(f"- Created files: {created_count}")
print("Done!")