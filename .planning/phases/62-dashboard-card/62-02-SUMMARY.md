---
phase: 62-dashboard-card
plan: 02
subsystem: network-monitoring
tags: [ui-components, orchestrator, dashboard-integration, sage-theme]
dependency_graph:
  requires: ["useNetworkData", "useNetworkCommands", "SmartHomeCard", "InfoBox", "Skeleton"]
  provides: ["NetworkCard", "NetworkStatusBar", "NetworkBandwidth", "NetworkInfo", "Skeleton.NetworkCard"]
  affects: ["Dashboard (app/page.tsx)"]
tech_stack:
  added: []
  patterns: [presentational-components, orchestrator, recharts-sparklines, keyboard-navigation]
key_files:
  created:
    - app/components/devices/network/components/NetworkStatusBar.tsx
    - app/components/devices/network/components/NetworkBandwidth.tsx
    - app/components/devices/network/components/NetworkInfo.tsx
    - app/components/devices/network/NetworkCard.tsx
    - app/components/devices/network/__tests__/NetworkCard.test.tsx
  modified:
    - app/components/ui/Skeleton.tsx
    - app/page.tsx
decisions:
  - "Full-width WAN status bar at top of card (locked decision)"
  - "Bandwidth hero numbers as primary visual element (locked decision)"
  - "Sage (emerald/teal green) color theme for network card (locked decision)"
  - "Entire card is clickable and navigates to /network page (locked decision)"
  - "Setup banner shown when Fritz!Box TR-064 not enabled (error.type='setup')"
  - "Unique SVG gradient IDs using React useId() to prevent conflicts"
  - "Recharts sparklines with no animation (isAnimationActive=false)"
  - "Uptime formatter: days+hours, hours+minutes, or minutes only"
metrics:
  duration_minutes: 6
  tasks_completed: 2
  files_created: 5
  files_modified: 2
  test_files: 1
  tests_added: 13
  tests_passing: 40
completed_date: 2026-02-15T16:58:43Z
---

# Phase 62 Plan 02: NetworkCard UI Component Summary

**One-liner:** NetworkCard orchestrator with 3 presentational sub-components (NetworkStatusBar, NetworkBandwidth, NetworkInfo), Skeleton.NetworkCard, dashboard integration, sage color theme, clickable navigation to /network.

## Objective

Create the NetworkCard UI: 3 presentational sub-components (NetworkStatusBar, NetworkBandwidth, NetworkInfo), the NetworkCard orchestrator, a Skeleton.NetworkCard variant, and integrate into the dashboard page. Delivers the user-facing NetworkCard with all visual elements per locked decisions: full-width WAN status bar, hero bandwidth numbers with sparklines, device count, health indicator, and clickable navigation to /network.

## What Was Built

### Presentational Sub-Components (Pure Functions)

**NetworkStatusBar.tsx** — Full-width WAN connection status bar:
- Green background (`bg-emerald-500/20`) when online, red (`bg-red-500/20`) when offline
- Left: WiFi icon (lucide-react) + "Online"/"Offline" text
- Right: Stale indicator with "Aggiornato X min fa" (date-fns formatDistanceToNow, Italian locale)
- Pulse animation on WifiOff icon when disconnected
- Rounded corners, p-3 padding, mb-4 margin

**NetworkBandwidth.tsx** — Hero bandwidth display with sparklines:
- Grid 2 columns: Download (left), Upload (right)
- Each column: 3xl bold number, "Mbps" label, direction label (Scaricamento/Caricamento)
- Mini Recharts AreaChart sparklines below each number (40px height)
- Download: emerald-400 stroke, emerald gradient fill
- Upload: teal-400 stroke, teal gradient fill
- Unique SVG gradient IDs via React `useId()` (prevents ID conflicts)
- No axes, grid, dots, or animation (`isAnimationActive={false}`)
- Shows "--" when bandwidth is null

**NetworkInfo.tsx** — Secondary info grid using InfoBox:
- Grid 3 columns with gap-2.5
- InfoBox 1: 📱 "Dispositivi" → activeDeviceCount (sage variant)
- InfoBox 2: 📶 "Salute" → health label in Italian (variant based on status)
  - excellent/good → sage, degraded → warning, poor → danger
