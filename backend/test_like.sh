#!/bin/bash

# Test like API with curl
BASE_URL="http://localhost:8000"
EMAIL="minjun@example.com"
PASSWORD="password123"  # Default password from sample data

echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"

echo -e "\n2. Getting feed..."
FEED_RESPONSE=$(curl -s -X GET "$BASE_URL/api/posts/feed" \
  -H "Authorization: Bearer $TOKEN")

POST_ID=$(echo $FEED_RESPONSE | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -1)

if [ -z "$POST_ID" ]; then
  echo "❌ No posts found"
  exit 1
fi

echo "✅ First post ID: $POST_ID"

echo -e "\n3. Getting post details..."
POST_DETAIL=$(curl -s -X GET "$BASE_URL/api/posts/$POST_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Post detail response (first 500 chars):"
echo "$POST_DETAIL" | head -c 500
echo

IS_LIKED=$(echo $POST_DETAIL | sed -n 's/.*"is_liked":\([^,}]*\).*/\1/p')
echo "is_liked status: $IS_LIKED"

echo -e "\n4. Attempting to like post $POST_ID..."
LIKE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/posts/$POST_ID/like" \
  -H "Authorization: Bearer $TOKEN")

echo "Like response: $LIKE_RESPONSE"

echo -e "\n5. Getting post details again to verify..."
POST_DETAIL_AFTER=$(curl -s -X GET "$BASE_URL/api/posts/$POST_ID" \
  -H "Authorization: Bearer $TOKEN")

IS_LIKED_AFTER=$(echo $POST_DETAIL_AFTER | sed -n 's/.*"is_liked":\([^,}]*\).*/\1/p')
echo "is_liked status after like: $IS_LIKED_AFTER"