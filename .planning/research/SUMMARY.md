# Project Research Summary

**Project:** Pannello Stufa — v8.1 Masonry Dashboard Layout
**Domain:** CSS masonry layout for Next.js 15.5 PWA dashboard
**Researched:** 2026-02-17
**Confidence:** HIGH

## Executive Summary

This milestone adds masonry layout to the existing 6-card smart home dashboard: no empty vertical gaps below shorter cards on desktop (2 columns), mobile stays unchanged (1 column), and user-configured Firebase card order is fully respected. The research produced four distinct recommendations that conflict on key tradeoffs. This summary resolves the conflict with a clear, opinionated recommendation.

The core tension is: **CSS columns is SSR-safe and requires zero JS, but fills column-first (cards 0,2,4 on left / 1,3,5 on right), violating the user's expected left-to-right reading order.** The pitfalls researcher explicitly flagged CSS columns ordering as a critical pitfall (Pitfall 3). JS-based approaches (ResizeObserver hook) preserve row-first order but require a client component boundary. The simplest approach — explicit two-column flexbox split by index — preserves order, requires no hooks, no client boundary, and no new dependencies.

**Recommendation: Two-column flexbox split with explicit column arrays.** Split `visibleCards` by index at render time — even-indexed cards into a left flex column, odd-indexed cards into a right flex column. This is pure JSX that runs in the existing server component with zero new dependencies, no hydration mismatch, and no client boundary. Card 0 appears top-left, card 1 top-right, card 2 second-left — exactly matching user expectation from the Firebase-configured order. Vertical gaps are eliminated because each column is an independent `flex flex-col` container. This is also the safest approach for the PWA: service worker caches the HTML structure, and since there are no JS-calculated positions, the cached HTML is always valid. If true height-balancing masonry becomes necessary in a future milestone (12+ cards, dramatic height disparities), the stack researcher's `useMasonryGrid` hook is the documented next step.

## Key Findings

### Recommended Stack

