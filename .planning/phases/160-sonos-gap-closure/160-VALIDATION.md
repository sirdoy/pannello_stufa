---
phase: 160
slug: sonos-gap-closure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-09
---

# Phase 160 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="app/api/v1/sonos" --no-coverage` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds (targeted), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="app/api/v1/sonos" --no-coverage`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 160-01-01 | 01 | 1 | SONOS-01 | — | Auth required (401 without session) | unit | `npx jest app/api/v1/sonos/zones/\\[groupId\\]/playback` | ❌ W0 | ⬜ pending |
| 160-01-02 | 01 | 1 | SONOS-02 | — | Auth required (401 without session) | unit | `npx jest app/api/v1/sonos/zones/\\[groupId\\]/play` | ❌ W0 | ⬜ pending |
| 160-01-03 | 01 | 1 | SONOS-03 | — | Auth required (401 without session) | unit | `npx jest app/api/v1/sonos/zones/\\[groupId\\]/pause` | ❌ W0 | ⬜ pending |
| 160-01-04 | 01 | 1 | SONOS-04 | — | Auth required (401 without session) | unit | `npx jest app/api/v1/sonos/zones/\\[groupId\\]/stop` | ❌ W0 | ⬜ pending |
| 160-01-05 | 01 | 1 | SONOS-05 | — | Auth required (401 without session) | unit | `npx jest app/api/v1/sonos/zones/\\[groupId\\]/next` | ❌ W0 | ⬜ pending |
| 160-01-06 | 01 | 1 | SONOS-06 | — | Auth required (401 without session) | unit | `npx jest app/api/v1/sonos/zones/\\[groupId\\]/previous` | ❌ W0 | ⬜ pending |
| 160-01-07 | 01 | 1 | SONOS-07 | — | Auth required (401 without session) | unit | `npx jest app/api/v1/sonos/zones/\\[groupId\\]/volume` | ❌ W0 | ⬜ pending |
| 160-01-08 | 01 | 1 | SONOS-08 | — | Auth required (401 without session) | unit | `npx jest app/api/v1/sonos/zones/\\[groupId\\]/seek` | ❌ W0 | ⬜ pending |
| 160-01-09 | 01 | 1 | SONOS-09, SONOS-10 | — | Auth required (401 without session) | unit | `npx jest app/api/v1/sonos/zones/\\[groupId\\]/play-mode` | ❌ W0 | ⬜ pending |
| 160-01-10 | 01 | 1 | SONOS-11 | — | Auth required (401 without session) | unit | `npx jest app/api/v1/sonos/zones/\\[groupId\\]/queue` | ❌ W0 | ⬜ pending |
| 160-01-11 | 01 | 1 | SONOS-12, SONOS-13 | — | Auth required (401 without session) | unit | `npx jest app/api/v1/sonos/zones/\\[groupId\\]/sleep-timer` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. Jest is configured, auth mocking patterns established in Phase 159.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
