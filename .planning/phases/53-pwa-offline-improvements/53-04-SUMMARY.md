---
phase: 53-pwa-offline-improvements
plan: 04
subsystem: pwa
tags: [install-prompt, pwa, user-engagement, localStorage]
completed: 2026-02-11

dependencies:
  requires: []
  provides:
    - PWA install prompt UI
    - Visit tracking system
    - 30-day dismissal cooldown
    - iOS installation instructions
  affects:
    - User onboarding flow
    - PWA adoption metrics

tech_stack:
  added:
    - lib/pwa/installPromptService.ts (visit/dismissal tracking)
    - lib/hooks/useInstallPrompt.ts (beforeinstallprompt hook)
    - app/components/pwa/InstallPrompt.tsx (bottom sheet UI)
  patterns:
    - beforeinstallprompt event handling
    - localStorage-based persistence
    - Custom bottom sheet with CSS animations
    - iOS device detection and fallback

key_files:
  created:
    - lib/pwa/installPromptService.ts (141 lines)
    - lib/hooks/useInstallPrompt.ts (115 lines)
    - app/components/pwa/InstallPrompt.tsx (242 lines)
    - lib/hooks/__tests__/useInstallPrompt.test.ts (276 lines)
    - app/components/pwa/__tests__/InstallPrompt.test.tsx (217 lines)
  modified: []

decisions:
  - title: localStorage for visit tracking instead of cookies
    rationale: Simpler API, no expiration management needed, sufficient for client-side feature
    alternatives: [cookies, sessionStorage, IndexedDB]
  - title: Custom bottom sheet instead of external library
    rationale: Per CLAUDE.md rule - no npm install allowed, design system has needed primitives
    alternatives: [react-modal-sheet, react-spring-bottom-sheet]
  - title: 30-day dismissal cooldown
    rationale: Balance between not annoying users and maintaining install opportunity
    alternatives: [7 days, 60 days, permanent dismissal]
  - title: 2+ visits requirement
    rationale: Avoid showing prompt to first-time visitors, ensure user interest
    alternatives: [1 visit, 3 visits, time-based delay]

metrics:
  duration_minutes: 5.6
  tasks_completed: 2
  files_created: 5
  tests_added: 27
  test_pass_rate: 100%
---

# Phase 53 Plan 04: PWA Install Prompt Summary

**One-liner:** Bottom sheet install prompt with 2+ visit requirement, 30-day dismissal, beforeinstallprompt handling, and iOS fallback instructions

## What Was Built

Created a complete PWA install prompt system with:

1. **installPromptService** - Pure utility functions for:
   - Visit counting (increments on each page load)
   - Dismissal tracking (stores timestamp, checks 30-day window)
   - iOS device detection (handles iPhone, iPad, iPadOS)
   - Standalone mode detection (hides prompt if already installed)
   - localStorage availability check (SSR-safe, handles private browsing)

2. **useInstallPrompt hook** - React hook managing:
   - beforeinstallprompt event capture and prevention
   - Visit count increment on mount
   - canInstall state (2+ visits, not dismissed, not standalone)
   - install() method (triggers native prompt, returns acceptance)
   - dismiss() method (sets 30-day cooldown)
   - iOS detection for fallback UI

3. **InstallPrompt component** - Bottom sheet UI with:
   - Slide-up animation from bottom (animate-slide-up from globals.css)
   - Semi-transparent backdrop (dismisses on click)
   - Benefits list: offline, push notifications, home screen access
   - Native install button (Chrome/Android via beforeinstallprompt)
   - iOS manual instructions (Share → Add to Home Screen)
   - Dismiss button and close X (both trigger 30-day cooldown)
   - Ember Noir styling (dark-first, ember accents)

## Technical Implementation

### Visit Tracking Flow

```
First visit → increment to 1 → canInstall=false
Second visit → increment to 2 → canInstall=true (if not dismissed)
User dismisses → store timestamp → canInstall=false for 30 days
After 30 days → isDismissed()=false → canInstall=true again
```

### beforeinstallprompt Handling

```typescript
1. User visits page
2. Browser fires beforeinstallprompt event
3. Hook prevents default (stores event in state)
4. If conditions met (2+ visits, not dismissed), show UI
5. User clicks install → call event.prompt()
6. Browser shows native dialog
7. User accepts/dismisses → handle outcome
```

### iOS Detection

- Checks userAgent for `iphone|ipod|ipad`
- Handles iPadOS 13+ (reports as Macintosh, check touch capability)
- Shows manual instructions instead of install button
- Still tracks visits and dismissals

### Bottom Sheet Design

