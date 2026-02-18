# Roadmap: Pannello Stufa

## Milestones

- ✅ **v1.0 Push Notifications** — Phases 1-5 (shipped 2026-01-26)
- ✅ **v2.0 Netatmo Complete Control** — Phases 6-10 (shipped 2026-01-28)
- ✅ **v3.0 Design System Evolution** — Phases 11-18 (shipped 2026-01-30)
- ✅ **v3.1 Design System Compliance** — Phases 19-24 (shipped 2026-02-02)
- ✅ **v3.2 Dashboard & Weather** — Phases 25-29 (shipped 2026-02-03)
- ✅ **v4.0 Advanced UI Components** — Phases 30-36 (shipped 2026-02-05)
- ✅ **v5.0 TypeScript Migration** — Phases 37-43 (shipped 2026-02-08)
- ✅ **v5.1 Tech Debt & Code Quality** — Phases 44-48 (shipped 2026-02-10)
- ✅ **v6.0 Operations, PWA & Analytics** — Phases 49-54 (shipped 2026-02-11)
- ✅ **v7.0 Performance & Resilience** — Phases 55-60 (shipped 2026-02-13)
- ✅ **v8.0 Fritz!Box Network Monitor** — Phases 61-67 (shipped 2026-02-16)
- 🚧 **v8.1 Masonry Dashboard** — Phases 68-69 (in progress)

## Phases

<details>
<summary>✅ v8.0 Fritz!Box Network Monitor (Phases 61-67) — SHIPPED 2026-02-16</summary>

- [x] Phase 61: Foundation & Infrastructure (2/2 plans)
- [x] Phase 62: Dashboard Card (2/2 plans)
- [x] Phase 63: WAN Status & Device List (3/3 plans)
- [x] Phase 64: Bandwidth Visualization (2/2 plans)
- [x] Phase 65: Device History Timeline (3/3 plans)
- [x] Phase 66: Device Categorization (4/4 plans)
- [x] Phase 67: Bandwidth Correlation (2/2 plans)

</details>

<details>
<summary>✅ v7.0 Performance & Resilience (Phases 55-60) — SHIPPED 2026-02-13</summary>

- [x] Phase 55: Retry Infrastructure (5/5 plans)
- [x] Phase 56: Error Boundaries (2/2 plans)
- [x] Phase 57: Adaptive Polling (3/3 plans)
- [x] Phase 58: StoveCard Refactoring (3/3 plans)
- [x] Phase 59: LightsCard & Page Refactoring (4/4 plans)
- [x] Phase 60: Critical Path Testing & Token Cleanup (5/5 plans)

</details>

<details>
<summary>✅ Earlier milestones (v1.0-v6.0)</summary>

See `.planning/milestones/` for full archives.

</details>

---

### 🚧 v8.1 Masonry Dashboard (In Progress)

**Milestone Goal:** Replace the uniform two-column grid on the dashboard home with a masonry layout that eliminates vertical gaps between cards of different heights, while preserving Firebase-configured card order and leaving mobile untouched.

**Approach:** Two-column flexbox split by index parity — even-indexed cards into a left `flex flex-col` column, odd-indexed cards into a right `flex flex-col` column. Pure server component change, zero new dependencies, SSR-safe, PWA-cache-safe.

- [x] **Phase 68: Core Masonry Layout** - Replace `<Grid cols={2}>` with two-column flexbox split in `app/page.tsx` (completed 2026-02-18)
- [x] **Phase 69: Edge Cases, Error Boundary & Tests** - Min-height on error fallback, edge case handling, unit tests for column assignment (completed 2026-02-18)

## Phase Details

### Phase 68: Core Masonry Layout
**Goal**: Users see dashboard cards fill vertical space with no gaps — shorter cards no longer leave blank space below them on desktop
**Depends on**: Nothing (first phase of v8.1)
**Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03, ANIM-01, ANIM-02
**Success Criteria** (what must be TRUE):
  1. On desktop, two cards side-by-side have no vertical gap below the shorter card — the column below it continues immediately with the next card
  2. Card order matches Firebase settings — the first configured card appears top-left, second top-right, third below the first, and so on
  3. On mobile (< sm breakpoint), cards stack in a single column in the same order as configured — no layout change visible
  4. Existing spring-in entrance animation plays per card with staggered delay matching the card's flat index in the user's configured order
  5. When a card's content height changes (polling update, expand/collapse), the card wrapper transitions height smoothly rather than snapping
**Plans**: 1 plan

Plans:
- [ ] 68-01-PLAN.md — Replace Grid with masonry flexbox layout (mobile flat + desktop parity columns) and ANIM-02 CSS transition

### Phase 69: Edge Cases, Error Boundary & Tests
**Goal**: Layout handles all real-world card count variations correctly and never collapses a column — verified by unit tests
**Depends on**: Phase 68
**Requirements**: EDGE-01, EDGE-02, EDGE-03
**Success Criteria** (what must be TRUE):
  1. With only 1 visible card, the card occupies the left column (or full width) without the right column creating a visual half-width gap
  2. With an odd number of visible cards (3, 5), the left column has one more card than the right — the right column ends without any blank space artifacts
  3. When a card's error boundary fallback renders, the fallback has sufficient minimum height so the column does not visually collapse to near-zero
  4. Unit tests cover column assignment for 0, 1, 2, 3, 5, and 6 visible card counts — all assertions green
**Plans**: 2 plans

Plans:
- [x] 69-01-PLAN.md — Extract splitIntoColumns utility, fix EDGE-01 single-card layout, add EDGE-03 ErrorFallback min-height (completed 2026-02-18)
- [x] 69-02-PLAN.md — TDD: Unit tests for column assignment covering 0, 1, 2, 3, 5, 6 card counts (completed 2026-02-18)

---

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1-5 | v1.0 | 29/29 | ✓ Complete | 2026-01-26 |
| 6-10 | v2.0 | 21/21 | ✓ Complete | 2026-01-28 |
| 11-18 | v3.0 | 52/52 | ✓ Complete | 2026-01-30 |
| 19-24 | v3.1 | 13/13 | ✓ Complete | 2026-02-02 |
| 25-29 | v3.2 | 13/13 | ✓ Complete | 2026-02-03 |
| 30-36 | v4.0 | 24/24 | ✓ Complete | 2026-02-05 |
| 37-43 | v5.0 | 56/56 | ✓ Complete | 2026-02-08 |
| 44-48 | v5.1 | 39/39 | ✓ Complete | 2026-02-10 |
| 49-54 | v6.0 | 29/29 | ✓ Complete | 2026-02-11 |
| 55-60 | v7.0 | 22/22 | ✓ Complete | 2026-02-13 |
| 61-67 | v8.0 | 18/18 | ✓ Complete | 2026-02-16 |
| 68. Core Masonry Layout | v8.1 | Complete    | 2026-02-18 | - |
| 69. Edge Cases & Tests | v8.1 | Complete    | 2026-02-18 | - |

**Total:** 11 milestones shipped, 67 phases complete, 319 plans executed + v8.1 in progress

---

*Roadmap updated: 2026-02-17 — v8.1 Masonry Dashboard phases 68-69 added*
