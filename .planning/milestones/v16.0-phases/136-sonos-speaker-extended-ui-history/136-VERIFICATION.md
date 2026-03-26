---
phase: 136-sonos-speaker-extended-ui-history
verified: 2026-03-25T12:00:00Z
status: passed
score: 13/13 must-haves verified
re_verification: false
---

# Phase 136: Sonos Speaker Extended UI + History Verification Report

**Phase Goal:** The /sonos page shows per-speaker EQ/home theater/source/grouping controls and a global history chart
**Verified:** 2026-03-25
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | useSonosCommands exposes handleSetEq, handleSetHomeTheater, handleSwitchSource, handleJoinGroup, handleUnjoinGroup | ✓ VERIFIED | All 5 handlers present at lines 188–279, typed, returned; each hits correct endpoint via sonosExtendedCmd |
| 2 | useSonosFullData fetches per-speaker EQ and HT data in parallel | ✓ VERIFIED | Step 4b at lines 78–103 uses Promise.all([Promise.allSettled(eq...), Promise.allSettled(ht...)]) for all UIDs; eqData + homeTheaterData in SonosFullData interface and newData object |
| 3 | useSonosHistory fetches history on-demand with type, time range, and filter state | ✓ VERIFIED | Hook exports fetchHistory (useCallback), no auto-poll; builds /api/sonos/history?type=...&start=...&end=...&limit=200 with optional speaker_uid/group_id params |
| 4 | SonosEqControls renders bass/treble sliders (-10 to +10) and loudness toggle | ✓ VERIFIED | min={-10} max={10} sliders for Bass and Treble; Loudness button; 250ms debounce on sliders; null guard when eqData undefined or all-null |
| 5 | SonosHomeTheater renders night mode, dialog mode, sub, surround toggles with conditional sliders | ✓ VERIFIED | 4 toggle buttons (Modalita notte, Dialogo, Subwoofer, Surround); sub gain slider min={-15} max={15} conditional on sub_enabled===true; surround sliders conditional on surround_enabled===true; soundbar-only guard |
| 6 | SonosSourceSwitch renders TV/line-in segmented button with ember accent | ✓ VERIFIED | Two buttons (TV, Line-in); active class bg-amber-500/80; soundbar-only guard (role !== 'soundbar' returns null) |
| 7 | SonosGroupControls renders join dropdown and unjoin button based on coordinator/member status | ✓ VERIFIED | Separa button for !isCoordinator && zoneMemberCount > 1; Unisci a... select for isCoordinator && zoneMemberCount === 1; null for coordinator in multi-member zone |
| 8 | SonosHistoryChart renders volume LineChart or playback table with type selector and time range | ✓ VERIFIED | Cronologia heading; Volume/Riproduzione type buttons; 24h/7g/30g time range buttons; SonosVolumeChart via next/dynamic; playback table with Ora/Brano/Artista/Sorgente columns |
| 9 | Each speaker volume row shows expandable EQ controls when EQ data exists | ✓ VERIFIED | SonosSpeakerVolume renders <SonosEqControls uid={uid} eqData={eqData} onSetEq={onSetEq} />; component self-hides when data absent |
| 10 | Soundbar speakers show expandable home theater controls | ✓ VERIFIED | SonosSpeakerVolume renders <SonosHomeTheater uid={uid} role={role} htData={htData} .../>; component self-hides for non-soundbar role |
| 11 | Soundbar speakers show inline source switch button | ✓ VERIFIED | SonosSpeakerVolume renders <SonosSourceSwitch uid={uid} role={role} .../> below volume row; component self-hides for non-soundbar |
| 12 | Standalone speakers show join dropdown, non-coordinator members show unjoin button | ✓ VERIFIED | SonosSpeakerVolume renders <SonosGroupControls isCoordinator={...} zoneMemberCount={...} .../>; correct logic in component |
| 13 | Bottom of /sonos page shows Cronologia section with volume chart or playback table | ✓ VERIFIED | page.tsx imports SonosHistoryChart; renders conditionally when data && data.zones.length > 0; placed after zone sections loop |

