/**
 * Unit tests for Sonos proxy client wrappers.
 * Verifies each function calls haGet with the correct HA endpoint path.
 */

jest.mock('@/lib/haClient');

import { haGet } from '@/lib/haClient';
import { getHealth, getDevices, getDevice, getZones } from '../sonosProxy';
import type {
  SonosHealthResponse,
  SonosDeviceResponse,
  SonosDeviceDetailResponse,
  SonosZoneResponse,
} from '@/types/sonosProxy';

const mockHaGet = jest.mocked(haGet);

// ---------------------------------------------------------------------------
// Shared fixture data
// ---------------------------------------------------------------------------

const mockHealth: SonosHealthResponse = {
  connected: true,
  data_freshness: 'LIVE',
  device_count: 5,
  last_poll_at: null,
  last_success_at: null,
};

const mockDevice: SonosDeviceResponse = {
  uid: 'RINCON_B8E9378A123401400',
  name: 'Soggiorno',
  ip: '192.168.1.50',
  model: 'Sonos Beam (Gen 2)',
  firmware: '77.4-52100',
  serial: 'B8-E9-37-8A-12-34:A',
  role: 'soundbar',
  is_visible: true,
  is_coordinator: true,
};

const mockDeviceDetail: SonosDeviceDetailResponse = {
  ...mockDevice,
  volume: 30,
  mute: false,
  bass: 0,
  treble: 0,
  loudness: false,
};

const mockZone: SonosZoneResponse = {
  group_id: 'RINCON_B8E9378A123401400',
  label: 'Soggiorno',
  coordinator_uid: 'RINCON_B8E9378A123401400',
  coordinator_name: 'Soggiorno',
  member_count: 1,
  members: [
    {
      uid: 'RINCON_B8E9378A123401400',
      name: 'Soggiorno',
      ip: '192.168.1.50',
      role: 'soundbar',
    },
  ],
};

// ---------------------------------------------------------------------------

describe('getHealth', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls haGet with /api/v1/sonos/health', async () => {
    mockHaGet.mockResolvedValue(mockHealth);

    const result = await getHealth();

    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/sonos/health');
    expect(result).toEqual(mockHealth);
  });
});

describe('getDevices', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls haGet with /api/v1/sonos/devices', async () => {
    mockHaGet.mockResolvedValue([mockDevice]);

    const result = await getDevices();

    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/sonos/devices');
    expect(result).toEqual([mockDevice]);
  });
});

describe('getDevice', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls haGet with /api/v1/sonos/devices/{uid}', async () => {
    mockHaGet.mockResolvedValue(mockDeviceDetail);

    const result = await getDevice('RINCON_B8E9378A123401400');

    expect(mockHaGet).toHaveBeenCalledWith(
      '/api/v1/sonos/devices/RINCON_B8E9378A123401400'
    );
    expect(result).toEqual(mockDeviceDetail);
  });
});

describe('getZones', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls haGet with /api/v1/sonos/zones', async () => {
    mockHaGet.mockResolvedValue([mockZone]);

    const result = await getZones();

    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/sonos/zones');
    expect(result).toEqual([mockZone]);
  });
});
