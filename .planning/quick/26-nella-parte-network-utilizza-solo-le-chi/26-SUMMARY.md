---
phase: quick-26
plan: "01"
subsystem: network-api
tags: [api, fritzbox, refactor, namespace-consolidation]
dependency_graph:
  requires: []
  provides:
    - "vendor-lookup under /api/fritzbox/ namespace"
    - "category-override under /api/fritzbox/ namespace"
  affects:
    - "app/components/devices/network/hooks/useNetworkData.ts"
    - "app/network/page.tsx"
    - "app/debug/components/tabs/NetworkTab.tsx"
tech_stack:
  added: []
  patterns:
    - "git mv for route relocation preserving git history"
    - "Replace-all for URL string updates across multiple files"
key_files:
  created: []
  modified:
    - "app/api/fritzbox/vendor-lookup/route.ts (moved from /api/network/)"
    - "app/api/fritzbox/vendor-lookup/__tests__/route.test.ts (moved + URL updated)"
    - "app/api/fritzbox/category-override/route.ts (moved from /api/network/)"
    - "app/api/fritzbox/category-override/__tests__/route.test.ts (moved + URL updated)"
    - "app/components/devices/network/hooks/useNetworkData.ts (fetch URL updated)"
    - "app/network/page.tsx (fetch URL updated)"
    - "app/debug/components/tabs/NetworkTab.tsx (all 8 URL occurrences updated)"
  deleted:
    - "app/api/network/ (directory removed after routes moved)"
decisions:
  - "Used git mv to preserve git history during route relocation"
  - "Route handler code unchanged - Next.js derives URL from file path"
metrics:
  duration: "3 minutes"
  completed: "2026-02-17"
  tasks_completed: 2
  files_modified: 7
---

# Quick Task 26: Consolidate network API routes under /api/fritzbox/ namespace

**One-liner:** Moved vendor-lookup and category-override from /api/network/ to /api/fritzbox/ via git mv, updated all client fetch URLs, removed /api/network/ directory.

## What Was Done

Consolidated all network-related API routes under the `/api/fritzbox/` namespace for consistency. Two API routes previously lived under `/api/network/` while all other Fritz!Box routes were already under `/api/fritzbox/`.

### Task 1: Move API routes (commit f767b6e)

Used `git mv` to move both route directories, preserving git history:
- `app/api/network/vendor-lookup/` -> `app/api/fritzbox/vendor-lookup/`
- `app/api/network/category-override/` -> `app/api/fritzbox/category-override/`

Route handler code required no changes — Next.js derives the HTTP route URL from the file path automatically. Updated test files: describe block names and Request URL strings changed from `/api/network/` to `/api/fritzbox/`. Removed now-empty `app/api/network/` directory.

### Task 2: Update client-side callers (commit 127ce9b)

Updated three files with fetch URL changes:

1. **useNetworkData.ts** (line 87): `/api/network/vendor-lookup` -> `/api/fritzbox/vendor-lookup`
2. **app/network/page.tsx** (line 78): `/api/network/category-override` -> `/api/fritzbox/category-override`
3. **NetworkTab.tsx**: All 8 occurrences of `/api/network/vendor-lookup` and `/api/network/category-override` updated

## Verification

- Zero `/api/network/` references in `app/` and `lib/` TypeScript files
- Both routes exist at `app/api/fritzbox/vendor-lookup/route.ts` and `app/api/fritzbox/category-override/route.ts`
- `/api/network/` directory removed
- 27 tests pass across 3 test suites (vendor-lookup: 8, category-override: 5, useNetworkData: 14)

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

Files exist:
- [x] `app/api/fritzbox/vendor-lookup/route.ts` - FOUND
- [x] `app/api/fritzbox/category-override/route.ts` - FOUND
- [x] `app/api/fritzbox/vendor-lookup/__tests__/route.test.ts` - FOUND
- [x] `app/api/fritzbox/category-override/__tests__/route.test.ts` - FOUND

Commits exist:
- [x] f767b6e - feat(quick-26): move vendor-lookup and category-override routes
- [x] 127ce9b - feat(quick-26): update all client callers to use /api/fritzbox/ namespace

## Self-Check: PASSED
