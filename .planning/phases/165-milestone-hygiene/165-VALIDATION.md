---
phase: 165
slug: milestone-hygiene
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-16
---

# Phase 165 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x with `next/jest` wrapper |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npm test -- --testPathPattern="automations\|thermorossi/settings" --bail` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (targeted), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit` (code tasks) or `grep` spot-check (doc-only tasks)
- **After every plan wave:** Run `npx tsc --noEmit` + `npm test -- --testPathPattern="automations|thermorossi/settings"`
- **Before `/gsd-verify-work`:** All 10 invariants from RESEARCH.md §10 green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 165-01-01 | 01 | 1 | COMMON-01 | grep | `for h in $(grep -oE '\b[0-9a-f]{7,8}\b' .planning/phases/{156..163}-*/*SUMMARY.md \| sort -u); do git log --all --oneline \| grep -q "^$h" \|\| echo "MISSING: $h"; done` | ⬜ pending |
| 165-01-02 | 01 | 1 | COMMON-01 | grep | `grep "auth: none (public probe)" .planning/REQUIREMENTS.md` | ⬜ pending |
| 165-01-03 | 01 | 1 | COMMON-02 | tsc+unit | `npx tsc --noEmit && npm test -- --testPathPattern="automations\|thermorossi/settings"` | ⬜ pending |
| 165-01-04 | 01 | 1 | COMMON-01 | grep | `test ! -f .planning/phases/163-dirigera-gap-closure/deferred-items.md` | ⬜ pending |
| 165-02-01 | 02 | 1 | COMMON-02 | grep | `for p in 156 157 158 159 160 161 162; do grep -q "status: partial_accepted" .planning/phases/$p-*/$p-VALIDATION.md \|\| echo "STILL DRAFT: $p"; done` | ⬜ pending |
| 165-02-02 | 02 | 1 | COMMON-02 | grep | `grep "^status: hygiene_closed" .planning/v19.0-MILESTONE-AUDIT.md` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files, framework installs, or fixtures needed. `zod` already in `package.json` dependencies.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SUMMARY hash correctness | COMMON-01 | Requires `git show <hash> --stat` human judgment | Executor verifies each replacement hash's `--stat` output matches SUMMARY's `key_files.created` |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
