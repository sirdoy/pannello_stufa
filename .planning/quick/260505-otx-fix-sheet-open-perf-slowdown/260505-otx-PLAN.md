---
phase: quick-260505-otx
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/EmberGlass/Sheet.tsx
  - app/globals.css
autonomous: true
requirements:
  - PERF-OTX-01  # Eliminate per-frame re-rasterization caused by animated backdrop-filter on Sheet open
  - PERF-OTX-02  # Pause AmbientBg blob keyframes while a sheet is open

must_haves:
  truths:
    - "Opening a Sheet no longer transitions backdrop-filter; blur snaps on instantly while background still cross-fades"
    - "Sheet container no longer applies backdrop-filter (uses opaque rgba background documented in @supports fallback)"
    - "When body[data-sheet-open=true] is set, .ember-ambient-blob keyframes are paused"
    - "Existing Sheet contracts still hold: ESC dismiss, backdrop click dismiss, close button dismiss, scroll-lock + restore, dialog role/aria-modal, no forceMount regression"
  artifacts:
    - path: "app/components/EmberGlass/Sheet.tsx"
      provides: "Updated backdrop transition (no backdrop-filter animation) + container without backdrop-filter"
      contains: "transition: 'background .3s'"
    - path: "app/globals.css"
      provides: "ambient pause rule under data-sheet-open"
      contains: "body[data-sheet-open=\"true\"] .ember-ambient-blob"
  key_links:
    - from: "app/components/EmberGlass/Sheet.tsx (backdrop div)"
      to: "browser compositor"
      via: "static backdrop-filter (no transition on filter property)"
      pattern: "transition: 'background \\.3s'"
    - from: "body[data-sheet-open=\"true\"]"
      to: ".ember-ambient-blob keyframes"
      via: "animation-play-state: paused"
      pattern: "animation-play-state:\\s*paused"
---

<objective>
Fix the "vertiginous" slowdown that hits every time an EmberGlass Sheet opens on the dashboard.

Per RESEARCH.md, the slowdown is the cumulative cost of:
  (A) two stacked, viewport-sized backdrop-filter layers transitioning blur on every open, and
  (C) three full-viewport blurred AmbientBg blobs running infinite keyframes that get re-rasterized through both Sheet filter layers on every animation frame.

This plan ships the two cheapest, lowest-risk fixes (Fix A and Fix C from RESEARCH §"Recommended fixes"). Fix B (de-duplicating device hooks across card+sheet pairs) is **explicitly deferred** — it reverses Phase 178 D-04 ("sheet bodies take no props") and needs an architecture discussion. Fix D (rAF body-style writes) is a marginal win and only worth picking up if profiling still shows residual jank after A+C.

Purpose: restore buttery slide-in animation on sheet open across all 10 dashboard cards (Stove, Climate, Lights, Sonos, Tuya, Network, Camera, Dirigera, Raspi, Weather, plus RoomSheet) without breaking the existing Sheet visual/interaction contract.

Output: surgical edits to `Sheet.tsx` (backdrop transition + container background) and one new CSS rule in `globals.css`. No new files. No package changes.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/260505-otx-fix-sheet-open-perf-slowdown/260505-otx-RESEARCH.md
@app/components/EmberGlass/Sheet.tsx
@app/components/EmberGlass/AmbientBg.tsx
@app/globals.css
@app/components/EmberGlass/__tests__/Sheet.test.tsx
@CLAUDE.md

<interfaces>
<!-- Lifted from the files this plan touches so the executor does not need to grep for them. -->

From app/components/EmberGlass/Sheet.tsx — current backdrop styles (lines 86-95):
```tsx
style={{
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  background: open ? 'rgba(0,0,0,0.5)' : 'transparent',
  backdropFilter: open ? 'blur(8px)' : 'none',          // KEEP shape, change value (8 → 4) optional, MAIN change is transition below
  WebkitBackdropFilter: open ? 'blur(8px)' : 'none',
  transition: 'background .3s, backdrop-filter .3s',    // ← REMOVE 'backdrop-filter .3s' from this list
  pointerEvents: open ? 'auto' : 'none',
}}
```

