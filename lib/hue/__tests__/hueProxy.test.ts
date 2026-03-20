/**
 * Unit tests for Hue proxy client wrappers.
 * Verifies each function calls haGet with the correct path and returns typed data.
 */

jest.mock('@/lib/haClient');

import { haGet } from '@/lib/haClient';
import {
  getLights,
  getLight,
  getGroups,
  getGroup,
  getScenes,
  getHealth,
  getHistory,
} from '../hueProxy';
import type { HueLight, HueGroup, HueScene, HueBridgeHealth, HueHistoryResponse } from '@/types/hueProxy';

const mockHaGet = jest.mocked(haGet);

// ---------------------------------------------------------------------------
// Shared fixture data
// ---------------------------------------------------------------------------

const mockLight: HueLight = {
  light_id: '1',
  name: 'Bedside Lamp',
  on: true,
  brightness: 200,
  ct_mirek: 370,
  ct_kelvin: 2703,
  hue: null,
  saturation: null,
  colormode: 'ct',
  reachable: true,
  capability_tier: 'ambiance',
  room_id: '2',
  room_name: 'Bedroom',
  model_id: 'LTC001',
  light_type: 'Color temperature light',
};

const mockGroup: HueGroup = {
  group_id: '1',
  name: 'Living Room',
  type: 'Room',
  group_class: 'Living room',
  lights: ['5', '6', '7'],
  any_on: true,
  all_on: false,
  brightness: 200,
  color_temp: 370,
  colormode: 'ct',
};

const mockScene: HueScene = {
  scene_id: 'Ab1Cd2Ef3G',
  name: 'Relax',
  group_id: '1',
  group_name: 'Living Room',
  lights: ['5', '6', '7'],
  type: 'GroupScene',
};

const mockHealth: HueBridgeHealth = {
  connected: true,
  firmware_version: '1.60.1960144080',
  api_version: '1.60.0',
  light_count: 8,
  data_freshness: 'LIVE',
  last_poll_at: '2026-03-19T08:51:32+00:00',
  last_success_at: '2026-03-19T08:51:32+00:00',
};

const mockHistoryResponse: HueHistoryResponse = {
  items: [
    {
      timestamp: 1773780000,
      light_id: '1',
      granularity: 'raw',
      light_name: 'Bedside Lamp',
      on_state: 1,
      brightness: 200,
      color_temp: 370,
      hue: null,
      saturation: null,
      colormode: 'ct',
      reachable: 1,
      avg_brightness: null,
      min_brightness: null,
      max_brightness: null,
      on_minutes: null,
      sample_count: null,
    },
  ],
  total: 2880,
  page: 1,
  page_size: 100,
  granularity: 'raw',
  from: 1773693600,
  to: 1773780000,
};

// ---------------------------------------------------------------------------

describe('getLights', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls haGet with /api/v1/hue/lights', async () => {
    mockHaGet.mockResolvedValue([mockLight]);

    const result = await getLights();

    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/hue/lights');
    expect(result).toEqual([mockLight]);
  });
});

describe('getLight', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls haGet with /api/v1/hue/lights/{lightId}', async () => {
    mockHaGet.mockResolvedValue(mockLight);

    const result = await getLight('5');

    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/hue/lights/5');
    expect(result).toEqual(mockLight);
  });
});

describe('getGroups', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls haGet with /api/v1/hue/groups', async () => {
    mockHaGet.mockResolvedValue([mockGroup]);

    const result = await getGroups();

    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/hue/groups');
    expect(result).toEqual([mockGroup]);
  });
});

describe('getGroup', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls haGet with /api/v1/hue/groups/{groupId}', async () => {
    mockHaGet.mockResolvedValue(mockGroup);

    const result = await getGroup('2');

    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/hue/groups/2');
    expect(result).toEqual(mockGroup);
  });
});

describe('getScenes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls haGet with /api/v1/hue/scenes when no groupId given', async () => {
    mockHaGet.mockResolvedValue([mockScene]);

    const result = await getScenes();

    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/hue/scenes');
    expect(result).toEqual([mockScene]);
  });

  it('calls haGet with /api/v1/hue/scenes?group_id={groupId} when groupId given', async () => {
    mockHaGet.mockResolvedValue([mockScene]);

    const result = await getScenes('1');

    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/hue/scenes?group_id=1');
    expect(result).toEqual([mockScene]);
  });
});

describe('getHealth', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls haGet with /api/v1/hue/health', async () => {
    mockHaGet.mockResolvedValue(mockHealth);

    const result = await getHealth();

    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/hue/health');
    expect(result).toEqual(mockHealth);
  });
});

describe('getHistory', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls haGet with /api/v1/hue/history when no params given', async () => {
    mockHaGet.mockResolvedValue(mockHistoryResponse);

    const result = await getHistory();

    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/hue/history');
    expect(result).toEqual(mockHistoryResponse);
  });

  it('calls haGet with /api/v1/hue/history?{params} when params given', async () => {
    mockHaGet.mockResolvedValue(mockHistoryResponse);

    const params = new URLSearchParams('from=1000&to=2000');
    const result = await getHistory(params);

    expect(mockHaGet).toHaveBeenCalledWith('/api/v1/hue/history?from=1000&to=2000');
    expect(result).toEqual(mockHistoryResponse);
  });
});
