# Phase 151: Design System Mobile-First - Research

**Researched:** 2026-04-01
**Domain:** Tailwind CSS responsive utilities, CVA variant patterns, 375px viewport layout
**Confidence:** HIGH

## Summary

Phase 151 is a targeted CSS/layout fix phase: add `flex-wrap` to `ButtonGroup`, verify the bottom nav 4-column grid at 375px, audit the ~10-12 layout-responsible DS components, and add a Mobile-First Patterns documentation section to `/debug/design-system/page.tsx`. No new features, no API changes.

The codebase already uses `sm:` breakpoints correctly in `Grid`, `Heading`, `PageLayout`, and `Button` sizes — so the `sm:` = desktop convention is partially established. This phase formalises it and closes the two concrete gaps: ButtonGroup wrapping and bottom nav label clipping risk.

The most interesting risk is the bottom nav's "Programmazione" label (14 chars, one word, no wrap point) at `text-[10px]` in a ~68px-wide column (83px total minus `px-2` inner padding). This label appears only in the thermostat-only configuration (3-column grid, 114px per column), so it is NOT a problem. The 4-column configuration uses "Orari", "Errori", "Log" labels — all short and safe. **D-11/D-12 risk is LOW.**

**Primary recommendation:** Two-plan split — Plan 01 fixes ButtonGroup and verifies/adjusts bottom nav; Plan 02 audits remaining DS layout components and adds the mobile-first documentation section.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Add `flex-wrap` to ButtonGroup's flex container (`Button.tsx:353`), keeping the existing `gap-2` spacing — buttons wrap to the next line naturally when they exceed container width at 375px
**D-02:** No equal-sizing or vertical stacking needed — flex-wrap with gap is sufficient for the ButtonGroup use cases in this codebase
**D-03:** Prioritize layout-affecting components for explicit 375px verification: ButtonGroup, Grid, DataTable, DashboardLayout, Card, Container, FormModal, BottomSheet, Navbar (bottom bar)
**D-04:** Inline components (Badge, Button, Checkbox, Divider, Heading, Text, etc.) are inherently responsive — verify they don't have hardcoded widths but no major changes expected
**D-05:** Total ~66 UI components; focus effort on the ~10-12 that have layout responsibility
**D-06:** Use smaller fixed sizes at base breakpoint, existing `sm:` sizes for desktop — consistent with the codebase's existing `sm:` convention (e.g., Button already uses `sm: 'px-4 py-2.5 min-h-[44px] text-sm'`)
**D-07:** No fluid typography (clamp/vw units) — the app targets 375px+ mobile and desktop, not a continuous range; fixed sizes are simpler and predictable
**D-08:** Add a dedicated "Mobile-First Patterns" section to `/debug/design-system/page.tsx` documenting the convention: base = mobile (375px+), `sm:` = desktop breakpoint
**D-09:** Include before/after code examples showing the pattern (e.g., `text-sm sm:text-base`, `p-3 sm:p-4`)
**D-10:** Document spacing tokens as mobile-first: base padding/margin values target mobile, `sm:` variants for desktop
**D-11:** The bottom nav at `Navbar.tsx:678` dynamically uses `grid-cols-3` or `grid-cols-4` based on quick actions count — verify both configurations fit at 375px without clipping or overlap
**D-12:** If 4-column grid clips at 375px, switch to icon-only labels or reduce padding — keep all 4 actions visible

### Claude's Discretion
- Exact ordering of component audit (which components first)
- Whether to add responsive variants to CVA definitions or handle via className overrides
- Whether DataTable needs a horizontal scroll wrapper or column hiding at 375px
- Test file updates for any changed component APIs

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MOBILE-01 | ButtonGroup component wraps responsively on 375px (flex-wrap) | Add `flex-wrap` to `ButtonGroup` at `Button.tsx:353` — one-line change |
| MOBILE-02 | All DS components verified at 375px viewport width | Audit the 10-12 layout-responsible components; DataTable already has `overflow-x-auto` |
| MOBILE-03 | DS typography scales appropriately for mobile (no horizontal overflow) | Heading already has `xl`/`2xl`/`3xl` responsive sizes; Text uses fixed sizes |
| MOBILE-04 | DS spacing tokens documented as mobile-first (base = mobile, sm: = desktop) | Document existing `sm:` pattern; `PageLayout` already uses `px-4 sm:px-6 lg:px-8` |
| MOBILE-05 | Design system showcase page updated with mobile-first patterns section | New `SectionShowcase` section appended before footer in `page.tsx` |
| MOBILE-06 | Bottom nav bar safe at 375px (4-column grid verified or adjusted) | 4-col at 375px = ~84px/column; short labels ("Orari", "Errori", "Log") fit; analysis below |
</phase_requirements>

## Standard Stack

