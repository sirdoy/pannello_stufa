# Phase 177: Equal-Size Dashboard Glass Cards - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 177-equal-size-dashboard-glass-cards
**Mode:** `--auto --chain` — all gray areas auto-resolved with recommended defaults grounded in ROADMAP.md SC, REQUIREMENTS.md DASH-01..DASH-12, the Ember Glass design bundle (`cards.jsx`), and Phases 174/175/176 locked CONTEXT/UI-SPEC.
**Areas discussed:** namespace & file layout, layout grid, per-card content shape, tap → sheet wiring, primitive extraction, tone palette, loading + stale + error handling, React Compiler discipline, tests, legacy big card disposition.

---

## Namespace & file layout for new cards

| Option | Description | Selected |
|--------|-------------|----------|
| `app/components/EmberGlass/cards/<Device>Card.tsx` (new subfolder) | Sub-folder under existing EmberGlass namespace; symbol collisions with legacy `app/components/devices/<device>/[Device]Card.tsx` resolved by import path | ✓ |
| `app/components/devices/<device>/[Device]GlassCard.tsx` (sibling to legacy) | Add `GlassCard` suffix next to legacy big card | |
| Replace legacy big cards in place | Rename legacy → `[Device]CardLegacy`, new takes the slot | |

**Auto-selected rationale:** Subfolder under `EmberGlass/` keeps the v20.0 redesign self-contained, mirrors the namespace convention from Phases 174/175/176, and keeps Phase 178 sheet bodies easy to colocate later. Legacy cards stay in `devices/` because they still serve the legacy detail pages (/stove, /lights, /sonos, /raspi).

---

## Layout grid

| Option | Description | Selected |
|--------|-------------|----------|
| Single CSS grid `grid-cols-2 gap-3` for all viewports, container `max-w-md sm:max-w-2xl mx-auto` | Bundle-fidelity 2-col phone-frame layout, capped width on tablet+ | ✓ |
| Keep masonry, change cards to 1:1 only | Preserves `splitIntoColumns`; card asymmetry tolerated | |
| Responsive 2-col mobile / 3-col tablet / 4-col desktop | More density on wide viewports | |

**Auto-selected rationale:** ROADMAP SC-#1 says "2-column mobile grid"; bundle is 2-col phone frame across the board. Capping width on `sm+` keeps cards tappable. Masonry is removed — `splitIntoColumns` becomes orphan and is flagged for cleanup-phase deletion.

---

## Per-card content shape

| Option | Description | Selected |
|--------|-------------|----------|
| Lift bundle `cards.jsx` shape verbatim per card (DASH-02..DASH-10 spec) | Each card = bundle shape mapped to existing data hook fields | ✓ |
| Reuse existing big-card components, scale down | Inherits legacy styling debt | |
| Design from scratch ignoring bundle | Throws away the design system already locked | |

**Auto-selected rationale:** REQUIREMENTS.md DASH-02..DASH-10 are explicit and quote the bundle. Bundle is the design contract.

---

## Tap → sheet wiring (forward dep on Phase 178)

| Option | Description | Selected |
|--------|-------------|----------|
| Per-card `useState` for sheet open + Phase 175 `<Sheet>` wrapper + `<SheetPlaceholderBody>` rendered inline | Wiring is provable now; Phase 178 swaps placeholder for real bodies | ✓ |
| Tap → `router.push('/stove')` etc. as fallback to existing pages; Phase 178 swaps to Sheet | Functional fallback; user keeps full control during transition | |
| Tap → no-op + log; Phase 178 wires everything | Minimal Phase 177 surface but unverifiable wiring | |

**Auto-selected rationale:** Per-card `useState` keeps each card self-contained and makes Phase 178 a one-file-at-a-time swap. ROADMAP SC-#3 wording "Tapping a card opens its corresponding modal sheet (Phase 178)" reads as: wiring lands in 177, real bodies in 178. Placeholder body keeps Playwright DASH-11 testable now.

---

## Primitive extraction

| Option | Description | Selected |
|--------|-------------|----------|
| Extract 7 primitives (`GlassCard`, `CardHead`, `StatusDot`, `MiniStat`, `PlayingBars`, `InlineToggle`, `GlassCardSkeleton`) as separate files in `EmberGlass/` | DRY across 9 cards; primitives reusable in Phase 178 sheets | ✓ |
| Inline all bundle bits per card | Less indirection; ~3× LOC | |
| Single `primitives.tsx` barrel with all 7 inside | Halfway; harder to tree-shake | |

**Auto-selected rationale:** 7 separate files keep imports clean and make Phase 178 reuse trivial (`<MiniStat>`, `<PlayingBars>`, `<InlineToggle>` will all show up inside sheets).

---

## Tone palette

