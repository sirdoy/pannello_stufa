/**
 * Tests for /api/v1/fritzbox/devices route behavior
 *
 * Verifies device retrieval and response shape.
 * Event detection logic was moved to HA proxy (no longer in this route).
 * Phase 93: Test Fix TFIX-08
 */

// Mock dependencies before imports
jest.mock('@/lib/fritzbox');
jest.mock('@/lib/auth/session', () => ({
  authSession: {
    getSession: jest.fn(),
  },
}));

import { GET } from '../devices/route';
import { fritzboxClient } from '@/lib/fritzbox';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockGetDevices = jest.mocked(fritzboxClient.getDevices);

describe('GET /api/v1/fritzbox/devices', () => {
  let mockRequest: Request;
  const mockSession = mockAppSession({ sub: 'auth0|123', email: 'test@test.com' });

  const mockDevices = [
    { id: 'AA:BB:CC:DD:EE:FF', mac: 'AA:BB:CC:DD:EE:FF', name: 'Device 1', ip: '192.168.1.100', active: true },
    { id: 'BB:CC:DD:EE:FF:00', mac: 'BB:CC:DD:EE:FF:00', name: 'Device 2', ip: '192.168.1.101', active: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/v1/fritzbox/devices');

    // Default: authenticated user
    mockGetSession.mockResolvedValue(mockSession);

    // Mock console to suppress output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('returns devices list on success', async () => {
    mockGetDevices.mockResolvedValue(mockDevices);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.devices).toEqual(mockDevices);
    expect(mockGetDevices).toHaveBeenCalledTimes(1);
  });

  test('returns empty array when no devices', async () => {
    mockGetDevices.mockResolvedValue([]);

    const response = await GET(asNextRequest(mockRequest), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.devices).toEqual([]);
  });
});