### Core (no new dependencies — CSS-only phase)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS v4 | current (globals.css uses `@import "tailwindcss"`) | Responsive utilities (`flex-wrap`, `sm:` breakpoints) | Already in project |
| CVA (class-variance-authority) | current | Type-safe component variants | Already in project |
| `cn` utility | `lib/utils/cn` | Conditional class merging | Already in project |

**No new installations required.** This phase is purely class additions and documentation.

### Tailwind Breakpoints in This Project
| Breakpoint | Value | Convention |
|------------|-------|------------|
| base | 0px+ | Mobile (375px target) |
| `sm:` | 640px+ | Desktop |
| `md:` | 768px+ | Large desktop |
| `lg:` | 1024px+ | XL desktop |
| `tb:` (custom) | 900px | Tablet — **deferred to future milestone** |

**Confirmed from `globals.css`:** `--breakpoint-tb: 900px` is defined but tablet design is explicitly out of scope.

## Architecture Patterns

### Pattern 1: flex-wrap Addition (MOBILE-01)
**What:** Single class addition to `ButtonGroup` flex container.
**Current state:**
```typescript
// Button.tsx:352-353 — current
<div
  className={cn('flex items-center gap-2', className)}
```
**Required change:**
```typescript
// Button.tsx:352-353 — after fix
<div
  className={cn('flex flex-wrap items-center gap-2', className)}
```
**Why this works:** `flex-wrap` lets children flow to the next line when the container is too narrow. `gap-2` (8px) applies consistently in both directions (row and column gap). No other ButtonGroup properties need to change.

### Pattern 2: Bottom Nav Verification (MOBILE-06)
**Current layout math at 375px:**
- Container: `p-2` (8px each side) → 375 - 16 = 359px
- 4-column grid: `gap-2` (8px) × 3 = 24px → 335px / 4 = **83.75px per column**
- Inner padding: `px-2` (8px each side) → 67.75px usable per column
- 4-col labels: "Home" (4 chars), "Orari" (5), "Errori" (6), "Log" (3) at `text-[10px]` ≈ 5.5px/char max = 33px → all fit comfortably
- 3-col label: "Programmazione" (14 chars) at 3-column layout → (335+24-8)/3 = 117px per column → fits fine

**Conclusion:** No change needed to bottom nav. D-12 fallback (icon-only) is NOT triggered. Verification task confirms safe, closes MOBILE-06.

### Pattern 3: Component Audit Approach (MOBILE-02, MOBILE-03)
**Layout-responsible components to verify (in priority order):**

| Component | File | 375px Risk | Action Expected |
|-----------|------|------------|-----------------|
| ButtonGroup | `ui/Button.tsx:350` | CONFIRMED — no wrap | Add `flex-wrap` (MOBILE-01) |
| DataTable | `ui/DataTable.tsx` | LOW — already `overflow-x-auto` | Confirm scroll wrapper present |
| Grid | `ui/Grid.tsx` | LOW — `grid-cols-1` at base already | Confirm default is 1-col |
| PageLayout | `ui/PageLayout.tsx` | LOW — `px-4 sm:px-6` already | Confirm base padding is mobile-safe |
| Navbar bottom | `Navbar.tsx:678` | LOW — math confirms safe | Verify at 375px, no change |
| FormModal | `ui/FormModal.tsx` | MEDIUM — modal widths | Verify full-width on mobile |
| BottomSheet | `ui/BottomSheet.tsx` | LOW — mobile-native | Verify scroll lock works |
| Card | `ui/Card.tsx` | LOW — no fixed widths expected | Spot check |
| SmartHomeCard | `ui/SmartHomeCard.tsx` | LOW | Spot check |
| StatusCard | `ui/StatusCard.tsx` | LOW | Spot check |
| CommandPalette | `ui/CommandPalette.tsx` | MEDIUM — overlay with fixed widths | Verify mobile layout |
| Sheet | `ui/Sheet.tsx` | LOW — slides in from edge | Spot check |

**Inline components (verify no hardcoded widths, expect no changes):**
Badge, Button, Checkbox, Divider, Heading, Text, Input, Select, Toggle, Toast, Spinner, Skeleton, Kbd, Tooltip, ConnectionStatus, HealthIndicator, ProgressBar, EmptyState, ConfirmDialog, ConfirmationDialog, Accordion, Banner, StatusBadge, ControlButton, Section.

### Pattern 4: Heading Already Responsive (MOBILE-03)
Heading sizes xl/2xl/3xl already have `sm:` breakpoints:
```typescript
// Heading.tsx — existing CVA variants
xl: 'text-xl sm:text-2xl',
'2xl': 'text-2xl sm:text-3xl',
'3xl': 'text-3xl sm:text-4xl',
```
`text-xl` = 20px, `text-2xl` = 24px, `text-3xl` = 30px — all reasonable for 375px viewport. No horizontal overflow from typography expected. MOBILE-03 is primarily a verification task.

