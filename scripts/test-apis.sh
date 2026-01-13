#!/bin/bash

# Quick Test Script for Mobile APIs
# Usage: ./test-apis.sh [username] [environment]
# Example: ./test-apis.sh john_doe production
# Example: ./test-apis.sh test_user local

USERNAME=${1:-test_user}
ENV=${2:-local}

if [ "$ENV" = "production" ]; then
  BASE_URL="https://fotolokashen.com"
elif [ "$ENV" = "local" ]; then
  BASE_URL="http://localhost:3000"
else
  echo "Invalid environment. Use 'local' or 'production'"
  exit 1
fi

echo "🧪 Testing Mobile APIs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Environment: $ENV"
echo "Base URL: $BASE_URL"
echo "Username: $USERNAME"
echo ""

# Test 1: Get User Profile
echo "📝 Test 1: GET /api/v1/users/$USERNAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -i -s "$BASE_URL/api/v1/users/$USERNAME" | head -20
echo ""
echo ""

# Test 2: Get User Profile (with @ prefix)
echo "📝 Test 2: GET /api/v1/users/@$USERNAME (with @ prefix)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$BASE_URL/api/v1/users/@$USERNAME" | jq . || curl -s "$BASE_URL/api/v1/users/@$USERNAME"
echo ""
echo ""

# Test 3: Get Locations (default pagination)
echo "📝 Test 3: GET /api/v1/users/$USERNAME/locations (default)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$BASE_URL/api/v1/users/$USERNAME/locations" | jq . || curl -s "$BASE_URL/api/v1/users/$USERNAME/locations"
echo ""
echo ""

# Test 4: Get Locations (with pagination)
echo "📝 Test 4: GET /api/v1/users/$USERNAME/locations?page=1&limit=5"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$BASE_URL/api/v1/users/$USERNAME/locations?page=1&limit=5" | jq '.pagination' || curl -s "$BASE_URL/api/v1/users/$USERNAME/locations?page=1&limit=5"
echo ""
echo ""

# Test 5: Check Headers
echo "📝 Test 5: Check Response Headers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -I -s "$BASE_URL/api/v1/users/$USERNAME" | grep -E "(HTTP|Cache-Control|X-API-Version|Content-Type)"
echo ""
echo ""

# Test 6: Non-existent User
echo "📝 Test 6: Non-existent User (should return 404)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$BASE_URL/api/v1/users/nonexistent_user_12345" | jq . || curl -s "$BASE_URL/api/v1/users/nonexistent_user_12345"
echo ""
echo ""

echo "✅ Tests complete!"
echo ""
echo "💡 Tips:"
echo "  - Install jq for pretty JSON: brew install jq"
echo "  - View full response: curl -v $BASE_URL/api/v1/users/$USERNAME"
echo "  - Test in browser: $BASE_URL/@$USERNAME"
