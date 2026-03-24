/**
 * Unit tests for DIRIGERA proxy client wrappers.
 * Verifies each function calls haGet with the correct HA endpoint path.
 */

jest.mock('@/lib/haClient');

import { haGet } from '@/lib/haClient';
import {
  getHealth,
  getSensors,
  getContactSensors,
  getMotionSensors,
  getSensorSummary,
} from '../dirigeraProxy';
import type {
  DirigeraHealthResponse,
  DirigeraSensorsResponse,
  ContactSensorsResponse,
  MotionSensorsResponse,
  SensorSummaryResponse,
} from '@/types/dirigeraProxy';

const mockHaGet = jest.mocked(haGet);

// ---------------------------------------------------------------------------
// Shared fixture data
// ---------------------------------------------------------------------------

const mockHealth: DirigeraHealthResponse = {
  firmware_version: '2.465.0',
  connected_sensors: 6,
  is_reachable: true,
};

const mockSensorsResponse: DirigeraSensorsResponse = {
  sensors: [
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      type: 'openCloseSensor',
      custom_name: 'MYGGBETT Ingresso',
      room: 'Ingresso',
      firmware_version: '24056010',
      battery_percentage: 90,
      is_reachable: true,
      is_open: false,
      last_seen: '2026-03-12T15:30:00.000Z',
    },
  ],
  count: 1,
  is_stale: false,
};

const mockContactSensorsResponse: ContactSensorsResponse = {
  sensors: [
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      type: 'openCloseSensor',
      custom_name: 'MYGGBETT Ingresso',
      room: 'Ingresso',
      firmware_version: '24056010',
      battery_percentage: 90,
      is_reachable: true,
      is_open: false,
      last_seen: '2026-03-12T15:30:00.000Z',
      data_freshness: 'LIVE',
    },
  ],
  count: 1,
  is_stale: false,
};

const mockMotionSensorsResponse: MotionSensorsResponse = {
  sensors: [
    {
      id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      type: 'occupancySensor',
      custom_name: 'MYGGBETT Soggiorno',
      room: 'Soggiorno',
      firmware_version: '24056010',
      battery_percentage: 75,
      is_reachable: true,
      is_open: null,
      last_seen: '2026-03-12T15:28:00.000Z',
      light_level: 42,
      data_freshness: 'LIVE',
    },
  ],
  count: 1,
  is_stale: false,
};

const mockSummaryResponse: SensorSummaryResponse = {
  total_sensors: 6,
  open_count: 1,
  offline_count: 0,
  low_battery_count: 0,
  is_stale: false,
};

// ---------------------------------------------------------------------------

describe('dirigeraProxy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getHealth() calls /api/v1/dirigera/health', async () => {
    mockHaGet.mockResolvedValueOnce(mockHealth);
    const result = await getHealth();
    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/dirigera/health');
    expect(result.firmware_version).toBe('2.465.0');
  });

  it('getSensors() calls /api/v1/dirigera/sensors', async () => {
    mockHaGet.mockResolvedValueOnce(mockSensorsResponse);
    const result = await getSensors();
    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/dirigera/sensors');
    expect(result.count).toBe(1);
  });

  it('getContactSensors() calls /api/v1/dirigera/sensors/contact', async () => {
    mockHaGet.mockResolvedValueOnce(mockContactSensorsResponse);
    const result = await getContactSensors();
    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/dirigera/sensors/contact');
    expect(result.sensors[0]?.data_freshness).toBe('LIVE');
  });

  it('getMotionSensors() calls /api/v1/dirigera/sensors/motion', async () => {
    mockHaGet.mockResolvedValueOnce(mockMotionSensorsResponse);
    const result = await getMotionSensors();
    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/dirigera/sensors/motion');
    expect(result.sensors[0]?.light_level).toBe(42);
  });

  it('getSensorSummary() calls /api/v1/dirigera/sensors/summary', async () => {
    mockHaGet.mockResolvedValueOnce(mockSummaryResponse);
    const result = await getSensorSummary();
    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/dirigera/sensors/summary');
    expect(result.total_sensors).toBe(6);
  });
});
