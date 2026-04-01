# Phase 153: Pages Audit — Extended Device Pages - Research

**Researched:** 2026-04-01
**Domain:** Responsive Tailwind CSS — mobile-first audit and fix for extended device pages at 375px
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Apply minimal, targeted fixes — add responsive Tailwind classes or `overflow-x-auto` wrappers. Do NOT restructure page layouts or rewrite components
- **D-02:** Follow Phase 151's mobile-first convention: base = mobile (375px+), `sm:` = desktop (640px+)
- **D-03:** For data-heavy components (tables, charts, queues), prefer `overflow-x-auto` scroll wrapper over column hiding
- **D-04:** Drill into sub-components, not just page-level layouts (Sonos has 14 sub-components, Raspi has 4)
- **D-05:** `RaspiSystemInfo.tsx:50` grid-cols-3 at base — KEEP as-is (verify visually)
- **D-06:** `RaspiSystemInfo.tsx:36`, `RaspiMemoryDisk.tsx:33`, `RaspiCpuTemp.tsx:25`, `RaspiNetworkIO.tsx:33` grid-cols-2 at base — likely fine, verify visually
- **D-07:** Sonos sub-components min-w-[28px] to min-w-[100px] — reasonable, verify they don't compound
- **D-08:** `SonosHistoryChart.tsx:175-176` max-w-[160px] and max-w-[120px] on table cells — may need overflow-x-auto on parent table
- **D-09:** `SonosQueueViewer.tsx:57` max-w-[120px] truncate — likely fine
- **D-10:** `DirigeraStats.tsx:11` grid-cols-2 — likely fine for stat cards
- **D-11:** Tuya page already responsive grid-cols-1 md:grid-cols-2 lg:grid-cols-3 — likely no changes, verify only
- **D-12:** Rooms /rooms page uses DataTable (already has overflow-x-auto) — verify column widths at 375px
- **D-13:** Rooms /rooms/status already uses grid-cols-1 sm:grid-cols-2 — likely mobile-safe, verify visually
- **D-14:** Rooms /rooms/[id] has no grid patterns — inspect for any fixed-width elements
- **D-15:** Use Playwright MCP at 375x812 viewport to verify each page after fixes
- **D-16:** Check `document.body.scrollWidth <= window.innerWidth` for each page
- **D-17:** Visual screenshot for each page
- **D-18:** Plan 01: Sonos + DIRIGERA + Raspi + Tuya (AUDIT-06, AUDIT-07, AUDIT-08, AUDIT-09)
- **D-19:** Plan 02: All Rooms pages (AUDIT-10)

### Claude's Discretion
- Exact responsive breakpoint choices per component
- Whether specific Sonos sub-components need overflow-x-auto or responsive restructuring
- Whether Raspi grid-cols-2/3 components need adjustment after visual inspection
- Order of page fixes within each plan

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUDIT-06 | Sonos page (/sonos) verified at 375px | SonosHistoryChart table needs overflow-x-auto; SonosSleepTimer presets row may overflow; SonosSpeakerVolume min-w-[100px] label investigated |
| AUDIT-07 | DIRIGERA page (/dirigera) verified at 375px | DirigeraHealthSection flex-wrap confirmed safe; DirigeraSensorRow flex justify-between with min-w-0 confirmed safe; DirigeraStats grid-cols-2 confirmed safe |
| AUDIT-08 | Raspi page (/raspi) verified at 375px | All 4 stat components use grid-cols-2 gap-3 — InfoBox is 90px min-height, fits two-column at 375px |
| AUDIT-09 | Tuya page (/tuya) verified at 375px | grid-cols-1 md:grid-cols-2 already mobile-safe — verify only |
| AUDIT-10 | Rooms pages (/rooms, /rooms/status, /rooms/[id]) verified at 375px | /rooms DataTable has overflow-x-auto; /rooms/status grid-cols-1 sm:grid-cols-2; /rooms/[id] DataTable confirmed; health stats row uses flex-wrap gap-6 — potential overflow |
</phase_requirements>

