/**
 * Tests for Automations Proxy Client
 *
 * Tests cover:
 * - X-API-Key header sent on every request (via haGet/haPost/haPatch/haDelete transport)
 * - Correct URL paths for all 6 proxy functions
 * - Pagination query string construction for getAutomations and getExecutions
 * - PATCH method specifically for updateAutomation
 * - ApiError on missing env vars
 */

import { automationsProxy } from '@/lib/automations';
import { ApiError, ERROR_CODES } from '@/lib/core/apiErrors';
import type { AutomationRule, AutomationExecution } from '@/types/automations';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const TEST_PROXY_URL = 'https://proxy.example.com';
const TEST_API_KEY = 'test-api-key-12345';

const mockAutomationRule: AutomationRule = {
  id: 1,
  name: 'Test rule',
  description: null,
  enabled: true,
  trigger: null,
  condition: { type: 'always_true' },
  actions: [{ type: 'log_event', message: 'test' }],
  min_interval_seconds: 0,
  max_triggers_per_hour: 0,
  last_triggered_at: null,
  created_at: 1735689600,
  updated_at: 1735689600,
};

const mockPaginatedRules = {
  items: [mockAutomationRule],
  total_count: 1,
  limit: 20,
  offset: 0,
};

const mockExecution: AutomationExecution = {
  id: 1,
  rule_id: 1,
  status: 'success',
  triggered_at: 1735689600,
  trigger_source: 'auto',
  error_message: null,
};

const mockPaginatedExecutions = {
  items: [mockExecution],
  total_count: 1,
  limit: 20,
  offset: 0,
};

describe('automationsProxy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HA_API_URL = TEST_PROXY_URL;
    process.env.HA_API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    delete process.env.HA_API_URL;
    delete process.env.HA_API_KEY;
  });

  describe('getAutomations()', () => {
    it('calls GET /api/v1/automations without query params by default', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaginatedRules,
      });

      await automationsProxy.getAutomations();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${TEST_PROXY_URL}/api/v1/automations`);
      expect(options.method).toBeUndefined(); // GET has no method override
      expect((options.headers as Record<string, string>)['X-API-Key']).toBe(TEST_API_KEY);
    });

    it('appends limit and offset as query params when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaginatedRules,
      });

      await automationsProxy.getAutomations({ limit: 10, offset: 5 });

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${TEST_PROXY_URL}/api/v1/automations?limit=10&offset=5`);
    });
  });

  describe('createAutomation()', () => {
    it('POSTs to /api/v1/automations with the rule body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAutomationRule,
      });

      const createBody = {
        name: 'Test',
        condition: { type: 'always_true' as const },
        actions: [{ type: 'log_event' as const, message: 'test' }],
      };
      await automationsProxy.createAutomation(createBody);

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${TEST_PROXY_URL}/api/v1/automations`);
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body as string)).toEqual(createBody);
      expect((options.headers as Record<string, string>)['X-API-Key']).toBe(TEST_API_KEY);
      expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    });
  });

  describe('getAutomation()', () => {
    it('calls GET /api/v1/automations/{ruleId}', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAutomationRule,
      });

      await automationsProxy.getAutomation('abc');

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${TEST_PROXY_URL}/api/v1/automations/abc`);
      expect(options.method).toBeUndefined();
      expect((options.headers as Record<string, string>)['X-API-Key']).toBe(TEST_API_KEY);
    });
  });

  describe('updateAutomation()', () => {
    it('PATCHes /api/v1/automations/{ruleId} with updated body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockAutomationRule, name: 'Updated' }),
      });

      await automationsProxy.updateAutomation('abc', { name: 'Updated' });

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${TEST_PROXY_URL}/api/v1/automations/abc`);
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body as string)).toEqual({ name: 'Updated' });
      expect((options.headers as Record<string, string>)['X-API-Key']).toBe(TEST_API_KEY);
      expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    });
  });

  describe('deleteAutomation()', () => {
    it('sends DELETE to /api/v1/automations/{ruleId}', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await automationsProxy.deleteAutomation('abc');

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${TEST_PROXY_URL}/api/v1/automations/abc`);
      expect(options.method).toBe('DELETE');
      expect((options.headers as Record<string, string>)['X-API-Key']).toBe(TEST_API_KEY);
    });
  });

  describe('getExecutions()', () => {
    it('calls GET /api/v1/automations/{ruleId}/executions with limit and offset', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaginatedExecutions,
      });

      await automationsProxy.getExecutions('abc', { limit: 20, offset: 0 });

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${TEST_PROXY_URL}/api/v1/automations/abc/executions?limit=20&offset=0`);
      expect(options.method).toBeUndefined();
      expect((options.headers as Record<string, string>)['X-API-Key']).toBe(TEST_API_KEY);
    });

    it('calls GET /api/v1/automations/{ruleId}/executions without query if no params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaginatedExecutions,
      });

      await automationsProxy.getExecutions('abc');

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${TEST_PROXY_URL}/api/v1/automations/abc/executions`);
    });
  });

  describe('error handling', () => {
    it('throws ApiError when HA_API_URL is missing', async () => {
      delete process.env.HA_API_URL;

      let caught: ApiError | undefined;
      try {
        await automationsProxy.getAutomations();
      } catch (e) {
        caught = e as ApiError;
      }

      expect(caught).toBeInstanceOf(ApiError);
      expect(caught?.code).toBe(ERROR_CODES.EXTERNAL_API_ERROR);
      expect(caught?.message).toContain('HA_API_URL');
    });

    it('throws ApiError when HA_API_KEY is missing', async () => {
      delete process.env.HA_API_KEY;

      let caught: ApiError | undefined;
      try {
        await automationsProxy.getAutomations();
      } catch (e) {
        caught = e as ApiError;
      }

      expect(caught).toBeInstanceOf(ApiError);
      expect(caught?.code).toBe(ERROR_CODES.EXTERNAL_API_ERROR);
      expect(caught?.message).toContain('HA_API_KEY');
    });
  });
});
