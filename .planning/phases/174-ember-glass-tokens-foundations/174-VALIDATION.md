---
phase: 174
slug: ember-glass-tokens-foundations
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-27
verified: 2026-05-03
---

# Phase 174 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x (unit/component) + Playwright 1.x (e2e) |
| **Config file** | `jest.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npm run test:changed` |
| **Full suite command** | `npm run test:components && npm run test:pages` |
| **Estimated runtime** | ~30s scoped, ~120s full subset |

---

## Sampling Rate

- **After every task commit:** `npm run test:changed`
- **After every plan wave:** scoped scripts touching modified areas (`npm run test:components`, `npm run test:pages`)
- **Before `/gsd-verify-work`:** all scoped subsets green + Playwright smoke pass
- **Max feedback latency:** ~30 seconds (CLAUDE.md rule 8: never bare `npm test` from agents)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 174-01-01 | 01 | 1 | DS-04 | — | next/font self-hosts; no Google CDN runtime fetch | grep + build | `grep -E "fonts\\.googleapis\\.com" app/ \|\| true` (must return empty) + `npm run test:changed -- app/fonts.ts` | ❌ W0 | ⬜ pending |
| 174-01-02 | 01 | 1 | DS-01 | — | All 11 token CSS variables present on `:root` | grep | `grep -E "^\\s+--(glass-bg\|glass-blur\|glass-border\|glass-shadow\|accent\|text-1\|text-2\|r-card\|pad-card\|font-display\|font-body):" app/globals.css \| wc -l` (must equal 11) | ✅ existing | ⬜ pending |
| 174-01-03 | 01 | 1 | DS-06 | — | `@supports not` fallback present + WebKit-prefixed backdrop-filter | grep | `grep -E "@supports not.*backdrop-filter\|-webkit-backdrop-filter" app/globals.css \| wc -l` (must be ≥ 2) | ✅ existing | ⬜ pending |
| 174-02-01 | 02 | 2 | DS-05 | — | AmbientBg component exists, reads localStorage `ember-glass-ambient`, mounted in layout | unit | `npm run test:components -- AmbientBg` | ❌ W0 | ⬜ pending |
| 174-02-02 | 02 | 2 | DS-03, DS-05 | — | Inline pre-paint script in `app/layout.tsx` reads `ember-glass-accent` + `ember-glass-ambient` from localStorage and applies before paint | grep | `grep -E "ember-glass-accent\|ember-glass-ambient" app/layout.tsx` (must match both) | ✅ existing | ⬜ pending |
| 174-03-01 | 03 | 3 | DS-03 | — | `/debug/design-system-v2` page exists with 6-hue accent picker | unit | `npm run test:pages -- design-system-v2` | ❌ W0 | ⬜ pending |
| 174-03-02 | 03 | 3 | DS-04 | — | Playwright network assertion: zero `fonts.googleapis.com` requests on page load | e2e | `npx playwright test tests/smoke/fonts-self-hosted.spec.ts` | ❌ W0 | ⬜ pending |
| 174-03-03 | 03 | 3 | DS-02 | — | DS-02 audit: zero hardcoded glass/blur/accent hex values in NEW glass surfaces (D-04 scope) | grep | `grep -rE "rgba\\(255,\\s*255,\\s*255,\\s*0\\.04\)\|backdrop-filter:\\s*blur\\([0-9]" app/debug/design-system-v2/ app/components/EmberGlass/ \|\| true` (must return empty — values come from CSS vars) | ❌ W0 | ⬜ pending |
| 174-03-04 | 03 | 3 | DS-03 | — | Live `--accent` swap on hue click (E2E) | e2e | `npx playwright test tests/smoke/accent-picker.spec.ts` | ❌ W0 | ⬜ pending |
| 174-03-05 | 03 | 3 | DS-05 | — | Ambient toggle persists in localStorage and survives hard reload | e2e | `npx playwright test tests/smoke/ambient-persist.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/smoke/fonts-self-hosted.spec.ts` — Playwright network assertion (zero `fonts.googleapis.com` requests)
- [ ] `tests/smoke/accent-picker.spec.ts` — Playwright: click hue swatch → assert `document.documentElement.style.getPropertyValue('--accent')` matches selected oklch value
- [ ] `tests/smoke/ambient-persist.spec.ts` — Playwright: toggle ambient on, hard reload, assert ambient layer present
- [ ] `app/components/EmberGlass/AmbientBg.test.tsx` — unit test: localStorage default OFF, custom event listener, cleanup
- [ ] `app/debug/design-system-v2/page.test.tsx` — page renders 6 hue presets + ambient toggle
- [ ] No new framework install needed — Jest + Playwright already configured

*Pattern reference: `tests/smoke/page-loads.spec.ts:7-20` for `page.on()` listener with cleanup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Ambient gradient animations look correct | DS-05 | Visual/motion quality cannot be asserted by code; keyframe transforms reconstructed (research A1) | Open `/debug/design-system-v2`, toggle ambient on, observe three radial gradients animate at 14s/18s/22s. Compare against `.planning/inbox/ember-glass-design/project/Design System.html` |
| Glass surface fallback renders correctly on browsers without backdrop-filter | DS-06 | `@supports not` only triggers when feature genuinely absent; needs older Safari/Firefox build to verify | Use Safari Technology Preview with `Develop > Disable Backdrop Filter`, load `/debug/design-system-v2`, confirm demo card shows solid translucent background instead of going illegible |
| Outfit + Inter visual pairing matches design bundle | DS-04 | Typography aesthetic match cannot be code-asserted | Open `/debug/design-system-v2`, compare display headlines (Outfit) and body text (Inter) against `Design System.html` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [x] No watch-mode flags (Jest --watch / Playwright --ui forbidden in PLAN verify blocks)
- [x] Feedback latency < 30s for `test:changed`
- [x] `nyquist_compliant: true` set in frontmatter once all tasks pass

**Approval:** complete

---

## Audit Trail

### 2026-05-03 — Phase 183-05 status normalization

Frontmatter normalized from `status: draft` → `status: complete` per project convention (`complete` is the terminal post-verification value; cf. Phase 175 VALIDATION.md). `nyquist_compliant` flipped `false` → `true` and `wave_0_complete` flipped `false` → `true` per the v20.0 milestone audit (`.planning/v20.0-MILESTONE-AUDIT.md`), which confirms Phase 174 plans 1-3 all passed verification (5/5 must-haves) — the flag drift was a workflow artifact from `execute-phase` not flipping status post-verification. No new tests were generated; existing coverage is sufficient. See `.planning/phases/174-ember-glass-tokens-foundations/174-VERIFICATION.md` for the underlying evidence.
