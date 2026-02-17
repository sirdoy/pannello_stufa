# Domain Pitfalls: Masonry Dashboard Layout

**Domain:** Adding masonry layout to existing React/Next.js dashboard with SSR, user-configurable card order, and spring animations
**Researched:** 2026-02-17
**Confidence:** HIGH (MUI issue tracker, MDN official docs, multiple production post-mortems)

---

## Critical Pitfalls

Mistakes that cause rewrites, hydration errors, or broken user order preferences.

---

### Pitfall 1: SSR Hydration Mismatch from Client-Only Column Calculation

**What goes wrong:** Masonry libraries that calculate column count using `window.innerWidth` produce different output on server (no `window`) vs. client. React throws hydration error. Next.js App Router escalates this to a page crash.

**Why it happens:** The server cannot determine viewport width. Most JS-driven masonry libraries default to 1 column on server, then reflow to 2+ columns after hydration. The server HTML and client HTML do not match.

**Consequences:**
- React hydration error: "Hydration failed because the initial UI does not match what was rendered on the server"
- Next.js App Router shows 500 or blank page
- With strict TypeScript: runtime crash before any card renders
- Libraries with window checks crash `app/page.tsx` server component import chain

**Prevention:**
1. **Never use JS-driven masonry in a server component.** The page.tsx is `async` and server-rendered — any import that touches `window` at module scope will crash.
2. **Use CSS-only masonry approaches** for the 2-column desktop layout: CSS `column-count` with `column-gap`, or CSS Grid with `grid-template-rows: masonry` (experimental, not production-ready — see Pitfall 2).
3. **If using a JS library** (e.g., `react-masonry-css`), wrap it in a client component with `dynamic(() => import('./MasonryGrid'), { ssr: false })`. Accept the hydration flash as a tradeoff.
4. **Provide explicit `defaultColumns`** if using MUI Masonry or similar — setting `defaultColumns={2}` ensures server renders 2 columns, not 1, avoiding the mismatch.
5. **The safest approach for this project:** CSS `columns` property (pure CSS, no JS, no hydration issue, SSR-safe).

**Detection:**
- Browser console: "Hydration failed because the initial UI does not match"
- Server logs: TypeError accessing `window` or `document` during render
- Page loads blank, React error overlay appears in dev mode
- `npm run build` fails with module-level `window` access

**Project-specific:**
- `app/page.tsx` is `export default async function Home()` — a server component. Any masonry library imported here that accesses window will crash at import time.
- The existing `Grid` component (`app/components/ui/Grid.tsx`) is pure CSS + Tailwind — this pattern must be preserved.
- Safe approach: Add a `MasonryGrid` client component that uses CSS columns, imported into the existing server page without `ssr: false` dance.

---

### Pitfall 2: Native CSS Masonry (`grid-template-rows: masonry`) is Not Production-Ready

**What goes wrong:** Using `grid-template-rows: masonry` or `display: grid-lanes` (the 2025 spec rename) fails silently in Chrome and Firefox, falling back to standard grid. Safari Technology Preview supports it. Production users on Chrome/Firefox see a regular aligned grid, not masonry.

**Why it happens:** CSS Grid Level 3 masonry is experimental as of 2026. Chrome 140 added experimental support behind a flag. The CSS WG voted January 2025 to rename the syntax to `display: grid-lanes`, which means any existing masonry CSS implementations are already on a deprecated path.

**Consequences:**
- Layout looks like a standard grid on all major production browsers
- Developer tests on Safari TP or with browser flags enabled, ships "working" masonry that no user actually sees
- Silent degradation — no error, just wrong layout

**Prevention:**
1. **Do not use `grid-template-rows: masonry` in production code.** Use CSS `column-count` + `break-inside: avoid` as the current standard approach.
2. **Track Can I Use** for `grid-lanes` before adopting — current support: experimental only.
3. **If targeting future browsers:** Add the CSS masonry as progressive enhancement only, with a tested fallback.

**Detection:**
- Layout appears as a standard aligned grid despite masonry CSS
- Chrome DevTools styles panel shows `grid-template-rows: masonry` crossed out (unrecognized)
- No console error — silent failure

---

### Pitfall 3: Card Visual Order vs. Firebase Order Index Mismatch

**What goes wrong:** User sets card order in Firebase as `[stove:0, thermostat:1, lights:2, network:3]`. In a 2-column masonry layout with CSS columns, cards render left-to-right reading across columns, but CSS columns places them top-to-bottom within each column. The first card appears top-left (expected), but the second card appears below the first in column 1, not top-right in column 2. User-perceived "order" breaks.

