'use client';

import { useState, useEffect } from 'react';
import { getLatestVersion } from '@/lib/changelogService';
import { APP_VERSION } from '@/lib/version';

/**
 * Hook per forzare aggiornamento quando versione Firebase è diversa da quella locale
 * Fa polling periodico ogni 60 secondi
 * @returns {Object} { needsUpdate, firebaseVersion }
 */
export function useVersionEnforcement() {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [firebaseVersion, setFirebaseVersion] = useState(null);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Recupera ultima versione da Firebase
        const latest = await getLatestVersion();

        if (!latest) return;

        // Controlla se la versione su Firebase è diversa da quella locale
        if (latest.version !== APP_VERSION) {
          setNeedsUpdate(true);
          setFirebaseVersion(latest.version);
        }
      } catch (error) {
        console.error('Errore nel controllo versione enforcement:', error);
      }
    };

    // Check iniziale
    checkVersion();

    // Polling ogni 60 secondi
    const interval = setInterval(checkVersion, 60000);

    return () => clearInterval(interval);
  }, []);

  return {
    needsUpdate,
    firebaseVersion,
  };
}
