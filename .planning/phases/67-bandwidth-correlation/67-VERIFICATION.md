---
phase: 67-bandwidth-correlation
verified: 2026-02-16T15:45:00Z
status: passed
score: 6/6 must-haves verified
gaps: []
---

# Phase 67: Bandwidth Correlation Verification Report

**Phase Goal:** User sees correlation between network bandwidth and stove power consumption

**Verified:** 2026-02-16T15:45:00Z

**Status:** passed

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User sees dual y-axis chart with bandwidth (left, Mbps) and power level (right, 1-5) on same timeline | ✓ VERIFIED | BandwidthCorrelationChart.tsx lines 141-214 — ComposedChart with two YAxis components (yAxisId="left" and yAxisId="right"), bandwidth Line (emerald) and powerLevel Line (ember, stepAfter) |
| 2 | Correlation chart and insight text only render when canTrackAnalytics() returns true | ✓ VERIFIED | app/network/page.tsx lines 170-177 — Conditional render `{hasConsent && (<>BandwidthCorrelationChart + CorrelationInsight</>)}`, hasConsent derived from canTrackAnalytics() in useEffect |
| 3 | User sees Italian insight text explaining correlation strength | ✓ VERIFIED | CorrelationInsight.tsx lines 50-66 — Renders insight.description (Italian text from hook), coefficient, and data context. useBandwidthCorrelation.ts lines 105-125 map coefficient to 5 Italian descriptions |
| 4 | User sees "Stufa spenta" message when stove is off (no correlation data) | ✓ VERIFIED | BandwidthCorrelationChart.tsx lines 112-118 — `status === 'stove-off'` renders "Stufa spenta — correlazione non disponibile" |
| 5 | User sees "Raccolta dati" progress when fewer than 30 paired points | ✓ VERIFIED | BandwidthCorrelationChart.tsx lines 121-127 — `status === 'collecting'` renders "Raccolta dati: {pointCount}/{minPoints} punti" |
| 6 | Stove power level data is fetched independently via /api/stove/getPower endpoint | ✓ VERIFIED | app/network/page.tsx lines 54-69 — useEffect with fetch(STOVE_ROUTES.getPower), 30s interval, stores in stovePowerRef.current |

**Score:** 6/6 truths verified

### Required Artifacts

#### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/utils/pearsonCorrelation.ts` | Pearson correlation calculation | ✓ VERIFIED | 43 lines, exports calculatePearsonCorrelation(), implements formula with edge case guards (empty, mismatched, single element, division by zero) |
| `app/network/hooks/useBandwidthCorrelation.ts` | Correlation hook with data buffering, Pearson calc, insight generation | ✓ VERIFIED | 161 lines, exports useBandwidthCorrelation(), features minute-alignment, null filtering, buffer capping (2000), status management (stove-off/collecting/ready), Italian insight mapping |
| `app/components/devices/network/types.ts` | CorrelationDataPoint, CorrelationInsightLevel, UseBandwidthCorrelationReturn types | ✓ VERIFIED | Lines 138-163 define CorrelationDataPoint, CorrelationInsightLevel, CorrelationInsight, CorrelationStatus, UseBandwidthCorrelationReturn |
| `lib/utils/__tests__/pearsonCorrelation.test.ts` | Test coverage for Pearson utility | ✓ VERIFIED | Exists, 9 tests per SUMMARY (empty, mismatched, single, perfect positive/negative, no correlation, moderate, division by zero guards) |
| `app/network/hooks/__tests__/useBandwidthCorrelation.test.ts` | Test coverage for correlation hook | ✓ VERIFIED | Exists, 11 tests per SUMMARY (initial state, null filtering, collecting/ready transitions, minute alignment, correlations, buffer cap) |

#### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/network/components/BandwidthCorrelationChart.tsx` | Dual y-axis ComposedChart with bandwidth line and power level line | ✓ VERIFIED | 218 lines (exceeds min_lines: 80), dual YAxis (left: bandwidth Mbps, right: power 1-5), empty states (stove-off, collecting, insufficient), custom tooltip, emerald/ember colors |
| `app/network/components/CorrelationInsight.tsx` | Insight text display with coefficient and level indicator | ✓ VERIFIED | 70 lines (exceeds min_lines: 30), color-coded by level (emerald for positive, ember for negative, slate for none), shows description + coefficient + data context |
| `app/network/page.tsx` | Updated orchestrator wiring correlation hook + consent gate | ✓ VERIFIED | Contains canTrackAnalytics import (line 24), useBandwidthCorrelation invocation (line 39), consent state management (lines 44-47), stove power polling (lines 52-69), data feeding (lines 72-80), conditional rendering (lines 170-187) |
| `app/network/components/__tests__/BandwidthCorrelationChart.test.tsx` | Test coverage for chart component | ✓ VERIFIED | Exists, 6 tests per SUMMARY (heading, empty states, chart rendering) |
| `app/network/components/__tests__/CorrelationInsight.test.tsx` | Test coverage for insight component | ✓ VERIFIED | Exists, 9 tests per SUMMARY (null handling, text display, formatting, color-coding) |

### Key Link Verification

#### Plan 01 Links

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| useBandwidthCorrelation.ts | pearsonCorrelation.ts | import calculatePearsonCorrelation | ✓ WIRED | Line 4: `import { calculatePearsonCorrelation } from '@/lib/utils/pearsonCorrelation'`, used line 96 |
| useBandwidthCorrelation.ts | network types | import types | ✓ WIRED | Lines 5-11: `import type { CorrelationDataPoint, CorrelationInsight, CorrelationInsightLevel, CorrelationStatus, UseBandwidthCorrelationReturn }` |

#### Plan 02 Links

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| network/page.tsx | useBandwidthCorrelation | import and invoke hook | ✓ WIRED | Line 23: import, line 39: `const correlation = useBandwidthCorrelation()`, used lines 72-80, 171-177 |
| network/page.tsx | analyticsConsentService | import canTrackAnalytics | ✓ WIRED | Line 24: `import { canTrackAnalytics, getConsentState }`, line 46: `setHasConsent(canTrackAnalytics())`, line 53: consent guard, line 170: conditional render |
| network/page.tsx | BandwidthCorrelationChart | conditional render | ✓ WIRED | Line 28: import, line 170: renders with props (chartData, status, pointCount, minPoints) |
| network/page.tsx | /api/stove/getPower | fetch in useEffect for stove power level | ✓ WIRED | Line 30: `import { STOVE_ROUTES }`, line 57: `fetch(STOVE_ROUTES.getPower)`, line 59: `json?.Result`, line 60: stores in stovePowerRef |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| CORR-01: User can see chart overlay of network bandwidth and stove power level | ✓ SATISFIED | None - BandwidthCorrelationChart renders dual y-axis ComposedChart with bandwidth (left) and power level (right) lines on shared timeline |
| CORR-02: Correlation feature gated behind analytics consent (canTrackAnalytics) | ✓ SATISFIED | None - network/page.tsx lines 170-177 wrap components in `{hasConsent && ...}` conditional, hasConsent derived from canTrackAnalytics() |
| CORR-03: User can see summary insight text for bandwidth-heating correlation | ✓ SATISFIED | None - CorrelationInsight component displays Italian description, coefficient, data context with color-coding by level |

### Anti-Patterns Found

No anti-patterns detected.

**Scanned files:**
- lib/utils/pearsonCorrelation.ts — No TODO/FIXME/PLACEHOLDER comments
- app/network/hooks/useBandwidthCorrelation.ts — No TODO/FIXME/PLACEHOLDER comments
- app/network/components/BandwidthCorrelationChart.tsx — No TODO/FIXME/PLACEHOLDER comments
- app/network/components/CorrelationInsight.tsx — No TODO/FIXME/PLACEHOLDER comments (return null is intentional conditional rendering, not a stub)
- app/network/page.tsx — Integration is complete and wired

