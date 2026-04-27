---
phase: 176
slug: post-auth0-splash-animation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
---

# Phase 176 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (unit) + Playwright (E2E) |
| **Config file** | `jest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npm run test:components -- app/components/EmberGlass/__tests__/Splash.test.tsx app/components/EmberGlass/__tests__/SplashGate.test.tsx app/components/EmberGlass/__tests__/FlameViz.test.tsx` |
| **Full suite command** | `npm run test:components` |
| **Estimated runtime** | ~25 seconds (3 jest specs); Playwright spec ~30s on first auth-cached run |

---

## Sampling Rate

- **After every task commit:** Run scoped Jest spec for the file modified (e.g., `npm run test:components -- Splash.test.tsx`)
- **After every plan wave:** Run `npm run test:components` (covers all EmberGlass primitives)
- **Before `/gsd-verify-work`:** Full Jest component suite + Playwright `splash.spec.ts` must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 176-01-01 | 01 | 1 | SPLASH-02 | — | N/A (no auth boundary) | unit | `npm run test:components -- FlameViz.test.tsx` | ❌ W0 | ⬜ pending |
| 176-01-02 | 01 | 1 | SPLASH-02 | — | N/A | unit | `grep -q '@keyframes flamePulse' app/globals.css && grep -q '@keyframes pulse' app/globals.css` | ✅ (file exists, keyframes missing) | ⬜ pending |
| 176-02-01 | 02 | 2 | SPLASH-02, SPLASH-03 | — | reduced-motion fallback removes transforms | unit | `npm run test:components -- Splash.test.tsx` | ❌ W0 | ⬜ pending |
| 176-03-01 | 03 | 3 | SPLASH-01, SPLASH-04, SPLASH-05 | T-176-01 (no XSS via session marker) | sessionStorage write only after auth-success; no eval | unit | `npm run test:components -- SplashGate.test.tsx` | ❌ W0 | ⬜ pending |
| 176-03-02 | 03 | 3 | SPLASH-01 | — | N/A | integration | `npm run test:components -- ClientProviders.test.tsx` (if exists) or grep verify | ✅ | ⬜ pending |
| 176-04-01 | 04 | 4 | SPLASH-01..05 | — | N/A | e2e | `npx playwright test tests/playwright/splash.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/components/EmberGlass/__tests__/FlameViz.test.tsx` — unit stub for SPLASH-02 (FlameViz on/off + intensity scaling)
- [ ] `app/components/EmberGlass/__tests__/Splash.test.tsx` — unit stub for SPLASH-02, SPLASH-03 (phase state machine timers, reduced-motion branch)
- [ ] `app/components/EmberGlass/__tests__/SplashGate.test.tsx` — unit stub for SPLASH-01, SPLASH-04 (Auth0 + sessionStorage gating, reduced-motion media query, ready state)
- [ ] `tests/playwright/splash.spec.ts` — E2E stubs for SPLASH-01..05 (5 specs covering each criterion)
- [ ] No framework install needed — Jest 29.x + Playwright already configured per `jest.config.ts` / `playwright.config.ts`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual splash polish on real iOS Safari standalone PWA | SPLASH-02 | Browser-engine specific; Playwright runs Chromium and visual fidelity differs on Safari `backdrop-filter` rendering | Install PWA on iOS, sign out → sign in via Auth0 redirect → confirm splash plays smoothly without jank, badge dot pulses, fade-out crossing into dashboard scale-in |
| Reduced-motion in iOS system settings | SPLASH-03 | Real-device system pref isn't a Playwright env knob | Set iOS Settings → Accessibility → Motion → Reduce Motion ON; relaunch PWA; confirm 200ms opacity-only fade |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
