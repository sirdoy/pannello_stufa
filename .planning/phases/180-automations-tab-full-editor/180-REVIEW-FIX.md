---
phase: 180-automations-tab-full-editor
fixed_at: 2026-04-30T00:00:00Z
review_path: .planning/phases/180-automations-tab-full-editor/180-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 3
skipped: 1
status: partial
---

# Phase 180: Code Review Fix Report

**Fixed at:** 2026-04-30
**Source review:** .planning/phases/180-automations-tab-full-editor/180-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (Critical + Warning)
- Fixed: 3
- Skipped: 1

REVIEW.md reports 0 critical and 4 warning findings. Info-level findings (5)
are out of scope for this iteration per workflow configuration
(`fix_scope: critical_warning`).

## Fixed Issues

### WR-01: Hard-coded 800ms `waitForTimeout` in console-error gate is flake-prone

**Files modified:** `tests/smoke/automations-tab.spec.ts`
**Commit:** 6039f3eb
**Applied fix:** Replaced `await page.waitForTimeout(800)` (line 558) with a
deterministic wait keyed to the editor Sheet unmounting:
`await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 5000 });`.
This uses Option A from the reviewer's suggestion — asserting the actual
completion signal (Sheet outro finished) instead of guessing how long the
animation + refetch take. Removes the CI-flake hazard and ensures any
console errors emitted during the close animation are caught by the
subsequent `expect(errors).toEqual([])` assertion.

### WR-02: PATCH mock ignores request body — silently masks update bugs

**Files modified:** `tests/smoke/automations-tab.spec.ts`
**Commit:** cded250b
**Applied fix:** Changed the PATCH branch in `mockAutomationsApi` (lines
186-195) to parse the request body and merge it into the response, mirroring
the POST branch's `{ ...MOCK_RULE_BASE, ...body, id: 99 }` pattern. PATCH now
returns `{ ...MOCK_RULE_BASE, ...body }` so any future update-flow test will
observe the patched fields rather than the unmodified base, eliminating the
asymmetry between POST and PATCH that the reviewer flagged as a latent bug.

### WR-03: Empty-state text is split across DOM nodes — regex match may misbehave on strict roles

**Files modified:** `tests/smoke/automations-tab.spec.ts`
**Commit:** f20e6f56
**Applied fix:** Tightened the empty-state regex (line 236) from
`/Nessuna automazione/` to `/Nessuna automazione\. Tocca/`. The new pattern
includes the period and the word that follows the inline `<strong>Nuova</strong>`,
which is unique to the empty-state copy in
`app/components/EmberGlass/automations/AutomationsTab.tsx:139` and would not
match a hypothetical heading like "Nessuna automazione attiva". Added an
explanatory comment for future maintainers. Verified Playwright concatenates
the rendered text across the parent `<div>` and inner `<strong>`, so the
escaped period still matches the actual DOM output.

## Skipped Issues

### WR-04: `dismissVersionEnforcerIfPresent` race with WhatsNewModal — 200ms polls may miss late-mount overlays

**File:** `tests/smoke/automations-tab.spec.ts:62-79`
**Reason:** Helper is a verbatim cross-file duplicate (the reviewer
explicitly notes this in the finding: "verbatim from rooms-tab; not
introduced here but reviewed in scope" and "Since this helper is shared with
rooms-tab, fix at the source if pursued"). The same code lives at
`tests/smoke/rooms-tab.spec.ts:53-67` and in at least three other smoke specs
per IN-01 (page-loads, splash, dashboard-glass-cards). Patching only the
automations copy would create immediate drift between the duplicates,
worsening the IN-01 helper-duplication tech debt that the reviewer separately
flagged for a future cleanup pass. The recommended fix path is the structural
one called out in IN-01 — extract `tests/smoke/_helpers.ts` and re-import
across all smoke specs, then apply the WR-04 hardening once at the source.
That refactor is out of scope for a code-review-fix iteration. Leaving WR-04
unfixed preserves cross-spec consistency until the helper extraction lands.
**Original issue:** VersionEnforcer overlay may mount after the 500ms
detection window on slow Auth0 callback hydration (600-1200ms), making the
dismissal a no-op and causing intermittent overlay-intercept click failures
in CI. Mirroring the WhatsNewModal 4-attempt poll structure or pre-priming
`localStorage.lastSeenVersion` to a sentinel would close the race.

---

_Fixed: 2026-04-30_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
