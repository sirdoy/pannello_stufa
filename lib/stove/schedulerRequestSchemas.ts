import { z } from 'zod';

// Request-body schemas for the scheduler/maintenance proxy routes, aligned with
// the backend Pydantic models (../docs/api/scheduler.md). The backend stays the
// authority (overlaps, schedule existence); these reject malformed bodies at
// the trust boundary before the X-API-Key call.

const minutes15 = (max: number) =>
  z.number().int().min(0).max(max).refine((m) => m % 15 === 0, 'Orario non allineato ai 15 minuti');

// Bundles built before T6 still send power / fan: map them to power_level / fan_level
// (the only names forwarded to the backend). Remove with the backend aliases (T6 R).
const withLevelNames = (raw: unknown): unknown => {
  if (raw === null || typeof raw !== 'object') return raw;
  const { power, fan, ...rest } = raw as Record<string, unknown>;
  return { power_level: power, fan_level: fan, ...rest };
};

export const slotSchema = z
  .preprocess(
    withLevelNames,
    z.object({
      start_minutes: minutes15(1439),
      end_minutes: minutes15(1440),
      power_level: z.number().int().min(1).max(5),
      fan_level: z.number().int().min(1).max(6),
    })
  )
  .refine((s) => s.start_minutes < s.end_minutes, 'Inizio deve precedere la fine');

export const daySlotsBody = z.object({ slots: z.array(slotSchema) }).strict();

export const weekBody = z
  .object({
    days: z.record(z.string().regex(/^[0-6]$/, 'Giorno non valido'), z.array(slotSchema)),
  })
  .strict();

export const createScheduleBody = z
  .object({
    name: z.string().trim().min(1).max(64).optional(),
    copy_from_id: z.number().int().positive().optional(),
  })
  .strict();

export const patchScheduleBody = z
  .object({
    name: z.string().trim().min(1).max(64).optional(),
    enabled: z.boolean().optional(),
  })
  .strict();

export const modeBody = z.object({ enabled: z.boolean() }).strict();

export const overrideBody = z
  .object({ return_to_auto_at: z.number().int().positive() })
  .strict();

export const maintenancePatchBody = z
  .object({
    target_hours: z.number().positive().max(10000).optional(),
    current_hours: z.number().min(0).max(100000).optional(),
    last_cleaned_at: z.number().int().min(0).optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, 'Nessun campo da aggiornare');

/** Positive integer path id, or null. */
export function parseId(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return id > 0 ? id : null;
}

/** Day 0 (Monday) .. 6 (Sunday), or null. */
export function parseDay(raw: string | undefined): number | null {
  return raw && /^[0-6]$/.test(raw) ? Number(raw) : null;
}

export function zodMessage(error: z.ZodError): string {
  return error.issues.map((i) => i.message).join(', ');
}
