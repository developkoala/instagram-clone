"""
RSS Feed API endpoints
네이버 및 다른 검색엔진을 위한 RSS 피드 생성
"""
from fastapi import APIRouter, Response, Depends, Query
from typing import Optional
from datetime import datetime
from app.utils.database_utils import execute_query, format_datetime

router = APIRouter(prefix="/rss", tags=["RSS"])

def generate_rss_feed(posts: list, base_url: str = "https://muksta.com") -> str:
    """RSS 2.0 피드 생성"""
    
    # RSS 헤더
    rss_feed = f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>먹스타그램 - 맛있는 순간을 공유하세요</title>
        <link>{base_url}</link>
        <description>음식 사진과 맛집 정보를 공유하는 소셜 네트워크. 최신 맛집 정보와 음식 사진을 확인하세요.</description>
        <language>ko</language>
        <copyright>Copyright © 2025 Mukstagram. All rights reserved.</copyright>
        <lastBuildDate>{datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S +0000')}</lastBuildDate>
        <generator>Mukstagram RSS Generator</generator>
        <atom:link href="{base_url}/rss/rss.xml" rel="self" type="application/rss+xml" />
        <image>
            <url>{base_url}/logo.png</url>
            <title>먹스타그램</title>
            <link>{base_url}</link>
        </image>
'''
    
    # 각 게시물을 RSS 아이템으로 변환
    for post in posts:
        # 이미지 URL 생성
        image_url = ""
        if post.get('image_url'):
            if post['image_url'].startswith('http'):
                image_url = post['image_url']
            else:
                image_url = f"{base_url}{post['image_url']}"
        
        # 제목 생성 (캡션의 첫 50자 또는 사용자명의 게시물)
        title = post.get('caption', '')[:50] if post.get('caption') else f"{post.get('username', '사용자')}님의 맛집 포스트"
        if not title:
            title = f"{post.get('username', '사용자')}님의 맛집 포스트"
        
        # 설명 생성
        description = post.get('caption', '맛있는 음식 사진입니다.')
        if post.get('location'):
            description += f" 📍 {post['location']}"
        
        # 링크 생성
        post_link = f"{base_url}/p/{post['id']}"
        
        # 발행 날짜
        pub_date = post.get('created_at', datetime.utcnow())
        if isinstance(pub_date, str):
            try:
                pub_date = datetime.fromisoformat(pub_date.replace('Z', '+00:00'))
            except:
                pub_date = datetime.utcnow()
        pub_date_str = pub_date.strftime('%a, %d %b %Y %H:%M:%S +0000')
        
        # RSS 아이템 추가
        rss_feed += f'''
        <item>
            <title><![CDATA[{title}]]></title>
            <link>{post_link}</link>
            <guid isPermaLink="true">{post_link}</guid>
            <description><![CDATA[{description}]]></description>
            <dc:creator>{post.get('username', '먹스타그램 사용자')}</dc:creator>
            <pubDate>{pub_date_str}</pubDate>
            <category>맛집</category>
            <category>음식</category>'''
        
        # 이미지가 있으면 추가
        if image_url:
            rss_feed += f'''
            <enclosure url="{image_url}" type="image/jpeg" />
            <content:encoded><![CDATA[
                <p>{description}</p>
                <img src="{image_url}" alt="{title}" />
            ]]></content:encoded>'''
        
        rss_feed += '''
        </item>'''
    
    # RSS 푸터
    rss_feed += '''
    </channel>
</rss>'''
    
    return rss_feed

@router.get("/rss.xml")  # 표준 RSS 경로
@router.get("/feed.xml")  # 이전 경로도 호환성을 위해 유지
@router.get("/")
async def get_rss_feed(
    limit: int = Query(20, ge=1, le=100, description="피드 아이템 개수"),
    category: Optional[str] = Query(None, description="카테고리 필터")
):
    """
    RSS 피드 생성
    
    네이버 서치어드바이저와 다른 검색엔진을 위한 RSS 2.0 피드
    """
    
    # 최신 게시물 조회
    query = """
        SELECT 
            p.id,
            p.caption,
            p.location,
            p.created_at,
            u.username,
            (SELECT image_url FROM post_images WHERE post_id = p.id ORDER BY position LIMIT 1) as image_url,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.is_archived = false
        ORDER BY p.created_at DESC
        LIMIT %s
    """
    
    posts = execute_query(query, (limit,))
    
    # 날짜 포맷팅
    for post in posts:
        if post.get('created_at'):
            post['created_at'] = format_datetime(post['created_at'])
    
    # RSS 피드 생성
    rss_content = generate_rss_feed(posts)
    
    # XML 응답 반환
    return Response(
        content=rss_content,
        media_type="application/rss+xml; charset=utf-8",
        headers={
            "Cache-Control": "max-age=3600",  # 1시간 캐시
            "X-Content-Type-Options": "nosniff"
        }
    )

@router.get("/sitemap.xml")
async def get_sitemap(
    base_url: str = Query("https://muksta.com", description="기본 URL")
):
    """
    사이트맵 생성 (SEO용)
    """
    
    # 게시물 URL 조회
    query = """
        SELECT id, created_at, updated_at
        FROM posts
        WHERE is_archived = false
        ORDER BY created_at DESC
        LIMIT 1000
    """
    
    posts = execute_query(query, ())
    
    # 사이트맵 XML 생성
    sitemap = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- 메인 페이지들 -->
    <url>
        <loc>{base_url}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>{base_url}/explore</loc>
        <changefreq>hourly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>{base_url}/login</loc>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>
    <url>
        <loc>{base_url}/register</loc>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>
'''
    
    # 각 게시물 URL 추가
    for post in posts:
        last_mod = post.get('updated_at') or post.get('created_at')
        if last_mod:
            last_mod_str = format_datetime(last_mod).split('T')[0]
        else:
            last_mod_str = datetime.utcnow().strftime('%Y-%m-%d')
            
        sitemap += f'''
    <url>
        <loc>{base_url}/p/{post['id']}</loc>
        <lastmod>{last_mod_str}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>'''
    
    sitemap += '''
</urlset>'''
    
    return Response(
        content=sitemap,
        media_type="application/xml; charset=utf-8",
        headers={
            "Cache-Control": "max-age=86400",  # 24시간 캐시
            "X-Content-Type-Options": "nosniff"
        }
    )