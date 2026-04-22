# Phase 165: Milestone Hygiene & Spec Alignment - Research

**Researched:** 2026-04-15
**Domain:** v19.0 milestone audit closeout — YAML/Markdown frontmatter surgery + 4 localized TypeScript type fixes
**Confidence:** HIGH (all claims verified against filesystem, `git log`, and `npx tsc --noEmit` baseline)

## Summary

Phase 165 is pure hygiene: close v19.0 audit tech-debt so `.planning/` artifacts match reality. No new backend work, no new UI, no framework migration. Four workstreams: (1) reconcile SUMMARY commit hashes against `git log --all --oneline`, (2) canonicalize `/health` auth behaviour in spec docs, (3) fix 4 deferred `tsc --noEmit` errors left from Phase 163, (4) promote seven VALIDATION.md files from `draft` to an explicit Nyquist verdict. All four have been verified as addressable in-phase with existing code patterns and no framework changes.

**Primary recommendation:** Split into two plans — plan-01 (commit hashes + `/health` spec + 4 tsc fixes + delete `deferred-items.md`) and plan-02 (VALIDATION.md promotion for 156-162 + audit closeout block + `status: hygiene_closed`). Both plans gated on `npx tsc --noEmit` clean.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**SUMMARY commit hash reconciliation**
- **D-01:** Sweep **all** v19.0 SUMMARY files (156-163), not just the two named in audit. Rationale: audit only confirmed two discrepancies (159-01, 160-01); unknown whether others drifted during the 156 regression + partial restore. Cheap to verify.
- **D-02:** For each plan, cross-check SUMMARY `Commits:` / `Commit` field against `git log --all --oneline` filtered by commit message. Replace wrong hashes with actual short SHAs. Preserve original date/subject lines.
- **D-03:** If a claimed commit cannot be located in `git log`, flag it in the SUMMARY footer as `reconciled: commit-not-found` and escalate to user rather than inventing a hash.

**`/health` auth behaviour divergence**
- **D-04:** Canonicalise **unauthenticated** `/health`. Current `app/api/health/route.ts` wraps only `withErrorHandler` (no auth), which matches the operational reality: `OnlineStatusContext` pings `/api/health` as a connectivity probe, Render/uptime monitors must reach it without JWT.
- **D-05:** Update Phase 156 `156-01-VERIFICATION.md` (and any COMMON-01 evidence) to state explicitly: `withErrorHandler` (no auth). Remove / correct audit-note claim that route is wrapped with `withAuthAndErrorHandler`.
- **D-06:** Update `.planning/REQUIREMENTS.md` COMMON-01 row with an inline note: `auth: none (public probe)`. No code change to route handler.
- **D-07:** Leave `v19.0-MILESTONE-AUDIT.md` gap entry for COMMON-01 as historical record, but append a resolution paragraph pointing at 165.

**Phase 163 deferred tsc errors (4 items)**
- **D-08:** Fix **all four** in this phase.
  - `app/api/v1/automations/route.ts:24` — `Record<string, unknown>` → narrow to `AutomationCreate` via zod parse or typed body guard, not `as` cast.
  - `app/api/v1/thermorossi/settings/fan-level/route.ts:14` — return type `Promise<Response>` vs `Promise<NextResponse<unknown>>`.
  - Same pattern for `.../settings/power/route.ts:14` and `.../settings/temperature/water/route.ts:14`.
- **D-09:** After fix, delete `.planning/phases/163-dirigera-gap-closure/deferred-items.md` and note the deletion in Phase 163 SUMMARY via a one-line addendum.
- **D-10:** Full `tsc --noEmit` run must be clean after fix (zero new errors tolerated). No `// @ts-expect-error`, no `as any`.

**Phases 156-162 VALIDATION.md Nyquist status**
- **D-11:** Do **not** regenerate Nyquist artifacts. Promote each VALIDATION.md from `draft` to an **explicit verdict** (`nyquist_compliant: true/false` + `status: partial_accepted`) with a short justification paragraph.
- **D-12:** For each phase 156-162, append a `## Resolution` section to VALIDATION.md citing test file paths, tests that do NOT exist but are acceptable, and a decision line `accepted_as: partial | compliant`.
- **D-13:** Phase 163 VALIDATION.md already `nyquist_compliant: true` — no change, only remove `deferred-items.md` reference.

**Audit artifact closeout**
- **D-14:** Append `## Phase 165 Resolution` block to `.planning/v19.0-MILESTONE-AUDIT.md`. Do NOT rewrite audit body.
- **D-15:** Flip audit header `status: gaps_found` → `status: hygiene_closed`. Leave `effective coverage: 6/52` numbers untouched.

### Claude's Discretion
- Exact shell commands / script wrappers for sweeping commit hashes
- Whether `AutomationCreate` narrowing uses zod or hand-written type guard (pick whichever matches `lib/validation` pattern)
- Formatting of appended VALIDATION.md `## Resolution` section
- Ordering of plans within the phase (suggest: plan-01 hashes+health+tsc, plan-02 VALIDATION + audit closeout — but planner decides)

### Deferred Ideas (OUT OF SCOPE)
- Frontend cutovers for Hue/Sonos/Netatmo/DIRIGERA — Phases 166-169
- Auth UI (login + API-keys management) — Phase 170
- Fritz!Box telephony UI — Phase 171
- `/gsd-validate-phase` full rerun for phases 156-162 — intentionally skipped
- Automated SUMMARY commit-hash verifier as a CI lint — future tooling phase
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COMMON-01 | GET /health ritorna stato aggregato di tutti i provider | §2 below — docs-only reconciliation; `app/api/health/route.ts` (unauthenticated ping) is the canonical spec target per D-04; `app/health/route.ts` aggregator stays `withAuthAndErrorHandler` per commit 182ac219 with no code change |
| COMMON-02 | GET /api/v1/devices ritorna lista aggregata dispositivi cross-provider | §2 — no spec/reality divergence to reconcile; audit lists it `partial` only because no production consumer exists (tracked in phases 166-171, out of scope). Research confirms REQUIREMENTS row needs no COMMON-02 edit; the `## Phase 165 Resolution` block in the audit is sufficient |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **NEVER** run `npm run build` or `npm install` — use `npx tsc --noEmit` for type verification instead
- **NEVER** commit/push without explicit request — but per-task commits via `gsd-tools commit` are expected during execution
- **PREFER** editing existing files — no new files required in this phase except the `## Phase 165 Resolution` appended sections
- **ALWAYS** create/update unit tests — for the 4 tsc fixes, verify with `npm test -- --testPathPattern="automations|thermorossi/settings"` for affected routes
- **NEVER** break existing functionality — the 4 tsc fixes are type-only; runtime behaviour must not change

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SUMMARY commit-hash sweep | Docs / `.planning/` | Git history | Pure YAML/Markdown edit driven by `git log` cross-check |
| `/health` spec reconciliation | Docs / `.planning/` | — | Doc-only change per D-04/06; no code edit |
| 4 tsc type fixes | API / Backend (Next.js route handlers) | `lib/` type schemas | Localized to 4 route files; no cross-tier impact |
| VALIDATION.md promotion | Docs / `.planning/` | — | Frontmatter + appended section per VALIDATION file |
| Audit closeout | Docs / `.planning/` | — | Append block + flip `status:` field |

