/**
 * Tests for health-monitoring/check route
 * Verifies Raspberry Pi health check integration
 */

jest.mock('@/lib/raspi', () => ({
  raspiClient: { getHealth: jest.fn() },
}));
jest.mock('@/lib/core', () => {
  const { NextResponse } = require('next/server');
  return {
    withCronSecret: jest.fn((handler: (request: Request) => Promise<Response>) => handler),
    success: jest.fn((data: unknown) => NextResponse.json(data, { status: 200 })),
  };
});
jest.mock('@/lib/healthDeadManSwitch', () => ({
  updateDeadManSwitch: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/healthMonitoring', () => ({
  checkUserStoveHealth: jest.fn().mockResolvedValue({
    userId: 'test',
    connectionStatus: 'online',
  }),
}));
jest.mock('@/lib/healthLogger', () => ({
  logHealthCheckRun: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/envValidator', () => ({
  validateHealthMonitoringEnv: jest.fn().mockReturnValue({ valid: true, missing: [] }),
}));
jest.mock('@/lib/notificationTriggersServer', () => ({
  triggerHealthMonitoringAlertServer: jest.fn(),
}));
jest.mock('@/lib/coordinationNotificationThrottle', () => ({
  shouldSendCoordinationNotification: jest.fn().mockResolvedValue({ allowed: false }),
  recordNotificationSent: jest.fn(),
}));

import { GET } from '../route';
import { raspiClient } from '@/lib/raspi';
import { success } from '@/lib/core';

const mockRaspiGetHealth = raspiClient.getHealth as jest.Mock;
const mockSuccess = success as jest.Mock;

describe('GET /api/health-monitoring/check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_USER_ID = 'test-user';
    mockRaspiGetHealth.mockResolvedValue({ status: 'ok', data_freshness: 'LIVE' });
  });

  afterEach(() => {
    delete process.env.ADMIN_USER_ID;
  });

  it('includes raspiStatus: ok when raspiClient.getHealth() resolves', async () => {
    await GET(new Request('http://localhost/api/health-monitoring/check'));

    expect(mockSuccess).toHaveBeenCalledTimes(1);
    const callArg = mockSuccess.mock.calls[0][0] as Record<string, unknown>;
    expect(callArg['raspiStatus']).toBe('ok');
  });

  it('includes raspiStatus: unreachable when raspiClient.getHealth() rejects', async () => {
    mockRaspiGetHealth.mockRejectedValue(new Error('timeout'));

    await GET(new Request('http://localhost/api/health-monitoring/check'));

    expect(mockSuccess).toHaveBeenCalledTimes(1);
    const callArg = mockSuccess.mock.calls[0][0] as Record<string, unknown>;
    expect(callArg['raspiStatus']).toBe('unreachable');
  });

  it('still calls success even when raspiClient.getHealth() throws', async () => {
    mockRaspiGetHealth.mockRejectedValue(new Error('connection refused'));

    await GET(new Request('http://localhost/api/health-monitoring/check'));

    expect(mockSuccess).toHaveBeenCalledTimes(1);
  });

  it('calls console.warn with Raspberry Pi message when raspiClient.getHealth() throws', async () => {
    mockRaspiGetHealth.mockRejectedValue(new Error('network error'));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await GET(new Request('http://localhost/api/health-monitoring/check'));

    const warnCalls = warnSpy.mock.calls.map((args: unknown[]) => args.join(' '));
    const hasRaspiWarn = warnCalls.some((msg: string) => msg.includes('Raspberry Pi'));
    expect(hasRaspiWarn).toBe(true);

    warnSpy.mockRestore();
  });
});
