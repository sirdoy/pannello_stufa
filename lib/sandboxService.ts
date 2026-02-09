/**
 * Sandbox Service - Gestione ambiente di testing locale
 *
 * Permette di simulare completamente il comportamento della stufa
 * senza effettuare chiamate reali all'API Thermorossi.
 *
 * SOLO DISPONIBILE IN LOCALHOST
 */

import { ref, get, set, update } from 'firebase/database';
import { db } from './firebase';

/** Sandbox error */
export interface SandboxError {
  code: string;
  description: string;
}

/** Sandbox stove state */
export interface SandboxStoveState {
  status: string;
  fan: number;
  power: number;
  temperature: number;
  lastUpdate: string;
}

/** Sandbox maintenance */
export interface SandboxMaintenance {
  hoursWorked: number;
  maxHours: number;
  needsCleaning: boolean;
  lastUpdatedAt: string | null;
}

/** Sandbox config */
export interface SandboxConfig {
  enabled: boolean;
  stoveState: SandboxStoveState;
  maintenance: SandboxMaintenance;
  error: SandboxError | null;
  settings: {
    autoProgressStates: boolean;
    simulateDelay: boolean;
    randomErrors: boolean;
  };
  history: unknown[];
}

// Stati possibili della stufa
export const STOVE_STATES = {
  OFF: 'OFF',
  START: 'START',
  WORK: 'WORK',
  CLEAN: 'CLEAN',
  FINAL: 'FINAL',
  ERROR: 'ERROR',
};

// Errori simulabili
export const SANDBOX_ERRORS: Record<string, SandboxError | null> = {
  NONE: null,
  HIGH_TEMP: { code: 'AL01', description: 'Temperatura troppo alta' },
  LOW_PRESSURE: { code: 'AL02', description: 'Pressione insufficiente' },
  IGNITION_FAIL: { code: 'AL03', description: 'Accensione fallita' },
  PELLET_JAM: { code: 'AL04', description: 'Inceppamento pellet' },
  CLEANING_NEEDED: { code: 'AL05', description: 'Pulizia necessaria' },
};

/**
 * Verifica se siamo in ambiente locale
 */
export function isLocalEnvironment(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: check NODE_ENV
    return process.env.NODE_ENV === 'development';
  }
  // Client-side: check hostname
  return window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname === '';
}

/**
 * Inizializza i dati sandbox in Firebase
 */
export async function initializeSandbox(): Promise<SandboxConfig> {
  if (!isLocalEnvironment()) {
    throw new Error('Sandbox disponibile solo in localhost');
  }

  const sandboxRef = ref(db, 'sandbox');
  const snapshot = await get(sandboxRef);

  if (!snapshot.exists()) {
    const initialData = {
      enabled: false,
      stoveState: {
        status: STOVE_STATES.OFF,
        fan: 0,
        power: 0,
        temperature: 20,
        lastUpdate: new Date().toISOString(),
      },
      maintenance: {
        hoursWorked: 0,
        maxHours: 150,
        needsCleaning: false,
        lastUpdatedAt: null,
      },
      error: null,
      settings: {
        autoProgressStates: false, // Progressione automatica stati (OFF -> START -> WORK)
        simulateDelay: true, // Simula ritardi realistici
        randomErrors: false, // Genera errori casuali
      },
      history: [], // Storico azioni sandbox
    };

    await set(sandboxRef, initialData);
    return initialData;
  }

  return snapshot.val() as SandboxConfig;
}

/**
 * Abilita/disabilita modalità sandbox
 */
export async function toggleSandbox(enabled: boolean): Promise<boolean> {
  if (!isLocalEnvironment()) {
    throw new Error('Sandbox disponibile solo in localhost');
  }

  const sandboxRef = ref(db, 'sandbox/enabled');
  await set(sandboxRef, enabled);

  // Log azione
  await logSandboxAction('TOGGLE', { enabled });

  return enabled;
}

/**
 * Verifica se sandbox è abilitato
 * Controlla sia la variabile d'ambiente SANDBOX_MODE che Firebase
 */
export async function isSandboxEnabled(): Promise<boolean> {
  if (!isLocalEnvironment()) {
    return false;
  }

  // Check variabile d'ambiente (priorità per test E2E)
  if (process.env.SANDBOX_MODE === 'true') {
    return true;
  }

  // Check Firebase (per toggle UI manuale)
  try {
    const sandboxRef = ref(db, 'sandbox/enabled');
    const snapshot = await get(sandboxRef);
    return snapshot.val() === true;
  } catch (error) {
    console.error('Errore verifica sandbox:', error);
    return false;
  }
}

