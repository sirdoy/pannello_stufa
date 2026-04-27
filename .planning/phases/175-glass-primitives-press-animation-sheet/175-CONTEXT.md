# Phase 175: Glass Primitives — Press Animation & Sheet - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning
**Mode:** `--auto --chain` — gray areas auto-resolved with recommended defaults grounded in ROADMAP.md success criteria, REQUIREMENTS.md, the inbox design bundle, and Phase 174's locked CONTEXT/UI-SPEC.

<domain>
## Phase Boundary

Ship the **two reusable Ember Glass interaction primitives** that every later v20.0 phase composes against:

In scope:
- A shared **press animation primitive** (DS-07) — `scale(0.97)` cubic-bezier `.34,1.56,.64,1` over 220ms — applied to every NEW interactive glass surface introduced in Phases 177-181.
- A shared **bottom Sheet primitive** (SHEET-01) — translucent + backdrop-blur surface, slide-in from off-screen via cubic-bezier `.22,1,.36,1` over 400ms, dismissable via Escape / backdrop tap / close button, with grabber + title bar in the header and full body scroll-lock that restores prior scroll position on close.
- A **Sheet preview demo + accent picker integration** in `/debug/design-system-v2` (extends the page shipped in Phase 174) so the primitives are smoke-testable at 375px and 1024px.
- Playwright smoke specs for press primitive existence (grep + DOM scale on press) and Sheet open/close/dismiss/scroll-lock behavior.

Out of scope (future phases):
- StoveSheet / ClimateSheet / LightsSheet / SonosSheet / PlugsSheet bodies (SHEET-02..06 → Phase 178).
- Migrating legacy `<Sheet>` (Radix-based, `app/components/ui/Sheet.tsx`) and `<BottomSheet>` (`app/components/ui/BottomSheet.tsx`) consumers to the new primitive — both stay untouched in this phase. Migrating or deleting them is a later v20.0 cleanup phase.
- Migrating existing `Button.tsx` `active:scale-[0.97]` or any non-glass surface to the new press primitive. Press primitive only replaces press behavior on NEW glass surfaces in Phases 177-181.
- Drag/swipe-to-dismiss gesture on the Sheet — bundle has a visual grabber only; the success criteria do not require gesture dismissal.
- `prefers-reduced-motion` handling for Sheet/press — splash phase 176 covers reduced-motion explicitly, this phase ships a sensible default but does not gate on it.
- Dashboard cards / room cards / automations editor / nav bar that consume these primitives — separate phases (177-181).

</domain>

<decisions>
## Implementation Decisions

### Namespace & file layout
- **D-01:** Both primitives live under `app/components/EmberGlass/` — the namespace established by Phase 174 (`AmbientBg.tsx`) and locked in `174-UI-SPEC.md` line 360 ("creates the `EmberGlass/` namespace folder that Phases 175+ will populate"). Concrete files:
  - `app/components/EmberGlass/Pressable.tsx` — press primitive (component + hook).
  - `app/components/EmberGlass/Sheet.tsx` — Sheet primitive.
  - `app/components/EmberGlass/index.ts` — barrel export so Phases 177-181 import via `@/app/components/EmberGlass`.
- **D-02:** Existing `app/components/ui/Sheet.tsx` (Radix-based, 334 LOC) and `app/components/ui/BottomSheet.tsx` (custom portal, 153 LOC) are **NOT touched, NOT renamed, NOT removed** in this phase. They remain in service for legacy consumers (`scheduler/IntervalBottomSheet.tsx`, `scheduler/DayEditPanel.tsx`, `thermostat/schedule/components/ManualOverrideSheet.tsx`, `app/debug/design-system/page.tsx`). The new `EmberGlass/Sheet` is a sibling primitive, not a replacement.