**Why it happens:** CSS `column-count` distributes items vertically — column 1 fills first, then column 2. So cards 0,1,2,3 with equal heights render: column1=[0,1], column2=[2,3]. But with unequal heights (the point of masonry), the split is determined by height, not item count. The Firebase `order` field maps to a flat array index — that flat index does not correspond to visual position.

**Consequences:**
- User sets "Stove first, Thermostat second" but sees Stove top-left, Thermostat below Stove in column 1 (not top-right)
- Cards reorder visually on every load as card heights change (data loads, banners appear)
- Drag-to-reorder saves a flat order that doesn't match what user drags

**Prevention:**
1. **Design user expectations first.** For a 2-column layout: explicitly tell users order is "top of column 1, top of column 2, second in column 1..." or switch to a row-first visual assignment.
2. **Use column-assignment approach**: Explicitly assign each card to column 1 or column 2 in Firebase, not a flat order index. Store `{ cardId: 'stove', column: 0, row: 0 }` not `{ cardId: 'stove', order: 0 }`.
3. **If using flat order**: Manually split cards into two arrays for two columns. Odd-indexed → column 1, even-indexed → column 2 (or use fill-shortest-column algorithm client-side). Render each column as a `flex-col` div.
4. **Do NOT let CSS columns auto-place** if user order must be preserved exactly. CSS columns ordering is layout-engine-determined, not DOM-order-determined when cards have variable height.

**Detection:**
- Automated test: Set order [A, B, C, D], check visual positions match user expectation
- User feedback: "I moved the stove card to the top but it's not first"
- After data loads (changing card heights), card order visually shifts

**Project-specific:**
- `visibleCards` is sorted by `order` field from `getVisibleDashboardCards(deviceConfig)`
- Current grid uses Tailwind `grid-cols-2` which is row-first (correct for flat order)
- Switching to CSS `columns` breaks row-first ordering — must use explicit column arrays instead
- Firebase schema will need column assignment if supporting true 2-column masonry with preserved user order

---

### Pitfall 4: Animation Stagger Index Uses DOM Order, Not Visual Column Order

**What goes wrong:** Current page uses `animationDelay: ${index * 100}ms` where `index` is from the flat `visibleCards` array. In masonry, card 0 and card 2 are in column 1; card 1 and card 3 are in column 2. Visual stagger should animate top-left, top-right, second-left, second-right — but flat index order staggers column-by-column instead of row-by-row, creating an awkward animation sequence.

**Why it happens:** The `animate-spring-in` stagger delay is applied to DOM order. DOM order and visual order diverge in masonry.

**Consequences:**
- StoveCard (column1, top) and NetworkCard (column2, top) appear at different times despite being visually "at the same level"
- Animation looks random rather than cascading naturally from top
- With CSS columns, cards 0 and 1 animate together (both column-top), then 2 and 3 — which is coincidentally correct for column-first fill, but wrong for row-first user expectation

**Prevention:**
1. **Calculate visual position for stagger delay**: For 2-column masonry with explicit columns, use `Math.min(colIndex, rowIndex)` as the stagger tier — all top-row cards animate first, then second row, regardless of DOM order.
2. **Simpler approach**: Group stagger by row tier: cards at row 0 get delay 0, cards at row 1 get delay 100ms, etc. For only 4–6 cards, a flat modest delay (50ms) is acceptable and avoids complexity.
3. **If using CSS columns**: Accept that stagger will be column-first. Consider removing per-card stagger entirely for masonry — animate the whole grid container in once, not individual cards.
4. **Reduced motion**: `prefers-reduced-motion` must suppress all stagger delays — existing CSS handles this at line 1117 in globals.css, verify it covers the masonry wrapper.

**Detection:**
- Visual check: Top-left card and top-right card appear at noticeably different times
- Stagger looks random on first load
- QA: record screen and step through frame-by-frame

**Project-specific:**
- Current stagger: `style={{ animationDelay: '${index * 100}ms' }}` in `app/page.tsx:74`
- `animate-spring-in` uses `--ease-spring` CSS variable (globals.css:992–994)
- `prefers-reduced-motion` suppression exists at globals.css:1117 — extend to cover masonry wrapper element

---

### Pitfall 5: Layout Shift (CLS) from Unknown Card Heights Before Data Loads

