# Phase 183: v20.0 Hygiene & Cleanup - Research

**Researched:** 2026-05-03
**Domain:** Documentation drift + dead-code cleanup + Nyquist VALIDATION normalization (no new feature code)
**Confidence:** HIGH (everything is filesystem/grep-verifiable in this repo)

## Summary

Phase 183 closes the v20.0 milestone by retiring tech_debt logged in `.planning/v20.0-MILESTONE-AUDIT.md`. It is a **hygiene phase** with five tightly-scoped buckets: (1) delete confirmed-orphan files, (2) flip stale `Pending`/`[ ]` markers in `REQUIREMENTS.md` to `Complete`/`[x]`, (3) append a BL-01 post-verify note to `180-VERIFICATION.md`, (4) add `console.error` to `useAutomationsList` silent-fail paths, and (5) re-run `/gsd-validate-phase` against the seven phases whose VALIDATION.md frontmatter never flipped from `status: draft` despite passing verification.

This is **NOT** a refactor or feature phase — there are no new requirements, no new features, no architectural decisions. The Standard Stack and Architecture Patterns sections of a normal RESEARCH.md largely don't apply; this research instead focuses on **the precise diff each task must make** and **the verification commands** that prove the diff is clean.

**Critical finding (deviation from audit):** The audit's "orphan list" is inaccurate for two of the six files. `app/components/ui/Sheet.tsx` and `app/components/ui/BottomSheet.tsx` are **NOT** orphans — they are imported by production code (`app/debug/design-system/page.tsx` and `app/components/scheduler/IntervalBottomSheet.tsx`). The legacy `/debug/design-system` route remains live (linked from `app/debug/page.tsx:365`, `lib/devices/deviceTypes.ts:401`, `lib/version.ts:618`, plus three docs/INDEX entries). Deleting these two files in this phase will break the legacy debug route and the scheduler interval picker. The planner must either (a) drop these two from the deletion set, or (b) widen scope to retire the entire `/debug/design-system` legacy route + scheduler IntervalBottomSheet rewrite — which is a non-trivial expansion. **Recommended:** drop them from this phase, log a follow-up `legacy-design-system-retirement` phase. [VERIFIED: grep on app/ tree, see Verification Commands below]

**Primary recommendation:** Plan this as **5 narrow tasks** mapped 1:1 to the five ROADMAP success criteria, each with exact-line edit instructions and a single grep/test verification. No agent ambiguity; no parallel waves needed (single wave, possibly even single task list under one plan).

## Architectural Responsibility Map

This is a documentation/file-deletion phase with one tiny code edit. Architectural tier mapping is mostly N/A, but for the one code change:

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| `console.error` in `useAutomationsList` fetch failures | Browser / Client | — | Hook runs in client component; logging surfaces errors in browser DevTools for operators |
| Orphan file deletion | N/A (filesystem) | — | Pure git rm; no runtime tier |
| `REQUIREMENTS.md` / `ROADMAP.md` / `180-VERIFICATION.md` edits | N/A (docs) | — | Markdown edits, no runtime impact |
| VALIDATION.md frontmatter normalization | N/A (process) | — | Workflow artifact; consumed by `/gsd-audit-milestone` |

## User Constraints (from CONTEXT.md)

> No CONTEXT.md exists for Phase 183 — this phase is being researched standalone via `/gsd-research-phase`. The five success criteria from the ROADMAP §"Phase 183" block stand in as locked decisions. Reproduced verbatim below.

### Locked Decisions (from ROADMAP.md success criteria)

1. **Orphan files to delete:** `app/components/Navbar.tsx`, `app/components/ui/Footer.tsx`, `app/automations/page.tsx`, `app/components/ui/Sheet.tsx`, `app/components/ui/BottomSheet.tsx`, `app/hooks/useReducedMotion.ts` — verify zero importers via grep before deletion; `npm run test:changed` + `tsc --noEmit` must pass post-delete.
2. **REQUIREMENTS.md updates:** Flip DSREF-01 + DSREF-02 checkboxes `[ ] → [x]`; flip every REQ-ID in traceability table from `Pending` → `Complete` where VERIFICATION.md provides evidence; update the date stamp.
3. **180-VERIFICATION.md:** Append a note documenting BL-01 was fixed post-verification in commit `595eb299`.
4. **useAutomationsList.ts:** Add `console.error` (or equivalent) on fetch failure paths so silent error swallowing is fixed without changing UX.
5. **Re-run `/gsd-validate-phase`** against phases 174, 176, 178, 179, 180, 181, 182 — VALIDATION.md frontmatter `status` flipped `draft` → terminal state for each; `wave_0_complete: true` where applicable.

### Claude's Discretion