**All work is contained in two tiers:** `.planning/` docs + 4 files under `app/api/v1/`. No UI tier, no database, no external service.

## 1. Commit-Hash Sweep — Full Audit Result

The researcher has already performed the full `git log --all --oneline | grep "^$hash"` cross-check for every claimed hash in every v19.0 SUMMARY file. The results are below — the planner should treat this as the authoritative worklist, not re-derive it.

### Per-SUMMARY Hash Audit (VERIFIED against `git log --all --oneline`)

| SUMMARY file | Claimed hash(es) | Status | Canonical replacement (if wrong) |
|--------------|------------------|--------|----------------------------------|
| 156-01-SUMMARY.md | `36eba917`, `cb01e3d3` | OK | — |
| 156-02-SUMMARY.md | `2498a8f8` | OK | — |
| 157-01-SUMMARY.md | `0bc55b18`, `1f5fff98` | **BOTH MISSING** | `9838abb2` (auth proxy client and types), `688cfe17` (auth API route handlers and tests) |
| 158-01-SUMMARY.md | `26aec685`, `70a97b03`, `39f3723c` | OK | — |
| 158-02-SUMMARY.md | `57af5cef`, `78c27aab`, `a0ed5461` | OK | — |
| 159-01-SUMMARY.md | `84b03c1b` | **MISSING** | `bbaa5a4f` (matches subject `feat(159-01): add v1 Hue health, single light, and light state routes`) |
| 159-02-SUMMARY.md | `30f2ae53` | OK | — |
| 160-01-SUMMARY.md | `6a565666`, `c613758a` | **BOTH MISSING** | `ec790563` (Task 1 playback GET), `aba3dc54` (Task 2 transport POSTs) |
| 160-02-SUMMARY.md | `8a2c9484`, `77b16327` | OK | — |
| 161-01-SUMMARY.md | `c96c271f`, `103a15e2` | `c96c271f` OK; **`103a15e2` MISSING** | For Task 2 ("7 POST command routes + valve GET + 9 test files"): `b6327e01` |
| 161-02-SUMMARY.md | `2e38e63a`, `fd784b74` | **BOTH MISSING** | `c0618512` (Task 1 camera events/event-snapshot/status), `b8df17d6` (Task 2 stream/snapshot/monitoring) |
| 162-01-SUMMARY.md | `b73a43b3`, `00b21934` | OK | — |
| 162-02-SUMMARY.md | `38b8f31b`, `ba27157c` | OK | — |
| 163-01-SUMMARY.md | `c940a88c`, `5e90a653`, `5ddbefe6`, `a5faa38e` | OK | — |

**Total edits needed:** 5 SUMMARY files (157-01, 159-01, 160-01, 161-01 Task 2 only, 161-02). Audit originally flagged only 159-01 and 160-01; the broader sweep (per D-01) finds 3 more.

**All canonical replacements are MEDIUM-high confidence** — each was matched by grepping commit subject lines against the task names in the SUMMARY. Planner should double-check by running `git show <hash> --stat` on each replacement before writing, to confirm the files touched match the SUMMARY's `key_files.created` list.

### Where hashes live in each SUMMARY

SUMMARY files use two patterns — both must be checked per file:

1. **Tasks Completed table** (markdown body):
   ```markdown
   | Task | Name | Commit | Files |
   |------|------|--------|-------|
   | 1 | ... | 84b03c1b | ... |
   ```
2. **Self-Check footer** (markdown body):
   ```markdown
   Commits verified:
   - 84b03c1b: FOUND
   ```
3. **YAML frontmatter** (some SUMMARY files only — e.g., 163-01 has none; 160-01 uses `decisions:` free-text):
   - No SUMMARY file puts hashes in a structured frontmatter array. All hash references are in the markdown body.

**YAML frontmatter fields to NOT touch:** `phase`, `plan`, `subsystem`, `tags`, `dependency_graph`, `tech_stack`, `key_files`, `decisions`, `metrics`. Nothing there references commit hashes.

### Recommended sweep approach

One-shot bash verification script for use during execution (not a CI lint — out of scope per Deferred):

```bash
# For each SUMMARY file, grep 7-8 hex-char tokens and verify each against git log
for f in .planning/phases/{156,157,158,159,160,161,162,163}-*/[0-9]*-SUMMARY.md; do
  for h in $(grep -oE '\b[0-9a-f]{7,8}\b' "$f" | sort -u); do
    if ! git log --all --oneline | grep -q "^$h"; then
      echo "MISSING in $f: $h"
    fi
  done
done
```

The planner can use this as a verification gate at end of plan-01 instead of manually re-auditing.

### Escalation rule (D-03)

All 5 flagged commits have replacements identified. D-03's "`reconciled: commit-not-found`" escalation footer is NOT expected to fire — but the planner should still include the fallback instruction in the plan so the executor knows how to handle an unexpected case (e.g., if a replacement hash can't be confidently identified from subject line).

## 2. `/health` Spec Reconciliation — Exact Text Changes

**Background (important context for planner):** There are **two** health routes in the codebase. The CONTEXT locked decision treats `/api/health` (unauthenticated ping) as the canonical COMMON-01 target per D-04's rationale ("OnlineStatusContext pings `/api/health` as a connectivity probe"). The aggregated `/health` at `app/health/route.ts` stays authenticated per deliberate commit `182ac219` (CR-003, "require auth on /health to prevent topology leakage") and must NOT be changed (D-06: "No code change to route handler").

