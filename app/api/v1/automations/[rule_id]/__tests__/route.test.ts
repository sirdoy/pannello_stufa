/**
 * Tests for GET /api/v1/automations/[rule_id]
 * Tests for PATCH /api/v1/automations/[rule_id]
 * Tests for DELETE /api/v1/automations/[rule_id]
 */

jest.mock('@/lib/automations');
jest.mock('@/lib/auth0', () => ({
  auth0: { getSession: jest.fn() },
}));
jest.mock('@/lib/core/requestParser', () => ({
  ...jest.requireActual('@/lib/core/requestParser'),
  parseJson: jest.fn(),
}));

import { GET, PATCH, DELETE } from '../route';
import { automationsProxy } from '@/lib/automations';
import { auth0 } from '@/lib/auth0';
import { parseJson } from '@/lib/core/requestParser';

const mockGetSession = jest.mocked(auth0.getSession);
const mockAutomationsProxy = jest.mocked(automationsProxy);
const mockParseJson = jest.mocked(parseJson);

const mockSession = { user: { sub: 'auth0|123', email: 'test@test.com' } };
const mockContext = { params: Promise.resolve({ rule_id: 'rule-123' }) };

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
    // Default: parseJson returns { name: 'Updated' } — matches the existing
    // PATCH test fixtures so legacy tests stay green.
    mockParseJson.mockResolvedValue({ name: 'Updated' } as any);
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

  // BL-03 (REVIEW iteration 2): the route now Zod-validates the PATCH body
  // and uses .strict() so AutomationRulePatch's no-trigger invariant (D-12)
  // is enforced at the API boundary — clients cannot smuggle arbitrary keys
  // through to the HA backend.
  it('returns 400 when body contains a trigger field (strict mode rejects)', async () => {
    mockParseJson.mockResolvedValue({
      name: 'Updated',
      trigger: { type: 'schedule_cron', cron_expression: '0 0 * * *' },
    } as any);
    const request = new Request('http://localhost:3000/api/v1/automations/rule-123', {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request as any, mockContext as any);

    expect(response.status).toBe(400);
    expect(mockAutomationsProxy.updateAutomation).not.toHaveBeenCalled();
  });

  it('returns 400 when body contains an unknown key (strict mode rejects)', async () => {
    mockParseJson.mockResolvedValue({ name: 'Updated', smuggled_field: 'evil' } as any);
    const request = new Request('http://localhost:3000/api/v1/automations/rule-123', {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request as any, mockContext as any);

    expect(response.status).toBe(400);
    expect(mockAutomationsProxy.updateAutomation).not.toHaveBeenCalled();
  });

  it('accepts the full AutomationRulePatch shape (no trigger)', async () => {
    const validPatch = {
      name: 'Updated',
      description: 'New desc',
      enabled: false,
      condition: { type: 'always_true' },
      actions: [{ type: 'log_event', message: 'updated' }],
      min_interval_seconds: 30,
      max_triggers_per_hour: 5,
      active_hours_start: '08:00',
      active_hours_end: '20:00',
    };
    mockParseJson.mockResolvedValue(validPatch as any);
    mockAutomationsProxy.updateAutomation.mockResolvedValue({ ...mockRule, name: 'Updated' });
    const request = new Request('http://localhost:3000/api/v1/automations/rule-123', {
      method: 'PATCH',
      body: JSON.stringify(validPatch),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request as any, mockContext as any);

    expect(response.status).toBe(200);
    expect(mockAutomationsProxy.updateAutomation).toHaveBeenCalledWith('rule-123', validPatch);
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