**What goes wrong:** Masonry column height algorithm runs after render. Cards with polling data (StoveCard, ThermostatCard) initially render a loading skeleton of unknown height, then expand when data arrives. The masonry engine recalculates column assignment after expansion — causing cards to jump/reflow mid-load.

**Why it happens:** CSS columns handles this gracefully (no reflow — columns just extend). JS-driven masonry libraries require explicit heights before positioning. If using absolute positioning (masonic, react-masonry-css with computed heights), height changes trigger a full reposition pass.

**Consequences:**
- Cards visually jump as data loads (CLS score hit)
- Error boundaries that render taller fallback UI cause downstream cards to shift down
- PWA: cached page shell shows masonry positions from previous load, fresh data changes heights → jarring shift

**Prevention:**
1. **Use CSS columns approach** — it avoids all JS-driven height calculation. Height changes naturally extend the column without repositioning other cards.
2. **If using JS masonry**: Define minimum card heights via CSS. `min-height: 200px` on each card prevents collapse-to-zero and reduces magnitude of height change.
3. **Use loading skeletons that match final card height**: Each card's loading state should match its data-loaded height within ±20px.
4. **Defer masonry positioning until data resolves**: Show stacked single-column layout during loading, switch to masonry after cards have rendered with data.
5. **Avoid error boundary fallback height changes**: `DeviceCardErrorBoundary` fallback should match approximate card height.

**Detection:**
- Chrome DevTools → Performance → Layout Shift metric spikes on load
- Lighthouse CLS score above 0.1
- Screen recording shows cards jumping as polling data arrives

**Project-specific:**
- `DeviceCardErrorBoundary` in `app/page.tsx:76–82` — define a fixed-height fallback matching card size
- StoveCard, ThermostatCard, LightsCard, NetworkCard all begin with loading state
- PWA service worker caches HTML shell — first paint will always show loading states before data

---

## Moderate Pitfalls

Issues that cause UX degradation or maintenance burden, recoverable without rewrite.

---

### Pitfall 6: ResizeObserver Loop Warnings in Masonry Containers

**What goes wrong:** JS-driven masonry libraries attach ResizeObserver to the container and each card. When a card's height changes (data loads, banner appears), the observer fires, triggers layout recalculation, which changes container height, which fires the observer again. Browser logs: "ResizeObserver loop completed with undelivered notifications."

**Why it happens:** Masonry must track height changes to maintain layout. Any synchronous mutation triggered by a resize creates an observer loop. Libraries that recalculate layout synchronously inside the observer callback are vulnerable.

**Prevention:**
1. **Debounce resize handling**: 120ms debounce on ResizeObserver callback before recalculating layout.
2. **Use CSS columns** — no ResizeObserver needed, browser handles layout.
3. **If using JS masonry**: Use `requestAnimationFrame` inside the observer callback, never synchronous DOM mutation.
4. **Batch mutations**: Collect all height changes, apply layout once per frame.

**Detection:**
- Browser console: "ResizeObserver loop completed with undelivered notifications"
- Performance profiler shows layout thrashing (alternating Layout/Style recalcs)
- CPU spikes during card data load transitions

---

### Pitfall 7: Keyboard Navigation and Screen Reader Order Mismatch

**What goes wrong:** In CSS column masonry, DOM order is: stove, thermostat, lights, network (flat array). Visual order for 2 columns is: stove (col1-top), thermostat (col1-second), lights (col2-top), network (col2-second). A keyboard user pressing Tab navigates: stove → thermostat (drops to bottom of column 1) → lights (jumps to top of column 2) → network. Screen reader reads in DOM order (stove, thermostat, lights, network) but screen reader announces positions users don't see.

**Why it happens:** CSS layout changes visual position without changing DOM order. WCAG 2.4.3 (Focus Order) requires focus order to match visual reading order. Masonry inherently separates these.

**Consequences:**
- Keyboard users experience disorienting focus jumps between columns
- Screen readers announce items in non-visual order
- WCAG 2.4.3 and 1.3.2 violations

**Prevention:**
1. **Match DOM order to visual order**: For 2-column masonry with explicit column arrays, put column-1 cards then column-2 cards in DOM. Keyboard focus follows visual top-down-left-then-right.
2. **Use `aria-flowto`** to explicitly declare reading order if DOM order must differ from visual order. Connect cards: stove→lights→thermostat→network (left-to-right rows).
3. **Simplest safe approach**: For only 4–6 cards at 2 columns, the difference is minor. Document the focus pattern in accessibility notes and use `aria-label` to identify each card's column position.
4. **Test with keyboard**: Tab through all cards and verify focus moves in a predictable pattern.