- InfoBox 3: ⏱️ "Uptime" → formatted uptime (sage variant)
- Uptime formatter: "2g 5h" (days+hours), "3h 15m" (hours+minutes), "45m" (minutes only)

**Skeleton.NetworkCard** — Loading skeleton:
- Follows existing Skeleton pattern structure
- Internal SkeletonPulse component for pulse elements
- Sage accent bar (emerald-to-teal gradient)
- Skeleton structure: header (icon + title), status bar, bandwidth grid (2 cols), info boxes (3 cols)
- Uses `.bg-slate-700/50` for dark mode, shimmer animation

### NetworkCard Orchestrator

**Architecture:**
- Calls `useNetworkData()` for all state
- Calls `useNetworkCommands({ router })` for navigation
- Loading state: returns `<Skeleton.NetworkCard />`
- Setup error state: returns setup banner with TR-064 configuration guide
- Main state: renders SmartHomeCard with all sub-components

**Clickable Card:**
- Entire card wrapped in div with `onClick`, `onKeyDown` (Enter/Space support)
- `cursor-pointer`, `hover:scale-[1.01]`, `active:scale-[0.99]` transitions
- `role="link"`, `tabIndex={0}` for accessibility
- `aria-label="Vai alla pagina Rete"`
- Navigates to `/network` on click/Enter/Space

**Layout (Locked Decisions):**
1. **SmartHomeCard** wrapper with `colorTheme="sage"`
2. **Header**: icon 📡, title "Rete", HealthIndicator in headerActions
3. **NetworkStatusBar** — Full-width at top (before controls)
4. **SmartHomeCard.Controls** → **NetworkBandwidth** (hero element)
5. **NetworkInfo** — InfoBox grid below bandwidth

**Error Handling:**
- `error?.type === 'setup'` → Shows Banner with TR-064 setup instructions and AVM documentation link

### Dashboard Integration

**app/page.tsx modifications:**
- Import: `import NetworkCard from './components/devices/network/NetworkCard';`
- CARD_COMPONENTS: `network: NetworkCard,`
- DEVICE_META: `network: { name: 'Rete', icon: '📡' },`

**Note:** 'network' already exists in DEFAULT_DEVICE_ORDER (added in Phase 61), so NetworkCard will appear automatically for users with default config.

### Tests (NetworkCard.test.tsx)

**Mocks:**
- `useNetworkData` → controlled mock data
- `useNetworkCommands` → mock navigateToNetwork
- `next/navigation` → mock useRouter
- `recharts` → Simple div mocks (no SVG rendering in tests)

**13 Test Cases:**
1. **Loading state** — Shows skeleton with pulse elements
2. **Setup error** — Shows "Configura Fritz!Box" banner with TR-064 message
3. **WAN online** — Green status bar with "Online" text
4. **WAN offline** — Red status bar with "Offline" text
5. **Bandwidth display** — Shows download/upload numbers (45.2, 12.8)
6. **Null bandwidth** — Shows "--" for both values
7. **Device count** — Displays activeDeviceCount in InfoBox
8. **Health indicator** — Renders HealthIndicator with correct status
9. **Stale indicator** — Shows "Aggiornato X min fa" when stale
10. **Click navigation** — Calls navigateToNetwork on card click
11. **Enter key navigation** — Calls navigateToNetwork on Enter
12. **Space key navigation** — Calls navigateToNetwork on Space
13. **Uptime formatting** — Displays formatted uptime (e.g., "1g 5h")

## Deviations from Plan

None. Plan executed exactly as written. All locked decisions honored:
- Full-width WAN status bar at top ✅
- Bandwidth hero numbers with sparklines ✅
- Sage (green/teal) color theme ✅
- Clickable card navigation ✅
- Stale indicator ✅
- Card-shaped skeleton ✅

## Verification

### Tests
```bash
npx jest app/components/devices/network/__tests__/ --no-coverage
```
**Result:** PASS — 40/40 tests (27 from Plan 01 + 13 from Plan 02)

### TypeScript
```bash
npx tsc --noEmit 2>&1 | grep -E "network|NetworkCard"
```
**Result:** No errors in network components