From app/components/EmberGlass/Sheet.tsx — current container styles (lines 113-131):
```tsx
style={{
  position: 'fixed',
  left: 8, right: 8, bottom: 8,
  zIndex: 201,
  borderRadius: 32,
  background: 'rgba(28, 25, 23, 0.85)',                 // ← BUMP to 0.92 to compensate for dropping backdrop-filter
  backdropFilter: 'blur(40px) saturate(200%)',          // ← REMOVE
  WebkitBackdropFilter: 'blur(40px) saturate(200%)',    // ← REMOVE
  border: '0.5px solid rgba(255,255,255,0.12)',
  boxShadow: '0 -20px 60px rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.08)',
  padding: '10px 20px 30px',
  maxHeight: '85%',
  overflowY: 'auto',
  transform: open ? 'translateY(0)' : 'translateY(110%)',
  transition: 'transform .4s cubic-bezier(.22,1,.36,1)',
}}
```

From app/globals.css — existing data-sheet-open cascade (lines 380-407) shows the pattern this plan extends:
```css
body[data-sheet-open="true"] [data-bottom-tab="true"] { transform: translateY(140%); opacity: 0; pointer-events: none; }
body[data-sheet-open="true"] [data-ws-chip="true"]    { transform: translateY(-140%); opacity: 0; pointer-events: none; }
@media (prefers-reduced-motion: reduce) { .ember-ambient-blob { animation: none !important; } }
```

The new rule belongs immediately after the WS-chip block (around line 403) and before the reduced-motion guard.

