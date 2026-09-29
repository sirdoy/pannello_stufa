'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import type { Topic, WebSocketMessage } from '@/types/websocket';

export { ReadyState } from 'react-use-websocket';

/**
 * Minimum time in background before a return to foreground forces a fresh
 * connection (ROADMAP M16). Mobile browsers suspend a backgrounded PWA: the
 * socket can look OPEN while dead, or have used up its reconnect attempts.
 */
export const WS_RESUME_AFTER_HIDDEN_MS = 15_000;

/** Callback invoked when a message arrives for a subscribed topic */
type TopicCallback = (data: unknown) => void;

/**
 * Public API surface of the shared WebSocket connection manager.
 * Distributed app-wide via WebSocketContext.
 */
export interface WebSocketManager {
  subscribe: (topic: Topic, callback: TopicCallback) => void;
  unsubscribe: (topic: Topic, callback: TopicCallback) => void;
  readyState: ReadyState;
  /** Bumped on every forced reconnect after a return to foreground (0 = never). */
  resumeEpoch?: number;
  /** resumeEpoch at the last frame received per topic (absent = no frame yet). */
  topicEpochs?: ReadonlyMap<Topic, number>;
}

/**
 * Singleton WebSocket connection manager.
 *
 * Wraps react-use-websocket to provide:
 * - A single shared connection to /ws/live (WS-01)
 * - Topic-based subscribe/unsubscribe with callback dispatch (WS-02, WS-03)
 * - Exponential backoff reconnection 1s → 30s (WS-04), none after an auth
 *   rejection (close code 1008 — retrying with the same key cannot succeed)
 * - Re-subscription of all active topics on reconnect (WS-05)
 * - One server subscription per topic: later callbacks on an already-active
 *   topic get the last payload replayed locally instead of a duplicate
 *   server snapshot fanned out to every existing callback
 * - Fresh connection on return to foreground after WS_RESUME_AFTER_HIDDEN_MS,
 *   on `pageshow` from the bfcache and on `online` (ROADMAP M16): a new URL
 *   resolver identity makes react-use-websocket drop the old socket and open a
 *   new one, whose subscriptions get fresh snapshots
 *
 * @param wsUrl - Full WebSocket URL (or async resolver called on every connect, see
 *   lib/ws/wsUrl.ts), or null to disable the connection
 */
export function useWebSocketManager(
  wsUrl: string | (() => Promise<string>) | null
): WebSocketManager {
  /** Per-topic callback registry. Keyed by Topic, value is a Set of callbacks. */
  const callbacksRef = useRef<Map<Topic, Set<TopicCallback>>>(new Map());
  /** Last payload received per topic — replayed to callbacks joining an active topic. */
  const lastDataRef = useRef<Map<Topic, unknown>>(new Map());

  const [resumeEpoch, setResumeEpoch] = useState(0);
  /** Mirror of resumeEpoch for onMessage (written in the event handler, not during render). */
  const resumeEpochRef = useRef(0);
  /** Mutable map + state copy: the state only changes on the first frame per topic after a resume. */
  const topicEpochsRef = useRef<Map<Topic, number>>(new Map());
  const [topicEpochs, setTopicEpochs] = useState<ReadonlyMap<Topic, number>>(() => new Map());

  useEffect(() => {
    if (wsUrl === null) return;
    let hiddenAt: number | null = document.hidden ? Date.now() : null;
    const resume = () => {
      resumeEpochRef.current += 1;
      setResumeEpoch(resumeEpochRef.current);
    };
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt !== null && Date.now() - hiddenAt >= WS_RESUME_AFTER_HIDDEN_MS) resume();
      hiddenAt = null;
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) resume();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('online', resume);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('online', resume);
    };
  }, [wsUrl]);

  // Epoch 0 passes the URL through unchanged; each resume wraps it in a new
  // resolver so react-use-websocket reconnects (its effect keys on `url`).
  const connectUrl = useMemo(() => {
    if (wsUrl === null || resumeEpoch === 0) return wsUrl;
    return typeof wsUrl === 'function' ? () => wsUrl() : () => wsUrl;
  }, [wsUrl, resumeEpoch]);

  const { sendJsonMessage, readyState } = useWebSocket(
    connectUrl,
    {
      /** Re-subscribe all active topics on every (re)connect (WS-05) */
      onOpen: () => {
        callbacksRef.current.forEach((callbacks, topic) => {
          if (callbacks.size > 0) {
            sendJsonMessage({ action: 'subscribe', topic });
          }
        });
      },
      /**
       * Dispatch every frame to its topic callbacks (WS-03). Done here rather than
       * in an effect on `lastMessage`: React may batch several frames (e.g. the
       * snapshot burst after connect) into one render and only the last one
       * would be dispatched.
       */
      onMessage: (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string) as WebSocketMessage;
          const topic = msg.topic as Topic;
          lastDataRef.current.set(topic, msg.data);
          const epoch = resumeEpochRef.current;
          if (topicEpochsRef.current.get(topic) !== epoch) {
            topicEpochsRef.current.set(topic, epoch);
            setTopicEpochs(new Map(topicEpochsRef.current));
          }
          callbacksRef.current.get(topic)?.forEach((cb) => cb(msg.data));
        } catch {
          // Ignore malformed messages
        }
      },
      /** Reconnect on every close except an auth rejection (1008 Unauthorized) */
      shouldReconnect: (event: CloseEvent) => event.code !== 1008,
      /** Max reconnect attempts */
      reconnectAttempts: 10,
      /** Retry (with the same backoff) when the URL resolver fails, e.g. token fetch error */
      retryOnError: true,
      /** Exponential backoff: 1s → 2s → 4s → ... capped at 30s (WS-04) */
      reconnectInterval: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
    },
    wsUrl !== null,
  );

  /**
   * Subscribe a callback to a topic.
   * The first callback on a topic sends a subscribe message if the connection is
   * open (WS-02); the server answers with a snapshot. Later callbacks on the same
   * topic get the last received payload replayed locally.
   */
  const subscribe = useCallback(
    (topic: Topic, callback: TopicCallback): void => {
      if (!callbacksRef.current.has(topic)) {
        callbacksRef.current.set(topic, new Set());
      }
      // Non-null assertion safe: we just ensured the Set exists above
      const callbacks = callbacksRef.current.get(topic)!;
      const topicAlreadyActive = callbacks.size > 0;
      callbacks.add(callback);

      if (topicAlreadyActive) {
        if (lastDataRef.current.has(topic)) {
          const last = lastDataRef.current.get(topic);
          queueMicrotask(() => {
            if (callbacksRef.current.get(topic)?.has(callback)) callback(last);
          });
        }
        return;
      }

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

      if (callbacks?.size === 0) {
        lastDataRef.current.delete(topic);
        if (readyState === ReadyState.OPEN) {
          sendJsonMessage({ action: 'unsubscribe', topic });
        }
      }
    },
    [readyState, sendJsonMessage],
  );

  return { subscribe, unsubscribe, readyState, resumeEpoch, topicEpochs };
}