### Press animation API (DS-07)
- **D-03:** Ship the press primitive as a thin **React component `<Pressable>`** that:
  - Tracks `pressed` boolean via `onPointerDown` / `onPointerUp` / `onPointerLeave` / `onPointerCancel` (matches design bundle `cards.jsx:11-14`).
  - Applies `style={{ transform: pressed ? 'scale(0.97)' : 'scale(1)', transition: 'transform .22s cubic-bezier(.34,1.56,.64,1)' }}` inline — same shape as the bundle.
  - Accepts a polymorphic `as` prop (default `'div'`) so it can wrap any element type.
  - Forwards `onClick`, `className`, `style`, `aria-*` and other standard props.
  - Renders `children` and forwards `ref`.
  - **Rationale (vs CSS-only `:active`):** `:active` on touch devices is unreliable (sticks across scroll, doesn't release on pointerleave). The bundle explicitly tracks pointer state in JS. Component form makes success-criterion #1 trivially grep-verifiable: every Phase 177-181 glass surface that wraps in `<Pressable>` shows up in `grep -r 'Pressable' app/components/`.
- **D-04:** Also export a small **`usePressed()` hook** that returns `{ pressed, pointerHandlers }` so callers that already have a wrapper element (e.g., a card with its own div) can opt into the press behavior without adding an extra DOM node:
  ```ts
  const { pressed, pointerHandlers } = usePressed();
  return <div {...pointerHandlers} style={{ transform: pressed ? 'scale(0.97)' : 'scale(1)', transition: '...'}} />;
  ```
  `<Pressable>` itself is implemented on top of `usePressed()`. Both `Pressable` and `usePressed` are equally grep-able for the SC-#1 verification.
- **D-05:** Add a CSS utility `.press-anim` to `app/globals.css` that ONLY declares the transition shape (`transition: transform .22s cubic-bezier(.34,1.56,.64,1)`). The transform itself stays inline (driven by the JS `pressed` state). The class exists so reduced-motion overrides and any future static `:active` consumers have one canonical token.
- **D-06:** SC-#1 enforcement strategy — Phase 175 ships a Playwright smoke spec that asserts `<Pressable>` is exported from `app/components/EmberGlass/index.ts` and that the `.press-anim` class exists in `globals.css`. The "every surface in Phases 177-181 reuses it" verification is enforced **per-phase** in 177-181 (each will grep its own NEW glass surfaces for `Pressable`/`usePressed`/`.press-anim`); not enforceable in this phase since those surfaces don't yet exist.

### Sheet primitive API (SHEET-01)
- **D-07:** Sheet is built on `@radix-ui/react-dialog` (already a dependency) for **a11y, focus trap, ESC key, and portal** mechanics — but presented through a **prop-driven facade** that matches the design bundle's API (`sheets.jsx:5`):
  ```tsx
  <Sheet open={open} onClose={() => setOpen(false)} title="Stufa">
    {/* body */}
  </Sheet>
  ```
  No compound `<Sheet.Content><Sheet.Title>...` API. Phase 178 builds five sheets and the prop-driven shape keeps each sheet body terse.
  - Internally: `<DialogPrimitive.Root open onOpenChange>` → `<DialogPrimitive.Portal>` → custom `<Backdrop>` + `<DialogPrimitive.Content>` with our own header (grabber + title + close button).
  - Radix handles ESC and focus trap automatically. We do not re-implement them.
- **D-08:** Sheet visual spec lifted verbatim from bundle `sheets.jsx:13-65`:
  - Backdrop: fixed inset-0, `background: rgba(0,0,0,0.5)`, `backdrop-filter: blur(8px) saturate(180%)` (with `-webkit-` prefix), 300ms fade for `background` + `backdrop-filter`. `pointerEvents: 'none'` when closed.
  - Sheet container: positioned `left: 8px`, `right: 8px`, `bottom: 8px`, `borderRadius: 32px`, `background: rgba(28, 25, 23, 0.85)`, `backdrop-filter: blur(40px) saturate(200%)`, `border: 0.5px solid rgba(255,255,255,0.12)`, `boxShadow: '0 -20px 60px rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.08)'`, `padding: 10px 20px 30px`, `maxHeight: 85%`, `overflow-y: auto`.
  - Open transform: `translateY(0)` on open, `translateY(110%)` on close.
  - Transition: `transform .4s cubic-bezier(.22,1,.36,1)` (matches SC-#2 exactly: 400ms / `.22,1,.36,1`).
- **D-09:** Header structure (always rendered when `title` is provided, always renders the grabber):
  - Row 1: centered grabber pill (40×5px, `borderRadius: 999`, `background: rgba(255,255,255,0.2)`).
  - Row 2 (when `title`): flex row with title (font-display 22px 600) on the left and a 32×32 circular close button (`<X>` icon, `rgba(255,255,255,0.1)` bg) on the right.
  - The close button calls `onClose` and is keyboard-focusable. It is the **third dismissal vector** alongside Escape (Radix) and backdrop tap (D-10).
- **D-10:** Backdrop tap dismissal — backdrop element has `onClick={onClose}`. Radix `onPointerDownOutside` is **not** used as the dismissal trigger (we want explicit click handling on our own backdrop element so the bundle visuals are preserved). To prevent Radix from also firing dismissal logic, set `onPointerDownOutside={(e) => e.preventDefault()}` on `<DialogPrimitive.Content>` and rely on our backdrop click instead.
- **D-11:** Body scroll lock (SC-#4) — implement using the **existing `BottomSheet` pattern** (`app/components/ui/BottomSheet.tsx:50-67`):
  ```ts
  const scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
  // on close:
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.overflow = '';
  window.scrollTo(0, scrollY);
  ```
  This pattern is proven in production (used in scheduler + thermostat sheets) and explicitly **restores scroll position** on close, satisfying SC-#4. Do NOT rely on Radix's built-in scroll-lock (it does not restore scroll position).
- **D-12:** Sizing — **no discrete size variants**. Sheet sizes itself to its content with `maxHeight: 85%` cap, matching bundle. SHEET-02..06 in Phase 178 each have different intrinsic heights (StoveSheet has 4-5 rows, ClimateSheet has a radial dial, LightsSheet has a long scroll list) — content-driven height keeps each terse.
- **D-13:** Z-index — `z-index: 200` for backdrop and `z-index: 201` for sheet container, hard-coded inline (matches bundle `sheets.jsx:19, 29`). The legacy `BottomSheet.tsx` uses `zIndex={8999}` and the legacy `Sheet.tsx` uses Tailwind `z-50`; both stay untouched. The new bottom tab bar (Phase 181) will live above z-index of normal content but below `200`, so the Sheet hides it cleanly per the Phase 178 SC-#3 stacking note. **Document this z-index convention in a comment at the top of `EmberGlass/Sheet.tsx`** so Phases 178-181 know to stay below 200.
- **D-14:** No swipe-to-dismiss gesture. Visual grabber only. Bundle does not implement swipe; success criteria do not require it. Defer to a polish phase.
- **D-15:** No `prefers-reduced-motion` reduction in Phase 175. The CSS keyframes use the documented motion curves verbatim. Phase 176 explicitly ships reduced-motion handling for the splash; later polish can backport reduce-motion to Sheet/press if needed. **Claude's discretion:** planner MAY add a `@media (prefers-reduced-motion: reduce)` override that collapses transitions to ~50ms if it adds <10 LOC; not a requirement.

### Smoke / verification surface
- **D-16:** Extend `/debug/design-system-v2/page.tsx` (the page shipped in Phase 174) with two new sections:
  - "Press primitive" — a small grid of 3-4 sample `<Pressable>` glass surfaces (a card-shaped one, a button-shaped one, a circular one) so visual press behavior can be eyeballed.
  - "Sheet primitive" — a labeled "Open Sheet" button that opens a sample Sheet with a placeholder title ("Demo sheet"), a grabber, a close button, and ~3 sample rows of dummy content (long enough to need scroll, so SC-#5 mobile/desktop smoke is meaningful).
  - These additions ride on top of the existing Phase 174 page; they do NOT create a sibling page.
- **D-17:** Playwright smoke specs added under `tests/playwright/design-system-v2.spec.ts` (extending the existing v2 spec from Phase 174 if present, else a new file in the same directory):
  - "DS-07 press primitive present" — `Pressable` exported from EmberGlass index, `.press-anim` class present in computed CSS, sample card on `/debug/design-system-v2` has `transform: matrix(0.97, ...)` after `mouse.down()`.
  - "SHEET-01 open via button click" — click "Open Sheet" → backdrop visible → sheet container has `translateY(0)`.
  - "SHEET-01 dismiss via Escape" — open sheet → press `Escape` → sheet has `translateY(110%)` and backdrop hidden.
  - "SHEET-01 dismiss via backdrop tap" — open sheet → click backdrop coordinates → sheet closes.
  - "SHEET-01 dismiss via close button" — open sheet → click close button → sheet closes.
  - "SHEET-01 scroll lock + restore" — scroll to y=300 → open sheet → assert `body.style.position === 'fixed'` → close → assert `window.scrollY === 300`.
  - "SHEET-01 mobile smoke (375px)" — set viewport 375×812 → open sheet → screenshot or DOM assertion that sheet `right - left` matches viewport minus 16px (8px each side).
  - "SHEET-01 desktop smoke (1024px)" — set viewport 1024×768 → same shape assertion.
- **D-18:** Unit tests under `app/components/EmberGlass/__tests__/`:
  - `Pressable.test.tsx` — pointer events toggle scale; `usePressed` hook; `as` prop polymorphism.
  - `Sheet.test.tsx` — open/close prop drives render; Escape calls `onClose`; backdrop click calls `onClose`; close button calls `onClose`; scroll-lock applied on open and restored on close (jsdom can verify the body style mutations and `window.scrollTo` call).

### Folded Todos
None — `gsd-sdk query todo.match-phase 175` returned 0 matches.

### Claude's Discretion
- Internal organization of `Pressable.tsx` (separate `usePressed.ts` hook file vs co-located in `Pressable.tsx`).
- Whether the `<Sheet>` body wrapper renders an internal `Sheet.Row` helper or leaves layout entirely to the caller (Phase 178 sheets all use stacked rows; a tiny `SheetRow` helper might pay off — planner decides).
- Exact prop name for the dismissal callback (`onClose` per bundle vs `onOpenChange(false)` per Radix). **Recommend `onClose`** to match the bundle and keep SHEET-02..06 terse, but planner may swap to `onOpenChange` if there's a reason.
- Whether to pre-emptively add a `@media (prefers-reduced-motion: reduce)` block (≤10 LOC opt-in per D-15).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §DS-07 (line 28) — "Card press animation (`scale(0.97)` with cubic-bezier `.34,1.56,.64,1`, 220ms) is a shared utility used by all interactive glass surfaces".
- `.planning/REQUIREMENTS.md` §SHEET-01 (line 55) — Bottom sheet primitive contract.
- `.planning/ROADMAP.md` §"Phase 175" (lines 68-79) — Goal + 5 success criteria. **SC-#1 mandates a single shared utility verifiable by grep**; **SC-#2 locks transition spec**; **SC-#3 lists three dismissal vectors**; **SC-#4 mandates scroll-lock + restore**; **SC-#5 mandates 375px + 1024px smoke**.

### Source Design Bundle (PRIMARY visual + behavior source)
- `.planning/inbox/ember-glass-design/project/components/cards.jsx` lines 1-50 (`GlassCard` press animation reference) — exact press behavior to reproduce.
- `.planning/inbox/ember-glass-design/project/components/sheets.jsx` lines 1-65 (`Sheet` primitive) — authoritative Sheet visuals, transitions, header structure (grabber + title + close).
- `.planning/inbox/ember-glass-design/project/Design System.html` — design-system reference HTML; Sheet preview should match.

### Prior Phase Decisions
- `.planning/phases/174-ember-glass-tokens-foundations/174-CONTEXT.md` — D-01..D-19; defines tokens (`--glass-bg`, `--glass-blur`, `--accent`, etc.) that the Sheet primitive consumes; mandates `EmberGlass/` namespace.
- `.planning/phases/174-ember-glass-tokens-foundations/174-UI-SPEC.md` lines 254-360 — **explicitly names `BottomSheet` and `CardPress` as Phase 175's two new files in the `EmberGlass/` namespace** (line 360). Honors that naming convention by using `Sheet.tsx` and `Pressable.tsx` (renamed for clarity vs the legacy `BottomSheet.tsx`).
- `.planning/phases/174-ember-glass-tokens-foundations/174-VERIFICATION.md` — confirms Phase 174 ships `app/globals.css` with all glass tokens already in place; Phase 175 only **consumes** them.

### Existing Codebase Touchpoints
- `app/components/ui/Sheet.tsx` (334 LOC, Radix-based) — **legacy, do NOT modify**. Reference only.
- `app/components/ui/BottomSheet.tsx` (153 LOC, custom portal) — **legacy, do NOT modify**. Scroll-lock pattern (lines 50-67) is the canonical reference for D-11.
- `app/components/ui/Button.tsx` line 32 (`active:scale-[0.97]`) — legacy press style; NOT migrated by this phase.
- `app/globals.css` lines 305-346 — Phase 174's locked Ember Glass token block; new Sheet/Pressable consume `--glass-bg`, `--glass-blur`, `--glass-border`, `--glass-shadow`, `--accent`, `--text-1`, `--text-2`, `--r-card`, `--font-display`. Phase 175 adds ONE new utility class `.press-anim` to this file.
- `app/debug/design-system-v2/page.tsx` — extend with press + sheet demo sections (D-16). Created in Phase 174.
- `app/components/EmberGlass/AmbientBg.tsx` — sibling Phase 174 primitive; same namespace.
- `package.json` line 34 — `@radix-ui/react-dialog ^1.1.14` already a dependency; no install needed.

### Patterns
- `app/components/ui/BottomSheet.tsx` — body scroll-lock pattern (D-11).
- Phase 174 inline pre-paint script pattern (`app/layout.tsx`) — NOT relevant for this phase (Sheet is interactive, not pre-paint).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`@radix-ui/react-dialog`** — already installed (`package.json:34`). Provides Portal, focus trap, ESC handling, ARIA roles. New `Sheet.tsx` wraps `DialogPrimitive.Root + Portal + Content`, exposes a simpler prop-driven facade.
- **`BottomSheet.tsx` scroll-lock recipe** — the `position:fixed; top:-scrollY; width:100%; overflow:hidden` pattern with `window.scrollTo(0, scrollY)` on close is the proven recipe for D-11. Lift it as-is into the new Sheet (do NOT import from the legacy file — duplicate the ~10 lines so the legacy file stays a clean delete target later).
- **`lucide-react` `<X>` icon** — already used by both legacy Sheet/BottomSheet for close button. Reuse here.
- **Phase 174 CSS tokens** — `var(--glass-bg)`, `var(--glass-blur)`, `var(--glass-shadow)`, `var(--accent)`, `var(--text-1)`, `var(--font-display)` all in `app/globals.css:305-346`. Sheet body and Pressable styles consume these directly via inline `style` (matches bundle's inline-style approach for the v2 layer).

### Established Patterns
- **`'use client'` at top of interactive components** — both new files start with `'use client'` (they manage state, use Portal, use pointer/keyboard events).
- **CVA + Tailwind** — used by legacy `Sheet.tsx`. **NOT used here.** New `EmberGlass/Sheet.tsx` matches the design bundle's inline-`style` approach for fidelity to bundle visuals (token values arrive via `var(--token)`, not Tailwind classes). This is intentional and aligns with how Phase 174's `AmbientBg.tsx` was written.
- **Test files colocated under `__tests__/`** — Jest unit tests live next to source (`app/components/EmberGlass/__tests__/`), Playwright specs live under `tests/playwright/`.
- **`forwardRef` for ref-bearing primitives** — both `<Pressable>` and `<Sheet>` should `forwardRef` so consumers can attach refs (Phase 178 sheets may want imperative focus management on open).

### Integration Points
- `app/components/EmberGlass/index.ts` — barrel export for the namespace; Phases 177-181 import via `@/app/components/EmberGlass`.
- `app/debug/design-system-v2/page.tsx` — adds Press + Sheet demo sections; existing Phase 174 sections (token grid, accent picker, ambient toggle, glass demo) stay untouched and surround the new sections.
- `app/globals.css` — append a single `.press-anim` utility class after the Ember Glass token block.
- `tests/playwright/design-system-v2.spec.ts` — extend or sibling-create with the 8 specs in D-17.

</code_context>

<specifics>
## Specific Ideas

- **Press primitive name:** `<Pressable>` (component) + `usePressed()` (hook) + `.press-anim` (CSS class). Three names, one behavior — picks up grep across all three styles. Phase 174 UI-SPEC line 360 uses the placeholder name "CardPress"; **rename to `Pressable`** for clarity (it's not card-only — it wraps any glass surface including buttons in Phases 177-181).
- **Sheet primitive name:** `<Sheet>` in `app/components/EmberGlass/Sheet.tsx`. Phase 174 UI-SPEC says "BottomSheet" but the bundle file is `sheets.jsx` and the component is named `Sheet`. **Use `Sheet`** to match the bundle and avoid collision with `app/components/ui/BottomSheet.tsx`. The fully-qualified import path `@/app/components/EmberGlass/Sheet` makes the namespace unambiguous.
- **Sheet API matches bundle exactly** — `<Sheet open onClose title>{children}</Sheet>`. Phase 178's StoveSheet/ClimateSheet/etc. each render in <50 LOC inside a `<Sheet>`.
- **Z-index 200/201 convention** — backdrop=200, sheet=201. Document this at the top of `EmberGlass/Sheet.tsx` so Phases 178-181 know to keep the new bottom tab bar (NAV-01..04) below 200.
- **`maxHeight: 85%` not `85vh`** — bundle uses `85%` of the parent container (the iPhone frame on mobile, the app shell on desktop). Use `85%` to match. Phase 178 sheets are content-driven; if any sheet body exceeds 85% it scrolls internally (overflow-y: auto already declared).
- **Smoke at 375px and 1024px** (SC-#5) — Playwright handles both, no manual smoke required for the GSD verifier; the spec script is the proof.

</specifics>

<deferred>
## Deferred Ideas

- **Swipe / drag-to-dismiss gesture on the Sheet** — visual grabber is shipped, but no gesture handler. Future polish phase if mobile UX research demands it.
- **Migration of legacy `app/components/ui/Sheet.tsx` and `BottomSheet.tsx` callers** to the new `EmberGlass/Sheet`. Belongs in a v20.0 cleanup phase after Phases 177-181 land.
- **Reduced-motion overrides** for Sheet open/close and `<Pressable>` press transitions (`@media (prefers-reduced-motion: reduce)`). Sensible default; if planner ships it as a 5-10 LOC bonus that's fine, but not required by SC.
- **`<SheetRow>` / `<SheetBtn>` layout helpers** seen in the bundle — defer to Phase 178 when the actual sheets are built; planner may inline them then.
- **Imperative focus management** (e.g., autofocus a specific input on Sheet open). Radix's default focus-trap-on-first-focusable is sufficient for SHEET-01. Per-sheet customization belongs in Phase 178.
- **Backdrop blur intensity prop** — bundle hard-codes `blur(8px)` for backdrop and `blur(40px)` for sheet body. No need for variants. If a future phase needs to tune them, lift to tokens then.
- **Animation hooks for nested content** (e.g., scenes button stagger inside LightsSheet). Phase 178 problem.

</deferred>

---

*Phase: 175-glass-primitives-press-animation-sheet*
*Context gathered: 2026-04-27*