**Detection:**
- Tab through the dashboard manually — does focus jump unexpectedly between columns?
- Screen reader test: Navigate cards, verify announced order matches visual expectation
- axe DevTools: may flag `visual-order-follows-dom` rule

**Project-specific:**
- Cards wrap error boundaries, which should be keyboard-transparent (verify `tabIndex` not set on boundary `div`)
- `h1 class="sr-only"` at page.tsx:61 — good practice already in place

---

### Pitfall 8: Breakpoint Transition Causes Layout Flash

**What goes wrong:** At `sm` breakpoint (640px), layout transitions from 1-column mobile to 2-column masonry desktop. If using CSS columns, this transition is smooth. If using JS masonry with ResizeObserver, the transition triggers: resize event → recompute columns → reposition cards → flash of unpositioned content.

**Why it happens:** JS masonry libraries debounce resize events (120ms typical). During debounce window, cards may render at incorrect positions.

**Prevention:**
1. **CSS columns at breakpoint**: `columns-1 sm:columns-2` in Tailwind. Pure CSS, no flash.
2. **If using JS**: Set column count based on `useMediaQuery` hook with SSR-safe initial value matching server render (1 column).
3. **`contain: layout`** on masonry container: limits layout recalculation scope to the container.
4. **Test at exact breakpoint**: Drag browser window slowly through 640px and verify no flash.

**Detection:**
- Slow drag browser window through sm breakpoint, watch for card reposition flash
- Chrome DevTools → Performance → capture resize and check layout thrash events

**Project-specific:**
- Current `Grid` component uses Tailwind responsive classes which transition cleanly at breakpoints
- Any replacement must preserve the `sm:grid-cols-2` (or equivalent) behavior

---

### Pitfall 9: Error Boundary Fallback Collapses Masonry Column

**What goes wrong:** `DeviceCardErrorBoundary` renders a compact error fallback (e.g., 60px tall) for a card that normally occupies 400px. In CSS columns, this creates a large empty gap in one column. In JS masonry, it causes all subsequent cards to reflow upward, potentially changing which cards are in which column.

**Why it happens:** Error fallback height is typically much smaller than nominal card height. Masonry relies on actual rendered heights.

**Prevention:**
1. **Match fallback height to card height**: Error fallback should include `min-height` matching the expected card size.
2. **Alternatively, remove card from layout on error**: If card errors, exclude it from masonry rendering entirely (remove from `visibleCards` equivalent in client state).
3. **Inline fallback, not boundary**: For cards in masonry, render an inline error state (same height, different content) rather than swapping to a boundary fallback.

**Detection:**
- Deliberately trigger an error in StoveCard, observe column gap
- Verify layout remains stable despite card error state

**Project-specific:**
- `DeviceCardErrorBoundary` at `app/page.tsx:76` — check fallback renders approximate card height
- Existing pattern: self-contained cards already contain their error states inline (architecture.md:126–143)

---

### Pitfall 10: PWA Offline — Cached Shell with Masonry Positions Outdated

**What goes wrong:** Service worker caches the HTML shell. First paint on return visit shows server-rendered column layout. Then the client-side masonry JS reinitializes with current card heights, repositioning cards. User sees a flash of "old" layout → "new" layout.

**Why it happens:** PWA caches the HTML, which includes the server-rendered structure. If masonry positions are calculated client-side, they will not match the cached HTML positions on return load.

**Prevention:**
1. **CSS-only masonry**: Server renders the CSS class, client renders identical CSS class. No JS-driven position recalculation. PWA cache is accurate.
2. **If JS masonry is unavoidable**: Accept the flash, add `opacity: 0` to the masonry container until first layout calculation completes (max 100ms). Use `visibility: hidden` to prevent layout shift while maintaining DOM dimensions.
3. **Cache strategy awareness**: The existing service worker uses stale-while-revalidate. The HTML shell will always be slightly stale. CSS masonry is immune; JS masonry is not.

**Project-specific:**
- Phase 53 (MEMORY.md) implemented offline staleness and command queue
- Any masonry approach must be compatible with the offline-first PWA shell
- CSS columns approach is the only option that works correctly with cached HTML

---

## Minor Pitfalls

Small issues that cause confusion but are straightforward to fix.

---

### Pitfall 11: `break-inside: avoid` Not Applied to Card Wrappers

