---
phase: 182
slug: design-system-reference-page-v2
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-03
verified: 2026-05-03
---

# Phase 182 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Phase 182 ships a dev-only design-system reference page; validation centers on Jest unit tests for new primitives + page section-mount, plus Playwright DOM-presence and accent-picker recolor invariant assertions.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (unit/component/page) + Playwright (E2E smoke) |
| **Config file** | `jest.config.js` (existing) + `playwright.config.ts` (existing) |
| **Quick run command** | `npm run test:changed` (Jest, files touched vs HEAD) |
| **Full suite command** | `npm run test:components && npm run test:pages && npx playwright test tests/smoke/design-system-v2-primitives.spec.ts` |
| **Estimated runtime** | ~30s (Jest scoped) + ~20s (single Playwright spec) |

> **Project rule (CLAUDE.md #8):** Never use bare `npm test`. Always use scoped subsets: `test:changed`, `test:quick`, `test:unit`, `test:api`, `test:components`, `test:pages`. Playwright runs target the single new spec file.

---

## Sampling Rate

- **After every task commit:** Run `npm run test:changed`
- **After every plan wave:** Run `npm run test:components` (covers new EmberGlass primitives) and `npm run test:pages` (covers `/debug/design-system-v2`)
- **Before `/gsd-verify-work`:** Full suite (above) must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

> Plan-level placeholders. Planner fills task IDs once `*-PLAN.md` files are written.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 182-XX-01 | 01 (CircBtn primitive) | 1 | DSREF-01 | — | N/A — pure visual primitive, no auth/data path | component | `npm run test:components -- app/components/EmberGlass/cards/__tests__/CircBtn` | ❌ W0 | ⬜ pending |
| 182-XX-02 | 02 (BigSlider primitive) | 1 | DSREF-01 | — | N/A — pure visual primitive | component | `npm run test:components -- app/components/EmberGlass/sheets/primitives/__tests__/BigSlider` | ❌ W0 | ⬜ pending |
| 182-XX-03 | 03 (Section extraction 01-04 verbatim) | 1 | DSREF-03 | — | N/A — file move only | page | `npm run test:pages -- app/debug/design-system-v2/__tests__/page` | ✅ | ⬜ pending |
| 182-XX-04 | 04 (CodeSnippet primitive + Section 05 token grid extension) | 2 | DSREF-01, DSREF-02 | — | clipboard write try/catch silent fallback | page | `npm run test:pages -- app/debug/design-system-v2/__tests__/page` | ✅ | ⬜ pending |
| 182-XX-05 | 05 (Section 06 card primitives reference) | 2 | DSREF-01, DSREF-02 | — | N/A | page | `npm run test:pages -- app/debug/design-system-v2/__tests__/page` | ✅ | ⬜ pending |
| 182-XX-06 | 06 (Section 07 sheet primitives reference) | 2 | DSREF-01, DSREF-02 | — | N/A | page | `npm run test:pages -- app/debug/design-system-v2/__tests__/page` | ✅ | ⬜ pending |
| 182-XX-07 | 07 (Section 08 sheet gallery + fixtures + hook mocks) | 2 | DSREF-01, DSREF-02 | — | N/A — fixture/mock data only | page | `npm run test:pages -- app/debug/design-system-v2/__tests__/page` | ✅ | ⬜ pending |
| 182-XX-08 | 08 (Playwright smoke: section-mount + recolor invariant) | 3 | DSREF-01, DSREF-02, DSREF-03 | — | N/A | e2e | `npx playwright test tests/smoke/design-system-v2-primitives.spec.ts` | Created Wave 3 (Plan 09) — see note | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/components/EmberGlass/cards/__tests__/CircBtn.test.tsx` — Jest spec stub for CircBtn (DSREF-01)
- [ ] `app/components/EmberGlass/sheets/primitives/__tests__/BigSlider.test.tsx` — Jest spec stub for BigSlider (DSREF-01)
- [ ] No new framework install — Jest + Playwright already established (Phases 174-181)

> Note: `tests/smoke/design-system-v2-primitives.spec.ts` is created in Plan 09 (Wave 3) rather than Wave 0 because no content to assert against exists until Wave 2 section files render. A Wave 0 stub would give false confidence; deferring is intentional.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual feel of accent recolor cascade across all 13 primitive samples (subjective polish) | DSREF-03 | Subjective design judgment — cannot be reduced to a DOM assertion beyond the locked recolor invariant test (which validates that the accent value propagates, not that it *feels* right) | Open `/debug/design-system-v2` in dev. Click each of the 6 hue swatches in section 01. Visually scan sections 06/07/08 for any primitive whose accent failed to recolor or whose recolored state looks broken. Compare against `.planning/inbox/ember-glass-design/project/components/sheets.jsx` and `cards.jsx` reference renders. |
| Copy button copies the right snippet to clipboard | DSREF-02 | `navigator.clipboard.writeText` cannot be reliably round-tripped in Playwright headless (clipboard permission gates differ in headless vs interactive) | For each primitive sample, click "Copia"; paste into a scratch JSX file; verify the pasted snippet matches the rendered live sample's prop shape. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (CircBtn spec stub, BigSlider spec stub) — Playwright spec deferred to Wave 3 per note above
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter (set by planner once tasks reference these test commands)

**Approval:** complete

---

## Audit Trail

### 2026-05-03 — Phase 183-05 status normalization

Frontmatter normalized from `status: draft` → `status: complete` per project convention. `wave_0_complete` flipped `false` → `true` per the v20.0 milestone audit, which confirms Phase 182 (9/9 plans, 3/3 must-haves). `nyquist_compliant` was already `true`. 4 human UAT items (full page visual smoke, accent picker live-recolor, CodeSnippet copy feedback, Section 10 single-open) are deferred (logged in audit `tech_debt`) but do not block frontmatter normalization since the underlying jest coverage is complete. See `.planning/phases/182-design-system-reference-page-v2/182-VERIFICATION.md` for the underlying evidence.
