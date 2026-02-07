---
phase: quick-013
plan: 01
type: summary
completed: 2026-02-07
duration: 3min

subsystem: ui-ux
tags: [home-page, settings, sandbox, refactor, ui-cleanup]

requires:
  - SandboxToggle component (localhost detection)
  - SandboxPanel component (conditional rendering)
  - Settings page with tabs system

provides:
  - Clean home page with cards-only layout
  - Sandbox controls relocated to Settings tab
  - Maintained sandbox functionality (toggle + panel)

affects:
  - Future home page modifications (simpler layout)
  - Settings page organization (4-tab structure)

tech-stack:
  added: []
  patterns:
    - Self-hiding components (SandboxToggle renders null on production)
    - Conditional rendering based on environment and state

key-files:
  created: []
  modified:
    - app/page.tsx
    - app/settings/page.tsx

decisions:
  - decision: Remove Section wrapper from home page
    rationale: Simpler layout, cards-only dashboard experience
    impact: Cleaner visual hierarchy, less text clutter
  - decision: Add Sandbox tab to settings
    rationale: Configuration tools belong in settings, not on main dashboard
    impact: Better UX - development tools separated from user features
  - decision: Keep SandboxPanel on home when enabled
    rationale: Quick access for development testing workflow
    impact: Sandbox panel appears above cards when toggled in settings
---

# Quick Task 013: Home Cleanup - Sandbox to Settings

**One-liner:** Removed "I tuoi dispositivi" title from home page and moved sandbox toggle to Settings tab while maintaining conditional SandboxPanel display

## Objective

Clean up the home page by removing the heading and description text, leaving only device cards. Relocate sandbox development controls to a dedicated tab in the settings page.

**Purpose:** Declutter the home dashboard for a cleaner user experience, and organize development tools in the appropriate settings location.

## Tasks Completed

### Task 1: Clean up home page layout
**Commit:** 1c2fb02
**Files:** app/page.tsx

**Changes:**
- Removed "I tuoi dispositivi" title and description text
- Replaced Section component wrapper with simple `<section>` tag
- Updated import: SandboxPanel instead of SandboxToggle
- Removed Section from UI component imports
- Maintained device cards Grid with stagger animation
- Kept EmptyState fallback for zero devices

**Verification:** No tests found (page has no test coverage). Manual verification shows no "I tuoi dispositivi" string and no Section import in file.

**Result:** Home page now shows only device cards (with optional SandboxPanel above when enabled on localhost).

### Task 2: Add Sandbox tab to settings page
**Commit:** 3f89d03
**Files:** app/settings/page.tsx

**Changes:**
- Added FlaskConical icon import from lucide-react
- Imported SandboxToggle component
- Created SandboxContent wrapper component with description text
- Added fourth tab "Sandbox" with FlaskConical icon
- Added corresponding Tabs.Content with SandboxContent

**Verification:** No tests found (settings page has no test coverage). Manual verification shows sandbox tab trigger and SandboxContent component present.

**Result:** Settings page now has 4 tabs: Aspetto, Posizione, Dispositivi, Sandbox. Sandbox tab contains the toggle control (self-hides on production).

## Deviations from Plan

None - plan executed exactly as written.

## Implementation Notes

### Component Behavior Pattern
Both SandboxToggle and SandboxPanel use self-hiding pattern:
- Check `isLocalEnvironment()` on mount
- Render `null` if not localhost
- This allows them to be rendered unconditionally in components
- Production builds won't show sandbox controls

### User Flow
1. **On localhost:** User navigates to Settings → Sandbox tab
2. **Toggle sandbox mode:** Activates sandbox state in localStorage
3. **Navigate to home:** SandboxPanel appears above device cards
4. **Sandbox controls:** Full testing panel with state manipulation
5. **Toggle off:** Panel disappears from home page

### Layout Structure
**Before:**
```jsx
<Section title="I tuoi dispositivi" description="...">
  <SandboxToggle />  {/* Includes panel when enabled */}
  <Grid>...</Grid>
</Section>
```

**After:**
```jsx
{/* Home page */}
<section>
  <SandboxPanel />  {/* Self-hides when not enabled */}
  <Grid>...</Grid>
</section>

{/* Settings page */}
<Tabs.Content value="sandbox">
  <SandboxToggle />  {/* Toggle only, includes panel when enabled */}
</Tabs.Content>
```

## Verification Results

✅ Home page has no heading/description text
✅ Only device cards grid visible on home page
✅ Settings page has 4 tabs (Aspetto, Posizione, Dispositivi, Sandbox)
✅ Sandbox tab contains toggle with description
✅ SandboxPanel conditionally renders on home when enabled
✅ No broken imports or missing components
✅ No TypeScript errors

## Performance Impact

**Minimal:**
- Removed one component wrapper (Section → section tag)
- No additional rendering overhead
- Self-hiding components return early when conditions not met

## Next Steps

None required - this is a complete standalone refactor.

## Self-Check: PASSED

**Created files:** None (modifications only)

**Modified files verified:**
- ✅ app/page.tsx exists and modified
- ✅ app/settings/page.tsx exists and modified

**Commits verified:**
- ✅ 1c2fb02 exists (Task 1 - home page cleanup)
- ✅ 3f89d03 exists (Task 2 - settings sandbox tab)
