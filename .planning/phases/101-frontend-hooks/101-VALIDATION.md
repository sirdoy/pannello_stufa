---
phase: 101
slug: frontend-hooks
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 101 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="stove" --bail` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds (stove tests), ~180 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="stove" --bail`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 101-01-01 | 01 | 1 | UI-01, UI-02 | unit | `npx jest stoveStatusUtils` | ✅ | ⬜ pending |
| 101-01-02 | 01 | 1 | UI-01 | unit | `npx jest useStoveData` | ✅ | ⬜ pending |
| 101-02-01 | 02 | 1 | UI-03 | unit | `npx jest useStoveCommands` | ✅ | ⬜ pending |
| 101-02-02 | 02 | 1 | UI-04 | unit | `npx jest StoveBanners` | ✅ | ⬜ pending |
| 101-02-03 | 02 | 1 | UI-05 | unit | `npx jest useStoveData` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Test files already exist:
- `app/components/devices/stove/stoveStatusUtils.test.ts`
- `app/components/devices/stove/hooks/useStoveData.test.ts`
- `app/components/devices/stove/hooks/useStoveCommands.test.ts`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Staleness indicator visual display | UI-05 | Visual rendering of STALE badge | Load stove card when proxy returns data_freshness: STALE, verify visual indicator appears |
| Error banner display | UI-04 | Visual rendering of error text | Load stove card when proxy returns alarm state with error_code/error_description, verify banner text |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
