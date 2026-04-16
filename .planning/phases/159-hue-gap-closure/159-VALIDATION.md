---
phase: 159
slug: hue-gap-closure
status: partial_accepted
nyquist_compliant: false
accepted_as: partial
accepted_by: phase-165-hygiene
accepted_date: 2026-04-15
wave_0_complete: false
created: 2026-04-09
---

# Phase 159 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --testPathPattern="app/api/v1/hue" --no-coverage` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds (targeted), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="app/api/v1/hue" --no-coverage`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 159-01-01 | 01 | 1 | HUE-01 | — | Auth required on health endpoint | unit | `npx jest --testPathPattern="app/api/v1/hue/health"` | ❌ W0 | ⬜ pending |
| 159-01-02 | 01 | 1 | HUE-02 | — | Auth required, path param validated | unit | `npx jest --testPathPattern="app/api/v1/hue/lights/\\[lightId\\]"` | ❌ W0 | ⬜ pending |
| 159-01-03 | 01 | 1 | HUE-03 | — | Auth required, body parsed safely | unit | `npx jest --testPathPattern="app/api/v1/hue/lights/\\[lightId\\]/state"` | ❌ W0 | ⬜ pending |
| 159-01-04 | 01 | 1 | HUE-04 | — | Auth required on groups list | unit | `npx jest --testPathPattern="app/api/v1/hue/groups/__tests__"` | ❌ W0 | ⬜ pending |
| 159-01-05 | 01 | 1 | HUE-05 | — | Auth required, path param validated | unit | `npx jest --testPathPattern="app/api/v1/hue/groups/\\[groupId\\]/__tests__"` | ❌ W0 | ⬜ pending |
| 159-01-06 | 01 | 1 | HUE-06 | — | Auth required, path params validated | unit | `npx jest --testPathPattern="app/api/v1/hue/groups/\\[groupId\\]/scenes"` | ❌ W0 | ⬜ pending |
| 159-01-07 | 01 | 1 | HUE-07 | — | Auth required, body parsed safely | unit | `npx jest --testPathPattern="app/api/v1/hue/groups/\\[groupId\\]/action"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — Jest configured, test patterns established in old /api/hue/ routes.*

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

---

## Resolution (Phase 165 Hygiene Closeout)

**Resolved:** 2026-04-15
**Verdict:** `partial_accepted` -- `nyquist_compliant: false`

**Tests present (covering phase requirements):**
- `app/api/v1/hue/health/__tests__/route.test.ts` -- bridge health (HUE-01)
- `app/api/v1/hue/lights/[lightId]/__tests__/route.test.ts` -- single light GET (HUE-02)
- `app/api/v1/hue/lights/[lightId]/state/__tests__/route.test.ts` -- light state PUT (HUE-03)
- `app/api/v1/hue/groups/__tests__/route.test.ts` -- groups list + single group + group action + scene activation (HUE-04..07)

**Tests acceptably missing:**
- Hook/UI migration to new v1 routes -- tracked in Phase 166 (Hue Frontend Cutover). Not a Nyquist gap for a backend-boundary phase.

**Accepted-as:** partial. Backend tested; frontend integration tracked in Phase 166.

**Reference:** Phase 165 CONTEXT D-11, D-12. v19.0 audit `nyquist.partial_phases` entry.
