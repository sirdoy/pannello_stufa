---
phase: 135-sonos-zone-extended-ui
verified: 2026-03-25T12:00:00Z
status: human_needed
score: 7/7 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 3/7
  gaps_closed:
    - "SonosPlayModeControls.tsx created — Shuffle+Repeat toggles with decomposePlayMode/composePlayMode, ember active style"
    - "SonosSleepTimer.tsx created — 5 presets (900/1800/2700/3600/5400 s), formatRemainingTime, cancel via onSetTimer(0)"
    - "SonosQueueViewer.tsx created — isExpanded state, fetchInitial on expand, Coda vuota empty state, Carica altri load-more"
    - "SonosPlayModeControls.test.tsx created — 8 test cases"
    - "SonosSleepTimer.test.tsx created — 7 test cases"
    - "SonosQueueViewer.test.tsx created — 7 test cases"
    - "SonosZoneSection.tsx updated — playMode and sleepTimer props added, all 3 new components imported and rendered"
    - "app/sonos/page.tsx updated — passes playMode={data.playModes[zone.group_id]} and sleepTimer={data.sleepTimers[zone.group_id]}"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Visit /sonos in browser and verify each zone card shows shuffle and repeat toggle buttons below transport controls"
    expected: "Two icon buttons (Shuffle, Repeat) visible; active state shows ember-500/20 background when play mode includes that flag"
    why_human: "Tailwind class rendering and Ember Noir visual styling cannot be verified programmatically"
  - test: "Click a sleep timer preset (e.g. 30 min) and verify countdown appears"
    expected: "Timer icon + MM:SS countdown in text-ember-400 color; cancel X button visible; countdown ticking down"
    why_human: "Real-time countdown behavior requires live Sonos zone and browser rendering"
  - test: "Expand queue viewer for a zone with queued tracks; click Carica altri"
    expected: "Items show position, title, artist; Carica altri loads next page and appends; Coda vuota shown when queue is empty"
    why_human: "On-demand expand behavior and queue pagination require live Sonos zone with queued content"
---

# Phase 135: Sonos Zone Extended UI Verification Report

**Phase Goal:** The /sonos page shows play mode controls, sleep timer, and queue viewer for each zone
**Verified:** 2026-03-25
**Status:** HUMAN NEEDED (all automated checks pass)
**Re-verification:** Yes — gap closure confirmed after cherry-pick to main

## Goal Achievement

