#!/bin/bash

# E2E Test Runner Script for Playwright
# Ensures Playwright browsers are installed and runs the test suite

set -e

echo "🎭 Playwright E2E Test Suite"
echo "============================"
echo ""

# Install Playwright browsers if needed
echo "📦 Installing Playwright browsers (if not already installed)..."
npx playwright install --with-deps chromium firefox webkit

echo ""
echo "🚀 Running E2E tests..."
echo ""

# Run Playwright tests
npx playwright test

echo ""
echo "✅ Tests completed!"
echo ""
echo "📊 View HTML report:"
echo "   npx playwright show-report"
