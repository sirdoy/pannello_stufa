/**
 * Unit tests for Sonos proxy client wrappers.
 * Verifies each function calls haGet with the correct HA endpoint path.
 */

jest.mock('@/lib/haClient');

import { haGet, haPost, haPut } from '@/lib/haClient';
import {
  getHealth,
  getDevices,
  getDevice,
  getZones,
  getEq,
  setEq,
  getPlayMode,
  setPlayMode,
  getQueue,
  getHomeTheater,
  setHomeTheater,
  switchSource,
  join,
  unjoin,
  getSleepTimer,
  setSleepTimer,
  getHistory,
} from '../sonosProxy';
import type {
  SonosHealthResponse,
  SonosDeviceResponse,
  SonosDeviceDetailResponse,
  SonosZoneResponse,
  SonosEqResponse,
  SonosPlayModeResponse,
  SonosQueueResponse,
  SonosHomeTheaterResponse,
  SonosSleepTimerResponse,
  SonosHistoryResponse,
  SonosCommandOkResponse,
} from '@/types/sonosProxy';

const mockHaGet = jest.mocked(haGet);
const mockHaPost = jest.mocked(haPost);
const mockHaPut = jest.mocked(haPut);

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

// Phase 128 fixtures
const mockEq: SonosEqResponse = {
  uid: 'RINCON_B8E9378A123401400',
  bass: 0,
  treble: 0,
  loudness: false,
};

const mockPlayMode: SonosPlayModeResponse = {
  group_id: 'RINCON_B8E9378A123401400',
  play_mode: 'NORMAL',
};

const mockQueue: SonosQueueResponse = {
  group_id: 'RINCON_B8E9378A123401400',
  items: [],
  total: 0,
  limit: 50,
  offset: 0,
};

const mockHomeTheater: SonosHomeTheaterResponse = {
  uid: 'RINCON_B8E9378A123401400',
  night_mode: false,
  dialog_mode: false,
  sub_enabled: true,
  sub_gain: 0,
  surround_enabled: true,
  surround_volume_tv: 0,
  surround_volume_music: 0,
};

const mockSleepTimer: SonosSleepTimerResponse = {
  group_id: 'RINCON_B8E9378A123401400',
  remaining_seconds: null,
};

const mockHistory: SonosHistoryResponse = {
  items: [],
  total: 0,
  granularity: 'hourly',
  limit: 100,
  offset: 0,
};

const mockCommandOk: SonosCommandOkResponse = { status: 'ok' };

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

// ---------------------------------------------------------------------------
// Phase 128 — Extended control read wrappers
// ---------------------------------------------------------------------------

describe('getEq', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls haGet with /api/v1/sonos/speakers/{uid}/eq', async () => {
    mockHaGet.mockResolvedValue(mockEq);

    const result = await getEq('RINCON_B8E9378A123401400');

    expect(mockHaGet).toHaveBeenCalledWith(
      '/api/v1/sonos/speakers/RINCON_B8E9378A123401400/eq'
    );
    expect(result).toEqual(mockEq);
  });
});

describe('getPlayMode', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls haGet with /api/v1/sonos/zones/{groupId}/play-mode', async () => {
    mockHaGet.mockResolvedValue(mockPlayMode);

    const result = await getPlayMode('RINCON_B8E9378A123401400');

    expect(mockHaGet).toHaveBeenCalledWith(
      '/api/v1/sonos/zones/RINCON_B8E9378A123401400/play-mode'
    );
    expect(result).toEqual(mockPlayMode);
  });
});

describe('getQueue', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls haGet with /api/v1/sonos/zones/{groupId}/queue (no params)', async () => {
    mockHaGet.mockResolvedValue(mockQueue);

    const result = await getQueue('RINCON_B8E9378A123401400');

    expect(mockHaGet).toHaveBeenCalledWith(
      '/api/v1/sonos/zones/RINCON_B8E9378A123401400/queue'
    );
    expect(result).toEqual(mockQueue);
  });

  it('calls haGet with query params when limit and offset provided', async () => {
    mockHaGet.mockResolvedValue(mockQueue);

    const result = await getQueue('RINCON_B8E9378A123401400', '10', '5');

    expect(mockHaGet).toHaveBeenCalledWith(
      '/api/v1/sonos/zones/RINCON_B8E9378A123401400/queue?limit=10&offset=5'
    );
    expect(result).toEqual(mockQueue);
  });
});

describe('getHomeTheater', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls haGet with /api/v1/sonos/speakers/{uid}/home-theater', async () => {
    mockHaGet.mockResolvedValue(mockHomeTheater);

    const result = await getHomeTheater('RINCON_B8E9378A123401400');

    expect(mockHaGet).toHaveBeenCalledWith(
      '/api/v1/sonos/speakers/RINCON_B8E9378A123401400/home-theater'
    );
    expect(result).toEqual(mockHomeTheater);
  });
});

