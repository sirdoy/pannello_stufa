/**
 * Tests for GET /api/v1/automations/sensors
 */

jest.mock('@/lib/automations');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { GET } from '../route';
import { automationsProxy } from '@/lib/automations';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockAutomationsProxy = jest.mocked(automationsProxy);

const sensor = {
  sensor_id: 'netatmo:1:temperature',
  provider: 'netatmo',
  device_id: '1',
  device_name: 'Sala',
  room: null,
  metric: 'temperature',
  value: 19.5,
  value_type: 'number' as const,
  unit: '°C',
  options: null,
};

describe('GET /api/v1/automations/sensors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/automations/sensors');

    const response = await GET(asNextRequest(request), routeContext());

    expect(response.status).toBe(401);
    expect(mockAutomationsProxy.getSensors).not.toHaveBeenCalled();
  });

  it('returns the sensor list of the backend', async () => {
    mockAutomationsProxy.getSensors.mockResolvedValue({ sensors: [sensor] });
    const request = new Request('http://localhost:3000/api/v1/automations/sensors');

    const response = await GET(asNextRequest(request), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.sensors).toEqual([sensor]);
  });
});
