/**
 * Unit tests for useWebSocketManager — covers WS-01 through WS-05
 *
 * Uses the __mocks__/react-use-websocket.ts shared mock to control
 * sendJsonMessage, readyState, lastMessage, and onOpen.
 */

import { renderHook, act } from '@testing-library/react';
import useWebSocket from 'react-use-websocket';

const { __mockHelpers, ReadyState } = jest.requireMock<typeof import('../../__mocks__/react-use-websocket')>('react-use-websocket');
import { useWebSocketManager } from '@/lib/hooks/useWebSocketManager';

jest.mock('react-use-websocket');

const TEST_URL = 'wss://ha.local/ws/live?api_key=test';

beforeEach(() => {
  __mockHelpers.reset();
});

// ---------------------------------------------------------------------------
// WS-01 — Single connection
// ---------------------------------------------------------------------------

describe('WS-01: Single connection', () => {
  it('calls useWebSocket with the provided URL', () => {
    renderHook(() => useWebSocketManager(TEST_URL));

    expect(useWebSocket).toHaveBeenCalled();
    expect((useWebSocket as jest.Mock).mock.calls[0]![0]).toBe(TEST_URL);
  });

  it('passes reconnection options (shouldReconnect, reconnectAttempts, reconnectInterval)', () => {
    renderHook(() => useWebSocketManager(TEST_URL));

    const options = (useWebSocket as jest.Mock).mock.calls[0]?.[1] as Record<string, unknown>;
    expect(typeof options['shouldReconnect']).toBe('function');
    expect(options['reconnectAttempts']).toBeDefined();
    expect(typeof options['reconnectInterval']).toBe('function');
  });

  it('passes connect=true when URL is provided', () => {
    renderHook(() => useWebSocketManager(TEST_URL));

    const connectArg = (useWebSocket as jest.Mock).mock.calls[0]?.[2];
    expect(connectArg).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// WS-01 (null URL) — Null URL disables connection
// ---------------------------------------------------------------------------

describe('Null URL disables connection', () => {
  it('calls useWebSocket with null as first arg', () => {
    renderHook(() => useWebSocketManager(null));

    expect(useWebSocket).toHaveBeenCalled();
    expect((useWebSocket as jest.Mock).mock.calls[0]![0]).toBeNull();
  });

  it('passes false as third arg when URL is null', () => {
    renderHook(() => useWebSocketManager(null));

    const connectArg = (useWebSocket as jest.Mock).mock.calls[0]?.[2];
    expect(connectArg).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// WS-02 — Subscribe sends message
// ---------------------------------------------------------------------------

describe('WS-02: Subscribe sends subscribe message', () => {
  it('sends { action: "subscribe", topic } when subscribing to a topic', () => {
    const { result } = renderHook(() => useWebSocketManager(TEST_URL));
    const sendJsonMessage = __mockHelpers.getSendJsonMessage();

    const callback = jest.fn();
    act(() => {
      result.current.subscribe('fritzbox', callback);
    });

    expect(sendJsonMessage).toHaveBeenCalledWith({ action: 'subscribe', topic: 'fritzbox' });
  });

  it('does not send subscribe message when connection is not OPEN', () => {
    __mockHelpers.setReadyState(ReadyState.CONNECTING);
    __mockHelpers.reset();
    __mockHelpers.setReadyState(ReadyState.CONNECTING);

    const { result } = renderHook(() => useWebSocketManager(TEST_URL));
    const sendJsonMessage = __mockHelpers.getSendJsonMessage();

    const callback = jest.fn();
    act(() => {
      result.current.subscribe('hue', callback);
    });

    expect(sendJsonMessage).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// WS-02 — Unsubscribe sends message only when last callback removed
// ---------------------------------------------------------------------------

describe('WS-02: Unsubscribe sends message only when last callback is removed', () => {
  it('does NOT send unsubscribe when there are still active callbacks', () => {
    const { result } = renderHook(() => useWebSocketManager(TEST_URL));
    const sendJsonMessage = __mockHelpers.getSendJsonMessage();

    const callback1 = jest.fn();
    const callback2 = jest.fn();
    act(() => {
      result.current.subscribe('fritzbox', callback1);
      result.current.subscribe('fritzbox', callback2);
    });
    sendJsonMessage.mockClear();

    act(() => {
      result.current.unsubscribe('fritzbox', callback1);
    });

    expect(sendJsonMessage).not.toHaveBeenCalledWith({ action: 'unsubscribe', topic: 'fritzbox' });
  });

  it('sends { action: "unsubscribe", topic } when last callback is removed', () => {
    const { result } = renderHook(() => useWebSocketManager(TEST_URL));
    const sendJsonMessage = __mockHelpers.getSendJsonMessage();

    const callback1 = jest.fn();
    const callback2 = jest.fn();
    act(() => {
      result.current.subscribe('fritzbox', callback1);
      result.current.subscribe('fritzbox', callback2);
    });
    sendJsonMessage.mockClear();

    act(() => {
      result.current.unsubscribe('fritzbox', callback1);
      result.current.unsubscribe('fritzbox', callback2);
    });

    expect(sendJsonMessage).toHaveBeenCalledWith({ action: 'unsubscribe', topic: 'fritzbox' });
  });
});

// ---------------------------------------------------------------------------
// WS-03 — Dispatch by topic
// ---------------------------------------------------------------------------

describe('WS-03: Dispatch routes message to correct topic callback', () => {
  it('calls fritzbox callback and not hue callback when fritzbox message arrives', () => {
    const { result, rerender } = renderHook(() => useWebSocketManager(TEST_URL));

    const fritzboxCb = jest.fn();
    const hueCb = jest.fn();

    act(() => {
      result.current.subscribe('fritzbox', fritzboxCb);
      result.current.subscribe('hue', hueCb);
    });

    // Simulate incoming message for fritzbox
    const message = {
      type: 'event' as const,
      topic: 'fritzbox',
      data: { devices: [] },
      ts: 123,
    };
    __mockHelpers.setLastMessage({ data: JSON.stringify(message) });

    // Re-render to trigger the useEffect that processes lastMessage
    act(() => {
      rerender();
    });

    expect(fritzboxCb).toHaveBeenCalledWith({ devices: [] });
    expect(hueCb).not.toHaveBeenCalled();
  });

  it('ignores malformed (non-JSON) messages without throwing', () => {
    const { rerender } = renderHook(() => useWebSocketManager(TEST_URL));

    __mockHelpers.setLastMessage({ data: 'not-valid-json' });

    expect(() => {
      act(() => {
        rerender();
      });
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// WS-04 — Reconnection config
// ---------------------------------------------------------------------------

describe('WS-04: Reconnection config with exponential backoff', () => {
  it('passes reconnectAttempts: 10', () => {
    renderHook(() => useWebSocketManager(TEST_URL));

    const options = (useWebSocket as jest.Mock).mock.calls[0]?.[1] as Record<string, unknown>;
    expect(options['reconnectAttempts']).toBe(10);
  });

  it('reconnectInterval returns 1000 for attempt 0', () => {
    renderHook(() => useWebSocketManager(TEST_URL));

    const options = (useWebSocket as jest.Mock).mock.calls[0]?.[1] as Record<string, unknown>;
    const reconnectInterval = options['reconnectInterval'] as (attempt: number) => number;
    expect(reconnectInterval(0)).toBe(1000);
  });

  it('reconnectInterval returns 30000 (capped) for attempt 5+', () => {
    renderHook(() => useWebSocketManager(TEST_URL));

    const options = (useWebSocket as jest.Mock).mock.calls[0]?.[1] as Record<string, unknown>;
    const reconnectInterval = options['reconnectInterval'] as (attempt: number) => number;
    // 1000 * 2^5 = 32000, capped at 30000
    expect(reconnectInterval(5)).toBe(30000);
  });

  it('reconnectInterval returns 2000 for attempt 1', () => {
    renderHook(() => useWebSocketManager(TEST_URL));

    const options = (useWebSocket as jest.Mock).mock.calls[0]?.[1] as Record<string, unknown>;
    const reconnectInterval = options['reconnectInterval'] as (attempt: number) => number;
    expect(reconnectInterval(1)).toBe(2000);
  });
});

// ---------------------------------------------------------------------------
// WS-05 — Re-subscribe on reconnect (onOpen)
// ---------------------------------------------------------------------------

describe('WS-05: Re-subscribe all active topics on reconnect', () => {
  it('re-subscribes fritzbox and sonos after onOpen (simulating reconnect)', () => {
    const { result } = renderHook(() => useWebSocketManager(TEST_URL));
    const sendJsonMessage = __mockHelpers.getSendJsonMessage();

    const fritzboxCb = jest.fn();
    const sonosCb = jest.fn();
    act(() => {
      result.current.subscribe('fritzbox', fritzboxCb);
      result.current.subscribe('sonos', sonosCb);
    });

    // Clear subscribe messages from initial subscription
    sendJsonMessage.mockClear();

    // Trigger onOpen to simulate reconnect
    act(() => {
      __mockHelpers.triggerOnOpen();
    });

    expect(sendJsonMessage).toHaveBeenCalledWith({ action: 'subscribe', topic: 'fritzbox' });
    expect(sendJsonMessage).toHaveBeenCalledWith({ action: 'subscribe', topic: 'sonos' });
    expect(sendJsonMessage).toHaveBeenCalledTimes(2);
  });

  it('does not re-subscribe topics with no remaining callbacks', () => {
    const { result } = renderHook(() => useWebSocketManager(TEST_URL));
    const sendJsonMessage = __mockHelpers.getSendJsonMessage();

    const cb = jest.fn();
    act(() => {
      result.current.subscribe('hue', cb);
      result.current.unsubscribe('hue', cb); // removes all callbacks
    });

    sendJsonMessage.mockClear();

    act(() => {
      __mockHelpers.triggerOnOpen();
    });

    expect(sendJsonMessage).not.toHaveBeenCalledWith({ action: 'subscribe', topic: 'hue' });
  });
});
