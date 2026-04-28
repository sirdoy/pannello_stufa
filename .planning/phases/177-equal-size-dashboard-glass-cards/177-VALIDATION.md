---
phase: 177
slug: equal-size-dashboard-glass-cards
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-28
---

# Phase 177 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x + Playwright (smoke) |
| **Config file** | `jest.config.js`, `playwright.config.ts` |
| **Quick run command** | `npm run test:changed` |
| **Full suite command** | `npm run test:components -- --testPathPattern='EmberGlass\|DashboardCards'` |
| **Estimated runtime** | ~30s scoped, ~3min full components |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:changed`
- **After every plan wave:** Run `npm run test:components -- --testPathPattern='EmberGlass\|DashboardCards'`
- **Before `/gsd-verify-work`:** Full scoped suites must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | DASH-01..DASH-12 | — | N/A (UI-only phase) | unit + component | `npm run test:components -- --testPathPattern='EmberGlass\|DashboardCards'` | ❌ W0 | ⬜ pending |

*Per-task rows populated by planner; this row is a placeholder until plans are written.*

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/components/EmberGlass/__tests__/GlassCard.test.tsx` — aspect-ratio + outer footprint assertions (DASH-01)
- [ ] `app/components/EmberGlass/__tests__/CardHeader.test.tsx` — title + status dot semantics
- [ ] `app/components/EmberGlass/__tests__/PrimaryStat.test.tsx` — 36px font weight + unit suffix
- [ ] `app/components/EmberGlass/__tests__/InlineRow.test.tsx` — ≤4 item truncation contract
- [ ] `app/components/EmberGlass/__tests__/CountFooter.test.tsx` — N/M counter format
- [ ] `app/components/EmberGlass/__tests__/PlayingBars.test.tsx` — 3-bar animation + reduced-motion
- [ ] `app/components/EmberGlass/__tests__/StatusDots.test.tsx` — overflow `+N` rendering
- [ ] `app/components/__tests__/DashboardCards.test.tsx` — 2-col grid + 9-card render order + stagger flatIndex
- [ ] Per-card test stubs for the 9 cards (Stove, Climate, Lights, Sonos, Weather, Camera, Network, Raspi, Tuya/Plugs)
- [ ] Existing `splitIntoColumns` test — confirm removal/retention
- [ ] Playwright smoke spec for `/` dashboard 2-col grid + tap-to-open Sheet (DASH-03)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| v9.0 mount stagger visible on fresh load | DASH-11 | Animation timing — flaky in jsdom; visual judgment | Hard-reload `/`, observe each card fade-in delayed by initialDelay; record screen capture if regression suspected. |
| React Compiler: zero new opt-outs | DASH-12 | `react-compiler-healthcheck` CLI not installed; substitute is grep-based | Run `grep -RE "useMemo\|useCallback" app/components/EmberGlass/ app/components/cards/ \| wc -l` — must be 0 (or unchanged from baseline). |
| 1:1 aspect ratio + identical outer footprint | DASH-01 | Visual + DOM snapshot on real viewport | Open DevTools at 360x800, inspect each card, confirm `aspect-ratio: 1 / 1` and matching `clientWidth × clientHeight`. |
| Tap-to-open opens correct Sheet (Phase 178 contract) | DASH-03 | Phase 178 not yet executed; placeholder Sheet body acceptable | Tap each card; confirm Sheet opens for non-readonly cards (Stove/Climate/Lights/Sonos/Camera/Network/Tuya); confirm Weather + Raspi do NOT open. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
