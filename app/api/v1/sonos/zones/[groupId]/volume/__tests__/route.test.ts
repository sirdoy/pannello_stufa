/**
 * Tests for PUT /api/v1/sonos/zones/[groupId]/volume
 */

jest.mock('@/lib/sonos/sonosProxy');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { PUT } from '../route';
import * as sonosProxy from '@/lib/sonos/sonosProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';
import type { SonosCommandOkResponse } from '@/types/sonosProxy';

const mockGetSession = jest.mocked(authSession.getSession);
const mockSetZoneVolume = jest.mocked(sonosProxy.setZoneVolume);
const mockContext = routeContext({ groupId: 'RINCON_123' });

const mockProxyResponse: SonosCommandOkResponse = { data_confirmed: true };

/** Build a mock request whose body is readable via parseJson (jsdom-safe). */
function makePutRequest(url: string, body: Record<string, unknown>) {
  return asNextRequest({
    headers: { get: (name: string) => name === 'content-type' ? 'application/json' : null },
    text: async () => JSON.stringify(body),
    nextUrl: { searchParams: new URLSearchParams() },
  });
}

describe('PUT /api/v1/sonos/zones/[groupId]/volume', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = makePutRequest('http://localhost:3000/api/v1/sonos/zones/RINCON_123/volume', { volume: 50 });

    const response = await PUT(req, mockContext);
    expect(response.status).toBe(401);
  });

  it('should call setZoneVolume with groupId and volume and return 202', async () => {
    mockSetZoneVolume.mockResolvedValue(mockProxyResponse);
    const req = makePutRequest('http://localhost:3000/api/v1/sonos/zones/RINCON_123/volume', { volume: 50 });

    const response = await PUT(req, mockContext);
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.suggested_poll_delay_s).toBe(1);
    expect(mockSetZoneVolume).toHaveBeenCalledWith('RINCON_123', 50);
  });
});
