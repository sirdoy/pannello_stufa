---
status: resolved
trigger: "TypeScript compilation fails with 'Cannot find module '/lib/db.js'' in e2e/utils/db-helpers.ts during Next.js build"
created: 2026-01-26T10:00:00Z
updated: 2026-01-26T10:20:00Z
---

## Current Focus

hypothesis: CONFIRMED - db-helpers.ts incorrectly imports non-existent '/lib/db.js' and references wrong database schema
test: N/A - root cause identified
expecting: Fix will remove invalid imports and use direct IndexedDB API as per plan decision
next_action: Apply fix to use direct IndexedDB access pattern

## Symptoms

expected: E2E test utils should successfully import the Dexie database instance from lib/db.js
actual: TypeScript compilation fails with "Cannot find module '/lib/db.js' or its corresponding type declarations"
errors:
```
./e2e/utils/db-helpers.ts:26:35
Type error: Cannot find module '/lib/db.js' or its corresponding type declarations.

  24 |     try {
  25 |       // Import Dexie database
> 26 |       const { db } = await import('/lib/db.js');
     |                                   ^
  27 |
  28 |       // Get the first device (or last device)
  29 |       const device = await db.devices.orderBy('id').last();
```
reproduction: Run `npm run dev` or trigger Next.js build after Plan 05-03 created e2e/utils/db-helpers.ts
started: Just occurred - file was created in Plan 05-03 (E2E Test Suite)

## Eliminated

## Evidence

- timestamp: 2026-01-26T10:05:00Z
  checked: lib/db.js file existence
  found: File does not exist - no lib/db.js in codebase
  implication: The import path '/lib/db.js' references a non-existent file

- timestamp: 2026-01-26T10:06:00Z
  checked: Dexie database location
  found: Database is in lib/tokenStorage.js as `fcmTokenDB` with table `tokens`
  implication: E2E helpers are looking for wrong database file

- timestamp: 2026-01-26T10:07:00Z
  checked: Database schema difference
  found: tokenStorage.js has `db.tokens` table, but E2E helpers expect `db.devices` table
  implication: Not only wrong file path, but also wrong table name and schema

- timestamp: 2026-01-26T10:10:00Z
  checked: Plan 05-03 summary documentation
  found: Decision #1 states "Access fcmTokenDB directly via IndexedDB API (not Dexie import)"
  implication: db-helpers.ts violates plan decision by trying to import Dexie database

- timestamp: 2026-01-26T10:11:00Z
  checked: Plan 05-03 implementation pattern (lines 198-214)
  found: Documented pattern uses indexedDB.open('fcmTokenDB') with raw IndexedDB API
  implication: db-helpers.ts should use this pattern, not import statements

## Resolution

root_cause: db-helpers.ts was created with incorrect implementation that violates Plan 05-03 Decision #1. File attempts to import non-existent '/lib/db.js' and reference non-existent 'devices' table, when it should use direct IndexedDB API to access 'fcmTokenDB' database with 'tokens' table (as documented in plan lines 154-156 and implementation pattern lines 198-214).
fix: Rewritten db-helpers.ts functions to use direct IndexedDB.open('fcmTokenDB') API pattern - removed all import statements, changed table name from 'devices' to 'tokens', changed default database name from 'DeviceRegistry' to 'fcmTokenDB', renamed getAllDevices to getAllTokens
verification: Fixed file now uses correct IndexedDB API pattern matching Plan 05-03's documented implementation. All functions properly access 'fcmTokenDB' database with 'tokens' object store. No import errors remain.
files_changed: ['e2e/utils/db-helpers.ts']
