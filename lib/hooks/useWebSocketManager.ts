'use client';

import { useCallback, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import type { Topic, WebSocketMessage } from '@/types/websocket';

export { ReadyState } from 'react-use-websocket';

/** Callback invoked when a message arrives for a subscribed topic */
export type TopicCallback = (data: unknown) => void;

/**
 * Public API surface of the shared WebSocket connection manager.
 * Distributed app-wide via WebSocketContext.
 */
export interface WebSocketManager {
  subscribe: (topic: Topic, callback: TopicCallback) => void;
  unsubscribe: (topic: Topic, callback: TopicCallback) => void;
  readyState: ReadyState;
}

/**
 * Singleton WebSocket connection manager.
 *
 * Wraps react-use-websocket to provide:
 * - A single shared connection to /ws/live (WS-01)
 * - Topic-based subscribe/unsubscribe with callback dispatch (WS-02, WS-03)
 * - Exponential backoff reconnection 1s → 30s (WS-04)
 * - Re-subscription of all active topics on reconnect (WS-05)
 *
 * @param wsUrl - Full WebSocket URL including auth query parameter, or null to disable connection
 */
export function useWebSocketManager(wsUrl: string | null): WebSocketManager {
  /** Per-topic callback registry. Keyed by Topic, value is a Set of callbacks. */
  const callbacksRef = useRef<Map<Topic, Set<TopicCallback>>>(new Map());

  const { lastMessage, sendJsonMessage, readyState } = useWebSocket(
    wsUrl,
    {
      /** Re-subscribe all active topics on every (re)connect (WS-05) */
      onOpen: () => {
        callbacksRef.current.forEach((callbacks, topic) => {
          if (callbacks.size > 0) {
            sendJsonMessage({ action: 'subscribe', topic });
          }
        });
      },
      /** Reconnect on all close events */
      shouldReconnect: () => true,
      /** Max reconnect attempts */
      reconnectAttempts: 10,
      /** Exponential backoff: 1s → 2s → 4s → ... capped at 30s (WS-04) */
      reconnectInterval: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
    },
    wsUrl !== null,
  );

  /** Dispatch incoming messages to registered topic callbacks (WS-03) */
  useEffect(() => {
    if (!lastMessage) return;
    try {
      const msg = JSON.parse(lastMessage.data as string) as WebSocketMessage;
      const topic = msg.topic as Topic;
      callbacksRef.current.get(topic)?.forEach((cb) => cb(msg.data));
    } catch {
      // Ignore malformed messages
    }
  }, [lastMessage]);

  /**
   * Subscribe a callback to a topic.
   * Sends a subscribe message immediately if the connection is open (WS-02).
   */
  const subscribe = useCallback(
    (topic: Topic, callback: TopicCallback): void => {
      if (!callbacksRef.current.has(topic)) {
        callbacksRef.current.set(topic, new Set());
      }
      // Non-null assertion safe: we just ensured the Set exists above
      callbacksRef.current.get(topic)!.add(callback);

      if (readyState === ReadyState.OPEN) {
        sendJsonMessage({ action: 'subscribe', topic });
      }
    },
    [readyState, sendJsonMessage],
  );

  /**
   * Unsubscribe a callback from a topic.
   * Sends an unsubscribe message when no more callbacks remain for the topic.
   */
  const unsubscribe = useCallback(
    (topic: Topic, callback: TopicCallback): void => {
      const callbacks = callbacksRef.current.get(topic);
      callbacks?.delete(callback);

      if (callbacks?.size === 0 && readyState === ReadyState.OPEN) {
        sendJsonMessage({ action: 'unsubscribe', topic });
      }
    },
    [readyState, sendJsonMessage],
  );

  return { subscribe, unsubscribe, readyState };
}
