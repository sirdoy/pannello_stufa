'use client';

import { useVersion } from '@/app/context/VersionContext';
import ForceUpdateModal from './ForceUpdateModal';

/**
 * Componente wrapper per controllo versione e modal bloccante
 * Usa VersionContext per stato globale sincronizzato con polling status
 * Invisibile - renderizza solo la modal quando necessario
 */
export default function VersionEnforcer() {
  const { needsUpdate, firebaseVersion } = useVersion();

  return (
    <ForceUpdateModal
      show={needsUpdate}
      firebaseVersion={firebaseVersion || ''}
    />
  );
}