**Score:** 13/13 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/components/devices/sonos/hooks/useSonosCommands.ts` | 5 new command handlers for EQ, HT, source, join, unjoin | ✓ VERIFIED | All 5 handlers present, typed, use sonosExtendedCmd.execute, returned from hook |
| `app/components/devices/sonos/hooks/useSonosFullData.ts` | Per-speaker EQ and HT data in SonosFullData | ✓ VERIFIED | eqData: Record<string, SonosEqResponse> and homeTheaterData in interface and newData; step 4b fetch present |
| `app/components/devices/sonos/hooks/useSonosHistory.ts` | On-demand history fetching hook | ✓ VERIFIED | Exports useSonosHistory; SonosHistoryType, SonosHistoryTimeRange types; fetchHistory in useCallback; no auto-poll |
| `app/components/devices/sonos/components/SonosEqControls.tsx` | EQ sliders and loudness toggle | ✓ VERIFIED | Full implementation with bass/treble range inputs, loudness button, 250ms debounce, null guard |
| `app/components/devices/sonos/components/SonosHomeTheater.tsx` | Home theater toggle switches and gain sliders | ✓ VERIFIED | 4 toggles, 3 conditional sliders, soundbar guard, 250ms debounce |
| `app/components/devices/sonos/components/SonosSourceSwitch.tsx` | TV/line-in segmented button | ✓ VERIFIED | TV and Line-in buttons, amber accent on active, soundbar guard |
| `app/components/devices/sonos/components/SonosGroupControls.tsx` | Join dropdown and unjoin button | ✓ VERIFIED | Separa button and Unisci a... select with correct coordinator/member logic |
| `app/components/devices/sonos/components/SonosHistoryChart.tsx` | History chart section with type selector and time range picker | ✓ VERIFIED | Cronologia heading, type buttons, time range buttons, filter dropdowns, next/dynamic chart, playback table |
| `app/components/devices/sonos/components/SonosVolumeChart.tsx` | Recharts LineChart for volume history | ✓ VERIFIED | ResponsiveContainer with LineChart, avg_volume dataKey, amber-500 stroke, XAxis tickFormatter |
| `app/components/devices/sonos/components/SonosSpeakerVolume.tsx` | Speaker row with EQ, HT, source, group control slots | ✓ VERIFIED | Imports and renders all 4 sub-components; 9 new props added |
| `app/components/devices/sonos/components/SonosZoneSection.tsx` | Zone section passing eqData, htData, and extended commands to speakers | ✓ VERIFIED | eqData, homeTheaterData, allZones in props; all passed to SonosSpeakerVolume |
| `app/sonos/page.tsx` | Page with history section below zones | ✓ VERIFIED | SonosHistoryChart imported and rendered; eqData/homeTheaterData/allZones passed to SonosZoneSection |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| useSonosCommands.ts | /api/sonos/speakers/{uid}/eq | sonosExtendedCmd.execute PUT | ✓ WIRED | Line 191: sonosExtendedCmd.execute(\`/api/sonos/speakers/${uid}/eq\`, { method: 'PUT' ... }) |
| useSonosFullData.ts | /api/sonos/speakers/{uid}/eq | fetch in fetchData step 4b | ✓ WIRED | Line 81: fetch(\`/api/sonos/speakers/${uid}/eq\`).then(r => r.json()) |
| useSonosHistory.ts | /api/sonos/history | fetch with query params | ✓ WIRED | Line 47: url = \`/api/sonos/history?type=${historyType}&start=...&end=...&limit=200\` |
| SonosSpeakerVolume.tsx | SonosEqControls.tsx | import and render conditionally | ✓ WIRED | import SonosEqControls from './SonosEqControls'; renders <SonosEqControls ... /> |
| SonosSpeakerVolume.tsx | SonosHomeTheater.tsx | import and render for soundbar role | ✓ WIRED | import SonosHomeTheater from './SonosHomeTheater'; renders <SonosHomeTheater ... /> |
| SonosZoneSection.tsx | SonosSpeakerVolume.tsx | passes eqData, htData, commands as props | ✓ WIRED | eqData={eqData[member.uid]}, htData={homeTheaterData[member.uid]}, all 5 extended command handlers passed |
| app/sonos/page.tsx | SonosHistoryChart.tsx | import and render below zone sections | ✓ WIRED | import SonosHistoryChart from '...'; rendered after zone sections loop with zones and speakers props |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| SonosHistoryChart | data (SonosHistoryResponse) | useSonosHistory.fetchHistory() → fetch /api/sonos/history | API call with real URL params; data set from response JSON | ✓ FLOWING |
| SonosVolumeChart | items (SonosVolumeHistoryItem[]) | Prop from SonosHistoryChart (data.items cast) | Passed from live fetch result | ✓ FLOWING |
| SonosEqControls | eqData | SonosZoneSection → eqData[member.uid] from useSonosFullData step 4b | Parallel fetch /api/sonos/speakers/{uid}/eq in fetchData | ✓ FLOWING |
| SonosHomeTheater | htData | SonosZoneSection → homeTheaterData[member.uid] from useSonosFullData step 4b | Parallel fetch /api/sonos/speakers/{uid}/home-theater in fetchData | ✓ FLOWING |
| SonosGroupControls | isCoordinator, availableZones | SonosZoneSection derives from zone.coordinator_uid and allZones filter | allZones passed from page.tsx data.zones | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| useSonosHistory exports fetchHistory function | node -e "const m = require('./app/components/devices/sonos/hooks/useSonosHistory.ts')" | TypeScript source — verified by test suite PASS | ✓ PASS (via tests) |
| SonosHistoryChart test suite | npx jest SonosHistoryChart (main tree) | PASS — 8 tests covering Cronologia heading, type buttons, time range buttons | ✓ PASS |
| All new component tests | 17 sonos test suites in main tree | All 17 PASS; 6 failures in .claude/worktrees/ leftover from parallel agent (pre-existing, out of scope) | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SONOS-38 | 136-01, 136-02 | EQ controls per speaker (bass/treble sliders, loudness toggle) | ✓ SATISFIED | SonosEqControls.tsx: min={-10} max={10} sliders, Loudness toggle; wired via SonosSpeakerVolume → SonosZoneSection → page |
| SONOS-39 | 136-01, 136-02 | Home theater settings per soundbar (night mode, speech enhance, sub, surround) | ✓ SATISFIED | SonosHomeTheater.tsx: 4 toggles (Modalita notte, Dialogo, Subwoofer, Surround), conditional sub gain + surround sliders; soundbar-only guard |
| SONOS-40 | 136-01, 136-02 | Source switch (TV/line-in) per speaker | ✓ SATISFIED | SonosSourceSwitch.tsx: TV and Line-in buttons, soundbar-only guard, amber accent on active source |
| SONOS-41 | 136-01, 136-02 | Group management per speaker (join a gruppo, unjoin da gruppo) | ✓ SATISFIED | SonosGroupControls.tsx: Unisci a... dropdown for standalone coordinator, Separa button for non-coordinator member |
| SONOS-42 | 136-01, 136-02 | History chart (volume/playback, selettore tipo, time range, filtro speaker/zona) | ✓ SATISFIED | SonosHistoryChart.tsx: Volume/Riproduzione selector, 24h/7g/30g range, speaker filter (volume) + zone filter (playback), Recharts LineChart and playback table |

No orphaned requirements — all 5 IDs declared in plan frontmatter and all accounted for.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No TODOs, FIXMEs, placeholders, empty return null stubs, or hardcoded empty arrays found in new phase files | — | None |

Note: The only `return null` patterns found are intentional conditional guards (role !== 'soundbar', eqData undefined) — these are correct design, not stubs.

### Human Verification Required

#### 1. EQ Slider Interaction on Real Device

**Test:** Open /sonos page with a Sonos speaker online. Expand the EQ section for a speaker. Move the Bass slider.
**Expected:** Slider debounces at 250ms, PUT /api/sonos/speakers/{uid}/eq is called with { bass: value }, bass value displays correctly formatted ("+3" or "-5").
**Why human:** Requires live Sonos device; debounce timing and slider sync from server can't be verified without real data.

#### 2. Home Theater Panel Visibility

**Test:** Open /sonos page with a soundbar speaker (role='soundbar'). Expand Home Theater. Enable Subwoofer. Verify sub gain slider appears. Disable Subwoofer. Verify slider disappears.
**Expected:** Sub gain slider is conditional on sub_enabled toggle; other roles show no Home Theater section.
**Why human:** Requires live soundbar device with htData populated.

#### 3. Group Controls Conditional Rendering

**Test:** Test with a standalone Sonos speaker (single zone, 1 member). Verify the "Unisci a..." dropdown appears. Test with a non-coordinator member in a group. Verify "Separa" button appears.
**Expected:** Correct control shown based on coordinator status and zone membership.
**Why human:** Requires live multi-device Sonos setup.

#### 4. History Chart Data Display

**Test:** Open /sonos page. Scroll to Cronologia section. Verify volume chart loads with data points (amber line). Switch to Riproduzione. Verify playback table with timestamps and track info.
**Expected:** Chart and table populate with real data from /api/sonos/history. Filter dropdowns work.
**Why human:** Requires live history data in the Sonos backend.

### Gaps Summary

No gaps found. All 13 must-haves verified at all levels (exists, substantive, wired, data-flowing). Phase goal is achieved.

---

_Verified: 2026-03-25T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
