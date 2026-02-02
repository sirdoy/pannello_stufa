'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { getLatestVersion } from '@/lib/changelogService';
import { APP_VERSION } from '@/lib/version';
import { isDevelopment } from '@/lib/environmentHelper';

/**
 * Confronta due versioni semantiche (MAJOR.MINOR.PATCH)
 * @param {string} v1 - Versione 1 (es. "1.4.2")
 * @param {string} v2 - Versione 2 (es. "1.5.0")
 * @returns {number} -1 se v1 < v2, 0 se v1 === v2, 1 se v1 > v2
 */
function compareVersions(v1, v2) {
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

/**
 * Context per gestione globale stato version enforcement
 * Permette check on-demand da qualsiasi componente (es. polling status)
 */
const VersionContext = createContext(null);

export function VersionProvider({ children }) {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [firebaseVersion, setFirebaseVersion] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  /**
   * Controlla versione Firebase vs locale
   * Può essere chiamata on-demand da qualsiasi componente
   */
  const checkVersion = useCallback(async () => {
    // Evita check simultanei usando ref interno invece di state dependency
    if (isChecking) return;

    // Non mostrare modal bloccante in ambiente locale
    if (isDevelopment()) {
      console.log('🔧 Ambiente locale: versioning enforcement disabilitato');
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
        console.log(`⚠️ Update richiesto: ${APP_VERSION} → ${latest.version}`);
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
 * @returns {Object} { needsUpdate, firebaseVersion, checkVersion, isChecking }
 */
export function useVersion() {
  const context = useContext(VersionContext);
  if (!context) {
    throw new Error('useVersion must be used within VersionProvider');
  }
  return context;
}
