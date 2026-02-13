# Phase 60: Critical Path Testing & Token Cleanup - Research

**Researched:** 2026-02-13
**Domain:** Unit testing (Jest), FCM token lifecycle, cron automation
**Confidence:** HIGH

## Summary

Phase 60 requires comprehensive unit tests for the `/api/scheduler/check` route (1108 LOC, 80+ execution paths) and automated FCM token cleanup based on delivery timestamps. The scheduler route is the critical path for stove automation—it runs every 5 minutes via GitHub Actions and orchestrates ignition, shutdown, power/fan adjustments, PID automation, maintenance tracking, valve calibration, weather refresh, and token cleanup.

Current state: The route has ZERO unit tests despite being the most complex API route in the codebase. Token cleanup already exists in the route (lines 201-312) but uses a 7-day interval and runs inline. Testing this route will require mocking ~15 external dependencies (stoveApi, Firebase, notification triggers, Netatmo sync, etc.) and covering all state transitions (OFF → START → WORK), error scenarios (API timeout, invalid state, stove offline), and scheduler modes (manual, auto, semi-manual).

**Primary recommendation:** Create comprehensive unit tests for scheduler check route using established patterns from existing test suite. Extract token cleanup to dedicated service for testability. Use Jest coverage reporting to ensure 80%+ branch coverage.

## Standard Stack

### Core Testing Libraries (Already Installed)
| Library | Version | Purpose | Configuration |
|---------|---------|---------|---------------|
| Jest | 29.7.0 | Unit test runner | `jest.config.ts` |
| @testing-library/react | 14.2.1 | Component testing | N/A |
| ts-jest | 29.1.2 | TypeScript transformer | Via Next.js SWC |

### Supporting Tools
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| jest.mocked() | Built-in | Type-safe mock helpers | Auto-mocked Firebase modules |
| jest.useFakeTimers() | Built-in | Time-based test control | Token cleanup intervals, cron timing |
| jest.spyOn() | Built-in | Spy on existing functions | Console methods, Date.now() |

### Coverage Reporting (Already Configured)
```bash
npm run test:coverage  # Generate coverage report
# Report: coverage/lcov-report/index.html
```

**Current threshold:** 70% (branches, functions, lines, statements) — defined in `jest.config.ts` lines 40-47.

**Installation:** All dependencies already installed. No new packages required.

## Architecture Patterns

### Recommended Test Structure
```
app/api/scheduler/check/
├── route.ts                    # 1108 LOC, 15 external deps
└── __tests__/
    └── route.test.ts           # NEW: comprehensive unit tests
```

### Pattern 1: API Route Testing with Multiple Mocks
**What:** Test API routes by mocking all external dependencies and verifying state transitions.

**When to use:** For routes with complex logic and multiple external calls (stove API, Firebase, notifications).

**Example (from existing codebase):**
```typescript
// Source: app/api/hue/discover/__tests__/route.test.ts
jest.mock('@/lib/hue/hueApi');
jest.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: jest.fn(),
  },
}));

import { GET } from '../route';
import { discoverBridges } from '@/lib/hue/hueApi';
import { auth0 } from '@/lib/auth0';

const mockGetSession = auth0.getSession as jest.MockedFunction<typeof auth0.getSession>;
const mockDiscoverBridges = discoverBridges as jest.MockedFunction<typeof discoverBridges>;

describe('GET /api/hue/discover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
  });

  it('should return discovered bridges successfully', async () => {
    mockDiscoverBridges.mockResolvedValue(mockBridges);
    const response = await GET(mockRequest as any, {} as any);
    expect(response.status).toBe(200);
  });
});
```

### Pattern 2: withCronSecret Middleware Testing
**What:** Test cron-protected routes by mocking the secret validation.

**When to use:** For routes using `withCronSecret()` wrapper (scheduler/check, health-monitoring/check).

**Example (middleware pattern from lib/core/middleware.ts):**
```typescript
// Route signature: export const GET = withCronSecret(async (request) => {...}, 'Scheduler/Check');

// Test pattern:
const mockRequest = new Request('http://localhost/api/scheduler/check?secret=test-secret');
process.env.CRON_SECRET = 'test-secret';

const response = await GET(mockRequest as any, {} as any);
expect(response.status).toBe(200);
```

### Pattern 3: State Transition Testing
**What:** Test all possible state transitions in scheduler logic (OFF → ignite → START → WORK, WORK → shutdown → OFF).

**When to use:** For scheduler route covering all execution paths.

