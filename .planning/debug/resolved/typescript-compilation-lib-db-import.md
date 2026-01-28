---
status: resolved
trigger: "typescript-compilation-lib-db-import"
created: 2026-01-26T10:30:00Z
updated: 2026-01-26T10:35:00Z
---

## Current Focus

hypothesis: CONFIRMED - Build cache contains stale version of e2e/utils/db-helpers.ts with outdated '/lib/db.js' import
test: Clear all caches (.next/, tsconfig.tsbuildinfo, .next/cache/.tsbuildinfo) and verify build succeeds
expecting: After cache clear, build should succeed with no module resolution errors
next_action: Delete cache directories and tsbuildinfo files, then verify build

## Symptoms

expected: TypeScript should compile successfully without module resolution errors
actual: Build fails with error "Cannot find module '/lib/db.js'" at e2e/utils/db-helpers.ts:26:35
errors:
- Type error: Cannot find module '/lib/db.js' or its corresponding type declarations
- Next.js build worker exited with code: 1
reproduction: Run TypeScript compilation or Next.js build
started: Current issue, file was recently modified but error references old code

## Eliminated

## Evidence

- timestamp: 2026-01-26T10:32:00Z
  checked: Current e2e/utils/db-helpers.ts content
  found: File contains NO import from '/lib/db.js', only IndexedDB helper functions
  implication: Error references stale cached version of file

- timestamp: 2026-01-26T10:32:00Z
  checked: TypeScript compilation with npx tsc --noEmit
  found: No errors reported
  implication: TypeScript can successfully type-check current files without cache

- timestamp: 2026-01-26T10:32:00Z
  checked: .next directory and build cache
  found: Cache exists, last modified 26 Gen 15:02
  implication: Next.js has cached build artifacts

- timestamp: 2026-01-26T10:32:00Z
  checked: Git history for db-helpers.ts
  found: Last commit "fix: correct IndexedDB access pattern in E2E test helpers"
  implication: File was recently fixed to use IndexedDB instead of /lib/db.js

## Resolution

root_cause: Next.js build cache (.next/) and TypeScript build info (tsconfig.tsbuildinfo) contained stale artifacts from a previous version of e2e/utils/db-helpers.ts that imported '/lib/db.js'. The file was recently updated (commit 2a67dab "fix: correct IndexedDB access pattern in E2E test helpers") to remove this import, but the cached build artifacts were not invalidated.

fix: Deleted stale cache directories and build info files:
  - rm -rf .next/
  - rm -f tsconfig.tsbuildinfo

verification:
  - TypeScript compilation (npx tsc --noEmit) completed with no errors
  - Next.js build (npx next build) completed successfully
  - All routes compiled without module resolution errors
  - Build output shows successful compilation of all pages and API routes

files_changed: []
