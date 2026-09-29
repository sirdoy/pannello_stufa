import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { WebSocketContext } from '@/app/context/WebSocketContext';
import type { WebSocketManager } from '@/lib/hooks/useWebSocketManager';
import type { Topic } from '@/types/websocket';
import { CARD_READY_TIMEOUT_MS, useCardReady } from '../useCardReady';

describe('useCardReady (ROADMAP M15)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('false until ready, true once ready', () => {
    const { result, rerender } = renderHook(({ ready }) => useCardReady(ready), {
      initialProps: { ready: false },
    });
    expect(result.current).toBe(false);
    rerender({ ready: true });
    expect(result.current).toBe(true);
  });

  test('latches: a later reload (ready=false) does not bring the skeleton back', () => {
    const { result, rerender } = renderHook(({ ready }) => useCardReady(ready), {
      initialProps: { ready: true },
    });
    rerender({ ready: false });
    expect(result.current).toBe(true);
  });

  test('safety timeout: becomes true when the first data never arrives', () => {
    const { result } = renderHook(() => useCardReady(false));
    act(() => {
      jest.advanceTimersByTime(CARD_READY_TIMEOUT_MS - 1);
    });
    expect(result.current).toBe(false);
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe(true);
  });

  describe('resume (M16)', () => {
    const wrapperFor = (manager: Partial<WebSocketManager>) => {
      const value = { subscribe: jest.fn(), unsubscribe: jest.fn(), readyState: 1, ...manager } as WebSocketManager;
      function Wrapper({ children }: { children: ReactNode }) {
        return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
      }
      return Wrapper;
    };

    test('back to skeleton after a resume until the topic sends a new frame', () => {
      let manager: Partial<WebSocketManager> = { resumeEpoch: 0, topicEpochs: new Map<Topic, number>([['raspi', 0]]) };
      const { result, rerender } = renderHook(() => useCardReady(true, 'raspi'), {
        wrapper: ({ children }) => wrapperFor(manager)({ children }),
      });
      expect(result.current).toBe(true);

      manager = { resumeEpoch: 1, topicEpochs: new Map<Topic, number>([['raspi', 0]]) };
      rerender();
      expect(result.current).toBe(false);

      manager = { resumeEpoch: 1, topicEpochs: new Map<Topic, number>([['raspi', 1]]) };
      rerender();
      expect(result.current).toBe(true);
    });

    test('resume skeleton times out when the topic stays silent', () => {
      const manager = { resumeEpoch: 1, topicEpochs: new Map<Topic, number>() };
      const { result } = renderHook(() => useCardReady(true, 'tuya'), { wrapper: wrapperFor(manager) });
      expect(result.current).toBe(false);
      act(() => {
        jest.advanceTimersByTime(CARD_READY_TIMEOUT_MS);
      });
      expect(result.current).toBe(true);
    });

    test('cards without a topic ignore resumes', () => {
      const manager = { resumeEpoch: 3, topicEpochs: new Map<Topic, number>() };
      const { result } = renderHook(() => useCardReady(true), { wrapper: wrapperFor(manager) });
      expect(result.current).toBe(true);
    });
  });
});
