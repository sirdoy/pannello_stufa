'use client';

import Button from '../../../ui/Button';
import { Text } from '../../../ui';

interface StovePrimaryActionsProps {
  isAccesa: boolean;
  isSpenta: boolean;
  isOnline: boolean;
  needsMaintenance: boolean;
  loading: boolean;
  igniteCmd: { isExecuting: boolean };
  shutdownCmd: { isExecuting: boolean };
  onIgnite: () => void;
  onShutdown: () => void;
}

export default function StovePrimaryActions({
  isAccesa,
  isSpenta,
  isOnline,
  needsMaintenance,
  loading,
  igniteCmd,
  shutdownCmd,
  onIgnite,
  onShutdown,
}: StovePrimaryActionsProps) {
  return (
    <div className="mb-6">
      {isOnline ? (
        <>
          {/* Transitional state (CLEANING, MODULATION, etc.): show both buttons */}
          {!isAccesa && !isSpenta && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="ember"
                size="lg"
                icon="🔥"
                onClick={onIgnite}
                disabled={!isOnline || igniteCmd.isExecuting || loading || needsMaintenance}
                className="h-20 sm:h-24 text-base sm:text-lg font-bold font-display"
              >
                ACCENDI
              </Button>
              <Button
                variant="subtle"
                size="lg"
                icon="❄️"
                onClick={onShutdown}
                disabled={!isOnline || shutdownCmd.isExecuting || loading}
                className="h-20 sm:h-24 text-base sm:text-lg font-bold font-display"
              >
                SPEGNI
              </Button>
            </div>
          )}

          {/* Stove is OFF: show only ACCENDI - prominent CTA */}
          {isSpenta && (
            <Button
              variant="ember"
              size="lg"
              icon="🔥"
              onClick={onIgnite}
              disabled={!isOnline || igniteCmd.isExecuting || loading || needsMaintenance}
              className="w-full h-20 sm:h-24 text-base sm:text-lg font-bold font-display ring-2 ring-ember-500/30 ring-offset-2 ring-offset-slate-900 [html:not(.dark)_&]:ring-offset-white"
            >
              ACCENDI
            </Button>
          )}

          {/* Stove is ON: show only SPEGNI */}
          {isAccesa && (
            <Button
              variant="subtle"
              size="lg"
              icon="❄️"
              onClick={onShutdown}
              disabled={!isOnline || shutdownCmd.isExecuting || loading}
              className="w-full h-20 sm:h-24 text-base sm:text-lg font-display"
            >
              SPEGNI
            </Button>
          )}
        </>
      ) : (
        <div className="p-6 text-center">
          <Text variant="secondary" size="sm">
            Controlli non disponibili offline
          </Text>
        </div>
      )}
    </div>
  );
}
