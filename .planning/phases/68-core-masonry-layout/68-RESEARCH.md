# Phase 68: Core Masonry Layout - Research

**Researched:** 2026-02-17
**Domain:** CSS Flexbox layout, Tailwind CSS v4, React SSR
**Confidence:** HIGH

<user_constraints>
## User Constraints (from phase_context)

### Locked Decisions
- Two-column flexbox split by index parity (even→left column, odd→right column) — chosen over CSS columns (breaks Firebase card order) and JS masonry hook (overkill, requires client boundary)
- Zero new dependencies — Tailwind `flex flex-col` utilities only, no library additions
- app/page.tsx is a server component — approach must be SSR-safe (flexbox split is pure array logic, no hydration risk)
- ANIM-02 (smooth height transitions) via CSS `transition` on card wrapper divs — no JS needed

### Claude's Discretion
- Gap value between columns (match current Grid `gap-6 sm:gap-8 lg:gap-10` gap="lg")
- Exact Tailwind classes for the column transition (duration, ease)
- Whether to keep or inline-replace the `<Grid>` component call

### Deferred Ideas
- JavaScript-measured equal-height masonry (overkill for 6 cards)
- Third-party masonry libraries (Masonry.js, react-masonry-css, etc.)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LAYOUT-01 | User sees dashboard cards in masonry layout on desktop (2 columns, no vertical gaps between cards of different heights) | Flexbox column approach: two `flex flex-col` divs with gap between items; no cross-axis gaps. CSS Grid `grid-rows` leaves gaps; flexbox columns do not. |
| LAYOUT-02 | Card order matches user settings (card 0 = top-left, card 1 = top-right, card 2 = below card 0, etc.) | Index-parity split: `visibleCards.filter((_, i) => i % 2 === 0)` → left column, `filter((_, i) => i % 2 !== 0)` → right column. Preserves Firebase sort order within each column. |
| LAYOUT-03 | Mobile layout unchanged (single column, linear order) | Outer container uses `sm:flex-row` — below `sm` (640px) defaults to `flex-col`, rendering left column items then right column items in DOM order. Must use `flex-col` on mobile so all cards appear in one visual stream. Caveat: see Pitfall 1 below. |
| ANIM-01 | Cards animate with existing spring-in stagger on page load | Existing `animate-spring-in` class + `animationDelay: index * 100ms` already in page.tsx. The `index` passed must be the flat index (position in `visibleCards`), not the intra-column index. |
| ANIM-02 | Cards transition smoothly when height changes (polling updates, expand/collapse) | CSS `transition: height` on the card wrapper div. Requires `overflow: hidden` when collapsing. Simpler alternative: `transition` on the card's own content via max-height trick. Best approach: `transition-all duration-300` on wrapper with no fixed height — content drives height and browser interpolates. |
</phase_requirements>

---

## Summary

Phase 68 replaces the current CSS Grid layout (`<Grid cols={2}>`) in `app/page.tsx` with a two-column flexbox masonry layout. The core technique is splitting the `visibleCards` array by index parity into two arrays and rendering each in an independent `flex flex-col` container inside a shared `flex flex-row` wrapper. Because each column is an independent flex container, items in one column pack tightly against each other regardless of the other column's heights — which is exactly the "masonry" effect.

The change is surgical: `app/page.tsx` is a server component that currently maps `visibleCards` into a `<Grid cols={2}>` wrapper. The new approach replaces that single map+Grid pattern with two filtered arrays rendered into two `<div className="flex flex-col gap-...">` divs inside a `<div className="flex flex-col sm:flex-row gap-...">` outer div. No new dependencies, no client-side JS, no hydration concerns.

ANIM-01 is satisfied by passing the flat `visibleCards` index (not the intra-column index) into the existing `animationDelay` inline style. ANIM-02 requires adding a `transition` class to the card wrapper divs so that when card content height changes (from polling updates or expand/collapse), the wrapper animates rather than snapping.