### Pattern 5: Mobile-First Documentation Section (MOBILE-04, MOBILE-05)
**Insertion point:** Before the footer card at line ~2607 in `page.tsx`, after the "Critical Best Practices" section.

**Section structure:**
```tsx
<SectionShowcase title="Mobile-First Patterns" icon="📱">
  <Card variant="elevated">
    <CardContent>
      {/* Convention explanation */}
      {/* Code examples: before/after */}
      {/* Spacing tokens table */}
      {/* Breakpoint reference */}
    </CardContent>
  </Card>
</SectionShowcase>
```

The `SectionShowcase` wrapper auto-generates the anchor ID `mobile-first-patterns` and adds it to the page TOC if the TOC also gets an entry.

**TOC entry to add** (in the `grid` at line ~168):
```tsx
{ icon: '📱', title: 'Mobile-First', anchor: 'mobile-first-patterns' },
```

### Anti-Patterns to Avoid
- **Adding `overflow-hidden` to ButtonGroup:** Would hide wrapped buttons. Use `flex-wrap` only.
- **Fluid typography (clamp/vw):** User explicitly rejected this (D-07). Use fixed sizes with `sm:` for desktop.
- **Adding new CVA variants instead of className overrides:** For one-off layout adjustments at 375px, a `className` override is simpler than a new CVA variant.
- **Modifying the `sm:` breakpoint value:** The project uses Tailwind default `sm:` = 640px. Do not change.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Table horizontal scroll at mobile | Custom JS scroll detection | `overflow-x-auto` (already present in DataTable) | Native CSS, zero JS |
| Responsive column count | JS resize observer | Tailwind `grid-cols-1 sm:grid-cols-N` | Compile-time, zero runtime |
| Text truncation at narrow widths | Custom JS | CSS `truncate` or natural text wrapping | No JS needed |

## Common Pitfalls

### Pitfall 1: ButtonGroup `flex-wrap` Changes Alignment
**What goes wrong:** Adding `flex-wrap` to a `flex items-center` container means wrapped rows each become independent alignment contexts. If buttons have different heights, they may appear misaligned within a row.
**Why it happens:** `items-center` applies per-row in flex-wrap, not across all rows.
**How to avoid:** Use `items-start` or `items-center` as appropriate. For ButtonGroup, `items-center` is correct because all buttons in a group are uniform-height siblings.
**Warning signs:** Visual misalignment when 3+ buttons wrap.

### Pitfall 2: `overflow-x-auto` Parent Clipping Flex-Wrap
**What goes wrong:** If a ButtonGroup is inside an `overflow-x-auto` container (e.g., a Card with horizontal scroll), adding `flex-wrap` to ButtonGroup will cause wrapped rows to be clipped rather than scrolled.
**Why it happens:** The parent `overflow-x-auto` intercepts vertical overflow from wrapped content.
**How to avoid:** Verify ButtonGroup usage contexts. In this codebase ButtonGroup appears in CardFooter, form toolbars, and inline sections — none of which use `overflow-x-auto` as their direct parent.

### Pitfall 3: Bottom Nav Label Wrapping
**What goes wrong:** Long labels in bottom nav items may wrap to 2 lines, changing the `min-h-[56px]` assumption.
**Why it happens:** Labels wrap at column width boundary.
**How to avoid:** The current 4-column labels ("Home", "Orari", "Errori", "Log") are short. The 3-column "Programmazione" has 117px — enough room. No wrapping issue expected.

### Pitfall 4: DataTable Columns Verification
**What goes wrong:** DataTable with many columns still renders wide on mobile despite `overflow-x-auto`.
**Why it happens:** The scroll container is present but the scroll indicator (gradient fade) may give false confidence.
**How to avoid:** MOBILE-02 verification includes confirming DataTable scrolls horizontally and does NOT show horizontal overflow on the viewport. The scroll is contained inside the table wrapper.

### Pitfall 5: TOC Anchor Mismatch
**What goes wrong:** Adding a new section to `page.tsx` without adding its anchor to the TOC grid leaves the section undiscoverable.
**Why it happens:** The TOC is a hardcoded array — not auto-generated.
**How to avoid:** Always update both the TOC array (line ~169) and the section JSX together.

## Code Examples

### ButtonGroup Fix (MOBILE-01)
```typescript
// Source: Button.tsx:352 — change
// BEFORE:
className={cn('flex items-center gap-2', className)}

// AFTER:
className={cn('flex flex-wrap items-center gap-2', className)}
```

### Existing Mobile-First Responsive Pattern in Codebase
```typescript
// Source: Grid.tsx — existing responsive pattern to document
cols: {
  2: 'grid-cols-1 sm:grid-cols-2',        // 1 col mobile, 2 desktop
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',  // stacked mobile
},
gap: {
  md: 'gap-4 sm:gap-5 lg:gap-6',         // tighter on mobile
},
```