## Summary

Phase 153 is a mechanical audit-and-fix phase. All patterns are already established by Phases 151 and 152 — no new patterns need to be invented. The task is to read each target component, identify any layout constructs that break at 375px, and apply the same minimal-fix toolkit used in Phase 152.

**Sonos** is the most complex page (14 sub-components). Code inspection reveals one confirmed issue: `SonosHistoryChart` already wraps its `<table>` in `overflow-x-auto` (line 154) so that case is already handled. The larger risk is `SonosSleepTimer` — its preset buttons row (`flex items-center gap-1` with five "X min" buttons) may sum to more than 375px total width. `SonosSpeakerVolume` has `min-w-[100px]` on the speaker name label — this combined with the mute button (p-1.5), range slider (flex-1), and volume percentage (min-w-[32px]) needs visual verification. `SonosEqControls` and `SonosHomeTheater` use `w-14`/`w-24` fixed-width labels with `flex-1` sliders and `min-w-[28px]` value spans — these are bounded and should fit at 375px with the parent card's p-5 padding (leaving ~335px usable width).

**DIRIGERA** is straightforward: `DirigeraHealthSection` uses `flex flex-wrap gap-6` which handles narrow viewports natively. `DirigeraSensorRow` uses `flex items-center justify-between gap-4` with `min-w-0` on the left side and `flex-shrink-0` on the right — this pattern is mobile-safe by construction. `DirigeraStats` uses `grid-cols-2 gap-3` — at 375px with px-4 padding, each cell is ~163px, sufficient for the large number values shown.

**Raspi** uses 4 components all following the same pattern: `grid-cols-2 gap-3` for stat pairs and `grid-cols-3 gap-3` for load averages. `InfoBox` itself is min-h-[90px] with centered content — at ~163px column width, all content fits. The `grid-cols-3` load average row gives ~104px per cell, which is tight but sufficient for "0.00" numeric values with a short label.

**Tuya** is already fully responsive with `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` — no changes expected.

**Rooms** pages are largely already mobile-safe. The `/rooms` DataTable already has `overflow-x-auto`. The `/rooms/status` health stats row uses `flex items-center gap-6 text-sm` — six inline `<span>` items may overflow at 375px (needs `flex-wrap`). The `/rooms/[id]` DataTable also has `overflow-x-auto`. The `/rooms/status` room cards grid is `grid-cols-1 sm:grid-cols-2` which is already correct.

**Primary recommendation:** Apply `flex-wrap` to the `/rooms/status` health stats row; verify SonosSleepTimer preset row fits at 375px (may need `flex-wrap`); confirm all Raspi grid-cols-2/3 InfoBox layouts visually; confirm Tuya and most Sonos sub-components are safe by visual inspection.

## Standard Stack

### Core (all established in prior phases — no new deps)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 3.x (project) | Responsive utility classes | Project standard |
| Playwright MCP | installed | 375px UAT screenshots + overflow check | Phase 151/152 verified pattern |
| Next.js | 15.5 | App framework | Project standard |

**No new packages required.** This phase is CSS/class changes only.

## Architecture Patterns

### Phase 151/152 Established Responsive Toolkit

These patterns are the complete toolkit for this phase:

**Pattern 1: Flex-wrap on button/control rows**
```tsx
// Before — fixed row, overflows at 375px
<div className="flex items-center gap-2">...</div>

// After — wraps to second line
<div className="flex flex-wrap items-center gap-2">...</div>
```

**Pattern 2: Overflow-x-auto on data-heavy tables**
```tsx
// Before — table overflows at 375px
<table className="w-full text-sm">...</table>

// After — table scrolls horizontally
<div className="overflow-x-auto">
  <table className="w-full text-sm">...</table>
</div>
```
Note: `SonosHistoryChart` already has this wrapper at line 154 — this case is already handled.

