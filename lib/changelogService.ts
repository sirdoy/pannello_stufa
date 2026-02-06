// lib/changelogService.js
import { ref, set, get, push } from 'firebase/database';
import { db } from './firebase';

/**
 * Salva una nuova versione nel changelog Firebase
 * @param {string} version - Numero versione (es. "1.1.0")
 * @param {string} date - Data rilascio (YYYY-MM-DD)
 * @param {Array<string>} changes - Array di modifiche
 * @param {string} type - Tipo versione: 'major' | 'minor' | 'patch'
 */
export const saveVersionToFirebase = async (version, date, changes, type = 'minor') => {
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
 * @returns {Promise<Array>} Array di versioni ordinate per data (più recenti prima)
 */
export const getChangelogFromFirebase = async () => {
  try {
    const changelogRef = ref(db, 'changelog');
    const snapshot = await get(changelogRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      // Converti oggetto in array e ordina per data decrescente
      const versions = Object.values(data).sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
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
 * @returns {Promise<Object|null>} Oggetto versione o null
 */
export const getLatestVersion = async () => {
  try {
    const versions = await getChangelogFromFirebase();
    return versions.length > 0 ? versions[0] : null;
  } catch (error) {
    console.error('Errore nel recupero ultima versione:', error);
    return null;
  }
};

/**
 * Determina il tipo di versione dal numero semantico
 * @param {string} currentVersion - Versione corrente (es. "1.0.0")
 * @param {string} newVersion - Nuova versione (es. "1.1.0")
 * @returns {string} 'major' | 'minor' | 'patch'
 */
export const getVersionType = (currentVersion, newVersion) => {
  const [currentMajor, currentMinor, currentPatch] = currentVersion.split('.').map(Number);
  const [newMajor, newMinor, newPatch] = newVersion.split('.').map(Number);

  if (newMajor > currentMajor) return 'major';
  if (newMinor > currentMinor) return 'minor';
  if (newPatch > currentPatch) return 'patch';
  return 'patch'; // default
};

/**
 * Sincronizza VERSION_HISTORY con Firebase
 * @param {Array} versionHistory - Array da lib/version.js
 */
export const syncVersionHistoryToFirebase = async (versionHistory) => {
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

export default changelogService;
