---
phase: 109
slug: cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 109 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --passWithNoTests --no-coverage -q` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --passWithNoTests --no-coverage -q`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 109-01-01 | 01 | 1 | CLEAN-01,02,03,04,05,06 | deletion | `test ! -f lib/hue/hueApi.ts && test ! -f lib/hue/hueRemoteApi.ts` | N/A | ⬜ pending |
| 109-01-02 | 01 | 1 | CLEAN-04 | deletion | `test ! -d app/api/hue/remote && test ! -f app/api/hue/pair/route.ts` | N/A | ⬜ pending |
| 109-01-03 | 01 | 1 | CLEAN-07 | grep | `! grep -r 'HUE_CLIENT_SECRET\|NEXT_PUBLIC_HUE_CLIENT_ID\|NEXT_PUBLIC_HUE_APP_ID' .env.example` | N/A | ⬜ pending |
| 109-01-04 | 01 | 1 | ALL | import | `! grep -r 'from.*hueApi\|from.*hueRemote\|from.*hueConnection\|from.*hueLocal' app/ lib/ --include='*.ts' --include='*.tsx'` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This is a deletion phase — validation is file-existence and import-chain checking, not test creation.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No broken imports at runtime | ALL | TypeScript compiler catches static imports but not dynamic | Run `npx tsc --noEmit` after deletion |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
