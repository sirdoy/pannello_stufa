'use client';

import { useState, useEffect, useRef } from 'react';
import { getLatestVersion } from '@/lib/changelogService';
import { APP_VERSION } from '@/lib/version';

const STORAGE_KEY = 'lastSeenVersion';
const DISMISSED_KEY = 'dismissedVersions';

/** Changelog version type */
export interface ChangelogVersion {
  version: string;
  date: string;
  changes: unknown[];
}

/** useVersionCheck return type */
export interface UseVersionCheckReturn {
  hasNewVersion: boolean;
  latestVersion: ChangelogVersion | null;
  showWhatsNew: boolean;
  dismissWhatsNew: (dontShowAgain?: boolean) => void;
  dismissBadge: () => void;
}

/**
 * Hook per controllo nuove versioni
 * @returns Version check state and controls
 */
export function useVersionCheck(): UseVersionCheckReturn {
  const [hasNewVersion, setHasNewVersion] = useState<boolean>(false);
  const [latestVersion, setLatestVersion] = useState<ChangelogVersion | null>(null);
  const [showWhatsNew, setShowWhatsNew] = useState<boolean>(false);
  const fetchedRef = useRef<boolean>(false);

  useEffect(() => {
    // Previeni double fetch in React Strict Mode
    if (fetchedRef.current) return;

    // Non mostrare modal in TEST_MODE
    if (process.env.NEXT_PUBLIC_TEST_MODE === 'true' || process.env.TEST_MODE === 'true') {
      fetchedRef.current = true;
      return;
    }

    const checkVersion = async () => {
      try {
        fetchedRef.current = true;

        // Recupera ultima versione da Firebase
        const latest = await getLatestVersion();

        if (!latest) return;

        setLatestVersion(latest);

        // Controlla se è una versione più recente
        const isNewer = compareVersions(latest.version, APP_VERSION) > 0;
        setHasNewVersion(isNewer);

        // Controlla localStorage per versioni già viste
        const lastSeen = localStorage.getItem(STORAGE_KEY);
        const dismissed = getDismissedVersions();

        // Mostra modal se:
        // 1. Versione corrente è diversa dall'ultima vista
        // 2. Non è stata già dismessa
        const shouldShowModal = lastSeen !== APP_VERSION && !dismissed.includes(APP_VERSION);

        if (shouldShowModal) {
          setShowWhatsNew(true);
        }
      } catch (error) {
        console.error('Errore nel controllo versione:', error);
        fetchedRef.current = false; // Reset on error per retry
      }
    };

    checkVersion();
  }, []);

  const dismissWhatsNew = (dontShowAgain: boolean = false) => {
    setShowWhatsNew(false);
    localStorage.setItem(STORAGE_KEY, APP_VERSION);

    if (dontShowAgain) {
      const dismissed = getDismissedVersions();
      dismissed.push(APP_VERSION);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    }
  };

  const dismissBadge = () => {
    setHasNewVersion(false);
    localStorage.setItem(STORAGE_KEY, APP_VERSION);
  };

  return {
    hasNewVersion,
    latestVersion,
    showWhatsNew,
    dismissWhatsNew,
    dismissBadge,
  };
}

/**
 * Confronta due versioni semantiche
 * @param v1 - Prima versione (es. "1.2.0")
 * @param v2 - Seconda versione (es. "1.1.0")
 * @returns 1 se v1 > v2, -1 se v1 < v2, 0 se uguali
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] ?? 0;
    const p2 = parts2[i] ?? 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}

/**
 * Recupera lista versioni dismesse da localStorage
 * @returns Array of dismissed version strings
 */
function getDismissedVersions(): string[] {
  try {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    return dismissed ? JSON.parse(dismissed) : [];
  } catch {
    return [];
  }
}