describe('getSleepTimer', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls haGet with /api/v1/sonos/zones/{groupId}/sleep-timer', async () => {
    mockHaGet.mockResolvedValue(mockSleepTimer);

    const result = await getSleepTimer('RINCON_B8E9378A123401400');

    expect(mockHaGet).toHaveBeenCalledWith(
      '/api/v1/sonos/zones/RINCON_B8E9378A123401400/sleep-timer'
    );
    expect(result).toEqual(mockSleepTimer);
  });
});

describe('getHistory', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls haGet with all query params', async () => {
    mockHaGet.mockResolvedValue(mockHistory);

    const result = await getHistory({
      type: 'volume',
      speaker_uid: 'RINCON_B8E9378A123401400',
      start: '2026-03-01',
      end: '2026-03-24',
      limit: '50',
      offset: '0',
    });

    expect(mockHaGet).toHaveBeenCalledWith(
      '/api/v1/sonos/history?type=volume&speaker_uid=RINCON_B8E9378A123401400&start=2026-03-01&end=2026-03-24&limit=50&offset=0'
    );
    expect(result).toEqual(mockHistory);
  });

  it('calls haGet with only provided params (type only)', async () => {
    mockHaGet.mockResolvedValue(mockHistory);

    const result = await getHistory({ type: 'playback' });

    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/sonos/history?type=playback');
    expect(result).toEqual(mockHistory);
  });
});

// ---------------------------------------------------------------------------
// Phase 128 — Extended control mutation wrappers (haPut)
// ---------------------------------------------------------------------------

describe('setEq', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls haPut with /api/v1/sonos/speakers/{uid}/eq and body', async () => {
    mockHaPut.mockResolvedValue(mockCommandOk);

    const result = await setEq('RINCON_B8E9378A123401400', { bass: 5 });

    expect(mockHaPut).toHaveBeenCalledWith(
      '/api/v1/sonos/speakers/RINCON_B8E9378A123401400/eq',
      { bass: 5 }
    );
    expect(result).toEqual(mockCommandOk);
  });
});

describe('setPlayMode', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls haPut with /api/v1/sonos/zones/{groupId}/play-mode and body', async () => {
    mockHaPut.mockResolvedValue(mockCommandOk);

    const result = await setPlayMode('RINCON_B8E9378A123401400', { mode: 'SHUFFLE' });

    expect(mockHaPut).toHaveBeenCalledWith(
      '/api/v1/sonos/zones/RINCON_B8E9378A123401400/play-mode',
      { mode: 'SHUFFLE' }
    );
    expect(result).toEqual(mockCommandOk);
  });
});

describe('setHomeTheater', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls haPut with /api/v1/sonos/speakers/{uid}/home-theater and body', async () => {
    mockHaPut.mockResolvedValue(mockCommandOk);

    const result = await setHomeTheater('RINCON_B8E9378A123401400', { night_mode: true });

    expect(mockHaPut).toHaveBeenCalledWith(
      '/api/v1/sonos/speakers/RINCON_B8E9378A123401400/home-theater',
      { night_mode: true }
    );
    expect(result).toEqual(mockCommandOk);
  });
});

describe('setSleepTimer', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls haPut with /api/v1/sonos/zones/{groupId}/sleep-timer and body', async () => {
    mockHaPut.mockResolvedValue(mockCommandOk);

    const result = await setSleepTimer('RINCON_B8E9378A123401400', { duration: 3600 });

    expect(mockHaPut).toHaveBeenCalledWith(
      '/api/v1/sonos/zones/RINCON_B8E9378A123401400/sleep-timer',
      { duration: 3600 }
    );
    expect(result).toEqual(mockCommandOk);
  });
});

// ---------------------------------------------------------------------------
// Phase 128 — Extended control action wrappers (haPost)
// ---------------------------------------------------------------------------

describe('switchSource', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls haPost with /api/v1/sonos/speakers/{uid}/source and body', async () => {
    mockHaPost.mockResolvedValue(mockCommandOk);

    const result = await switchSource('RINCON_B8E9378A123401400', 'tv');

    expect(mockHaPost).toHaveBeenCalledWith(
      '/api/v1/sonos/speakers/RINCON_B8E9378A123401400/source',
      { source: 'tv' }
    );
    expect(result).toEqual(mockCommandOk);
  });
});

describe('join', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls haPost with /api/v1/sonos/speakers/{uid}/join and target_uid body', async () => {
    mockHaPost.mockResolvedValue(mockCommandOk);

    const result = await join('RINCON_B8E9378A123401400', 'RINCON_000000000002');

    expect(mockHaPost).toHaveBeenCalledWith(
      '/api/v1/sonos/speakers/RINCON_B8E9378A123401400/join',
      { target_uid: 'RINCON_000000000002' }
    );
    expect(result).toEqual(mockCommandOk);
  });
});

describe('unjoin', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls haPost with /api/v1/sonos/speakers/{uid}/unjoin and empty body', async () => {
    mockHaPost.mockResolvedValue(mockCommandOk);

    const result = await unjoin('RINCON_B8E9378A123401400');

    expect(mockHaPost).toHaveBeenCalledWith(
      '/api/v1/sonos/speakers/RINCON_B8E9378A123401400/unjoin',
      {}
    );
    expect(result).toEqual(mockCommandOk);
  });
});