**What goes wrong:** In CSS column masonry, cards that are taller than one "column fragment" will be split across columns — the card header appears in column 1, the card body appears in column 2. Particularly likely for long cards like StoveCard with maintenance banners.

**Prevention:**
- Apply `break-inside: avoid` (and `page-break-inside: avoid` for legacy) to every card wrapper `div` in page.tsx.
- Tailwind: `break-inside-avoid` utility class.

**Detection:**
- Check StoveCard with maintenance banner visible — does it split across columns?

---

### Pitfall 12: Tailwind Purge Removes Dynamic Column Classes

**What goes wrong:** If column count is set dynamically (e.g., `columns-${count}`), Tailwind v4 purges unused classes and the class is not in the output CSS. Layout renders with no columns class.

**Prevention:**
- Use static Tailwind classes only: `columns-1 sm:columns-2`
- Never interpolate Tailwind class names
- If dynamic, use inline styles: `style={{ columnCount: 2 }}`

**Project-specific:**
- Project uses Tailwind v4 (globals.css:4: `@import "tailwindcss"`)
- Existing grid uses static classes `grid-cols-1 sm:grid-cols-2` — follow this pattern

---

### Pitfall 13: `gap` vs `column-gap` / `gutter` Mismatch

**What goes wrong:** Current `Grid` component uses Tailwind `gap-*` (CSS `gap` shorthand for grid). CSS columns uses `column-gap`, not `gap`. Switching to CSS columns and keeping `gap-*` classes produces no spacing between columns.

**Prevention:**
- Use `column-gap` (Tailwind: `gap-x-*`) for CSS column layouts
- Verify `gap-y` equivalent: CSS columns does not support row gap — use `margin-bottom` on each card for vertical spacing

**Project-specific:**
- `Grid` component defaults `gap: 'md'` which applies `gap-6 sm:gap-8 lg:gap-10`
- A `MasonryGrid` component will need `gap-x-6 sm:gap-x-8` for column gap, and `mb-6 sm:mb-8` on each card item for row gap

---

### Pitfall 14: TypeScript Strict Mode Rejects `columns` Inline Style Value

**What goes wrong:** `style={{ columnCount: breakpoint === 'sm' ? 2 : 1 }}` fails in strict TypeScript if `breakpoint` is `string | undefined`. Ternary with possible `undefined` produces type error on `columnCount`.

**Prevention:**
- Type column count explicitly: `const columnCount: 1 | 2 = isDesktop ? 2 : 1`
- Or use CSS classes only — no inline style needed

**Project-specific:**
- Project runs TypeScript `strict: true` + `noUncheckedIndexedAccess` (MEMORY.md Phase 44–47)
- Any new component must pass `tsc --noEmit` with zero errors

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Priority |
|-------------|---------------|------------|----------|
| **Library Selection** | JS masonry libraries crash SSR in server components (Pitfall 1) | Use CSS columns; if JS needed, explicit `'use client'` wrapper + avoid window at import scope | CRITICAL |
| **CSS Masonry Property** | Native CSS `grid-template-rows: masonry` not production-ready (Pitfall 2) | Use `column-count` until CSS grid-lanes has broad support | CRITICAL |
| **Firebase Card Order** | Flat order index incompatible with column-first CSS columns (Pitfall 3) | Design column assignment schema first; document user mental model | CRITICAL |
| **Animation Stagger** | DOM-order stagger looks wrong with column-first visual order (Pitfall 4) | Use row-tier stagger or flat modest delay for masonry | HIGH |
| **Data Load CLS** | Unknown card heights cause layout shift (Pitfall 5) | CSS columns auto-handles; enforce min-height on loading skeletons | HIGH |
| **PWA Offline** | JS masonry positions stale in cached HTML (Pitfall 10) | CSS-only masonry is the only PWA-safe approach | HIGH |
| **Breakpoint Transition** | Flash at sm breakpoint if JS masonry (Pitfall 8) | Pure CSS transition eliminates this | MEDIUM |
| **Error Boundary Height** | Compact fallback creates column gap (Pitfall 9) | Set min-height on fallback matching card size | MEDIUM |
| **Accessibility** | DOM/visual order divergence breaks keyboard nav (Pitfall 7) | Match DOM order to visual order for 2-column layout | MEDIUM |
| **Card Splitting** | Cards split across columns without break-inside (Pitfall 11) | Apply `break-inside-avoid` to every card wrapper | LOW |
| **Tailwind Purge** | Dynamic column class strings purged (Pitfall 12) | Static Tailwind classes only | LOW |
| **CSS Gap Semantics** | `gap-*` doesn't apply to CSS columns (Pitfall 13) | Use `column-gap` + `margin-bottom` on items | LOW |