- **Plan splitting:** Whether to ship as 1 plan or 5 plans. Single plan is recommended (single wave, all tasks atomic).
- **Per-file delete sequencing:** Which file to delete first in the plan. Recommended order: docs-only edits first (lowest risk), then code edit (`useAutomationsList`), then orphan deletions, then VALIDATION.md normalization runs (which trigger their own commits).
- **Whether to retain or also delete `app/debug/design-system/page.tsx`:** Audit and ROADMAP do not list this; **recommend leaving it** — it would expand scope. See Open Questions §1.
- **Exact `console.error` wording** in `useAutomationsList`: not specified. Recommended pattern in §Code Examples.

### Deferred Ideas (OUT OF SCOPE — backlog)

These items appear in the audit's `tech_debt` block but are explicitly NOT in Phase 183:

- All visual UAT items (~50+ across 174, 177, 178, 179, 180, 181, 182) — visual fidelity, motion curves, real-device safe-area, Italian copy parity
- Playwright runtime gates blocked by Auth0 storageState / VersionEnforcer / Firebase env
- Deferred primitives (CircBtn + BigSlider not yet swapped into production sheets — D-07 deferred)
- Accepted deviations (AUTO-03/AUTO-05 trigger/action counts, DASH-02 °C, DASH-10 DirigeraCard empty list, CameraCard bare img, Pitfall 5/7/8/9)
- Legacy `/debug/design-system` retirement
- `app/components/scheduler/IntervalBottomSheet.tsx` rewrite (would unblock `ui/BottomSheet.tsx` deletion)

## Project Constraints (from CLAUDE.md)

The planner MUST honor these directives — they apply to every task in this phase:

- **Rule 1:** NEVER break existing functionality. Every orphan deletion must be preceded by a grep verification command in the plan body.
- **Rule 4:** NEVER execute `npm run build` or `npm install`. Verify steps must NOT include these commands.
- **Rule 5:** ALWAYS create/update unit tests. The `useAutomationsList` `console.error` change must be accompanied by a test update — see Pitfalls §1.
- **Rule 7:** NEVER commit/push without explicit request. Plan should describe what the executor commits, but executor commits via `gsd-sdk query commit` per usual GSD flow.
- **Rule 8:** NEVER `npm test` alone in PLAN.md `<verify><automated>` blocks. Use `test:changed`, `test:quick`, `test:unit`, `test:api`, `test:components`, or `npm test -- <specific paths>`. **This is the most-violated rule and must be checked in every verify block.**

## Phase Requirements

Phase 183 has no REQ-IDs (per ROADMAP). It addresses tech_debt rather than scope. The success-criteria list above is the spec.

## Truth Table — Orphan Verification (REVISED)

The audit's "orphan post-181" list claimed six files have zero importers. Re-grepping the production tree (excluding `.claude/worktrees/**` which are stale agent copies) gives this revised picture:

| File | Audit Claim | Actual Importers (production, excl. worktrees + own __tests__) | Safe to Delete? |
|------|-------------|-----------------------------------------------------------------|-----------------|
| `app/components/Navbar.tsx` | orphan | none in production runtime; only `app/components/__tests__/Navbar.test.tsx` (tests `getMobileQuickActions` export) | YES — delete file + delete its test (test becomes orphan once impl is gone) |
| `app/components/ui/Footer.tsx` | orphan | re-exported from `app/components/ui/index.ts:17` only; **no consumer named-imports `Footer`** from the barrel (verified by grep) | YES — delete file + remove the line in `ui/index.ts` |
| `app/automations/page.tsx` | orphan | none in production; `app/components/Navbar.tsx:173,196` has dead string-matching code referencing `'automations'` (becomes irrelevant when Navbar is also deleted) | YES — delete (just a Next.js page, no test) |
| `app/components/ui/Sheet.tsx` | orphan | **`app/debug/design-system/page.tsx:35`** + barrel re-export at `ui/index.ts:64,117` + `Sheet.test.tsx` | **NO — has live importer in legacy debug route** |
| `app/components/ui/BottomSheet.tsx` | orphan | **`app/debug/design-system/page.tsx:22`** + **`app/components/scheduler/IntervalBottomSheet.tsx:4`** (production scheduler) + barrel re-export + `BottomSheet.test.tsx` | **NO — has live importers in production scheduler + debug route** |
| `app/hooks/useReducedMotion.ts` | orphan (dead code; SplashGate uses `lib/hooks/useReducedMotion.ts`) | none — verified zero `from '@/app/hooks/useReducedMotion'` matches | YES — delete (no consumers, no test) |

**Concrete recommendation for the planner:**

- **Delete:** `app/components/Navbar.tsx` (+ `app/components/__tests__/Navbar.test.tsx`), `app/components/ui/Footer.tsx` (+ `ui/index.ts` line 17), `app/automations/page.tsx`, `app/hooks/useReducedMotion.ts`. **4 deletions, not 6.**
- **Defer:** `app/components/ui/Sheet.tsx` and `app/components/ui/BottomSheet.tsx` to a future phase (legacy `/debug/design-system` retirement + `IntervalBottomSheet` rewrite). Document this in the SUMMARY.md tech_debt rollover.