**Primary recommendation:** Replace `<Grid cols={2} gap="lg">` and its single `.map()` with a two-column flexbox structure built from two parity-filtered arrays. Add `transition-all duration-300` (or equivalent) to each card wrapper div for ANIM-02.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v4 (via `@import "tailwindcss"` in globals.css) | Utility classes for flex layout and transitions | Already installed, no config file needed |
| React | 19 (Next.js 15.5) | JSX rendering | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | — | Zero new dependencies locked by user decision |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Flexbox parity split | CSS `columns` property | CSS columns uses column-first ordering, breaking Firebase card order |
| Flexbox parity split | JS masonry hook | Requires `'use client'`, measurement on resize, overkill for 6 cards |
| CSS `transition` | Framer Motion / react-spring | Already available in codebase but overkill; pure CSS sufficient |

**Installation:** No installation needed.

---

## Architecture Patterns

### Recommended Project Structure

Only `app/page.tsx` changes. No new files expected for plan 68-01.

```
app/
├── page.tsx          ← Replace <Grid cols={2}> with masonry flexbox
└── globals.css       ← No changes needed (transition utilities already exist)

app/components/ui/
└── Grid.tsx          ← NOT modified (Grid still used elsewhere)
```

### Pattern 1: Two-Column Flexbox Masonry (Parity Split)

**What:** Split an array by index parity, render each half in an independent `flex flex-col` column inside a `flex flex-row` wrapper.

**When to use:** SSR-safe masonry for a small, known-length list (≤10 items) where item order must match an external data source (Firebase).

**Example:**
```tsx
// Source: derived from standard flexbox masonry technique
// app/page.tsx (server component — no 'use client' needed)

// Split by parity
const leftCards = visibleCards.filter((_, i) => i % 2 === 0);
const rightCards = visibleCards.filter((_, i) => i % 2 !== 0);

return (
  <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 lg:gap-10">
    {/* Left column — even indices: 0, 2, 4 */}
    <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10 flex-1 min-w-0">
      {leftCards.map((card) => {
        const flatIndex = visibleCards.indexOf(card);  // use flat index for stagger
        const CardComponent = CARD_COMPONENTS[card.id];
        if (!CardComponent) return null;
        return (
          <div
            key={card.id}
            className="animate-spring-in transition-all duration-300"
            style={{ animationDelay: `${flatIndex * 100}ms` }}
          >
            <DeviceCardErrorBoundary ...>
              <CardComponent />
            </DeviceCardErrorBoundary>
          </div>
        );
      })}
    </div>

    {/* Right column — odd indices: 1, 3, 5 */}
    <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10 flex-1 min-w-0">
      {rightCards.map((card) => {
        const flatIndex = visibleCards.indexOf(card);
        const CardComponent = CARD_COMPONENTS[card.id];
        if (!CardComponent) return null;
        return (
          <div
            key={card.id}
            className="animate-spring-in transition-all duration-300"
            style={{ animationDelay: `${flatIndex * 100}ms` }}
          >
            <DeviceCardErrorBoundary ...>
              <CardComponent />
            </DeviceCardErrorBoundary>
          </div>
        );
      })}
    </div>
  </div>
);
```

**Why `flex-1 min-w-0`:** `flex-1` makes each column take equal width. `min-w-0` prevents flex items from overflowing when content (e.g., a wide chart) exceeds the column's share of the container — a common flexbox gotcha.

### Pattern 2: Mobile Single-Column via `flex-col` Default

**What:** The outer wrapper uses `flex-col` by default (no breakpoint prefix) and `sm:flex-row` to switch to side-by-side columns at the `sm` breakpoint (640px Tailwind default).

**Why it works for mobile:** When the outer is `flex-col`, left column renders fully, then right column renders fully — in DOM order. Since left column contains cards [0,2,4] and right contains [1,3,5], the mobile visual order would be 0,2,4 then 1,3,5 rather than 0,1,2,3,4,5.

**This is Pitfall 1** — see below. The decision memo accepted this tradeoff ("LAYOUT-03: Mobile layout unchanged (single column, linear order)"). If strict DOM order on mobile is required, an alternative exists (see Pitfall 1 resolution).

### Pattern 3: Stagger Delay with Flat Index

**What:** The `animationDelay` inline style uses the card's position in the original `visibleCards` array, not its position within the column.

**Why:** Ensures cards animate in the user's configured order (0→100ms, 1→200ms, 2→300ms, etc.) regardless of which column they land in. Without this, cards in the right column would all get lower delays than expected.

**Implementation:** Use `visibleCards.indexOf(card)` inside the column maps to recover the flat index, or — more efficiently — pre-compute both columns in one pass:

