---
phase: 139
slug: websocket-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 139 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern websocket --bail` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (WS tests only) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern websocket --bail`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 139-01-01 | 01 | 1 | WS-06 | unit | `npx jest types/websocket` | ❌ W0 | ⬜ pending |
| 139-01-02 | 01 | 1 | WS-01, WS-04 | unit | `npx jest useWebSocketManager` | ❌ W0 | ⬜ pending |
| 139-01-03 | 01 | 1 | WS-02, WS-03, WS-05 | unit | `npx jest useWebSocketManager` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/lib/hooks/useWebSocketManager.test.ts` — stubs for WS-01 through WS-05
- [ ] `__tests__/types/websocket.test.ts` — type compilation checks for WS-06

*Existing Jest infrastructure covers all framework needs. No new framework install required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Two tabs share connection (MAX 2) | WS-01 | Requires multi-tab browser | Open app in 2 tabs, check DevTools WS connections |
| Reconnection within 30s | WS-04 | Requires network interruption | Disconnect WiFi, wait, reconnect, verify WS reconnects |
| Re-subscribe after reconnect | WS-05 | Requires server-side verification | Check server logs for re-subscribe messages after reconnect |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