This deviation should be raised explicitly in the plan body — the plan-checker should not flag it as scope reduction without justification, since the recommendation is grep-evidence-based and the audit's claim was incorrect.

[VERIFIED: ran `grep -rn ... app/ lib/ --include="*.ts" --include="*.tsx" | grep -v worktrees | grep -v __tests__` for each file 2026-05-03]

## Standard Stack

N/A — this is a hygiene phase. No new libraries, no version pins. The phase only touches:

- `console.error` (browser-native) — no library needed
- `git rm` (via Edit tool deletion or shell) — standard
- `Edit`/`Write` on existing markdown files — standard

## Architecture Patterns

### Pattern 1: Documentation-only commits

When a plan task only edits `.md` files in `.planning/`, the `<verify>` block should NOT run jest. Use `grep` assertions instead. Example:

```bash
# Verify DSREF-01 + DSREF-02 are flipped
grep -E '^\- \[x\] \*\*DSREF-0[12]' .planning/REQUIREMENTS.md | wc -l
# Expected: 2

# Verify zero `Pending` rows in v20.0 traceability range (lines 130-185)
sed -n '130,185p' .planning/REQUIREMENTS.md | grep -c "Pending"
# Expected: 0
```

### Pattern 2: Orphan deletion with grep gate

Each deletion task in the plan should follow this template, per CLAUDE.md Rule 1:

```bash
# Pre-deletion gate — must show zero importers (excluding worktrees + own __tests__)
grep -rn "from ['\"][./@a-z/]*<filename>['\"]" --include="*.ts" --include="*.tsx" app/ lib/ \
  | grep -v worktrees | grep -v __tests__ | grep -v "<filename>:" || echo "ZERO IMPORTERS"

# Then delete
git rm <path>

# Post-deletion gate
npm run test:changed
npx tsc --noEmit  # planner: confirm tsc is in node_modules — see Open Questions §3
```

### Pattern 3: VALIDATION.md frontmatter normalization

Per `~/.claude/get-shit-done/workflows/validate-phase.md`, `/gsd-validate-phase {N}` is the canonical tool for flipping frontmatter — **do NOT hand-edit frontmatter**. The workflow:

1. Detects state (A: VALIDATION exists → audit; B: only SUMMARY → reconstruct; C: not executed → exit)
2. Runs gap analysis against PLAN/SUMMARY artifacts
3. Optionally spawns `gsd-nyquist-auditor` to fill missing tests
4. Writes/updates VALIDATION.md frontmatter atomically
5. Commits separately (`docs(phase-N): add/update validation strategy`)

**Important convention finding:** Phase 175 (the only currently-compliant phase) has `status: complete`, not `status: final`. Phase 177 has `status: ready`. The ROADMAP success criterion mentions `status: draft → final` but **`final` is not the actual convention** — it's `complete` (terminal, post-verification) or `ready` (terminal, pre-execution). The planner should treat the ROADMAP wording as approximate and let `/gsd-validate-phase` choose the appropriate terminal state per phase.

### Anti-Patterns to Avoid

- **Hand-editing VALIDATION.md frontmatter:** Bypasses the auditor's gap-fill step. Use `/gsd-validate-phase` even though it's slower.
- **Bulk find-and-replace `Pending → Complete` across REQUIREMENTS.md:** Risks flipping rows whose VERIFICATION.md does NOT actually demonstrate completion. Each row must be evidenced individually. See §"REQUIREMENTS.md row evidence" below.
- **Adding `console.error` everywhere in `useAutomationsList`:** Only the **fetch failure paths** (4 catch blocks at lines 85-89, 109-114, 132-137, 153-158, 179-187 — see §Code Examples) need it. Don't add to the `toggle` rollback path's success branch or to optimistic update logic.
- **Deleting `Sheet.tsx` / `BottomSheet.tsx` in this phase:** Breaks production. See §Truth Table.
- **Running `npm test` alone in `<verify>` blocks:** CLAUDE.md Rule 8 violation. Use scoped scripts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Flip VALIDATION.md frontmatter | Custom sed script across 7 phases | `/gsd-validate-phase 174` … through `… 182` (one invocation per phase) | Auditor checks for missing tests as a side-effect; sed would skip that |
| Detect orphan files | Custom AST traversal | `grep -rn "from ['\"]<path>['\"]" --include="*.ts" --include="*.tsx"` | Sufficient for static imports; project has no dynamic `await import()` of these files |
| Fix REQUIREMENTS.md traceability | Bulk regex replace | Per-row evidence check then individual `Edit` tool patches | The audit explicitly noted "every REQ-ID with VERIFICATION evidence" — implies row-by-row check |

