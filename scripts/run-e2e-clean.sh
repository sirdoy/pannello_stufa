#!/bin/bash

# Script per eseguire test E2E Playwright e pulire i file generati
# Mantiene il progetto pulito rimuovendo automaticamente report, screenshot e video

set -e

echo "🧪 Running Playwright E2E tests..."
echo ""

# Esegui i test
npx playwright test "$@"
TEST_EXIT_CODE=$?

echo ""
echo "📊 Test execution completed with exit code: $TEST_EXIT_CODE"
echo ""

# Mostra riepilogo file generati prima di pulire
if [ -d "playwright-report" ] || [ -d "test-results" ] || [ -d "playwright/.cache" ]; then
  echo "📁 Generated files to be cleaned:"

  if [ -d "playwright-report" ]; then
    REPORT_SIZE=$(du -sh playwright-report 2>/dev/null | cut -f1 || echo "0B")
    echo "  • playwright-report/ ($REPORT_SIZE)"
  fi

  if [ -d "test-results" ]; then
    RESULTS_SIZE=$(du -sh test-results 2>/dev/null | cut -f1 || echo "0B")
    RESULTS_COUNT=$(find test-results -type f 2>/dev/null | wc -l | tr -d ' ' || echo "0")
    echo "  • test-results/ ($RESULTS_SIZE, $RESULTS_COUNT files)"
  fi

  if [ -d "playwright/.cache" ]; then
    CACHE_SIZE=$(du -sh playwright/.cache 2>/dev/null | cut -f1 || echo "0B")
    echo "  • playwright/.cache/ ($CACHE_SIZE)"
  fi

  echo ""
  echo "🧹 Cleaning up..."

  # Pulisci i file
  rm -rf playwright-report test-results playwright/.cache

  echo "✅ Cleanup completed - project is clean!"
else
  echo "✅ No files to clean - project is already clean!"
fi

echo ""

# Esci con lo stesso codice dei test
exit $TEST_EXIT_CODE
