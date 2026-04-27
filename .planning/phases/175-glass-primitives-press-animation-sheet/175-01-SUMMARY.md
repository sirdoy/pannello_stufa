---
phase: 175-glass-primitives-press-animation-sheet
plan: 01
subsystem: ui
tags: [ember-glass, pressable, primitive, ds-07, react, polymorphic-component, jest, forwardref, hooks]

requires:
  - phase: 174-ember-glass-tokens-foundations
    provides: "EmberGlass/ namespace + var(--accent) token consumed by [data-pressable-focusable]:focus-visible rule"
provides:
  - "<Pressable> polymorphic forwardRef component (default as='div') with inline scale(0.97)↔scale(1) press animation"
  - "usePressed() React hook returning { pressed, pointerHandlers } for inline opt-in"
  - ".press-anim CSS utility class declaring the DS-07 transition shape (single source of truth)"
  - "Reduced-motion override for .press-anim collapsing transition to 50ms linear"
  - "Global :focus-visible accent outline rule keyed on data-pressable-focusable + data-sheet-close attributes"
  - "Three grep targets satisfying SC-#1 shared-utility contract for Phases 177-181 (Pressable, usePressed, .press-anim)"
affects: [175-02-sheet-primitive, 175-03-design-system-v2-page, 177-dashboard-cards, 178-stove-climate-lights-sonos-plugs-sheets, 179-room-card, 180-automations-editor, 181-bottom-tab-bar]

tech-stack:
  added: []
  patterns:
    - "Polymorphic React component via `as` prop + forwardRef + final cast at export"
    - "JS pointer-state press primitive (NOT :active) per design bundle cards.jsx:11-14"
    - "Inline-style approach with single SOT constant + matching CSS class for grep parity"
    - "Data-attribute bridge for inline-style components needing :focus-visible behavior"

key-files:
  created:
    - "app/components/EmberGlass/Pressable.tsx"
    - "app/components/EmberGlass/__tests__/Pressable.test.tsx"
  modified:
    - "app/globals.css"

key-decisions:
  - "JS pointer-state press primitive instead of CSS :active — :active sticks on touch and does not release on pointerleave (per CONTEXT D-03)"
  - "useCallback for the four pointer handlers — explicit handler stability so React Compiler memoization downstream stays trivially correct (per RESEARCH lines 188-190)"
  - "Caller style is spread AFTER the press contract so consumers cannot override transform/transition (per UI-SPEC line 176-177)"
  - "data-pressable-focusable='true' attribute set on natively-focusable hosts (button/a/input/select/textarea) OR when consumer passes tabIndex>=0 — global CSS rule paints accent outline on :focus-visible (inline styles cannot express :focus-visible)"
  - "PRESS_TRANSITION constant string is value-only ('transform .22s cubic-bezier(.34,1.56,.64,1)') matching the .press-anim CSS rule's transition value char-for-char — the SC-#1 invariant Phases 177-181 will assert via the same regex"
  - "fireEvent.pointerDown/Up/Leave/Cancel used in tests instead of userEvent.pointer (per RESEARCH Pitfall 1 — userEvent.pointer is jsdom-flaky)"
  - "Reduced-motion handling lives in CSS (.press-anim @media override) not in JS — rejected useEffect-based prefers-reduced-motion detection per UI-SPEC line 517 (zero-cost render priority)"

patterns-established:
  - "Polymorphic forwardRef export cast: `export const X = ForwardedInner as unknown as <E extends ElementType = 'div'>(props: ...) => React.ReactElement;`"
  - "SOT-string-twinning between inline-style constant and global CSS rule (grep-asserted invariant)"
  - "Data-attribute bridge pattern (data-pressable-focusable, data-sheet-close) for inline-style components that need pseudo-class behavior"

requirements-completed: [DS-07]

duration: ~25min
completed: 2026-04-27
---

# Phase 175 Plan 01: Pressable Primitive Summary

**Polymorphic <Pressable> component + usePressed() hook + .press-anim CSS utility — the shared DS-07 press primitive (`scale(0.97)` / `cubic-bezier(.34,1.56,.64,1)` / 220ms) every NEW interactive glass surface in Phases 177-181 will compose against.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-27T12:50Z (worktree spawn)
- **Completed:** 2026-04-27T13:15:22Z
- **Tasks:** 3
- **Files modified:** 3 (1 modified, 2 created)
- **Tests:** 13 unit tests, all GREEN

## Accomplishments

- Shipped polymorphic `<Pressable>` component with `forwardRef` + `as` prop (default `'div'`); JS-driven pointer state replacing the unreliable `:active` pseudo-class.
- Shipped `usePressed()` hook for callers that already own a wrapper element (avoids extra DOM node).
- Appended `.press-anim` CSS utility, `[data-pressable-focusable|data-sheet-close]:focus-visible` rule, and `prefers-reduced-motion` override to `app/globals.css`.
- All three SC-#1 grep targets (`Pressable`, `usePressed`, `.press-anim`) are now in place for Phases 177-181 to assert against.
- Established the SOT-string-twinning pattern: the inline `PRESS_TRANSITION` constant value matches the `.press-anim` CSS rule's transition value character-for-character (regex `transform .22s cubic-bezier\(\.34,1\.56,\.64,1\)` — same in both files).

## Task Commits

Each task was committed atomically with `--no-verify` (parallel worktree mode):

