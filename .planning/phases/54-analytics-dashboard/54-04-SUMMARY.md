---
phase: 54-analytics-dashboard
plan: 04
subsystem: analytics
tags: [gdpr, consent, ui, privacy]
dependencies:
  requires: [54-01-types-consent-event-logger]
  provides: [consent-banner-ui]
  affects: [client-providers, analytics-flow]
tech_stack:
  added: []
  patterns: [gdpr-visual-parity, ssr-safe-consent-check, soft-reload-pattern]
key_files:
  created:
    - app/components/analytics/ConsentBanner.tsx
    - app/components/analytics/ConsentBanner.test.tsx
  modified:
    - app/components/ClientProviders.tsx
decisions:
  - Visual parity enforced via identical button variant (subtle) and size (sm)
  - Soft reload on accept to activate analytics features (window.location.reload)
  - No reload on reject (essential mode continues without interruption)
  - Global rendering via ClientProviders (all pages, not just /analytics)
  - SSR-safe with useEffect mount check (prevents hydration mismatch)
metrics:
  duration_minutes: 5.4
  tasks_completed: 3
  tests_added: 10
  files_created: 2
  files_modified: 1
  commits: 3
  completed_date: 2026-02-11
---

# Phase 54 Plan 04: GDPR Consent Banner Summary

**One-liner:** GDPR-compliant consent banner with visual parity between Accept/Reject, global rendering on all pages via ClientProviders

## What Was Built

Created a GDPR-compliant consent banner component that enforces visual parity between Accept and Reject options per EU 2026 requirements. The banner blocks analytics tracking until user explicitly grants or denies permission, with essential stove controls working regardless of consent state.

**Files Created:**
- `app/components/analytics/ConsentBanner.tsx` (91 lines) - Client component with SSR-safe consent check
- `app/components/analytics/ConsentBanner.test.tsx` (162 lines) - 10 tests covering GDPR requirements

**Files Modified:**
- `app/components/ClientProviders.tsx` - Added ConsentBanner import and rendering after OfflineBanner

## Task Breakdown

### Task 1: Create GDPR consent banner component
**Commit:** 652007a
**Duration:** ~2 minutes
**Files:** app/components/analytics/ConsentBanner.tsx

Created client component with:
- SSR-safe useEffect mount check (prevents flash, hydration issues)
- Visual parity: both buttons use `variant="subtle"` and `size="sm"` (no color bias)
- Equal width: `className="flex-1"` on both buttons (no layout preference)
- Soft reload on accept: `window.location.reload()` to activate analytics features
- No reload on reject: essential mode continues seamlessly
- Fixed positioning: `fixed bottom-4 left-4 right-4 z-50 md:max-w-lg md:mx-auto`
- Glass card variant: backdrop-blur for modern UI
- Essential controls messaging: explicit statement that stove controls work without consent

### Task 2: Create consent banner tests
**Commit:** fd278f8
**Duration:** ~2 minutes
**Files:** app/components/analytics/ConsentBanner.test.tsx

Created 10 tests covering:
1. Does not render when consent already granted
2. Does not render when consent already denied
3. Renders when consent is unknown
4. Shows both buttons with identical styling (visual parity)
5. Calls setConsentState(true) when Accept clicked
6. Calls setConsentState(false) when Reject clicked
7. Hides banner after Accept clicked
8. Hides banner after Reject clicked
9. Mentions essential controls work without consent
10. Has accessible labels on buttons (aria-label)

**Note:** window.location.reload() cannot be tested in jsdom (documented limitation).

### Task 3: Wire ConsentBanner into ClientProviders for all pages
**Commit:** 69123a9
**Duration:** ~1 minute
**Files:** app/components/ClientProviders.tsx

Integrated ConsentBanner globally:
- Added import: `import ConsentBanner from '@/app/components/analytics/ConsentBanner'`
- Rendered after OfflineBanner, before children: `<ConsentBanner />`
- Banner now appears on ALL pages on first visit (not just /analytics)
- Self-manages visibility via getConsentState() check (renders null when consent decided)

## Deviations from Plan

None - plan executed exactly as written.

## Technical Decisions

### 1. Visual Parity Enforcement (GDPR Requirement)
**Decision:** Use identical button variant (`subtle`) and size (`sm`) for both Accept and Reject.
**Rationale:** EU 2026 guidelines prohibit dark patterns where one option is more prominent.
**Implementation:** Both buttons have `variant="subtle"`, `size="sm"`, and `className="flex-1"`.
**Result:** Buttons are visually indistinguishable except for text content.

### 2. Soft Reload on Accept
**Decision:** Call `window.location.reload()` after user accepts consent.
**Rationale:** Analytics features may need initialization (e.g., event logging APIs, dashboard data fetching).
**Alternative considered:** Fire custom event and let components listen - rejected as more complex.
**Tradeoff:** Brief page reload interrupts UX but ensures clean analytics activation.

