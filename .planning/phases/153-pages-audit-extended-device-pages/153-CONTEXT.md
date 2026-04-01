# Phase 153: Pages Audit — Extended Device Pages - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit and fix all extended device pages at 375px viewport: Sonos (/sonos), DIRIGERA (/dirigera), Raspi (/raspi), Tuya (/tuya), and all Rooms pages (/rooms, /rooms/status, /rooms/[id]). Each page must render without horizontal overflow, clipped controls, or layout breakage. This phase does NOT touch core device pages (done in Phase 152) or admin/support pages (Phase 154).

</domain>

<decisions>
## Implementation Decisions

### Fix Strategy (all pages)
- **D-01:** Apply minimal, targeted fixes — add responsive Tailwind classes or `overflow-x-auto` wrappers. Do NOT restructure page layouts or rewrite components (same as Phase 152 D-01)
- **D-02:** Follow Phase 151's mobile-first convention: base = mobile (375px+), `sm:` = desktop (640px+) (same as Phase 152 D-02)
- **D-03:** For data-heavy components (tables, charts, queues), prefer `overflow-x-auto` scroll wrapper over column hiding (same as Phase 152 D-03)

### Fix Depth
- **D-04:** Drill into sub-components, not just page-level layouts. Sonos has 14 sub-components and Raspi has 4 sub-components with grid/min-w patterns that may overflow at 375px

