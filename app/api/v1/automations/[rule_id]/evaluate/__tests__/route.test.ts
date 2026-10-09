/**
 * Tests for POST /api/v1/automations/[rule_id]/evaluate
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

const mockEvaluate = {
  rule_id: 7,
  matched: false,
  trace: {
    type: 'and',
    matched: false,
    detail: null,
    children: [
      { type: 'time_window', matched: true, detail: '22:00 <= 22:30 < 06:00', children: [] },
    ],
  },
};

function request() {
  return asNextRequest(
    new Request('http://localhost:3000/api/v1/automations/7/evaluate', { method: 'POST' }),
  );
}

describe('POST /api/v1/automations/[rule_id]/evaluate', () => {
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
    expect(mockAutomationsProxy.evaluateAutomation).not.toHaveBeenCalled();
  });

  it('evaluates the rule and returns the trace', async () => {
    mockAutomationsProxy.evaluateAutomation.mockResolvedValue(mockEvaluate);

    const response = await POST(request(), mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockAutomationsProxy.evaluateAutomation).toHaveBeenCalledWith('7');
    expect(data.matched).toBe(false);
    expect(data.trace).toEqual(mockEvaluate.trace);
  });
});