**Example structure:**
```typescript
describe('Scheduler State Transitions', () => {
  describe('OFF → START → WORK', () => {
    it('should ignite stove when schedule is active and stove is off', async () => {
      // Mock: active schedule, stove OFF, maintenance OK
      // Expect: igniteStove() called, notification sent, Firebase updated
    });
  });

  describe('WORK → Power adjustment', () => {
    it('should adjust power level when schedule changes during operation', async () => {
      // Mock: stove WORK, schedule power changed
      // Expect: setPowerLevel() called, no re-ignition
    });
  });
});
```

### Pattern 4: Error Scenario Testing
**What:** Test error handling for API timeouts, invalid states, offline stove.

**When to use:** For 80%+ branch coverage requirement (TEST-04).

**Example:**
```typescript
describe('Error Scenarios', () => {
  it('should handle stove API timeout gracefully', async () => {
    mockGetStoveStatus.mockRejectedValue(new Error('ECONNABORTED'));
    const response = await GET(mockRequest as any, {} as any);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('STATUS_UNAVAILABLE');
  });

  it('should skip ignition when stove status fetch fails', async () => {
    mockGetStoveStatus.mockResolvedValue(null);
    await GET(mockRequest as any, {} as any);
    expect(mockIgniteStove).not.toHaveBeenCalled(); // Safety check
  });
});
```

### Pattern 5: Time-Based Testing with Fake Timers
**What:** Control time for interval-based logic (token cleanup every 7 days, weather refresh every 30 min).

**When to use:** For testing cleanupTokensIfNeeded(), refreshWeatherIfNeeded(), calibrateValvesIfNeeded().

**Example (from existing test suite):**
```typescript
// Source: lib/retry/__tests__/idempotencyManager.test.ts
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('returns a NEW key when the existing key has expired', async () => {
  const now = Date.now();
  jest.setSystemTime(now);

  const firstKey = await manager.registerKey('/api/stove/ignite', { temperature: 20 });

  // Advance time past TTL (1 hour + 1ms)
  jest.setSystemTime(now + 3600001);

  const secondKey = await manager.registerKey('/api/stove/ignite', { temperature: 20 });
  expect(secondKey).not.toBe(firstKey);
});
```

### Anti-Patterns to Avoid
- **Don't test implementation details:** Mock external dependencies (stoveApi, Firebase), verify behavior (status codes, notifications sent), not internal function calls.
- **Don't use real Firebase in tests:** All Firebase functions are auto-mocked in `jest.setup.ts` — use `jest.mocked()` for type-safe mocks.
- **Don't skip error scenarios:** 80%+ coverage requires testing API failures, timeouts, null responses.
- **Don't test fire-and-forget side effects synchronously:** Token cleanup, weather refresh, valve calibration are async promises that don't block the response — verify they're called, not awaited.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time control in tests | Manual Date manipulation | `jest.useFakeTimers()` + `jest.setSystemTime()` | Handles all Date.now(), setTimeout, setInterval automatically |
| Type-safe mocks | `as jest.Mock` casts everywhere | `jest.mocked(importedFunction)` | TypeScript inference, compile-time safety |
| Firebase mock data | Inline mock implementations | Auto-mocks from `jest.setup.ts` | Already configured, consistent across tests |
| Coverage gaps | Manual branch tracking | `npm run test:coverage` | Automated HTML report, highlights untested branches |

**Key insight:** Jest ecosystem provides mature solutions for time control, mocking, and coverage. The codebase already has 145+ tests with established patterns — reuse them for consistency.

## Common Pitfalls

### Pitfall 1: Not Mocking All External Dependencies
**What goes wrong:** Tests fail with "Cannot read property of undefined" or actual API calls are attempted.

**Why it happens:** Scheduler route imports 15+ external modules (stoveApi, Firebase Admin, notification triggers, Netatmo sync).

**How to avoid:** Mock ALL external dependencies at the top of the test file before importing the route:
```typescript
// Mock dependencies BEFORE imports
jest.mock('@/lib/stoveApi');
jest.mock('@/lib/firebaseAdmin');
jest.mock('@/lib/notificationTriggersServer');
jest.mock('@/lib/netatmoStoveSync');
// ... etc

// THEN import route
import { GET } from '../route';
```

**Warning signs:** Test errors mentioning "Cannot find module" or actual HTTP requests in test logs.

### Pitfall 2: Testing Fire-and-Forget Promises Synchronously
**What goes wrong:** Tests fail intermittently because async promises (token cleanup, weather refresh) haven't resolved.

