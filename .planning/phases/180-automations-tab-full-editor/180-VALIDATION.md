---
phase: 180
slug: automations-tab-full-editor
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-30
---

# Phase 180 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Anchored on `180-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (component/unit/hook), playwright (smoke E2E) |
| **Config file** | `jest.config.js`, `tests/smoke/playwright.config.ts` |
| **Quick run command** | `npm run test:changed` |
| **Full suite command** | `npm run test:components && npm run test:unit` |
| **Smoke command** | `npx playwright test tests/smoke/automations-tab.spec.ts` |
| **Type-check** | `npx tsc --noEmit` |
| **Estimated runtime** | ~30s scoped jest, ~90s full unit+components, ~45s smoke |

---

## Sampling Rate

- **After every task commit:** `npm run test:changed` (must be green) + `npx tsc --noEmit` if any `.ts(x)` modified
- **After every plan wave:** `npm run test:components && npm run test:unit` (must be green)
- **Before `/gsd-verify-work`:** Full scoped suites + smoke must be green
- **Max feedback latency:** 90 seconds

---

## Per-Requirement Verification Map

| Requirement | Surface under test | Test Type | Automated Command | Wave |
|-------------|-------------------|-----------|-------------------|------|
| AUTO-01 | `<AutomationRow>` renders icon/name/description/InlineToggle/4 status pills | jest component | `npx jest app/components/EmberGlass/automations/__tests__/AutomationRow.test.tsx` | 3 |
| AUTO-02 | Editor sheet opens with name + description + 4 tabs + numeric badges | jest component | `npx jest app/components/EmberGlass/automations/__tests__/AutomationEditor.test.tsx` | 3 |
| AUTO-03 (adjusted D-08c) | `<TriggerSection>` renders 2 tiles, swap on click, edit-mode read-only | jest component | `npx jest app/components/EmberGlass/automations/__tests__/sections/TriggerSection.test.tsx` | 2 |
| AUTO-04 | `<ConditionGroup>` AND/OR toggle, depth-2 cap, 4 leaf forms, depth-aware bar color | jest component | `npx jest app/components/EmberGlass/automations/__tests__/ConditionGroup.test.tsx` | 2 |
| AUTO-05 (adjusted D-09) | Action picker renders 11 tiles; per-row reorder ↑/↓ + remove; 11 form bodies | jest component | `npx jest app/components/EmberGlass/automations/__tests__/sections/ActionsSection.test.tsx` | 2 |
| AUTO-06 | `<AdvancedSection>` numeric inputs round-trip min_interval_seconds + max_triggers_per_hour | jest component | `npx jest app/components/EmberGlass/automations/__tests__/sections/AdvancedSection.test.tsx` | 2 |
| AUTO-07 | Save button disabled until name + ≥1 action; unsaved-changes ConfirmationDialog on close | jest component | `npx jest app/components/EmberGlass/automations/__tests__/AutomationEditor.test.tsx` | 3 |
| AUTO-08 | Edit mode opens existing rule; trigger tab read-only; Delete confirm | jest component + playwright | `npx jest ... && npx playwright test tests/smoke/automations-tab.spec.ts` | 3 + 4 |
| Mapper round-trip (D-10) | `apiToDraft` ↔ `draftToApi` 11 fixtures | jest unit | `npx jest app/components/EmberGlass/automations/__tests__/lib/automations-mappers.test.ts` | 1 |
| `countConditions` (D-22) | leaf=1, always_true=0, AND/OR=sum, nested depth | jest unit | `npx jest app/components/EmberGlass/automations/__tests__/lib/countConditions.test.ts` | 1 |
| `describeTrigger` (D-21) | both types + null fallback | jest unit | `npx jest app/components/EmberGlass/automations/__tests__/lib/describeTrigger.test.ts` | 1 |
| `useAutomationsList` (D-23) | mock proxy create/update/delete/toggle each refetch + toast | jest hook | `npx jest app/hooks/__tests__/useAutomationsList.test.ts` | 3 |
| Console errors / E2E flow (D-27) | full smoke: nuova → fill → save → edit → toggle → delete → no console errors | playwright | `npx playwright test tests/smoke/automations-tab.spec.ts` | 4 |
| Type rewrite (D-05) doesn't break | tsc + legacy `__tests__/lib/automationsProxy.test.ts` + `app/automations/__tests__/*` (if any) green | jest + tsc | `npx tsc --noEmit && npx jest __tests__/lib/automationsProxy.test.ts app/automations/__tests__/` | 1 |
| PATCH delta excludes `trigger` (D-13) | `useAutomationsList.update` calls proxy with no `trigger` field | jest hook with mock | covered by `useAutomationsList.test.ts` | 3 |

