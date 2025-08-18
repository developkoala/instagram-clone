from PIL import Image, ImageDraw
import os

# Backend uploads/posts 디렉토리 확인
backend_dir = os.path.dirname(os.path.abspath(__file__))
uploads_dir = os.path.join(backend_dir, 'uploads', 'posts')
os.makedirs(uploads_dir, exist_ok=True)

# 이미지 ID 목록
image_ids = [
    'eee1b7e6-f878-47bc-b573-d1d68744b351',
    '8f96f237-cae0-4a48-9ad0-070ebdafaa87',
    'a1de6e9e-1c33-4218-80e8-3343135969ad'
]

# 각 이미지 생성
for i, img_id in enumerate(image_ids, 1):
    # 720x1080 크기의 이미지 생성 (Instagram 스토리 크기)
    img = Image.new('RGB', (720, 1080), color=(100 + i*50, 150, 200 - i*30))
    draw = ImageDraw.Draw(img)
    
    # 텍스트 추가
    text = f'Test Image {i}'
    # 중앙에 텍스트 그리기
    text_position = (360, 540)
    
    # 텍스트 배경 박스
    bbox = draw.textbbox(text_position, text, anchor='mm')
    padding = 20
    draw.rectangle(
        [(bbox[0] - padding, bbox[1] - padding), 
         (bbox[2] + padding, bbox[3] + padding)],
        fill='black'
    )
    
    # 텍스트 그리기
    draw.text(text_position, text, fill='white', anchor='mm')
    
    # 이미지 저장
    file_path = os.path.join(uploads_dir, f'{img_id}.png')
    img.save(file_path, quality=85)
    print(f'Created: {file_path}')

print('Images created successfully!')