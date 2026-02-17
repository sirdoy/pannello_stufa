# Feature Landscape: Masonry Layout for Dashboard

**Domain:** Dashboard card layout — masonry for smart home PWA
**Researched:** 2026-02-17

## Context

Adding masonry layout to an existing dashboard home page. Current state:
- 6 device cards (stove, thermostat, weather, lights, camera, network)
- Standard CSS Grid: 2 cols desktop (`grid-cols-1 sm:grid-cols-2`), 1 col mobile
- User-configurable card order (up/down buttons in settings, saved to Firebase)
- Staggered `animate-spring-in` entrance animation (CSS keyframe, 100ms delay per index)
- Error boundaries wrap each card (`DeviceCardErrorBoundary`)
- Cards have varying heights (stove card is tall, weather card moderate, network card varies by data)

---

## Table Stakes

Features users expect from masonry. Missing = layout feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Gap elimination between cards** | The point of masonry — no empty vertical space below shorter cards | Low | CSS multi-column or JS layout engine both achieve this |
| **Consistent column width** | Cards should align to grid, not float freely | Low | Same column count as current (2 desktop, 1 mobile) |
| **Mobile unchanged (1 col stacked)** | Mobile single-column layout needs no masonry; adding it breaks readability | Low | Masonry only activates at `sm:` breakpoint and above |
| **No content jumping on load** | Layout should stabilize once cards render; cards shifting after data load is jarring | Medium | Cards with polling (stove, thermostat) can change height mid-session — must handle gracefully |
| **Error boundary cards still sized correctly** | If a card errors, its error fallback should occupy a reasonable height in the column | Low | DeviceCardErrorBoundary fallback needs a min-height to prevent column distortion |
| **User card order respected** | User-configured order (from settings) must be the primary sort key; masonry fills vertically within that constraint | Medium-High | This is the fundamental tension — see Anti-Features |
| **Gap between columns** | Horizontal gap must exist between columns, matching current `gap-8 lg:gap-10` | Low | Gap must be explicit; CSS multi-column has a known `column-gap` only issue |

---

## Differentiators

Features that go beyond the visual baseline. Not expected but noticeably improve the experience.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Smooth entrance animation preserved** | Staggered spring-in should still work; cards animating into their masonry positions looks polished | Medium | Need to preserve `animate-spring-in` with `animationDelay` per index; FLIP transition for repositioning is overkill at 6 cards |
| **No layout reflow after card data loads** | Cards that expand (e.g., stove showing maintenance banner) don't cause visible column re-balancing | High | Requires either fixed card heights or a JS layout engine with `ResizeObserver` |
| **Skeleton loading at correct approx height** | Skeleton placeholder matches approximate card height so layout doesn't jump dramatically when real content appears | Medium | Stove card ~480px, weather ~320px, network ~260px — skeletons should approximate these |
| **Column balance maintained across visible set** | If user hides cards, remaining cards still distribute evenly across columns | Medium | Layout engine must re-run when `visibleCards` changes |

---

## Anti-Features

Features to explicitly NOT build for this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Algorithm-driven column assignment** | True masonry (place card in shortest column regardless of user order) breaks user-configured order. Home Assistant community explicitly identified this as "the masonry layout doesn't make sense" — cards end up in arbitrary positions that differ from the user's intended sequence | Use a two-column CSS approach that respects DOM order: column 1 gets odd cards (1, 3, 5), column 2 gets even cards (2, 4, 6). User order is the primary sort key. |
| **Drag-and-drop reorder on the home page** | Home Assistant explicitly found that masonry + drag-and-drop "cannot co-exist" predictably — users don't understand which column a dragged card will land in | Keep reorder in settings page (up/down buttons), masonry layout is display-only |
| **FLIP animation on column repositioning** | At 6 cards with low update frequency, FLIP adds complexity with no perceptible benefit. Repositioning only happens when visibility changes (rare) | Accept instant reposition when card visibility changes; entrance animation already covers the "in" case |
| **Native CSS Grid masonry (`grid-template-rows: masonry`)** | Browser support is still limited (Firefox Nightly, Safari TP only as of 2026-02); production use requires polyfill or JS fallback anyway | Use CSS multi-column (`columns: 2`) or explicit two-column flexbox — both have universal support |
| **Auto-column count based on viewport** | Dashboard is defined as 2 cols desktop, 1 col mobile. Auto-column logic adds complexity and would break the user's mental model of the layout | Keep fixed column counts: 1 mobile, 2 desktop |
| **Per-card spanning (wide cards)** | Spanning across 2 columns in masonry requires JS measurement and breaks column balance | All cards are same width (1 column). Not needed for this project. |
| **Infinite scroll / virtualized masonry** | Only 6 cards — virtualization is engineering overkill | Simple layout only |

