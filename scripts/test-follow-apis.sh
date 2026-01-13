#!/bin/bash

# Test Follow System Backend APIs
# Phase 2A Day 2 - Comprehensive API Test Suite

BASE_URL="http://localhost:3000"
API_VERSION="v1"

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((FAILED++))
    fi
}

# Function to print section header
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

echo -e "${YELLOW}Phase 2A Day 2 - Follow System Backend API Tests${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}\n"

# Step 1: Get test users
print_header "Step 1: Setup - Get Test Users"

USER1_RESPONSE=$(curl -s "$BASE_URL/api/$API_VERSION/users/rodczaro")
USER1_ID=$(echo $USER1_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
echo "User 1: @rodczaro (ID: $USER1_ID)"

USER2_RESPONSE=$(curl -s "$BASE_URL/api/$API_VERSION/users/bczar")
USER2_ID=$(echo $USER2_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
echo "User 2: @bczar (ID: $USER2_ID)"

if [ -z "$USER1_ID" ] || [ -z "$USER2_ID" ]; then
    echo -e "${RED}ERROR: Could not find test users. Make sure @rodczaro and @bczar exist.${NC}"
    exit 1
fi

# Step 2: Get auth tokens for test users
print_header "Step 2: Authentication - Get Tokens"

# TODO: Replace with actual login flow once we have test user credentials
# For now, using mock tokens - you'll need to replace these with real tokens
echo -e "${YELLOW}⚠ NOTE: You need to manually login and get auth tokens for testing${NC}"
echo "Login as @rodczaro and @bczar to get their auth tokens"
echo "Then set these environment variables:"
echo "  export USER1_TOKEN='<rodczaro-token>'"
echo "  export USER2_TOKEN='<bczar-token>'"

# Check if tokens are set
if [ -z "$USER1_TOKEN" ] || [ -z "$USER2_TOKEN" ]; then
    echo -e "${YELLOW}Skipping authenticated tests - tokens not set${NC}"
    SKIP_AUTH_TESTS=true
else
    echo "User 1 token: ${USER1_TOKEN:0:20}..."
    echo "User 2 token: ${USER2_TOKEN:0:20}..."
    SKIP_AUTH_TESTS=false
fi

# Test 1: Follow endpoint - Without authentication
print_header "Test 1: POST /follow - Unauthenticated"

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    "$BASE_URL/api/$API_VERSION/users/bczar/follow")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "401" ]; then
    print_result 0 "Returns 401 for unauthenticated request"
else
    print_result 1 "Expected 401, got $HTTP_CODE"
fi

# Skip authenticated tests if tokens not set
if [ "$SKIP_AUTH_TESTS" = true ]; then
    echo -e "\n${YELLOW}Skipping remaining tests - authentication tokens not provided${NC}"
    echo -e "${YELLOW}To run full test suite:${NC}"
    echo "1. Login as @rodczaro: curl -X POST $BASE_URL/api/auth/login -d '{...}'"
    echo "2. Copy the token from cookies or response"
    echo "3. Export: export USER1_TOKEN='<token>'"
    echo "4. Repeat for @bczar: export USER2_TOKEN='<token>'"
    echo "5. Re-run this script"
    exit 0
fi

# Test 2: Follow a user
print_header "Test 2: POST /follow - User 1 follows User 2"

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: Bearer $USER1_TOKEN" \
    "$BASE_URL/api/$API_VERSION/users/bczar/follow")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Successfully created follow relationship"
    echo "$BODY" | grep -q '"success":true' && print_result 0 "Response contains success flag"
    echo "$BODY" | grep -q '"follower"' && print_result 0 "Response contains follower data"
    echo "$BODY" | grep -q '"following"' && print_result 0 "Response contains following data"
    echo "$BODY" | grep -q '"followedAt"' && print_result 0 "Response contains followedAt timestamp"
else
    print_result 1 "Expected 200, got $HTTP_CODE"
    echo "Response: $BODY"
fi

# Test 3: Try to follow same user again (should fail)
print_header "Test 3: POST /follow - Already Following"

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: Bearer $USER1_TOKEN" \
    "$BASE_URL/api/$API_VERSION/users/bczar/follow")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
    print_result 0 "Returns 400 for duplicate follow"
    echo "$BODY" | grep -q 'already following' && print_result 0 "Error message indicates already following"
else
    print_result 1 "Expected 400, got $HTTP_CODE"
fi

# Test 4: Try to follow yourself (should fail)
print_header "Test 4: POST /follow - Self Follow"

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: Bearer $USER1_TOKEN" \
    "$BASE_URL/api/$API_VERSION/users/rodczaro/follow")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
    print_result 0 "Returns 400 for self-follow attempt"
    echo "$BODY" | grep -q 'cannot follow yourself' && print_result 0 "Error message indicates self-follow"
else
    print_result 1 "Expected 400, got $HTTP_CODE"
fi

# Test 5: Get followers list
print_header "Test 5: GET /followers - List User 2's Followers"

