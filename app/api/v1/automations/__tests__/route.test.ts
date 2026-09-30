/**
 * Tests for GET /api/v1/automations
 * Tests for POST /api/v1/automations
 */

jest.mock('@/lib/automations');
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));
jest.mock('@/lib/core/requestParser', () => ({
  ...jest.requireActual('@/lib/core/requestParser'),
  parseJson: jest.fn(),
}));

import { GET, POST } from '../route';
import { automationsProxy } from '@/lib/automations';
import { authSession } from '@/lib/auth/session';
import { parseJson } from '@/lib/core/requestParser';
import { asNextRequest, mockAppSession, routeContext } from '@/__tests__/__utils__/routeHelpers';

const mockGetSession = jest.mocked(authSession.getSession);
const mockAutomationsProxy = jest.mocked(automationsProxy);
const mockParseJson = jest.mocked(parseJson);


const mockRule = {
  id: 1,
  name: 'Test Rule',
  enabled: true,
  description: null,
  trigger: null,
  condition: { type: 'always_true' as const },
  actions: [{ type: 'log_event' as const, message: 'test' }],
  min_interval_seconds: 0,
  max_triggers_per_hour: 0,
  last_triggered_at: null,
  created_at: 1735689600,
  updated_at: 1735689600,
};

// Minimal body the backend accepts: condition + at least one action.
const validBody = {
  name: 'Test Rule',
  condition: { type: 'always_true' },
  actions: [{ type: 'log_event', message: 'test' }],
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
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/automations');

    const response = await GET(asNextRequest(request), routeContext());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 200 with paginated automations data when authenticated', async () => {
    mockAutomationsProxy.getAutomations.mockResolvedValue(mockPaginatedRules);
    const request = new Request('http://localhost:3000/api/v1/automations');

    const response = await GET(asNextRequest(request), routeContext());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.items).toEqual([mockRule]);
    expect(mockAutomationsProxy.getAutomations).toHaveBeenCalled();
  });

  it('passes limit and offset query params to proxy', async () => {
    mockAutomationsProxy.getAutomations.mockResolvedValue(mockPaginatedRules);
    const request = new Request('http://localhost:3000/api/v1/automations?limit=10&offset=5');

    await GET(asNextRequest(request), routeContext());

    expect(mockAutomationsProxy.getAutomations).toHaveBeenCalledWith({ limit: 10, offset: 5 });
  });
});

describe('POST /api/v1/automations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockAppSession());
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    // Default: parseJson returns a valid body for POST tests
    mockParseJson.mockResolvedValue(validBody);
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const request = new Request('http://localhost:3000/api/v1/automations', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(asNextRequest(request), routeContext());
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('returns 201 when creating a rule', async () => {
    mockAutomationsProxy.createAutomation.mockResolvedValue(mockRule);
    const request = new Request('http://localhost:3000/api/v1/automations', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(asNextRequest(request), routeContext());
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });

  it('passes request body to proxy', async () => {
    mockAutomationsProxy.createAutomation.mockResolvedValue(mockRule);
    const request = new Request('http://localhost:3000/api/v1/automations', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    await POST(asNextRequest(request), routeContext());

    expect(mockAutomationsProxy.createAutomation).toHaveBeenCalledWith(validBody);
  });

  it('returns 400 when body is missing required name field', async () => {
    mockParseJson.mockResolvedValue({ enabled: true });
    const request = new Request('http://localhost:3000/api/v1/automations', {
      method: 'POST',
      body: JSON.stringify({ enabled: true }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(asNextRequest(request), routeContext());

    expect(response.status).toBe(400);
  });

  // M3: body aligned with the backend AutomationRuleCreate model.
  it.each([
    ['condition missing', { name: 'R', actions: [{ type: 'log_event' }] }],
    ['condition not an object', { name: 'R', condition: 'x', actions: [{ type: 'log_event' }] }],
    ['condition without type', { name: 'R', condition: {}, actions: [{ type: 'log_event' }] }],
    ['actions missing', { name: 'R', condition: { type: 'always_true' } }],
    ['actions empty', { name: 'R', condition: { type: 'always_true' }, actions: [] }],
    ['action without type', { name: 'R', condition: { type: 'always_true' }, actions: [{}] }],
    ['bad active_hours_start', { ...validBody, active_hours_start: '7:00' }],
    ['bad active_hours_end', { ...validBody, active_hours_end: 'sera' }],
  ])('returns 400 without calling the backend when %s', async (_label, body) => {
    mockParseJson.mockResolvedValue(body);
    const request = new Request('http://localhost:3000/api/v1/automations', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(asNextRequest(request), routeContext());

    expect(response.status).toBe(400);
    expect(mockAutomationsProxy.createAutomation).not.toHaveBeenCalled();
  });

  // BL-02 (REVIEW iteration 2): the schema previously stripped trigger,
  // condition, actions, scheduling fields. Phase 180 editor relies on the
  // full body reaching automationsProxy.createAutomation.
  it('forwards full Phase 180 editor body (trigger/condition/actions/scheduling) to proxy', async () => {
    const fullBody = {
      name: 'Wake Up',
      description: 'Lights at 7am',
      enabled: true,
      trigger: { type: 'schedule_cron', cron_expression: '0 7 * * *' },
      condition: { type: 'always_true' },
      actions: [{ type: 'log_event', message: 'wake' }],
      min_interval_seconds: 60,
      max_triggers_per_hour: 10,
      active_hours_start: '06:00',
      active_hours_end: '09:00',
    };
    mockParseJson.mockResolvedValue(fullBody);
    mockAutomationsProxy.createAutomation.mockResolvedValue(mockRule);
    const request = new Request('http://localhost:3000/api/v1/automations', {
      method: 'POST',
      body: JSON.stringify(fullBody),
      headers: { 'Content-Type': 'application/json' },
    });

    await POST(asNextRequest(request), routeContext());

    expect(mockAutomationsProxy.createAutomation).toHaveBeenCalledWith(fullBody);
  });
});
