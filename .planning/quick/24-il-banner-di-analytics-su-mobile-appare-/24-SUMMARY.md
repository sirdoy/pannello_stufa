---
phase: quick-24
plan: 01
subsystem: analytics
tags: [bugfix, mobile, ui, z-index, gdpr]
dependency_graph:
  requires: []
  provides: [mobile-accessible-consent-banner]
  affects: [ConsentBanner, mobile-navigation]
tech_stack:
  added: []
  patterns: [z-index-layering]
key_files:
  created: []
  modified:
    - app/components/analytics/ConsentBanner.tsx
decisions: []
metrics:
  duration_seconds: 54
  tasks_completed: 1
  files_modified: 1
  commits: 1
  completed_date: 2026-02-11
---

# Quick Task 24: Fix Analytics Banner z-index on Mobile

**One-liner:** Fixed analytics consent banner z-index from z-50 to z-[9999] to render above mobile menu and ensure close buttons are accessible.

## Objective

Fix analytics consent banner z-index layering so it appears above the mobile hamburger menu and is closable on mobile devices. The banner was previously unusable on mobile because it rendered behind the navigation menu overlay (z-[9000]) and panel (z-[9001]).

## Tasks Completed

| Task | Status | Commit | Files Modified |
|------|--------|--------|----------------|
| Increase ConsentBanner z-index to appear above mobile menu | ✅ | 7b5f422 | ConsentBanner.tsx |

### Task 1: Increase ConsentBanner z-index

**What was done:**
- Updated ConsentBanner z-index from `z-50` to `z-[9999]`
- Ensures banner renders above mobile menu overlay (z-[9000]) and panel (z-[9001])
- Makes "Only Essential" and "Accept Analytics" buttons fully clickable on mobile

**Files modified:**
- `app/components/analytics/ConsentBanner.tsx` (line 59)

**Verification:**
```bash
grep -n "z-\[9999\]" app/components/analytics/ConsentBanner.tsx
# Output: 59:    <div className="fixed bottom-4 left-4 right-4 z-[9999] md:max-w-lg md:mx-auto">
```

**Commit:** `7b5f422`

## Deviations from Plan

None - plan executed exactly as written.

## Verification

**Code verification:**
- ✅ ConsentBanner.tsx line 59 contains `z-[9999]`
- ✅ Z-index hierarchy: ConsentBanner (9999) > Mobile Panel (9001) > Mobile Overlay (9000)

**Manual testing required:**
1. Open app in mobile viewport (375x667)
2. Trigger consent banner: `localStorage.removeItem('analyticsConsent')` then reload
3. Open hamburger menu
4. Verify banner appears ABOVE menu overlay
5. Click "Only Essential" or "Accept Analytics"
6. Verify banner closes successfully

**Expected behavior:**
- Banner visible and interactive on mobile
- Close buttons fully clickable
- No z-index conflicts with navigation
- No visual regressions on desktop

## Dependencies

**None** - self-contained z-index fix.

## Success Criteria

- [x] ConsentBanner.tsx updated with z-[9999]
- [x] Banner appears above mobile menu (z-[9001])
- [x] Code committed to git
- [ ] Manual verification on mobile device (requires user testing)

## Technical Notes

**Z-index layering hierarchy:**
```
z-[9999] → ConsentBanner (consent decisions take priority)
z-[9001] → Mobile menu panel
z-[9000] → Mobile menu overlay
z-50     → Previous ConsentBanner (too low, was hidden)
```

**Why z-[9999]:**
- Provides clear separation above navigation (9001)
- Follows common practice for modal/overlay components
- GDPR consent should be top priority in UI hierarchy
- Prevents future z-index conflicts

## Self-Check

**File verification:**
```bash
[ -f "app/components/analytics/ConsentBanner.tsx" ] && echo "FOUND"
```
**Result:** FOUND

**Commit verification:**
```bash
git log --oneline --all | grep -q "7b5f422" && echo "FOUND"
```
**Result:** FOUND

**Content verification:**
```bash
grep -c "z-\[9999\]" app/components/analytics/ConsentBanner.tsx
```
**Result:** 1 occurrence on line 59

## Self-Check: PASSED

All files exist, commit is present, and z-index change is verified in code.