**Pattern 3: Responsive grid columns**
```tsx
// Before — multi-column base
<div className="grid grid-cols-3 gap-3">

// After — stacks on mobile
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
```

**Pattern 4: Stats row gap reduction (from Phase 152)**
```tsx
// Stats that stay columnar on mobile — reduce gap only
<div className="grid grid-cols-2 gap-3">  // was gap-6 on desktop, keep gap-3 on mobile
```

### Width Math at 375px

With `px-4` PageLayout padding on both sides and scrollbar:
- **Usable width:** 375 - 32 = **343px** usable
- Card with `p-5`: 343 - 40 = **303px** inner
- Card with `p-4 sm:p-6`: 343 - 32 = **311px** inner

**grid-cols-2 gap-3** at 343px usable: each cell = (343 - 12) / 2 = **165px** per cell
**grid-cols-3 gap-3** at 343px usable: each cell = (343 - 24) / 3 = **106px** per cell
**grid-cols-2 inside card p-5** (303px): each cell = (303 - 12) / 2 = **145px** per cell

These dimensions confirm:
- `RaspiCpuTemp` grid-cols-2: 145px per InfoBox — SAFE (InfoBox is min-h-[90px] with centered content)
- `RaspiSystemInfo` grid-cols-3 load avg: 96px per InfoBox — tight but numbers like "0.00" fit
- `DirigeraStats` grid-cols-2: 165px per card — SAFE (large number display)
- `SonosSpeakerVolume` volume row: 303px - 100px (name) - 28px (mute btn) - 32px (%) - 12px (gaps) = **131px** for the range slider — SAFE

### SonosSleepTimer Preset Row Analysis

```tsx
// 5 presets, each "X min" in px-2 py-1 text-xs rounded-lg
// At text-xs (~12px) + px-2 (16px) = min ~40px per button
// "90 min" is wider: ~60px
// 5 buttons * ~50px avg + gap-1 * 4 = ~254px — fits within 303px inner width
```
Verdict: SonosSleepTimer preset row likely fits, but needs visual confirmation.

### Rooms /rooms Health Stats Row Analysis

```tsx
// flex items-center gap-6 text-sm — 6 spans side by side
// "Stanze: 3", "Dispositivi assegnati: 12", "Orfani: 2" from rooms/page.tsx
// "Totale: N", "Disponibili: N", "Non disponibili: N" from status/page.tsx
// gap-6 = 24px each — 6 items with text easily exceeds 343px
```
Verdict: `/rooms/status` health stats row needs `flex-wrap`. `/rooms/page.tsx` health stats also has `flex items-center gap-6` — same fix needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Horizontal scroll for wide content | Custom JS scroll | `overflow-x-auto` CSS | Native browser scrolling, works on all devices |
| Mobile column adjustment | Conditional rendering | Tailwind responsive classes | Zero JS, instant render |
| Overflow detection | Manual measurement | Playwright `scrollWidth <= innerWidth` check | Already established pattern from Phase 152 |

## Common Pitfalls

### Pitfall 1: Fixing Only the Page, Not Sub-components
**What goes wrong:** Page-level layout looks fine but a deeply nested component (e.g., `SonosSpeakerVolume` inside `SonosZoneSection`) overflows
**Why it happens:** Code inspection stops at the first level
**How to avoid:** Follow D-04 — drill into every sub-component listed in CONTEXT.md canonical refs before marking a page as verified
**Warning signs:** Playwright screenshot shows overflow only when zone is expanded

### Pitfall 2: Forgetting to Update Skeleton Grids
**What goes wrong:** Data grid is fixed but skeleton loading state still overflows
**Why it happens:** Skeleton has a hardcoded grid matching the old data grid
**How to avoid:** When changing a grid class, grep for nearby skeleton divs and update them to match (Phase 152 P02 established this pattern)
**Warning signs:** Loading state shows horizontal scroll, data state does not

