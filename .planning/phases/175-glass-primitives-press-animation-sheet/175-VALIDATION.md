---
phase: 175
slug: glass-primitives-press-animation-sheet
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-27
verified: 2026-04-27
---

# Phase 175 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (unit) + Playwright (smoke) |
| **Config file** | `jest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npm run test:components -- EmberGlass` |
| **Full suite command** | `npm run test:components` |
| **Estimated runtime** | ~30s (unit) + ~25s (smoke specs) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:changed`
- **After every plan wave:** Run `npm run test:components -- EmberGlass`
- **Before `/gsd-verify-work`:** Full component suite + Phase 175 Playwright smoke specs must be green
- **Max feedback latency:** ~30s

---

## Per-Task Verification Map

> Filled by gsd-planner during step 8. Each plan task lands here with its automated command.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 175-01-XX | 01 | 1 | DS-07 | — | N/A | unit | `npm run test:components -- Pressable` | ❌ W0 | ⬜ pending |
| 175-02-XX | 02 | 1 | SHEET-01 | — | N/A | unit | `npm run test:components -- Sheet` | ❌ W0 | ⬜ pending |
| 175-03-XX | 03 | 2 | DS-07, SHEET-01 | — | N/A | smoke | `npx playwright test press-primitive.spec.ts sheet-primitive.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/components/EmberGlass/__tests__/Pressable.test.tsx` — unit tests for DS-07 (pointer events toggle scale, hook, polymorphic `as`)
- [ ] `app/components/EmberGlass/__tests__/Sheet.test.tsx` — unit tests for SHEET-01 (open/close, dismissal vectors, scroll-lock body mutations)
- [ ] `tests/smoke/press-primitive.spec.ts` — Playwright spec for DS-07 visible scale on press
- [ ] `tests/smoke/sheet-primitive.spec.ts` — Playwright spec for SHEET-01 (open/Escape/backdrop/close-button/scroll-lock + 375px/1024px viewports)

*Existing jest.config.ts + playwright.config.ts cover the framework needs; no install required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual fidelity of grabber + title bar against bundle | SHEET-01 | Pixel-level visual parity isn't enforced by Playwright assertions | Open `/debug/design-system-v2`, click "Open Sheet" demo button, compare grabber pill (40×5, rgba(255,255,255,0.2)) and 32×32 close button against `.planning/inbox/ember-glass-design/project/components/sheets.jsx:42-58` |
| Press animation feel (overshoot timing) | DS-07 | Cubic-bezier `.34,1.56,.64,1` overshoot is perceptual, not measurable in Playwright with frame-accurate assertions | Open `/debug/design-system-v2` Press section, click each demo `<Pressable>` glass surface, confirm scale-down feels snappy with slight overshoot back to 1.0 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (4 test files listed above)
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
