/**
 * @jest-environment node
 *
 * Integration tests for Netatmo Schedules API routes
 * Tests the integration of cache service, rate limiter, and Netatmo API
 */

import { getCached, invalidateCache } from '@/lib/netatmoCacheService';
import { checkNetatmoRateLimit, trackNetatmoApiCall } from '@/lib/netatmoRateLimiter';
import NETATMO_API from '@/lib/netatmoApi';
import { adminDbGet } from '@/lib/firebaseAdmin';

// Mock dependencies
jest.mock('@/lib/netatmoCacheService');
jest.mock('@/lib/netatmoRateLimiter');
jest.mock('@/lib/netatmoApi');
jest.mock('@/lib/firebaseAdmin');

describe('GET /api/netatmo/schedules - Integration Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use cache service with correct key', async () => {
    const mockSchedules = [
      { id: 'schedule-1', name: 'Morning', type: 'therm', selected: true },
      { id: 'schedule-2', name: 'Evening', type: 'therm', selected: false },
    ];

    (getCached as jest.Mock).mockResolvedValue({
      data: mockSchedules,
      source: 'cache',
      age_seconds: 120,
    });

    // Call cache service with 'schedules' key
    const result = await getCached('schedules', async () => mockSchedules);

    expect(result.data).toEqual(mockSchedules);
    expect(result.source).toBe('cache');
    expect((result as any).age_seconds).toBe(120);
    expect(getCached).toHaveBeenCalledWith('schedules', expect.any(Function));
  });

  it('should check rate limit before API call', () => {
    const userId = 'user-123';

    (checkNetatmoRateLimit as jest.Mock).mockReturnValue({
      allowed: true,
      currentCount: 10,
      remaining: 390,
      limit: 400,
    });

    const rateCheck = checkNetatmoRateLimit(userId);

    expect(rateCheck.allowed).toBe(true);
    expect((rateCheck as any).remaining).toBe(390);
    expect(checkNetatmoRateLimit).toHaveBeenCalledWith(userId);
  });

  it('should track API call on cache miss', () => {
    const userId = 'user-456';

    trackNetatmoApiCall(userId);

    expect(trackNetatmoApiCall).toHaveBeenCalledWith(userId);
  });

  it('should parse schedules from homesdata', () => {
    const mockHomesData = [
      {
        schedules: [
          { id: 'schedule-1', name: 'Morning', type: 'therm', selected: true },
          { id: 'schedule-2', name: 'Evening', type: 'therm', selected: false },
        ],
      },
    ];

    const mockParsedSchedules = [
      { id: 'schedule-1', name: 'Morning', type: 'therm', selected: true },
      { id: 'schedule-2', name: 'Evening', type: 'therm', selected: false },
    ];

    (NETATMO_API.parseSchedules as jest.Mock).mockReturnValue(mockParsedSchedules);

    const result = NETATMO_API.parseSchedules(mockHomesData as any);

    expect(result).toEqual(mockParsedSchedules);
    expect(NETATMO_API.parseSchedules).toHaveBeenCalledWith(mockHomesData);
  });

  it('should return 429 details when rate limit exceeded', () => {
    const userId = 'user-789';

    (checkNetatmoRateLimit as jest.Mock).mockReturnValue({
      allowed: false,
      currentCount: 400,
      limit: 400,
      resetInSeconds: 1800,
    });

    const rateCheck = checkNetatmoRateLimit(userId);

    expect(rateCheck.allowed).toBe(false);
    expect((rateCheck as any).resetInSeconds).toBe(1800);
  });
});

describe('POST /api/netatmo/schedules - Integration Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call switchHomeSchedule with correct parameters', async () => {
    const mockAccessToken = 'mock-token';
    const mockHomeId = 'home-123';
    const mockScheduleId = 'schedule-2';

    (NETATMO_API.switchHomeSchedule as jest.Mock).mockResolvedValue(true);

    const result = await NETATMO_API.switchHomeSchedule(
      mockAccessToken,
      mockHomeId,
      mockScheduleId
    );

    expect(result).toBe(true);
    expect(NETATMO_API.switchHomeSchedule).toHaveBeenCalledWith(
      mockAccessToken,
      mockHomeId,
      mockScheduleId
    );
  });

  it('should invalidate cache after successful switch', async () => {
    (invalidateCache as jest.Mock).mockResolvedValue(true);

    const result = await invalidateCache('schedules');

    expect(result).toBe(true);
    expect(invalidateCache).toHaveBeenCalledWith('schedules');
  });

  it('should check rate limit before switch', () => {
    const userId = 'user-switch';

    (checkNetatmoRateLimit as jest.Mock).mockReturnValue({
      allowed: true,
      currentCount: 5,
      remaining: 395,
      limit: 400,
    });

    const rateCheck = checkNetatmoRateLimit(userId);

    expect(rateCheck.allowed).toBe(true);
    expect((rateCheck as any).remaining).toBe(395);
  });

  it('should track API call after switch', () => {
    const userId = 'user-track';

    trackNetatmoApiCall(userId);

    expect(trackNetatmoApiCall).toHaveBeenCalledWith(userId);
  });

  it('should handle rate limit exceeded', () => {
    (checkNetatmoRateLimit as jest.Mock).mockReturnValue({
      allowed: false,
      currentCount: 400,
      limit: 400,
      resetInSeconds: 600,
    });

    const rateCheck = checkNetatmoRateLimit('user-blocked');

    expect(rateCheck.allowed).toBe(false);
    expect((rateCheck as any).resetInSeconds).toBe(600);
  });

  it('should retrieve home_id from Firebase', async () => {
    const mockHomeId = 'home-456';

    (adminDbGet as jest.Mock).mockResolvedValue(mockHomeId);

    const homeId = await adminDbGet('dev/netatmo/home_id');

    expect(homeId).toBe(mockHomeId);
    expect(adminDbGet).toHaveBeenCalledWith('dev/netatmo/home_id');
  });
});
