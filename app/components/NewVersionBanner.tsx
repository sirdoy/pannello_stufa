'use client';

import { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import { reloadToNewVersion, useNewVersion } from '@/lib/hooks/useNewVersion';
import Button from './ui/Button';
import Text from './ui/Text';

/**
 * "New version" prompt shown after a frontend or backend deploy (M17).
 * Floats above the bottom navigation; dismissible until the next page load.
 */
export default function NewVersionBanner() {
  const { readyState } = useWebSocketContext();
  // Re-check each time the live connection re-opens (backend restarted on deploy)
  const { updateAvailable } = useNewVersion(readyState === ReadyState.OPEN);
  const [dismissed, setDismissed] = useState(false);
  const [reloading, setReloading] = useState(false);

  if (!updateAvailable || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-fade-in-up fixed inset-x-4 mx-auto max-w-md"
      // Above the bottom navigation and the offline banner (z 60)
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 96px)', zIndex: 70 }}
    >
      <div className="border-ember-500/25 shadow-ember-glow-sm flex items-center gap-3 rounded-xl border bg-slate-900/90 p-3 backdrop-blur-lg">
        <RefreshCw size={20} className="text-ember-400 shrink-0" aria-hidden="true" />
        <Text className="flex-1 text-sm font-medium text-slate-100">Nuova versione disponibile</Text>
        <Button
          variant="ember"
          size="sm"
          loading={reloading}
          onClick={() => {
            setReloading(true);
            void reloadToNewVersion();
          }}
        >
          Ricarica
        </Button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Chiudi"
          className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-200"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
