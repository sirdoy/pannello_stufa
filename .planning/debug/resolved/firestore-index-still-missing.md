---
status: verifying
trigger: "Firestore composite index created and enabled but query still fails with 'requires an index' error"
created: 2026-01-26T10:30:00Z
updated: 2026-01-26T10:45:00Z
---

## Current Focus

hypothesis: CONFIRMED ROOT CAUSE - Indexes defined in firestore.indexes.json but never deployed to Firebase
test: Update firebase.json to reference firestore config, then provide manual deployment instructions
expecting: After deployment, queries will work
next_action: Update firebase.json and provide deployment instructions

## Symptoms

expected: GET /api/notifications/history?limit=50 should work after creating composite index
actual: Still getting 9 FAILED_PRECONDITION error saying index is required
errors:
```
9 FAILED_PRECONDITION: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/pannellostufa/firestore/indexes?create_composite=ClZwcm9qZWN0cy9wYW5uZWxsb3N0dWZhL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9ub3RpZmljYXRpb25Mb2dzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg0KCXRpbWVzdGFtcBACGgwKCF9fbmFtZV9fEAI

Error at: lib/notificationHistoryService.js:93 - const snapshot = await query.get();
```
reproduction:
1. Navigate to /settings/notifications/history
2. API call to GET /api/notifications/history?limit=50 (no type or status filters)
3. Error occurs at query.get()
timeline:
- Firestore was just enabled for the project
- Created composite index via Firebase console link
- Index shows as "Enabled" with green checkmark for several minutes
- Still getting same error after waiting 5+ minutes

## Eliminated

## Evidence

- timestamp: 2026-01-26T10:32:00Z
  checked: notificationHistoryService.js query structure (lines 46-66)
  found: Query uses MULTIPLE where clauses: userId (==), timestamp (>), then orderBy timestamp (desc)
  implication: This requires a composite index on (userId, timestamp) with proper directions

- timestamp: 2026-01-26T10:33:00Z
  checked: Decoded base64 index URL from error message
  found: Index structure shows: userId (ascending), timestamp (descending), __name__ (descending)
  implication: Index exists with correct fields and directions

- timestamp: 2026-01-26T10:34:00Z
  checked: Query filtering logic (line 53)
  found: Query uses `where('timestamp', '>', ninetyDaysAgo)` BEFORE `orderBy('timestamp', 'desc')`
  implication: Firestore requires index for inequality filter + orderBy on same field

- timestamp: 2026-01-26T10:35:00Z
  checked: Query optionally adds type (line 57) and status (line 62) filters
  found: These are additional equality filters that require different composite indexes
  implication: Without type/status filters, the base query needs (userId=, timestamp>)

- timestamp: 2026-01-26T10:37:00Z
  checked: firestore.indexes.json file in project root
  found: Index already defined! { userId ASC, timestamp DESC } exists at lines 4-10
  implication: Index definition exists locally but may not be deployed to Firebase

- timestamp: 2026-01-26T10:38:00Z
  checked: Decoded base64 error URL structure
  found: Error wants index with userId(ASC) + timestamp(DESC) + __name__(DESC) - exactly matches firestore.indexes.json structure
  implication: Index is defined correctly but NOT DEPLOYED to Firebase

- timestamp: 2026-01-26T10:39:00Z
  checked: Research doc at .planning/phases/04-*/04-RESEARCH.md line 367-388
  found: Research explicitly warns about composite index requirement and shows exact index structure needed
  implication: The planning phase already identified this requirement - indexes were defined but never deployed

## Resolution

root_cause: Composite index defined in firestore.indexes.json but never deployed to Firebase. The index file exists locally (lines 4-10 have the exact index structure: userId ASC, timestamp DESC) but Firebase doesn't know about it. Creating the index manually via the console link is temporary - the proper fix is to deploy indexes using Firebase CLI.

fix:
1. Updated firebase.json to reference firestore.indexes.json (added firestore.indexes config)
2. Created FIRESTORE_INDEX_DEPLOYMENT.md with deployment instructions
3. User must run: `firebase deploy --only firestore:indexes`

verification: After deployment, navigate to /settings/notifications/history and verify API call succeeds. Check Firebase Console to confirm indexes show "Enabled" status.

files_changed:
- firebase.json (added firestore.indexes reference)
- FIRESTORE_INDEX_DEPLOYMENT.md (created deployment guide)