---

## Feature Dependencies

```
Masonry column layout
  └── Existing card order from Firebase (visibleCards array, already sorted by user order)
  └── Error boundary fallback min-height (card must not collapse to 0px)
  └── Mobile unchanged (layout applies only at sm: breakpoint)

No-jump loading
  └── Requires approximate card heights for skeleton OR accepting initial reflow
  └── Cards with ResizeObserver (for dynamic height changes mid-session)

Entrance animation
  └── `animate-spring-in` + animationDelay continues working (applies to wrapper div)
  └── Must not conflict with CSS column layout (column items don't need special treatment)
```

---

## "Good Masonry" vs "Broken Masonry"

### Good masonry looks like:
- Stove card (tall) and thermostat card (medium) sit side by side, both start at the top. Weather card appears below the shorter one with no empty gap between them.
- After a card errors and shows its compact error fallback, the column below it fills the space naturally — no large white gap.
- When the user hides a card in settings and returns to the home page, cards redistribute into the two columns without visible "jumping."
- On first load, cards spring in one by one (staggered 100ms) and settle into their masonry positions.
- On mobile: unchanged single-column stack, top-to-bottom in user-configured order.

### Broken masonry looks like:
- Card 1 appears in the right column because card 2 happened to load taller, swapping their visual positions relative to user-configured order.
- Large white gaps appear in a column because a card loaded with less content than expected.
- After 5 seconds (stove polling), the stove card grows taller and pushes cards below it down, causing a visible re-layout jump.
- The error boundary card collapses to near-zero height, leaving a half-column empty.
- Horizontal gap between columns differs from vertical gap (broken gap spec in CSS multi-column).

---

## Implementation Approach (Opinionated)

### Recommended: Two-Column Flexbox with DOM Order

The simplest approach that preserves user order AND eliminates gaps is:

```
Column A: visibleCards[0], visibleCards[2], visibleCards[4]
Column B: visibleCards[1], visibleCards[3], visibleCards[5]
```

Implemented as two `<div className="flex flex-col gap-8">` side by side in a flex container. Each card renders at its natural height. No algorithm, no DOM reordering, no JS measurement.

**Why not CSS multi-column (`columns: 2`):** Multi-column is column-first (reads top-to-bottom in column 1, then column 2). User order 1,2,3,4,5,6 becomes visual order 1,3,5 on left and 2,4,6 on right. This violates the "left-to-right reading order" expectation for a 2-column grid — user expects card 2 to the right of card 1, not card 3.

**Why not CSS Grid masonry:** Browser support insufficient for production without polyfill.

### Column Assignment Rule

Cards are split by index: even-index → left column, odd-index → right column. This means:
- Card at position 0 → left
- Card at position 1 → right
- Card at position 2 → left
- etc.

This preserves user intent: card 1 is top-left (most prominent), card 2 is top-right, then alternating down.

### Height Change Handling

Cards with polling (stove 5s, thermostat varies) can change height after load. Accept this: when a card's height changes, the column grows naturally and only content below it shifts — this is the same as any normal document reflow and is not perceptually jarring at 6 items.

Do NOT add ResizeObserver-triggered JS re-balancing. At 6 cards, the benefit is zero and the complexity is significant.

---

## Complexity Breakdown

### Low Complexity (< 1h)
- Two-column flexbox layout in `app/page.tsx` (replace `<Grid cols={2}>` with two flex column divs)
- Mobile unchanged (conditional rendering: masonry on `sm:`, stack below)
- Preserve `animate-spring-in` + `animationDelay` on each card wrapper

