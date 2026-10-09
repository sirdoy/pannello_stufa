/**
 * Cron expressions of `schedule_cron` triggers (workspace ROADMAP M69). Mirrors the
 * backend parser (backend/api/automations/cron.py, docs/api/automations.md "Cron
 * triggers") so the editor can say what is wrong before the 422 of the save.
 */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

interface FieldSpec {
  label: string;
  low: number;
  high: number;
  names: Record<string, number>;
}

const FIELDS: FieldSpec[] = [
  { label: 'Minuto', low: 0, high: 59, names: {} },
  { label: 'Ora', low: 0, high: 23, names: {} },
  { label: 'Giorno del mese', low: 1, high: 31, names: {} },
  { label: 'Mese', low: 1, high: 12, names: Object.fromEntries(MONTHS.map((m, i) => [m, i + 1])) },
  { label: 'Giorno della settimana', low: 0, high: 7, names: Object.fromEntries(WEEKDAYS.map((d, i) => [d, i])) },
];

/** Number of a token, or an Italian error string. */
function numberOf(token: string, spec: FieldSpec): number | string {
  const named = spec.names[token.toLowerCase()];
  if (named === undefined && !/^\d+$/.test(token)) {
    return `${spec.label}: «${token}» non è un valore valido.`;
  }
  const value = named ?? Number(token);
  if (value < spec.low || value > spec.high) {
    return `${spec.label}: ${value} è fuori da ${spec.low}–${spec.high}.`;
  }
  return value;
}

function fieldError(text: string, spec: FieldSpec): string | null {
  for (const part of text.split(',')) {
    const slash = part.indexOf('/');
    const base = slash === -1 ? part : part.slice(0, slash);
    if (slash !== -1) {
      const step = part.slice(slash + 1);
      if (!/^\d+$/.test(step) || Number(step) < 1) {
        return `${spec.label}: passo non valido in «${part}».`;
      }
    }
    if (base === '*') continue;
    if (base.includes('-')) {
      const dash = base.indexOf('-');
      const first = numberOf(base.slice(0, dash), spec);
      if (typeof first === 'string') return first;
      const last = numberOf(base.slice(dash + 1), spec);
      if (typeof last === 'string') return last;
      if (first > last) return `${spec.label}: l'intervallo «${base}» va all'indietro.`;
      continue;
    }
    const single = numberOf(base, spec);
    if (typeof single === 'string') return single;
  }
  return null;
}

/** Italian message for the first thing wrong in a cron expression, or null when it is valid. */
export function cronError(expression: string): string | null {
  const parts = expression.trim().split(/\s+/).filter(Boolean);
  if (parts.length !== 5) {
    return 'Servono 5 campi separati da spazio: minuto, ora, giorno, mese, giorno della settimana.';
  }
  for (let i = 0; i < FIELDS.length; i += 1) {
    const error = fieldError(parts[i]!, FIELDS[i]!);
    if (error) return error;
  }
  return null;
}

/** True when a history row was started by the cron of the rule (`trigger_snapshot.kind`). */
export function isCronRun(snapshot: string | null | undefined): boolean {
  if (!snapshot) return false;
  try {
    return (JSON.parse(snapshot) as { kind?: unknown }).kind === 'cron';
  } catch {
    return false;
  }
}
