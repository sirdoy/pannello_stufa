/**
 * Tests for GET /api/v1/automations/[rule_id]/executions
 */

jest.mock('@/lib/automations');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));

import { GET } from '../route';
import { automationsProxy } from '@/lib/automations';
import { auth0 } from '@/lib/auth0';

const mockGetSession = jest.mocked(auth0.getSession);
const mockAutomationsProxy = jest.mocked(automationsProxy);

const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
const mockContext = { params: Promise.resolve({ rule_id: 'rule-123' }) };

const mockExecution = {
  id: 'exec-001',
  rule_id: 'rule-123',
  status: 'success' as const,
  started_at: '2026-01-01T10:00:00Z',
  duration_ms: 150,
  error_message: null,
};

const mockPaginatedExecutions = {
  items: [mockExecution],
  total_count: 1,
  limit: 20,
  offset: 0,
};

describe('GET /api/v1/automations/[rule_id]/executions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/automations/rule-123/executions');

    const response = await GET(request as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with paginated execution history', async () => {
    mockAutomationsProxy.getExecutions.mockResolvedValue(mockPaginatedExecutions);
    const request = new Request('http://localhost:3000/api/v1/automations/rule-123/executions');

    const response = await GET(request as any, mockContext as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.items).toEqual([mockExecution]);
  });

  it('passes rule_id and pagination params to proxy', async () => {
    mockAutomationsProxy.getExecutions.mockResolvedValue(mockPaginatedExecutions);
    const request = new Request('http://localhost:3000/api/v1/automations/rule-123/executions?limit=20&offset=0');

    await GET(request as any, mockContext as any);

    expect(mockAutomationsProxy.getExecutions).toHaveBeenCalledWith('rule-123', { limit: 20, offset: 0 });
  });
});
