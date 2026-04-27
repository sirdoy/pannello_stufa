# Phase 165: Milestone Hygiene & Spec Alignment - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Close v19.0 audit tech-debt (`.planning/v19.0-MILESTONE-AUDIT.md`) so milestone artifacts reflect reality: SUMMARY commit hashes match `git log`, `/health` auth behaviour is internally consistent, Phase 163 deferred tsc errors are resolved, and Phases 156-162 VALIDATION.md files carry explicit Nyquist verdicts.

**Out of scope:** frontend cutovers (166-170), Auth UI (169), telephony UI (170), new backend work.

</domain>

<decisions>
## Implementation Decisions

### SUMMARY commit hash reconciliation
- **D-01:** Sweep **all** v19.0 SUMMARY files (156-163), not just the two named in audit. Rationale: audit only confirmed two discrepancies (159-01, 160-01); unknown whether others drifted during the 156 regression + partial restore. Cheap to verify.
- **D-02:** For each plan, cross-check SUMMARY `Commits:` / `Commit` field against `git log --all --oneline` filtered by commit message. Replace wrong hashes with actual short SHAs. Preserve original date/subject lines.
- **D-03:** If a claimed commit cannot be located in `git log`, flag it in the SUMMARY footer as `reconciled: commit-not-found` and escalate to user rather than inventing a hash.

### `/health` auth behaviour divergence
- **D-04:** Canonicalise **unauthenticated** `/health`. Current `app/api/health/route.ts` wraps only `withErrorHandler` (no auth), which matches the operational reality: `OnlineStatusContext` pings `/api/health` as a connectivity probe, Render/uptime monitors must reach it without JWT.
- **D-05:** Update Phase 156 `156-01-VERIFICATION.md` (and any COMMON-01 evidence) to state explicitly: `withErrorHandler` (no auth). Remove / correct audit-note claim that route is wrapped with `withAuthAndErrorHandler`.
- **D-06:** Update `.planning/REQUIREMENTS.md` COMMON-01 row with an inline note: `auth: none (public probe)`. No code change to route handler.
- **D-07:** Leave `v19.0-MILESTONE-AUDIT.md` gap entry for COMMON-01 as historical record, but append a resolution paragraph pointing at 165.

### Phase 163 deferred tsc errors (4 items)
- **D-08:** Fix **all four** in this phase. Scope is tiny (4 files, 4 type errors) and keeping v19.0 tech-debt-free beats carrying issues into v20.
  - `app/api/v1/automations/route.ts:24` — `Record<string, unknown>` → narrow to `AutomationCreate` via zod parse or typed body guard, not `as` cast.
  - `app/api/v1/thermorossi/settings/fan-level/route.ts:14` — return type `Promise<Response>` vs expected `Promise<NextResponse<unknown>>`: align handler signature with `NextResponse.json(...)` return.
  - Same pattern applied to `.../settings/power/route.ts:14` and `.../settings/temperature/water/route.ts:14`.
- **D-09:** After fix, delete `.planning/phases/163-dirigera-gap-closure/deferred-items.md` and note the deletion in Phase 163 SUMMARY via a one-line addendum ("Deferred items resolved in Phase 165").
- **D-10:** Full `tsc --noEmit` run must be clean after fix (zero new errors tolerated). No `// @ts-expect-error`, no `as any`.

### Phases 156-162 VALIDATION.md Nyquist status
- **D-11:** Do **not** regenerate Nyquist artifacts. Promote each VALIDATION.md from `draft` to an **explicit verdict** (`nyquist_compliant: true/false` + `status: partial_accepted`) with a short justification paragraph. This captures the intent of the audit without 7× full `/gsd-validate-phase` reruns.
- **D-12:** For each phase 156-162, append a `## Resolution` section to VALIDATION.md citing: test file paths that cover the claim, tests that do NOT exist but are acceptable (e.g., "production UI consumers missing — tracked in 166-170, not a Nyquist gap for the backend phase"), and a decision line `accepted_as: partial | compliant`.
- **D-13:** Phase 163 VALIDATION.md already `nyquist_compliant: true` — no change, only remove `deferred-items.md` reference.

### Audit artifact closeout
- **D-14:** At end of Phase 165, append a `## Phase 165 Resolution` block to `.planning/v19.0-MILESTONE-AUDIT.md` with per-item status (fixed / accepted / deferred-to-166+). Do **not** rewrite the audit body — preserve it as a snapshot.
- **D-15:** After Phase 165 success criteria met, flip audit header `status: gaps_found` → `status: hygiene_closed` (new value) so `/gsd-audit-milestone` can distinguish from untouched audits. Leave `effective coverage: 6/52` numbers untouched (those close in 166-170).

