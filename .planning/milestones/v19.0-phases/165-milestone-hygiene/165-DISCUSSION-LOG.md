# Phase 165: Milestone Hygiene & Spec Alignment - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-15
**Phase:** 165-milestone-hygiene
**Mode:** `--auto` (recommended options selected without interactive prompt)
**Areas discussed:** Commit-hash fix scope, /health auth resolution, Phase 163 deferred tsc, VALIDATION.md upgrades, Audit artifact closeout

---

## Commit-hash fix scope

| Option | Description | Selected |
|--------|-------------|----------|
| Fix only audit-named (159/160) | Touch exactly the 2 SUMMARY files audit flagged | |
| Sweep all v19.0 SUMMARY (156-163) | Verify every SUMMARY hash against `git log`, fix mismatches | ✓ |
| Build auto-verifier tool | Write CI lint that cross-checks hashes on every commit | |

**Auto-selected:** Sweep all v19.0 SUMMARY files.
**Notes:** Audit only sampled two; unknown if others drifted during the 156 regression + partial restore. Low cost, high confidence. Auto-verifier was captured as deferred idea.

---

## /health auth resolution

| Option | Description | Selected |
|--------|-------------|----------|
| Match spec: re-add auth to code | Wrap `/health` with `withAuthAndErrorHandler` | |
| Match code: update spec to "unauthenticated" | Correct 156 VERIFICATION + REQUIREMENTS to reflect current wrapper | ✓ |
| Mark as open divergence | Leave as-is, document disagreement | |

**Auto-selected:** Match code.
**Notes:** Current `app/api/health/route.ts` uses `withErrorHandler` only. `OnlineStatusContext` and external uptime monitors rely on unauth access. Flipping to auth would break connectivity probes with no product benefit.

---

## Phase 163 deferred tsc errors

| Option | Description | Selected |
|--------|-------------|----------|
| Fix all 4 in this phase | Narrow AutomationCreate + 3 NextResponse return types | ✓ |
| Formally defer with issue tracker | Create GitHub issue, leave `@ts-expect-error` | |
| Push to dedicated cleanup phase | New phase focused on repo-wide tsc hygiene | |

**Auto-selected:** Fix all 4.
**Notes:** 4 files, 4 errors — smaller than a separate phase's overhead. No suppression markers. `tsc --noEmit` clean is a hard verification gate.

---

## VALIDATION.md upgrade method (phases 156-162)

| Option | Description | Selected |
|--------|-------------|----------|
| Run `/gsd-validate-phase` for each | Regenerate full Nyquist artifacts (7 phases × full run) | |
| Promote to explicit verdict + justification | Edit frontmatter `nyquist_compliant` + append `## Resolution` block | ✓ |
| Leave as draft | No action | |

**Auto-selected:** Promote to explicit verdict.
**Notes:** Heavy regen of 7 completed backend phases adds cost with little value — the integration gaps are tracked in 166-170, not reopened as Nyquist failures for the backend phases. Explicit `partial_accepted` captures the reality.

---

## Audit artifact closeout

| Option | Description | Selected |
|--------|-------------|----------|
| Rewrite audit body to reflect fixes | Mutate existing findings | |
| Append resolution block + flip status | Preserve snapshot, add `## Phase 165 Resolution` + `status: hygiene_closed` | ✓ |
| Leave audit untouched | Let next audit supersede | |

**Auto-selected:** Append + flip status.
**Notes:** Audit snapshot must stay preserved for historical accuracy. New status value `hygiene_closed` helps `/gsd-audit-milestone` distinguish audits that have had their tech-debt closed from untouched ones.

---

## Claude's Discretion

- Shell commands / scripts for hash sweep
- Exact narrowing approach for `AutomationCreate` (zod vs hand-written guard) — match existing `lib/validation/` pattern
- Plan split within the phase (suggest 2 plans; planner decides)
- VALIDATION.md `## Resolution` formatting

## Deferred Ideas

- Frontend cutovers Hue/Sonos/Netatmo/DIRIGERA — Phases 166-169
- Auth UI — Phase 170 (or defer)
- Fritz!Box telephony UI — Phase 171 (or defer)
- Full `/gsd-validate-phase` reruns for 156-162 — ad-hoc if challenged
- Automated SUMMARY commit-hash verifier CI lint — future tooling phase