All plan 01 and plan 02 work is now present on disk and properly wired. The data layer (hooks) was verified in the initial pass. All three UI components now exist, are substantive, have full test coverage, and are correctly imported and rendered in `SonosZoneSection.tsx`, which receives the necessary props from `app/sonos/page.tsx`.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | useSonosFullData returns playModes and sleepTimers records keyed by group_id | VERIFIED | Lines 12-13 confirm both fields; parallel Promise.allSettled fetch at lines 94-103 |
| 2 | useSonosCommands exposes handleSetPlayMode and handleSetSleepTimer | VERIFIED | Interface lines 19-20; implementations at lines 145-181; sonosExtendedCmd at line 30 |
| 3 | useSonosQueue fetches queue on demand with load-more pagination | VERIFIED | fetchInitial/loadMore/hasMore/QUEUE_PAGE_SIZE=20 present |
| 4 | Each zone in /sonos shows shuffle and repeat toggle buttons reflecting current play mode | VERIFIED | SonosPlayModeControls.tsx: 71 LOC, decomposePlayMode/composePlayMode, Shuffle+Repeat buttons, ember-500/20 active class; SonosZoneSection renders at lines 62-65 |
| 5 | Each zone shows sleep timer remaining time and has preset/cancel controls | VERIFIED | SonosSleepTimer.tsx: 60 LOC, 5 PRESETS, formatRemainingTime MM:SS, cancel X via onSetTimer(0); SonosZoneSection renders at lines 66-69 |
| 6 | Each zone has an expandable queue viewer showing paginated track list | VERIFIED | SonosQueueViewer.tsx: 79 LOC, isExpanded state, fetchInitial on expand, Coda vuota, Carica altri, position/title/artist columns; SonosZoneSection renders at line 73 |
| 7 | Play mode and sleep timer mutations trigger data refresh via 202 pattern | VERIFIED | page.tsx lines 80-81 pass playMode and sleepTimer props; SonosZoneSection wires groupId into commands.handleSetPlayMode and commands.handleSetSleepTimer which use sonosExtendedCmd with 202 poll |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/components/devices/sonos/hooks/useSonosFullData.ts` | Extended SonosFullData with playModes + sleepTimers | VERIFIED | Lines 12-13 confirm both fields; real API fetches in fetchData |
| `app/components/devices/sonos/hooks/useSonosCommands.ts` | Play mode and sleep timer command handlers | VERIFIED | handleSetPlayMode + handleSetSleepTimer wired to sonosExtendedCmd |
| `app/components/devices/sonos/hooks/useSonosQueue.ts` | On-demand queue fetching with pagination | VERIFIED | fetchInitial/loadMore/hasMore/QUEUE_PAGE_SIZE=20 |
| `app/components/devices/sonos/components/SonosPlayModeControls.tsx` | Shuffle and repeat toggle buttons | VERIFIED | 71 LOC; decomposePlayMode/composePlayMode; ember-500/20 active; aria-labels Shuffle/Ripeti |
| `app/components/devices/sonos/components/SonosSleepTimer.tsx` | Preset duration buttons + timer countdown + cancel | VERIFIED | 60 LOC; 5 PRESETS (900/1800/2700/3600/5400 s); MM:SS format; X cancel button |
| `app/components/devices/sonos/components/SonosQueueViewer.tsx` | Expandable queue track list with load-more | VERIFIED | 79 LOC; isExpanded state; fetchInitial on expand; Coda vuota; Carica altri; position/title/artist |
| `app/components/devices/sonos/components/__tests__/SonosPlayModeControls.test.tsx` | 6+ tests | VERIFIED | 8 tests: renders, active/inactive styles, composePlayMode toggle paths, null handling |
| `app/components/devices/sonos/components/__tests__/SonosSleepTimer.test.tsx` | 6+ tests | VERIFIED | 7 tests: presets render, remaining time display, cancel button, preset click, cancel click, time formatting |
| `app/components/devices/sonos/components/__tests__/SonosQueueViewer.test.tsx` | 7+ tests | VERIFIED | 7 tests: collapsed state, fetchInitial on expand, items list, Coda vuota, Carica altri, loadMore call, total count header |
| `app/components/devices/sonos/components/SonosZoneSection.tsx` | Zone section wiring new components | VERIFIED | Lines 7-9 import SonosPlayModeResponse/SonosSleepTimerResponse; lines 15-17 import all 3 new components; lines 23-24 add playMode/sleepTimer props; lines 62-73 render all 3 |
| `app/sonos/page.tsx` | Page orchestrator passing playMode + sleepTimer props | VERIFIED | Lines 80-81: playMode={data.playModes[zone.group_id]} sleepTimer={data.sleepTimers[zone.group_id]} |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| useSonosFullData.ts | /api/sonos/zones/{groupId}/play-mode | fetch per zone in fetchData | WIRED | playModes record built from Promise.allSettled; graceful degradation on failure |
| useSonosFullData.ts | /api/sonos/zones/{groupId}/sleep-timer | fetch per zone in fetchData | WIRED | sleepTimers record built from Promise.allSettled; graceful degradation |
| useSonosCommands.ts | /api/sonos/zones/{groupId}/play-mode PUT | handleSetPlayMode via sonosExtendedCmd | WIRED | sonosExtendedCmd with method PUT |
| useSonosQueue.ts | /api/sonos/zones/{groupId}/queue | fetch with limit/offset | WIRED | ?limit=20&offset=N pagination params |
| app/sonos/page.tsx | SonosZoneSection | playMode and sleepTimer props | WIRED | Lines 80-81 — both props pass from useSonosFullData data |
| SonosZoneSection.tsx | SonosPlayModeControls | playMode prop + onSetPlayMode callback | WIRED | Lines 62-65 — playMode?.play_mode ?? null; commands.handleSetPlayMode(zone.group_id, mode) |
| SonosZoneSection.tsx | SonosSleepTimer | sleepTimer prop + onSetTimer callback | WIRED | Lines 66-69 — sleepTimer?.remaining_seconds ?? null; commands.handleSetSleepTimer(zone.group_id, duration) |
| SonosQueueViewer.tsx | useSonosQueue | hook call inside component | WIRED | Line 5 imports useSonosQueue; line 13 calls with groupId |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| useSonosFullData.ts | playModes | fetch /api/sonos/zones/{id}/play-mode per zone | Yes — real API fetch with graceful degradation | FLOWING |
| useSonosFullData.ts | sleepTimers | fetch /api/sonos/zones/{id}/sleep-timer per zone | Yes — real API fetch with graceful degradation | FLOWING |
| useSonosQueue.ts | items | fetch /api/sonos/zones/{id}/queue?limit=20&offset=N | Yes — real API fetch with pagination | FLOWING |
| SonosZoneSection.tsx | playMode, sleepTimer | From page.tsx prop thread | page.tsx lines 80-81 pass real data from useSonosFullData | FLOWING |
| SonosPlayModeControls.tsx | playMode | Prop from SonosZoneSection | playMode?.play_mode ?? null — real value or null | FLOWING |
| SonosSleepTimer.tsx | remainingSeconds | Prop from SonosZoneSection | sleepTimer?.remaining_seconds ?? null — real value or null | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| page.tsx passes playMode prop | grep "playMode=" app/sonos/page.tsx | Line 80 found | PASS |
| page.tsx passes sleepTimer prop | grep "sleepTimer=" app/sonos/page.tsx | Line 81 found | PASS |
| SonosZoneSection imports all 3 new components | grep "SonosPlayModeControls\|SonosSleepTimer\|SonosQueueViewer" SonosZoneSection.tsx | Lines 15-17 found | PASS |
| All 3 component test files exist | ls __tests__/Sonos*.test.tsx | SonosPlayModeControls.test.tsx, SonosSleepTimer.test.tsx, SonosQueueViewer.test.tsx | PASS |
| No anti-patterns in new/updated files | grep TODO/FIXME/placeholder/return null | No matches across all 5 files | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SONOS-35 | 135-01, 135-02 | Play mode controls per zona nella /sonos page (shuffle, repeat toggle buttons) | SATISFIED | SonosPlayModeControls.tsx renders Shuffle+Repeat buttons with decomposePlayMode state reflection; wired in SonosZoneSection; handleSetPlayMode in useSonosCommands. Crossfade intentionally omitted — Sonos API does not expose it in the play-mode endpoint (per RESEARCH.md). |
| SONOS-36 | 135-01, 135-02 | Sleep timer display e set/cancel per zona nella /sonos page | SATISFIED | SonosSleepTimer.tsx shows MM:SS countdown when active, 5 presets (15/30/45/60/90 min), cancel button; wired in SonosZoneSection; handleSetSleepTimer in useSonosCommands. |
| SONOS-37 | 135-01, 135-02 | Queue viewer paginato per zona nella /sonos page (lista brani con titolo, artista, durata) | SATISFIED | SonosQueueViewer.tsx shows position/title/artist, expandable on demand, load-more pagination; useSonosQueue hook provides paginated data. Duration intentionally omitted — SonosQueueItemResponse has no duration field (per API research). |

No orphaned requirements — all three IDs declared in both plan frontmatters and mapped to Phase 135 in REQUIREMENTS.md.

### Anti-Patterns Found

No anti-patterns detected. No TODOs, FIXMEs, placeholders, empty return values, or hardcoded empty state found in any phase 135 file.

### Human Verification Required

#### 1. Shuffle/Repeat Toggle Styling

**Test:** Visit /sonos page and verify each zone card shows shuffle and repeat toggle buttons below the transport controls on the same row as sleep timer presets.
**Expected:** Two icon buttons (Shuffle, Repeat); active state renders ember-500/20 background + text-ember-400 color when play mode flag is active; inactive state renders slate-700/50 background.
**Why human:** Tailwind class rendering and Ember Noir visual styling cannot be verified programmatically.

#### 2. Sleep Timer Countdown

**Test:** Set a 30-minute sleep timer and verify the countdown appears in the zone card header row.
**Expected:** Timer icon + MM:SS countdown (30:00 ticking down) in ember-400 color; cancel X button present and removes timer when clicked; preset buttons still visible.
**Why human:** Real-time countdown behavior requires a live Sonos zone and browser rendering.

#### 3. Queue Viewer Expand Flow

**Test:** Click the Coda button for a zone with queued tracks; scroll to bottom; click Carica altri if visible.
**Expected:** Track items show position number, title, and artist; Carica altri button appears when hasMore is true and appends next 20 tracks; Coda vuota shown for empty queues; total count shown in header (e.g. "Coda (47 brani)").
**Why human:** On-demand fetch and queue pagination require a live Sonos zone with queued content.

### Re-verification Summary

All 4 gap categories from the initial verification are resolved. The cherry-picked commits delivered:

- Three new UI components (SonosPlayModeControls, SonosSleepTimer, SonosQueueViewer) — each substantive, implementing real logic (not placeholders), with 7-8 unit tests each.
- SonosZoneSection.tsx updated with an extended props interface (playMode + sleepTimer) and rendering of all three new components.
- app/sonos/page.tsx updated to pass playMode and sleepTimer props from useSonosFullData data by group_id.

The full data-flow chain is intact: real API fetches in useSonosFullData populate playModes and sleepTimers records, which are threaded through page.tsx into each SonosZoneSection, then into the presentational components. SonosQueueViewer independently pulls from useSonosQueue on-demand.

No regressions detected in previously-verified artifacts.

---

_Verified: 2026-03-25_
_Verifier: Claude (gsd-verifier)_