1. **Task 1: Append .press-anim, focus-visible, reduced-motion to globals.css** — `4c5d1d62` (feat)
2. **Task 2: Add failing Pressable unit tests (Wave 0 RED)** — `fa535bdc` (test)
3. **Task 3: Implement Pressable + usePressed (RED → GREEN)** — `693f32af` (feat)

TDD gate sequence verified:
- RED: `fa535bdc` (test commit, all 13 specs failing — `Cannot find module '../Pressable'`)
- GREEN: `693f32af` (feat commit, all 13 specs passing)
- REFACTOR: not needed (initial implementation passed all assertions cleanly)

## Files Created/Modified

- **`app/components/EmberGlass/Pressable.tsx`** (138 LOC, created) — `'use client'` polymorphic primitive. Exports `Pressable` (default `as='div'`, forwardRef), `usePressed()` hook, types `PressableProps<E>` and `PointerHandlers`. JSDoc cites bundle source `cards.jsx:11-14` and the SC-#1 grep contract.
- **`app/components/EmberGlass/__tests__/Pressable.test.tsx`** (141 LOC, created) — 13 jest+RTL specs across 4 describe blocks: Rendering (3), Pointer events (5), data-pressable-focusable attribute (3), usePressed hook (2). Uses `fireEvent.pointerDown/Up/Leave/Cancel` (jsdom-reliable) and `renderHook + act` for the hook contract.
- **`app/globals.css`** (+25 LOC, modified) — Appended after the existing Phase 174 reduced-motion ambient guard. Adds `.press-anim`, the `[data-pressable-focusable|data-sheet-close]:focus-visible` rule, and the press-anim reduced-motion override (Sheet's 400ms transition is intentionally not collapsed in this phase).

## Decisions Made

All decisions followed the locked CONTEXT D-01..D-06 and UI-SPEC contracts. No new decisions required at execution time.

## Deviations from Plan

**None — plan executed exactly as written.**

Two minor implementation notes that align with the plan but deserve documentation:

1. **Polymorphic forwardRef cast.** Used the standard `as unknown as` cast at export (per RESEARCH line 185 + UI-SPEC line 565 noting the existing `BottomSheet.tsx:3 @ts-expect-error` precedent). No `@ts-expect-error` was needed because the double-cast satisfies TypeScript's strict checker without a directive — TypeScript accepts the conversion through `unknown`.
2. **File LOC budget.** Plan budgeted ~70 LOC for `Pressable.tsx`; actual is 138 LOC. The overage is entirely verbose JSDoc explaining the SC-#1 grep contract, the data-attribute bridge rationale, and the reduced-motion compromise (per UI-SPEC §Accessibility). Functional code (~55 LOC) is within budget. The artifact `min_lines: 50` constraint is satisfied; no `max_lines` constraint was set.

## Issues Encountered

**None.** All 13 tests passed on first GREEN run. No retries, no auto-fixes triggered.

## Threat Flags

None. Pressable introduces no new attack surface beyond what was already modeled in the plan's STRIDE register (`<threat_model>` T-175-01..03). The implementation honors the locked mitigation for T-175-02 (caller `style` spread AFTER press contract — caller cannot override `transform`/`transition`).

## Verification — SC-#1 Grep Contract

The three grep targets are in place. Future Phases 177-181 will assert these regexes against THEIR new files:

```bash
# Component grep (Phases 177-181 will run this against their new files)
grep -r "Pressable\|usePressed\|press-anim" app/components/<phase-folder>/

# String-identity invariant (must match in both files char-for-char)
grep -E "transform .22s cubic-bezier\(\.34,1\.56,\.64,1\)" \
     app/components/EmberGlass/Pressable.tsx app/globals.css

# data-attribute bridge
grep -F 'data-pressable-focusable' app/components/EmberGlass/Pressable.tsx
grep -F '[data-pressable-focusable="true"]:focus-visible' app/globals.css
```

All four greps return matches. The SC-#1 invariant for Phases 177-181 is now verifiable.

## User Setup Required

None. Pressable is a pure React primitive with no environment variables, no external services, no configuration steps. It is consumable immediately by Plan 175-02 (Sheet primitive's close-button focus ring) and Plan 175-03 (the design-system-v2 demo page).

## Next Phase Readiness

- **Plan 175-02 (Sheet primitive)** can now ship its `data-sheet-close="true"` close button and rely on the global `:focus-visible` rule already in place.
- **Plan 175-03 (design-system-v2 page)** can import `<Pressable>` and `usePressed()` from `app/components/EmberGlass/Pressable` (or, after 175-03 ships the barrel, from `@/app/components/EmberGlass`) for the Section 05 demo.
- **Phase 177-181** can compose against any of the three grep targets without further coordination — the SC-#1 contract is locked.

## Self-Check: PASSED

- [x] `app/components/EmberGlass/Pressable.tsx` exists (138 LOC).
- [x] `app/components/EmberGlass/__tests__/Pressable.test.tsx` exists (141 LOC).
- [x] `app/globals.css` contains `.press-anim` (verified by `grep -c "press-anim" app/globals.css` = 3).
- [x] `npm run test:components -- Pressable` passes — 13/13 GREEN.
- [x] All 3 task commits exist in git log: `4c5d1d62`, `fa535bdc`, `693f32af`.
- [x] No modifications to STATE.md or ROADMAP.md (parallel worktree mode honored).
- [x] No modifications to files outside scope_lock (Sheet.tsx, index.ts, design-system-v2 page, smoke specs all untouched).

---

*Phase: 175-glass-primitives-press-animation-sheet*
*Plan: 01-pressable-primitive*
*Completed: 2026-04-27*
