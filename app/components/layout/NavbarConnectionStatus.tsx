'use client';

import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import { ConnectionStatus } from '@/app/components/ui/ConnectionStatus';

type WsStatus = 'online' | 'connecting' | 'offline';

/**
 * Maps react-use-websocket ReadyState to a UI connection status variant.
 *
 * - OPEN        → online  (green)
 * - CONNECTING  → connecting (amber pulse)
 * - all others  → offline (grey, polling fallback)
 */
export function mapReadyState(rs: ReadyState): WsStatus {
  if (rs === ReadyState.OPEN) return 'online';
  if (rs === ReadyState.CONNECTING) return 'connecting';
  return 'offline';
}

const WS_STATUS_LABELS: Record<WsStatus, string> = {
  online: 'Connesso via WS',
  connecting: 'Riconnessione...',
  offline: 'Polling attivo',
};

/**
 * Navbar sub-component showing live WebSocket connection status (UX-01, D-01).
 *
 * Reads readyState from the shared WebSocketContext and renders a ConnectionStatus
 * indicator with Italian labels. Placed in the Navbar header bar, visible on all
 * screen sizes.
 */
export function NavbarConnectionStatus() {
  const { readyState } = useWebSocketContext();
  const status = mapReadyState(readyState);
  return (
    <ConnectionStatus
      status={status}
      label={WS_STATUS_LABELS[status]}
      size="sm"
    />
  );
}