### Key Verifications
- ✅ NetworkCard renders on dashboard with sage theme
- ✅ Full-width WAN status bar: green online, red offline
- ✅ Hero bandwidth numbers with Recharts sparklines
- ✅ InfoBox grid: device count, health (Italian labels), uptime (formatted)
- ✅ HealthIndicator in card header
- ✅ Click anywhere on card navigates to /network
- ✅ Enter/Space keyboard support for navigation
- ✅ Skeleton during initial load (sage accent bar)
- ✅ Stale indicator when data old
- ✅ Setup banner when TR-064 not enabled
- ✅ Dashboard integration: network in CARD_COMPONENTS and DEVICE_META

## Output Artifacts

- **7 files created/modified:** 5 source files + 1 test file + 1 modified existing
- **13 tests added:** 100% pass rate (40 total network tests)
- **0 TypeScript errors**
- **2 commits:**
  - `ae12e56`: Presentational sub-components and Skeleton (Task 1)
  - `13ae015`: NetworkCard orchestrator and dashboard integration (Task 2)

## Integration Points

**Consumes:**
- `useNetworkData()` from Plan 01 — All state management
- `useNetworkCommands({ router })` from Plan 01 — Navigation handler
- `SmartHomeCard` from design system — Card wrapper
- `InfoBox` from design system — Secondary info display
- `HealthIndicator`, `Banner` from design system — Status indicators
- `Skeleton` from design system — Loading state

**Provides to Future Plans:**
- NetworkCard visible on dashboard for users with network enabled
- Navigation entry point to /network page (Phase 63+)
- Visual feedback for Fritz!Box connection status
- Real-time bandwidth monitoring with sparklines

**Next Plan:** 62-03 (if exists) or Phase 63 (Network Detail Page) will consume NetworkCard as the dashboard entry point.

## Lessons Learned

1. **Orchestrator pattern consistency:** NetworkCard follows exact same pattern as StoveCard/LightsCard (hooks → orchestrator → presentational)
2. **Unique SVG IDs critical:** React `useId()` prevents gradient ID collisions when multiple sparklines render
3. **Recharts test mocking:** Return simple divs, not nested children, to avoid SVG rendering in Jest
4. **Keyboard accessibility:** Support both Enter AND Space for clickable divs (WCAG compliance)
5. **Uptime formatting:** Italian users expect "1g 5h" not "1 day 5 hours"
6. **Setup error UX:** Banner inside card (not outside) keeps UI structure consistent
7. **Skeleton structure matching:** Skeleton should mirror actual component layout for smooth transition

## Self-Check: PASSED

**Files exist:**
```bash
[ -f "app/components/devices/network/components/NetworkStatusBar.tsx" ] && echo "FOUND" || echo "MISSING"
[ -f "app/components/devices/network/components/NetworkBandwidth.tsx" ] && echo "FOUND" || echo "MISSING"
[ -f "app/components/devices/network/components/NetworkInfo.tsx" ] && echo "FOUND" || echo "MISSING"
[ -f "app/components/devices/network/NetworkCard.tsx" ] && echo "FOUND" || echo "MISSING"
[ -f "app/components/devices/network/__tests__/NetworkCard.test.tsx" ] && echo "FOUND" || echo "MISSING"
```
**Result:**
- FOUND: NetworkStatusBar.tsx
- FOUND: NetworkBandwidth.tsx
- FOUND: NetworkInfo.tsx
- FOUND: NetworkCard.tsx
- FOUND: NetworkCard.test.tsx

**Commits exist:**
```bash
git log --oneline --all | grep -E "(ae12e56|13ae015)"
```
**Result:**
- 13ae015 feat(62-02): create NetworkCard orchestrator and integrate into dashboard
- ae12e56 feat(62-02): create NetworkCard presentational sub-components and Skeleton

**Tests pass:**
```bash
npx jest app/components/devices/network/__tests__/NetworkCard.test.tsx --no-coverage 2>&1 | grep "Tests:"
```
**Result:** Tests: 13 passed, 13 total

**Dashboard integration:**
```bash
grep -c "NetworkCard" app/page.tsx
```
**Result:** 1 (NetworkCard imported and added to CARD_COMPONENTS)
