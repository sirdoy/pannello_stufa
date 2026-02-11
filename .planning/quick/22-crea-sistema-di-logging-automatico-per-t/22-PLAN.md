---
phase: 22
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - types/firebase/stove.ts
  - lib/services/pidTuningLogService.ts
  - app/api/scheduler/check/route.ts
  - __tests__/lib/services/pidTuningLogService.test.ts
autonomous: true

must_haves:
  truths:
    - "PID tuning data is logged to Firebase every 5 minutes during PID automation"
    - "Log entries contain timestamp, temperature, power, setpoint, PID state (error, integral, derivative, output)"
    - "Old log entries are automatically cleaned up (keeps last 14 days)"
    - "Service functions are unit tested"
  artifacts:
    - path: "types/firebase/stove.ts"
      provides: "PIDTuningLogEntry type definition"
      contains: "export interface PIDTuningLogEntry"
    - path: "lib/services/pidTuningLogService.ts"
      provides: "Service functions for logging and cleanup"
      exports: ["logPidTuningEntry", "cleanupOldLogs"]
      min_lines: 80
    - path: "app/api/scheduler/check/route.ts"
      provides: "Integration of logging into PID automation flow"
      pattern: "logPidTuningEntry"
    - path: "__tests__/lib/services/pidTuningLogService.test.ts"
      provides: "Unit tests for logging service"
      min_lines: 100
  key_links:
    - from: "app/api/scheduler/check/route.ts"
      to: "lib/services/pidTuningLogService.ts"
      via: "logPidTuningEntry call after PID computation"
      pattern: "await logPidTuningEntry"
    - from: "lib/services/pidTuningLogService.ts"
      to: "types/firebase/stove.ts"
      via: "PIDTuningLogEntry type import"
      pattern: "import.*PIDTuningLogEntry"
---

<objective>
Create an automatic logging system for PID tuning data that records temperature, power, setpoint, and PID state every 5 minutes to Firebase.

Purpose: Enable analysis and optimization of PID controller behavior over time by capturing time-series data during automation runs.

Output: Type-safe logging service integrated into existing scheduler/check cron route with unit tests and automatic cleanup.
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/Users/federicomanfredi/Sites/localhost/pannello-stufa/CLAUDE.md
@/Users/federicomanfredi/Sites/localhost/pannello-stufa/lib/services/pidAutomationService.ts
@/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/api/scheduler/check/route.ts
@/Users/federicomanfredi/Sites/localhost/pannello-stufa/types/firebase/stove.ts
@/Users/federicomanfredi/Sites/localhost/pannello-stufa/lib/firebaseAdmin.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create PID tuning log type and service</name>
  <files>
    types/firebase/stove.ts
    lib/services/pidTuningLogService.ts
  </files>
  <action>
**types/firebase/stove.ts:**
Add PIDTuningLogEntry interface at the end of the file:
```typescript
/** PID tuning log entry for analysis and optimization */
export interface PIDTuningLogEntry {
  timestamp: number; // Unix timestamp in milliseconds
  roomTemp: number; // Measured room temperature (°C)
  powerLevel: number; // Current stove power level (1-5)
  setpoint: number; // Target temperature (°C)
  pidOutput: number; // Computed PID output (1-5)
  error: number; // Current error (setpoint - measured)
  integral: number; // Integral term state
  derivative: number; // Derivative term (change in error)
  roomId: string; // Netatmo room ID being monitored
  roomName: string; // Room display name
}
```

**lib/services/pidTuningLogService.ts:** (NEW FILE)
Create server-side logging service following patterns from pidAutomationService.ts:

