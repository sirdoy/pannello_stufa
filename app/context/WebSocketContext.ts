'use client';

import { createContext, useContext } from 'react';
import type { WebSocketManager } from '@/lib/hooks/useWebSocketManager';

/**
 * React context that distributes the shared WebSocket manager to device hooks.
 *
 * Usage: wrap the app (or the relevant subtree) in a WebSocketProvider that
 * calls useWebSocketManager and provides the result via this context.
 */
export const WebSocketContext = createContext<WebSocketManager | null>(null);

/**
 * Hook for consuming the WebSocket manager from any client component or hook.
 *
 * @throws Error if called outside a WebSocketProvider
 */
export function useWebSocketContext(): WebSocketManager {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return ctx;
}
