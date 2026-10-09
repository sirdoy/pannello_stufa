'use client';

import { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import { reloadToNewVersion, useNewVersion } from '@/lib/hooks/useNewVersion';
import Button from './ui/Button';
import Card from './ui/Card';
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
      <Card padding={false} className="flex items-center gap-3 bg-black/70 p-3">
        <RefreshCw size={20} className="shrink-0 text-ember-400" aria-hidden="true" />
        <Text size="sm" weight="medium" className="flex-1">Nuova versione disponibile</Text>
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
        <Button.Icon
          type="button"
          variant="ghost"
          size="sm"
          icon={<X size={18} />}
          onClick={() => setDismissed(true)}
          aria-label="Chiudi"
          className="shrink-0"
        />
      </Card>
    </div>
  );
}