### Human Verification Required

#### 1. Visual Chart Appearance

**Test:** Visit /network page after granting analytics consent and running stove for 30+ minutes
**Expected:**
- Dual y-axis chart renders with bandwidth line (emerald/green) on left axis
- Power level line (ember/orange) renders as step chart on right axis
- Both lines share same X-axis timeline
- Tooltip shows correct values for both metrics when hovering
- Chart is visually distinct and readable

**Why human:** Visual design, color accuracy, chart responsiveness, tooltip UX cannot be verified programmatically

#### 2. Consent Gate Behavior

**Test:** 
1. Visit /network page without analytics consent (or after denying)
2. Verify correlation chart does NOT render
3. Verify informational Card shows: "Correlazione banda-stufa disponibile con il consenso analytics"
4. Grant analytics consent
5. Verify chart and insight appear after page refresh

**Expected:**
- Feature completely hidden when no consent
- Informational message shown when consent explicitly denied
- Feature appears immediately after granting consent (or on next bandwidth poll)

**Why human:** Consent state transitions, localStorage interaction, UI conditional rendering based on user actions

#### 3. Correlation Accuracy

**Test:** Create known correlation scenario
1. Turn off all other devices (isolate network traffic)
2. Set stove to power level 5 for 15 minutes
3. Monitor bandwidth usage
4. Set stove to power level 1 for 15 minutes
5. Check insight text and coefficient

**Expected:**
- If bandwidth changes with power level, coefficient should be non-zero
- Insight text should match correlation direction (positive if bandwidth increases with power, negative if decreases)
- Coefficient value should be reasonable (-1 to +1)

**Why human:** Requires real-world data collection, environmental control, subjective validation of correlation strength

#### 4. Italian Localization

**Test:** Review all Italian text in UI
- Chart title: "Correlazione Banda-Stufa"
- Empty states: "Stufa spenta — correlazione non disponibile", "Raccolta dati: X/30 punti", "Dati insufficienti per la correlazione"
- Insight descriptions (5 levels, see useBandwidthCorrelation.ts lines 105-125)
- Axis labels, tooltip, coefficient text

**Expected:**
- All text is grammatically correct Italian
- Technical terms are appropriate
- Tone matches existing app style

**Why human:** Natural language quality, grammatical correctness, cultural appropriateness

#### 5. Data Collection Progress Feedback

**Test:** Grant consent and start stove with empty correlation buffer
**Expected:**
- Initial message: "Stufa spenta" (if stove off) or "Raccolta dati: 0/30 punti"
- Point count increments every ~30-60 seconds (based on network polling)
- Message updates in real-time
- At 30 points, chart and insight appear
- Active hours calculation is reasonable (e.g., 30 points ≈ 0.25 hours)

**Why human:** Real-time state updates, timing validation, UX feedback quality

---

## Gaps Summary

No gaps found. All must-haves verified, all artifacts exist and are substantive, all key links wired, all requirements satisfied, no anti-patterns detected.

Phase 67 goal achieved: User sees correlation between network bandwidth and stove power consumption.

**Commits verified:**
- e35ded4: test(67-01): add failing test for Pearson correlation utility
- e877ced: feat(67-01): implement useBandwidthCorrelation hook with TDD
- 1176ccb: feat(67-02): create BandwidthCorrelationChart and CorrelationInsight components
- 3143273: feat(67-02): wire bandwidth correlation into network page with consent gate

**Test coverage:**
- Plan 01: 20 tests (9 Pearson + 11 hook)
- Plan 02: 15 tests (6 chart + 9 insight)
- Total: 35 tests passing

**GDPR compliance:**
- Analytics consent gate implemented (canTrackAnalytics)
- SSR-safe consent pattern (useState + useEffect)
- Stove power polling only runs with consent
- Informational Card shown when consent denied

**Ready for production** with 5 human verification items recommended for UAT.

---

_Verified: 2026-02-16T15:45:00Z_
_Verifier: Claude (gsd-verifier)_
