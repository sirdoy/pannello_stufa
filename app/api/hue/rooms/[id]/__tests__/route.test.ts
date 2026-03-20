/**
 * Tests for GET /api/hue/rooms/[id]
 * Tests for PUT /api/hue/rooms/[id]
 */

jest.mock('@/lib/hue/hueProxy');
jest.mock('@/lib/firebaseAdmin', () => ({ adminDbPush: jest.fn() }));
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET, PUT } from '../route';
import * as hueProxy from '@/lib/hue/hueProxy';
import { auth0 } from '@/lib/auth0';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';

const mockGetSession = jest.mocked(auth0.getSession);
const mockGetGroup = jest.mocked(hueProxy.getGroup);
const mockSetGroupAction = jest.mocked(hueProxy.setGroupAction);
const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

describe('GET /api/hue/rooms/[id]', () => {
  let mockRequest: Request;
  let mockContext: { params: Promise<{ id: string }> };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new Request('http://localhost:3000/api/hue/rooms/1');
    mockContext = { params: Promise.resolve({ id: '1' }) };
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await GET(mockRequest as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('should return 200 with single group data', async () => {
    const mockData = {
      group_id: '1',
      name: 'Living Room',
      type: 'Room',
      group_class: 'Living room',
      lights: ['1', '2', '3'],
      any_on: true,
      all_on: false,
      brightness: 180,
      color_temp: 370,
      colormode: 'ct',
    };
    mockGetGroup.mockResolvedValue(mockData);

    const response = await GET(mockRequest as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetGroup).toHaveBeenCalledWith('1');
  });
});

describe('PUT /api/hue/rooms/[id]', () => {
  const mockProxyResponse = {
    command: 'set_group_action' as const,
    status: 'accepted' as const,
    group_id: '1',
    requested_state: { on: false },
    suggested_poll_delay_s: 2,
    poll_endpoint: '/api/v1/hue/groups/1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new Request('http://localhost:3000/api/hue/rooms/1', {
      method: 'PUT',
      body: JSON.stringify({ on: false }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(req as any, { params: Promise.resolve({ id: '1' }) } as any);
    expect(response.status).toBe(401);
  });

  it('should call setGroupAction and return 202', async () => {
    mockSetGroupAction.mockResolvedValue(mockProxyResponse);
    const req = new Request('http://localhost:3000/api/hue/rooms/1', {
      method: 'PUT',
      body: JSON.stringify({ on: false }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(req as any, { params: Promise.resolve({ id: '1' }) } as any);
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(data.command).toBe('set_group_action');
    expect(data.suggested_poll_delay_s).toBe(2);
    // setGroupAction called with group id and parsed body
    expect(mockSetGroupAction).toHaveBeenCalledWith('1', expect.any(Object));
  });
});