**Why it happens:** Scheduler route uses `.then().catch()` pattern for side effects that don't block the response:
```typescript
// app/api/scheduler/check/route.ts line 941
cleanupTokensIfNeeded().then((result) => {
  if (result.cleaned) {
    console.log('✅ Token cleanup completed');
  }
}).catch(err => console.error('❌ Errore token cleanup:', err.message));
```

**How to avoid:** Don't await fire-and-forget promises. Verify they're called, not their results:
```typescript
// WRONG: Assumes cleanup finishes before response
await GET(mockRequest as any, {} as any);
expect(mockCleanupTokensIfNeeded).toHaveBeenCalled();
const cleanupResult = await mockCleanupTokensIfNeeded.mock.results[0].value;
expect(cleanupResult.cleaned).toBe(true);

// RIGHT: Verify call only (cleanup happens async)
await GET(mockRequest as any, {} as any);
expect(mockCleanupTokensIfNeeded).toHaveBeenCalled();
```

**Warning signs:** Flaky tests that pass/fail randomly, tests that take >1s to complete.

### Pitfall 3: Not Covering Scheduler Mode Variations
**What goes wrong:** Tests pass for automatic mode but fail in production when semi-manual or manual mode is active.

**Why it happens:** Scheduler has 3 modes with different behavior:
- **Manual:** Scheduler disabled, returns early with "MODALITA_MANUALE"
- **Semi-manual:** Skips actions until returnToAutoAt timestamp
- **Automatic:** Full scheduler logic

**How to avoid:** Test all three modes explicitly:
```typescript
describe('Scheduler Modes', () => {
  it('should skip when scheduler is disabled (manual mode)', async () => {
    mockAdminDbGet.mockResolvedValueOnce({ enabled: false, semiManual: false });
    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();
    expect(data.status).toBe('MODALITA_MANUALE');
  });

  it('should skip when in semi-manual mode before returnToAutoAt', async () => {
    const futureTime = new Date(Date.now() + 10000).toISOString();
    mockAdminDbGet.mockResolvedValueOnce({
      enabled: true,
      semiManual: true,
      returnToAutoAt: futureTime
    });
    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();
    expect(data.status).toBe('MODALITA_SEMI_MANUALE');
  });
});
```

**Warning signs:** 80%+ coverage not achieved despite testing happy path.

### Pitfall 4: Token Cleanup Timestamp Logic Errors
**What goes wrong:** Active tokens deleted, stale tokens retained, cleanup runs too frequently.

**Why it happens:** Current implementation (lines 201-312) has subtle bugs:
- Uses `createdAt` fallback when `lastUsed` missing → tokens never updated after Phase 01 migration
- 7-day interval check uses `lastCleanup` from Firebase path `cron/lastTokenCleanup` → not guaranteed to exist on first run
- Batch updates don't log individual deletions → no audit trail per TOKEN-03 requirement

**How to avoid:**
1. Verify `lastUsed` is updated by notification delivery (see `lib/notificationService.ts` — currently NOT implemented)
2. Test edge cases: missing `lastUsed`, missing `createdAt`, first-ever cleanup run
3. Verify audit trail: log to Firebase `tokenCleanupHistory/{timestamp}` with deleted token list

**Warning signs:** All tokens deleted on first cleanup, tokens with recent deliveries marked stale.

### Pitfall 5: Coverage Report Misinterpretation
**What goes wrong:** Tests achieve 80%+ line coverage but miss critical branches (error handling, edge cases).

**Why it happens:** Line coverage != branch coverage. Example:
```typescript
// 2 lines, 4 branches
const result = data?.value ?? fallback;
return result > threshold ? 'HIGH' : 'LOW';

// 100% line coverage, 25% branch coverage if only testing happy path:
// ✅ data exists, value > threshold
// ❌ data missing (uses fallback)
// ❌ value < threshold (returns LOW)
// ❌ data exists but value undefined (uses fallback)
```

**How to avoid:** Use `npm run test:coverage` and review the HTML report at `coverage/lcov-report/index.html`. Look for **branch coverage** specifically:
```bash
# coverage/lcov-report/index.html shows:
# Branches: 82.5% (33/40)  ← Target: 80%+
# Functions: 95% (19/20)
# Lines: 88% (100/113)
```

**Warning signs:** High line coverage (>90%) but low branch coverage (<70%), tests only cover happy path.

## Code Examples

Verified patterns from project codebase:

