'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getLatestVersion } from '@/lib/changelogService';
import { APP_VERSION } from '@/lib/version';
import { isDevelopment } from '@/lib/environmentHelper';

/**
 * Confronta due versioni semantiche (MAJOR.MINOR.PATCH)
 * @param v1 - Versione 1 (es. "1.4.2")
 * @param v2 - Versione 2 (es. "1.5.0")
 * @returns -1 se v1 < v2, 0 se v1 === v2, 1 se v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }

  return 0;
}

interface VersionContextValue {
  needsUpdate: boolean;
  firebaseVersion: string | null;
  checkVersion: () => Promise<void>;
  isChecking: boolean;
}

/**
 * Context per gestione globale stato version enforcement
 * Permette check on-demand da qualsiasi componente (es. polling status)
 */
const VersionContext = createContext<VersionContextValue | null>(null);

export function VersionProvider({ children }: { children: ReactNode }) {
  const [needsUpdate, setNeedsUpdate] = useState<boolean>(false);
  const [firebaseVersion, setFirebaseVersion] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  /**
   * Controlla versione Firebase vs locale
   * Può essere chiamata on-demand da qualsiasi componente
   */
  const checkVersion = useCallback(async (): Promise<void> => {
    // Evita check simultanei usando ref interno invece di state dependency
    if (isChecking) return;

    // Non mostrare modal bloccante in ambiente locale
    if (isDevelopment()) {
      return;
    }

    try {
      setIsChecking(true);

      // Recupera ultima versione da Firebase
      const latest = await getLatestVersion();

      if (!latest) {
        setIsChecking(false);
        return;
      }

      // Confronta versioni semanticamente
      // Modal bloccante SOLO se versione locale < Firebase
      const comparison = compareVersions(APP_VERSION, latest.version);

      if (comparison < 0) {
        // Versione locale è INFERIORE → update necessario
        setNeedsUpdate(true);
        setFirebaseVersion(latest.version);
      } else {
        // Versione locale >= Firebase → no update
        setNeedsUpdate(false);
        setFirebaseVersion(null);
      }
    } catch (error) {
      console.error('Errore nel controllo versione:', error);
    } finally {
      setIsChecking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Rimuovo isChecking dalle dependencies per stabilizzare la funzione

  const value = {
    needsUpdate,
    firebaseVersion,
    checkVersion,
    isChecking,
  };

  return (
    <VersionContext.Provider value={value}>
      {children}
    </VersionContext.Provider>
  );
}

/**
 * Hook per accedere al VersionContext
 * @returns { needsUpdate, firebaseVersion, checkVersion, isChecking }
 */
export function useVersion(): VersionContextValue {
  const context = useContext(VersionContext);
  if (!context) {
    throw new Error('useVersion must be used within VersionProvider');
  }
  return context;
}
