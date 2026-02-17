# Requirements: Pannello Stufa

**Defined:** 2026-02-17
**Core Value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).

## v8.1 Requirements

Requirements for Masonry Dashboard milestone. Each maps to roadmap phases.

### Layout

- [ ] **LAYOUT-01**: User sees dashboard cards in masonry layout on desktop (2 columns, no vertical gaps between cards of different heights)
- [ ] **LAYOUT-02**: Card order matches user settings (card 0 = top-left, card 1 = top-right, card 2 = below card 0, etc.)
- [ ] **LAYOUT-03**: Mobile layout unchanged (single column, linear order)

### Animation

- [ ] **ANIM-01**: Cards animate with existing spring-in stagger on page load
- [ ] **ANIM-02**: Cards transition smoothly when height changes (polling updates, expand/collapse)

### Edge Cases

- [ ] **EDGE-01**: Layout works correctly with 1 visible card (full-width or left-aligned)
- [ ] **EDGE-02**: Layout works correctly with odd number of visible cards
- [ ] **EDGE-03**: Error boundary fallback has minimum height to prevent column collapse

## Future Requirements

None — v8.1 is a focused layout milestone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Drag & drop card reorder from home page | Separate milestone — settings reorder is sufficient |
| 3+ column layouts | 2 columns sufficient for current card count (6 devices) |
| CSS Grid masonry spec (`grid-template-rows: masonry`) | No stable browser support as of Feb 2026 |
| JS masonry libraries (react-masonry-css, masonic) | Abandoned/SSR-incompatible, overkill for 6 cards |
| CSS `column-count` masonry | Fills column-first, breaks user-configured card order |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LAYOUT-01 | Phase 68 | Pending |
| LAYOUT-02 | Phase 68 | Pending |
| LAYOUT-03 | Phase 68 | Pending |
| ANIM-01 | Phase 68 | Pending |
| ANIM-02 | Phase 68 | Pending |
| EDGE-01 | Phase 69 | Pending |
| EDGE-02 | Phase 69 | Pending |
| EDGE-03 | Phase 69 | Pending |

**Coverage:**
- v8.1 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0

---
*Requirements defined: 2026-02-17*
*Last updated: 2026-02-17 — traceability updated after roadmap creation (phases 68-69)*
