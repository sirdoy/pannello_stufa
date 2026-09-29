/**
 * Unit tests for Token Cleanup Service
 *
 * Tests verify:
 * - TOKEN-02: Stale tokens (>90 days) are deleted based on delivery timestamp
 * - TOKEN-04: Active tokens (<90 days lastUsed) are preserved
 * - TOKEN-03: Audit trail is logged to Firebase
 * - Tokens with no timestamp are treated as stale
 * - Error log cleanup (30-day retention)
 */

jest.mock('@/lib/firebaseAdmin');

jest.mock('next/server', () => ({ after: jest.fn() }));
jest.mock('@/lib/environmentHelper', () => ({ getEnvironmentPath: (p: string) => p }));

import { after } from 'next/server';
import {
  cleanupStaleTokens,
  maybeCleanupStaleTokens,
  scheduleTokenCleanup,
  CLEANUP_INTERVAL_MS,
} from '../tokenCleanupService';
import { getAdminDatabase, adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';

const mockAdminDbSet = jest.mocked(adminDbSet);

interface MockSnapshotChild {
  key: string;
  val: () => unknown;
  child: (path: string) => { val: () => unknown };
}

describe('cleanupStaleTokens', () => {
  let mockRef: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-13T12:00:00.000Z'));
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockAdminDbSet.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  /**
   * Helper to create mock Firebase database with ref/once/update
   */
  function createMockDatabase(usersData: Record<string, unknown>, errorsData?: Record<string, unknown>) {
    const mockUpdate = jest.fn().mockResolvedValue(undefined);

    mockRef = jest.fn().mockImplementation((path: string) => ({
      once: jest.fn().mockImplementation(() => {
        if (path === 'users') {
          return Promise.resolve(createSnapshot(usersData));
        }
        if (path === 'notificationErrors') {
          return Promise.resolve(createSnapshot(errorsData || {}));
        }
        return Promise.resolve(createSnapshot({}));
      }),
      update: mockUpdate,
    }));

    jest.mocked(getAdminDatabase).mockReturnValue({ ref: mockRef } as never);
    return mockUpdate;
  }

  /**
   * Helper to create mock Firebase snapshot
   */
  function createSnapshot(data: Record<string, unknown>) {
    const entries = Object.entries(data);
    return {
      exists: () => entries.length > 0,
      forEach: (callback: (snap: MockSnapshotChild) => void) => {
        entries.forEach(([key, value]) => {
          callback({
            key,
            val: () => value,
            child: (childPath: string) => ({
              val: () => {
                // Navigate nested path
                const parts = childPath.split('/');
                let current: unknown = value;
                for (const part of parts) {
                  current = (current as Record<string, unknown> | undefined)?.[part];
                }
                return current ?? {};
              },
            }),
          });
        });
      },
    };
  }

  it('returns cleaned:true with zero removals when no users exist', async () => {
    createMockDatabase({});

    const result = await cleanupStaleTokens();

    expect(result).toEqual({
      cleaned: true,
      timestamp: Date.now(),
      tokensRemoved: 0,
      tokensScanned: 0,
      errorsRemoved: 0,
      deletedTokens: [],
    });
  });

  it('preserves tokens with lastUsed within 90 days (TOKEN-04)', async () => {
    const mockUpdate = createMockDatabase({
      user1: {
        fcmTokens: {
          token1: {
            token: 'fcm-token-123',
            lastUsed: '2026-02-01T00:00:00.000Z', // 12 days ago
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        },
      },
    });

    const result = await cleanupStaleTokens();

    expect(result.cleaned).toBe(true);
    expect(result.tokensScanned).toBe(1);
    expect(result.tokensRemoved).toBe(0);
    expect(result.deletedTokens).toEqual([]);

    // Verify no update call was made (no tokens to delete)
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('deletes tokens with lastUsed older than 90 days (TOKEN-02)', async () => {
    const mockUpdate = createMockDatabase({
      user1: {
        fcmTokens: {
          staleToken: {
            token: 'fcm-token-old',
            lastUsed: '2025-10-01T00:00:00.000Z', // 135 days ago
            createdAt: '2025-08-01T00:00:00.000Z',
          },
        },
      },
    });

    const result = await cleanupStaleTokens();

    expect(result.cleaned).toBe(true);
    expect(result.tokensScanned).toBe(1);
    expect(result.tokensRemoved).toBe(1);
    expect(result.deletedTokens).toHaveLength(1);
    expect(result.deletedTokens[0]).toMatchObject({
      userId: 'user1',
      tokenKey: 'staleToken',
      lastActivity: '2025-10-01T00:00:00.000Z',
    });
    expect(result.deletedTokens[0]?.ageDays).toBeGreaterThan(90);

    // Verify update was called with token path set to null
    expect(mockUpdate).toHaveBeenCalledWith({
      'users/user1/fcmTokens/staleToken': null,
    });
  });

  it('uses createdAt as fallback when lastUsed is missing', async () => {
    const mockUpdate = createMockDatabase({
      user1: {
        fcmTokens: {
          oldToken: {
            token: 'fcm-token-without-lastused',
            createdAt: '2025-08-01T00:00:00.000Z', // 196 days ago
          },
        },
      },
    });

    const result = await cleanupStaleTokens();

    expect(result.cleaned).toBe(true);
    expect(result.tokensRemoved).toBe(1);
    expect(result.deletedTokens[0]).toMatchObject({
      userId: 'user1',
      tokenKey: 'oldToken',
      lastActivity: '2025-08-01T00:00:00.000Z',
    });

    // Verify token was deleted
    expect(mockUpdate).toHaveBeenCalledWith({
      'users/user1/fcmTokens/oldToken': null,
    });
  });

  it('deletes tokens with no timestamp at all', async () => {
    const mockUpdate = createMockDatabase({
      user1: {
        fcmTokens: {
          orphanToken: {
            token: 'fcm-token-no-timestamp',
            // No lastUsed or createdAt
          },
        },
      },
    });

    const result = await cleanupStaleTokens();

    expect(result.cleaned).toBe(true);
    expect(result.tokensRemoved).toBe(1);
    expect(result.deletedTokens[0]).toMatchObject({
      userId: 'user1',
      tokenKey: 'orphanToken',
      lastActivity: null,
      ageDays: 0,
    });

    // Verify token was deleted
    expect(mockUpdate).toHaveBeenCalledWith({
      'users/user1/fcmTokens/orphanToken': null,
    });
  });

  it('handles multiple users with mixed token states', async () => {
    const mockUpdate = createMockDatabase({
      userA: {
        fcmTokens: {
          activeToken: {
            token: 'fcm-active',
            lastUsed: '2026-02-10T00:00:00.000Z', // 3 days ago
          },
          staleToken: {
            token: 'fcm-stale',
            lastUsed: '2025-09-01T00:00:00.000Z', // 165 days ago
          },
        },
      },
      userB: {
        fcmTokens: {
          oldToken: {
            token: 'fcm-very-old',
            createdAt: '2025-01-01T00:00:00.000Z', // 408 days ago
          },
        },
      },
    });

    const result = await cleanupStaleTokens();

    expect(result.cleaned).toBe(true);
    expect(result.tokensScanned).toBe(3);
    expect(result.tokensRemoved).toBe(2);
    expect(result.deletedTokens).toHaveLength(2);

    // Verify only stale tokens were deleted
    expect(mockUpdate).toHaveBeenCalledWith({
      'users/userA/fcmTokens/staleToken': null,
      'users/userB/fcmTokens/oldToken': null,
    });

    // Verify active token was preserved
    const deletedTokenKeys = result.deletedTokens.map(t => t.tokenKey);
    expect(deletedTokenKeys).not.toContain('activeToken');
  });

  it('logs audit trail to Firebase tokenCleanupHistory (TOKEN-03)', async () => {
    createMockDatabase({
      user1: {
        fcmTokens: {
          staleToken: {
            token: 'fcm-token-old',
            lastUsed: '2025-10-01T00:00:00.000Z',
          },
        },
      },
    });

    const result = await cleanupStaleTokens();

    expect(result.tokensRemoved).toBe(1);

    // Verify audit trail was logged
    expect(mockAdminDbSet).toHaveBeenCalled();

    const auditCall = mockAdminDbSet.mock.calls[0]!;
    expect(auditCall[0]).toMatch(/tokenCleanupHistory/);

    const auditData = auditCall[1] as { deletedTokens: unknown[] };
    expect(auditData).toMatchObject({
      timestamp: Date.now(),
      tokensScanned: 1,
      tokensRemoved: 1,
      errorsRemoved: 0,
    });

    expect(auditData.deletedTokens).toHaveLength(1);
    expect(auditData.deletedTokens[0]).toMatchObject({
      userId: 'user1',
      tokenKey: 'staleToken',
    });
  });

  it('cleans up error logs older than 30 days', async () => {
    const mockUpdate = createMockDatabase(
      {},
      {
        error1: {
          timestamp: '2025-12-30T00:00:00.000Z', // 45 days ago
          message: 'Old error',
        },
        error2: {
          timestamp: '2026-02-08T00:00:00.000Z', // 5 days ago
          message: 'Recent error',
        },
      }
    );

    const result = await cleanupStaleTokens();

    expect(result.cleaned).toBe(true);
    expect(result.errorsRemoved).toBe(1);

    // Verify only the 45-day-old error was deleted
    expect(mockUpdate).toHaveBeenCalledWith({
      'notificationErrors/error1': null,
    });
  });

  it('preserves recent error logs', async () => {
    const mockUpdate = createMockDatabase(
      {},
      {
        error1: {
          timestamp: '2026-02-08T00:00:00.000Z', // 5 days ago
          message: 'Recent error',
        },
      }
    );

    const result = await cleanupStaleTokens();

    expect(result.cleaned).toBe(true);
    expect(result.errorsRemoved).toBe(0);

    // Verify no error deletions
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns cleaned:false with reason when exception occurs', async () => {
    jest.mocked(getAdminDatabase).mockImplementation(() => {
      throw new Error('Firebase connection failed');
    });

    const result = await cleanupStaleTokens();

    expect(result).toEqual({
      cleaned: false,
      reason: 'exception',
      error: 'Firebase connection failed',
      tokensScanned: 0,
      tokensRemoved: 0,
      errorsRemoved: 0,
      deletedTokens: [],
    });
  });

  it('performs batch update for multiple token deletions', async () => {
    const mockUpdate = createMockDatabase({
      user1: {
        fcmTokens: {
          stale1: {
            token: 'fcm-1',
            lastUsed: '2025-10-01T00:00:00.000Z',
          },
          stale2: {
            token: 'fcm-2',
            lastUsed: '2025-09-01T00:00:00.000Z',
          },
        },
      },
      user2: {
        fcmTokens: {
          stale3: {
            token: 'fcm-3',
            lastUsed: '2025-08-01T00:00:00.000Z',
          },
        },
      },
    });

    const result = await cleanupStaleTokens();

    expect(result.tokensRemoved).toBe(3);

    // Verify single update call with all 3 paths
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      'users/user1/fcmTokens/stale1': null,
      'users/user1/fcmTokens/stale2': null,
      'users/user2/fcmTokens/stale3': null,
    });
  });

  it('does not call update when no tokens need removal', async () => {
    const mockUpdate = createMockDatabase({
      user1: {
        fcmTokens: {
          activeToken: {
            token: 'fcm-active',
            lastUsed: '2026-02-10T00:00:00.000Z', // 3 days ago
          },
        },
      },
    });

    const result = await cleanupStaleTokens();

    expect(result.tokensRemoved).toBe(0);

    // Verify update was never called
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

describe('maybeCleanupStaleTokens (weekly, no external cron — ROADMAP V11)', () => {
  const NOW = new Date('2026-09-29T12:00:00.000Z').getTime();
  const store: Record<string, unknown> = {};
  const emptySnapshot = { exists: () => false, forEach: () => {} };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    for (const k of Object.keys(store)) delete store[k];
    jest.mocked(adminDbGet).mockImplementation(async (path: string) => (store[path] ?? null) as never);
    jest.mocked(adminDbSet).mockImplementation(async (path: string, value: unknown) => {
      store[path] = value;
    });
    jest.mocked(getAdminDatabase).mockReturnValue({
      ref: jest.fn(() => ({ once: jest.fn().mockResolvedValue(emptySnapshot), update: jest.fn() })),
    } as never);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('runs when never run before and stores the timestamp', async () => {
    const result = await maybeCleanupStaleTokens();

    expect(result).toMatchObject({ ran: true, cleaned: true, tokensScanned: 0 });
    expect(store['cron/lastTokenCleanup']).toBe(NOW);
  });

  it('skips when the last cleanup is less than 7 days old', async () => {
    store['cron/lastTokenCleanup'] = NOW - 24 * 60 * 60 * 1000;

    const result = await maybeCleanupStaleTokens();

    expect(result).toEqual({
      ran: false,
      reason: 'too_soon',
      next: new Date(NOW - 24 * 60 * 60 * 1000 + CLEANUP_INTERVAL_MS).toISOString(),
    });
    expect(getAdminDatabase).not.toHaveBeenCalled();
  });

  it('runs again once 7 days have passed', async () => {
    store['cron/lastTokenCleanup'] = NOW - CLEANUP_INTERVAL_MS;

    expect(await maybeCleanupStaleTokens()).toMatchObject({ ran: true });
    expect(store['cron/lastTokenCleanup']).toBe(NOW);
  });

  it('a failed cleanup keeps the old timestamp, so the next call retries', async () => {
    store['cron/lastTokenCleanup'] = NOW - CLEANUP_INTERVAL_MS - 1;
    jest.mocked(getAdminDatabase).mockImplementation(() => {
      throw new Error('firebase down');
    });

    expect(await maybeCleanupStaleTokens()).toMatchObject({ ran: true, cleaned: false });
    expect(store['cron/lastTokenCleanup']).toBe(NOW - CLEANUP_INTERVAL_MS - 1);
  });

  it('never throws (runs in after() of unrelated requests)', async () => {
    jest.mocked(adminDbGet).mockRejectedValue(new Error('rtdb unavailable'));

    expect(await maybeCleanupStaleTokens()).toEqual({
      ran: false,
      reason: 'exception',
      error: 'rtdb unavailable',
    });
  });
});

describe('scheduleTokenCleanup', () => {
  it('queues the throttled cleanup after the response', () => {
    scheduleTokenCleanup();

    expect(after).toHaveBeenCalledWith(maybeCleanupStaleTokens);
  });
});