| Option | Description | Selected |
|--------|-------------|----------|
| Per-card device-class hex from bundle (Stove → `var(--accent)`, Climate `#5eafff`, Lights `#f5c84a`, Sonos `#b080ff`, Weather `#ffb84a`, Camera `#6aa86a`, Network `#5eafff`, Raspi `#6aa86a`, Tuya/Dirigera `#ffb84a`) | Bundle verbatim; only Stove follows user-themable accent | ✓ |
| Bind every tone to `var(--accent)` | All cards adopt user accent — visually flat | |
| Add 9 new tokens `--tone-stove`/`--tone-climate`/etc. | Themability is overengineering for v20.0 | |

**Auto-selected rationale:** Bundle binds Stove to accent; the other 8 tones identify device class. Re-themability of device classes is not a stated goal.

---

## Loading + stale + error inside 1:1 footprint

| Option | Description | Selected |
|--------|-------------|----------|
| Single `<GlassCardSkeleton>` Suspense fallback; stale → amber `<StatusDot>`; error → `"—"` placeholder + `"Non raggiungibile"` 10px footnote | Minimal, fits 1:1 cleanly; full error UI lives in sheets | ✓ |
| Per-device skeletons preserved (current `Skeleton.StovePanel` etc.) | Mismatched aspect ratios; jank | |
| Banner overlays inside the card on error/stale | No room in 1:1 footprint | |

**Auto-selected rationale:** 1:1 footprint forbids banners. Sheet (Phase 178) is the right place for full error UI. Card stays glanceable.

---

## React Compiler discipline (DASH-12, SC-#5)

| Option | Description | Selected |
|--------|-------------|----------|
| Zero new `useMemo`/`useCallback` in cards or primitives; pure render functions; CI runs `npx react-compiler-healthcheck` | Phase 71 + Phase 95 discipline preserved | ✓ |
| Add explicit memoization for "safety" | Bypasses React Compiler 1.0 auto-memo benefits | |

**Auto-selected rationale:** Phase 71 enabled React Compiler 1.0; Phase 95 deleted ~179 manual memo hooks. New cards stay pure.

---

## Tests

| Option | Description | Selected |
|--------|-------------|----------|
| Playwright spec for grid + per-card content + tap → sheet + stagger; Jest spec per card + per primitive; reuse `collectConsoleErrors`; handle VersionEnforcer overlay | Mirror Phase 175/176 test scaffolding | ✓ |
| Playwright only | No unit-level coverage of summary rendering | |
| Jest only | No layout / 1:1 verification | |

**Auto-selected rationale:** Phase 175/176 precedent + ROADMAP SC-#1..#5 demand visual + behavioral coverage that only Playwright can give for layout. Jest covers the per-card render contract.

---

## Legacy big-card disposition

| Option | Description | Selected |
|--------|-------------|----------|
| Untouched — they continue serving legacy detail pages; Phase 178 harvests sub-components into sheets; v20.0 cleanup phase deletes orphans | Smallest Phase 177 diff; preserves user functionality on /stove, /lights, etc. | ✓ |
| Delete now | Breaks legacy detail pages | |
| Rename to `[Device]CardLegacy.tsx` | Churn without payoff | |

**Auto-selected rationale:** Phase 177 is a dashboard rebuild, not a detail-page rebuild. Legacy cards still mount on /stove, /lights, /sonos, /raspi. Cleanup is deferred to a v20.0 cleanup phase after Phase 178 proves out which sub-components are still needed.

---

## Claude's Discretion

- One-file-per-primitive vs `primitives.tsx` barrel for the 7 micro-primitives.
- `<SheetPlaceholderBody>` accepts `phase` prop vs hardcoded.
- `data-testid` placement (root `<GlassCard>` div recommended for direct 1:1 measurement).
- `useWeatherSummary()` location (extract to `app/components/devices/weather/hooks/` recommended).
- Whether to delete per-device `Skeleton.StovePanel`/etc. exports (recommend leave; cleanup phase later).
- Camera snapshot poll cadence ownership (reuse `useCameraData()` recommended).
- Lucide icon picks for Climate (`<Thermometer>`).

---

## Deferred Ideas

- Sheet bodies SHEET-02..06 → Phase 178.
- Reduced-motion overrides for stagger / press → polish phase.
- Migration of legacy big cards into sheets + v20.0 cleanup phase.
- HLS preview in CameraCard → Phase 178 CameraSheet.
- Dashboard-level sheet orchestrator → wait for Phase 178 to prove need.
- 3-col / 4-col layout on lg+ viewports → product demand.
- Per-card connection indicator pills → global `NavbarConnectionStatus` covers it.
- Dirigera/Tuya consolidation into one PlugsCard → config-service redesign.
- Long-press / swipe gestures → out of scope.
- Web Vitals telemetry for dashboard mount → v9.0 perf follow-up.