Existing AUDIT-EXCEPTION (DS-02) markers on Sheet.tsx lines 90, 91, 120, 121 reference design-bundle source. The container's blur is documented as bundle-verbatim; we're intentionally diverging — replace the AUDIT-EXCEPTION comment on line 120 with a perf-rationale comment that cites this quick task and notes the @supports fallback in globals.css:340-345 already mirrors the opaque path.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: De-fang Sheet backdrop-filter (Fix A)</name>
  <files>app/components/EmberGlass/Sheet.tsx</files>
  <behavior>
    Existing Sheet.test.tsx must continue to pass without modification (rendering open=false/open=true, ESC dismiss, backdrop click, close button, scroll-lock + restore, dialog role + aria-modal, NO forceMount regression).

    New behavior (no new test required, structural CSS change only — covered by visual smoke + existing contract tests):
    - Backdrop div's inline `transition` no longer mentions `backdrop-filter` — only `background .3s`.
    - Container div no longer sets `backdropFilter` or `WebkitBackdropFilter`.
    - Container `background` is bumped from `rgba(28, 25, 23, 0.85)` to `rgba(28, 25, 23, 0.92)` (matches the @supports fallback at globals.css:340-345 which is documented as the acceptable opaque path).
    - All other props/styles unchanged. forceMount still NOT used. ESC, click-outside, close button, scroll-lock all still wired.
  </behavior>
  <action>
    Edit `app/components/EmberGlass/Sheet.tsx`:

    1. **Backdrop div (around line 93)** — change:
       ```tsx
       transition: 'background .3s, backdrop-filter .3s',
       ```
       to:
       ```tsx
       transition: 'background .3s', // perf-fix (260505-otx): drop backdrop-filter from transition; blur snaps instantly to avoid per-frame re-raster of the layer beneath
       ```
       Leave the `backdropFilter`/`WebkitBackdropFilter` lines AS-IS at `blur(8px)`/`none` — they still toggle on `open`, just no longer animate. (RESEARCH §Fix-A confirms the per-frame cost is the *transition*, not the static filter; keeping the value preserves visual parity outside the 300ms window.)

    2. **Container div (around lines 120-122)** — make THREE coordinated edits:
       - Change `background: 'rgba(28, 25, 23, 0.85)',` → `background: 'rgba(28, 25, 23, 0.92)',` (mirrors `@supports not (backdrop-filter)` fallback in globals.css:340-345 which is the documented opaque path).
       - DELETE the `backdropFilter: 'blur(40px) saturate(200%)',` line entirely.
       - DELETE the `WebkitBackdropFilter: 'blur(40px) saturate(200%)',` line entirely.

    3. **Update the AUDIT-EXCEPTION comments** that previously cited bundle parity for the deleted lines: replace with a single perf-rationale comment immediately above the `background:` line citing this quick task ID:
       ```tsx
       // perf-fix (260505-otx): container drops backdrop-filter; opaque background mirrors
       // the @supports fallback (globals.css:340-345). Bundle parity intentionally diverges
       // — see .planning/quick/260505-otx-fix-sheet-open-perf-slowdown/260505-otx-RESEARCH.md §Fix-A.
       ```
       Remove the now-stale `// AUDIT-EXCEPTION (DS-02): bundle sheets.jsx:31` comment on the bumped `background` line and the two `// AUDIT-EXCEPTION (DS-02): bundle sheets.jsx:32` comments on the deleted backdrop-filter lines (they're gone with the lines).

    4. Do NOT touch: forceMount comments, the body-style scroll-lock useEffect, SheetCounter increment/decrement calls, `onPointerDownOutside` / `onCloseAutoFocus` handlers, Title row, grabber, close button, children rendering, or any other style. The change surface is exactly the two `style={{}}` blocks identified above.

    5. Per CLAUDE.md rule 4: do NOT run `npm install` or `npm run build`. Per rule 7: do NOT commit.
  </action>
  <verify>
    <automated>npm test -- app/components/EmberGlass/__tests__/Sheet.test.tsx app/components/EmberGlass/__tests__/SheetCounter.test.ts</automated>
  </verify>
  <done>
    - `transition` on the backdrop div equals `'background .3s'` (no `backdrop-filter` token in that string).
    - `grep -n "backdropFilter" app/components/EmberGlass/Sheet.tsx` returns ONLY the backdrop div's two lines (open ? 'blur(8px)' : 'none' and its WebKit twin) — exactly 2 hits, both on the backdrop.
    - `grep -n "blur(40px)" app/components/EmberGlass/Sheet.tsx` returns 0 hits.
    - `grep -n "saturate(200%)" app/components/EmberGlass/Sheet.tsx` returns 0 hits.
    - `grep -n "rgba(28, 25, 23, 0.92)" app/components/EmberGlass/Sheet.tsx` returns 1 hit (container background).
    - `grep -n "rgba(28, 25, 23, 0.85)" app/components/EmberGlass/Sheet.tsx` returns 0 hits.
    - Sheet.test.tsx passes (all rendering / dismissal / scroll-lock / a11y assertions green).
    - SheetCounter.test.ts passes (no behavioral change to counter, but co-runs because the increment/decrement calls are inside the touched file).
  </done>
</task>

<task type="auto">
  <name>Task 2: Pause AmbientBg keyframes while a sheet is open (Fix C)</name>
  <files>app/globals.css</files>
  <behavior>
    Adds one CSS rule: `body[data-sheet-open="true"] .ember-ambient-blob { animation-play-state: paused; }`. This piggy-backs on the existing `data-sheet-open` attribute toggled by `SheetCounter` (via `incrementSheetCount`/`decrementSheetCount` already wired in Sheet.tsx).

    No JS changes. No new test required (CSS-only addition; visual behavior is "blobs freeze when any sheet is open"). Existing AmbientBg.test.tsx must continue to pass unchanged (the rule lives in globals.css which Jest does not parse — JSDOM-rendered tests will not observe the change, which is fine).
  </behavior>
  <action>
    Edit `app/globals.css`. Locate the existing `data-sheet-open` cascade (lines ~380-403) and the reduced-motion guard at line 405-407:

    ```css
    /* Reduced-motion guard (UI-SPEC §"Reduced-motion contract") */
    @media (prefers-reduced-motion: reduce) {
      .ember-ambient-blob { animation: none !important; }
    }
    ```

    **Insert immediately BEFORE the reduced-motion guard** (so the new rule sits with its semantic siblings — the `data-sheet-open` cascade — and the reduced-motion guard remains the final ambient rule):

    ```css
    /* Perf-fix (260505-otx) — pause ambient blob keyframes while any Sheet is open.
       Piggy-backs on body[data-sheet-open="true"] which SheetCounter toggles via
       incrementSheetCount/decrementSheetCount. Removes per-frame triple-blur re-raster
       through the Sheet's backdrop layer. See
       .planning/quick/260505-otx-fix-sheet-open-perf-slowdown/260505-otx-RESEARCH.md §Fix-C. */
    body[data-sheet-open="true"] .ember-ambient-blob {
      animation-play-state: paused;
    }
    ```

    Do NOT modify the existing keyframes (`ambientA/B/C`), the reduced-motion guard, the bottom-tab cascade, or the WS-chip cascade. Single additive insertion only.

    Per CLAUDE.md rule 4: do NOT run `npm install` or `npm run build`. Per rule 7: do NOT commit.
  </action>
  <verify>
    <automated>grep -v '^\s*\*\|^\s*//' app/globals.css | grep -c 'animation-play-state:\s*paused'</automated>
  </verify>
  <done>
    - `grep -n "animation-play-state: paused" app/globals.css` returns exactly 1 hit.
    - That hit sits inside a `body[data-sheet-open="true"] .ember-ambient-blob { ... }` rule.
    - The reduced-motion `@media (prefers-reduced-motion: reduce)` block at the original line is still present, structurally unchanged, and appears AFTER the new rule.
    - The bottom-tab and WS-chip `data-sheet-open` rules are untouched (`grep -c 'data-sheet-open' app/globals.css` increases by exactly 1 vs pre-edit count).
    - `npm test -- app/components/EmberGlass/__tests__/AmbientBg.test.tsx` still passes (sanity).
  </done>
</task>

</tasks>

<verification>
Run scoped tests covering both edited surfaces (CLAUDE.md rule 8 — never `npm test` alone):

```bash
npm test -- app/components/EmberGlass/__tests__/Sheet.test.tsx \
            app/components/EmberGlass/__tests__/SheetCounter.test.ts \
            app/components/EmberGlass/__tests__/AmbientBg.test.tsx
```

All three suites must pass green. No new tests are required — the perf characteristics are not unit-testable; we rely on existing contract tests to prove no regression and on a manual visual smoke (below) to prove the perf win.

**Manual visual smoke (the actual perf signal — RESEARCH §"Suggested verification steps"):**

1. `npm run dev` → open `http://localhost:3000/`.
2. Enable ambient via `/debug/design-system-v2` accent picker (sets `<html data-ambient="on">`) so the worst-case stack is in play.
3. Open Chrome DevTools → Performance tab → record 4–5 seconds while opening and closing a Sheet (any card; Sonos is the heaviest).
4. **Before-fix expectation (for comparison from memory): long purple/green "Composite Layers" + "Paint" bars during the 300–400 ms slide.**
   **After-fix expectation: those bars collapse to <16 ms each; the slide-in is visibly smooth on throttled CPU 4×.**
5. While a sheet is open, confirm the three ambient blobs are visually stationary (no scale/translate motion). Close the sheet → blobs resume.
6. Confirm visual parity is acceptable: the sheet container still reads as a dark glass surface (background bumped to 0.92 alpha; this matches the documented `@supports not (backdrop-filter)` fallback path).
</verification>

<success_criteria>
- `transition: 'background .3s'` on the backdrop div (no `backdrop-filter` token).
- 0 occurrences of `blur(40px)` / `saturate(200%)` in `Sheet.tsx`.
- 1 new CSS rule pausing `.ember-ambient-blob` animation under `body[data-sheet-open="true"]`.
- Sheet.test.tsx + SheetCounter.test.ts + AmbientBg.test.tsx all green via scoped invocation.
- Visual smoke (manual, documented in SUMMARY): no regression to dismissal vectors, no regression to scroll-lock, no regression to ambient when sheet is closed.

**Out of scope (deferred — do NOT pick up in this plan):**
- Fix B (lift device hooks out of sheet bodies) — reverses Phase 178 D-04 contract; raise as a follow-up if the perf win from A+C is insufficient. The author note in `StoveSheet.tsx` ("self-fetches via `useStoveData` + `useStoveCommands` (D-04 — sheet bodies take no props)") makes this a deliberate architectural decision worth a discuss-phase before reversing.
- Fix D (rAF body-style writes) — marginal; only revisit if profiling shows residual reflow jank after A+C ship.
- Migrating legacy `app/components/ui/Sheet.tsx` and `app/components/ui/BottomSheet.tsx` (they use `backdrop-blur-3xl` Tailwind utilities and would degrade similarly, but they're only used in debug page + scheduler interval picker + manual override, not on the dashboard hot path).
</success_criteria>

<output>
After completion, create `.planning/quick/260505-otx-fix-sheet-open-perf-slowdown/260505-otx-SUMMARY.md` documenting:
  - The two surgical edits made (Sheet.tsx + globals.css).
  - The scoped test command run and its result.
  - The manual visual smoke result (with a one-line subjective assessment: "slide-in feels smooth at CPU 4× throttle" or equivalent).
  - The two deferrals (Fix B and Fix D) with one-line rationale each, so a future reader knows where the remaining perf budget lives.

Per CLAUDE.md rule 7, do NOT commit. The orchestrator handles commits for `.planning/` documents.
</output>