### 3. No Reload on Reject
**Decision:** Do not reload page when user rejects consent.
**Rationale:** Essential mode should continue seamlessly without interruption.
**Result:** User stays on current page, essential controls continue working.

### 4. Global Rendering via ClientProviders
**Decision:** Render ConsentBanner in ClientProviders (not per-page).
**Rationale:** Users should see consent prompt on first visit to ANY page, not just /analytics.
**Implementation:** ConsentBanner self-manages visibility (returns null when consent decided).
**Result:** Banner appears once per user, regardless of entry page.

### 5. SSR-Safe with useEffect
**Decision:** Start with `useState(false)` and check consent in useEffect.
**Rationale:** Prevents SSR/client hydration mismatch (localStorage only available client-side).
**Tradeoff:** Brief delay before banner appears (acceptable for first-visit UX).

## Testing Coverage

**Unit tests:** 10/10 passing
- Conditional rendering based on consent state (3 tests)
- Visual parity validation (1 test)
- Consent state management (2 tests)
- Banner visibility changes (2 tests)
- Messaging and accessibility (2 tests)

**Patterns tested:**
- SSR safety (useEffect mount check)
- GDPR visual parity (identical button styling)
- Consent state persistence (localStorage via analyticsConsentService)
- Accessible UI (aria-label attributes)

**Not tested:**
- window.location.reload() (jsdom limitation - documented)

## Integration Points

**Consumes:**
- `lib/analyticsConsentService.ts` - getConsentState, setConsentState
- `app/components/ui/Card.tsx` - Glass card variant
- `app/components/ui/Button.tsx` - Subtle variant for visual parity
- `app/components/ui/Text.tsx` - Secondary variant for description
- `app/components/ui/Heading.tsx` - Default variant for title

**Provides:**
- Global consent banner UI on all pages
- GDPR-compliant consent flow (no dark patterns)
- Essential mode messaging (controls work without consent)

**Affects:**
- All pages via ClientProviders (consent prompt on first visit)
- Analytics features (blocked until consent granted)

## Performance Impact

- **Bundle size:** +91 lines (ConsentBanner.tsx) - minimal
- **Runtime:** SSR-safe (no server-side localStorage access)
- **First render:** Banner hidden by default, shows after useEffect (prevents flash)
- **User experience:** One-time prompt on first visit, no further interruption

## Security & Privacy

**GDPR Compliance:**
- ✅ No pre-ticked options or implied consent
- ✅ Visual parity between Accept and Reject (no dark patterns)
- ✅ Explicit mention that essential controls work without consent
- ✅ Non-blocking overlay (user can interact with page)
- ✅ Consent state persisted to localStorage (not cookies)
- ✅ No tracking until explicit consent granted

**Privacy by Design:**
- Essential mode works without consent (stove controls, authentication)
- Analytics features blocked until user opts in
- Consent decision stored locally (no server transmission)

## Future Enhancements

1. **Consent revocation UI** - Add settings page for users to change consent decision
2. **Consent analytics** - Track consent acceptance rate (requires consent to track!)
3. **Granular consent** - Allow users to opt into specific analytics features
4. **Consent timestamp display** - Show when user made decision in settings
5. **Multi-language support** - Translate banner text based on user locale

## Lessons Learned

1. **jsdom limitations:** window.location.reload() cannot be mocked in jsdom (documented, acceptable tradeoff)
2. **Visual parity is critical:** GDPR requires identical button styling (not just size)
3. **SSR safety:** localStorage requires useEffect (can't check during SSR)
4. **Global rendering pattern:** ClientProviders is ideal for app-wide UI (consent banner, offline banner, install prompt)

## Commits

1. `652007a` - feat(54-04): create GDPR consent banner component
2. `fd278f8` - test(54-04): add consent banner tests
3. `69123a9` - feat(54-04): wire ConsentBanner into ClientProviders globally

## Self-Check: PASSED

### Files Created
- ✅ `app/components/analytics/ConsentBanner.tsx` exists (91 lines)
- ✅ `app/components/analytics/ConsentBanner.test.tsx` exists (162 lines)

### Files Modified
- ✅ `app/components/ClientProviders.tsx` includes ConsentBanner import and rendering

### Commits
- ✅ Commit 652007a exists (ConsentBanner component)
- ✅ Commit fd278f8 exists (ConsentBanner tests)
- ✅ Commit 69123a9 exists (ClientProviders integration)

### Tests
- ✅ All 10 ConsentBanner tests pass
- ✅ No new TypeScript errors introduced

### GDPR Requirements
- ✅ Visual parity enforced (identical button variant and size)
- ✅ No pre-ticked options or implied consent
- ✅ Essential controls messaging present
- ✅ Accessible labels (aria-label attributes)
- ✅ Non-blocking overlay (fixed positioning)

All claims verified. Plan executed successfully.
