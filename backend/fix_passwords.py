"""
비밀번호 해싱 방식을 bcrypt로 변경하는 스크립트
"""

import sqlite3
from passlib.context import CryptContext

# BCrypt context 생성
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def fix_passwords():
    """모든 사용자의 비밀번호를 password123으로 재설정 (bcrypt 해싱)"""
    
    conn = sqlite3.connect("instagram_clone.db")
    cursor = conn.cursor()
    
    # password123을 bcrypt로 해싱
    hashed_password = pwd_context.hash("password123")
    
    # 모든 사용자 업데이트
    cursor.execute("""
        UPDATE users 
        SET hashed_password = ?
    """, (hashed_password,))
    
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    
    print(f"✅ {affected}명의 사용자 비밀번호가 업데이트되었습니다.")
    print(f"📝 모든 사용자의 비밀번호: password123")

if __name__ == "__main__":
    fix_passwords()