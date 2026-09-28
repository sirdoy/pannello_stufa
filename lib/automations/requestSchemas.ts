import { z } from 'zod';

// Request-body schemas for the automation routes, aligned with the backend
// Pydantic models (AutomationRuleCreate / AutomationRulePatch in
// docs/api/automations.types.ts). The discriminated unions inside
// condition/actions stay the backend's job: here we only require a node
// object with a string `type`, so malformed bodies fail fast with a 400
// instead of a round-trip to the Pi.

const nodeSchema = z.object({ type: z.string().min(1) }).passthrough();

const hhmmSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Orario non valido (formato HH:MM)')
  .nullable()
  .optional();

const schedulingFields = {
  description: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
  min_interval_seconds: z.number().int().min(0).optional(),
  max_triggers_per_hour: z.number().int().min(0).optional(),
  active_hours_start: hhmmSchema,
  active_hours_end: hhmmSchema,
};

// POST: condition and at least one action are required by the backend.
// `.passthrough()` keeps future API additions flowing without a schema bump.
export const automationCreateSchema = z
  .object({
    name: z.string().min(1).max(128),
    trigger: nodeSchema.nullable().optional(),
    condition: nodeSchema,
    actions: z.array(nodeSchema).min(1, 'Serve almeno un\'azione'),
    ...schedulingFields,
  })
  .passthrough();

// PATCH: every field optional. No `trigger` (immutable after creation) and
// `.strict()` rejects unknown keys: this route is the trust boundary before
// the X-API-Key call to the backend.
export const automationPatchSchema = z
  .object({
    name: z.string().min(1).max(128).optional(),
    condition: nodeSchema.optional(),
    actions: z.array(nodeSchema).optional(),
    ...schedulingFields,
  })
  .strict();
