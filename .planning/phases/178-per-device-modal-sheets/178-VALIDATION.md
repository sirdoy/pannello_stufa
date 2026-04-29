---
phase: 178
slug: per-device-modal-sheets
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 178 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (unit/integration) + Playwright 1.x (smoke) |
| **Config file** | `jest.config.js`, `playwright.config.ts` |
| **Quick run command** | `npm run test:changed` |
| **Full suite command** | `npm run test:components -- app/components/EmberGlass/sheets` (scoped per CLAUDE.md rule 8) |
| **Estimated runtime** | ~25 s (sheet jest scope) / ~90 s (Playwright smoke) |

---

## Sampling Rate

- **After every task commit:** `npm run test:changed`
- **After every plan wave:** `npm run test:components -- app/components/EmberGlass/sheets` + `npm run test:unit -- app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts`
- **Before `/gsd-verify-work`:** Sheet-scoped jest green AND `npm run test:e2e -- tests/smoke/dashboard-glass-cards.spec.ts` green
- **Max feedback latency:** 30 s for jest, 120 s for Playwright

NEVER run `npm test` alone (CLAUDE.md rule 8) — always scope to changed paths.

---

## Per-Task Verification Map

Filled in by the planner per task. Each task should map to one of:

| Task type | Test type | Automated command pattern |
|-----------|-----------|----------------------------|
| Sub-primitive component (`SheetRow`, `Stepper`, `Slider`, `RadialDial`, `SheetBtn`, `QuickActionButton`) | unit (jest jsdom) | `npm run test:components -- app/components/EmberGlass/sheets/primitives/__tests__/<Name>.test.tsx` |
| Sheet body (`StoveSheet`, `ClimateSheet`, `LightsSheet`, `SonosSheet`, `PlugsSheet`) | unit (jest jsdom + mocked hooks) | `npm run test:components -- app/components/EmberGlass/sheets/__tests__/<Name>Sheet.test.tsx` |
| `useThermostatCommands` hook | unit (jest, mocked fetch) | `npm run test:unit -- app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts` |
| `findSceneByName` helper | unit (jest, pure function) | `npm run test:unit -- app/components/EmberGlass/sheets/lib/__tests__/findSceneByName.test.ts` |
| Per-card swap (`<SheetPlaceholderBody>` → `<*Sheet>`) | integration (jest jsdom) | `npm run test:components -- app/components/EmberGlass/cards/__tests__/<Card>.test.tsx` |
| Phase-level wiring (sheet open + command fires) | smoke (Playwright) | `npm run test:e2e -- tests/smoke/dashboard-glass-cards.spec.ts -g "SHEET-0[2-6]"` |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/components/EmberGlass/sheets/__tests__/` directory exists.
- [ ] `app/components/EmberGlass/sheets/primitives/__tests__/` directory exists.
- [ ] `app/components/EmberGlass/sheets/lib/__tests__/` directory exists.
- [ ] `app/components/devices/thermostat/hooks/__tests__/useThermostatCommands.test.ts` Wave 0 test file (RED) before implementation.
- [ ] No new framework install required — jest + Playwright already configured.
- [ ] `tests/smoke/dashboard-glass-cards.spec.ts` (Phase 177) is the extension target — confirmed by research §6 (path correction: `tests/smoke/`, NOT `tests/playwright/`).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual fidelity to bundle (gradient blends, blur depth, `cubic-bezier(.22,1,.36,1)` ease feel) | SHEET-02..06 | Subjective visual judgment that diffs only on a real device | Open `/` on a 375px × 812px viewport, tap each interactive card (Stove/Climate/Lights/Sonos/Tuya), verify the sheet slides in over 400ms, the grabber + title + close button match bundle, the body content matches the per-sheet UI-SPEC visual diagram. |
| RadialDial dial readability under direct sunlight (real-device backlight) | SHEET-03 | Display contrast under variable ambient light not testable in CI | Open ClimateSheet on a phone outdoors at noon, confirm the 68px display value remains readable. |
| Touch-target ergonomics (Stepper ± buttons 36×36, RadialDial ± buttons 44×44) | SHEET-02..05 | Real-finger reachability not measurable by jsdom | Verify each ± button can be hit confidently with the user's thumb without mistapping adjacent UI; document any ergonomic regressions for a follow-up phase. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies (planner enforces).
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify.
- [ ] Wave 0 covers all `__tests__/` directories listed above.
- [ ] No watch-mode flags (`--watch` / `--watchAll`) anywhere.
- [ ] Feedback latency < 30 s for jest scopes, < 120 s for Playwright smoke.
- [ ] `nyquist_compliant: true` set in frontmatter once planner verifies all tasks have automated coverage.

**Approval:** pending