/**
 * Ottiene lo stato simulato della stufa
 * Include anche l'errore se presente
 */
export async function getSandboxStoveState(): Promise<SandboxStoveState & { error: SandboxError | null }> {
  if (!isLocalEnvironment()) {
    throw new Error('Sandbox disponibile solo in localhost');
  }

  const stateRef = ref(db, 'sandbox/stoveState');
  const errorRef = ref(db, 'sandbox/error');

  const [stateSnapshot, errorSnapshot] = await Promise.all([
    get(stateRef),
    get(errorRef),
  ]);

  if (!stateSnapshot.exists()) {
    await initializeSandbox();
    return getSandboxStoveState();
  }

  const state = stateSnapshot.val();
  const error = errorSnapshot.val();

  return {
    ...state,
    error: error || null,
  };
}

/**
 * Aggiorna lo stato simulato della stufa
 */
export async function updateSandboxStoveState(updates: any) {
  if (!isLocalEnvironment()) {
    throw new Error('Sandbox disponibile solo in localhost');
  }

  const stateRef = ref(db, 'sandbox/stoveState');
  const updateData = {
    ...updates,
    lastUpdate: new Date().toISOString(),
  };

  await update(stateRef, updateData);

  // Log azione
  await logSandboxAction('UPDATE_STATE', updates);

  return updateData;
}

/**
 * Simula accensione stufa
 */
export async function sandboxIgnite(power = 3) {
  if (!isLocalEnvironment()) {
    throw new Error('Sandbox disponibile solo in localhost');
  }

  const enabled = await isSandboxEnabled();
  if (!enabled) {
    throw new Error('Sandbox non abilitato');
  }

  // Simula latenza di rete (1.5s) per testare loading overlay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Verifica manutenzione
  const maintenance = await getSandboxMaintenance();
  if (maintenance.needsCleaning) {
    throw new Error('Manutenzione richiesta - impossibile accendere');
  }

  // Simula progressione START -> WORK
  await updateSandboxStoveState({
    status: STOVE_STATES.START,
    power: power,
    fan: 1,
  });

  // Dopo 3 secondi passa a WORK (se autoProgress attivo)
  const settings = await getSandboxSettings();
  if (settings.autoProgressStates) {
    setTimeout(async () => {
      const currentState = await getSandboxStoveState();
      if (currentState.status === STOVE_STATES.START) {
        await updateSandboxStoveState({
          status: STOVE_STATES.WORK,
          fan: power,
        });
      }
    }, 3000);
  }

  await logSandboxAction('IGNITE', { power });
  return { success: true };
}

/**
 * Simula spegnimento stufa
 */
export async function sandboxShutdown() {
  if (!isLocalEnvironment()) {
    throw new Error('Sandbox disponibile solo in localhost');
  }

  const enabled = await isSandboxEnabled();
  if (!enabled) {
    throw new Error('Sandbox non abilitato');
  }

  // Simula latenza di rete (1.5s) per testare loading overlay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simula progressione CLEAN -> FINAL -> OFF
  await updateSandboxStoveState({
    status: STOVE_STATES.CLEAN,
  });

  // Progressione automatica se abilitata
  const settings = await getSandboxSettings();
  if (settings.autoProgressStates) {
    setTimeout(async () => {
      await updateSandboxStoveState({ status: STOVE_STATES.FINAL });
      setTimeout(async () => {
        await updateSandboxStoveState({
          status: STOVE_STATES.OFF,
          fan: 0,
          power: 0,
          temperature: 20,
        });
      }, 2000);
    }, 2000);
  }

  await logSandboxAction('SHUTDOWN', {});
  return { success: true };
}

/**
 * Imposta potenza
 */
export async function sandboxSetPower(power: number) {
  if (!isLocalEnvironment()) {
    throw new Error('Sandbox disponibile solo in localhost');
  }

  if (power < 1 || power > 5) {
    throw new Error('Potenza deve essere tra 1 e 5');
  }

  // Simula latenza di rete (1s) per testare loading overlay
  await new Promise(resolve => setTimeout(resolve, 1000));

  await updateSandboxStoveState({ power });
  await logSandboxAction('SET_POWER', { power });
  return { success: true };
}

/**
 * Imposta ventola
 */
export async function sandboxSetFan(fan: number) {
  if (!isLocalEnvironment()) {
    throw new Error('Sandbox disponibile solo in localhost');
  }

  if (fan < 0 || fan > 5) {
    throw new Error('Ventola deve essere tra 0 e 5');
  }

  // Simula latenza di rete (1s) per testare loading overlay
  await new Promise(resolve => setTimeout(resolve, 1000));

  await updateSandboxStoveState({ fan });
  await logSandboxAction('SET_FAN', { fan });
  return { success: true };
}