**Key insight:** `/gsd-validate-phase` is the right tool for criterion #5 even if it does no test-generation work — it commits an audit trail entry to each phase's VALIDATION.md (`## Validation Audit {date}` block), which is the documentation artifact the milestone audit will look for.

## REQUIREMENTS.md — Per-Row Evidence Check

The traceability table at `.planning/REQUIREMENTS.md` lines 134-184 has 50 rows. Current state (audit-verified):

| Status | REQ-IDs | Count |
|--------|---------|-------|
| `Complete` | DS-01..06 (6), SPLASH-01..05 (5), ROOMS-01..05 (5), AUTO-01..08 (8) | 24 |
| `Pending` (must flip to Complete per audit) | DS-07, DASH-01..12 (12), SHEET-01..06 (6), NAV-01..04 (4), DSREF-01..03 (3) | **26** |

For each Pending row, the planner should add a verification step that confirms VERIFICATION.md evidence exists before flipping. Confirmed evidence sources (from audit):

| REQ-ID(s) | VERIFICATION evidence file | Code evidence |
|-----------|---------------------------|---------------|
| DS-07 | `175-VERIFICATION.md` (Phase 175 passed 5/5) | `app/components/EmberGlass/Pressable.tsx` + `.press-anim` CSS class in `globals.css` |
| DASH-01..12 | `177-VERIFICATION.md` (12/12 must-haves) | `app/components/EmberGlass/cards/*.tsx` (10 cards) |
| SHEET-01 | `175-VERIFICATION.md` (5/5) | `app/components/EmberGlass/Sheet.tsx` |
| SHEET-02..06 | `178-VERIFICATION.md` (12/12 code-verified, human UAT pending) | `app/components/EmberGlass/sheets/{Stove,Climate,Lights,Sonos,Plugs}Sheet.tsx` |
| NAV-01..04 | `181-VERIFICATION.md` (8/8 code-verified) | `app/components/EmberGlass/BottomTabBar.tsx` |
| DSREF-01..03 | `182-VERIFICATION.md` (3/3 must-haves) | `app/debug/design-system-v2/page.tsx` |

All 26 `Pending` rows have evidence. Plus DSREF-01 + DSREF-02 also need their checkboxes flipped from `[ ]` to `[x]` at REQUIREMENTS.md lines 90-91 (DSREF-03 line 92 already shows `[x]`).

**Total REQUIREMENTS.md edits:** 28 atomic changes (26 traceability rows + 2 checkbox flips) + 1 date-stamp update at line 193.

## Common Pitfalls

### Pitfall 1: useAutomationsList test bleeds into console output
**What goes wrong:** Adding `console.error(...)` will make Jest test output noisy on every error-path test in `app/hooks/__tests__/useAutomationsList.test.ts`.
**Why it happens:** Jest doesn't suppress `console.error` by default; existing tests assert error state via `result.current.error` but don't mock console.
**How to avoid:** In the test file, add `beforeEach(() => { jest.spyOn(console, 'error').mockImplementation(() => {}); })` at the top of the relevant `describe` block. The plan should include this test-side update — not just the impl change. (CLAUDE.md Rule 5 mandates the test update.)
**Warning signs:** Jest output flooded with red `Error: ...` lines after the change lands.

### Pitfall 2: REQUIREMENTS.md DSREF-01 / DSREF-02 multi-line entries
**What goes wrong:** Lines 90-91 have a quirky multi-line structure where the `[ ]` is on one line but the bold `**DSREF-0X**` continues onto a separate logical bullet. A naive `sed -i 's/\[ \]/\[x\]/'` can over-match or miss the right anchor.
**Why it happens:** Authors used multi-line markdown for these specific entries (unlike DSREF-03 line 92 which is single-line and already `[x]`).
**How to avoid:** Use `Edit` tool with anchored `old_string` capturing the whole line including the `**DSREF-01**` prefix. Confirm character-exact via `grep -n "DSREF-01" .planning/REQUIREMENTS.md` before and after.
**Warning signs:** `grep -c "\[x\] \*\*DSREF" .planning/REQUIREMENTS.md` returns ≠ 3 after the edit.

