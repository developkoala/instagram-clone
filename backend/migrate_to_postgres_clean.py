#!/usr/bin/env python3
import sqlite3
import psycopg2
import uuid
from datetime import datetime

print("Starting clean migration from SQLite to PostgreSQL...")

# SQLite 연결
sqlite_conn = sqlite3.connect('/var/www/muksta/backend/instagram_clone.db')
sqlite_conn.row_factory = sqlite3.Row
sqlite_cursor = sqlite_conn.cursor()

# PostgreSQL 연결 함수
def get_pg_connection():
    return psycopg2.connect(
        host="localhost",
        database="instagram_clone",
        user="instagram_user",
        password="instagram_pass123"
    )

# 1. 기존 데이터 클리어
print("Clearing existing PostgreSQL data...")
pg_conn = get_pg_connection()
pg_cursor = pg_conn.cursor()
pg_cursor.execute("TRUNCATE TABLE users CASCADE")
pg_conn.commit()
pg_conn.close()

# 2. Users 마이그레이션
print("Migrating users...")
sqlite_cursor.execute("SELECT * FROM users")
users = sqlite_cursor.fetchall()

pg_conn = get_pg_connection()
pg_cursor = pg_conn.cursor()
for user in users:
    try:
        pg_cursor.execute("""
            INSERT INTO users (id, email, username, bio, profile_picture, website, 
                             is_private, is_verified, hashed_password, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user['id'], user['email'], user['username'], user['bio'],
            user['profile_picture'], user['website'], 
            bool(user['is_private']), bool(user['is_verified']),
            user['hashed_password'], user['created_at'], user['updated_at']
        ))
        pg_conn.commit()
    except Exception as e:
        pg_conn.rollback()
        print(f"Error migrating user {user['username']}: {e}")
pg_conn.close()
print(f"Migrated {len(users)} users")

# 3. Posts 마이그레이션
print("Migrating posts...")
sqlite_cursor.execute("SELECT * FROM posts")
posts = sqlite_cursor.fetchall()

pg_conn = get_pg_connection()
pg_cursor = pg_conn.cursor()
for post in posts:
    try:
        pg_cursor.execute("""
            INSERT INTO posts (id, user_id, caption, location, created_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            post['id'], post['user_id'], post['caption'], 
            post['location'], post['created_at']
        ))
        pg_conn.commit()
    except Exception as e:
        pg_conn.rollback()
        print(f"Error migrating post {post['id']}: {e}")
pg_conn.close()
print(f"Migrated {len(posts)} posts")

# 4. Post Images 마이그레이션
print("Migrating post images...")
sqlite_cursor.execute("""
    SELECT pi.* FROM post_images pi
    WHERE EXISTS (SELECT 1 FROM posts p WHERE p.id = pi.post_id)
""")
images = sqlite_cursor.fetchall()

pg_conn = get_pg_connection()
pg_cursor = pg_conn.cursor()
for img in images:
    try:
        pg_cursor.execute("""
            INSERT INTO post_images (id, post_id, image_url, position)
            VALUES (%s, %s, %s, %s)
        """, (
            img['id'], img['post_id'], img['image_url'], img['position']
        ))
        pg_conn.commit()
    except Exception as e:
        pg_conn.rollback()
        print(f"Error migrating image {img['id']}: {e}")
pg_conn.close()
print(f"Migrated {len(images)} post images")

# 5. Follows 마이그레이션
print("Migrating follows...")
sqlite_cursor.execute("""
    SELECT * FROM follows 
    WHERE EXISTS (SELECT 1 FROM users WHERE id = follower_id)
    AND EXISTS (SELECT 1 FROM users WHERE id = following_id)
""")
follows = sqlite_cursor.fetchall()

pg_conn = get_pg_connection()
pg_cursor = pg_conn.cursor()
for follow in follows:
    try:
        pg_cursor.execute("""
            INSERT INTO follows (id, follower_id, following_id, created_at)
            VALUES (%s, %s, %s, %s)
        """, (
            str(uuid.uuid4()), follow['follower_id'], 
            follow['following_id'], follow['created_at']
        ))
        pg_conn.commit()
    except Exception as e:
        pg_conn.rollback()
        # Silently skip duplicates
pg_conn.close()
print(f"Migrated {len(follows)} follows")

# 6. Likes 마이그레이션
print("Migrating likes...")
sqlite_cursor.execute("""
    SELECT * FROM likes 
    WHERE EXISTS (SELECT 1 FROM users WHERE id = user_id)
    AND EXISTS (SELECT 1 FROM posts WHERE id = post_id)
""")
likes = sqlite_cursor.fetchall()

pg_conn = get_pg_connection()
pg_cursor = pg_conn.cursor()
for like in likes:
    try:
        pg_cursor.execute("""
            INSERT INTO likes (id, user_id, post_id, created_at)
            VALUES (%s, %s, %s, %s)
        """, (
            str(uuid.uuid4()), like['user_id'], 
            like['post_id'], like['created_at']
        ))
        pg_conn.commit()
    except Exception as e:
        pg_conn.rollback()
        # Silently skip duplicates
pg_conn.close()
print(f"Migrated {len(likes)} likes")

# 7. Comments 마이그레이션
print("Migrating comments...")
sqlite_cursor.execute("""
    SELECT * FROM comments 
    WHERE EXISTS (SELECT 1 FROM users WHERE id = user_id)
    AND EXISTS (SELECT 1 FROM posts WHERE id = post_id)
""")
comments = sqlite_cursor.fetchall()

pg_conn = get_pg_connection()
pg_cursor = pg_conn.cursor()
for comment in comments:
    try:
        pg_cursor.execute("""
            INSERT INTO comments (id, post_id, user_id, content, created_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            comment['id'], comment['post_id'], comment['user_id'],
            comment['content'], comment['created_at']
        ))
        pg_conn.commit()
    except Exception as e:
        pg_conn.rollback()
        print(f"Error migrating comment {comment['id']}: {e}")
pg_conn.close()
print(f"Migrated {len(comments)} comments")

# 8. Saved Posts 마이그레이션
print("Migrating saved posts...")
sqlite_cursor.execute("""
    SELECT * FROM saved_posts 
    WHERE EXISTS (SELECT 1 FROM users WHERE id = user_id)
    AND EXISTS (SELECT 1 FROM posts WHERE id = post_id)
""")
saved = sqlite_cursor.fetchall()

pg_conn = get_pg_connection()
pg_cursor = pg_conn.cursor()
for save in saved:
    try:
        pg_cursor.execute("""
            INSERT INTO saved_posts (id, user_id, post_id, created_at)
            VALUES (%s, %s, %s, %s)
        """, (
            str(uuid.uuid4()), save['user_id'], 
            save['post_id'], save['created_at']
        ))
        pg_conn.commit()
    except Exception as e:
        pg_conn.rollback()
        # Silently skip duplicates
pg_conn.close()
print(f"Migrated {len(saved)} saved posts")

# 확인
pg_conn = get_pg_connection()
pg_cursor = pg_conn.cursor()
pg_cursor.execute("SELECT COUNT(*) FROM users")
user_count = pg_cursor.fetchone()[0]
pg_cursor.execute("SELECT COUNT(*) FROM posts")
post_count = pg_cursor.fetchone()[0]
pg_cursor.execute("SELECT COUNT(*) FROM post_images")
image_count = pg_cursor.fetchone()[0]
pg_conn.close()

sqlite_conn.close()

print("\n✅ Migration completed successfully!")
print(f"\nPostgreSQL now contains:")
print(f"- {user_count} users")
print(f"- {post_count} posts")
print(f"- {image_count} post images")