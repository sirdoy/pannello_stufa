/**
 * Tests for PUT /api/v1/hue/groups/[groupId]/action
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/firebaseAdmin', () => ({ adminDbPush: jest.fn() }));
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { PUT } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';
import type { HueCommandResponse } from '@/types/hueProxy';

const mockGetSession = jest.mocked(authSession.getSession);
const mockSetGroupAction = jest.mocked(hueProxy.setGroupAction);

describe('PUT /api/v1/hue/groups/[groupId]/action', () => {
  const mockProxyResponse: HueCommandResponse = {
    group_id: '1',
    name: 'Living Room',
    type: 'Room',
    group_class: 'Living room',
    lights: ['1', '2'],
    any_on: true,
    all_on: true,
    brightness: 254,
    color_temp: null,
    colormode: null,
    data_confirmed: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request('http://localhost:3000/api/v1/hue/groups/1/action', {
      method: 'PUT',
      body: JSON.stringify({ on: true }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(asNextRequest(req), routeContext({ groupId: '1' }));

    expect(response.status).toBe(401);
  });

  it('should call setGroupAction and return 202', async () => {
    mockSetGroupAction.mockResolvedValue(mockProxyResponse);
    const req = new Request('http://localhost:3000/api/v1/hue/groups/1/action', {
      method: 'PUT',
      body: JSON.stringify({ on: true }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(asNextRequest(req), routeContext({ groupId: '1' }));
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.group_id).toBe('1');
    expect(data.data_confirmed).toBe(true);
    expect(mockSetGroupAction).toHaveBeenCalledWith('1', expect.any(Object));
  });
});