### Medium Complexity (2-4h)
- Error boundary fallback min-height (coordinate with DeviceCardErrorBoundary)
- Empty state when all cards hidden (existing `<EmptyState>` component, behavior unchanged)
- Testing: verify column assignment matches expected user order with various card counts

### High Complexity (not recommended for this milestone)
- No-jump loading with skeleton height approximation
- FLIP animations on column rebalancing
- ResizeObserver-driven dynamic rebalancing

---

## Integration with Existing Patterns

| Existing Pattern | How Masonry Interacts |
|------------------|-----------------------|
| `Grid` component (`app/components/ui/Grid.tsx`) | Replace `<Grid cols={2}>` on homepage with masonry-aware wrapper; keep `Grid` component untouched |
| `animate-spring-in` CSS keyframe | Continues working — applies to the `<div>` wrapper around each card, unaffected by column layout |
| `DeviceCardErrorBoundary` | Must receive `className="min-h-[160px]"` or similar to prevent 0-height collapsed columns |
| `visibleCards` array (sorted by user order) | Split into left/right arrays by index: `visibleCards.filter((_, i) => i % 2 === 0)` for left column |
| `EmptyState` | Span full width when shown (flex container, add `w-full` wrapper) |

---

## Mobile Considerations

Mobile (< `sm:` breakpoint) is unchanged: single column, top-to-bottom in user order. The masonry wrapper only activates at `sm:` and above. This is a hard requirement from the project context.

---

## Testing Considerations

| Test Case | Importance |
|-----------|------------|
| 6 visible cards → 3 per column, correct assignment (0,2,4 left / 1,3,5 right) | Critical |
| 5 visible cards → 3 left, 2 right | High |
| 1 visible card → 1 left, right empty | High |
| 0 visible cards → EmptyState renders full-width | Medium |
| Error boundary in any position → no collapsed column | High |
| Mobile viewport → single column stack, masonry divs not rendered | Critical |
| `animate-spring-in` fires for all cards with correct delay | Medium |

---

## Sources

**CSS Masonry & Layout Approaches:**
- [MDN: Masonry layout (CSS Grid Module Level 3)](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Masonry_layout)
- [CSS-Tricks: Making a Masonry Layout That Works Today](https://css-tricks.com/making-a-masonry-layout-that-works-today/)
- [Smashing Magazine: Masonry in CSS — Should Grid Evolve Or Stand Aside?](https://www.smashingmagazine.com/2025/05/masonry-css-should-grid-evolve-stand-aside-new-module/)
- [Tobias Ahlin: CSS masonry with flexbox, :nth-child(), and order](https://tobiasahlin.com/blog/masonry-with-css/)

**Home Assistant Masonry — Real-world UX Failures:**
- [Home Assistant Masonry View Documentation](https://www.home-assistant.io/dashboards/masonry/)
- [HA Community: Masonry Layout Doesn't Make Sense](https://community.home-assistant.io/t/masonry-layout-doesnt-make-sense/527497)
- [HA Blog: Dashboard Chapter 1 — Moving Away from Masonry](https://www.home-assistant.io/blog/2024/03/04/dashboard-chapter-1/)

**React Masonry Libraries (Considered, Not Recommended for This Use Case):**
- [react-masonry-css](https://github.com/paulcollett/react-masonry-css) — dependency-free, simple API, but column-first DOM order breaks user-order expectation
- [Masonic](https://github.com/jaredLunde/masonic) — virtualized, overkill for 6 cards

**MUI Masonry (Sequential Mode):**
- [React Masonry component - Material UI](https://mui.com/material-ui/react-masonry/) — sequential mode fills left-to-right, closest to what's needed; but importing MUI for one component is not justified

**SAP Fiori Masonry Guidelines:**
- [Masonry Layout - SAP Fiori for iOS Design Guidelines](https://experience.sap.com/fiori-design-ios/article/masonry-layout/) — use 3 columns for regular size class, 1 for compact