### Example 1: Mocking Firebase Admin (adminDbGet, adminDbSet)
```typescript
// Source: Existing pattern for scheduler tests
jest.mock('@/lib/firebaseAdmin', () => ({
  adminDbGet: jest.fn(),
  adminDbSet: jest.fn(),
  adminDbUpdate: jest.fn(),
  getAdminDatabase: jest.fn(),
}));

import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';

const mockAdminDbGet = jest.mocked(adminDbGet);
const mockAdminDbSet = jest.mocked(adminDbSet);

// In test:
mockAdminDbGet.mockResolvedValueOnce({ enabled: true, semiManual: false }); // schedules-v2/mode
mockAdminDbGet.mockResolvedValueOnce('default'); // activeScheduleId
mockAdminDbGet.mockResolvedValueOnce([
  { start: '18:00', end: '22:00', power: 4, fan: 3 }
]); // schedule slots
```

### Example 2: Mocking Stove API Functions
```typescript
// Source: Pattern from scheduler test requirements
jest.mock('@/lib/stoveApi', () => ({
  getStoveStatus: jest.fn(),
  getFanLevel: jest.fn(),
  getPowerLevel: jest.fn(),
  igniteStove: jest.fn(),
  shutdownStove: jest.fn(),
  setPowerLevel: jest.fn(),
  setFanLevel: jest.fn(),
}));

import { getStoveStatus, igniteStove, shutdownStove } from '@/lib/stoveApi';

const mockGetStoveStatus = jest.mocked(getStoveStatus);
const mockIgniteStove = jest.mocked(igniteStove);

// Test ignition scenario:
mockGetStoveStatus.mockResolvedValue({
  StatusDescription: 'Spento',
  Result: 0
});
mockIgniteStove.mockResolvedValue({ success: true });

await GET(mockRequest as any, {} as any);

expect(mockIgniteStove).toHaveBeenCalledWith(4); // power level from schedule
```

### Example 3: Mocking Notification Triggers (Server-Side)
```typescript
// Source: app/api/scheduler/check/route.ts imports
jest.mock('@/lib/notificationTriggersServer', () => ({
  triggerSchedulerActionServer: jest.fn(),
  triggerMaintenanceAlertServer: jest.fn(),
  triggerStoveStatusWorkServer: jest.fn(),
  triggerStoveUnexpectedOffServer: jest.fn(),
}));

import { triggerSchedulerActionServer } from '@/lib/notificationTriggersServer';

const mockTriggerSchedulerAction = jest.mocked(triggerSchedulerActionServer);

mockTriggerSchedulerAction.mockResolvedValue({
  success: true,
  skipped: false
});

// After scheduler ignites stove:
expect(mockTriggerSchedulerAction).toHaveBeenCalledWith(
  'admin-user-id',
  'ignition',
  expect.objectContaining({ message: expect.stringContaining('accesa automaticamente') })
);
```

### Example 4: Testing Rome Timezone Logic
```typescript
// Source: lib/__tests__/schedulerService.test.ts lines 38-74
describe('Rome Timezone Handling', () => {
  it('parses current time in Europe/Rome timezone', async () => {
    const mockNow = new Date('2025-10-15T06:00:00.000Z'); // 08:00 Rome time (UTC+2)
    jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

    mockAdminDbGet.mockResolvedValueOnce('default'); // activeScheduleId
    mockAdminDbGet.mockResolvedValueOnce([
      { start: '18:00', end: '22:00', power: 4, fan: 3 }
    ]); // Mercoledì schedule

    await GET(mockRequest as any, {} as any);

    // Scheduler should calculate currentMinutes = 8*60 = 480
    // Schedule start = 18*60 = 1080
    // No active schedule → should not ignite
  });
});
```

