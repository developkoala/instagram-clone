#!/usr/bin/env python3
"""
메시지 데이터베이스 테이블 생성 스크립트
"""

import sqlite3
import os

def create_messages_tables():
    """메시지 관련 테이블 생성"""
    db_path = os.path.join(os.path.dirname(__file__), 'instagram.db')
    
    # SQL 파일 읽기
    sql_file = os.path.join(os.path.dirname(__file__), 'create_messages_table.sql')
    
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # 데이터베이스 연결 및 테이블 생성
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # SQL 실행
        cursor.executescript(sql_content)
        conn.commit()
        print("✅ 메시지 테이블이 성공적으로 생성되었습니다.")
        
        # 테이블 확인
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('conversations', 'messages');")
        tables = cursor.fetchall()
        print(f"📋 생성된 테이블: {[table[0] for table in tables]}")
        
    except Exception as e:
        print(f"❌ 테이블 생성 실패: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    create_messages_tables()