```typescript
/**
 * PID Tuning Log Service
 *
 * Server-side Firebase operations for PID automation tuning logs.
 * Stores time-series data at pidAutomation/tuningLog/{timestamp}.
 *
 * Usage:
 *   import { logPidTuningEntry, cleanupOldLogs } from '@/lib/services/pidTuningLogService';
 *
 *   await logPidTuningEntry(userId, { roomTemp, powerLevel, setpoint, ... });
 *   await cleanupOldLogs(userId); // Remove entries older than 14 days
 */

import { adminDbSet, adminDbGet, adminDbRemove } from '@/lib/firebaseAdmin';
import type { PIDTuningLogEntry } from '@/types/firebase/stove';

/**
 * Get Firebase path for user's PID tuning logs
 */
function getTuningLogPath(userId: string): string {
  return `users/${userId}/pidAutomation/tuningLog`;
}

/**
 * Log a PID tuning entry to Firebase
 *
 * @param userId - Auth0 user ID
 * @param entry - Tuning data to log (timestamp auto-added if not provided)
 * @returns Promise that resolves when log is saved
 *
 * @example
 * await logPidTuningEntry('auth0|123', {
 *   roomTemp: 19.5,
 *   powerLevel: 3,
 *   setpoint: 20,
 *   pidOutput: 4,
 *   error: 0.5,
 *   integral: 2.3,
 *   derivative: 0.1,
 *   roomId: '1234567890',
 *   roomName: 'Living Room'
 * });
 */
export async function logPidTuningEntry(
  userId: string,
  entry: Omit<PIDTuningLogEntry, 'timestamp'> & { timestamp?: number }
): Promise<void> {
  const timestamp = entry.timestamp ?? Date.now();
  const logPath = `${getTuningLogPath(userId)}/${timestamp}`;

  const logEntry: PIDTuningLogEntry = {
    ...entry,
    timestamp,
  };

  await adminDbSet(logPath, logEntry);
}

/**
 * Clean up old PID tuning logs (keeps last 14 days)
 *
 * @param userId - Auth0 user ID
 * @param retentionDays - Number of days to retain (default: 14)
 * @returns Promise that resolves with number of entries deleted
 *
 * @example
 * const deleted = await cleanupOldLogs('auth0|123');
 * console.log(`Deleted ${deleted} old log entries`);
 */
export async function cleanupOldLogs(userId: string, retentionDays: number = 14): Promise<number> {
  const logPath = getTuningLogPath(userId);
  const logs = await adminDbGet(logPath) as Record<string, PIDTuningLogEntry> | null;

  if (!logs) {
    return 0;
  }

  const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
  const timestamps = Object.keys(logs);
  const toDelete = timestamps.filter(ts => parseInt(ts, 10) < cutoffTime);

  // Delete old entries in parallel
  await Promise.all(
    toDelete.map(ts => adminDbRemove(`${logPath}/${ts}`))
  );

  return toDelete.length;
}
```

Use adminDbSet/adminDbGet/adminDbRemove from @/lib/firebaseAdmin (NOT client-side Firebase). Store logs at `users/{userId}/pidAutomation/tuningLog/{timestamp}` for easy time-based queries and cleanup.
  </action>
  <verify>
1. Type check passes: `npx tsc --noEmit`
2. Files exist: `ls -la types/firebase/stove.ts lib/services/pidTuningLogService.ts`
3. Type is exported: `grep "export interface PIDTuningLogEntry" types/firebase/stove.ts`
4. Service exports functions: `grep "export async function" lib/services/pidTuningLogService.ts`
  </verify>
  <done>
PIDTuningLogEntry type defined in types/firebase/stove.ts with all required fields. pidTuningLogService.ts exists with logPidTuningEntry and cleanupOldLogs functions using Admin SDK. Type checking passes with no errors.
  </done>
</task>

<task type="auto">
  <name>Task 2: Integrate logging into scheduler/check route</name>
  <files>
    app/api/scheduler/check/route.ts
  </files>
  <action>
Add logging to the existing PID automation flow in runPidAutomationIfEnabled function (lines 606-755):

1. **Import the service** at top of file:
```typescript
import { logPidTuningEntry, cleanupOldLogs } from '@/lib/services/pidTuningLogService';
```

2. **Add logging after PID computation** (around line 700, after `const targetPower = pid.compute(...)` and before saving state):
```typescript
// Log tuning data for analysis
try {
  await logPidTuningEntry(adminUserId, {
    roomTemp: measured,
    powerLevel: currentPowerLevel,
    setpoint: setpoint,
    pidOutput: targetPower,
    error: setpoint - measured,
    integral: newState.integral,
    derivative: newState.prevError, // prevError represents derivative term
    roomId: targetRoomId,
    roomName: targetRoom.name,
  });
} catch (logError) {
  // Don't fail PID automation if logging fails
  console.error('Failed to log PID tuning data:', logError instanceof Error ? logError.message : String(logError));
}
```

3. **Add cleanup call** (run once per day, check time):
Add after the logging block:
```typescript
// Cleanup old logs once per day (check if last cleanup was >24h ago)
const lastCleanup = pidState?.lastCleanup ?? 0;
if (now - lastCleanup > 24 * 60 * 60 * 1000) {
  cleanupOldLogs(adminUserId).catch(err =>
    console.error('Failed to cleanup old PID logs:', err)
  );
  // Update lastCleanup timestamp in pidState (will be saved below)
  await adminDbSet(`${pidStatePath}/lastCleanup`, now);
}
```

Log EVERY time PID runs (not just when power changes), so we capture full time series. Wrap logging in try/catch to prevent failures from breaking PID automation. Run cleanup asynchronously without awaiting (fire-and-forget).
  </action>
  <verify>
