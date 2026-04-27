# Phase 175: Glass Primitives — Press Animation & Sheet - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 175-glass-primitives-press-animation-sheet
**Mode:** `--auto --chain` (recommended defaults selected without interactive Q&A)
**Areas discussed:** Namespace, Press API, Sheet API, Scroll lock, Sizing, Header & dismissal, Z-index, Verification

---

## Namespace & file layout

| Option | Description | Selected |
|--------|-------------|----------|
| `app/components/EmberGlass/{Pressable,Sheet}.tsx` | Continue Phase 174's namespace; legacy Sheet/BottomSheet untouched | ✓ |
| `app/components/glass/{Pressable,Sheet}.tsx` | Shorter dirname | |
| Refactor existing `app/components/ui/Sheet.tsx` in place | Replace Radix-CVA Sheet with bundle visuals | |
| Refactor existing `app/components/ui/BottomSheet.tsx` in place | Replace custom-portal BottomSheet with bundle visuals | |

**Selected:** Phase 174 UI-SPEC line 360 explicitly names this namespace and reserves it for "BottomSheet, CardPress, etc." Honoring that. Legacy files stay untouched to keep blast radius minimal — five existing consumers in scheduler/thermostat/debug.

**Rationale:** Phase 174 already established `EmberGlass/AmbientBg.tsx`. Continuing the namespace keeps v20.0 primitives in one folder. Legacy Sheet/BottomSheet have callers that aren't in scope for v20.0 redesign.

---

## Press primitive API

| Option | Description | Selected |
|--------|-------------|----------|
| `<Pressable>` component + `usePressed()` hook + `.press-anim` CSS class | Three grep targets, JS-driven pointer state matches bundle | ✓ |
| `<Pressable>` component only | Simpler API, one file | |
| `.press-anim` CSS class only with `:active` | No JS, but `:active` unreliable on touch (sticky on scroll) | |
| Hook only (`usePressed`) | Most flexible but no canonical wrapper for grep | |

**Selected:** Component + hook + class. JS pointer tracking matches bundle behavior. Hook escape hatch for surfaces with their own outer element. CSS class isolates the transition spec for reduced-motion overrides.

**Rationale:** SC-#1 mandates "verifiable via grep for the class/component" — three grep targets cover every consumption pattern. CSS-only `:active` was rejected because it sticks on touch devices when the user scrolls.

---

## Sheet primitive API

| Option | Description | Selected |
|--------|-------------|----------|
| Prop-driven `<Sheet open onClose title>{children}</Sheet>` over Radix Dialog | Matches bundle, terse for Phase 178's 5 sheets | ✓ |
| Compound `<Sheet><Sheet.Content><Sheet.Title>...` like existing legacy Sheet.tsx | More flexible but verbose | |
| Custom portal (no Radix), like legacy BottomSheet.tsx | Less dependency surface, but reimplements focus trap and ESC | |

**Selected:** Prop-driven facade backed by Radix Dialog. Bundle's API is `Sheet({open, onClose, title, children})` — matching it keeps Phase 178's StoveSheet/ClimateSheet/etc. small. Radix gives a11y for free.

**Rationale:** Five SHEET-XX sheets land in Phase 178; each has its own body. Prop-driven keeps the consumer side small. Radix Dialog covers focus trap + portal + ARIA roles without us re-rolling them.

---

## Scroll lock implementation

| Option | Description | Selected |
|--------|-------------|----------|
| Lift `BottomSheet.tsx`'s `position:fixed; top:-scrollY` recipe + `window.scrollTo(0, scrollY)` on close | Proven in production; explicitly restores scroll position | ✓ |
| Rely on Radix Dialog's built-in scroll lock (`pointer-events:none` blocker) | Doesn't restore scroll position; SC-#4 fails | |
| `document.body.style.overflow = 'hidden'` only | iOS bounce leaks through; doesn't preserve scroll | |

**Selected:** BottomSheet's recipe duplicated inline (not imported — legacy file stays a clean delete target).