### Pitfall 3: Gap-6 in Flex Stats Rows
**What goes wrong:** `flex items-center gap-6` with multiple items silently overflows
**Why it happens:** gap-6 = 24px between items; 6 items × (text + gap) easily exceeds 343px
**How to avoid:** Any `flex` row with 4+ items and `gap-4` or larger needs `flex-wrap` at 375px
**Warning signs:** Items near the right edge are clipped in Playwright screenshot

### Pitfall 4: Assuming overflow-x-auto Covers Everything
**What goes wrong:** `overflow-x-auto` is on the parent DataTable wrapper, but a SEPARATE stats row above it still overflows
**Why it happens:** overflow-x-auto only affects the immediate scrollable child, not sibling elements
**How to avoid:** Check all flex rows in the page body independently, not just tables
**Warning signs:** scrollWidth check fails even though DataTable looks fine

### Pitfall 5: min-w Constraints That Compound
**What goes wrong:** Multiple sibling elements each have `min-w-[X]` set, their sum exceeds available width
**Why it happens:** Each individual min-w seems small (28px, 32px, 100px) but added together with gaps they overflow a 303px container
**How to avoid:** Do the width math per the formula in Architecture Patterns section above; verify `SonosSpeakerVolume` row explicitly
**Warning signs:** Volume slider in speaker row is zero-width or disappeared

## Code Examples

### Playwright Overflow Verification (established Phase 152)
```javascript
// Source: Phase 151/152 UAT pattern — collectConsoleErrors helper
await page.setViewportSize({ width: 375, height: 812 });
await page.goto('/sonos');
const isOk = await page.evaluate(() =>
  document.body.scrollWidth <= window.innerWidth
);
```

### Fix: flex-wrap on stats row
```tsx
// Source: Phase 152 P01 pattern — stove errors and thermostat schedule header rows
// rooms/page.tsx health stats row
<div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-slate-400 mb-4">
  {/* spans */}
</div>
```

### Fix: flex-wrap on preset buttons
```tsx
// If SonosSleepTimer preset row is confirmed to overflow:
<div className="flex flex-wrap items-center gap-1">
  {PRESETS.map(preset => (...))}
</div>
```

## Page-by-Page Pre-Inspection Summary

### /sonos (AUDIT-06)

| Component | Line | Issue | Verdict | Action |
|-----------|------|-------|---------|--------|
| SonosHistoryChart | 154 | `<table>` | ALREADY WRAPPED in overflow-x-auto | None |
| SonosHistoryChart | 175-176 | max-w-[160px] / max-w-[120px] on td | FINE — truncate + max-w inside scroll | None |
| SonosSleepTimer | 47 | `flex items-center gap-1` (5 buttons) | LIKELY FINE (~254px) | Verify visually |
| SonosSpeakerVolume | 74-100 | volume row: name min-w-[100px] + controls | LIKELY FINE (131px for slider) | Verify visually |
| SonosEqControls | 75-89 | `w-14` label + flex-1 slider + min-w-[28px] | LIKELY FINE (bounded) | Verify visually |
| SonosHomeTheater | 98 | `flex flex-wrap gap-2` toggle buttons | ALREADY flex-wrap | None |
| SonosHomeTheater | 134-192 | `w-24` label + flex-1 slider + min-w-[28px] | LIKELY FINE (bounded) | Verify visually |
| SonosQueueViewer | 57 | max-w-[120px] truncate on artist | FINE — truncation intended | None |
| SonosZoneSection | 96 | `flex flex-col sm:flex-row` for play mode + sleep timer | ALREADY responsive | None |
| SonosTransportControls | 30 | `flex items-center gap-2` (4 icon buttons) | LIKELY FINE (4 × ~34px = ~136px) | Verify visually |
| SonosVolumeChart | 52 | ResponsiveContainer width="100%" | SAFE | None |
| SonosNowPlaying | 22-27 | `truncate` on title/artist | SAFE | None |
| SonosSourceSwitch | 28 | `inline-flex items-center gap-1` (2 buttons) | SAFE | None |
| SonosGroupControls | 41 | `inline-flex items-center gap-2` (select) | SAFE | None |

