---
phase: 164
slug: phase-156-regression-fix
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-15
---

# Phase 164 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x (via `npm test`) |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npm test -- --testPathPattern="stove\|idempotency\|useRetryableCommand" --no-coverage` |
| **Full suite command** | `npm test -- --no-coverage` |
| **Estimated runtime** | ~15s quick / ~90s full |

---

## Sampling Rate

- **After every task commit:** Run quick command (stove + idempotency + retry tests)
- **After every plan wave:** Run full suite command + grep sweep for `/api/stove/`
- **Before `/gsd-verify-work`:** Full suite green, zero `/api/stove/` refs outside `lib/version.ts`
- **Max feedback latency:** ~15 seconds per commit

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 164-01-01 | 01 | 1 | PATH-01 | — | N/A (cleanup) | smoke | `test ! -d app/api/stove` | ✅ | ⬜ pending |
| 164-01-02 | 01 | 1 | PATH-02 | — | N/A | grep | `grep -c '/v1/thermorossi/' lib/routes.ts` returns 7 | ✅ | ⬜ pending |
| 164-01-03 | 01 | 1 | PATH-02 | — | Auth preserved via STOVE_ROUTES constants | grep | `grep -c '/api/stove/' lib/commands/deviceCommands.tsx` returns 0 | ✅ | ⬜ pending |
| 164-01-04 | 01 | 1 | PATH-02 | — | SW cache path canonical | grep | `grep -c '/api/v1/thermorossi/status' app/sw.ts` returns 2 | ✅ | ⬜ pending |
| 164-01-05 | 01 | 1 | PATH-02 | — | Debug panels canonical | grep | `grep -c '/api/v1/thermorossi/' app/debug/components/tabs/StoveTab.tsx` >= 40 | ✅ | ⬜ pending |
| 164-02-01 | 02 | 2 | PATH-02 | — | Tests assert canonical paths | unit | `npm test -- --testPathPattern=useStoveData --no-coverage` | ✅ | ⬜ pending |
| 164-02-02 | 02 | 2 | PATH-02 | — | Command tests canonical | unit | `npm test -- --testPathPattern=useStoveCommands --no-coverage` | ✅ | ⬜ pending |
| 164-02-03 | 02 | 2 | PATH-02 | — | Idempotency test canonical | unit | `npm test -- --testPathPattern=idempotencyManager --no-coverage` | ✅ | ⬜ pending |
| 164-02-04 | 02 | 2 | PATH-02 | — | Retry test canonical | unit | `npm test -- --testPathPattern=useRetryableCommand --no-coverage` | ✅ | ⬜ pending |
| 164-02-05 | 02 | 2 | PATH-01, PATH-02 | — | Zero legacy refs | grep | `grep -rn '/api/stove/' app/ lib/ components/ __tests__/ --include='*.ts' --include='*.tsx' \| grep -v 'version.ts' \| wc -l` returns 0 | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files, fixtures, or configuration needed. All test files exist; they only need string-literal retargeting from `/api/stove/*` to `/api/v1/thermorossi/*`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Service-worker re-activates cleanly on deploy (old SW with `/api/stove/status` cache eventually replaced) | PATH-02 | Browser SW lifecycle not testable in Jest | Deploy to staging, hard-reload, check DevTools → Application → Service Workers shows new version, offline stove panel loads status |
| Command palette increment/decrement power + fan actions (5 commands) succeed end-to-end | PATH-02 | Requires live Thermorossi device | Open command palette, run "Aumenta potenza", verify stove changes level; repeat for decrease/fan commands |
| Offline notification action "Spegni stufa" still triggers canonical `/api/v1/thermorossi/commands/shutdown` | PATH-02 | Requires push notification delivery | Trigger test notification with shutdown action, click action while offline, verify queued command executes canonical endpoint on reconnect |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none required)
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter (set by planner after per-task map finalized)

**Approval:** pending