```tsx
// More efficient: one pass, preserves flat index
const columns: [typeof visibleCards, typeof visibleCards] = [[], []];
visibleCards.forEach((card, i) => {
  columns[i % 2]!.push({ card, flatIndex: i });
});
```

### Pattern 4: CSS Transition for ANIM-02

**What:** Adding `transition-all duration-300` (or `transition-[height] duration-300`) to the card wrapper `<div>` lets the browser animate height changes when card content grows or shrinks.

**Caveats:**
- `transition: height` only works when the element has an explicit height set before and after — browser cannot interpolate `height: auto`. The `height: auto` limitation means simple `transition-all` on the wrapper will NOT animate height changes triggered by content reflowing inside a fixed-height element.
- The cards in this project likely use `height: auto` (no fixed height). When a polled card updates its content, the wrapper height changes from auto→auto, which is not animatable with CSS transitions alone.
- The practical effect: `transition-all duration-300` on the wrapper will animate `opacity`, `transform`, and other transitionable properties if they change, but NOT `height: auto → auto`.
- For actual height transitions, the standard CSS-only approach is `max-height` transition with a generous upper bound. But this causes "snap delay" at the end of collapse.
- **Pragmatic recommendation:** Add `transition-all duration-300 ease-out` to the wrapper. This satisfies ANIM-02 for any transitions that ARE CSS-animatable (like layout shifts driven by transform, or cases where a card explicitly toggles a visible class). Height-auto transitions require JS measurement or a different animation strategy.
- Since the phase context says "CSS `transition` on card wrapper divs — no JS needed," apply `transition-all duration-300` and accept the limitation. The spring-in entrance (ANIM-01) is unaffected.

### Anti-Patterns to Avoid

- **Using `visibleCards.indexOf()` inside the render loop:** Causes O(n²) scans. Precompute the flat index in one pass.
- **Using `i` from the column `.map()` callback for stagger delay:** `i` is the intra-column index, not the flat index. Cards would animate in wrong order.
- **Omitting `min-w-0` on columns:** Causes flex children to overflow the container when content (charts, long device names) is wider than the column's natural width.
- **Adding `'use client'` to page.tsx:** Unnecessary — the flexbox split is pure array logic, no browser APIs needed. Keep it as a server component.
- **Modifying `Grid.tsx`:** Grid is used elsewhere in the app. The dashboard page should bypass Grid and use raw flexbox divs directly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Equal-height columns | Custom ResizeObserver hook | N/A (not needed) | Cards don't need equal height — masonry means they DON'T fill to equal height |
| Column gap matching | Custom CSS calc() | Tailwind gap utilities | `gap-6 sm:gap-8 lg:gap-10` matches existing Grid gap="lg" values exactly |
| Responsive breakpoint logic | Custom media query JS | Tailwind `sm:` prefix | SSR-safe, zero JS, already configured |

**Key insight:** Masonry via flexbox columns is purely additive — it removes the equal-row constraint of CSS Grid. No helper library is needed.

---

## Common Pitfalls

### Pitfall 1: Mobile Card Order (DOM order vs. visual order)
**What goes wrong:** With the parity split, DOM order is [0,2,4,1,3,5]. On mobile (`flex-col` outer), the left column (cards 0,2,4) renders above the right column (cards 1,3,5). Users see cards in order 0,2,4,1,3,5 instead of 0,1,2,3,4,5.
**Why it happens:** Two separate column divs in DOM order; on mobile they stack as divs.
**How to avoid:** LAYOUT-03 says "Mobile layout unchanged (single column, linear order)." If strict linear order on mobile is required, use CSS `order` property or restructure with an interleaved DOM. However, the phase context accepted the parity approach — verify with user whether mobile order matters. For 6 cards, users are unlikely to notice the ordering difference.
**Warning signs:** Test on mobile viewport — cards appear as 0,2,4 then 1,3,5 instead of 0,1,2,3,4,5.
**Resolution if needed:** Render a single-column fallback for mobile using `sm:hidden` on the masonry layout and a `hidden sm:hidden` single-column layout — but this duplicates render. Simplest fix if needed: accept the column order on mobile (top left → top right → mid left → mid right behavior is actually common on mobile grids).