No new dependencies are required. Every JS masonry library evaluated is either unmaintained (`react-masonry-css`, abandoned 5 years ago), has SSR issues with Next.js App Router (`react-responsive-masonry`, GitHub issue #127), requires known aspect ratios at render time (`@masonry-grid/react`), or fills column-first breaking user order. CSS native masonry (`grid-template-rows: masonry`) has 0% stable browser support as of Feb 2026 — Chrome and Apple disagree on the spec. The two-column flexbox split requires no new files beyond `app/page.tsx` changes and tests.

See [STACK-masonry-layout.md](STACK-masonry-layout.md) for full library-by-library evaluation.

**Core technologies:**
- **Tailwind CSS `flex flex-col` utilities**: Two side-by-side flex columns — no new primitives, pattern already used throughout project
- **Existing `Grid` component** (`app/components/ui/Grid.tsx`): Left untouched; masonry replaces only the homepage grid usage
- **No new hook, no client boundary**: Index-based column split (`i % 2 === 0`) is plain array logic executable in the server component

### Expected Features

See [FEATURES.md](FEATURES.md) for full analysis with complexity ratings.

**Must have (table stakes):**
- Gap elimination between cards — no empty vertical space below shorter cards in a column
- Firebase card order respected — user's configured flat order maps predictably to visual positions (0=top-left, 1=top-right, 2=second-left)
- Mobile unchanged — single-column stack, masonry only at `sm:` breakpoint
- Spring entrance animation preserved — `animate-spring-in` with 100ms delay per index continues working
- Error boundary cards at reasonable height — compact fallback must not leave a column visually collapsed

**Should have (differentiators):**
- Column balance maintained when cards are hidden — even/odd split adapts cleanly to 5, 4, 3 visible cards
- Animation stagger remains coherent — flat index order produces visually sensible cascade

**Defer (out of scope for this milestone):**
- Skeleton heights approximating card content (complex, low ROI for 6 cards)
- FLIP animation on card visibility change (overkill at 6 cards, high complexity)
- ResizeObserver-driven dynamic height rebalancing (adds complexity, flex flow handles gracefully)
- Drag-and-drop reorder on home page (incompatible with masonry in general — confirmed by Home Assistant post-mortem)

### Architecture Approach

Three researchers recommended three different architecture patterns; the fourth (pitfalls) correctly identified the fatal flaw in one of them. The synthesis picks the simplest viable approach:

**Explicit two-column flexbox split in `app/page.tsx`.** Replace the single `<Grid cols={2} gap="lg">` map with two parallel flex column divs, each receiving cards split by index parity. This is a server component change — no client boundary needed. The `Grid` component (`Grid.tsx`) is left untouched. The pattern is extractable to a `MasonryColumns` server component if code clarity warrants it, but the inline form is acceptable given the scope.

**Why not extend Grid.tsx with CSS columns (architecture researcher's approach):** CSS `column-count` distributes items top-to-bottom within each column before starting the next. With variable card heights (the whole point of masonry), the column split point is height-determined at paint time, not at array-index time. Users who configured "Stove first, Thermostat second" will see Thermostat below Stove in column 1 rather than at the top of column 2. This breaks the mental model that card order = visual sequence.

**Why not `useMasonryGrid` hook (stack researcher's approach):** Technically correct true masonry, but requires a `'use client'` component boundary, a ~40-line hook, and ResizeObserver logic. For 6 cards with content-driven polling, the CSS flow of two flex columns already eliminates gaps without measurement. The complexity cost exceeds the benefit at this scale.

**Major components affected:**
1. `app/page.tsx` — Replace `<Grid cols={2} gap="lg">` with two-column flex layout, split `visibleCards` by index parity
2. `DeviceCardErrorBoundary` — Add `min-height` to fallback to prevent visually empty column halves
3. `app/components/ui/__tests__/Grid.test.tsx` — No change required (Grid.tsx untouched)
4. New tests for column assignment logic (index → column mapping, edge cases)

### Critical Pitfalls

See [PITFALLS-masonry-layout.md](PITFALLS-masonry-layout.md) for full analysis with detection and prevention strategies.

1. **CSS columns ordering breaks Firebase card order (Pitfall 3)** — CSS `column-count` fills column-first; user order [stove, thermostat, lights, network] becomes column1=[stove, lights] / column2=[thermostat, network], not the expected row-first assignment. Prevention: use explicit index-based array split into two flex columns instead of CSS columns.

2. **SSR hydration mismatch from JS masonry (Pitfall 1)** — Libraries reading `window.innerWidth` or `getBoundingClientRect` on server crash or cause mismatch. Prevention: the flexbox split runs at server render time with pure array logic — zero hydration risk.

3. **PWA offline cache invalidation (Pitfall 10)** — JS masonry positions cached in HTML shell diverge from recalculated positions on next load, causing a flash. Prevention: flexbox split is pure HTML structure with Tailwind classes — cached HTML is always valid regardless of card heights.

4. **Native CSS masonry not production-ready (Pitfall 2)** — `grid-template-rows: masonry` silently falls back to standard grid on Chrome and Firefox (0% stable support). Prevention: do not use it.

5. **Error boundary fallback collapses column (Pitfall 9)** — `DeviceCardErrorBoundary` compact fallback (~60px) where a card normally occupies 400px leaves a visual half-column gap. Prevention: add `min-height` to fallback matching approximate card height category.

## Implications for Roadmap

This is a small, focused milestone. The research supports a two-phase implementation: core layout change, then polish and tests.

### Phase 1: Core Masonry Layout
**Rationale:** All layout logic is in `app/page.tsx`; all card components are untouched. The column split is simple enough to implement, verify visually, and test in a single plan. This is the primary deliverable.
**Delivers:** Two-column desktop masonry with Firebase order preserved, mobile unchanged at `sm:` breakpoint, spring animation working per card with correct stagger.
**Implements:** Index-based flex column split, gap elimination between cards, `animate-spring-in` with `animationDelay` preserved per card in both columns.
**Avoids:** CSS columns ordering problem (Pitfall 3), SSR hydration mismatch (Pitfall 1), PWA cache flash (Pitfall 10).

**Files changed:**
- `app/page.tsx` — Replace `<Grid cols={2}>` with two `flex flex-col` column divs

### Phase 2: Error Boundary Polish and Tests
**Rationale:** Error boundary height and edge cases (0 visible cards, 1 visible card) are important polish items, separable from the core layout change. Tests must be written after the column assignment contract is finalized.
**Delivers:** Error fallback with appropriate `min-height` per card size category, `EmptyState` spanning full width, unit tests for all column assignment edge cases.
**Implements:** `DeviceCardErrorBoundary` fallback height, `EmptyState` full-width wrapper, test matrix for 0/1/3/5/6 card counts.
**Avoids:** Column collapse from compact error fallback (Pitfall 9), regression risk from untested column logic.

**Files changed:**
- `DeviceCardErrorBoundary` or its call site in `app/page.tsx` — add `min-height`
- New test file for column split logic

### Phase Ordering Rationale

- Phase 1 first: the layout change is the core deliverable and unblocks visual verification of all polish items.
- Phase 2 second: error boundary height requires seeing the layout in place to judge appropriate min-heights; tests can only be written after the implementation contract is finalized.
- Total estimated effort: 3-5 hours across both phases. Both can be planned and executed in a single roadmap pass with two plans.

### Research Flags

Phases with standard patterns (skip additional research-phase):
- **Both phases:** Pattern is fully documented. Flexbox column split is well-understood, Tailwind utilities are standard, test patterns follow existing dashboard tests. The `app/page.tsx` structure should be read directly before writing the plan, but no domain research is needed.

One gap requiring a file read before planning (not full research):
- **`app/page.tsx` current structure**: Read the actual card map loop, `DeviceCardErrorBoundary` props, and `EmptyState` usage to confirm the implementation contract before writing the plan.

## The Approach Conflict Resolved

For clarity, the explicit synthesis of four conflicting researcher opinions:

| Researcher | Recommendation | Verdict |
|------------|---------------|---------|
| Stack researcher | `useMasonryGrid` hook + ResizeObserver + CSS Grid `grid-row: span N` | Technically correct true masonry; oversized for 6 static-count cards; requires client boundary. Reserve for future milestone if needed. |
| Features researcher | Two-column flexbox split by index parity | Simple, preserves order, SSR-safe, no new dependencies. **Adopted.** |
| Architecture researcher | Extend `Grid.tsx` with CSS `columns` masonry prop | SSR-safe but column-first ordering breaks user expectation. Pitfall 3 is disqualifying. |
| Pitfalls researcher | CSS columns with caveat; flagged ordering as critical | Correctly identified the disqualifying pitfall; aligns with features researcher's recommendation. |

**Winner: Two-column flexbox split (features researcher).** It is the only approach that is simultaneously SSR-safe, PWA-safe, preserves Firebase card order, requires no new dependencies, requires no client component boundary, and requires no new hooks.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All library rejections verified with official sources (caniuse, npm pages, GitHub issues). CSS native masonry 0% support confirmed Feb 2026. |
| Features | HIGH | Table stakes obvious for a masonry layout. Anti-features derived from Home Assistant real-world masonry failures, confirmed by community post-mortem. |
| Architecture | MEDIUM | The recommended approach (flexbox split) was not the primary recommendation of any single researcher but correctly resolves the ordering constraint. Needs one pass through actual `app/page.tsx` before plan writing. |
| Pitfalls | HIGH | SSR and CSS masonry pitfalls verified with official docs (MDN, Chrome team blog, caniuse). Card ordering pitfall verified against CSS column-flow behavior (well-documented). PWA pitfall is project-specific and consistent with Phase 53 implementation. |

**Overall confidence:** HIGH for the approach direction. The implementation detail (how to wire up the flex split in `app/page.tsx`) requires reading the current file before writing the plan, but the approach itself has no open questions.

### Gaps to Address

- **`app/page.tsx` exact structure**: The card map loop, `DeviceCardErrorBoundary` props signature, `EmptyState` usage, and current `animate-spring-in` application must be confirmed from the actual file before writing the implementation plan. The research was done from documentation; the file may have evolved.
- **Animation stagger with column split**: The flat `index` from `visibleCards.map` still produces the correct user-order stagger (card 0 at 0ms, card 1 at 100ms...) because the flat index IS the user's intended sequence. Confirm this is applied to the wrapper div in the column, not to the column container itself.
- **`EmptyState` width handling**: When `visibleCards.length === 0`, the two-column flex wrapper must gracefully hand off to the full-width `EmptyState`. The current `EmptyState` usage in `app/page.tsx` must be confirmed — it should span both columns, not render inside one of them.

## Sources

### Primary (HIGH confidence)
- [caniuse: grid-template-rows masonry](https://caniuse.com/mdn-css_properties_grid-template-rows_masonry) — 0% stable support confirmed
- [Chrome Developers: CSS Masonry Update](https://developer.chrome.com/blog/masonry-update) — Chrome 140+ flag only
- [WebKit blog: CSS masonry syntax](https://webkit.org/blog/16026/css-masonry-syntax/) — spec disagreement ongoing
- [MDN: CSS Masonry Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Masonry_layout) — experimental status confirmed
- [Next.js: Hydration Error Docs](https://nextjs.org/docs/messages/react-hydration-error) — SSR mismatch behavior
- [MDN: Grid Layout and Accessibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Accessibility) — DOM/visual order rules
- [W3C CSS WG: Masonry Accessibility Issue #5675](https://github.com/w3c/csswg-drafts/issues/5675) — ordering implications

### Secondary (MEDIUM confidence)
- [CSS-Tricks: Piecing together masonry approaches](https://css-tricks.com/piecing-together-approaches-for-a-css-masonry-layout/) — CSS columns order problem documented
- [CSS-Tricks: Making masonry that works today](https://css-tricks.com/making-a-masonry-layout-that-works-today/) — Grid row-span technique (reserve approach)
- [Cruip: True masonry with Next.js](https://cruip.com/how-to-create-a-true-masonry-with-nextjs/) — custom hook approach documented (reserve approach)
- [react-responsive-masonry GitHub issue #127](https://github.com/cedricdelpoux/react-responsive-masonry/issues/127) — SSR issue confirmed
- [Home Assistant Blog: Moving Away from Masonry](https://www.home-assistant.io/blog/2024/03/04/dashboard-chapter-1/) — real-world UX failures from true masonry on dashboards
- [HA Community: Masonry Layout Doesn't Make Sense](https://community.home-assistant.io/t/masonry-layout-doesnt-make-sense/527497) — user expectations documented
- [MUI Masonry SSR Issue #32688](https://github.com/mui/material-ui/issues/32688) — hydration mismatch with JS masonry confirmed

### Tertiary (LOW confidence)
- None relied upon for recommendations.

---
*Research completed: 2026-02-17*
*Ready for roadmap: yes*
*Synthesized from: STACK-masonry-layout.md, FEATURES.md, ARCHITECTURE.md, PITFALLS-masonry-layout.md*