1. Type check passes: `npx tsc --noEmit`
2. Import exists: `grep "pidTuningLogService" app/api/scheduler/check/route.ts`
3. Logging call exists: `grep "logPidTuningEntry" app/api/scheduler/check/route.ts`
4. Cleanup call exists: `grep "cleanupOldLogs" app/api/scheduler/check/route.ts`
  </verify>
  <done>
Scheduler/check route integrates PID logging after computation, logging all tuning data (temp, power, setpoint, PID state) every 5 minutes. Cleanup runs daily to remove logs older than 14 days. Logging failures don't break PID automation.
  </done>
</task>

<task type="auto">
  <name>Task 3: Create unit tests for logging service</name>
  <files>
    __tests__/lib/services/pidTuningLogService.test.ts
  </files>
  <action>
Create comprehensive unit tests following project patterns:

```typescript
/**
 * Tests for PID Tuning Log Service
 */

import { logPidTuningEntry, cleanupOldLogs } from '@/lib/services/pidTuningLogService';
import { adminDbSet, adminDbGet, adminDbRemove } from '@/lib/firebaseAdmin';

// Mock Firebase Admin
jest.mock('@/lib/firebaseAdmin', () => ({
  adminDbSet: jest.fn(),
  adminDbGet: jest.fn(),
  adminDbRemove: jest.fn(),
}));

describe('pidTuningLogService', () => {
  const mockUserId = 'auth0|test123';
  const mockEntry = {
    roomTemp: 19.5,
    powerLevel: 3,
    setpoint: 20,
    pidOutput: 4,
    error: 0.5,
    integral: 2.3,
    derivative: 0.1,
    roomId: '1234567890',
    roomName: 'Living Room',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logPidTuningEntry', () => {
    it('should log entry with auto-generated timestamp', async () => {
      const beforeTime = Date.now();

      await logPidTuningEntry(mockUserId, mockEntry);

      const afterTime = Date.now();

      expect(adminDbSet).toHaveBeenCalledTimes(1);
      const [path, entry] = jest.mocked(adminDbSet).mock.calls[0]!;

      expect(path).toMatch(/^users\/auth0\|test123\/pidAutomation\/tuningLog\/\d+$/);
      expect(entry.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(entry.timestamp).toBeLessThanOrEqual(afterTime);
      expect(entry.roomTemp).toBe(19.5);
      expect(entry.powerLevel).toBe(3);
      expect(entry.setpoint).toBe(20);
      expect(entry.pidOutput).toBe(4);
      expect(entry.roomId).toBe('1234567890');
      expect(entry.roomName).toBe('Living Room');
    });

    it('should use provided timestamp if given', async () => {
      const customTimestamp = 1234567890000;

      await logPidTuningEntry(mockUserId, { ...mockEntry, timestamp: customTimestamp });

      const [path, entry] = jest.mocked(adminDbSet).mock.calls[0]!;
      expect(path).toBe(`users/${mockUserId}/pidAutomation/tuningLog/${customTimestamp}`);
      expect(entry.timestamp).toBe(customTimestamp);
    });

    it('should include all required fields in log entry', async () => {
      await logPidTuningEntry(mockUserId, mockEntry);

      const [, entry] = jest.mocked(adminDbSet).mock.calls[0]!;

      // Check all required fields from PIDTuningLogEntry interface
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('roomTemp');
      expect(entry).toHaveProperty('powerLevel');
      expect(entry).toHaveProperty('setpoint');
      expect(entry).toHaveProperty('pidOutput');
      expect(entry).toHaveProperty('error');
      expect(entry).toHaveProperty('integral');
      expect(entry).toHaveProperty('derivative');
      expect(entry).toHaveProperty('roomId');
      expect(entry).toHaveProperty('roomName');
    });
  });

  describe('cleanupOldLogs', () => {
    it('should delete logs older than retention period', async () => {
      const now = Date.now();
      const fifteenDaysAgo = now - (15 * 24 * 60 * 60 * 1000);
      const tenDaysAgo = now - (10 * 24 * 60 * 60 * 1000);

      const mockLogs = {
        [fifteenDaysAgo]: { ...mockEntry, timestamp: fifteenDaysAgo },
        [tenDaysAgo]: { ...mockEntry, timestamp: tenDaysAgo },
        [now]: { ...mockEntry, timestamp: now },
      };

      jest.mocked(adminDbGet).mockResolvedValue(mockLogs);

      const deleted = await cleanupOldLogs(mockUserId, 14);

      expect(deleted).toBe(1); // Only 15-day-old log deleted
      expect(adminDbRemove).toHaveBeenCalledTimes(1);
      expect(adminDbRemove).toHaveBeenCalledWith(
        `users/${mockUserId}/pidAutomation/tuningLog/${fifteenDaysAgo}`
      );
    });

    it('should use default 14-day retention if not specified', async () => {
      const now = Date.now();
      const twentyDaysAgo = now - (20 * 24 * 60 * 60 * 1000);

      const mockLogs = {
        [twentyDaysAgo]: { ...mockEntry, timestamp: twentyDaysAgo },
      };

      jest.mocked(adminDbGet).mockResolvedValue(mockLogs);

      await cleanupOldLogs(mockUserId);

      expect(adminDbRemove).toHaveBeenCalledWith(
        `users/${mockUserId}/pidAutomation/tuningLog/${twentyDaysAgo}`
      );
    });

    it('should return 0 if no logs exist', async () => {
      jest.mocked(adminDbGet).mockResolvedValue(null);

      const deleted = await cleanupOldLogs(mockUserId);

      expect(deleted).toBe(0);
      expect(adminDbRemove).not.toHaveBeenCalled();
    });

    it('should return 0 if all logs are within retention period', async () => {
      const now = Date.now();
      const fiveDaysAgo = now - (5 * 24 * 60 * 60 * 1000);

      const mockLogs = {
        [fiveDaysAgo]: { ...mockEntry, timestamp: fiveDaysAgo },
        [now]: { ...mockEntry, timestamp: now },
      };

      jest.mocked(adminDbGet).mockResolvedValue(mockLogs);

      const deleted = await cleanupOldLogs(mockUserId, 14);

      expect(deleted).toBe(0);
      expect(adminDbRemove).not.toHaveBeenCalled();
    });

    it('should handle custom retention periods', async () => {
      const now = Date.now();
      const eightDaysAgo = now - (8 * 24 * 60 * 60 * 1000);

      const mockLogs = {
        [eightDaysAgo]: { ...mockEntry, timestamp: eightDaysAgo },
      };

      jest.mocked(adminDbGet).mockResolvedValue(mockLogs);

      // 7-day retention should delete 8-day-old log
      const deleted = await cleanupOldLogs(mockUserId, 7);

      expect(deleted).toBe(1);
      expect(adminDbRemove).toHaveBeenCalledWith(
        `users/${mockUserId}/pidAutomation/tuningLog/${eightDaysAgo}`
      );
    });

    it('should delete multiple old logs in parallel', async () => {
      const now = Date.now();
      const twentyDaysAgo = now - (20 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

      const mockLogs = {
        [thirtyDaysAgo]: { ...mockEntry, timestamp: thirtyDaysAgo },
        [twentyDaysAgo]: { ...mockEntry, timestamp: twentyDaysAgo },
      };

      jest.mocked(adminDbGet).mockResolvedValue(mockLogs);

      const deleted = await cleanupOldLogs(mockUserId, 14);

      expect(deleted).toBe(2);
      expect(adminDbRemove).toHaveBeenCalledTimes(2);
    });
  });
});
```