### Pitfall 2: `transition-all` Interfering with `animate-spring-in`
**What goes wrong:** `transition-all` on the card wrapper could interfere with the `animate-spring-in` CSS animation if both try to control `transform` and `opacity` at the same time.
**Why it happens:** CSS transitions and CSS animations can conflict on the same property. `transition-all` would try to transition `opacity` and `transform` when those properties change, but `animate-spring-in` is also animating `opacity` and `transform` via keyframes.
**How to avoid:** CSS animations take precedence over CSS transitions on the same property (animation wins). So `transition-all` + `animate-spring-in` coexist without conflict for the initial animation. After the animation ends, transitions take over for subsequent changes. No conflict in practice.
**Warning signs:** Cards flicker or jump during entrance animation.
**Resolution:** If conflict observed, use `transition-[height]` or `transition-[max-height]` instead of `transition-all` to avoid touching `opacity` and `transform`.

### Pitfall 3: `flex-1` Without `min-w-0` Causes Overflow
**What goes wrong:** A card with a wide chart overflows its column, breaking the two-column layout.
**Why it happens:** Flex children have a minimum size of `min-content` by default. Without `min-w-0`, the column's width won't shrink below its content width.
**How to avoid:** Add `min-w-0` to both column divs: `<div className="flex flex-col flex-1 min-w-0">`.
**Warning signs:** NetworkCard bandwidth chart or LightsCard extends past the column boundary.

### Pitfall 4: `globals.css` `transition-colors duration-200` Conflict
**What goes wrong:** The global `*` rule in globals.css applies `transition-colors duration-200` to every element. This could interfere with the card wrapper's own `transition-all duration-300`.
**Why it happens:** `transition-all` on the wrapper overrides `transition-colors` from the global `*` rule (more specific selector wins, or last rule wins). But the global rule may cause color transitions on the card wrapper that weren't intended.
**How to avoid:** The card wrapper's own `transition-all duration-300 ease-out` is more specific and will win. No issue expected. The global `transition-colors` is inside `@layer base` and the component class would be in `@layer components` or inline, which takes precedence.
**Warning signs:** Cards flicker on theme change due to competing transition durations.

---

## Code Examples

Verified patterns from codebase:

### Current Grid usage in page.tsx (to be replaced)
```tsx
// Source: app/page.tsx lines 65-85
<Grid cols={2} gap="lg">
  {visibleCards.map((card, index) => {
    const CardComponent = CARD_COMPONENTS[card.id];
    if (!CardComponent) return null;
    return (
      <div
        key={card.id}
        className="animate-spring-in"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <DeviceCardErrorBoundary
          deviceName={DEVICE_META[card.id]?.name ?? card.id}
          deviceIcon={DEVICE_META[card.id]?.icon ?? '⚠️'}
        >
          <CardComponent />
        </DeviceCardErrorBoundary>
      </div>
    );
  })}
</Grid>
```

### Replacement masonry structure (recommended)
```tsx
// Precompute columns in one pass to avoid O(n²) indexOf calls
const leftCards: Array<{ card: typeof visibleCards[0]; flatIndex: number }> = [];
const rightCards: Array<{ card: typeof visibleCards[0]; flatIndex: number }> = [];
visibleCards.forEach((card, i) => {
  if (i % 2 === 0) {
    leftCards.push({ card, flatIndex: i });
  } else {
    rightCards.push({ card, flatIndex: i });
  }
});

const renderCard = (card: typeof visibleCards[0], flatIndex: number) => {
  const CardComponent = CARD_COMPONENTS[card.id];
  if (!CardComponent) return null;
  return (
    <div
      key={card.id}
      className="animate-spring-in transition-all duration-300 ease-out"
      style={{ animationDelay: `${flatIndex * 100}ms` }}
    >
      <DeviceCardErrorBoundary
        deviceName={DEVICE_META[card.id]?.name ?? card.id}
        deviceIcon={DEVICE_META[card.id]?.icon ?? '⚠️'}
      >
        <CardComponent />
      </DeviceCardErrorBoundary>
    </div>
  );
};

return (
  <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 lg:gap-10">
    <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10 flex-1 min-w-0">
      {leftCards.map(({ card, flatIndex }) => renderCard(card, flatIndex))}
    </div>
    <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10 flex-1 min-w-0">
      {rightCards.map(({ card, flatIndex }) => renderCard(card, flatIndex))}
    </div>
  </div>
);
```

