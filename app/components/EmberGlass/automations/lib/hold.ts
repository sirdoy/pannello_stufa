/**
 * Hold rules (workspace ROADMAP D13): a rule with mode "hold" keeps its targets
 * while its condition is true. Mirrors the backend checks so the editor can say
 * what is wrong before the save (docs/api/automations.md#hold-rules).
 */
import type { ActionItem } from '@/types/automations';

/** True when a hold rule can keep this action (valve manual setpoint, stove power / fan). */
export function isHoldable(action: ActionItem): boolean {
  const a = action as unknown as Record<string, unknown>;
  if (a.type === 'netatmo_set_room_temp') return a.mode === 'manual' && typeof a.temp === 'number';
  if (a.type === 'thermorossi') {
    return (
      (a.command === 'set_power' && typeof a.power_level === 'number') ||
      (a.command === 'set_fan' && typeof a.fan_level === 'number')
    );
  }
  return false;
}

export interface HoldEvent {
  hold: 'started' | 'released';
  /** One line per target, in plain words. */
  targets: string[];
}

function describeTarget(target: string): string {
  if (target === 'stove:power') return 'Potenza stufa';
  if (target === 'stove:fan') return 'Ventola stufa';
  if (target.startsWith('netatmo_room:')) return 'Valvola';
  return target;
}

function describeOutcome(outcome: string, ruleId: number): string {
  if (outcome === 'restored') return 'tornata al programma';
  if (outcome === 'scheduler') return 'passata allo scheduler della stufa';
  if (outcome === 'unchanged') return 'già a posto';
  if (outcome.startsWith('held_by:')) {
    const holder = Number(outcome.slice('held_by:'.length));
    return holder === ruleId ? 'impostata da questa regola' : `tenuta dalla regola ${holder}`;
  }
  if (outcome.startsWith('error')) return `errore${outcome.slice('error'.length)}`;
  return outcome;
}

/** Parse the `trigger_snapshot` of a history row; null when it is not a hold event. */
export function parseHoldEvent(snapshot: string | null | undefined, ruleId: number): HoldEvent | null {
  if (!snapshot) return null;
  try {
    const blob = JSON.parse(snapshot) as { hold?: unknown; targets?: Record<string, string> };
    if (blob.hold !== 'started' && blob.hold !== 'released') return null;
    return {
      hold: blob.hold,
      targets: Object.entries(blob.targets ?? {}).map(
        ([target, outcome]) => `${describeTarget(target)}: ${describeOutcome(String(outcome), ruleId)}`
      ),
    };
  } catch {
    return null;
  }
}