**Expected changes for /sonos:** 0–1 (SonosSleepTimer wrap if visual confirms overflow)

### /dirigera (AUDIT-07)

| Component | Line | Issue | Verdict | Action |
|-----------|------|-------|---------|--------|
| DirigeraHealthSection | 16 | `flex flex-wrap gap-6` | ALREADY flex-wrap | None |
| DirigeraSensorRow | 67 | `flex items-center justify-between gap-4` with min-w-0 left | SAFE (justify-between + min-w-0) | None |
| DirigeraStats | 11 | `grid-cols-2 gap-3` | SAFE (165px per cell) | None |
| dirigera/page.tsx filter | 81 | `flex rounded-lg border overflow-hidden` (3 flex-1 buttons) | SAFE (each ~114px) | None |

**Expected changes for /dirigera:** 0

### /raspi (AUDIT-08)

| Component | Line | Issue | Verdict | Action |
|-----------|------|-------|---------|--------|
| RaspiCpuTemp | 25 | `grid-cols-2 gap-3` | SAFE (145px per InfoBox) | None |
| RaspiMemoryDisk | 33 | `grid-cols-2 gap-3` | SAFE (145px per InfoBox) | None |
| RaspiSystemInfo | 36 | `grid-cols-2 gap-3` | SAFE (145px per InfoBox) | None |
| RaspiSystemInfo | 50 | `grid-cols-3 gap-3` | TIGHT (96px) but numeric values fit | Verify visually |
| RaspiNetworkIO | 33 | `grid-cols-2 gap-3` | SAFE (145px per InfoBox) | None |

**Expected changes for /raspi:** 0 (all InfoBox grids are compact stat displays that fit at small widths)

### /tuya (AUDIT-09)

