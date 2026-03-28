---
phase: 144
slug: connection-ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 144 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x + React Testing Library (jest-environment-jsdom) |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npm test -- --testPathPattern="useRelativeTime\|LastUpdated\|NavbarConnectionStatus" --passWithNoTests` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds (quick), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="useRelativeTime|LastUpdated|NavbarConnectionStatus" --passWithNoTests`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 144-01-01 | 01 | 1 | UX-03 | unit | `npm test -- --testPathPattern="useRelativeTime"` | ❌ W0 | ⬜ pending |
| 144-01-02 | 01 | 1 | UX-03 | unit | `npm test -- --testPathPattern="LastUpdated"` | ❌ W0 | ⬜ pending |
| 144-01-03 | 01 | 1 | UX-01 | unit | `npm test -- --testPathPattern="NavbarConnectionStatus"` | ❌ W0 | ⬜ pending |
| 144-02-01 | 02 | 2 | UX-03 | unit | `npm test -- --testPathPattern="useStoveData\|useNetworkData\|useLightsData\|useSonosData\|useDirigeraData\|useThermostatData"` | ✅ | ⬜ pending |
| 144-02-02 | 02 | 2 | UX-02 | unit | `npm test -- --testPathPattern="useStoveData"` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/hooks/__tests__/useRelativeTime.test.ts` — stubs for UX-03 (formatRelativeTime + hook interval)
- [ ] `app/components/ui/__tests__/LastUpdated.test.tsx` — stubs for UX-03 (null/value rendering)
- [ ] `app/components/layout/__tests__/NavbarConnectionStatus.test.tsx` — stubs for UX-01 (ReadyState mapping + labels)

*Existing infrastructure covers Jest + RTL — no framework installation needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| WS→polling transition is flicker-free | UX-02 | Visual continuity cannot be asserted in JSDOM | Open app with WS connected, disconnect WS (kill server), verify cards don't flash/blank |
| Connection indicator appears in Navbar | UX-01 | Layout position requires visual verification | Open dashboard, verify green dot + "Connesso via WS" visible in header area |
| Relative timestamps update in real-time | UX-03 | Continuous animation requires visual observation | Load dashboard, wait 15s, verify timestamps progress from "5s fa" to "15s fa" |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
