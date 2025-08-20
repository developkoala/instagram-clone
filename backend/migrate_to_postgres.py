#!/usr/bin/env python3
import sqlite3
import psycopg2
from psycopg2.extras import execute_values
import os
from datetime import datetime

# SQLite 연결
sqlite_conn = sqlite3.connect('/var/www/muksta/backend/instagram_clone.db')
sqlite_conn.row_factory = sqlite3.Row
sqlite_cursor = sqlite_conn.cursor()

# PostgreSQL 연결
pg_conn = psycopg2.connect(
    host="localhost",
    database="instagram_clone",
    user="instagram_user",
    password="instagram_pass123"
)
pg_cursor = pg_conn.cursor()

print("Starting migration from SQLite to PostgreSQL...")

try:
    # 1. Users 테이블 마이그레이션
    print("Migrating users...")
    sqlite_cursor.execute("SELECT * FROM users")
    users = sqlite_cursor.fetchall()
    
    if users:
        # 기존 데이터 삭제 (CASCADE로 관련 데이터도 삭제)
        pg_cursor.execute("TRUNCATE TABLE users CASCADE")
        
        # 새 데이터 삽입
        for user in users:
            pg_cursor.execute("""
                INSERT INTO users (id, email, username, bio, profile_picture, website, 
                                 is_private, is_verified, hashed_password, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (
                user['id'], user['email'], user['username'], user['bio'],
                user['profile_picture'], user['website'], 
                bool(user['is_private']), bool(user['is_verified']),
                user['hashed_password'], user['created_at'], user['updated_at']
            ))
    print(f"Migrated {len(users)} users")

    # 2. Posts 테이블 마이그레이션
    print("Migrating posts...")
    sqlite_cursor.execute("SELECT * FROM posts")
    posts = sqlite_cursor.fetchall()
    
    if posts:
        for post in posts:
            pg_cursor.execute("""
                INSERT INTO posts (id, user_id, caption, location, created_at)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (
                post['id'], post['user_id'], post['caption'], 
                post['location'], post['created_at']
            ))
    print(f"Migrated {len(posts)} posts")

    # 3. Post Images 테이블 마이그레이션
    print("Migrating post images...")
    sqlite_cursor.execute("""
        SELECT pi.* FROM post_images pi
        INNER JOIN posts p ON pi.post_id = p.id
    """)
    images = sqlite_cursor.fetchall()
    
    if images:
        for img in images:
            try:
                pg_cursor.execute("""
                    INSERT INTO post_images (id, post_id, image_url, position)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING
                """, (
                    img['id'], img['post_id'], img['image_url'], img['position']
                ))
            except Exception as e:
                print(f"Skipping image {img['id']}: {e}")
    print(f"Migrated {len(images)} post images")

    # 4. Follows 테이블 마이그레이션
    print("Migrating follows...")
    sqlite_cursor.execute("SELECT * FROM follows")
    follows = sqlite_cursor.fetchall()
    
    if follows:
        import uuid
        for follow in follows:
            try:
                pg_cursor.execute("""
                    INSERT INTO follows (id, follower_id, following_id, created_at)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (follower_id, following_id) DO NOTHING
                """, (
                    str(uuid.uuid4()), follow['follower_id'], 
                    follow['following_id'], follow['created_at']
                ))
            except Exception as e:
                print(f"Skipping follow relationship: {e}")
    print(f"Migrated {len(follows)} follows")

    # 5. Likes 테이블 마이그레이션
    print("Migrating likes...")
    sqlite_cursor.execute("SELECT * FROM likes")
    likes = sqlite_cursor.fetchall()
    
    if likes:
        for like in likes:
            try:
                pg_cursor.execute("""
                    INSERT INTO likes (id, user_id, post_id, created_at)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (user_id, post_id) DO NOTHING
                """, (
                    str(uuid.uuid4()), like['user_id'], 
                    like['post_id'], like['created_at']
                ))
            except Exception as e:
                print(f"Skipping like: {e}")
    print(f"Migrated {len(likes)} likes")

    # 6. Comments 테이블 마이그레이션
    print("Migrating comments...")
    sqlite_cursor.execute("SELECT * FROM comments")
    comments = sqlite_cursor.fetchall()
    
    if comments:
        for comment in comments:
            pg_cursor.execute("""
                INSERT INTO comments (id, post_id, user_id, content, created_at)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (
                comment['id'], comment['post_id'], comment['user_id'],
                comment['content'], comment['created_at']
            ))
    print(f"Migrated {len(comments)} comments")

    # 7. Saved Posts 테이블 마이그레이션
    print("Migrating saved posts...")
    sqlite_cursor.execute("SELECT * FROM saved_posts")
    saved = sqlite_cursor.fetchall()
    
    if saved:
        for save in saved:
            try:
                pg_cursor.execute("""
                    INSERT INTO saved_posts (id, user_id, post_id, created_at)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (user_id, post_id) DO NOTHING
                """, (
                    str(uuid.uuid4()), save['user_id'], 
                    save['post_id'], save['created_at']
                ))
            except Exception as e:
                print(f"Skipping saved post: {e}")
    print(f"Migrated {len(saved)} saved posts")

    # Commit changes
    pg_conn.commit()
    print("\n✅ Migration completed successfully!")
    
    # 확인
    pg_cursor.execute("SELECT COUNT(*) FROM users")
    user_count = pg_cursor.fetchone()[0]
    pg_cursor.execute("SELECT COUNT(*) FROM posts")
    post_count = pg_cursor.fetchone()[0]
    
    print(f"\nPostgreSQL now contains:")
    print(f"- {user_count} users")
    print(f"- {post_count} posts")

except Exception as e:
    print(f"❌ Error during migration: {e}")
    pg_conn.rollback()
    raise

finally:
    sqlite_conn.close()
    pg_cursor.close()
    pg_conn.close()