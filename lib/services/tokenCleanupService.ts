/**
 * Token Cleanup Service
 *
 * Centralized service for cleaning up stale FCM tokens and error logs.
 * Provides audit trail logging for compliance and monitoring.
 *
 * Used by:
 * - scheduleTokenCleanup() → maybeCleanupStaleTokens(): at most every 7 days, after
 *   /api/internal/stove-events (Pi webhook) and /api/notifications/register
 *   (workspace ROADMAP V11, no external cron)
 * - /api/notifications/cleanup (manual trigger)
 */

import { after } from 'next/server';
import { getAdminDatabase, adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';

export interface CleanupResult {
  cleaned: boolean;
  reason?: string;
  tokensScanned: number;
  tokensRemoved: number;
  errorsRemoved: number;
  deletedTokens: Array<{
    userId: string;
    tokenKey: string;
    lastActivity: string | null;
    ageDays: number;
  }>;
  nextCleanup?: string;
  timestamp?: number;
  error?: string;
}

interface TokenData {
  lastUsed?: string;
  createdAt?: string;
  token?: string;
  [key: string]: unknown;
}

interface ErrorData {
  timestamp: string;
  [key: string]: unknown;
}

// Tokens inactive for >90 days are considered stale
const STALE_THRESHOLD_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const ERROR_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Clean up stale FCM tokens and old error logs
 *
 * - Scans all users' FCM tokens
 * - Removes tokens inactive for >90 days (based on lastUsed || createdAt)
 * - Removes error logs older than 30 days
 * - Logs audit trail to Firebase tokenCleanupHistory
 *
 * @returns {Promise<CleanupResult>} Cleanup statistics and deleted token details
 */
export async function cleanupStaleTokens(): Promise<CleanupResult> {
  try {
    const db = getAdminDatabase();
    const now = Date.now();

    // Step 1: Cleanup stale FCM tokens
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');

    let tokensScanned = 0;
    let tokensRemoved = 0;
    const tokenUpdates: Record<string, null> = {};
    const deletedTokens: Array<{
      userId: string;
      tokenKey: string;
      lastActivity: string | null;
      ageDays: number;
    }> = [];

    if (snapshot.exists()) {
      snapshot.forEach(userSnap => {
        const userId = userSnap.key as string;
        const tokens = (userSnap.child('fcmTokens').val() as Record<string, TokenData> | null) || {};

        Object.entries(tokens).forEach(([tokenKey, tokenData]) => {
          tokensScanned++;

          // Use lastUsed if available, otherwise fall back to createdAt (TOKEN-02)
          const lastActivity = tokenData.lastUsed || tokenData.createdAt;

          if (!lastActivity) {
            // No timestamp - consider stale
            tokenUpdates[`users/${userId}/fcmTokens/${tokenKey}`] = null;
            tokensRemoved++;
            deletedTokens.push({
              userId,
              tokenKey,
              lastActivity: null,
              ageDays: 0,
            });
            return;
          }

          const lastActivityTime = new Date(lastActivity).getTime();
          const age = now - lastActivityTime;

          // Active token protection (TOKEN-04): Tokens with lastUsed within 90 days are safe
          if (age > STALE_THRESHOLD_MS) {
            tokenUpdates[`users/${userId}/fcmTokens/${tokenKey}`] = null;
            tokensRemoved++;
            const ageDays = Math.floor(age / (24 * 60 * 60 * 1000));
            deletedTokens.push({
              userId,
              tokenKey,
              lastActivity,
              ageDays,
            });
          }
        });
      });

      // Apply token deletions in single batch update
      if (Object.keys(tokenUpdates).length > 0) {
        await db.ref().update(tokenUpdates);
      }
    }

    // Step 2: Cleanup old error logs (30 days retention)
    const errorCutoff = new Date(now - ERROR_RETENTION_MS).toISOString();
    const errorsRef = db.ref('notificationErrors');
    const errorsSnapshot = await errorsRef.once('value');

    let errorsRemoved = 0;
    const errorUpdates: Record<string, null> = {};

    if (errorsSnapshot.exists()) {
      errorsSnapshot.forEach(errorSnap => {
        const error = errorSnap.val() as ErrorData;
        if (error?.timestamp && error.timestamp < errorCutoff) {
          errorUpdates[`notificationErrors/${errorSnap.key}`] = null;
          errorsRemoved++;
        }
      });

      // Apply error deletions in single batch update
      if (Object.keys(errorUpdates).length > 0) {
        await db.ref().update(errorUpdates);
      }
    }

    // Step 3: Log audit trail to Firebase (TOKEN-03)
    if (tokensRemoved > 0 || errorsRemoved > 0) {
      const auditTimestamp = new Date().toISOString();
      const auditPath = getEnvironmentPath(`tokenCleanupHistory/${auditTimestamp.replace(/[:.]/g, '_')}`);

      await adminDbSet(auditPath, {
        timestamp: now,
        timestampISO: auditTimestamp,
        tokensScanned,
        tokensRemoved,
        errorsRemoved,
        deletedTokens,
      }).catch(err => {
        console.error('Failed to write audit trail:', err);
        // Don't fail cleanup if audit logging fails
      });
    }

    return {
      cleaned: true,
      timestamp: now,
      tokensRemoved,
      tokensScanned,
      errorsRemoved,
      deletedTokens,
    };

  } catch (error) {
    console.error('❌ Token cleanup error:', error);
    return {
      cleaned: false,
      reason: 'exception',
      error: error instanceof Error ? error.message : 'Unknown error',
      tokensScanned: 0,
      tokensRemoved: 0,
      errorsRemoved: 0,
      deletedTokens: [],
    };
  }
}

export const CLEANUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const LAST_CLEANUP_PATH = 'cron/lastTokenCleanup';

export type ThrottledCleanupResult =
  | { ran: false; reason: 'too_soon'; next: string }
  | { ran: false; reason: 'exception'; error: string }
  | ({ ran: true } & CleanupResult);

/**
 * Run cleanupStaleTokens() when 7 days have passed since the last successful run.
 *
 * The timestamp lives at `cron/lastTokenCleanup` (same path the old external cron
 * used) and advances only when the cleanup succeeds, so a failure is retried on the
 * next call. Never throws: callers run it in `after()` of unrelated requests.
 */
export async function maybeCleanupStaleTokens(): Promise<ThrottledCleanupResult> {
  try {
    const statePath = getEnvironmentPath(LAST_CLEANUP_PATH);
    const last = await adminDbGet<number>(statePath);
    const now = Date.now();
    if (last && now - last < CLEANUP_INTERVAL_MS) {
      return { ran: false, reason: 'too_soon', next: new Date(last + CLEANUP_INTERVAL_MS).toISOString() };
    }
    const result = await cleanupStaleTokens();
    if (result.cleaned) await adminDbSet(statePath, now);
    return { ran: true, ...result };
  } catch (error) {
    console.error('Throttled token cleanup failed:', error);
    return { ran: false, reason: 'exception', error: error instanceof Error ? error.message : String(error) };
  }
}

/** Queue maybeCleanupStaleTokens() to run after the current route handler responds. */
export function scheduleTokenCleanup(): void {
  after(maybeCleanupStaleTokens);
}