### Pitfall 3: ROADMAP.md Progress table drift not in scope
**What goes wrong:** The Progress table at ROADMAP.md lines 247-258 lists Phase 174 as `0/0 — Not started` (it's actually `3/3 — Complete`). This is doc drift not listed in the audit's `tech_debt` block.
**Why it happens:** Phase 174 was authored in a different session and the Progress row never got updated when plans landed.
**How to avoid:** **Out of scope for Phase 183** per ROADMAP success criteria — but the planner should call this out in SUMMARY.md as discovered tech_debt that rolls into the next milestone's hygiene phase. (Audit-listed item: only the `<details>` block "0/9 plans" line for Phase 182 is mentioned — and that line is actually at ROADMAP.md line 47 "Phase 182: 9/9 plans" which is correct. The audit appears to have referenced an older state. Verify before editing.)
**Warning signs:** Plan task description says "fix ROADMAP Progress table" — push back, that's beyond the 5 success criteria.

### Pitfall 4: /gsd-validate-phase commits per phase
**What goes wrong:** The workflow at step 7 commits twice (`test(phase-N)` for test files + `docs(phase-N)` for VALIDATION.md). Running it 7 times creates ~14 commits, scattered through the log.
**Why it happens:** Workflow is designed for atomic per-phase audit trails.
**How to avoid:** Accept the commit fan-out — it's the right shape for milestone audit traceability. Alternatively, the planner could group the 7 invocations into one task with a comment explaining the commit count. **Do NOT** attempt to suppress the workflow's commits.
**Warning signs:** Plan tries to wrap `/gsd-validate-phase` in `--no-commit` flag (doesn't exist).

### Pitfall 5: Deleting Navbar.test.tsx leaves test infra orphan
**What goes wrong:** When `app/components/Navbar.tsx` is deleted, its test file `app/components/__tests__/Navbar.test.tsx` will fail (cannot resolve `../Navbar`). If the test file is left in place, `npm run test:changed` post-delete will go red.
**Why it happens:** The test imports `getMobileQuickActions` from the deleted file.
**How to avoid:** Delete both the source file AND the test file in the same task. Verify post-delete with `npm run test:changed` (which should report no changes since both files are gone) and `npm test -- --listTests | grep Navbar` (should return zero).
**Warning signs:** `npm run test:changed` exits with errors mentioning `Cannot find module '../Navbar'`.

### Pitfall 6: ui/index.ts barrel still exports deleted symbols
**What goes wrong:** Deleting `app/components/ui/Footer.tsx` without removing line 17 of `app/components/ui/index.ts` (`export { default as Footer } from './Footer';`) causes a TypeScript compile error in any consumer of the barrel.
**Why it happens:** Barrel file must be edited in lockstep with file deletion.
**How to avoid:** Same task that deletes `Footer.tsx` must also delete line 17 of `ui/index.ts`. Verify with `grep -n "Footer\|BottomSheet\|Sheet[^G]" app/components/ui/index.ts` (should still show `Sheet`/`BottomSheet` exports since those files remain — see §Truth Table — but no `Footer`).
**Warning signs:** `npx tsc --noEmit` after delete shows `error TS2305: Module './Footer' has no exported member 'default'`.

### Pitfall 7: useAutomationsList — toggle rollback path is also a fetch failure
**What goes wrong:** Easy to miss the 5th catch block at line 179-187 (`toggle` callback). It's structurally different (rollback + toast, no rethrow) but it IS a silent-failure point per the audit.
**Why it happens:** The audit references "fetch failure paths" generically; the `toggle` catch handles failure differently from `create`/`update`/`remove`.
**How to avoid:** Add `console.error('[useAutomationsList] toggle failed:', err)` in the rollback catch (line 180-187) too. The fetch path in `refetch` (line 85-89) also needs it.
**Warning signs:** Code review notes "still 1 silent path remaining" or "toggle errors don't log".

## Code Examples

### Example: useAutomationsList — exact lines to add console.error

The current implementation at `app/hooks/useAutomationsList.ts` has **5 catch blocks** that need logging. Recommended pattern:

```typescript
// Source: pattern aligned with existing project hooks (e.g., lib/hooks/useNetworkData.ts uses console.error similarly)

// Line 85-89 (refetch — list load failure)
} catch (err) {
  console.error('[useAutomationsList] refetch failed:', err);
  setError(err instanceof Error ? err.message : 'Errore sconosciuto');
} finally {

// Line 109-114 (create — POST failure)
} catch (err) {
  console.error('[useAutomationsList] create failed:', err);
  toastError(
    err instanceof Error ? err.message : 'Errore durante il salvataggio'
  );
  throw err;
}

// Line 132-137 (update — PATCH failure)
} catch (err) {
  console.error('[useAutomationsList] update failed:', err);
  toastError(
    err instanceof Error ? err.message : 'Errore durante il salvataggio'
  );
  throw err;
}

// Line 153-158 (remove — DELETE failure)
} catch (err) {
  console.error('[useAutomationsList] remove failed:', err);
  toastError(
    err instanceof Error ? err.message : "Errore durante l'eliminazione"
  );
  throw err;
}

// Line 179-187 (toggle — PATCH failure with optimistic rollback)
} catch (err) {
  console.error('[useAutomationsList] toggle failed:', err);
  // Rollback
  setRules((prev) =>
    prev.map((r) => (r.id === id ? { ...r, enabled: currentEnabled } : r))
  );
  toastError(
    err instanceof Error ? err.message : 'Errore durante il salvataggio'
  );
}
```

### Example: 180-VERIFICATION.md BL-01 append note

The file ends at the line `_Verifier: Claude (gsd-verifier)_` (verified 2026-04-30). Append a new section before EOF:

```markdown
---

## Post-Verification Update (2026-05-03)

**BL-01 RESOLVED** — The runtime blocker documented in §"Human Verification Required" (item 1) and §"Gaps Summary" was fixed in commit `595eb299`. `useAutomationsList` no longer calls `automationsProxy.getAutomations()` directly; it now uses `fetch('/api/v1/automations*')` against the existing Next.js API routes, matching the pattern of every other client hook in the codebase.

The Playwright spec at `tests/smoke/automations-tab.spec.ts` becomes runnable without modification once Auth0 storageState is populated. The deferred-runtime precedent from Phase 175-03 no longer applies to this phase.

_Updated: 2026-05-03 (Phase 183 hygiene)_
```

### Example: REQUIREMENTS.md — checkbox flip for DSREF-01

The current text at lines 90-91 is multi-line:

```markdown
- [ ] **DSREF-01**: New route `/debug/design-system-v2` renders a single-page reference for Ember Glass — colors (accent + neutrals + tones), typography pairs, spacing/radius scale, shadow/blur values, and live component samples (GlassCard, CardHead, StatusDot, InlineToggle, CircBtn, Stepper, Slider, BigSlider, RadialDial, Sheet preview, MiniStat, FlameViz, PlayingBars)
- [ ] **DSREF-02**: Page is the **single source of truth** — every visual primitive used by dashboard/sheets/rooms/automations appears here with copy-paste-ready code snippet (or token reference) per sample
```

Flip the leading `[ ]` to `[x]` on each line — anchor the `Edit` to the full opening (`- [ ] **DSREF-01**:`) so it's unambiguous.

## State of the Art

N/A — this phase ships no new patterns. The state-of-the-art for v20.0 is locked in Phases 174-182 and not changing here.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `/gsd-validate-phase` is the right tool for VALIDATION.md frontmatter normalization | Architecture Patterns §Pattern 3 | If it's not idempotent or fails on already-passing phases, criterion #5 takes longer. **Mitigation:** workflow.md confirms it handles State A (existing VALIDATION.md) — VERIFIED via reading the workflow file. |
| A2 | The terminal `status` value should be `complete` (not `final` as ROADMAP says) | Architecture Patterns §Pattern 3 | If planner forces `final`, frontmatter diverges from Phase 175's pattern and `gsd-audit-milestone` may not recognize it. **Mitigation:** let `/gsd-validate-phase` decide, don't override. |
| A3 | Removing `Footer` re-export from `ui/index.ts:17` won't break any consumer | Truth Table | If any consumer named-imports `Footer` from the barrel, tsc will go red. **Verified by grep:** zero matches for `import {... Footer ...}` from `@/app/components/ui` — see Verification Commands. |
| A4 | The `Navbar.test.tsx` deletion is the right call (vs. keeping `getMobileQuickActions` as a util) | Truth Table | If any other code uses `getMobileQuickActions`, deleting the source file breaks it. **Verified by grep:** zero non-test, non-self matches. |
| A5 | `npx tsc --noEmit` is the appropriate type-check verify command (not `npm run build` per Rule 4) | Verification Commands | If tsc isn't in `node_modules/.bin`, this command fails and the planner needs to use a different gate. **Open Question §3.** |

## Open Questions

1. **Should `app/debug/design-system/page.tsx` be retired in this phase to unblock `Sheet.tsx`/`BottomSheet.tsx` deletion?**
   - What we know: legacy page imports both files; `app/debug/page.tsx:365` links to it; docs reference it from 5 places.
   - What's unclear: whether retiring the legacy debug route is in scope for v20.0 hygiene or a separate v20.1 task.
   - Recommendation: **OUT OF SCOPE for Phase 183.** Keep deletions to 4 files. Add a `tech_debt` rollover note in SUMMARY.md flagging "legacy /debug/design-system retirement + IntervalBottomSheet rewrite" as a follow-up phase.

2. **Should the Progress table drift (Phase 174 row showing 0/0) be fixed in this phase?**
   - What we know: ROADMAP success criteria don't list this; audit didn't flag it.
   - What's unclear: whether to silently fix it as a "while we're here" edit.
   - Recommendation: fix it as a single-line correction in the same plan (low risk, high accuracy gain). Note it explicitly in the plan's `Scope additions` section.

3. **Is `npx tsc --noEmit` available in this repo, or does CLAUDE.md Rule 4 (no `npm install`) imply we must rely solely on `test:changed`?**
   - What we know: package.json has no `tsc` script; project uses Next.js webpack builder. CLAUDE.md Rule 4 forbids `npm install` and `npm run build`.
   - What's unclear: whether `node_modules/.bin/tsc` is already populated (likely yes — typescript is a transitive dep of next.js). Whether running `npx tsc --noEmit` triggers an install. (Typically it doesn't if the binary is present.)
   - Recommendation: planner should add `npx tsc --noEmit --skipLibCheck` to verify blocks AS A FALLBACK, but rely on `npm run test:changed` as the primary gate (it would catch import errors). If tsc fails to find the binary, drop it.

4. **Does deleting `app/automations/page.tsx` require a redirect for any external link?**
   - What we know: zero internal `href="/automations"` references (verified by grep). BottomTabBar uses `/automazioni` only.
   - What's unclear: whether any browser bookmarks or external services link to `/automations`. If so, a Next.js redirect in `next.config.js` would prevent 404.
   - Recommendation: **DON'T add a redirect.** This is a personal PWA with one user; risk of broken bookmarks is negligible. If concerned, the planner can add a `redirects()` entry to `next.config.js` as a one-line task.

5. **Audit lists `useReducedMotion` duplicate as cross-phase tech_debt; ROADMAP success criterion #1 says delete it. Confirm the right one stays.**
   - What we know: `lib/hooks/useReducedMotion.ts` (32 LOC, SSR default = false / full motion) is used by `app/components/EmberGlass/SplashGate.tsx`. `app/hooks/useReducedMotion.ts` (68 LOC, SSR default = true / reduced motion, has Safari <14 fallback) has zero importers.
   - What's unclear: if any future phase will want the richer Safari fallback or the inverted SSR default.
   - Recommendation: delete `app/hooks/useReducedMotion.ts` per audit + ROADMAP. The richer Safari fallback is tech debt against the modern hook — port it forward in a future phase if needed (Safari <14 is now extremely rare).

## Verification Commands

The planner should embed these verbatim into PLAN.md `<verify>` blocks. Each is grep-only (or test-only) and respects CLAUDE.md Rule 8.

```bash
# CRITERION 1 — orphan deletions (run AFTER deletes)
[ ! -f app/components/Navbar.tsx ] && echo "Navbar.tsx deleted ✓"
[ ! -f app/components/__tests__/Navbar.test.tsx ] && echo "Navbar.test.tsx deleted ✓"
[ ! -f app/components/ui/Footer.tsx ] && echo "Footer.tsx deleted ✓"
[ ! -f app/automations/page.tsx ] && echo "automations/page.tsx deleted ✓"
[ ! -f app/hooks/useReducedMotion.ts ] && echo "app/hooks/useReducedMotion.ts deleted ✓"
grep -c "from './Footer'" app/components/ui/index.ts  # expect 0
npm run test:changed
npx tsc --noEmit --skipLibCheck  # may be omitted if Open Q §3 resolves no

# CRITERION 2 — REQUIREMENTS.md flips
grep -c "^\- \[x\] \*\*DSREF-0[12]\*\*" .planning/REQUIREMENTS.md  # expect 2
sed -n '130,185p' .planning/REQUIREMENTS.md | grep -c "Pending"     # expect 0
sed -n '130,185p' .planning/REQUIREMENTS.md | grep -c "Complete"    # expect 50
grep -E "^\*Last updated:" .planning/REQUIREMENTS.md  # expect "Last updated: 2026-05-03"

# CRITERION 3 — 180-VERIFICATION.md BL-01 note
grep -c "BL-01 RESOLVED\|595eb299" .planning/phases/180-automations-tab-full-editor/180-VERIFICATION.md  # expect ≥1

# CRITERION 4 — useAutomationsList console.error
grep -c "console.error.\[useAutomationsList\]" app/hooks/useAutomationsList.ts  # expect 5
npm test -- app/hooks/__tests__/useAutomationsList.test.ts

# CRITERION 5 — VALIDATION.md frontmatters (after running /gsd-validate-phase 7×)
for p in 174 176 178 179 180 181 182; do
  vf=.planning/phases/${p}*/[0-9]*-VALIDATION.md
  status=$(awk '/^status:/ {print $2; exit}' $vf 2>/dev/null)
  echo "Phase $p: status=$status"
done
# Expect: every line shows "complete" (or "ready" — let workflow decide), NOT "draft"
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| jest | `test:changed`, `test:quick` | Likely ✓ (Phase 181 VALIDATION.md confirms Jest 30) | 30.x | none — required |
| typescript / tsc | optional `tsc --noEmit` gate | Likely ✓ (transitive next.js dep) | 5.x | drop tsc gate, rely on test:changed |
| `gsd-sdk` CLI | commit messages, init lookup | ✓ (`/Users/federicomanfredi/.nvm/versions/node/v24.7.0/bin/gsd-sdk`) | latest | none |
| `/gsd-validate-phase` slash command | criterion 5 | ✓ (`~/.claude/skills/gsd-validate-phase/SKILL.md` present) | system v3.0 | manual frontmatter edit (anti-pattern) |
| git | every task | ✓ (project is a git repo) | system | none |

**Missing dependencies with no fallback:** none anticipated.

## Validation Architecture

> Phase 183 is a hygiene phase. Most criteria are text/file edits — Nyquist sampling is largely N/A. The exception is criterion #4 (`useAutomationsList` change), which IS testable code.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30 (per Phase 181 VALIDATION.md confirmation) |
| Config file | `jest.config.js` (project root) — confirmed via Phase 92 history |
| Quick run command | `npm run test:changed` (only files touched vs HEAD) |
| Full suite command | `npm run test:ci` — **release-gate only**, never from PLAN per CLAUDE.md Rule 8 |

### Phase Requirements → Test Map

Phase 183 has no REQ-IDs, but the success criteria map to verifications:

| SC # | Behavior | Test Type | Automated Command | File Exists? |
|------|----------|-----------|-------------------|-------------|
| SC-1 | 4 orphan files removed; barrel cleaned | filesystem + jest | `[ ! -f <path> ] && npm run test:changed` | ✅ existing tests |
| SC-2 | REQUIREMENTS.md flipped | grep | `grep -c "Pending" .planning/REQUIREMENTS.md \| awk '{exit ($1 != 0)}'` | N/A — markdown |
| SC-3 | 180-VERIFICATION BL-01 note appended | grep | `grep -c "BL-01 RESOLVED" 180-VERIFICATION.md` | N/A — markdown |
| SC-4 | useAutomationsList logs on every catch | jest + grep | `grep -c "console.error.\[useAutomationsList\]" + npm test -- useAutomationsList.test.ts` | ✅ test file exists at `app/hooks/__tests__/useAutomationsList.test.ts` |
| SC-5 | 7 VALIDATION.md frontmatters terminal | grep loop | `for p in 174 176 178 179 180 181 182; do awk '/^status:/' .../$p-VALIDATION.md; done` | ✅ all 7 files exist |

### Sampling Rate

- **Per task commit:** `npm run test:changed` (covers SC-1 + SC-4 if those tasks ran)
- **Per wave merge:** N/A — phase fits in a single wave
- **Phase gate:** All 5 SC verification commands above must pass before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `app/hooks/__tests__/useAutomationsList.test.ts` — needs to be EXTENDED with a `console.error` spy (`jest.spyOn(console, 'error').mockImplementation()`) in error-path tests so SC-4 doesn't flood Jest output. Existing tests cover error state itself; only the spy is new. (See Pitfall §1.)

*(No other gaps — every other SC is verified by grep against text files that already exist.)*

## Sources

### Primary (HIGH confidence)
- `.planning/v20.0-MILESTONE-AUDIT.md` — read in full, source of tech_debt scope
- `.planning/ROADMAP.md` lines 231-244 — Phase 183 success criteria
- `.planning/STATE.md` — current milestone state
- `app/hooks/useAutomationsList.ts` — read in full for line-numbered Edit targets
- `app/hooks/useReducedMotion.ts` + `lib/hooks/useReducedMotion.ts` — read in full for duplicate-comparison
- `app/layout.tsx` — confirmed Navbar/Footer not imported in production root layout
- `app/components/ui/index.ts` line 17 — confirmed Footer barrel re-export exists, no consumer
- `app/debug/design-system/page.tsx` lines 22, 35 — confirmed live importers of `Sheet.tsx` + `BottomSheet.tsx`
- `~/.claude/get-shit-done/workflows/validate-phase.md` — read in full for State A workflow
- `package.json` scripts — confirmed test:changed exists; no `build` from CLAUDE.md Rule 4
- `CLAUDE.md` — read in full

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` lines 90-185 — checkbox + traceability state (read first 80 + 80-194)
- `.planning/phases/180-automations-tab-full-editor/180-VERIFICATION.md` tail — confirmed BL-01 note structure + closing date stamp
- VALIDATION.md frontmatters of all 9 v20.0 phases — confirmed terminal-state convention is `complete`/`ready`, not `final`

### Tertiary (LOW confidence)
- None — this phase is fully verifiable via filesystem and grep.

## Metadata

**Confidence breakdown:**
- Truth Table (orphan list correction): HIGH — every claim grep-verified on the production tree
- Architecture Patterns: HIGH — grep + workflow file reads confirm conventions
- Common Pitfalls: HIGH — derived from reading actual files (useAutomationsList line numbers exact, ui/index.ts line 17 exact, REQUIREMENTS.md DSREF lines 90-91 exact)
- Validation Architecture: HIGH — Jest 30 confirmed via Phase 181 VALIDATION; test:changed in package.json scripts

**Research date:** 2026-05-03
**Valid until:** 2026-05-10 (7 days — milestone close pace; if not executed by then, re-grep orphan importers since worktrees and HEAD churn)
