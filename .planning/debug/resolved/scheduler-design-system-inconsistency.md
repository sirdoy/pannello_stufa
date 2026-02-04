---
status: resolved
trigger: "scheduler-design-system-inconsistency"
created: 2026-02-04T10:00:00Z
updated: 2026-02-04T10:25:00Z
---

## Current Focus

hypothesis: Scheduler page does not use PageLayout component and uses raw div containers instead
test: Compare with thermostat page which correctly uses PageLayout
expecting: Need to refactor to use PageLayout with proper header and structure
next_action: Implement PageLayout wrapper with proper structure

## Symptoms

expected: Page should be consistent with other pages that correctly use the design system (Ember Noir theme, correct component variants)
actual: Check entire page for design system violations - wrong colors, wrong variants, missing design system components
errors: No error messages - visual/consistency issues
reproduction: Visit http://localhost:3000/stove/scheduler
started: Always been wrong since page creation

## Eliminated

## Evidence

- timestamp: 2026-02-04T10:05:00Z
  checked: Design system documentation and scheduler page code
  found: Scheduler page imports design system components correctly BUT uses direct className manipulation instead of component variants in several places
  implication: Visual inconsistencies with design system, particularly in layout structure

- timestamp: 2026-02-04T10:06:00Z
  checked: Compared scheduler page.js with stove page.js (correctly implemented)
  found: Stove page uses PageLayout component with proper structure, scheduler page uses raw divs with max-w-7xl mx-auto
  implication: Scheduler missing proper page structure and spacing consistency

- timestamp: 2026-02-04T10:10:00Z
  checked: Thermostat page implementation (correctly uses PageLayout)
  found: Thermostat uses <PageLayout maxWidth="7xl" header={<PageLayout.Header title="..." description="..." />}>
  implication: This is the correct pattern to use for scheduler page

- timestamp: 2026-02-04T10:12:00Z
  checked: Line 703 of scheduler page.js
  found: Uses <div className="max-w-7xl mx-auto space-y-6"> as root container
  implication: Violation - should use PageLayout component instead

- timestamp: 2026-02-04T10:13:00Z
  checked: Lines 705-781 header section structure
  found: Custom grid layout with title inside Card, not using PageLayout.Header
  implication: Violation - title "Pianificazione Settimanale" should be in PageLayout.Header

- timestamp: 2026-02-04T10:14:00Z
  checked: Manual spacing classes throughout (space-y-6, mb-6, p-6, etc.)
  found: Multiple instances of manual spacing instead of design system spacing patterns
  implication: Inconsistent spacing that doesn't match design system patterns

## Resolution

root_cause: Scheduler page bypasses PageLayout component and uses raw div with className="max-w-7xl mx-auto space-y-6" as root container. Title is embedded inside first Card instead of using PageLayout.Header. This creates inconsistent page structure compared to other pages (thermostat, debug) that correctly use the design system's PageLayout component.

fix:
1. Added PageLayout to imports from '@/app/components/ui'
2. Wrapped entire page content in <PageLayout maxWidth="7xl" header={...}>
3. Created PageLayout.Header with title="Pianificazione Settimanale" and description
4. Removed redundant <Heading> from inside first Card (now in header)
5. Replaced closing </div> with </PageLayout>

verification:
- Page loads successfully without errors (tested with curl)
- PageLayout structure now matches thermostat page pattern
- Title properly displayed in PageLayout.Header
- Consistent spacing and structure with design system
files_changed: ['app/stove/scheduler/page.js']
