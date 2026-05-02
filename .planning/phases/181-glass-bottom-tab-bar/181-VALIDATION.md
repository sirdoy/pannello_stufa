---
phase: 181
slug: glass-bottom-tab-bar
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-05-02
---

# Phase 181 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Sourced from `181-RESEARCH.md` § Validation Architecture; aligned with CLAUDE.md Rule 8 (no bare `npm test` from agents/plan verify blocks).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30 (`jest.config.js`) + Playwright 1.x (`playwright.config.ts`) |
| **Config file** | `jest.config.js`, `playwright.config.ts` |
| **Quick run command** | `npm run test:components` |
| **Full suite command** | `npm run test:ci` (release gate / CI only — agents MUST NOT use bare `npm test`) |
| **Estimated runtime** | ~25s for `test:components`, ~6s for `test:changed`, ~12s for the new Playwright smoke |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:changed`
- **After every plan wave:** Run `npm run test:components` + `npm run test:pages`
- **Before `/gsd-verify-work`:** All scoped passes green + `npx playwright test tests/smoke/bottom-tab-bar.spec.ts`
- **Max feedback latency:** ~30s (test:changed scoped to phase files)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 181-01-01 | 01 | 1 | NAV-03 | — | Body data-attribute set on Sheet open, cleared on last close | unit | `npm test -- app/components/EmberGlass/__tests__/SheetCounter.test.ts` | ❌ W0 (new) | ⬜ pending |
| 181-01-02 | 01 | 1 | NAV-03 | — | Sheet.tsx augmentation increments/decrements counter | unit | `npm test -- app/components/EmberGlass/__tests__/Sheet.test.tsx` | ✅ extends existing | ⬜ pending |
| 181-01-03 | 01 | 1 | NAV-03 | — | `body[data-sheet-open] [data-bottom-tab]` hide rule in globals.css | grep | `grep -q "body\[data-sheet-open" app/globals.css` | ❌ W0 (new rule) | ⬜ pending |
| 181-02-01 | 02 | 1 | NAV-01, NAV-02 | — | BottomTabBar renders 4 tabs + glass surface inline-style | unit | `npm test -- app/components/EmberGlass/__tests__/BottomTabBar.test.tsx` | ❌ W0 (new) | ⬜ pending |
| 181-02-02 | 02 | 1 | NAV-02 | — | Active state mapping per pathname (`/`, `/stanze`, `/automazioni`, `/altro`) | unit | same as 181-02-01 | ❌ W0 (new) | ⬜ pending |
| 181-02-03 | 02 | 1 | NAV-04 | — | Container `bottom: calc(8px + env(safe-area-inset-bottom))` | grep | `grep -q "env(safe-area-inset-bottom)" app/components/EmberGlass/BottomTabBar.tsx` | ❌ W0 (new) | ⬜ pending |
| 181-03-01 | 03 | 2 | NAV-02 (Altro reachable) | — | `/altro` route renders 4 group sections + Logout link | unit | `npm test -- app/altro/__tests__/page.test.tsx` | ❌ W0 (new) | ⬜ pending |
| 181-04-01 | 04 | 2 | — | — | NavbarConnectionStatusChip floating wrapper | unit | `npm test -- app/components/layout/__tests__/NavbarConnectionStatusChip.test.tsx` | ❌ W0 (new) | ⬜ pending |
| 181-05-01 | 05 | 3 | NAV-01..04 | — | layout.tsx unmounts legacy Navbar/Footer; mounts BottomTabBar + chip | unit (snapshot) | `npm test -- app/__tests__/layout.test.tsx` (or grep-based assertion) | ✅ test infra exists | ⬜ pending |
| 181-05-02 | 05 | 3 | — | — | Legacy Navbar.test.tsx still passes (unchanged file) | unit | `npm test -- app/components/__tests__/Navbar.test.tsx` | ✅ existing | ⬜ pending |
| 181-06-01 | 06 | 4 | NAV-04 | — | Safe-area inset honored at 375×812 | smoke (Playwright) | `npx playwright test tests/smoke/bottom-tab-bar.spec.ts -g "safe-area"` | ❌ W0 (new spec) | ⬜ pending |
| 181-06-02 | 06 | 4 | NAV-02 | — | Active tab tinting on each route | smoke | `npx playwright test tests/smoke/bottom-tab-bar.spec.ts -g "active"` | ❌ W0 (new spec) | ⬜ pending |
| 181-06-03 | 06 | 4 | NAV-03 | — | Bar hides under open Sheet, returns on close | smoke | `npx playwright test tests/smoke/bottom-tab-bar.spec.ts -g "hides under sheet"` | ❌ W0 (new spec) | ⬜ pending |
| 181-06-04 | 06 | 4 | NAV-01 | — | Desktop-centered 480px pill at 1280×800 | smoke | `npx playwright test tests/smoke/bottom-tab-bar.spec.ts -g "centered desktop"` | ❌ W0 (new spec) | ⬜ pending |
| 181-06-05 | 06 | 4 | — | — | No console errors during the spec | smoke | `collectConsoleErrors` helper attached | ❌ W0 (helper exists) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Task IDs are placeholders — gsd-planner assigns final IDs in PLAN.md frontmatter.*

---

## Wave 0 Requirements

- [x] Jest config supports `app/components/EmberGlass/__tests__/` pattern (Phase 175+ precedent — verified).
- [x] Playwright config supports `tests/smoke/*.spec.ts` (Phase 51 / 97 / 174-180 precedent — verified).
- [x] `collectConsoleErrors` + `dismissVersionEnforcerIfPresent` helpers exist verbatim in `tests/smoke/rooms-tab.spec.ts:33,53` — copy into the new spec.
- [x] No new framework install (`npm install` is forbidden by CLAUDE.md Rule 4).

*All test infrastructure pre-exists; W0 has zero gaps.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real iPhone home-indicator inset (`env(safe-area-inset-bottom)` actually returns ~34px) | NAV-04 | Headless Chromium does NOT simulate the inset (returns 0 — see RESEARCH § Pitfall 4). CDP `Emulation.setDeviceMetricsOverride.safeAreaInsets` is Chrome 119+ and fragile. | Install the PWA on a real iPhone (or iOS simulator), open the app, verify the bar visually clears the home indicator. Toggle landscape orientation; bar repins correctly. |
| Visual smoothness of accent-glow re-paint when developer accent picker (Phase 174 D-03) changes hue | NAV-02 | CSS `color-mix` repaint is a visual property; assert via eye, not pixel diff (avoids flakiness). | Open `/debug/design-system-v2`, switch accent color (red → orange → ember), confirm active tab glow re-tints in real time without reload. |
| iOS PWA standalone mode rendering (status-bar overlap, no double safe-area) | NAV-04 | iOS standalone mode quirks (`apple-mobile-web-app-status-bar-style: black-translucent`) only manifest after install-to-home-screen. | Install PWA from Safari → Add to Home Screen, launch from home screen, verify top WS chip is below the notch and bottom bar is above the home indicator. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are covered by Wave 0 (all W0 gaps already filled by existing infrastructure).
- [x] Sampling continuity: scoped commands per CLAUDE.md Rule 8; no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers all MISSING references — none missing.
- [x] No watch-mode flags (per repo convention).
- [x] Feedback latency < 30s (test:changed default scope).
- [ ] `nyquist_compliant: true` — flip when planner finalizes task IDs and gsd-planner echoes the validation map into PLAN.md frontmatter.

**Approval:** pending — awaiting plan finalization.
