/**
 * Tests for GET /api/v1/automations/[rule_id]
 * Tests for PATCH /api/v1/automations/[rule_id]
 * Tests for DELETE /api/v1/automations/[rule_id]
 */

jest.mock('@/lib/automations');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET, PATCH, DELETE } from '../route';
import { automationsProxy } from '@/lib/automations';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockAutomationsProxy = jest.mocked(automationsProxy);

const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
const mockContext = { params: Promise.resolve({ rule_id: 'rule-123' }) };

const mockRule = {
  id: 'rule-123',
  name: 'Test Rule',
  enabled: true,
  description: null,
  last_execution_at: null,
  created_at: '2026-01-01T00:00:00Z',
};

describe('GET /api/v1/automations/[rule_id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/automations/rule-123');

    const response = await GET(request as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with single rule data', async () => {
    mockAutomationsProxy.getAutomation.mockResolvedValue(mockRule);
    const request = new Request('http://localhost:3000/api/v1/automations/rule-123');

    const response = await GET(request as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('passes rule_id from context params to proxy', async () => {
    mockAutomationsProxy.getAutomation.mockResolvedValue(mockRule);
    const request = new Request('http://localhost:3000/api/v1/automations/rule-123');

    await GET(request as any, mockContext as any);

    expect(mockAutomationsProxy.getAutomation).toHaveBeenCalledWith('rule-123');
  });
});

describe('PATCH /api/v1/automations/[rule_id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/automations/rule-123', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with updated rule', async () => {
    const updatedRule = { ...mockRule, name: 'Updated' };
    mockAutomationsProxy.updateAutomation.mockResolvedValue(updatedRule);
    const request = new Request('http://localhost:3000/api/v1/automations/rule-123', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('passes rule_id and body to proxy', async () => {
    mockAutomationsProxy.updateAutomation.mockResolvedValue({ ...mockRule, name: 'Updated' });
    const request = new Request('http://localhost:3000/api/v1/automations/rule-123', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
      headers: { 'Content-Type': 'application/json' },
    });

    await PATCH(request as any, mockContext as any);

    expect(mockAutomationsProxy.updateAutomation).toHaveBeenCalledWith('rule-123', expect.any(Object));
  });
});

describe('DELETE /api/v1/automations/[rule_id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/automations/rule-123', {
      method: 'DELETE',
    });

    const response = await DELETE(request as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 204 No Content', async () => {
    mockAutomationsProxy.deleteAutomation.mockResolvedValue(undefined);
    const request = new Request('http://localhost:3000/api/v1/automations/rule-123', {
      method: 'DELETE',
    });

    const response = await DELETE(request as any, mockContext as any);

    expect(response.status).toBe(204);
  });

  it('passes rule_id to proxy', async () => {
    mockAutomationsProxy.deleteAutomation.mockResolvedValue(undefined);
    const request = new Request('http://localhost:3000/api/v1/automations/rule-123', {
      method: 'DELETE',
    });

    await DELETE(request as any, mockContext as any);

    expect(mockAutomationsProxy.deleteAutomation).toHaveBeenCalledWith('rule-123');
  });
});
