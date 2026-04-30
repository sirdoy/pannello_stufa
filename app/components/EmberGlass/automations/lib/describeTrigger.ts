import type { TriggerType } from '@/types/automations';

/**
 * Returns the trigger pill string (Italian) for AutomationRow.
 * D-21: schedule_cron => "⏰ {cron}", manual_api_call => "Manuale", null => "Manuale"
 */
export function describeTrigger(trigger: TriggerType | null | undefined): string {
  if (!trigger) return 'Manuale';
  switch (trigger.type) {
    case 'schedule_cron':
      return `⏰ ${trigger.cron_expression}`;
    case 'manual_api_call':
      return 'Manuale';
    // No assertNever here — TS narrows to never naturally; we want a safe runtime fallback
    // for forward-compat if backend ever adds a new trigger type before frontend updates.
  }
  return 'Manuale';
}
