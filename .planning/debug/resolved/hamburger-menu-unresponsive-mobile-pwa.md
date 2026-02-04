---
status: resolved
trigger: "Su mobile con PWA il menu hamburger è visibile ma non risponde al click - non si riesce ad aprire"
created: 2026-02-04T10:00:00Z
updated: 2026-02-04T10:18:00Z
---

## Current Focus

hypothesis: iOS status bar touch zone is blocking clicks on the hamburger button in PWA standalone mode
test: Header at top-0 with viewportFit: cover places content under status bar
expecting: Header needs safe-area-inset-top padding to push content below status bar touch area
next_action: Add safe-area padding to header

## Symptoms

expected: Click sul menu hamburger apre un dropdown menu con le voci di navigazione
actual: Il bottone hamburger è visibile ma non risponde al click - nessuna azione quando si tocca
errors: Non verificato (user non ha controllato console)
reproduction: Aprire la PWA su mobile, toccare il menu hamburger nell'header
started: Funzionava prima, poi ha smesso di funzionare

## Eliminated

- hypothesis: z-index conflict blocking clicks
  evidence: Header z-50, no higher z-index elements present except modals/toasts which return null when inactive
  timestamp: 2026-02-04T10:05:00Z

- hypothesis: Template overlay blocking clicks
  evidence: Template overlay has pointer-events-none
  timestamp: 2026-02-04T10:06:00Z

- hypothesis: OfflineBanner blocking clicks
  evidence: Returns null when online and no messages
  timestamp: 2026-02-04T10:07:00Z

## Evidence

- timestamp: 2026-02-04T10:00:00Z
  checked: Navbar.js structure
  found: |
    - Hamburger button at lines 462-483, uses onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
    - Header has z-index z-50 (line 215)
    - Button is lg:hidden (only shows on mobile)
    - Button has proper aria-label and aria-expanded attributes
    - Button styling includes hover states and transitions
  implication: Button code looks correct, issue likely not in the button itself but in click event being blocked

- timestamp: 2026-02-04T10:08:00Z
  checked: layout.js viewport settings and PWA configuration
  found: |
    - viewportFit: 'cover' (line 28) - viewport extends into safe areas
    - apple-mobile-web-app-status-bar-style: 'black-translucent' - status bar overlays content
    - Header uses fixed top-0 without safe-area padding
    - Header h-16 (64px) with content vertically centered
    - iOS status bar height: ~44-59px depending on device
  implication: Hamburger button (centered in 64px header starting at top-0) is under iOS status bar touch zone

- timestamp: 2026-02-04T10:09:00Z
  checked: globals.css safe-area utilities
  found: |
    - .safe-area-top { padding-top: env(safe-area-inset-top); } exists at line 1065
    - Not used in Navbar header
  implication: Fix is to add padding-top to header for safe-area-inset-top

## Resolution

root_cause: Header starts at top-0 without safe-area-inset-top padding. In PWA standalone mode with viewportFit:cover and black-translucent status bar, iOS status bar overlays the content and blocks touch events to the hamburger button positioned underneath.

fix: |
  1. Added pt-[env(safe-area-inset-top)] to header element to push content below status bar
  2. Updated mobile menu backdrop and panel top position from fixed top-16 to top-[calc(4rem+env(safe-area-inset-top))]
  3. Updated spacer div from h-16 to h-[calc(4rem+env(safe-area-inset-top))] to account for safe area

verification: |
  - All Navbar tests pass (11/11)
  - Changes are CSS-only, minimal risk
  - Safe area inset evaluates to 0 on non-PWA/desktop, so no visual impact there

files_changed:
  - app/components/Navbar.js
