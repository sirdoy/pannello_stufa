/**
 * Tests for GET /api/v1/automations
 * Tests for POST /api/v1/automations
 */

jest.mock('@/lib/automations');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET, POST } from '../route';
import { automationsProxy } from '@/lib/automations';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockAutomationsProxy = jest.mocked(automationsProxy);

const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };

const mockRule = {
  id: 'rule-123',
  name: 'Test Rule',
  enabled: true,
  description: null,
  last_execution_at: null,
  created_at: '2026-01-01T00:00:00Z',
};

const mockPaginatedRules = {
  items: [mockRule],
  total_count: 1,
  limit: 20,
  offset: 0,
};

describe('GET /api/v1/automations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/automations');

    const response = await GET(request as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with paginated automations data when authenticated', async () => {
    mockAutomationsProxy.getAutomations.mockResolvedValue(mockPaginatedRules);
    const request = new Request('http://localhost:3000/api/v1/automations');

    const response = await GET(request as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.items).toEqual([mockRule]);
    expect(mockAutomationsProxy.getAutomations).toHaveBeenCalled();
  });

  it('passes limit and offset query params to proxy', async () => {
    mockAutomationsProxy.getAutomations.mockResolvedValue(mockPaginatedRules);
    const request = new Request('http://localhost:3000/api/v1/automations?limit=10&offset=5');

    await GET(request as any, {} as any);

    expect(mockAutomationsProxy.getAutomations).toHaveBeenCalledWith({ limit: 10, offset: 5 });
  });
});

describe('POST /api/v1/automations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/automations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Rule' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 201 when creating a rule', async () => {
    mockAutomationsProxy.createAutomation.mockResolvedValue(mockRule);
    const request = new Request('http://localhost:3000/api/v1/automations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Rule' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request as any, {} as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it('passes request body to proxy', async () => {
    mockAutomationsProxy.createAutomation.mockResolvedValue(mockRule);
    const request = new Request('http://localhost:3000/api/v1/automations', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Rule' }),
      headers: { 'Content-Type': 'application/json' },
    });

    await POST(request as any, {} as any);

    expect(mockAutomationsProxy.createAutomation).toHaveBeenCalledWith(expect.any(Object));
  });
});