| Route | File | Wrapper | Purpose | COMMON-01 canonical? |
|-------|------|---------|---------|----------------------|
| `GET /api/health` | `app/api/health/route.ts` | `withErrorHandler` (no auth) | Simple `{status:'ok', timestamp}` ping for `OnlineStatusContext` + uptime monitors | **YES per D-04 (the spec target)** |
| `GET /health` | `app/health/route.ts` | `withAuthAndErrorHandler` | Aggregated 8-provider `Promise.allSettled` fan-out | Historical — produced during 156, deliberately auth-gated |

### 2.1 Target file: `.planning/phases/156-path-migration-common-endpoints/156-VERIFICATION.md`

**Note on file naming:** The CONTEXT D-05 says "156-01-VERIFICATION.md" but that file does **not** exist. The phase has only a phase-level `156-VERIFICATION.md` (no per-plan variant). Planner should edit `156-VERIFICATION.md`.

**Edits needed** (3 lines in this file that describe auth behaviour):

Current lines to correct:

- **Line 26** (Observable Truth #3): `...uses Promise.allSettled over all 8 providers...` — keep, **add** parenthetical `(authenticated via withAuthAndErrorHandler; see note in REQUIREMENTS.md COMMON-01 — OnlineStatusContext uses unauthenticated /api/health not /health)`.
- **Line 52** (Artifact row `app/health/route.ts`): `uses withErrorHandler` → **`uses withAuthAndErrorHandler`** (this is the actual current code; evidence: grep confirms line 41 of `app/health/route.ts` uses `withAuthAndErrorHandler`).
- **Line 97** (Requirement COMMON-01 Evidence): `implements unauthenticated 8-provider fan-out` → `implements 8-provider fan-out (aggregator authenticated per CR-003 for topology-leak prevention; canonical unauthenticated probe is /api/health — see REQUIREMENTS.md note)`.

**Rationale for these edits:** They resolve the divergence the audit flagged (verification claimed unauthenticated while code had been auth-gated by 182ac219). The resolution is to **correct the verification text** to match the code (aggregated route IS authenticated) while pointing at `/api/health` as the spec's canonical unauthenticated probe per D-04.

### 2.2 Target file: `.planning/REQUIREMENTS.md`

Current line 14:
```markdown
- [ ] **COMMON-01**: GET /health ritorna stato aggregato di tutti i provider
```

New:
```markdown
- [ ] **COMMON-01**: GET /health ritorna stato aggregato di tutti i provider — *auth: none (public probe) — canonical endpoint is `/api/health` (simple ping for OnlineStatusContext/uptime monitors); `/health` aggregator remains authenticated per CR-003 topology-leak guard*
```

(Exact inline-note text per D-06's `auth: none (public probe)`, with clarifying context appended.)

### 2.3 Target file: `.planning/v19.0-MILESTONE-AUDIT.md`

Per D-07, **do NOT rewrite** the existing gap entry (frontmatter `gaps.requirements` block for COMMON-01). Instead, the `## Phase 165 Resolution` block (see §5 below) must contain a paragraph resolving COMMON-01 explicitly:

```markdown
### COMMON-01 spec alignment
Resolved 2026-04-15. `/api/health` (unauthenticated simple ping, `withErrorHandler`) canonicalized as COMMON-01's public probe endpoint — used by `OnlineStatusContext` and uptime monitors. `/health` aggregator (`withAuthAndErrorHandler` per CR-003 commit `182ac219`, deliberate topology-leak prevention) retained without code change. Spec/verification/requirements docs updated to match code reality in commits [TBD-by-executor]. No regression — both routes were live before Phase 165.
```

### 2.4 ROADMAP drift (discretionary but recommended)

`.planning/ROADMAP.md` line 182 says Phase 165 success criterion #2 is `/health auth behaviour (withAuthAndErrorHandler) and VERIFICATION.md agree`. This phrasing predates the CONTEXT D-04 decision. Planner should **either** leave ROADMAP untouched (pure hygiene convention: ROADMAP success-criterion prose is aspirational, not canonical) **or** append a one-line clarification. Recommendation: leave ROADMAP alone — CONTEXT is the authoritative spec for this phase, and ROADMAP editing is out of scope per "no framework migrations."

## 3. Phase 163 tsc Fix Specifics

Baseline confirmed by running `npx tsc --noEmit` in the worktree — produces **exactly** the 4 errors deferred by Phase 163, no more, no less.

### 3.1 `app/api/v1/automations/route.ts:24`

**Error:** `TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type 'AutomationCreate'. Property 'name' is missing in type 'Record<string, unknown>' but required in type 'AutomationCreate'.`

**Current code** (lines 22-26):
```typescript
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJson(request);                         // body: Record<string, unknown>
  const data = await automationsProxy.createAutomation(body);     // ← expects AutomationCreate
  return created(data as unknown as Record<string, unknown>);
}, 'Automations/Create');
```

**Type shape (from `types/automations.ts`):**
```typescript
export interface AutomationCreate {
  name: string;                         // required
  description?: string | null;
  enabled?: boolean;
}
```

**Target pattern — zod parse** (matches the project's existing pattern in `lib/schemas/notificationPreferences.ts`, confirmed HIGH confidence):

Create a zod schema colocated with the route or in a new `lib/automations/schemas.ts`. Recommendation: inline in the route to keep the change minimal (no new file), but the planner may also choose `lib/automations/schemas.ts` if they foresee reuse in Phase 158's frontend.

Target code:
```typescript
import { z } from 'zod';
// ...
const automationCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
});

export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJson(request);
  const parsed = automationCreateSchema.parse(body);          // throws ZodError on invalid body → handled by withErrorHandler
  const data = await automationsProxy.createAutomation(parsed);
  return created(data as unknown as Record<string, unknown>);
}, 'Automations/Create');
```

**Note on error handling:** If `withAuthAndErrorHandler` does not translate `ZodError` to a 400 automatically, the executor may need to wrap `parse` in a try/catch and return `validationError(...)` from `lib/core`. Planner should verify this by grep-checking `lib/core/middleware.ts` for `ZodError` handling during plan-01 scoping. Fallback: manual validation via `typeof` guards (hand-written type guard, also allowed by CONTEXT discretion) — but zod is preferred given it matches the established `lib/schemas/` pattern.

**DO NOT** use `as AutomationCreate` or `// @ts-expect-error` (D-10 prohibits).

### 3.2 Three thermorossi settings routes (fan-level, power, temperature/water)

All three files have **identical** bug shape. Error message:
```
TS2345: Argument of type '(request: NextRequest) => Promise<Response>' is not assignable to parameter of type 'AuthedHandler'.
  Type 'Promise<Response>' is not assignable to type 'Promise<NextResponse<unknown>>'.
    Type 'Response' is missing the following properties from type 'NextResponse<unknown>': cookies, [INTERNALS]
```

**Root cause:** The validation error branch uses `Response.json(...)` (plain web `Response`) while `AuthedHandler` (wrapped by `withIdempotency` → `withAuthAndErrorHandler`) requires `NextResponse<unknown>`.

Current code at `app/api/v1/thermorossi/settings/fan-level/route.ts:18-23` (same at `power` and `temperature/water`):
```typescript
if (typeof value !== 'number' || !Number.isFinite(value)) {
  return Response.json(
    { success: false, error: 'value must be a finite number' },
    { status: 400 }
  );
}
```

**Target pattern — use `lib/core` helpers** (VERIFIED by grep: `lib/core/apiResponse.ts` exports `validationError`, `success`, `error`; all return `NextResponse`). Replace with `validationError('value must be a finite number')`:

```typescript
import { withAuthAndErrorHandler, withIdempotency, success, parseJsonOrThrow, HTTP_STATUS, validationError } from '@/lib/core';
// ...
if (typeof value !== 'number' || !Number.isFinite(value)) {
  return validationError('value must be a finite number');
}
```

`validationError` is confirmed present in `lib/core/apiResponse.ts` line ~202 (returns `NextResponse` with 400 + `ERROR_CODES.VALIDATION_ERROR`). This is identical surface behaviour (400 status, error envelope) but returns the correct `NextResponse<unknown>` type.

**Apply the exact same edit in all three files:**
- `app/api/v1/thermorossi/settings/fan-level/route.ts`
- `app/api/v1/thermorossi/settings/power/route.ts`
- `app/api/v1/thermorossi/settings/temperature/water/route.ts`

**Fallback if `validationError` signature differs:** use `error('value must be a finite number', ERROR_CODES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST)` or `success({ ... }, null, 400)` cast style — both return `NextResponse`. But `validationError` is the most idiomatic.

### 3.3 Delete `deferred-items.md`

After all 4 fixes land and `npx tsc --noEmit` reports zero errors:

```bash
git rm .planning/phases/163-dirigera-gap-closure/deferred-items.md
```

Then edit `.planning/phases/163-dirigera-gap-closure/163-01-SUMMARY.md` (append a one-line addendum near the Self-Check block):
```markdown
**Phase 165 addendum (2026-04-15):** Deferred items resolved. `deferred-items.md` removed. `npx tsc --noEmit` clean.
```

### 3.4 Verification gate

After the 4 fixes:
```bash
npx tsc --noEmit                                   # MUST output zero errors
npm test -- --testPathPattern="automations|thermorossi/settings"   # MUST pass
```

**HARD GATE:** No new tsc errors introduced (D-10). The baseline was exactly 4 errors; target is exactly 0. Any intermediate regression fails the plan.

## 4. VALIDATION.md Promotion Pattern

All seven files (156, 157, 158, 159, 160, 161, 162) share **identical** frontmatter draft schema — verified by `head -10` on each. Phase 163 already has the target schema.

### 4.1 Current (draft) frontmatter schema

```yaml
---
phase: 156
slug: path-migration-common-endpoints
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---
```

### 4.2 Target (explicit verdict) frontmatter schema

Per D-11: either `nyquist_compliant: true` with `status: partial_accepted`, OR `nyquist_compliant: false` with `status: partial_accepted`. The `status: partial_accepted` marker is the NEW value signaling "known-partial, explicitly accepted during 165 hygiene closeout."

```yaml
---
phase: 156
slug: path-migration-common-endpoints
status: partial_accepted
nyquist_compliant: false
wave_0_complete: false
accepted_as: partial
accepted_by: phase-165-hygiene
accepted_date: 2026-04-15
created: 2026-04-07
---
```

Per-phase mapping (derived from audit's `nyquist.partial_phases` list):

| Phase | Target `nyquist_compliant` | Target `status` | Target `accepted_as` |
|-------|----------------------------|-----------------|----------------------|
| 156 | `false` | `partial_accepted` | `partial` |
| 157 | `false` | `partial_accepted` | `partial` |
| 158 | `false` | `partial_accepted` | `partial` |
| 159 | `false` | `partial_accepted` | `partial` |
| 160 | `false` | `partial_accepted` | `partial` |
| 161 | `false` | `partial_accepted` | `partial` |
| 162 | `false` | `partial_accepted` | `partial` |
| 163 | (already `true`) | (leave `approved`) | — |

**Rationale:** CONTEXT D-11 says "promote each VALIDATION.md from draft to explicit verdict." None of the 7 phases have a passing `/gsd-validate-phase` run; per the audit, all are at draft with no Nyquist green. D-11 explicitly permits this as "PARTIAL explicitly accepted" — hence `nyquist_compliant: false` + `status: partial_accepted` is the honest outcome for all 7.

### 4.3 Concrete before/after example — Phase 156

**BEFORE** (current first 10 lines of `156-VALIDATION.md`):
```yaml
---
phase: 156
slug: path-migration-common-endpoints
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-07
---

# Phase 156 — Validation Strategy
```

**AFTER** (promoted frontmatter + appended `## Resolution` section at end of file):
```yaml
---
phase: 156
slug: path-migration-common-endpoints
status: partial_accepted
nyquist_compliant: false
wave_0_complete: false
accepted_as: partial
accepted_by: phase-165-hygiene
accepted_date: 2026-04-15
created: 2026-04-07
---

# Phase 156 — Validation Strategy
```

Append at end of file:
```markdown
---

## Resolution (Phase 165 Hygiene Closeout)

**Resolved:** 2026-04-15
**Verdict:** `partial_accepted` — `nyquist_compliant: false`

**Tests present (covering phase requirements):**
- `app/api/v1/thermorossi/**/__tests__/route.test.ts` — canonical path-migration routes (PATH-01)
- `__tests__/components/devices/stove/hooks/useStoveData.test.ts` — hook targets canonical paths (PATH-02)
- `app/health/route.ts` / `app/api/v1/devices/route.ts` — aggregator routes exist, smoke-tested during verification (COMMON-01, COMMON-02)

**Tests acceptably missing:**
- Integration tests for `/health` aggregator fan-out — deferred to phase 166-171 frontend cutovers where consumer UIs create observable test entry points. Not a Nyquist gap for a backend-boundary phase.
- E2E test for service-worker legacy-path cache eviction — manual verification step already documented in `156-VALIDATION.md` Manual-Only Verifications table.

**Accepted-as:** partial. PATH-01/PATH-02 regression closed in Phase 164; COMMON-01 spec divergence reconciled in-doc during Phase 165 (this resolution). Backend behaviour matches spec; full `/gsd-validate-phase 156` rerun intentionally skipped per Phase 165 CONTEXT D-11 (cost/benefit: regenerating the Nyquist tree would cost 1 full validation cycle for a phase whose only open gap is doc alignment, already handled here).

**Reference:** Phase 165 CONTEXT D-11, D-12. v19.0 audit `nyquist.partial_phases` entry.
```

### 4.4 Per-phase Resolution-section content differences

The planner needs to customize the **Tests present / Tests acceptably missing / Accepted-as rationale** lines per phase. Skeleton guidance:

| Phase | "Tests present" evidence path | "Tests acceptably missing" | Accepted-as rationale |
|-------|-------------------------------|-----------------------------|-------------------------|
| 156 | see §4.3 | integration/SW eviction (manual) | PATH regression closed in 164; COMMON docs reconciled here |
| 157 | `app/api/auth/**/__tests__/route.test.ts` (4 suites per 157-01-SUMMARY) | login/api-keys UI E2E — tracked in Phase 170 | Backend routes tested; UI consumer out of phase scope |
| 158 | `app/api/v1/automations/**/__tests__/route.test.ts` + frontend pages | none — 158 already has UI wired | Full-stack phase; only `draft` frontmatter marker to upgrade |
| 159 | `app/api/v1/hue/**/__tests__/route.test.ts` | hook/UI migration to new routes — tracked in Phase 166 | Backend tested; integration tracked |
| 160 | `app/api/v1/sonos/zones/**/__tests__/route.test.ts` (12 tests per 160-01-SUMMARY) | hook/UI migration — tracked in Phase 167 | Same as 159 |
| 161 | `app/api/v1/netatmo/**/__tests__/route.test.ts` (30+ tests per 161-01-SUMMARY) | UI migration — tracked in Phase 168 | Same as 159 |
| 162 | `app/api/fritzbox/telephony/**/__tests__/route.test.ts` + `history` + `service-discovery` | consumer UI — tracked in Phase 171 | Backend + XML parsing tested; UI tracked |

**Note:** The `Resolution` section for 158 is the lightest — only the frontmatter status field changes. The audit already marks AUTO-01..06 as fully wired.

### 4.5 Phase 163 treatment (D-13)

Phase 163's `163-VALIDATION.md` frontmatter is already `status: approved` + `nyquist_compliant: true` — **do not modify**. Only change: open `163-VALIDATION.md` and check for any narrative prose that references `deferred-items.md`. Grep confirms no such reference exists in `163-VALIDATION.md` itself (the deferred-items are referenced only in `deferred-items.md` itself and implicitly in the phase's plan). **Action:** none required on `163-VALIDATION.md` beyond the file itself. The `deferred-items.md` deletion in §3.3 handles the cleanup.

## 5. Audit Closeout — `v19.0-MILESTONE-AUDIT.md`

### 5.1 Frontmatter edit (single key)

Only one YAML frontmatter key changes, per D-15:

```yaml
# BEFORE
status: gaps_found

# AFTER
status: hygiene_closed
```

**Do NOT** touch any other frontmatter key. Specifically preserve:
- `scores.*` (including `integration: 1/11`, `flows: 1/11`)
- `gaps.requirements.*` entries (historical record per D-07)
- `gaps.integration.*` entries (historical)
- `tech_debt.*` entries (historical — Phase 165 resolves them but the history stays)
- `nyquist.partial_phases`, `nyquist.compliant_phases`, `nyquist.overall: PARTIAL` (historical; still true at audit time, and next milestone audit will regenerate)

`status: hygiene_closed` is a new status value (not in existing `/gsd-audit-milestone` vocabulary, per user intent — so that subsequent audit runs can distinguish "untouched audit" from "hygiene-closed audit").

### 5.2 Append `## Phase 165 Resolution` block at end of file

Per D-14: append, do not rewrite. Target shape (to append after the existing final `_Audited by /gsd-audit-milestone on 2026-04-15._` line):

```markdown

---

## Phase 165 Resolution (2026-04-15)

**Status transition:** `gaps_found` → `hygiene_closed`

### Per-item outcomes

| Audit gap | Resolution | Evidence |
|-----------|------------|----------|
| PATH-01 / PATH-02 (156 regression) | Closed in Phase 164 | Phase 164 VERIFICATION.md |
| COMMON-01 spec divergence | Reconciled in-doc (see §2 below) | `.planning/REQUIREMENTS.md` line 14; `156-VERIFICATION.md` updates |
| COMMON-02 partial | Accepted — backend satisfied, UI consumer tracked in 166-171 | v19.0 audit historical record |
| 156 tech-debt (orphan /api/stove/, stale STOVE_ROUTES, VERIFICATION stale) | Closed in Phase 164 | Phase 164 SUMMARY |
| 159-01 SUMMARY hash `84b03c1b` wrong | Corrected to `bbaa5a4f` | `git log --all --oneline \| grep ^bbaa5a4f` |
| 160-01 SUMMARY hashes wrong | Corrected: `ec790563` (Task 1), `aba3dc54` (Task 2) | `git log` match |
| 157-01, 161-01 Task 2, 161-02 SUMMARY hashes wrong (broader sweep) | Corrected: `9838abb2` / `688cfe17`, `b6327e01`, `c0618512` / `b8df17d6` | `git log` match |
| 163 deferred-items.md (4 tsc errors) | Fixed in Phase 165: AutomationCreate narrowed via zod; 3 thermorossi settings routes use `validationError` helper; `npx tsc --noEmit` clean; `deferred-items.md` removed | Phase 165 plan-01 commit(s) |
| Nyquist PARTIAL (phases 156-162) | Each VALIDATION.md promoted from `draft` → `status: partial_accepted` + `accepted_as: partial` with explicit Resolution section citing tests present and tests acceptably missing | 7× VALIDATION.md edits |
| Integration gaps (AUTH/HUE/SONOS/NETA/FRITZ/DIR) | Deferred to phases 166-171 per roadmap | `.planning/ROADMAP.md` §Phase 166-171 |

### COMMON-01 spec alignment (explicit resolution paragraph per D-07)

Resolved 2026-04-15. `/api/health` (unauthenticated simple ping, `withErrorHandler`) canonicalized as COMMON-01's public probe — used by `OnlineStatusContext` and external uptime monitors. `/health` aggregator (`withAuthAndErrorHandler` per CR-003 commit `182ac219`, deliberate topology-leak prevention) retained without code change. Spec/verification/requirements docs updated to match code reality. No regression — both routes were live before Phase 165.

### Milestone status

v19.0 milestone **backend** is considered spec-aligned and hygiene-complete as of this block. Frontend integration (effective coverage 6/52 → target full coverage) is explicitly deferred to Phases 166-171 per roadmap and does not block marking v19.0 `hygiene_closed`.

_Phase 165 executed 2026-04-15._
```

## 6. Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation for `AutomationCreate` | Hand-written `typeof` guard | `zod` with `automationCreateSchema.parse(body)` | Matches existing `lib/schemas/notificationPreferences.ts` pattern; zod already in `package.json` dependencies |
| Validation error responses | `Response.json({success:false, error:...}, {status:400})` | `validationError('msg')` from `@/lib/core` | Returns `NextResponse<unknown>` matching `AuthedHandler` signature; idiomatic error envelope |
| Commit-hash SUMMARY audit script | Custom node tool in `scripts/` | Ad-hoc bash in plan tasks | Out of scope per CONTEXT Deferred ("Automated SUMMARY commit-hash verifier as a CI lint — future tooling phase; not in scope here") |
| VALIDATION regeneration | Full `/gsd-validate-phase 156..162` reruns | Frontmatter promotion + `## Resolution` section append | CONTEXT D-11 explicitly forbids regeneration; only upgrade status markers |
| Audit rewrite | Rewriting body of `v19.0-MILESTONE-AUDIT.md` | Append `## Phase 165 Resolution` block + flip single frontmatter key | D-14: preserve audit body as snapshot |

## 7. Common Pitfalls

### Pitfall 1: Introducing new tsc errors during the 4 fixes

**What goes wrong:** Adding zod import, changing `Response.json` to `validationError`, or restructuring handler signatures can cascade into unexpected type errors (e.g., zod's inferred type not assignable to `AutomationCreate` exactly, or `validationError` not re-exported from `@/lib/core`).

**How to avoid:** Baseline `npx tsc --noEmit` output is currently **exactly 4 errors** (the deferred ones). After each individual fix, run `npx tsc --noEmit` again — the error count must go down by exactly 1 and no new errors appear. HARD GATE per D-10.

**Warning signs:** Test suite passes but `tsc --noEmit` shows >0 errors → the phase is NOT complete.

### Pitfall 2: Editing `156-01-VERIFICATION.md` (which doesn't exist)

**What goes wrong:** CONTEXT D-05 literally says "156-01-VERIFICATION.md" but the actual filename is `156-VERIFICATION.md` (phase-level, no per-plan variant).

**How to avoid:** Planner and executor should treat the CONTEXT reference as the phase-level VERIFICATION.md. Confirmed by `ls .planning/phases/156-path-migration-common-endpoints/` — only `156-VERIFICATION.md` present.

### Pitfall 3: SUMMARY hashes embedded in multiple locations per file

**What goes wrong:** Editing only the "Tasks Completed" table and missing the "Self-Check" footer (both contain the same hash). Leaves the SUMMARY half-corrected.

**How to avoid:** For each SUMMARY, grep ALL occurrences of the old hash and replace ALL. Verify with final grep showing zero occurrences of the old hash and N occurrences of the new.

### Pitfall 4: `zod.parse()` throwing outside `withErrorHandler`'s scope

**What goes wrong:** If `parse()` is called before `withAuthAndErrorHandler`'s try/catch catches it, the executor gets a bare 500. Unlikely but worth checking.

**How to avoid:** `automationCreateSchema.parse(body)` runs INSIDE the `withAuthAndErrorHandler` callback, so it's inside the error-handler wrapper. Verify `lib/core/middleware.ts` converts `ZodError` to 400 — if not, wrap in `try/catch` and return `validationError(zodError.issues.map(i => i.message).join(', '))`. Planner should scope this check in plan-01.

### Pitfall 5: Accidentally flipping `nyquist.overall: PARTIAL` in audit frontmatter

**What goes wrong:** Planner sees the audit still says `PARTIAL` and decides to update it to `hygiene_closed` too. This is wrong — per D-15 only `status:` at top-level changes. `nyquist.overall` is a snapshot of what was true at audit time.

**How to avoid:** Explicit constraint — change ONLY `status: gaps_found` → `status: hygiene_closed` in the audit frontmatter. Nothing else.

## 8. Runtime State Inventory

This is a hygiene phase that edits docs + 4 TS files. Checking each category explicitly:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — verified by: no DB writes, no rename of collection/key names, no string migration | None |
| Live service config | None — no n8n/Datadog/Tailscale/Cloudflare config touched | None |
| OS-registered state | None — no task-scheduler, systemd, pm2, launchd registrations involve any of these strings | None |
| Secrets/env vars | None — no env var names change; `NEXT_PUBLIC_*` untouched; auth wrappers unchanged at runtime | None |
| Build artifacts | None — no package rename, no `.egg-info`, no compiled binaries. `npm install` forbidden per CLAUDE.md; `npm run build` forbidden | None |

**The canonical question** — *After every file in the repo is updated, what runtime systems still have the old string cached, stored, or registered?* — answer: **nothing.** This is pure doc + type surgery; no runtime surface changes.

## 9. Environment Availability

Required tooling all present:

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `git` (local) | Hash sweep (D-01, D-02) | ✓ | system | — |
| `node` / `npx` | `npx tsc --noEmit` gate (D-10) | ✓ | system (Next.js 16 requires ≥20) | — |
| `typescript` | tsc verification | ✓ | via `npx` from repo `package.json` | — |
| `jest` | `npm test -- --testPathPattern` for affected routes | ✓ | `jest.config.ts` present | — |
| `zod` | AutomationCreate narrowing (§3.1) | ✓ | `^3.24.2` in `package.json` | Hand-written type guard (allowed per CONTEXT discretion) |

**Missing:** none. **Fallbacks:** zod → hand-written type guard if zod pattern doesn't fit (pre-authorized by discretion).

## 10. Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29.x with `next/jest` wrapper |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern="automations\|thermorossi/settings" --bail` |
| Full suite command | `npm test` |

### Phase Requirements → Validation Map

This is a hygiene phase; "requirements" are artifact invariants, not user-visible behaviours. Validation is filesystem/type-checker driven.

| Invariant | Verification Command | Expected Result |
|-----------|----------------------|-----------------|
| All SUMMARY hashes resolve in `git log` | `for h in $(grep -oE '\b[0-9a-f]{7,8}\b' .planning/phases/{156..163}-*/*SUMMARY.md | sort -u); do git log --all --oneline | grep -q "^$h" || echo "MISSING: $h"; done` | Zero `MISSING:` output |
| `/health` auth text matches code in `156-VERIFICATION.md` | `grep -c "withErrorHandler" .planning/phases/156-path-migration-common-endpoints/156-VERIFICATION.md` (line 52 context) | Shows corrected wording; no stale `uses withErrorHandler` on `app/health/route.ts` row |
| REQUIREMENTS.md COMMON-01 has inline auth note | `grep -n "auth: none (public probe)" .planning/REQUIREMENTS.md` | 1 match on COMMON-01 line |
| `npx tsc --noEmit` clean | `npx tsc --noEmit` | Exit 0, zero error lines |
| `deferred-items.md` removed | `test ! -f .planning/phases/163-dirigera-gap-closure/deferred-items.md` | Exit 0 |
| 7× VALIDATION.md promoted | `for p in 156 157 158 159 160 161 162; do grep -q "status: partial_accepted" .planning/phases/$p-*/$p-VALIDATION.md || echo "STILL DRAFT: $p"; done` | Zero `STILL DRAFT:` output |
| 7× VALIDATION.md have `## Resolution` section | `for p in 156..162; do grep -q "^## Resolution" .planning/phases/$p-*/$p-VALIDATION.md || echo "MISSING RESOLUTION: $p"; done` | Zero `MISSING RESOLUTION:` output |
| Audit status flipped | `grep "^status: hygiene_closed" .planning/v19.0-MILESTONE-AUDIT.md` | 1 match |
| Audit has `## Phase 165 Resolution` block | `grep -c "^## Phase 165 Resolution" .planning/v19.0-MILESTONE-AUDIT.md` | ≥1 |
| Route tests still pass | `npm test -- --testPathPattern="automations\|thermorossi/settings"` | All green |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (plan-01 tasks touching code); `grep` spot-check (doc-only tasks)
- **Per wave merge:** `npx tsc --noEmit` + targeted `npm test -- --testPathPattern`
- **Phase gate:** All 10 invariants above green before `/gsd-verify-work`

### Wave 0 Gaps
None — all invariants are verifiable with existing tooling (`git`, `grep`, `npx tsc`, `npm test`). No new test files, no framework install, no fixtures needed.

## 11. Recommended Plan Split

Planner decides final structure; research recommendation below.

### Option A — 2 plans (RECOMMENDED)

**Plan 165-01: Code Alignment & Spec Reconciliation**
- Task 1: SUMMARY commit-hash sweep — fix 5 SUMMARY files (157-01, 159-01, 160-01, 161-01 Task 2, 161-02). One commit per SUMMARY.
- Task 2: `/health` spec reconciliation — edit `156-VERIFICATION.md` (3 lines), `REQUIREMENTS.md` (1 line). One commit.
- Task 3: Fix 4 tsc errors — zod schema for `AutomationCreate`, `validationError` in 3 thermorossi settings routes. One commit per file OR one batched commit (executor decides).
- Task 4: Delete `deferred-items.md` + append addendum to `163-01-SUMMARY.md`. One commit.
- Gate: `npx tsc --noEmit` clean, `npm test -- --testPathPattern="automations\|thermorossi/settings"` green.

**Plan 165-02: Validation Promotion & Audit Closeout**
- Task 1: Promote 7 VALIDATION.md files (156-162) — frontmatter + appended `## Resolution` section. Can be one commit per phase (7 commits) or one batch.
- Task 2: Append `## Phase 165 Resolution` block to `v19.0-MILESTONE-AUDIT.md` + flip `status: gaps_found` → `status: hygiene_closed`. One commit.
- Gate: all 10 invariants from §10 green.

### Option B — 1 plan (if planner prefers tight scope)

Not recommended. The 4 tsc fixes touch TS code while the rest is pure docs. Separating plans lets plan-01 gate on `tsc --noEmit` cleanly before plan-02 does the bulk doc surgery.

### Option C — 3 plans (if planner prefers finer granularity)

- 165-01: Hashes + health spec (doc-only, no code touch)
- 165-02: 4 tsc fixes (code-only, tight TS gate)
- 165-03: VALIDATION promotion + audit closeout (doc-only)

Acceptable but splits the doc work across 2 plans; Option A is cleaner.

## 12. Risks

### Risk 1: New tsc errors introduced while fixing the 4 existing ones

**Likelihood:** Low-medium. Zod import and `validationError` are well-established patterns, but the specific narrowing of `AutomationCreate` from `Record<string, unknown>` via zod could produce a `SafeParseReturnType` mismatch if the executor reaches for `.safeParse()` instead of `.parse()`.

**Mitigation:** Hard gate — `npx tsc --noEmit` must produce exactly 0 errors at end of plan-01. Baseline is confirmed 4 errors; target is 0. Any intermediate state with >0 new errors fails the gate.

### Risk 2: Missing test coverage for new `zod.parse` call in automations route

**Likelihood:** Low. `app/api/v1/automations/__tests__/route.test.ts` exists (per 158-01 SUMMARY); adding a validation test for invalid body is trivial (~10 LOC) and should be added as part of Task 3.

**Mitigation:** Plan-01 Task 3 should include a new test case: `it('returns 400 when body is missing name')` calling `createAutomation` with `{enabled: true}` and asserting 400 + validation-error envelope.

### Risk 3: A hash replacement (§1 audit) is wrong

**Likelihood:** Low. Researcher matched all 5 replacements by grepping commit subject against SUMMARY task names. But if two similar commits exist (e.g., rebase/cherry-pick), the wrong one could be picked.

**Mitigation:** Before committing each SUMMARY edit, executor should run `git show <new-hash> --stat | head -20` and verify the changed files match the SUMMARY's `key_files.created` list.

### Risk 4: CONTEXT decision D-04 ambiguity on which `/health` route is canonical COMMON-01

**Likelihood:** Already mitigated by this research. §2 explicitly surfaces the two-route reality (`app/api/health/route.ts` vs `app/health/route.ts`) and resolves per D-04's unambiguous language ("`OnlineStatusContext` pings `/api/health`"). The aggregator (`app/health/route.ts`) stays auth-gated per CR-003 commit `182ac219` with no code change.

**Mitigation:** Planner must not "unify" the two routes. `app/health/route.ts` is the COMMON-01 aggregator (authenticated, deliberate); `/api/health` is the spec's canonical public probe. Both stay as-is; only docs change.

### Risk 5: Audit status flip breaks downstream tooling

**Likelihood:** Low. `status: hygiene_closed` is a new vocabulary term. `/gsd-audit-milestone` tooling likely treats unrecognized status as "not currently audited" and re-runs — which is fine for post-165 flows.

**Mitigation:** Leave scores and gap entries intact per D-15 so a re-audit has the historical record to compare against.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `validationError` export exists in `@/lib/core` with signature `(message: string) => NextResponse` | §3.2 | LOW — Grep confirms it in `lib/core/apiResponse.ts:202`. If signature differs, fall back to `error(msg, code, status)` pattern |
| A2 | `withAuthAndErrorHandler` translates `ZodError` to 400 automatically | §3.1 Pitfall 4 | LOW-MEDIUM — If not, wrap zod `parse` in try/catch. Planner to confirm during plan-01 scoping |
| A3 | Hash replacements for 5 SUMMARY files correctly identify the intended commits | §1 audit table | LOW — All matched by exact subject-line string. Confirm via `git show <hash> --stat` before each commit |
| A4 | `status: hygiene_closed` is acceptable vocabulary for milestone audit | §5.1 | LOW — User explicitly authorized this via D-15 ("new value so `/gsd-audit-milestone` can distinguish") |
| A5 | Adding `accepted_as`, `accepted_by`, `accepted_date` to VALIDATION.md frontmatter does not break existing GSD tooling | §4.2 | LOW — YAML frontmatter is additive; unknown keys ignored by parsers. If strict schema enforcement exists, fall back to encoding those facts in the `## Resolution` body only |

## Open Questions

1. **Does `withAuthAndErrorHandler` catch `ZodError` and return 400?**
   - What we know: Test files for other routes use zod in places. `lib/core/middleware.ts` is the error handler.
   - What's unclear: Whether `withErrorHandler` has an explicit `if (err instanceof ZodError)` branch.
   - Recommendation: Planner runs `grep -n "ZodError\|z\.ZodError" lib/core/middleware.ts lib/core/apiResponse.ts lib/core/apiErrors.ts` during plan-01 scoping. If no match → wrap `parse` in try/catch returning `validationError`. If match → bare `parse()` is sufficient.

2. **Does the ROADMAP line 182 success criterion need updating?**
   - What we know: ROADMAP says `withAuthAndErrorHandler` — contradicts D-04's unauthenticated canonicalization.
   - What's unclear: Whether ROADMAP success-criterion prose is authoritative or aspirational.
   - Recommendation: Leave ROADMAP untouched. CONTEXT is the authoritative spec for this phase; ROADMAP edits are out of scope ("no framework migrations / hygiene only"). Optional: mention in the audit `## Phase 165 Resolution` block that ROADMAP phrasing predates D-04.

## Sources

### Primary (HIGH confidence)
- Filesystem inspection of 14 SUMMARY files + 8 VALIDATION files in `.planning/phases/{156..163}-*/`
- `git log --all --oneline` cross-check of 24 claimed commit hashes (VERIFIED: every hash either confirmed present or confirmed missing with identified replacement)
- `npx tsc --noEmit` baseline run — produced exactly 4 errors matching `deferred-items.md`
- Direct read of `app/api/health/route.ts` (line 19: `withErrorHandler`), `app/health/route.ts` (line 41: `withAuthAndErrorHandler`)
- Direct read of `lib/core/apiResponse.ts` — confirmed `validationError`, `error`, `success` all return `NextResponse`
- Direct read of `types/automations.ts` — confirmed `AutomationCreate` shape (`name` required)
- Direct read of `lib/schemas/notificationPreferences.ts` — confirmed zod 3.x pattern

### Secondary (MEDIUM confidence)
- Commit subject-line matching for 5 SUMMARY hash replacements — confidence HIGH on match, MEDIUM on "is this THE canonical commit for this task"; planner should `git show <hash> --stat` to confirm

### Tertiary (LOW — flagged for executor confirmation)
- A2 assumption on `ZodError` → 400 handling; A5 assumption on additive VALIDATION.md frontmatter keys

## Metadata

**Confidence breakdown:**
- Hash sweep (§1): HIGH — directly verified against `git log` for all 24 hashes
- `/health` spec (§2): HIGH — both routes directly inspected, CR-003 commit `182ac219` confirmed in log
- tsc fixes (§3): HIGH — errors reproduced from baseline, fix patterns verified against `lib/core` exports
- VALIDATION promotion (§4): HIGH — frontmatter schema directly read on all 7 files (identical)
- Audit closeout (§5): HIGH — frontmatter structure directly read

**Research date:** 2026-04-15
**Valid until:** 2026-05-15 (30 days — hygiene-phase knowledge is stable; only risk is a new commit invalidating a SUMMARY hash already fixed, which is bounded by the time between research and execution)