/**
 * Ottiene dati manutenzione sandbox
 */
export async function getSandboxMaintenance() {
  if (!isLocalEnvironment()) {
    throw new Error('Sandbox disponibile solo in localhost');
  }

  const maintenanceRef = ref(db, 'sandbox/maintenance');
  const snapshot = await get(maintenanceRef);

  if (!snapshot.exists()) {
    await initializeSandbox();
    return getSandboxMaintenance();
  }

  return snapshot.val() as SandboxMaintenance;
}

/**
 * Aggiorna ore lavorate manualmente
 */
export async function updateSandboxMaintenanceHours(hours: number) {
  if (!isLocalEnvironment()) {
    throw new Error('Sandbox disponibile solo in localhost');
  }

  const maintenanceRef = ref(db, 'sandbox/maintenance');
  const maxHours = 150;
  const needsCleaning = hours >= maxHours;

  await update(maintenanceRef, {
    hoursWorked: hours,
    needsCleaning,
    lastUpdatedAt: new Date().toISOString(),
  });

  await logSandboxAction('UPDATE_HOURS', { hours, needsCleaning });
  return { hours, needsCleaning };
}

/**
 * Reset manutenzione sandbox
 */
export async function resetSandboxMaintenance() {
  if (!isLocalEnvironment()) {
    throw new Error('Sandbox disponibile solo in localhost');
  }

  const maintenanceRef = ref(db, 'sandbox/maintenance');
  await update(maintenanceRef, {
    hoursWorked: 0,
    needsCleaning: false,
    lastUpdatedAt: new Date().toISOString(),
  });

  await logSandboxAction('RESET_MAINTENANCE', {});
  return { success: true };
}

/**
 * Imposta errore simulato
 */
export async function setSandboxError(errorKey: string) {
  if (!isLocalEnvironment()) {
    throw new Error('Sandbox disponibile solo in localhost');
  }

  const error = SANDBOX_ERRORS[errorKey] || null;
  const errorRef = ref(db, 'sandbox/error');

  await set(errorRef, error);

  if (error) {
    await updateSandboxStoveState({ status: STOVE_STATES.ERROR });
  }

  await logSandboxAction('SET_ERROR', { error });
  return { success: true };
}

/**
 * Ottiene settings sandbox
 */
export async function getSandboxSettings() {
  if (!isLocalEnvironment()) {
    throw new Error('Sandbox disponibile solo in localhost');
  }

  const settingsRef = ref(db, 'sandbox/settings');
  const snapshot = await get(settingsRef);

  if (!snapshot.exists()) {
    await initializeSandbox();
    return getSandboxSettings();
  }

  return snapshot.val() as SandboxConfig['settings'];
}

/**
 * Aggiorna settings sandbox
 */
export async function updateSandboxSettings(settings: any) {
  if (!isLocalEnvironment()) {
    throw new Error('Sandbox disponibile solo in localhost');
  }

  const settingsRef = ref(db, 'sandbox/settings');
  await update(settingsRef, settings);

  await logSandboxAction('UPDATE_SETTINGS', settings);
  return settings;
}

/**
 * Log azioni sandbox
 */
async function logSandboxAction(action: string, details: any) {
  try {
    const historyRef = ref(db, 'sandbox/history');
    const snapshot = await get(historyRef);
    const history = snapshot.val() || [];

    const newEntry = {
      action,
      details,
      timestamp: new Date().toISOString(),
    };

    // Mantieni solo ultime 100 azioni
    const updatedHistory = [newEntry, ...history].slice(0, 100);
    await set(historyRef, updatedHistory);
  } catch (error) {
    console.error('Errore log sandbox:', error);
  }
}

/**
 * Reset completo sandbox
 */
export async function resetSandbox() {
  if (!isLocalEnvironment()) {
    throw new Error('Sandbox disponibile solo in localhost');
  }

  const sandboxRef = ref(db, 'sandbox');
  await set(sandboxRef, null);
  await initializeSandbox();

  return { success: true };
}

/**
 * Ottiene storico azioni sandbox
 */
export async function getSandboxHistory() {
  if (!isLocalEnvironment()) {
    throw new Error('Sandbox disponibile solo in localhost');
  }

  const historyRef = ref(db, 'sandbox/history');
  const snapshot = await get(historyRef);
  return snapshot.val() || [];
}
