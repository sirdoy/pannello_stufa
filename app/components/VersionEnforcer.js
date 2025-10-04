'use client';

import { useVersionEnforcement } from '@/app/hooks/useVersionEnforcement';
import ForceUpdateModal from './ForceUpdateModal';

/**
 * Componente wrapper per controllo versione e modal bloccante
 * Invisibile - renderizza solo la modal quando necessario
 */
export default function VersionEnforcer() {
  const { needsUpdate, firebaseVersion } = useVersionEnforcement();

  return (
    <ForceUpdateModal
      show={needsUpdate}
      firebaseVersion={firebaseVersion}
    />
  );
}