### Claude's Discretion
- Exact shell commands / script wrappers for sweeping commit hashes
- Whether to express new `AutomationCreate` narrowing via zod or via a hand-written type guard (pick whichever matches the existing `lib/validation` pattern)
- Formatting of the appended VALIDATION.md `## Resolution` section
- Ordering of plans within the phase (suggest: plan-01 hashes+health+tsc, plan-02 VALIDATION upgrades + audit closeout — but planner decides)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit source (authoritative)
- `.planning/v19.0-MILESTONE-AUDIT.md` — Full milestone audit; defines every gap this phase closes. Frontmatter `gaps.requirements`, `tech_debt`, and `nyquist` blocks are the spec.

### Roadmap + requirements
- `.planning/ROADMAP.md` §"Phase 165" — success criteria (4 items) this phase must make TRUE.
- `.planning/REQUIREMENTS.md` COMMON-01, COMMON-02 — the two requirements whose spec divergence is being reconciled here.

### Phase artifacts to edit
- `.planning/phases/156-path-migration-common-endpoints/156-01-VERIFICATION.md` — `/health` auth claim to correct.
- `.planning/phases/159-hue-gap-closure/159-01-SUMMARY.md` — commit hash `84b03c1b` → actual `bbaa5a4f`.
- `.planning/phases/160-sonos-gap-closure/160-01-SUMMARY.md` — commit hashes `6a565666/c613758a` → actual `ec790563/aba3dc54`.
- `.planning/phases/163-dirigera-gap-closure/deferred-items.md` — 4 tsc errors to resolve then delete.
- `.planning/phases/{156..162}-*/**-VALIDATION.md` — draft → explicit verdict.

### Source files touched
- `app/api/health/route.ts` — evidence that `/health` is currently `withErrorHandler` only.
- `app/api/v1/automations/route.ts:24` — `AutomationCreate` cast to eliminate.
- `app/api/v1/thermorossi/settings/{fan-level,power,temperature/water}/route.ts` — 3 NextResponse type mismatches.

### Project rules
- `CLAUDE.md` — `NEVER run npm run build`, `NEVER commit/push without explicit request`, prefer editing existing files. Applies to all plans in this phase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/core/withAuthAndErrorHandler` vs `lib/core/withErrorHandler` — already distinct wrappers; `/health` picked the correct one. No code change.
- Existing zod schemas in `lib/validation/` — pattern for replacing `Record<string, unknown>` with parsed `AutomationCreate`.
- `NextResponse.json(...)` return pattern already used across other `/api/v1/thermorossi/*` routes that pass tsc cleanly — model for the 3 settings routes.

### Established Patterns
- SUMMARY files use YAML frontmatter with `commits:` / `metrics.commits` arrays; hash edits are localised frontmatter surgery.
- VALIDATION.md status is expressed via YAML frontmatter + a markdown body; `nyquist_compliant: true|false` + `status:` field is the existing schema.

### Integration Points
- `/gsd-audit-milestone` reads `v19.0-MILESTONE-AUDIT.md` frontmatter; the `status:` field and resolution block we append must stay valid YAML.
- Post-phase, `/gsd-complete-milestone` should be runnable — 165 is the last hygiene gate before 166-170 UI cutovers.

</code_context>

<specifics>
## Specific Ideas

- User bias (from prior phases): prefer explicit decisions over silent reverts. Every "accepted as partial" must justify WHY in-file, not via memory or chat.
- Commit hash errors originated in parallel-agent waves (v16.0, v19.0). Treat SUMMARY commit hashes as machine-verifiable — if tooling exists to auto-verify, planner should consider a one-shot verification script rather than manual edits per file.
- v19.0 audit called this out as blocking milestone completion; treat "no new tsc errors" as a hard gate and run `tsc --noEmit` as part of verification.

</specifics>

<deferred>
## Deferred Ideas

- Frontend cutovers for Hue/Sonos/Netatmo/DIRIGERA — Phases 166-169 (already on roadmap).
- Auth UI (login + API-keys management) — Phase 170 or deferred per roadmap decision.
- Fritz!Box telephony UI — Phase 171 or deferred.
- `/gsd-validate-phase` full rerun for phases 156-162 — intentionally skipped here; can run as ad-hoc hygiene later if a phase's Nyquist coverage is challenged.
- Automated SUMMARY commit-hash verifier as a CI lint — idea worth capturing for a future tooling phase; not in scope here.

</deferred>

---

*Phase: 165-milestone-hygiene*
*Context gathered: 2026-04-15*