**Rationale:** SC-#4 explicitly says "restored to the original scroll position on close." Radix's built-in scroll lock doesn't restore. The BottomSheet recipe is already in production at `app/components/ui/BottomSheet.tsx:50-67`.

---

## Sizing

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-height from content with `maxHeight: 85%` | Matches bundle exactly; Phase 178 sheets are content-driven | ✓ |
| Discrete `size: sm/md/lg` variants like legacy Sheet.tsx | More API surface; not used by bundle | |

**Selected:** Auto-height, max 85%. Bundle reference: `sheets.jsx:38`.

**Rationale:** Phase 178's five sheets all have different intrinsic heights (StoveSheet ≈ 4 rows, LightsSheet has a long list). Content-driven height with internal scroll keeps each sheet body terse.

---

## Header & dismissal

| Option | Description | Selected |
|--------|-------------|----------|
| Grabber + title + close button (always rendered when title) + Escape (Radix) + backdrop tap | Matches bundle and SC-#3 exactly | ✓ |
| Grabber-only header, no close button | Saves DOM but loses one of three documented dismissal vectors | |
| Add swipe-to-dismiss gesture | Out of bundle scope; not in SC | |

**Selected:** Three dismissal vectors. Backdrop tap implemented via our own `<div onClick={onClose}>` (Radix `onPointerDownOutside` is suppressed via `e.preventDefault()` to avoid double-firing).

**Rationale:** SC-#3 lists exactly three dismissal vectors. Bundle does not implement swipe; deferring it to a polish phase.

---

## Z-index convention

| Option | Description | Selected |
|--------|-------------|----------|
| Backdrop=200, Sheet=201 (bundle values) | Matches bundle; documents convention for Phase 181 nav bar | ✓ |
| Tailwind `z-50` like legacy Sheet.tsx | Conflicts with existing legacy layers | |
| `zIndex={8999}` like legacy BottomSheet.tsx | Way too high; would block dev tooling overlays | |

**Selected:** 200/201, hard-coded inline, with a documenting comment in `Sheet.tsx`.

**Rationale:** Phase 181's NAV-XX bottom tab bar must hide when a Sheet opens (Phase 178 SC-#3). 200/201 lets the nav live below this band.

---

## Verification surface

| Option | Description | Selected |
|--------|-------------|----------|
| Extend `/debug/design-system-v2` page (Phase 174) with Press + Sheet demo sections + Playwright specs (8 cases) + Jest unit tests | Hits all 5 success criteria including the 375px / 1024px smoke | ✓ |
| Manual smoke only (no automated specs) | Faster, but SC-#5 says "passes manual smoke" — automation is more robust regression net | |
| New sibling page `/debug/sheet-demo` | Fragments the design-system reference surface | |

**Selected:** Extend the v2 page; Playwright specs for press + sheet behavior including viewport size assertions; Jest unit tests for component contracts.

**Rationale:** Single canonical reference surface. Playwright covers the 375/1024 smoke deterministically. Jest covers React-level contracts (props, callbacks, scroll-lock body mutations).

---

## Claude's Discretion (deferred to planner)

- Internal organization of `Pressable.tsx` — separate `usePressed.ts` hook file vs co-located.
- Whether to ship a `<SheetRow>` / `<SheetBtn>` helper now (defer to Phase 178 when 5 sheets exist).
- Reduced-motion override (≤10 LOC bonus, not required by SC).
- Prop name `onClose` (bundle) vs `onOpenChange` (Radix). Recommend `onClose`.

## Deferred Ideas

- Swipe / drag-to-dismiss gesture.
- Migration of legacy `Sheet.tsx` and `BottomSheet.tsx` callers — v20.0 cleanup phase after 177-181.
- Reduced-motion overrides as a first-class contract.
- `<SheetRow>` / `<SheetBtn>` helpers.
- Imperative focus management for Sheet open (Phase 178 problem).
- Backdrop blur intensity tokens (none requested).
