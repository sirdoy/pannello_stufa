# Phase 117: Dead Code & Cleanup - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove 48 unused utility exports identified by knip, resolve the notificationService.ts TODO (cleanup already migrated to API route), and resolve the healthMonitoring.ts TODO (implement STARTING state grace period tracking). This is the final phase of v14.1 Tech Debt & Type Safety.

</domain>

<decisions>
## Implementation Decisions

### Unused export removal (CLEAN-01)
- **D-01:** Run knip to get the current list of unused exports — the "48" count may have shifted after phases 113-116
- **D-02:** Remove only the export keyword if the function/constant is used internally; delete entirely if nothing references it
- **D-03:** If removing an export leaves a file empty, delete the file and remove its import from any barrel index
- **D-04:** Design system barrel exports (131) are explicitly OUT OF SCOPE — intentional public API surface

### notificationService cleanup (CLEAN-02)
- **D-05:** Delete the entire disabled block (lines ~482-513) including the TODO comment — the migration is already complete
- **D-06:** The existing `/api/notifications/cleanup` route + `tokenCleanupService.ts` already handles token cleanup via Admin SDK — no new code needed
- **D-07:** Add a brief JSDoc note at the top of notificationService.ts referencing `/api/notifications/cleanup` for token lifecycle management

### healthMonitoring STARTING grace period (CLEAN-03)
- **D-08:** Store STARTING entry timestamp in Firebase RTDB at `health/stoveStarting/{userId}` — written by the health check cron when stove state is first observed as STARTING
- **D-09:** Grace period logic: if `now - entryTime < GRACE_PERIOD_MS (15 min)` → return null (no alert); if `>= 15 min` AND still STARTING → flag as mismatch
- **D-10:** Clean up the Firebase key when stove state leaves STARTING (transitions to ON, OFF, or ALARM)
- **D-11:** Use `adminDbGet`/`adminDbSet` (Admin SDK) for reading/writing the timestamp — consistent with existing health monitoring patterns
- **D-12:** If no entry timestamp exists and state is STARTING → write current timestamp and return null (first observation, start grace period)

### Claude's Discretion
- Exact knip configuration or CLI flags
- Whether to batch export removals by file or by domain area
- Error handling for Firebase read/write in grace period tracking
- Whether the grace period key cleanup happens inline or as a separate step

</decisions>

<specifics>
## Specific Ideas

- Phase 48 (v5.1) used knip for the same purpose — reuse that approach
- `GRACE_PERIOD_MS = 15 * 60 * 1000` is already defined at line 19 of healthMonitoring.ts but unused — wire it up
- The `detectStateMismatch()` function already handles ALARM and error states inline — STARTING grace period follows the same pattern
- `filterUndefined()` should be used for any Firebase writes (project convention)

</specifics>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above.

### Prior art
- `.planning/milestones/v5.1/phases/48-dead-code-removal/` — Phase 48 used knip for dead export removal (203 exports removed)
- `REQUIREMENTS.md` §Dead Code & Cleanup — CLEAN-01, CLEAN-02, CLEAN-03 definitions

### Key source files
- `lib/notifications/notificationService.ts` lines 482-513 — disabled cleanup function to delete
- `lib/health/healthMonitoring.ts` lines 15-19 — GRACE_PERIOD_MS constant, lines 144-149 — TODO to resolve
- `lib/services/tokenCleanupService.ts` — existing Admin SDK cleanup (proves CLEAN-02 migration is done)
- `app/api/notifications/cleanup/route.ts` — existing cleanup API route
- `app/api/health-monitoring/check/route.ts` — health check cron that calls `checkUserStoveHealth()`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `adminDbGet<T>()` / `adminDbSet()`: Typed Firebase Admin SDK operations — use for grace period read/write
- `filterUndefined()`: Firebase write sanitizer — use for any RTDB writes
- `GRACE_PERIOD_MS`: Already defined constant (15 min) — just needs to be wired into logic
- knip: Already in devDependencies from Phase 48

### Established Patterns
- Health monitoring uses `Promise.allSettled()` for parallel data fetching with graceful degradation
- Firebase RTDB paths follow `{domain}/{entity}/{userId}` convention
- Admin SDK operations are in `lib/firebase/firebaseAdmin.ts` with generic typing

### Integration Points
- `detectStateMismatch()` in healthMonitoring.ts — add grace period check before the existing STARTING return
- `checkUserStoveHealth()` — no changes needed, it already calls detectStateMismatch
- Health check cron route — no changes needed, it already evaluates the mismatch result

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 117-dead-code-cleanup*
*Context gathered: 2026-03-22*
