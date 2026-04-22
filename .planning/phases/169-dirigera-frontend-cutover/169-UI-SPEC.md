---
phase: 169
slug: dirigera-frontend-cutover
status: approved
shadcn_initialized: false
preset: ember-noir
created: 2026-04-22
approved: 2026-04-22
---

# Phase 169 — UI Design Contract

> Visual and interaction contract for the three new DIRIGERA panels (Stats, Recent Events, Telemetry) appended to `/dirigera` per CONTEXT.md D-07..D-10. Existing hook URL swaps (D-04..D-06) and backend wrapper creation (D-01..D-03) have NO UI surface and are out of this contract's scope.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (project-native Ember Noir tokens in `app/globals.css`) |
| Preset | ember-noir (dark-first, warm accents) |
| Component library | project-native primitives under `/debug/design-system` (Card, Heading, Table, Badge, Button, Spinner) — Radix under the hood where relevant |
| Icon library | `lucide-react` (already used by `DirigeraSensorRow`, `DirigeraHealthSection`) |
| Font | `next/font` Inter (body) + existing display font via `app/fonts.ts` — no new fonts |

Reuses existing DIRIGERA components as structural analogs:
- `app/components/devices/dirigera/components/DirigeraHealthSection.tsx` — pattern for the Stats panel (labelled key-value card)
- `app/components/devices/dirigera/components/DirigeraSensorList.tsx` — pattern for the Recent Events + Telemetry tables (section header + scrollable table + empty state)
- `app/components/devices/dirigera/components/DirigeraSensorRow.tsx` — row-layout pattern (icon + label + meta right-aligned)

---

## Spacing Scale

Multiples of 4 (Tailwind default scale, matches existing DIRIGERA components):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px (`gap-1`, `p-1`) | Icon-to-text gaps, inline chip padding |
| sm | 8px (`gap-2`, `p-2`) | Compact cell padding, badge gutters |
| md | 16px (`gap-4`, `p-4`) | Default card padding, row gaps in lists |
| lg | 24px (`gap-6`, `p-6`) | Section inner padding, heading-to-content gap |
| xl | 32px (`mt-8`) | Gap between the three new panels on `/dirigera` |
| 2xl | 48px (`mt-12`) | Gap between existing `DirigeraSensorList` and the first new panel (Stats) |
| 3xl | 64px | Not used in this phase |

Exceptions: none.

---

## Typography

Matches existing DIRIGERA components (no new type ramp).

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px (`text-sm`) | 400 | 1.5 |
| Label (metadata, timestamps) | 12px (`text-xs`) | 400 | 1.4 |
| Table header | 12px (`text-xs`) | 600 | 1.4 — uppercase, `tracking-wide`, `text-slate-400` |
| Panel heading (Stats / Recent Events / Telemetry) | 18px (`text-lg`) | 600 | 1.4 — matches `DirigeraHealthSection` heading |
| Stat value (count, big number in stats tile) | 24px (`text-2xl`) | 700 | 1.2 |

No new display/hero typography — this is a device-detail screen, not a marketing surface.

---

## Color

Uses tokens from `app/globals.css` (Ember Noir). Dark-first; light-mode variants inherited via existing `@variant dark` rules in the design system.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `slate-950` / `slate-900` | Page background, panel background |
| Secondary (30%) | `slate-800` / `slate-850` | Card surfaces, table row backgrounds, borders (`slate-700`) |
| Accent (10%) | `ember-500` (`#ed6f10`) | "Load more" button, focused stat-value numbers, active row highlight |
| Destructive | `flame-600` (`#ef3906`) | Error state banner in panels when fetch fails |
| Success / Okay | `sage-300` / `sage-500` | Stat deltas showing "healthy" (not used unless a stat explicitly surfaces a positive/negative signal) |
| Warning | `ember-400` | `low_battery` / near-retention-limit indicators in the Stats panel |

Accent reserved for:
- "Load more" button label + hover ring
- The single "most active sensor" name in the Stats panel (only one accent-colored identifier per panel, max)
- Focus ring on keyboard-navigated table rows

Accent NOT used for: table row hover backgrounds (use `slate-800` instead), column headers, metadata labels, empty-state copy.

---

## Copywriting Contract

All copy in Italian, matching existing DIRIGERA page tone ("DIRIGERA non raggiungibile" etc.).