| Component | Line | Issue | Verdict | Action |
|-----------|------|-------|---------|--------|
| tuya/page.tsx grid | 88 | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` | ALREADY mobile-first | None |
| tuya/page.tsx header | 67 | `flex items-center gap-3` (icon + heading) | SAFE | None |

**Expected changes for /tuya:** 0

### /rooms (AUDIT-10)

| Component | Line | Issue | Verdict | Action |
|-----------|------|-------|---------|--------|
| rooms/page.tsx health stats | 220-230 | `flex items-center gap-6` (3 spans) | POTENTIAL OVERFLOW | Add flex-wrap |
| rooms/page.tsx toolbar | 235 | `flex items-center justify-end gap-2` (2 buttons) | SAFE | None |
| rooms/page.tsx DataTable | 267 | DataTable (already overflow-x-auto) | SAFE | None |
| rooms/status/page.tsx health row | 149 | `flex flex-wrap items-center gap-4 sm:gap-6` | ALREADY flex-wrap | None |
| rooms/status/page.tsx toolbar | 182 | `flex items-center justify-end mb-4` (1 button) | SAFE | None |
| rooms/status/page.tsx room grid | 211 | `grid-cols-1 sm:grid-cols-2` | ALREADY responsive | None |
| rooms/status/page.tsx room header | 215 | `flex flex-wrap items-center gap-2` | ALREADY flex-wrap | None |
| rooms/[room_id]/page.tsx toolbar | 223 | `flex items-center justify-end mb-4` (1 button) | SAFE | None |
| rooms/[room_id]/page.tsx DataTable | 253 | DataTable (already overflow-x-auto) | SAFE | None |

**Expected changes for /rooms:** 1 — `rooms/page.tsx` health stats row needs `flex-wrap`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed grid columns at all widths | grid-cols-1 sm:grid-cols-N | Phase 151/152 | Mobile-first default |
| Tables without scroll wrapper | overflow-x-auto on parent | Phase 152 | Tables usable on mobile |
| Flex rows without wrapping | flex-wrap on multi-item rows | Phase 152 | Prevents overflow on button rows |

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — phase is CSS/class changes only; Playwright MCP already installed and verified in Phase 152)

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright MCP (UAT) + Jest (unit) |
| Config file | playwright.config.ts |
| Quick run command | Playwright MCP screenshots at 375x812 |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUDIT-06 | Sonos page no overflow at 375px | visual/e2e | Playwright MCP `document.body.scrollWidth <= window.innerWidth` on /sonos | ✅ via MCP |
| AUDIT-07 | DIRIGERA page no overflow at 375px | visual/e2e | Playwright MCP scrollWidth check on /dirigera | ✅ via MCP |
| AUDIT-08 | Raspi page no overflow at 375px | visual/e2e | Playwright MCP scrollWidth check on /raspi | ✅ via MCP |
| AUDIT-09 | Tuya page no overflow at 375px | visual/e2e | Playwright MCP scrollWidth check on /tuya | ✅ via MCP |
| AUDIT-10 | Rooms pages no overflow at 375px | visual/e2e | Playwright MCP scrollWidth check on /rooms, /rooms/status, /rooms/[id] | ✅ via MCP |

### Sampling Rate
- **Per task commit:** Playwright scrollWidth check on affected page(s)
- **Per wave merge:** All 7 pages (sonos + dirigera + raspi + tuya + rooms + rooms/status + rooms/[id]) at 375px
- **Phase gate:** All pages pass scrollWidth check + visual screenshot review

### Wave 0 Gaps
None — existing Playwright MCP infrastructure covers all phase requirements. No new test files needed.

## Open Questions

1. **SonosSleepTimer preset row overflow**
   - What we know: 5 buttons in `flex items-center gap-1`, each "X min" at text-xs, estimated ~254px total
   - What's unclear: Exact rendered width depends on font metrics; "90 min" is the widest label
   - Recommendation: Add `flex-wrap` to the preset row preemptively — it is harmless and prevents potential overflow; confirm via Playwright

2. **SonosSpeakerVolume min-w-[100px] compound risk**
   - What we know: Row is `flex items-center gap-3`: 100px name + 28px mute btn + flex-1 slider + 32px % + 3×gap-3 = ~169px fixed + slider
   - What's unclear: Whether the flex-1 slider collapses gracefully to 0 or causes overflow
   - Recommendation: Visual verification first; if slider collapses visibly, reduce min-w-[100px] to min-w-[80px] or add `flex-shrink` to name span

## Project Constraints (from CLAUDE.md)

| Directive | Impact on This Phase |
|-----------|---------------------|
| NEVER break existing functionality | Only add responsive classes — no logic changes |
| PREFER editing existing files over creating new | All fixes are in-place edits |
| NEVER execute npm run build or npm install | Playwright MCP for verification only |
| ALWAYS create/update unit tests | Layout changes do not require unit tests — Playwright visual verification is the right test type for CSS changes (confirmed by Phase 152 precedent) |
| USE design system → /debug/design-system | No new DS components introduced |
| NEVER commit/push without explicit request | Plans commit; push is user's action |

## Sources

### Primary (HIGH confidence)
- Direct code inspection of all 20+ target files listed in CONTEXT.md canonical refs
- Phase 152 SUMMARY files (P01, P02) — established patterns and decisions
- Phase 153 CONTEXT.md — locked decisions and known issues

### Secondary (MEDIUM confidence)
- Width math calculations based on Tailwind's gap-3 = 12px, px-4 = 16px (standard Tailwind values, well-documented)

### Tertiary (LOW confidence)
- SonosSleepTimer button width estimate (40–60px each) — based on text content at text-xs, not measured

## Metadata

**Confidence breakdown:**
- Page-level issues: HIGH — confirmed by direct code inspection
- Width math: HIGH — Tailwind class values are deterministic
- Sub-component safety: MEDIUM — calculated, not visually verified (Playwright will confirm)
- SonosSleepTimer row: MEDIUM — estimated, recommend preemptive flex-wrap

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable Tailwind/Next.js stack)
