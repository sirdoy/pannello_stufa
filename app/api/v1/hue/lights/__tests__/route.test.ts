/**
 * Tests for GET /api/v1/hue/lights
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';
import type { HueLight, HueLightsListResponse } from '@/types/hueProxy';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetLights = jest.mocked(hueProxy.getLights);

describe('GET /api/v1/hue/lights', () => {
  const baseLight: HueLight = {
    light_id: '1',
    name: 'Desk Lamp',
    on: true,
    brightness: 254,
    ct_mirek: null,
    ct_kelvin: null,
    hue: null,
    saturation: null,
    colormode: null,
    reachable: true,
    capability_tier: 'color',
    room_id: null,
    room_name: null,
    model_id: null,
    light_type: 'Extended color light',
  };
  const mockLightsData: HueLight[] = [
    baseLight,
    {
      ...baseLight,
      light_id: '2',
      name: 'Ceiling',
      on: false,
      brightness: 0,
      capability_tier: 'ambiance',
      light_type: 'Color temperature light',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request('http://localhost:3000/api/v1/hue/lights');

    const response = await GET(asNextRequest(req), routeContext());

    expect(response.status).toBe(401);
  });

  it('should return 200 with lights array', async () => {
    // HA proxy wraps the array as `{ lights, count, is_stale, fetched_at }`;
    // route spreads the wrapper so the response is `{ success, lights, count, … }`.
    const payload: HueLightsListResponse = {
      lights: mockLightsData,
      count: mockLightsData.length,
      is_stale: false,
      fetched_at: '2026-03-19T08:51:32.123456Z',
      data_freshness: 'LIVE',
    };
    mockGetLights.mockResolvedValue(payload);
    const req = new Request('http://localhost:3000/api/v1/hue/lights');

    const response = await GET(asNextRequest(req), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.lights).toBeInstanceOf(Array);
    expect(data.lights).toHaveLength(2);
    expect(data.count).toBe(2);
    expect(mockGetLights).toHaveBeenCalled();
  });
});
