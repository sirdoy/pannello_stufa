---
phase: 142
slug: sonos-dirigera-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 142 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npm test -- --testPathPattern="useSonosData\|useDirigeraData"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (targeted), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="useSonosData\|useDirigeraData"`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 142-01-01 | 01 | 1 | MIG-09 | unit | `npm test -- --testPathPattern=useSonosData` | ✅ | ⬜ pending |
| 142-01-02 | 01 | 1 | MIG-10 | unit | `npm test -- --testPathPattern=useSonosData` | ✅ | ⬜ pending |
| 142-02-01 | 02 | 1 | MIG-11 | unit | `npm test -- --testPathPattern=useDirigeraData` | ❌ W0 | ⬜ pending |
| 142-02-02 | 02 | 1 | MIG-12 | unit | `npm test -- --testPathPattern=useDirigeraData` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/components/devices/dirigera/hooks/useDirigeraData.test.ts` — stubs for MIG-11, MIG-12 (file does not exist yet)

*useSonosData.test.ts exists but needs WS test cases added in Wave 1.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live WS update visible on Sonos card | MIG-09 | Requires real WS server | Connect to WS, change speaker state, verify card updates within ~1s |
| Live WS update visible on DIRIGERA card | MIG-11 | Requires real WS server | Connect to WS, change sensor state, verify card updates within ~1s |
| Polling fallback activates on WS disconnect | MIG-10, MIG-12 | Requires WS disconnect simulation | Disconnect WS, verify polling resumes within one interval |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
