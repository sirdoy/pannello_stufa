/**
 * Unit tests for Tuya proxy client wrappers.
 * Verifies each function calls haGet/haPost with the correct HA endpoint path.
 */

jest.mock('@/lib/haClient');

import { haGet, haPost } from '@/lib/haClient';
import {
  getHealth,
  getPlugs,
  getPlug,
  setState,
  setTimer,
  getHistory,
} from '../tuyaProxy';
import type {
  TuyaHealth,
  TuyaPlug,
  TuyaPlugMutation,
  TuyaHistoryResponse,
} from '@/types/tuyaProxy';

const mockHaGet = jest.mocked(haGet);
const mockHaPost = jest.mocked(haPost);

// ---------------------------------------------------------------------------
// Shared fixture data
// ---------------------------------------------------------------------------

const mockHealth: TuyaHealth = {
  status: 'ok',
  devices: [
    {
      device_id: 'bf123',
      last_polled_at: 1743074190.456,
      data_freshness: 'LIVE',
    },
  ],
};

const mockPlug: TuyaPlug = {
  device_id: 'bf123',
  switch_on: true,
  power_w: 5.2,
  voltage_v: 230.1,
  current_ma: 22.0,
  energy_kwh: 1.234,
  countdown_s: 0,
  data_freshness: 'LIVE',
  last_polled_at: 1743074190.456,
  custom_name: 'Test Plug',
  device_type: 'smart_plug',
};

const mockMutation: TuyaPlugMutation = { ...mockPlug, data_confirmed: true };

const mockHistory: TuyaHistoryResponse = {
  device_id: 'bf123',
  granularity: 'raw',
  period: { from: 1742987790, to: 1743074190 },
  page: 1,
  page_size: 100,
  total: 10,
  items: [],
};

// ---------------------------------------------------------------------------

describe('tuyaProxy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getHealth() calls /api/v1/tuya/health', async () => {
    mockHaGet.mockResolvedValueOnce(mockHealth);
    const result = await getHealth();
    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/tuya/health');
    expect(result.status).toBe('ok');
    expect(result.devices[0]?.data_freshness).toBe('LIVE');
  });

  it('getPlugs() calls /api/v1/tuya/plugs', async () => {
    mockHaGet.mockResolvedValueOnce([mockPlug]);
    const result = await getPlugs();
    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/tuya/plugs');
    expect(result[0]?.device_id).toBe('bf123');
  });

  it('getPlug(deviceId) calls /api/v1/tuya/plugs/:id', async () => {
    mockHaGet.mockResolvedValueOnce(mockPlug);
    const result = await getPlug('bf123');
    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/tuya/plugs/bf123');
    expect(result.switch_on).toBe(true);
  });

  it('setState(deviceId, body) calls haPost with /api/v1/tuya/plugs/:id/state', async () => {
    mockHaPost.mockResolvedValueOnce(mockMutation);
    const result = await setState('bf123', { on: true });
    expect(mockHaPost).toHaveBeenCalledWith(
      '/api/v1/tuya/plugs/bf123/state',
      { on: true }
    );
    expect(result.data_confirmed).toBe(true);
  });

  it('setTimer(deviceId, body) calls haPost with /api/v1/tuya/plugs/:id/timer', async () => {
    mockHaPost.mockResolvedValueOnce(mockMutation);
    const result = await setTimer('bf123', { seconds: 3600 });
    expect(mockHaPost).toHaveBeenCalledWith(
      '/api/v1/tuya/plugs/bf123/timer',
      { seconds: 3600 }
    );
    expect(result.countdown_s).toBe(0);
  });

  it('getHistory(deviceId, {}) calls /api/v1/tuya/plugs/:id/history (no query string)', async () => {
    mockHaGet.mockResolvedValueOnce(mockHistory);
    const result = await getHistory('bf123', {});
    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/tuya/plugs/bf123/history');
    expect(result.device_id).toBe('bf123');
  });

  it('getHistory(deviceId, { period, page }) appends query string', async () => {
    mockHaGet.mockResolvedValueOnce(mockHistory);
    await getHistory('bf123', { period: '7d', page: '2' });
    expect(mockHaGet).toHaveBeenCalledWith(
      '/api/v1/tuya/plugs/bf123/history?period=7d&page=2'
    );
  });

  it('getHistory omits undefined params from query string', async () => {
    mockHaGet.mockResolvedValueOnce(mockHistory);
    await getHistory('bf123', { period: '24h', from: undefined });
    expect(mockHaGet).toHaveBeenCalledWith(
      '/api/v1/tuya/plugs/bf123/history?period=24h'
    );
  });
});