### Existing Mobile-First Typography Pattern in Codebase
```typescript
// Source: Heading.tsx — existing sm: pattern
xl: 'text-xl sm:text-2xl',     // 20px mobile → 24px desktop
'2xl': 'text-2xl sm:text-3xl', // 24px mobile → 30px desktop
'3xl': 'text-3xl sm:text-4xl', // 30px mobile → 36px desktop
```

### PageLayout Mobile-First Padding (already correct)
```typescript
// Source: PageLayout.tsx — existing pattern
lg: 'px-4 sm:px-6 lg:px-8',  // 16px mobile, 24px sm, 32px lg
```

### Mobile-First Patterns Documentation (for page.tsx section)
```tsx
// Code example for documentation section
// WRONG (desktop-first):
<div className="text-xl md:text-base">Title</div>

// RIGHT (mobile-first):
<div className="text-base sm:text-xl">Title</div>

// WRONG (desktop-first spacing):
<div className="p-8 sm:p-4">Card</div>

// RIGHT (mobile-first spacing):
<div className="p-4 sm:p-8">Card</div>
```

## State of the Art

| Area | Current State | Notes |
|------|---------------|-------|
| Grid component | Fully mobile-first (`grid-cols-1` base) | No changes needed |
| Heading | xl/2xl/3xl have `sm:` responsive sizes | Complete |
| PageLayout padding | `px-4 sm:px-6 lg:px-8` | Complete |
| ButtonGroup | Missing `flex-wrap` | Fix in Plan 01 |
| Bottom nav (4-col) | Uses `grid-cols-4 gap-2 p-2` | Math confirms safe at 375px |
| DataTable | `overflow-x-auto` wrapper present | Verify in Plan 01 |
| FormModal | Unknown — research pending | Verify in Plan 01 |

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified — CSS-only phase, no CLI tools required)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library |
| Config file | `jest.config.ts` |
| Quick run command | `npm test -- --testPathPattern Button` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MOBILE-01 | ButtonGroup renders with `flex-wrap` class | unit | `npm test -- --testPathPattern Button.test` | Yes (`Button.test.tsx`) |
| MOBILE-02 | DS layout components verified at 375px | visual/manual | Visual audit at 375px viewport | N/A — manual |
| MOBILE-03 | No horizontal overflow from typography | visual/manual | Visual audit | N/A — manual |
| MOBILE-04 | DS spacing documented as mobile-first | structural | Verify section exists in page.tsx | N/A — doc |
| MOBILE-05 | /debug/design-system has mobile-first section | structural | Verify TOC entry + section | N/A — doc |
| MOBILE-06 | Bottom nav 4-col safe at 375px | visual/manual | Visual audit + math verification | N/A — manual |

**Notes:**
- MOBILE-01 is the only requirement amenable to automated Jest testing (class presence assertion on rendered ButtonGroup).
- MOBILE-02, MOBILE-03, MOBILE-06 require visual verification at 375px (browser DevTools or Playwright viewport resize).
- The existing ButtonGroup test (`Button.test.tsx:570`) only checks `ButtonGroup` is exported. A new test asserting the container has `flex-wrap` class is the correct addition.

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern Button.test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `app/components/ui/__tests__/Button.test.tsx` — add test: `ButtonGroup container has flex-wrap class` (covers MOBILE-01)

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `app/components/ui/Button.tsx` (lines 340-376) — ButtonGroup current state confirmed
- Direct code inspection: `app/components/Navbar.tsx` (lines 676-710) — bottom nav grid math verified
- Direct code inspection: `app/components/ui/Grid.tsx` — Grid already mobile-first
- Direct code inspection: `app/components/ui/Heading.tsx` — responsive sizes confirmed
- Direct code inspection: `app/components/ui/DataTable.tsx` (line 496) — `overflow-x-auto` confirmed
- Direct code inspection: `app/components/ui/PageLayout.tsx` — mobile-safe padding confirmed
- Direct code inspection: `app/globals.css` (line 299) — `--breakpoint-tb: 900px` custom breakpoint
- Direct code inspection: `app/debug/design-system/page.tsx` — TOC structure and existing sections

### Secondary (MEDIUM confidence)
- Tailwind CSS v4 `flex-wrap` behavior: standard CSS flex, unchanged from v3
- Standard 375px = iPhone SE / iPhone 12 mini viewport width — industry standard mobile test target

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, existing project patterns only
- Architecture: HIGH — all changes verified against live code
- Pitfalls: HIGH — based on direct code inspection, math verification
- Bottom nav risk: LOW — math confirms 4-column labels fit at 375px

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable CSS domain, no expiry risk)
