/**
 * Tests for POST /api/v1/automations/[rule_id]/trigger
 */

jest.mock('@/lib/automations');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));

import { POST } from '../route';
import { automationsProxy } from '@/lib/automations';
import { authSession } from '@/lib/auth/session';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockAutomationsProxy = jest.mocked(automationsProxy);

const mockContext = routeContext({ rule_id: '7' });

const mockTrigger = {
  execution_id: 128,
  rule_id: 7,
  trigger_source: 'manual' as const,
  status: 'partial_failure' as const,
  triggered_at: 1771200000,
  triggered_by: 'nextjs-frontend',
  action_results: [
    { index: 0, action_type: 'hue_light', success: true, error: null },
    { index: 1, action_type: 'http_webhook', success: false, error: 'HTTPError: 500' },
  ],
};

function request() {
  return asNextRequest(
    new Request('http://localhost:3000/api/v1/automations/7/trigger', { method: 'POST' }),
  );
}

describe('POST /api/v1/automations/[rule_id]/trigger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await POST(request(), mockContext);

    expect(response.status).toBe(401);
    expect(mockAutomationsProxy.triggerAutomation).not.toHaveBeenCalled();
  });

  it('triggers the rule and returns the per-action results', async () => {
    mockAutomationsProxy.triggerAutomation.mockResolvedValue(mockTrigger);

    const response = await POST(request(), mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockAutomationsProxy.triggerAutomation).toHaveBeenCalledWith('7');
    expect(data.status).toBe('partial_failure');
    expect(data.action_results).toEqual(mockTrigger.action_results);
  });
});
