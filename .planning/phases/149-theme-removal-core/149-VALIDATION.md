---
phase: 149
slug: theme-removal-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 149 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npx jest --passWithNoTests --bail 2>&1 | tail -5` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --passWithNoTests --bail 2>&1 | tail -5`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 149-01-01 | 01 | 1 | THEME-02 | grep | `test ! -f app/context/ThemeContext.tsx` | ✅ | ⬜ pending |
| 149-01-02 | 01 | 1 | THEME-03 | grep | `test ! -f app/components/ThemeScript.tsx` | ✅ | ⬜ pending |
| 149-01-03 | 01 | 1 | THEME-01 | grep | `test ! -f lib/themeService.ts` | ✅ | ⬜ pending |
| 149-01-04 | 01 | 1 | THEME-05 | grep | `test ! -f app/api/user/theme/route.ts` | ✅ | ⬜ pending |
| 149-01-05 | 01 | 1 | THEME-04 | grep | `test ! -f app/settings/theme/page.tsx` | ✅ | ⬜ pending |
| 149-01-06 | 01 | 1 | THEME-04 | grep | `grep -c "aspetto\|Aspetto\|ThemeContent\|useTheme" app/settings/page.tsx` returns 0 | ✅ | ⬜ pending |
| 149-01-07 | 01 | 1 | THEME-08 | grep | `grep 'class.*dark' app/layout.tsx` matches | ✅ | ⬜ pending |
| 149-01-08 | 01 | 1 | THEME-09 | grep | `grep 'theme-color.*#0f172a' app/layout.tsx` matches | ✅ | ⬜ pending |
| 149-01-09 | 01 | 1 | THEME-02 | grep | `grep -r "ThemeProvider\|useTheme\|ThemeScript" app/components/ClientProviders.tsx` returns 0 | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Delete `__tests__/lib/themeService.test.ts` — must happen before or with service deletion to avoid jest errors

---

## Validation Architecture

### Verification Strategy

This phase is purely destructive (file deletions + 3 surgical edits). Verification is grep-based:

1. **File absence checks** — Confirm 6 deleted files no longer exist
2. **Import absence checks** — Confirm no remaining imports of deleted modules across codebase
3. **Hardcoding checks** — Confirm `class="dark"` on html and `theme-color` meta tag present
4. **Test suite** — Full `npm test` must pass with no import errors from deleted modules

### Risk Areas

- `app/settings/page.tsx` — Highest risk: surgical removal of ThemeContent function and Aspetto tab
- `app/components/ClientProviders.tsx` — Medium risk: provider tree restructuring
- `app/layout.tsx` — Low risk: className append + script removal + meta addition
