/**
 * Tests for Cron Executions API Route
 *
 * GET /api/health-monitoring/cron-executions
 */

// Mock dependencies BEFORE imports
jest.mock('@/lib/cronExecutionLogger');
jest.mock('@/lib/core', () => ({
  withAuthAndErrorHandler: (handler: any, name: string) => handler,
  success: (data: any) => ({
    status: 200,
    json: async () => ({ success: true, ...data }),
  }),
}));

import { GET } from '@/app/api/health-monitoring/cron-executions/route';
import * as cronExecutionLogger from '@/lib/cronExecutionLogger';

describe('GET /api/health-monitoring/cron-executions', () => {
  const mockGetRecentCronExecutions = jest.mocked(cronExecutionLogger.getRecentCronExecutions);

  const mockSession = { userId: 'user123' };
  const mockContext = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns recent executions with default limit (20)', async () => {
    const mockExecutions = [
      {
        timestamp: '2026-02-10T12:00:00.000Z',
        status: 'ACCESA',
        mode: 'auto',
        duration: 1234,
        details: { giorno: 'Lunedì', ora: '12:00' },
      },
      {
        timestamp: '2026-02-10T11:55:00.000Z',
        status: 'SPENTA',
        mode: 'auto',
        duration: 987,
      },
    ];

    mockGetRecentCronExecutions.mockResolvedValue(mockExecutions);

    const mockRequest = new Request('http://localhost:3000/api/health-monitoring/cron-executions');

    const response = await GET(mockRequest, mockContext, mockSession);
    const data = await response.json();

    expect(mockGetRecentCronExecutions).toHaveBeenCalledWith(20);
    expect(data).toEqual({
      success: true,
      executions: mockExecutions,
      count: 2,
    });
  });

  it('respects custom limit query parameter', async () => {
    const mockExecutions = Array.from({ length: 10 }, (_, i) => ({
      timestamp: `2026-02-10T12:${String(i).padStart(2, '0')}:00.000Z`,
      status: 'ACCESA',
      mode: 'auto',
      duration: 1000,
    }));

    mockGetRecentCronExecutions.mockResolvedValue(mockExecutions);

    const mockRequest = new Request('http://localhost:3000/api/health-monitoring/cron-executions?limit=10');

    const response = await GET(mockRequest, mockContext, mockSession);
    const data = await response.json();

    expect(mockGetRecentCronExecutions).toHaveBeenCalledWith(10);
    expect(data).toEqual({
      success: true,
      executions: mockExecutions,
      count: 10,
    });
  });

  it('clamps limit to max 50', async () => {
    const mockExecutions = Array.from({ length: 50 }, (_, i) => ({
      timestamp: `2026-02-10T12:${String(i % 60).padStart(2, '0')}:00.000Z`,
      status: 'ACCESA',
      mode: 'auto',
      duration: 1000,
    }));

    mockGetRecentCronExecutions.mockResolvedValue(mockExecutions);

    const mockRequest = new Request('http://localhost:3000/api/health-monitoring/cron-executions?limit=100');

    await GET(mockRequest, mockContext, mockSession);

    expect(mockGetRecentCronExecutions).toHaveBeenCalledWith(50);
  });

  it('uses default limit for invalid values', async () => {
    const mockExecutions = [
      {
        timestamp: '2026-02-10T12:00:00.000Z',
        status: 'ACCESA',
        mode: 'auto',
        duration: 1234,
      },
    ];

    mockGetRecentCronExecutions.mockResolvedValue(mockExecutions);

    const mockRequest = new Request('http://localhost:3000/api/health-monitoring/cron-executions?limit=0');

    await GET(mockRequest, mockContext, mockSession);

    // When limit is 0 or invalid, falls back to default (20)
    expect(mockGetRecentCronExecutions).toHaveBeenCalledWith(20);
  });

  it('returns empty array when no executions exist', async () => {
    mockGetRecentCronExecutions.mockResolvedValue([]);

    const mockRequest = new Request('http://localhost:3000/api/health-monitoring/cron-executions');

    const response = await GET(mockRequest, mockContext, mockSession);
    const data = await response.json();

    expect(data).toEqual({
      success: true,
      executions: [],
      count: 0,
    });
  });
});
