/**
 * Tests for useRetryableCommand hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useRetryableCommand } from '../useRetryableCommand';
import { retryFetch, RetryError } from '@/lib/retry/retryClient';
import { deduplicationManager, createRequestKey } from '@/lib/retry/deduplicationManager';
import { idempotencyManager } from '@/lib/retry/idempotencyManager';
import { useToast } from '@/app/hooks/useToast';

// Polyfill Response for Node.js test environment
if (typeof Response === 'undefined') {
  global.Response = class Response {
    body: string;
    status: number;
    ok: boolean;

    constructor(body: string, init?: { status?: number }) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.ok = this.status >= 200 && this.status < 300;
    }

    async json() {
      return JSON.parse(this.body);
    }

    async text() {
      return this.body;
    }

    clone() {
      return new Response(this.body, { status: this.status });
    }
  } as typeof Response;
}

// Mock dependencies (but keep RetryError as real class)
jest.mock('@/lib/retry/retryClient', () => {
  const actual = jest.requireActual('@/lib/retry/retryClient');
  return {
    ...actual,
    retryFetch: jest.fn(),
  };
});
jest.mock('@/lib/retry/deduplicationManager');
jest.mock('@/lib/retry/idempotencyManager');
jest.mock('@/app/hooks/useToast');

const mockRetryFetch = retryFetch as jest.MockedFunction<typeof retryFetch>;
const mockDeduplicationManager = deduplicationManager as jest.Mocked<typeof deduplicationManager>;
const mockCreateRequestKey = createRequestKey as jest.MockedFunction<typeof createRequestKey>;
const mockIdempotencyManager = idempotencyManager as jest.Mocked<typeof idempotencyManager>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('useRetryableCommand', () => {
  const mockToast = jest.fn();
  const mockSuccess = jest.fn();
  const mockError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup toast mocks
    mockUseToast.mockReturnValue({
      toast: mockToast,
      success: mockSuccess,
      error: mockError,
      warning: jest.fn(),
      info: jest.fn(),
      dismiss: jest.fn(),
      dismissAll: jest.fn(),
    });

    // Default mock implementations
    mockCreateRequestKey.mockImplementation((device, action) => `${device}:${action}`);
    mockDeduplicationManager.isDuplicate.mockReturnValue(false);
    mockIdempotencyManager.registerKey.mockResolvedValue('test-idempotency-key-123');
  });

  describe('execute', () => {
    it('calls retryFetch with idempotency header', async () => {
      const { result } = renderHook(() =>
        useRetryableCommand({ device: 'stove', action: 'ignite' })
      );

      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
      });
      mockRetryFetch.mockResolvedValue(mockResponse);

      await act(async () => {
        await result.current.execute('/api/stove/ignite', {
          method: 'POST',
          body: JSON.stringify({ command: 'ignite' }),
        });
      });

      expect(mockIdempotencyManager.registerKey).toHaveBeenCalledWith(
        '/api/stove/ignite',
        { command: 'ignite' }
      );

      expect(mockRetryFetch).toHaveBeenCalledWith(
        '/api/stove/ignite',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ command: 'ignite' }),
          headers: expect.objectContaining({
            'Idempotency-Key': 'test-idempotency-key-123',
          }),
        })
      );
    });

    it('returns null when dedup blocks the request', async () => {
      mockDeduplicationManager.isDuplicate.mockReturnValue(true);

      const { result } = renderHook(() =>
        useRetryableCommand({ device: 'stove', action: 'ignite' })
      );

      let response: Response | null = null;
      await act(async () => {
        response = await result.current.execute('/api/stove/ignite');
      });

      expect(response).toBeNull();
      expect(mockCreateRequestKey).toHaveBeenCalledWith('stove', 'ignite');
      expect(mockRetryFetch).not.toHaveBeenCalled();
    });

    it('shows persistent error toast on failure', async () => {
      const { result } = renderHook(() =>
        useRetryableCommand({ device: 'stove', action: 'ignite' })
      );

      const retryError = new RetryError('Request failed after 3 attempts', 3, new Error('Network error'));
      mockRetryFetch.mockRejectedValue(retryError);

      await act(async () => {
        await result.current.execute('/api/stove/ignite');
      });

      await waitFor(() => {
        expect(mockError).toHaveBeenCalledWith(
          expect.stringContaining('Comando fallito'),
          expect.objectContaining({
            action: expect.objectContaining({
              label: 'Riprova',
              onClick: expect.any(Function),
            }),
          })
        );
      });

      expect(result.current.lastError).toBe(retryError);
    });

    it('shows success toast on recovery (after previous error)', async () => {
      const { result } = renderHook(() =>
        useRetryableCommand({ device: 'stove', action: 'ignite' })
      );

      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
      });

      // First request fails
      const retryError = new RetryError('Request failed after 3 attempts', 3, new Error('Network error'));
      mockRetryFetch.mockRejectedValueOnce(retryError);

      await act(async () => {
        await result.current.execute('/api/stove/ignite');
      });

      expect(result.current.lastError).toBe(retryError);

      // Second request succeeds
      mockRetryFetch.mockResolvedValueOnce(mockResponse);

      await act(async () => {
        await result.current.retry();
      });

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith('Comando eseguito con successo');
      });

      expect(result.current.lastError).toBeNull();
    });

    it('does not show success toast on first-try success', async () => {
      const { result } = renderHook(() =>
        useRetryableCommand({ device: 'stove', action: 'ignite' })
      );

      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
      });
      mockRetryFetch.mockResolvedValue(mockResponse);

      await act(async () => {
        await result.current.execute('/api/stove/ignite');
      });

      expect(mockSuccess).not.toHaveBeenCalled();
      expect(result.current.lastError).toBeNull();
    });

    it('clears dedup after completion', async () => {
      const { result } = renderHook(() =>
        useRetryableCommand({ device: 'stove', action: 'ignite' })
      );

      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
      });
      mockRetryFetch.mockResolvedValue(mockResponse);

      await act(async () => {
        await result.current.execute('/api/stove/ignite');
      });

      expect(mockDeduplicationManager.clear).toHaveBeenCalledWith('stove:ignite');
    });
  });

  describe('retry', () => {
    it('re-executes the last failed command', async () => {
      const { result } = renderHook(() =>
        useRetryableCommand({ device: 'stove', action: 'ignite' })
      );

      const retryError = new RetryError('Request failed after 3 attempts', 3, new Error('Network error'));
      mockRetryFetch.mockRejectedValueOnce(retryError);

      // First execution fails
      await act(async () => {
        await result.current.execute('/api/stove/ignite', {
          method: 'POST',
          body: JSON.stringify({ command: 'ignite' }),
        });
      });

      expect(result.current.lastError).toBe(retryError);

      // Retry succeeds
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
      });
      mockRetryFetch.mockResolvedValueOnce(mockResponse);

      await act(async () => {
        await result.current.retry();
      });

      expect(mockRetryFetch).toHaveBeenCalledTimes(2);
      expect(result.current.lastError).toBeNull();
    });
  });

  describe('clearError', () => {
    it('resets all error state', async () => {
      const { result } = renderHook(() =>
        useRetryableCommand({ device: 'stove', action: 'ignite' })
      );

      const retryError = new RetryError('Request failed after 3 attempts', 3, new Error('Network error'));
      mockRetryFetch.mockRejectedValue(retryError);

      await act(async () => {
        await result.current.execute('/api/stove/ignite');
      });

      expect(result.current.lastError).toBe(retryError);

      act(() => {
        result.current.clearError();
      });

      expect(result.current.lastError).toBeNull();
      expect(result.current.attemptCount).toBe(0);
      expect(result.current.isRetrying).toBe(false);
    });
  });

  describe('state management', () => {
    it('isExecuting is true during command execution', async () => {
      const { result } = renderHook(() =>
        useRetryableCommand({ device: 'stove', action: 'ignite' })
      );

      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
      });

      // Delay the response
      mockRetryFetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100))
      );

      let executePromise: Promise<Response | null>;
      act(() => {
        executePromise = result.current.execute('/api/stove/ignite');
      });

      // Should be executing
      expect(result.current.isExecuting).toBe(true);

      await act(async () => {
        await executePromise;
      });

      // Should be done
      expect(result.current.isExecuting).toBe(false);
    });

    it('tracks attempt count', async () => {
      const { result } = renderHook(() =>
        useRetryableCommand({ device: 'stove', action: 'ignite' })
      );

      const retryError = new RetryError('Request failed after 3 attempts', 3, new Error('Network error'));
      mockRetryFetch.mockRejectedValue(retryError);

      await act(async () => {
        await result.current.execute('/api/stove/ignite');
      });

      await waitFor(() => {
        expect(result.current.attemptCount).toBe(3);
      });
    });
  });
});
