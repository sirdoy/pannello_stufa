/**
 * Display helpers shared by the stove dashboard card and its sheet (ROADMAP M77).
 * Pure functions: state label, schedule summary, age of the last reading.
 */

import type { NextScheduledAction } from '@/lib/scheduler/schedulerService';
import type { StoveState } from '@/types/thermorossiProxy';

export type StoveTone = 'accent' | 'warn' | 'danger' | 'muted';

export interface StoveStateDisplay {
  /** Full label, for the sheet ("In funzione") */
  label: string;
  /** One word, for the dashboard card ("Accesa") */
  short: string;
  tone: StoveTone;
}

export const STOVE_TONE_COLOR: Record<StoveTone, string> = {
  accent: 'var(--accent)',
  warn: '#ffb84a',
  danger: '#ff6676',
  muted: 'var(--text-2)',
};

const STATES: Record<StoveState, StoveStateDisplay> = {
  off: { label: 'Spenta', short: 'Spenta', tone: 'muted' },
  igniting: { label: 'In accensione', short: 'Avvio', tone: 'accent' },
  working: { label: 'In funzione', short: 'Accesa', tone: 'accent' },
  modulating: { label: 'In modulazione', short: 'Accesa', tone: 'accent' },
  standby: { label: 'In attesa', short: 'Attesa', tone: 'warn' },
  cleaning: { label: 'Pulizia in corso', short: 'Pulizia', tone: 'warn' },
  alarm: { label: 'In allarme', short: 'Allarme', tone: 'danger' },
  unknown: { label: 'Stato sconosciuto', short: '—', tone: 'muted' },
};

/** `isAccesa` decides when the status is missing or not a known state. */
export function getStoveStateDisplay(status: StoveState | undefined, isAccesa: boolean): StoveStateDisplay {
  return (status && STATES[status]) ?? (isAccesa ? STATES.working : STATES.off);
}

/** "23:00" today, "dom 18:15" on another day. */
export function formatStoveTime(at: number | string, now: Date = new Date()): string {
  const date = new Date(at);
  const time = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === now.toDateString()) return time;
  return `${date.toLocaleDateString('it-IT', { weekday: 'short' })} ${time}`;
}

/** "alle 23:00" today, "dom 18:15" on another day. */
export function formatStoveWhen(at: number | string, now: Date = new Date()): string {
  const text = formatStoveTime(at, now);
  return text.includes(' ') ? text : `alle ${text}`;
}

export interface StoveScheduleInput {
  schedulerEnabled: boolean;
  semiManualMode: boolean;
  returnToAutoAt: number | null;
  nextScheduledAction: NextScheduledAction | null;
}

export interface StoveScheduleDisplay {
  mode: 'Automatica' | 'Semi-manuale' | 'Manuale';
  /** What happens next, short for the card ("Spegne alle 23:00"); null when nothing is planned */
  nextShort: string | null;
  /** Same, as a sentence for the sheet ("Si spegne alle 23:00") */
  nextLong: string | null;
}

const NEXT_VERB: Record<NextScheduledAction['action'], [short: string, long: string]> = {
  ignite: ['Accende', 'Si accende'],
  shutdown: ['Spegne', 'Si spegne'],
  adjust: ['Regola', 'Cambia livelli'],
};

export function describeStoveSchedule(input: StoveScheduleInput, now: Date = new Date()): StoveScheduleDisplay {
  if (!input.schedulerEnabled) return { mode: 'Manuale', nextShort: null, nextLong: null };

  if (input.semiManualMode) {
    if (input.returnToAutoAt === null) return { mode: 'Semi-manuale', nextShort: null, nextLong: null };
    const at = formatStoveWhen(input.returnToAutoAt, now);
    return { mode: 'Semi-manuale', nextShort: `Auto ${at}`, nextLong: `Torna automatica ${at}` };
  }

  const next = input.nextScheduledAction;
  if (!next) return { mode: 'Automatica', nextShort: null, nextLong: null };
  const [short, long] = NEXT_VERB[next.action] ?? ['Prossima', 'Prossima azione'];
  const at = formatStoveWhen(next.timestamp, now);
  return { mode: 'Automatica', nextShort: `${short} ${at}`, nextLong: `${long} ${at}` };
}

/** Age of a reading: "meno di 1 min", "12 min", "3 h". */
export function formatStoveAge(seconds: number): string {
  if (seconds < 60) return 'meno di 1 min';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  return `${Math.floor(seconds / 3600)} h`;
}