Use jest.mock for Firebase Admin imports. Test all edge cases: missing timestamps, no logs, custom retention, parallel deletion. Verify type safety by checking all PIDTuningLogEntry fields.
  </action>
  <verify>
Run tests: `npm test -- pidTuningLogService.test.ts`

Expected: All tests pass (12+ test cases covering logging and cleanup).
  </verify>
  <done>
Unit tests exist at __tests__/lib/services/pidTuningLogService.test.ts covering logPidTuningEntry (timestamp handling, field validation) and cleanupOldLogs (retention logic, edge cases, parallel deletion). All tests pass.
  </done>
</task>

</tasks>

<verification>
1. **Type safety**: Run `npx tsc --noEmit` - no errors
2. **Tests pass**: Run `npm test -- pidTuningLogService.test.ts` - all green
3. **Integration check**: Verify imports in scheduler/check route compile without errors
4. **Logging structure**: Confirm PIDTuningLogEntry has all fields (timestamp, roomTemp, powerLevel, setpoint, pidOutput, error, integral, derivative, roomId, roomName)
</verification>

<success_criteria>
- [ ] PIDTuningLogEntry type exists with 10 required fields
- [ ] pidTuningLogService.ts exports logPidTuningEntry and cleanupOldLogs functions
- [ ] Scheduler/check route imports and calls logging service after PID computation
- [ ] Cleanup runs daily (checks lastCleanup timestamp)
- [ ] Logging errors don't break PID automation (try/catch wrapper)
- [ ] Unit tests cover happy path and edge cases (12+ test cases)
- [ ] All tests pass
- [ ] Type checking passes with no errors
</success_criteria>

<output>
After completion, create `.planning/quick/22-crea-sistema-di-logging-automatico-per-t/22-SUMMARY.md`
</output>
