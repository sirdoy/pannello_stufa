---
phase: 157
slug: auth-module
status: partial_accepted
nyquist_compliant: false
accepted_as: partial
accepted_by: phase-165-hygiene
accepted_date: 2026-04-15
wave_0_complete: false
created: 2026-04-08
---

# Phase 157 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (existing) |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npm test -- --testPathPattern="auth"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="auth"`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 157-01-01 | 01 | 1 | AUTH-01 | T-157-01 | Credentials never leaked in response | unit | `npm test -- --testPathPattern="auth/login"` | ❌ W0 | ⬜ pending |
| 157-01-02 | 01 | 1 | AUTH-02 | T-157-02 | API key creation requires JWT only | unit | `npm test -- --testPathPattern="auth/api-keys/route"` | ❌ W0 | ⬜ pending |
| 157-01-03 | 01 | 1 | AUTH-03 | — | N/A | unit | `npm test -- --testPathPattern="auth/api-keys/route"` | ❌ W0 | ⬜ pending |
| 157-01-04 | 01 | 1 | AUTH-04 | T-157-03 | keyId validated as finite positive number | unit | `npm test -- --testPathPattern="auth/api-keys/\\[keyId\\]"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/api/auth/login/route.test.ts` — stubs for AUTH-01
- [ ] `__tests__/api/auth/api-keys/route.test.ts` — stubs for AUTH-02, AUTH-03
- [ ] `__tests__/api/auth/api-keys/[keyId]/route.test.ts` — stubs for AUTH-04

*Existing infrastructure covers framework requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| HA proxy connectivity | AUTH-01 | Requires live HA proxy instance | POST to /api/auth/login with valid credentials, verify JWT returned |

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
- `app/api/auth/**/__tests__/route.test.ts` -- auth proxy client, login, api-keys CRUD routes (AUTH-01..04)

**Tests acceptably missing:**
- Login form + API-keys management UI E2E -- tracked in Phase 170 (Auth UI). Not a Nyquist gap for this backend-only phase.

**Accepted-as:** partial. Backend routes tested; UI consumer deferred to Phase 170 per roadmap.

**Reference:** Phase 165 CONTEXT D-11, D-12. v19.0 audit `nyquist.partial_phases` entry.