| Element | Copy |
|---------|------|
| Stats panel heading | "Statistiche" |
| Stats panel section labels | Two subsections: "Aggregazione" + "Retention" |
| Aggregazione tile labels | "Righe aggregate totali" (`aggregation.total_rows_aggregated`) / "Ultimo run" (relative time from `aggregation.last_run_at`) / "Righe ultimo run" (`aggregation.rows_aggregated_last_run`) / "Stato ultimo run" (`aggregation.last_run_status` ?? "n/d") |
| Retention tile labels | "Righe eliminate totali" (`retention.total_rows_deleted`) / "Ultimo run" (relative time from `retention.last_run_at`) / "Righe eliminate ultimo run" (`retention.rows_deleted_last_run`) / "Stato ultimo run" (`retention.last_run_status` ?? "n/d") |
| Stats empty state | "Statistiche non disponibili" |
| Stats error state | "Impossibile caricare le statistiche" |
| Recent Events heading | "Eventi recenti" |
| Recent Events empty state | "Nessun evento" |
| Recent Events error state | "Impossibile caricare lo storico" |
| Recent Events "Load more" button | "Carica altri 50" |
| Recent Events "Load more" while loading | "Caricamento..." (spinner + text, button disabled) |
| Recent Events "Load more" exhausted | Button hidden when `offset + items.length >= total` |
| Telemetry heading | "Telemetria" |
| Telemetry empty state | "Nessuna telemetria" |
| Telemetry error state | "Impossibile caricare la telemetria" |
| Telemetry "Load more" button | "Carica altri 50" (same as Recent Events) |
| Timestamp format | Italian locale via `Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'medium' })` — matches existing DIRIGERA convention |

No destructive actions in this phase — no confirmation dialog copy needed.

No primary CTA — "Load more" is a secondary-style button (neutral border + ember accent on hover/focus).

---

## Interaction Contract

### Panel states

Each of the three panels (Stats, Recent Events, Telemetry) goes through the same state machine:

1. **Initial load (`loading=true, data=null`)** — full-panel spinner centered, same pattern as `DirigeraHealthSection` skeleton. Panel heading still shown.
2. **Stale re-fetch (`loading=true, data!=null`)** — existing data stays visible; a subtle ember-tinted "Aggiornamento…" badge appears in the panel header. No layout shift.
3. **Ready (`loading=false, data!=null, stale=false, error=null`)** — content rendered, no badges.
4. **Stale / error (`stale=true`)** — stale badge in header ("Dati non aggiornati"), last-known data retained; if `error` is set AND no cached data, replace content with the error-state copy above.
5. **Empty (`data.events.length === 0` or equivalent)** — empty-state copy centered, no table.

### Pagination — "Load more"

- Hooks expose `items`, `total`, `loadMore()`, `isLoadingMore`.
- Button shows at the bottom of the table, full-width on mobile (`w-full sm:w-auto`) and centered on desktop.
- Disabled while `isLoadingMore === true`.
- Hidden when `items.length >= total`.
- Internally: each click increments `offset` by 50 and fetches. New rows append to the existing array — no scroll reset.

### Keyboard + focus

- Load-more button: standard focus ring (existing design-system pattern, `focus-visible:ring-2 focus-visible:ring-ember-500`).
- Table rows: not interactive in this phase (no per-row click). Rows remain semantically `<tr>`, not `<button>`.

### Responsive

- `/dirigera` page stacks all sections vertically on mobile (single column, `flex flex-col gap-8`).
- Stats panel: rendered as two labelled subsections ("Aggregazione" + "Retention"), each a 2×2 tile grid on mobile (`grid-cols-2`) that becomes 4×1 on `sm:` and up (`sm:grid-cols-4`). The subsections stack vertically with `gap-6` between them.
- Tables: horizontal scroll container on mobile (`overflow-x-auto`), full-width on `sm:` and up. Column order locked — no column hiding or reordering.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — not initialized in this project | not required |
| Project-native design system | `Card`, `Heading`, `Table` (+ `TableHead`, `TableRow`, `TableCell`), `Button`, `Badge`, `Spinner` | not required — all already in the codebase and documented at `/debug/design-system` |

No third-party registries touched. No new dependencies. No shadcn `add` or `diff` commands.

---

## Acceptance Criteria (hand-off to plan-checker)

- [ ] All new text rendered through existing typography primitives — no raw `font-size:` overrides.
- [ ] All spacing uses tokens from the table above — no raw pixel spacing.
- [ ] Accent color (`ember-500`) is used only on the "Load more" button state and the stat-value numerics; never on table row hover.
- [ ] Italian copy matches the table exactly (no English fallback strings).
- [ ] Panels gracefully degrade to empty/error states per the interaction contract.
- [ ] Responsive rules (mobile stack, sm+ row for stats, mobile scroll for tables) implemented as specified.
- [ ] No new icon imports outside `lucide-react`.
- [ ] `/dirigera` page has no console errors on initial render.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: FLAG (3 weights declared — 700 scoped to stat-value numerics; non-blocking)
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-22