### Example 5: Coverage-Driven Branch Testing
```typescript
// app/api/scheduler/check/route.ts lines 455-504 (fetchStoveData function)
describe('fetchStoveData Error Handling', () => {
  it('should return statusFetchFailed=true when getStoveStatus throws', async () => {
    mockGetStoveStatus.mockRejectedValue(new Error('ECONNABORTED'));
    mockGetFanLevel.mockResolvedValue({ Result: 3 });
    mockGetPowerLevel.mockResolvedValue({ Result: 2 });

    // Route should handle error, set statusFetchFailed=true, use defaults
    const response = await GET(mockRequest as any, {} as any);
    const data = await response.json();

    expect(data.status).toBe('STATUS_UNAVAILABLE');
    expect(mockIgniteStove).not.toHaveBeenCalled(); // Safety: skip ignition
  });

  it('should use default fan level when getFanLevel returns null', async () => {
    mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1' });
    mockGetFanLevel.mockResolvedValue(null);
    mockGetPowerLevel.mockResolvedValue({ Result: 2 });

    // Route should use currentFanLevel = 3 (default)
    // No error thrown, continues execution
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual token cleanup via admin UI | Automated cron-based cleanup | Phase 60 (this phase) | Prevents unbounded FCM token growth |
| lastUsed = createdAt (never updated) | lastUsed = notification delivery timestamp | Phase 60 (TOKEN-02) | Accurate staleness detection |
| No audit trail for deletions | Log all deletions to Firebase | Phase 60 (TOKEN-03) | Compliance, debugging, user transparency |
| Inline token cleanup in scheduler route | Extract to tokenCleanupService | Phase 60 (decision needed) | Testability, separation of concerns |
| No unit tests for scheduler check route | Comprehensive test coverage | Phase 60 (TEST-01 to TEST-04) | Safety, regression prevention |

**Deprecated/outdated:**
- **Token cleanup via `/api/notifications/cleanup`:** Still exists (lines 1-178) but uses POST with Bearer auth. Scheduler route uses inline version (lines 201-312). Decision needed: consolidate or keep both?
- **7-day cleanup interval:** Current implementation (line 207). Should be configurable or adjusted based on usage patterns?

## Open Questions

1. **Token Cleanup Service Extraction**
   - What we know: Current implementation is inline in scheduler route (lines 201-312), duplicates logic from `/api/notifications/cleanup`
   - What's unclear: Should we extract to `lib/services/tokenCleanupService.ts` or consolidate both implementations into the existing API route?
   - Recommendation: Extract to service for testability. Both scheduler route and API route call the service. Service can be unit tested independently.

2. **lastUsed Update Mechanism**
   - What we know: `lastUsed` field exists in token schema (lib/tokenStorage.ts line 15), but notification delivery doesn't update it
   - What's unclear: Where should `lastUsed` be updated? In FCM send function? In notification triggers?
   - Recommendation: Update in `lib/notificationService.ts` after successful FCM delivery. Requires investigation of Firebase Admin SDK patterns.

3. **Cleanup Interval Configuration**
   - What we know: Current interval is hardcoded to 7 days (line 207: `const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000`)
   - What's unclear: Is 7 days optimal? Should it be configurable via Firebase config?
   - Recommendation: Keep 7-day default for Phase 60. Make configurable in future phase if needed.

4. **Test Coverage Target Scope**
   - What we know: Requirement TEST-04 specifies 80%+ branch coverage "on scheduler check route"
   - What's unclear: Does this mean only `route.ts` or also helper functions (fetchStoveData, handleIgnition, etc.)?
   - Recommendation: Target 80%+ for `route.ts` file specifically. Helper functions will naturally get coverage as side effect.

5. **PID Automation Test Coverage**
   - What we know: Scheduler route includes PID automation (lines 629-813), which is complex logic with integral/derivative calculations
   - What's unclear: Should PID logic be tested as part of scheduler tests or separately?
   - Recommendation: Mock PID automation in scheduler tests (verify it's called), test PID logic separately in `lib/utils/__tests__/pidController.test.ts` (if doesn't exist, create in separate task).

## Sources

### Primary (HIGH confidence)
- `jest.config.ts` - Coverage configuration (lines 29-47)
- `app/api/scheduler/check/route.ts` - Target route for testing (1108 LOC)
- `lib/core/middleware.ts` - withCronSecret pattern (lines 166-187)
- `lib/tokenStorage.ts` - Token schema with lastUsed field (lines 11-19)
- `app/api/notifications/cleanup/route.ts` - Existing token cleanup implementation
- `lib/__tests__/schedulerService.test.ts` - Existing scheduler test patterns
- `lib/retry/__tests__/idempotencyManager.test.ts` - Fake timers pattern (lines 1-100)
- `app/api/hue/discover/__tests__/route.test.ts` - API route test pattern (lines 1-80)

### Secondary (MEDIUM confidence)
- `.github/workflows/cron-scheduler.yml` - 5-minute cron schedule for scheduler/check
- `docs/testing.md` - Testing best practices and coverage targets
- Project memory - v6.0 phase patterns (cron automation, fire-and-forget analytics)

### Tertiary (LOW confidence)
- None — all findings verified from codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools already installed and configured
- Architecture: HIGH - Existing test patterns proven across 145+ tests
- Pitfalls: HIGH - Specific to scheduler route complexity and token cleanup edge cases

**Research date:** 2026-02-13
**Valid until:** 2026-03-13 (30 days - stable testing patterns, no major Jest version changes expected)
