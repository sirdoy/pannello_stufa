---
phase: 158
slug: automations-module
status: partial_accepted
nyquist_compliant: false
accepted_as: partial
accepted_by: phase-165-hygiene
accepted_date: 2026-04-15
wave_0_complete: false
created: 2026-04-08
---

# Phase 158 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern=automations --bail` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=automations --bail`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 158-01-01 | 01 | 1 | AUTO-01 | — | N/A | unit | `npx jest --testPathPattern=automationsProxy` | ❌ W0 | ⬜ pending |
| 158-01-02 | 01 | 1 | AUTO-02 | — | N/A | unit | `npx jest --testPathPattern=automationsProxy` | ❌ W0 | ⬜ pending |
| 158-01-03 | 01 | 1 | AUTO-03 | — | N/A | unit | `npx jest --testPathPattern=automationsProxy` | ❌ W0 | ⬜ pending |
| 158-01-04 | 01 | 1 | AUTO-04 | — | N/A | unit | `npx jest --testPathPattern=automationsProxy` | ❌ W0 | ⬜ pending |
| 158-01-05 | 01 | 1 | AUTO-05 | — | N/A | unit | `npx jest --testPathPattern=automationsProxy` | ❌ W0 | ⬜ pending |
| 158-01-06 | 01 | 1 | AUTO-06 | — | N/A | unit | `npx jest --testPathPattern=automationsProxy` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/automations/__tests__/automationsProxy.test.ts` — stubs for AUTO-01 through AUTO-06
- [ ] Test fixtures for AutomationRule and ExecutionRecord types

*Existing jest infrastructure covers all framework requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| FormModal renders correctly | AUTO-02 | Visual UI verification | Open /automations, click "Nuova Regola", verify form fields render |
| Navigation entry visible | D-07 | Visual nav check | Verify "Automazioni" appears in navbar |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---

## Resolution (Phase 165 Hygiene Closeout)

**Resolved:** 2026-04-15
**Verdict:** `partial_accepted` -- `nyquist_compliant: false`

**Tests present (covering phase requirements):**
- `app/api/v1/automations/__tests__/route.test.ts` -- CRUD list/create routes (AUTO-01, AUTO-02)
- `app/api/v1/automations/[rule_id]/__tests__/route.test.ts` -- single rule GET/PATCH/DELETE (AUTO-03..05)
- `app/api/v1/automations/[rule_id]/executions/__tests__/route.test.ts` -- execution history (AUTO-06)
- Phase 158 includes frontend pages (nav entry + rules list + rule detail)

**Tests acceptably missing:**
- None significant -- this is a full-stack phase with both API and UI wired.

**Accepted-as:** partial. Only `draft` frontmatter marker needed upgrade; phase is functionally complete.

**Reference:** Phase 165 CONTEXT D-11, D-12. v19.0 audit `nyquist.partial_phases` entry.
