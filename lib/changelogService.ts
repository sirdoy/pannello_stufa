// lib/changelogService.ts
import { ref, set, get, push } from 'firebase/database';
import { db } from './firebase';

/** Version type */
export type VersionType = 'major' | 'minor' | 'patch';

/** Changelog entry */
export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
  type: VersionType;
  timestamp: string;
}

/**
 * Salva una nuova versione nel changelog Firebase
 */
export const saveVersionToFirebase = async (
  version: string,
  date: string,
  changes: string[],
  type: VersionType = 'minor'
): Promise<void> => {
  try {
    const versionRef = ref(db, `changelog/${version.replace(/\./g, '_')}`);
    await set(versionRef, {
      version,
      date,
      changes,
      type,
      timestamp: new Date().toISOString(),
    });
    console.log(`Versione ${version} salvata su Firebase`);
  } catch (error) {
    console.error('Errore nel salvataggio versione su Firebase:', error);
  }
};

/**
 * Recupera tutte le versioni dal changelog Firebase
 */
export const getChangelogFromFirebase = async (): Promise<ChangelogEntry[]> => {
  try {
    const changelogRef = ref(db, 'changelog');
    const snapshot = await get(changelogRef);

    if (snapshot.exists()) {
      const data = snapshot.val() as Record<string, ChangelogEntry>;
      // Converti oggetto in array e ordina per data decrescente
      const versions = Object.values(data).sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      return versions;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Errore nel recupero changelog da Firebase:', error);
    return [];
  }
};

/**
 * Recupera l'ultima versione rilasciata
 */
export const getLatestVersion = async (): Promise<ChangelogEntry | null> => {
  try {
    const versions = await getChangelogFromFirebase();
    return versions.length > 0 ? versions[0]! : null;
  } catch (error) {
    console.error('Errore nel recupero ultima versione:', error);
    return null;
  }
};

/**
 * Determina il tipo di versione dal numero semantico
 */
export const getVersionType = (currentVersion: string, newVersion: string): VersionType => {
  const [currentMajor, currentMinor, currentPatch] = currentVersion.split('.').map(Number);
  const [newMajor, newMinor, newPatch] = newVersion.split('.').map(Number);

  if (newMajor! > currentMajor!) return 'major';
  if (newMinor! > currentMinor!) return 'minor';
  if (newPatch! > currentPatch!) return 'patch';
  return 'patch'; // default
};

/**
 * Sincronizza VERSION_HISTORY con Firebase
 */
export const syncVersionHistoryToFirebase = async (versionHistory: any[]): Promise<void> => {
  try {
    for (let i = 0; i < versionHistory.length; i++) {
      const version = versionHistory[i];

      // Use existing type if available, otherwise calculate from version number
      let type = version.type;
      if (!type) {
        const prevVersion = versionHistory[i + 1]?.version || '0.0.0';
        type = getVersionType(prevVersion, version.version);
      }

      await saveVersionToFirebase(version.version, version.date, version.changes, type);
    }
    console.log('VERSION_HISTORY sincronizzato con Firebase');
  } catch (error) {
    console.error('Errore nella sincronizzazione:', error);
    throw error; // Re-throw to allow API to handle it
  }
};

const changelogService = {
  saveVersionToFirebase,
  getChangelogFromFirebase,
  getLatestVersion,
  getVersionType,
  syncVersionHistoryToFirebase,
};
