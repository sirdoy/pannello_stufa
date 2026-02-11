---
phase: 55-retry-infrastructure
plan: 02
subsystem: retry
tags: [idempotency, firebase-rtdb, device-commands, tdd]
dependency_graph:
  requires: [firebase.ts]
  provides: [idempotencyManager, IdempotencyManager, IdempotencyRecord]
  affects: []
tech_stack:
  added: [crypto.randomUUID]
  patterns: [Firebase RTDB key sanitization, lookup hash deduplication, TTL-based expiration]
key_files:
  created:
    - lib/retry/idempotencyManager.ts
    - lib/retry/__tests__/idempotencyManager.test.ts
  modified: []
decisions:
  - Used Firebase RTDB paths (idempotency/keys and idempotency/lookup) for distributed key storage
  - Sanitized Firebase keys by replacing forbidden chars (. $ # [ ] /) with underscores
  - Used crypto.randomUUID() for key generation (UUID v4 format)
  - Set 1-hour TTL (3600000ms) as default for all idempotency keys
  - Implemented dual storage pattern (keys by ID + lookup by hash) for efficient deduplication
metrics:
  duration: 177s
  tasks_completed: 1
  files_created: 2
  tests_added: 10
  completed_at: 2026-02-11T15:41:19Z
---

# Phase 55 Plan 02: Idempotency Manager Summary

**One-liner:** UUID-based idempotency key manager with Firebase RTDB storage and 1-hour TTL for preventing duplicate device commands across all endpoints.

## Objective Achieved

Created the `idempotencyManager` module that generates and stores idempotency keys in Firebase RTDB to prevent duplicate physical actions across all device commands (stove, Hue, Netatmo). The manager ensures that the same endpoint+body combination within a 1-hour TTL window returns the same key, preventing duplicate commands from being executed.

## Implementation Summary

### Core Components

**IdempotencyManager Class:**
- `generateKey()`: Returns crypto.randomUUID() v4 strings
- `registerKey(endpoint, body)`: Registers or retrieves idempotency keys with deduplication
- `cleanupExpired()`: Removes expired keys and returns count removed
- Private `createHash()`: Sanitizes endpoint+body combinations for Firebase key safety

**Firebase RTDB Storage Structure:**
- `idempotency/keys/{key}`: Full IdempotencyRecord with all metadata
- `idempotency/lookup/{hash}`: Lookup entries mapping endpoint+body hash to key

**IdempotencyRecord Interface:**
```typescript
{
  key: string;          // UUID v4
  endpoint: string;     // e.g., '/api/stove/ignite'
  bodyHash: string;     // Sanitized hash of endpoint:body
  createdAt: number;    // Timestamp
  expiresAt: number;    // createdAt + 3600000ms
}
```

### Key Features

1. **Deduplication Logic:**
   - Same endpoint+body within TTL → returns existing key
   - Expired or new combination → generates new UUID key
   - Automatic expiration check on lookup

2. **Firebase Key Sanitization:**
   - Replaces forbidden characters (. $ # [ ] /) with underscores
   - Ensures Firebase RTDB path compatibility
   - Hash format: `{endpoint}:{JSON.stringify(body)}`

3. **TTL Management:**
   - Default 1-hour (3600000ms) TTL for all keys
   - `cleanupExpired()` method for periodic maintenance
   - Timestamp-based expiration using Date.now()

### Test Coverage

**10 test cases covering:**
- UUID v4 format validation
- Key generation and registration
- Deduplication within TTL window
- New key generation after expiration
- Firebase RTDB storage paths (keys and lookup)
- Record structure validation
- TTL defaults to 1 hour
- Cleanup of expired keys only
- Preservation of valid keys during cleanup

**Mocking Strategy:**
- Mocked `firebase/database` module (ref, get, set, remove)
- Mocked `@/lib/firebase` db export
- Used `jest.useFakeTimers()` for time-sensitive tests
- Mock `ref()` returns empty object for test assertions

## Deviations from Plan

None - plan executed exactly as written. TDD flow followed correctly (RED → GREEN → no refactor needed as code was already clean with JSDoc).

## Testing

```bash
npx jest lib/retry/__tests__/idempotencyManager.test.ts --no-coverage --verbose
```

**Result:** All 10 tests pass. TypeScript compilation clean for new files.

## Integration Points

**Ready for:**
- Retry client integration (next plan)
- API route idempotency protection
- Device command deduplication across tabs/devices

**Exports:**
- `idempotencyManager`: Singleton instance for global use
- `IdempotencyManager`: Class for testing/custom instances
- `IdempotencyRecord`: Type for server-side Firebase queries

## Next Steps

The idempotency manager is complete and tested. Next plan (55-03) will integrate this with the retry client to automatically generate and attach idempotency keys to all device command requests.

## Success Criteria: ✓ All Met

- [x] idempotencyManager.ts exports idempotencyManager singleton, IdempotencyManager class, IdempotencyRecord type
- [x] generateKey returns crypto.randomUUID() strings
- [x] registerKey returns same key for same endpoint+body within TTL
- [x] registerKey returns new key after TTL expires
- [x] Firebase RTDB paths are properly sanitized
- [x] cleanupExpired removes only expired keys
- [x] All tests pass with mocked Firebase
- [x] TDD flow followed (RED → GREEN)
- [x] Clean TypeScript interfaces with JSDoc
- [x] Ready for retry client integration

## Self-Check: PASSED

Verified all claims before STATE.md update:
- ✓ lib/retry/idempotencyManager.ts exists
- ✓ lib/retry/__tests__/idempotencyManager.test.ts exists
- ✓ Commit 54da7fa exists
- ✓ 10 tests passing
