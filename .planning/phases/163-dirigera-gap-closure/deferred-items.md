# Deferred Items — Phase 163

Pre-existing tsc errors unrelated to this phase (DIRIGERA gap closure). Documented here for future phases.

## Out-of-scope tsc errors (observed during phase 163-01 execution)

- `app/api/v1/automations/route.ts:24:56` — TS2345: `Record<string, unknown>` not assignable to `AutomationCreate`.
- `app/api/v1/thermorossi/settings/fan-level/route.ts:14:19` — TS2345: handler return type `Promise<Response>` not assignable to `Promise<NextResponse<unknown>>`.
- `app/api/v1/thermorossi/settings/power/route.ts:14:19` — Same as above.
- `app/api/v1/thermorossi/settings/temperature/water/route.ts:14:19` — Same as above.

These errors exist in files untouched by Phase 163 and were present before any phase 163 edits. They belong to a separate cleanup phase.
