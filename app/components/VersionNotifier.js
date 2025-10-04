'use client';

import { useVersionCheck } from '@/app/hooks/useVersionCheck';
import WhatsNewModal from './WhatsNewModal';

/**
 * Componente per gestire notifiche versioni e modal "What's New"
 * - Controlla nuove versioni su Firebase
 * - Mostra modal al primo accesso post-update
 * - Gestisce localStorage per versioni viste
 */
export default function VersionNotifier() {
  const { showWhatsNew, dismissWhatsNew } = useVersionCheck();

  return (
    <WhatsNewModal
      isOpen={showWhatsNew}
      onClose={() => dismissWhatsNew(false)}
      dontShowAgain={() => dismissWhatsNew(true)}
    />
  );
}
