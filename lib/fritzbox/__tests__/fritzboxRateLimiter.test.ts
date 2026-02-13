/**
 * Tests for fritzboxRateLimiter
 */

import { checkRateLimitFritzBox, FRITZBOX_RATE_LIMIT } from '../fritzboxRateLimiter';
import * as rateLimiterPersistent from '@/lib/rateLimiterPersistent';

// Mock persistent rate limiter
jest.mock('@/lib/rateLimiterPersistent');

const mockCheckRateLimitPersistent = jest.mocked(rateLimiterPersistent.checkRateLimitPersistent);

describe('fritzboxRateLimiter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls checkRateLimitPersistent with correct parameters', async () => {
    const mockResult = {
      allowed: true,
      suppressedCount: 0,
      nextAllowedIn: 0,
    };

    mockCheckRateLimitPersistent.mockResolvedValue(mockResult);

    const result = await checkRateLimitFritzBox('user1', 'devices');

    expect(mockCheckRateLimitPersistent).toHaveBeenCalledWith(
      'user1',
      'fritzbox_devices',
      FRITZBOX_RATE_LIMIT
    );
    expect(result).toEqual(mockResult);
  });

  it('returns result from underlying rate limiter unchanged', async () => {
    const mockResult = {
      allowed: false,
      suppressedCount: 5,
      nextAllowedIn: 30,
    };

    mockCheckRateLimitPersistent.mockResolvedValue(mockResult);

    const result = await checkRateLimitFritzBox('user2', 'bandwidth');

    expect(result).toEqual(mockResult);
  });

  it('different endpoint names produce different rate limit keys', async () => {
    mockCheckRateLimitPersistent.mockResolvedValue({
      allowed: true,
      suppressedCount: 0,
      nextAllowedIn: 0,
    });

    await checkRateLimitFritzBox('user1', 'devices');
    await checkRateLimitFritzBox('user1', 'bandwidth');
    await checkRateLimitFritzBox('user1', 'wan');

    expect(mockCheckRateLimitPersistent).toHaveBeenNthCalledWith(
      1,
      'user1',
      'fritzbox_devices',
      FRITZBOX_RATE_LIMIT
    );
    expect(mockCheckRateLimitPersistent).toHaveBeenNthCalledWith(
      2,
      'user1',
      'fritzbox_bandwidth',
      FRITZBOX_RATE_LIMIT
    );
    expect(mockCheckRateLimitPersistent).toHaveBeenNthCalledWith(
      3,
      'user1',
      'fritzbox_wan',
      FRITZBOX_RATE_LIMIT
    );
  });

  it('uses correct rate limit config (10 req/min)', () => {
    expect(FRITZBOX_RATE_LIMIT).toEqual({
      windowMinutes: 1,
      maxPerWindow: 10,
    });
  });
});