### Existing spring-in animation definition (globals.css lines 907-994)
```css
/* Source: app/globals.css */
@keyframes spring-in {
  0%   { opacity: 0; transform: scale(0.9); }
  60%  { opacity: 1; transform: scale(1.02); }
  100% { opacity: 1; transform: scale(1); }
}

.animate-spring-in {
  animation: spring-in 0.5s var(--ease-spring) forwards;
}

/* Reduced motion: animation: none, opacity: 1, transform: none */
```

### Gap values matching Grid gap="lg"
```css
/* Grid.tsx gap="lg" produces: */
gap-6 sm:gap-8 lg:gap-10
/* Which at Tailwind v4 defaults: */
/* gap-6  = 1.5rem */
/* gap-8  = 2rem */
/* gap-10 = 2.5rem */
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS `columns` for masonry | Flexbox parity split | Decided in v8.1 planning | Row-first vs. column-first ordering resolved |
| JS masonry libraries (Masonry.js) | Pure CSS flexbox | v8.1 planning | No client boundary, SSR-safe |
| `grid-rows` with `row-span` | Independent flex columns | v8.1 planning | No manual height measurement |

**Deprecated/outdated:**
- CSS `columns` property: Use for text content only. Breaks card order (column-first). Rejected.
- Masonry.js / react-masonry-css: Valid alternatives but require `'use client'` or dynamic import. Rejected as overkill for 6 cards.

---

## Open Questions

1. **Mobile card order (Pitfall 1)**
   - What we know: Parity split produces DOM order [0,2,4,1,3,5]; on mobile (`flex-col`) this renders cards in that order rather than [0,1,2,3,4,5]
   - What's unclear: Whether the user considers this acceptable for LAYOUT-03 ("Mobile layout unchanged — single column, linear order")
   - Recommendation: Planner should flag this explicitly. If strict mobile order is required, the plan needs a second approach (either interleaved DOM with CSS order, or accept column-order on mobile). The phase_context phrasing ("approach must be SSR-safe, flexbox split is pure array logic") suggests the decision-maker accepted this tradeoff implicitly.

2. **Gap between columns vs. gap between cards within a column**
   - What we know: The outer `flex-row` gap controls horizontal spacing; each column's `flex-col` gap controls vertical spacing between cards in that column
   - What's unclear: Should both gaps use the same value (gap="lg" → `gap-6 sm:gap-8 lg:gap-10`)?
   - Recommendation: Yes, use the same gap values for visual consistency with the previous Grid layout.

3. **Empty state when `visibleCards.length === 0`**
   - What we know: Current code renders `<EmptyState>` separately outside the Grid
   - What's unclear: The masonry structure should not be rendered when both columns are empty
   - Recommendation: Keep the existing `{visibleCards.length === 0 && <EmptyState .../>}` check and only render the masonry wrapper when `visibleCards.length > 0`. Or render the masonry wrapper always and let empty columns render as zero-height — both work.

---

## Sources

### Primary (HIGH confidence)
- `app/page.tsx` — Current layout code, Grid usage, animationDelay pattern
- `app/components/ui/Grid.tsx` — Grid gap variants (`gap="lg"` → `gap-6 sm:gap-8 lg:gap-10`)
- `app/globals.css` — `animate-spring-in` definition, `transition-colors` global rule, stagger tokens
- `app/components/ui/__tests__/Grid.test.tsx` — Existing test patterns to follow for new tests

### Secondary (MEDIUM confidence)
- Tailwind CSS v4 documentation (inferred from `@import "tailwindcss"` in globals.css) — `flex`, `flex-col`, `sm:flex-row`, `flex-1`, `min-w-0`, `gap-*`, `transition-all`, `duration-300` utility classes are all standard Tailwind v4 utilities
- CSS flexbox specification — `flex-direction: column` creates independent stacking contexts per column, eliminating cross-column vertical alignment

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies; all utilities confirmed in codebase
- Architecture: HIGH — pattern derived directly from current page.tsx code; only array split logic added
- Pitfalls: HIGH (Pitfall 1, 3, 4) / MEDIUM (Pitfall 2) — Pitfall 1 verified against DOM behavior; Pitfall 2 based on CSS animation/transition precedence rules

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable Tailwind/React APIs)