RESPONSE=$(curl -s -w "\n%{http_code}" \
    "$BASE_URL/api/$API_VERSION/users/bczar/followers")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Successfully fetched followers list"
    echo "$BODY" | grep -q '"followers":' && print_result 0 "Response contains followers array"
    echo "$BODY" | grep -q '"pagination":' && print_result 0 "Response contains pagination data"
    echo "$BODY" | grep -q '"total"' && print_result 0 "Pagination includes total count"
    
    # Check if User 1 is in the followers list
    echo "$BODY" | grep -q '"username":"rodczaro"' && print_result 0 "User 1 appears in followers list"
else
    print_result 1 "Expected 200, got $HTTP_CODE"
fi

# Test 6: Get following list
print_header "Test 6: GET /following - List User 1's Following"

RESPONSE=$(curl -s -w "\n%{http_code}" \
    "$BASE_URL/api/$API_VERSION/users/rodczaro/following")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Successfully fetched following list"
    echo "$BODY" | grep -q '"following":' && print_result 0 "Response contains following array"
    echo "$BODY" | grep -q '"pagination":' && print_result 0 "Response contains pagination data"
    
    # Check if User 2 is in the following list
    echo "$BODY" | grep -q '"username":"bczar"' && print_result 0 "User 2 appears in following list"
else
    print_result 1 "Expected 200, got $HTTP_CODE"
fi

# Test 7: Get follow status (authenticated)
print_header "Test 7: GET /follow-status - Check Follow Status"

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $USER1_TOKEN" \
    "$BASE_URL/api/$API_VERSION/users/me/follow-status/bczar")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Successfully fetched follow status"
    echo "$BODY" | grep -q '"isFollowing":true' && print_result 0 "isFollowing is true"
    echo "$BODY" | grep -q '"isFollowedBy":false' && print_result 0 "isFollowedBy is false"
    echo "$BODY" | grep -q '"followedAt"' && print_result 0 "Response contains followedAt timestamp"
else
    print_result 1 "Expected 200, got $HTTP_CODE"
fi

# Test 8: Pagination test - Following list
print_header "Test 8: GET /following - Pagination"

RESPONSE=$(curl -s -w "\n%{http_code}" \
    "$BASE_URL/api/$API_VERSION/users/rodczaro/following?page=1&limit=5")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Pagination parameters accepted"
    echo "$BODY" | grep -q '"page":1' && print_result 0 "Page number in response"
    echo "$BODY" | grep -q '"limit":5' && print_result 0 "Limit in response"
    echo "$BODY" | grep -q '"hasMore"' && print_result 0 "hasMore flag in response"
else
    print_result 1 "Expected 200, got $HTTP_CODE"
fi

# Test 9: Unfollow a user
print_header "Test 9: POST /unfollow - User 1 unfollows User 2"

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: Bearer $USER1_TOKEN" \
    "$BASE_URL/api/$API_VERSION/users/bczar/unfollow")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Successfully unfollowed user"
    echo "$BODY" | grep -q '"success":true' && print_result 0 "Response contains success flag"
    echo "$BODY" | grep -q 'Unfollowed' && print_result 0 "Response contains unfollow message"
else
    print_result 1 "Expected 200, got $HTTP_CODE"
fi

# Test 10: Try to unfollow again (should fail)
print_header "Test 10: POST /unfollow - Not Following"

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: Bearer $USER1_TOKEN" \
    "$BASE_URL/api/$API_VERSION/users/bczar/unfollow")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "400" ]; then
    print_result 0 "Returns 400 for unfollowing when not following"
    echo "$BODY" | grep -q 'not following' && print_result 0 "Error message indicates not following"
else
    print_result 1 "Expected 400, got $HTTP_CODE"
fi

# Test 11: Verify follow status after unfollow
print_header "Test 11: GET /follow-status - After Unfollow"

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $USER1_TOKEN" \
    "$BASE_URL/api/$API_VERSION/users/me/follow-status/bczar")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Successfully fetched follow status"
    echo "$BODY" | grep -q '"isFollowing":false' && print_result 0 "isFollowing is now false"
    echo "$BODY" | grep -q '"followedAt":null' && print_result 0 "followedAt is null"
else
    print_result 1 "Expected 200, got $HTTP_CODE"
fi

# Test 12: Case-insensitive username handling
print_header "Test 12: Case-Insensitive Username"

RESPONSE=$(curl -s -w "\n%{http_code}" \
    "$BASE_URL/api/$API_VERSION/users/BCZAR/followers")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Uppercase username works (case-insensitive)"
else
    print_result 1 "Expected 200, got $HTTP_CODE"
fi

# Final Summary
print_header "Test Summary"

TOTAL=$((PASSED + FAILED))
PASS_RATE=$((PASSED * 100 / TOTAL))

echo -e "Total Tests: ${BLUE}$TOTAL${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo -e "Pass Rate: ${YELLOW}$PASS_RATE%${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    exit 0
else
    echo -e "\n${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
    exit 1
fi