### Known Issues (from codebase scout)
- **D-05:** `RaspiSystemInfo.tsx:50` has `grid-cols-3` at base — KEEP as-is (tiny stat boxes with single values fit at 375px with gap-3). Verify visually
- **D-06:** `RaspiSystemInfo.tsx:36`, `RaspiMemoryDisk.tsx:33`, `RaspiCpuTemp.tsx:25`, `RaspiNetworkIO.tsx:33` have `grid-cols-2` at base — likely fine for small stat boxes, verify visually
- **D-07:** Sonos sub-components have small `min-w-[28px]` to `min-w-[100px]` values — these are reasonable for labels/values, but verify they don't compound at 375px
- **D-08:** `SonosHistoryChart.tsx:175-176` has `max-w-[160px]` and `max-w-[120px]` on table cells — may need overflow-x-auto on the parent table
- **D-09:** `SonosQueueViewer.tsx:57` has `max-w-[120px]` truncate — likely fine
- **D-10:** `DirigeraStats.tsx:11` has `grid-cols-2` — likely fine for stat cards
- **D-11:** Tuya page already responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` — likely needs no changes, verify only
- **D-12:** Rooms /rooms page uses DataTable (already has overflow-x-auto) — verify column widths render readable at 375px
- **D-13:** Rooms /rooms/status already uses `grid-cols-1 sm:grid-cols-2` — likely mobile-safe, verify visually
- **D-14:** Rooms /rooms/[id] has no grid patterns — inspect for any fixed-width elements

### Verification Method
- **D-15:** Use Playwright MCP at 375x812 viewport (same as Phase 151/152 UAT) to verify each page after fixes
- **D-16:** Check `document.body.scrollWidth <= window.innerWidth` for each page as automated overflow test
- **D-17:** Visual screenshot for each page to catch clipped controls or unreadable text

### Plan Grouping
- **D-18:** Plan 01: Sonos (/sonos) + DIRIGERA (/dirigera) + Raspi (/raspi) + Tuya (/tuya) — AUDIT-06, AUDIT-07, AUDIT-08, AUDIT-09
- **D-19:** Plan 02: All Rooms pages (/rooms, /rooms/status, /rooms/[id]) — AUDIT-10

### Claude's Discretion
- Exact responsive breakpoint choices per component
- Whether specific Sonos sub-components need overflow-x-auto or responsive restructuring
- Whether Raspi grid-cols-2/3 components need adjustment after visual inspection
- Order of page fixes within each plan

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pages to Audit — Sonos
- `app/sonos/page.tsx` — Sonos orchestrator page (imports zone section + history chart)
- `app/components/devices/sonos/components/SonosZoneSection.tsx` — Zone list with playback
- `app/components/devices/sonos/components/SonosTransportControls.tsx` — Play/pause/skip buttons
- `app/components/devices/sonos/components/SonosNowPlaying.tsx` — Current track display
- `app/components/devices/sonos/components/SonosEqControls.tsx` — EQ sliders (min-w-[28px])
- `app/components/devices/sonos/components/SonosHomeTheater.tsx` — Home theater controls (min-w-[28px])
- `app/components/devices/sonos/components/SonosSpeakerVolume.tsx` — Volume per speaker (min-w-[100px])
- `app/components/devices/sonos/components/SonosQueueViewer.tsx` — Queue list (max-w-[120px])
- `app/components/devices/sonos/components/SonosHistoryChart.tsx` — History table (max-w-[160px], max-w-[120px])
- `app/components/devices/sonos/components/SonosGroupControls.tsx` — Group/ungroup controls
- `app/components/devices/sonos/components/SonosPlayModeControls.tsx` — Shuffle/repeat
- `app/components/devices/sonos/components/SonosSourceSwitch.tsx` — Source selection
- `app/components/devices/sonos/components/SonosVolumeChart.tsx` — Volume chart
- `app/components/devices/sonos/components/SonosSleepTimer.tsx` — Sleep timer
- `app/components/devices/sonos/components/SonosSeekControl.tsx` — Seek bar

### Pages to Audit — DIRIGERA
- `app/dirigera/page.tsx` — DIRIGERA orchestrator page
- `app/components/devices/dirigera/components/DirigeraHealthSection.tsx` — Health status
- `app/components/devices/dirigera/components/DirigeraSensorList.tsx` — Sensor list
- `app/components/devices/dirigera/components/DirigeraStats.tsx` — Stats grid (grid-cols-2)

### Pages to Audit — Raspi
- `app/raspi/page.tsx` — Raspi orchestrator page
- `app/raspi/components/RaspiSystemInfo.tsx` — System info (grid-cols-2, grid-cols-3)
- `app/raspi/components/RaspiMemoryDisk.tsx` — Memory/disk (grid-cols-2)
- `app/raspi/components/RaspiCpuTemp.tsx` — CPU temp (grid-cols-2)
- `app/raspi/components/RaspiNetworkIO.tsx` — Network I/O (grid-cols-2)

### Pages to Audit — Tuya
- `app/tuya/page.tsx` — Tuya page (already responsive grid-cols-1 md:grid-cols-2)

### Pages to Audit — Rooms
- `app/rooms/page.tsx` — Rooms list with DataTable
- `app/rooms/status/page.tsx` — Room status overview (grid-cols-1 sm:grid-cols-2)
- `app/rooms/[room_id]/page.tsx` — Room detail with device assignments

### Prior Phase Context
- `.planning/phases/152-pages-audit-core-device-pages/152-CONTEXT.md` — Core pages audit patterns and conventions (D-01 through D-12)
- `.planning/phases/151-design-system-mobile-first/151-CONTEXT.md` — DS mobile-first patterns

### Design System
- `docs/design-system.md` — Design system documentation
- `app/debug/design-system/page.tsx` — Mobile-First Patterns reference section

### Requirements
- `.planning/REQUIREMENTS.md` — AUDIT-06 through AUDIT-10

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 151/152 established all responsive patterns — no new patterns needed
- `DataTable` component already has `overflow-x-auto` — Rooms /rooms page is covered
- `PageLayout` uses `px-4` base padding — consistent across all pages
- Sonos/DIRIGERA/Raspi pages all use orchestrator pattern (page → hooks → components)

### Established Patterns
- Mobile-first convention: base = 375px+, `sm:` = 640px+
- `overflow-x-auto` on data-heavy content (DataTable, charts)
- Grid responsive: `grid-cols-1` at base, `sm:grid-cols-N` for desktop
- Small stat grids: `grid-cols-2` or `grid-cols-3` at base is OK for tiny stat boxes

### Integration Points
- Sonos page imports 14 sub-components via SonosZoneSection orchestrator
- DIRIGERA page imports health section + sensor list + stats
- Raspi page imports 4 stat components
- Tuya page is self-contained with responsive grids already in place
- Rooms pages use DataTable + CRUD modals

### Potential Issues Found
- Sonos has the most sub-components (14) — highest chance of layout issues at 375px
- SonosHistoryChart has a `<table>` that may overflow — needs overflow-x-auto wrapper
- SonosSpeakerVolume has `min-w-[100px]` on speaker names — may squeeze other elements
- Rooms /rooms page DataTable columns may need mobile-friendly column definitions

</code_context>

<specifics>
## Specific Ideas

No specific requirements — this is a mechanical audit-and-fix phase. Use Playwright at 375px to discover issues, apply minimal responsive fixes following Phase 151/152 conventions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 153-pages-audit-extended-device-pages*
*Context gathered: 2026-04-01*