---

## Architecture Recommendation for This Project

Given the constraints (server component page, PWA offline, TypeScript strict, spring animations), the **only safe approach** is:

**CSS Columns masonry** — not JS-driven masonry libraries.

```tsx
// MasonryGrid.tsx — can be a server component
<div className="columns-1 sm:columns-2 gap-x-6 sm:gap-x-8 lg:gap-x-10">
  {cards.map((card, i) => (
    <div
      key={card.id}
      className="break-inside-avoid mb-6 sm:mb-8 animate-spring-in"
      style={{ animationDelay: `${i * 50}ms` }}
    >
      <DeviceCardErrorBoundary ...>
        <CardComponent />
      </DeviceCardErrorBoundary>
    </div>
  ))}
</div>
```

This is:
- SSR-safe (no window access)
- PWA-safe (CSS cached with HTML)
- TypeScript-safe (no dynamic class strings)
- Animation-compatible (spring-in works per-card)
- CLS-safe (no JS height calculation)

The tradeoff: column order is top-down within each column (column 1 fills first). User's flat Firebase order maps to column-first visual order, which may diverge from expectation. Address this in user communication or switch to explicit 2-column Firebase schema.

---

## Sources

### SSR Hydration Mismatch
- [Next.js - Hydration Error Docs](https://nextjs.org/docs/messages/react-hydration-error)
- [MUI Masonry SSR Issue #32688](https://github.com/mui/material-ui/issues/32688) — MEDIUM confidence (issue tracker, confirmed by multiple reporters)
- [MUI Masonry Flicker Issue #36673](https://github.com/mui/material-ui/issues/36673) — MEDIUM confidence (issue tracker)
- [LogRocket - Resolving Hydration Mismatch in Next.js](https://blog.logrocket.com/resolving-hydration-mismatch-errors-next-js/)

### CSS Masonry Browser Support
- [MDN - CSS Masonry Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Masonry_layout) — HIGH confidence (official docs, experimental designation confirmed)
- [Chrome for Developers - CSS Masonry Update](https://developer.chrome.com/blog/masonry-update) — HIGH confidence (official Chrome team blog)
- [CSS-Tricks - Masonry Layout is Now grid-lanes](https://css-tricks.com/masonry-layout-is-now-grid-lanes/) — MEDIUM confidence (trade publication)
- [Can I Use - CSS Masonry](https://caniuse.com/mdn-css_properties_grid-template-rows_masonry) — HIGH confidence (compatibility database)

### Card Order and User Expectations
- [CSS-Tricks - Approaches for CSS Masonry](https://css-tricks.com/piecing-together-approaches-for-a-css-masonry-layout/) — MEDIUM confidence
- [W3C CSS WG - Masonry Accessibility Issue #5675](https://github.com/w3c/csswg-drafts/issues/5675) — HIGH confidence (official working group)

### Accessibility and Focus Order
- [MDN - Grid Layout and Accessibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Accessibility) — HIGH confidence (official docs)
- [Adrian Roselli - Source Order Matters](https://adrianroselli.com/2015/09/source-order-matters.html) — MEDIUM confidence (recognized accessibility expert)
- [Chrome Developers - Visual Order Follows DOM](https://developer.chrome.com/docs/lighthouse/accessibility/visual-order-follows-dom) — HIGH confidence (official docs)

### Performance and ResizeObserver
- [DhiWise - ResizeObserver Loop](https://www.dhiwise.com/blog/design-converter/resolving-resizeobserver-loop-completed-with) — MEDIUM confidence
- [OpenReplay - Avoiding Resize Event Pitfalls](https://blog.openreplay.com/avoiding-resize-event-pitfalls-js/) — LOW confidence (single source)

### Animation and Layout
- [Motion (Framer) - Layout Animations](https://motion.dev/docs/react-layout-animations) — HIGH confidence (official library docs)
- [Next.js Issue #49279 - App Router Framer Motion](https://github.com/vercel/next.js/issues/49279) — MEDIUM confidence (confirmed issue)

---

**Last Updated:** 2026-02-17
**Confidence:** HIGH overall — SSR and CSS browser support pitfalls verified with official docs. Card order and animation pitfalls derived from CSS column behavior (well-documented) + project-specific analysis. Accessibility pitfalls from W3C official sources.