---

## Wave 0 Requirements (test-file gaps)

Per research § Validation Architecture, these test files do NOT yet exist and MUST be authored alongside production code in their respective waves (Wave 0 is implicit — no dedicated install wave needed; jest infra already present):

- [ ] `app/components/EmberGlass/automations/__tests__/AutomationsTab.test.tsx`
- [ ] `app/components/EmberGlass/automations/__tests__/AutomationRow.test.tsx`
- [ ] `app/components/EmberGlass/automations/__tests__/AutomationEditor.test.tsx`
- [ ] `app/components/EmberGlass/automations/__tests__/sections/TriggerSection.test.tsx`
- [ ] `app/components/EmberGlass/automations/__tests__/sections/ConditionsSection.test.tsx`
- [ ] `app/components/EmberGlass/automations/__tests__/sections/ActionsSection.test.tsx`
- [ ] `app/components/EmberGlass/automations/__tests__/sections/AdvancedSection.test.tsx`
- [ ] `app/components/EmberGlass/automations/__tests__/ConditionGroup.test.tsx`
- [ ] `app/components/EmberGlass/automations/__tests__/ActionRow.test.tsx`
- [ ] `app/components/EmberGlass/automations/__tests__/forms/TriggerForms.test.tsx`
- [ ] `app/components/EmberGlass/automations/__tests__/forms/ConditionForms.test.tsx`
- [ ] `app/components/EmberGlass/automations/__tests__/forms/ActionForms.test.tsx`
- [ ] `app/components/EmberGlass/automations/__tests__/lib/automations-config.test.ts`
- [ ] `app/components/EmberGlass/automations/__tests__/lib/automations-mappers.test.ts`
- [ ] `app/components/EmberGlass/automations/__tests__/lib/countConditions.test.ts`
- [ ] `app/components/EmberGlass/automations/__tests__/lib/describeTrigger.test.ts`
- [ ] `app/hooks/__tests__/useAutomationsList.test.ts`
- [ ] `tests/smoke/automations-tab.spec.ts` (Phase 179 helpers reused: `collectConsoleErrors`, `dismissVersionEnforcerIfPresent`, `dismissWhatsNewModalIfPresent`, `primeDashboardForSheetTest`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual parity with bundle (typography, spacing, depth-aware bar color, segment heights, animation cadence) | AUTO-01 / AUTO-02 / AUTO-04 | Pixel-level visual checks aren't expressible as jest assertions | Open `/automazioni` on iPhone-style frame width (~375px); compare side-by-side with `automations.jsx`; confirm 38px input height, 9px radius, 0.5px border, ember accent on Salva button |
| Italian copy correctness | AUTO-01..08 | i18n correctness needs human read | Sweep all rendered strings: "Nuova automazione", "Modifica automazione", "Trigger / Condizioni / Azioni / Avanzate", "Per cambiare il trigger…", pluralized "1 condizione" vs "2 condizioni", etc. |
| Live API round-trip | AUTO-07 / AUTO-08 | Smoke uses real backend; manual confirms 422/409 toast paths | Manually trigger 422 (e.g. invalid cron), confirm `useToast.error` surfaces API message |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (test files above)
- [ ] No watch-mode flags (`--watch` forbidden in `<automated>` blocks)
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter once all rows in the verification map have green tests

**Approval:** pending
