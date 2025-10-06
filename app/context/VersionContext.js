'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { getLatestVersion } from '@/lib/changelogService';
import { APP_VERSION } from '@/lib/version';

/**
 * Context per gestione globale stato version enforcement
 * Permette check on-demand da qualsiasi componente (es. polling status)
 */
const VersionContext = createContext({
  needsUpdate: false,
  firebaseVersion: null,
  checkVersion: async () => {},
  isChecking: false,
});

export function VersionProvider({ children }) {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [firebaseVersion, setFirebaseVersion] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  /**
   * Controlla versione Firebase vs locale
   * Può essere chiamata on-demand da qualsiasi componente
   */
  const checkVersion = useCallback(async () => {
    // Evita check simultanei
    if (isChecking) return;

    try {
      setIsChecking(true);

      // Recupera ultima versione da Firebase
      const latest = await getLatestVersion();

      if (!latest) {
        setIsChecking(false);
        return;
      }

      // Controlla se la versione su Firebase è diversa da quella locale
      if (latest.version !== APP_VERSION) {
        setNeedsUpdate(true);
        setFirebaseVersion(latest.version);
      } else {
        // Reset se versioni sono uguali (utente ha aggiornato)
        setNeedsUpdate(false);
        setFirebaseVersion(null);
      }
    } catch (error) {
      console.error('Errore nel controllo versione:', error);
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

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
 * @returns {Object} { needsUpdate, firebaseVersion, checkVersion, isChecking }
 */
export function useVersion() {
  const context = useContext(VersionContext);
  if (!context) {
    throw new Error('useVersion must be used within VersionProvider');
  }
  return context;
}
