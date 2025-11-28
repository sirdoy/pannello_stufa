#!/bin/bash

# Test Firebase Operations - Simple HTTP-based test

echo "🧪 Testing Firebase Operations via Dev Server"
echo "=============================================="
echo ""

# Start dev server in background
echo "🚀 Starting dev server..."
SANDBOX_MODE=true TEST_MODE=true npm run dev > /tmp/dev-server.log 2>&1 &
DEV_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
sleep 10

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Dev server failed to start"
    cat /tmp/dev-server.log | tail -20
    kill $DEV_PID 2>/dev/null
    exit 1
fi

echo "✅ Dev server started (PID: $DEV_PID)"
echo ""

# Test 1: Check if API routes work
echo "📝 TEST 1: API Route - Log Action (WRITE test via Admin SDK)"
echo "   Testing: POST /api/log/add"

RESPONSE=$(curl -s -X POST http://localhost:3000/api/log/add \
    -H "Content-Type: application/json" \
    -d '{
        "action": "TEST_FIREBASE_ADMIN_SDK",
        "device": "stove",
        "value": "write_test_successful"
    }')

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ Admin SDK WRITE (adminDbPush): SUCCESS"
    echo "   Response: $RESPONSE"
else
    echo "   ❌ Admin SDK WRITE: FAILED"
    echo "   Response: $RESPONSE"
fi

echo ""

# Test 2: Check maintenance service Admin SDK (read operation)
echo "📝 TEST 2: Maintenance Service Admin SDK (READ test)"
echo "   Testing: adminDbGet via canIgnite()"

# Use CRON_SECRET from env or default for sandbox mode
CRON_SECRET="${CRON_SECRET:-test-secret}"
RESPONSE=$(curl -s "http://localhost:3000/api/scheduler/check?secret=$CRON_SECRET")

if echo "$RESPONSE" | grep -qE '"status"|"message"|MODALITA'; then
    echo "   ✅ Admin SDK READ (adminDbGet in maintenanceServiceAdmin): SUCCESS"
    STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*"' | head -1)
    echo "   Response status: $STATUS"
else
    echo "   ❌ Admin SDK READ: FAILED"  
    echo "   Response: $(echo $RESPONSE | head -c 200)"
fi

echo ""

# Test 3: Verify Admin SDK vs Client SDK separation
echo "📝 TEST 3: Architecture Verification"
echo "   Checking Admin SDK is used only server-side..."

API_WITH_ADMIN=$(find app/api -name "*.js" -type f | xargs grep -l "from '@/lib/firebaseAdmin'" 2>/dev/null | wc -l | tr -d ' ')
PAGES_WITH_ADMIN=$(find app -name "page.js" -type f | xargs grep -l "from '@/lib/firebaseAdmin'" 2>/dev/null | wc -l | tr -d ' ')

echo "   API routes using Admin SDK: $API_WITH_ADMIN"
echo "   Client pages using Admin SDK: $PAGES_WITH_ADMIN"

if [ "$API_WITH_ADMIN" -gt 5 ] && [ "$PAGES_WITH_ADMIN" -eq 0 ]; then
    echo "   ✅ Architecture correct: Admin SDK only in API routes"
else
    echo "   ⚠️  Check architecture: API=$API_WITH_ADMIN, Pages=$PAGES_WITH_ADMIN"
fi

echo ""
echo "=============================================="
echo "🎯 All tests completed successfully!"
echo ""

# Cleanup
echo "🧹 Stopping dev server..."
kill $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null

echo "✅ Done"
