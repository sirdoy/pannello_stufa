---
phase: 167-sonos-frontend-cutover
plan: 02
subsystem: hooks
tags: [sonos, hooks, v1-cutover, url-rewrite, frontend]

# Dependency graph
requires:
  - phase: 167-sonos-frontend-cutover
    provides: 11 new v1 Sonos route wrappers (health, devices, zones, history, speakers/[uid]/{volume,mute,eq,home-theater,source,join,unjoin}) from Plan 01 — Wave 2 hooks fetch these
  - phase: 160-sonos-gap-closure
    provides: 13 zone-level v1 routes (playback/play/pause/stop/next/previous/volume/seek/play-mode/queue/sleep-timer) already present — hooks wire to these unchanged
provides:
  - All 5 Sonos hooks (useSonosData, useSonosFullData, useSonosCommands, useSonosQueue, useSonosHistory) fetching only /api/v1/sonos/* URLs
  - 4 hook test suites (useSonosData, useSonosFullData, useSonosCommands, useSonosQueue) assert against v1 URLs
  - 1 additional hook test suite rewrite (useSonosHistory.test.ts — plan/CONTEXT omitted; Rule 1 fix)
affects: [167-03-legacy-delete]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "File-wide find-replace for mechanical prefix swap (/api/sonos/ → /api/v1/sonos/) — applied via Edit replace_all per file"
    - "Regex literal rewrite requires SEPARATE replace_all pass (pattern \\/api\\/sonos\\/ does NOT contain substring /api/sonos/ due to interleaved backslash escapes)"

key-files:
  created: []
  modified:
    - app/components/devices/sonos/hooks/useSonosData.ts
    - app/components/devices/sonos/hooks/useSonosFullData.ts
    - app/components/devices/sonos/hooks/useSonosCommands.ts
    - app/components/devices/sonos/hooks/useSonosQueue.ts
    - app/components/devices/sonos/hooks/useSonosHistory.ts
    - app/components/devices/sonos/hooks/__tests__/useSonosData.test.ts
    - app/components/devices/sonos/hooks/__tests__/useSonosFullData.test.ts
    - app/components/devices/sonos/hooks/__tests__/useSonosCommands.test.ts
    - app/components/devices/sonos/hooks/__tests__/useSonosQueue.test.ts
    - app/components/devices/sonos/hooks/__tests__/useSonosHistory.test.ts

key-decisions:
  - "Task 1 required TWO edit passes per file for test files: first replace_all on /api/sonos/ caught string literals; second replace_all on \\/api\\/sonos\\/ caught regex literals (backslash-escaped slashes break substring matching)"
  - "useSonosHistory.test.ts was NOT listed in plan Task 3 <files> or <read_first> (CONTEXT D-16 said no test existed), but actually exists with a toMatch(/\\/api\\/sonos\\/history.../) regex on line 49 — included as Rule 1 (bug fix): leaving this regex targeting /api/sonos/ would cause test failure after the hook URL was rewritten. Documented as deviation."
  - "useSonosData.ts WS side-fetch blind spots at lines 110 and 124 correctly caught by file-wide replace_all — final state: 2 occurrences each of /api/v1/sonos/health and /api/v1/sonos/zones/ (fetchData + WS callback), matching RESEARCH Pitfall 5 mitigation"
  - "useSonosCommands.ts confirmed 16 execute() calls (NOT 14 per CONTEXT D-14) — RESEARCH A1 was correct"
  - "useSonosFullData.test.ts confirmed 11 conditional URL matcher branches (NOT 9 per CONTEXT D-15) — RESEARCH A2 was correct; final grep count is 12 because one additional occurrence is in the comment at line 109"

patterns-established:
  - "Two-pass URL cutover for test files: pass 1 on /api/sonos/ for literals, pass 2 on \\/api\\/sonos\\/ for regex literals (applicable to any future provider cutover that has regex-based URL matchers in tests)"

requirements-completed: [SONOS-01, SONOS-02, SONOS-03, SONOS-04, SONOS-05, SONOS-06, SONOS-07, SONOS-08, SONOS-09, SONOS-10, SONOS-11, SONOS-12, SONOS-13]

# Metrics
duration: ~12min
completed: 2026-04-20
---

# Phase 167 Plan 02: Sonos Hook URL Cutover Summary

**Mechanical 1:1 prefix swap of all `/api/sonos/*` to `/api/v1/sonos/*` URLs across 5 hook files and 5 test files (4 planned + 1 previously-omitted) — Wave 2 of the Sonos frontend cutover.**

## Performance

- **Duration:** ~12 min
- **Tasks:** 3 (executed sequentially)
- **Files modified:** 10 (5 hooks + 5 test files)
- **Commits:** 3 task commits + 1 summary commit
- **Test outcome:** 55 tests across 5 suites, 0 failures

## Accomplishments

- 5 hook files rewritten: useSonosData (5 URLs, including 2 WS side-fetches per RESEARCH Pitfall 5), useSonosFullData (8), useSonosCommands (16 — NOT 14 per RESEARCH A1), useSonosQueue (1 — query string preserved), useSonosHistory (1 — base URL only, conditional `+=` lines untouched)
- 5 test files rewritten: useSonosData.test (4 string literals + 2 regex literals), useSonosFullData.test (12 — includes RINCON_B volume + second sleep-timer branch per RESEARCH A2), useSonosCommands.test (25 across 16 handler tests), useSonosQueue.test (2 with query params preserved verbatim), useSonosHistory.test (1 regex toMatch — added as Rule 1 deviation)
- Zero `/api/sonos/` references remain in `app/components/devices/sonos/hooks/` (verified via `grep -rn`)
- All 5 hook test suites pass against the rewritten hooks (55/55 tests, 0 failures)

## Task Commits

1. **Task 1: useSonosData + useSonosQueue + useSonosHistory** — `a6003e0e` (refactor)
   - 5 + 1 + 1 = 7 URL swaps
2. **Task 2: useSonosFullData + useSonosCommands** — `473d7b37` (refactor)
   - 8 + 16 = 24 URL swaps (16 NOT 14 per RESEARCH A1)
3. **Task 3: 5 hook test files** — `6682389f` (test)
   - First pass: string literals (4 + 12 + 25 + 2 = 43 swaps)
   - Second pass: regex literals (2 in useSonosData.test + 1 in useSonosHistory.test = 3 swaps)

## Files Modified

All 10 files listed under `key-files.modified`. High-level breakdown:

**Hooks:**
- `useSonosData.ts` — 5 fetch URLs (lines 52, 57, 65, 110, 124)
- `useSonosFullData.ts` — 8 fetch URLs (devices, zones, playback×N, volume×N, eq×N, home-theater×N, play-mode×N, sleep-timer×N)
- `useSonosCommands.ts` — 16 `execute()` calls across all command handlers
- `useSonosQueue.ts` — 1 queue fetch with `?limit=…&offset=…` preserved
- `useSonosHistory.ts` — 1 base URL with `?type=…&start=…&end=…&limit=…` preserved; conditional `&speaker_uid=` / `&group_id=` appends unchanged

**Tests:**
- `__tests__/useSonosData.test.ts` — 6 changes (4 `url === '/api/v1/sonos/...'` branches + 2 regex literals at lines 103, 364)
- `__tests__/useSonosFullData.test.ts` — 12 changes (11 conditional URL matchers + 1 comment on line 102)
- `__tests__/useSonosCommands.test.ts` — 25 changes (most are `toHaveBeenCalledWith` first arg on 16 handler tests; count > 16 because some tests assert the same URL twice + comment mentions)
- `__tests__/useSonosQueue.test.ts` — 2 changes (line 241, 249)
- `__tests__/useSonosHistory.test.ts` — 1 change (regex `toMatch` on line 49)

## Decisions Made

- **Two-pass replace strategy for test files:** After the initial `/api/sonos/` → `/api/v1/sonos/` file-wide replace, `grep -rn` showed 3 remaining hits inside regex literals. Diagnosis: the regex literal `/\/api\/sonos\/zones\/.../` is the character sequence `\`, `/`, `a`, `p`, `i`, `\`, `/`, `s`, `o`, `n`, `o`, `s`, `\`, `/` — which does NOT contain the substring `/api/sonos/` literally (the interleaved `\` characters break it). A second `replace_all` on the exact substring `\/api\/sonos\/` → `\/api\/v1\/sonos\/` caught all three: two in `useSonosData.test.ts` (lines 103, 364) and one in `useSonosHistory.test.ts` (line 49). This pattern should be documented for future cutover phases.

- **useSonosHistory.test.ts deviation:** The plan's Task 3 explicitly excluded this file per CONTEXT D-16 ("useSonosHistory has no existing test file — leave as-is"). On inspection, the file DOES exist with a regex `toMatch(/\/api\/sonos\/history\?type=volume/)` assertion on line 49. Leaving this unchanged after the `useSonosHistory.ts` hook was rewritten would have introduced a test failure (Rule 1 — bug). Fixed as a deviation: added the file to the replace set and ran its test suite to confirm pass.

- **No new test coverage added:** Per RESEARCH "Gap note for planner" and Phase 166 D-16 discipline, `handleSetHomeTheater`, `handleSwitchSource`, and `handleJoinGroup` have no existing test coverage — not retroactively added. Scope is URL cutover only.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Regex literals not caught by initial string-based replace_all**
- **Found during:** Task 3 verification grep
- **Issue:** After running `Edit(old_string='/api/sonos/', new_string='/api/v1/sonos/', replace_all=true)` on the 4 test files, `grep -rn "/api/sonos/"` still returned 3 matches — all regex literals where slashes are escaped with backslashes (e.g., `/\/api\/sonos\/zones\/([^/]+)\/playback/`). The substring `/api/sonos/` does not appear in `\/api\/sonos\/` due to interleaved `\` characters.
- **Fix:** Ran a second `Edit(old_string='\\/api\\/sonos\\/', new_string='\\/api\\/v1\\/sonos\\/', replace_all=true)` on the affected files (`useSonosData.test.ts` — 2 occurrences; `useSonosHistory.test.ts` — 1 occurrence). This was called out explicitly in plan Task 3 ("CRITICAL — Regex `\/api\/sonos\/` is NOT a prefix of `\/api\/v1\/sonos\/`") and in RESEARCH Risk 4, but the plan also claimed "a file-wide find-replace covers this because the regex literal contains the substring `\/api\/sonos\/` which matches `/api/sonos/` → `/api/v1/sonos/` substitution" — this second claim is incorrect because the substring match is not a single-shot operation on the concatenation of slash + `api` + slash + `sonos` + slash (the `\` breaks contiguity).
- **Files modified:** `app/components/devices/sonos/hooks/__tests__/useSonosData.test.ts`, `app/components/devices/sonos/hooks/__tests__/useSonosHistory.test.ts`
- **Verification:** `grep -rnE "\\\\/api\\\\/sonos\\\\/" app/components/devices/sonos/hooks/` returns zero matches; final `grep -rn "/api/sonos/" app/components/devices/sonos/hooks/` returns zero matches
- **Committed in:** `6682389f` (Task 3 commit)

**2. [Rule 1 - Bug] useSonosHistory.test.ts missing from plan file list**
- **Found during:** Regex cleanup sweep in Task 3
- **Issue:** Plan Task 3 `<files>` and CONTEXT D-16 both stated that `useSonosHistory` has no test file. Actual filesystem state shows `app/components/devices/sonos/hooks/__tests__/useSonosHistory.test.ts` with 6 test cases, including a regex `toMatch(/\/api\/sonos\/history\?type=volume/)` on line 49. If left unchanged after rewriting `useSonosHistory.ts` to fetch `/api/v1/sonos/history`, this regex would fail to match the new URL and the test would break.
- **Fix:** Included the file in the Task 3 second-pass regex replace. Test now asserts against `/\/api\/v1\/sonos\/history\?type=volume/` and passes.
- **Files modified:** `app/components/devices/sonos/hooks/__tests__/useSonosHistory.test.ts`
- **Verification:** `npx jest --testPathPatterns="useSonosHistory"` passes all 6 tests
- **Committed in:** `6682389f` (Task 3 commit, combined with Rule 1 #1)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bugs in plan metadata/CONTEXT that would have left a broken state without correction)
**Impact on plan intent:** None. Both fixes are corrections of plan/CONTEXT oversights, not semantic changes to scope. Scope remains "URL cutover — no semantic changes." No production behavior modified. No new test coverage added. All 55 tests across 5 suites pass.

## Issues Encountered

- Jest warns "A worker process has failed to exit gracefully" — pre-existing (noted in Plan 01 summary as well), not related to this plan's changes.
- `act()` warning in `useSonosFullData.test.ts` Test 7 callback at line 303 — pre-existing test code pattern, tests still pass; not in scope for this plan.

## Self-Check: PASSED

- All 10 modified files exist on disk (verified via filesystem check)
- All 3 task commits present in git log: `a6003e0e`, `473d7b37`, `6682389f`
- 55 tests passing across 5 test suites (verified via `npx jest --testPathPatterns="app/components/devices/sonos/hooks/__tests__/(useSonosData|useSonosFullData|useSonosCommands|useSonosQueue|useSonosHistory)"`)
- Zero `/api/sonos/` references remain in `app/components/devices/sonos/hooks/` (verified via `grep -rn` and `grep -rnE "\\\\/api\\\\/sonos\\\\/"`)
- useSonosCommands.ts contains 16 `/api/v1/sonos/` occurrences (matches RESEARCH A1 count of 16, not CONTEXT D-14's undercount of 14)
- useSonosFullData.test.ts contains 12 `/api/v1/sonos/` occurrences (matches RESEARCH A2 count of 11 branches + 1 comment; CONTEXT D-15's undercount of 9 was wrong)
- Both WS side-fetch sites in useSonosData.ts (fetchHealth at :110, fetchPlayback at :124) use v1 URLs — verified via `grep -c "/api/v1/sonos/health" = 2` and `grep -c "/api/v1/sonos/zones/" = 2`
- No modifications to STATE.md or ROADMAP.md (orchestrator owns those writes)

## Next Phase Readiness

- **Wave 3 (167-03) ready:** All frontend hooks now point exclusively at v1 URLs. Legacy `app/api/sonos/` tree can be safely deleted. A repo-wide grep for `/api/sonos/` should find ZERO matches outside the legacy route files themselves and archived `.planning/` docs.
- All 13 SONOS-XX requirements are now end-to-end wired at the hook layer (consumers → v1 routes from Plan 01 / Phase 160).
- **No blockers.**

---
*Phase: 167-sonos-frontend-cutover*
*Plan: 02*
*Completed: 2026-04-20*
