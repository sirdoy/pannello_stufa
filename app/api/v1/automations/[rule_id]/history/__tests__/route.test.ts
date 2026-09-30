/**
 * Tests for GET /api/v1/automations/[rule_id]/history
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

const mockContext = routeContext({ rule_id: 'rule-123' });

const mockExecution = {
  id: 1,
  rule_id: 1,
  status: 'success' as const,
  triggered_at: 1735689600,
  trigger_source: 'auto' as const,
  error_message: null,
};

const mockPaginatedExecutions = {
  items: [mockExecution],
  total_count: 1,
  limit: 20,
  offset: 0,
};

describe('GET /api/v1/automations/[rule_id]/history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/automations/rule-123/history');

    const response = await GET(asNextRequest(request), mockContext);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with paginated execution history', async () => {
    mockAutomationsProxy.getExecutions.mockResolvedValue(mockPaginatedExecutions);
    const request = new Request('http://localhost:3000/api/v1/automations/rule-123/history');

    const response = await GET(asNextRequest(request), mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.items).toEqual([mockExecution]);
  });

  it('passes rule_id and pagination params to proxy', async () => {
    mockAutomationsProxy.getExecutions.mockResolvedValue(mockPaginatedExecutions);
    const request = new Request('http://localhost:3000/api/v1/automations/rule-123/history?limit=20&offset=0');

    await GET(asNextRequest(request), mockContext);

    expect(mockAutomationsProxy.getExecutions).toHaveBeenCalledWith('rule-123', { limit: 20, offset: 0 });
  });
});