- Fixed position at bottom: `z-[55]` (above backdrop `z-[54]`)
- Rounded top corners: `rounded-t-3xl`
- Slide-up animation: CSS transition from `translate-y(100%)`
- Decorative drag handle (visual indicator, not functional)
- Backdrop with blur: `bg-black/40 backdrop-blur-sm`

## Testing

**27 tests total** (100% pass rate):

**useInstallPrompt hook (14 tests):**
- Visit count increment on mount
- canInstall=false when < 2 visits
- canInstall=false when dismissed within 30 days
- canInstall=false when already standalone
- canInstall=true when conditions met
- iOS detection
- beforeinstallprompt event prevention
- install() triggers native prompt
- install() returns true when accepted
- install() returns false when dismissed
- dismiss() stores timestamp and hides prompt
- Event listener cleanup on unmount

**InstallPrompt component (13 tests):**
- Renders nothing when canInstall=false
- Renders bottom sheet when canInstall=true
- Displays all 3 benefits
- Shows install button for non-iOS
- Shows iOS instructions for iOS devices
- Calls install() when button clicked
- Calls dismiss() when user rejects native prompt
- Doesn't call dismiss() when user accepts
- Calls dismiss() on "Non ora" button
- Calls dismiss() on close X button
- Calls dismiss() on backdrop click
- Has proper ARIA attributes
- Shows "Non ora" for iOS

## Deviations from Plan

None - plan executed exactly as written.

## Key Learnings

1. **React 18 strict mode**: Effects run twice in development, tests must account for this (use `toHaveBeenCalled()` instead of `toHaveBeenCalledTimes(1)`)

2. **iPadOS detection tricky**: Since iOS 13, iPadOS reports as Macintosh in userAgent - must check for touch capability

3. **beforeinstallprompt lifecycle**: Event fires before app logic, must prevent default immediately and store for later use

4. **localStorage in tests**: jsdom provides localStorage, but must mock for SSR safety checks

5. **Bottom sheet animations**: Existing `animate-slide-up` in globals.css worked perfectly - no new CSS needed

## Integration Points

**To use in app:**

```tsx
// Add to root layout or ClientProviders
import InstallPrompt from '@/app/components/pwa/InstallPrompt';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
```

**Standalone usage of hook:**

```tsx
const { canInstall, isIOS, install, dismiss } = useInstallPrompt();

if (canInstall && !isIOS) {
  // Show custom install UI
  const accepted = await install();
}
```

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| lib/pwa/installPromptService.ts | 141 | Pure utilities for tracking |
| lib/hooks/useInstallPrompt.ts | 115 | React hook for prompt logic |
| app/components/pwa/InstallPrompt.tsx | 242 | Bottom sheet UI component |
| lib/hooks/__tests__/useInstallPrompt.test.ts | 276 | Hook tests (14 tests) |
| app/components/pwa/__tests__/InstallPrompt.test.tsx | 217 | Component tests (13 tests) |

**Total: 991 lines of production + test code**

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 5be973c | feat(53-04): create installPromptService and useInstallPrompt hook |
| 2 | be5cb4b | feat(53-04): create InstallPrompt bottom sheet component |

## Verification

- [x] TypeScript compilation passes (no errors in InstallPrompt files)
- [x] All 27 tests pass (14 hook + 13 component)
- [x] Component renders nothing when canInstall=false
- [x] Component shows bottom sheet when canInstall=true
- [x] iOS fallback shows manual instructions
- [x] 30-day dismissal tracking works
- [x] Visit counting increments correctly
- [x] beforeinstallprompt event captured and deferred

## Next Steps

1. Add InstallPrompt to root layout (ClientProviders or app layout)
2. Test on real devices:
   - Chrome Android (native prompt flow)
   - iOS Safari (manual instructions)
   - Desktop Chrome (native prompt)
3. Monitor visit count and dismissal metrics
4. Consider A/B testing visit threshold (2 vs 3)
5. Track install conversion rate in analytics

## Self-Check: PASSED

**Created files exist:**
```bash
✓ lib/pwa/installPromptService.ts
✓ lib/hooks/useInstallPrompt.ts
✓ app/components/pwa/InstallPrompt.tsx
✓ lib/hooks/__tests__/useInstallPrompt.test.ts
✓ app/components/pwa/__tests__/InstallPrompt.test.tsx
```

**Commits exist:**
```bash
✓ 5be973c (Task 1: installPromptService + hook)
✓ be5cb4b (Task 2: InstallPrompt component)
```

**Tests pass:**
```bash
✓ 27/27 tests passing (100%)
✓ No TypeScript errors in InstallPrompt files
```
