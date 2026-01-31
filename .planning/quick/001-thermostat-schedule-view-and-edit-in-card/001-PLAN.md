---
phase: quick-001
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/devices/thermostat/ThermostatCard.js
  - app/components/devices/thermostat/ScheduleSection.js
autonomous: true
must_haves:
  truths:
    - "User can see the current active schedule name in the ThermostatCard"
    - "User can switch to a different schedule directly from the ThermostatCard"
    - "Schedule change is reflected immediately after switching"
  artifacts:
    - path: "app/components/devices/thermostat/ScheduleSection.js"
      provides: "Schedule display and switcher component"
      exports: ["default"]
    - path: "app/components/devices/thermostat/ThermostatCard.js"
      provides: "Enhanced thermostat card with schedule section"
  key_links:
    - from: "app/components/devices/thermostat/ScheduleSection.js"
      to: "/api/netatmo/schedules"
      via: "fetch via useScheduleData hook"
      pattern: "useScheduleData"
    - from: "app/components/devices/thermostat/ThermostatCard.js"
      to: "ScheduleSection.js"
      via: "component import and render"
      pattern: "import.*ScheduleSection"
---

<objective>
Add schedule viewing and switching functionality to the ThermostatCard on the homepage.

Purpose: Allow users to see the current active Netatmo schedule and quickly switch between schedules without navigating to the full schedule page. This provides quick access to a commonly needed feature.

Output: Enhanced ThermostatCard with a collapsible schedule section showing active schedule and allowing schedule switching.
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/components/devices/thermostat/ThermostatCard.js
@app/thermostat/schedule/components/ScheduleSelector.js
@lib/hooks/useScheduleData.js
@lib/routes.js
@app/components/ui/index.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create ScheduleSection component</name>
  <files>app/components/devices/thermostat/ScheduleSection.js</files>
  <action>
Create a new ScheduleSection component that:

1. Uses the existing `useScheduleData` hook from `@/lib/hooks/useScheduleData`
2. Shows the active schedule name with a calendar icon
3. Provides a Select dropdown to switch schedules (use `Select` from `@/app/components/ui`)
4. Shows loading state with `Spinner` component while fetching/switching
5. Shows error state with `Text variant="error"` if fetch fails
6. Auto-refreshes schedule data after a successful switch

Component structure:
```jsx
'use client';
import { useState, useEffect } from 'react';
import { Text, Select, Button, Spinner } from '@/app/components/ui';
import { useScheduleData } from '@/lib/hooks/useScheduleData';
import { NETATMO_ROUTES } from '@/lib/routes';
import { Calendar, Check, RefreshCw } from 'lucide-react';
```

Props:
- `compact` (boolean, default: false) - when true, uses smaller styling suitable for card context

Features:
- Display active schedule name with checkmark icon when selected matches active
- Show "Cambia..." placeholder in select when no change pending
- "Applica" button appears only when a different schedule is selected
- Button loading state during switch operation
- Error message display with retry capability
- Uses cn() for class composition per project conventions

Styling: Follow Ember Noir design system with ocean/sage accents for schedule-related elements. Use glass/subtle backgrounds.
  </action>
  <verify>
File exists at app/components/devices/thermostat/ScheduleSection.js with:
- useScheduleData hook import
- Select component from design system
- handleSwitch function calling POST to NETATMO_ROUTES.schedules
- Loading/error state handling
  </verify>
  <done>
ScheduleSection component renders schedule data, allows switching, handles loading/error states.
  </done>
</task>

<task type="auto">
  <name>Task 2: Integrate ScheduleSection into ThermostatCard</name>
  <files>app/components/devices/thermostat/ThermostatCard.js</files>
  <action>
Modify ThermostatCard.js to include the new ScheduleSection:

1. Import ScheduleSection from './ScheduleSection'
2. Add a new section after the "Modalita" section (around line 580)
3. Use the existing Divider component with label="Programmazione"
4. Render ScheduleSection with compact={true} prop
5. Only show the schedule section when `connected` is true and `topology` exists

Insert after the Mode Control section (after the calibrate button, before the "Vedi Tutte le Stanze" link):

```jsx
{/* Schedule Section */}
{topology && (
  <>
    <Divider label="Programmazione" variant="gradient" spacing="large" />
    <ScheduleSection compact />
  </>
)}
```

The section should integrate seamlessly with the existing card design, using the same spacing patterns (mt-5 sm:mt-6 between sections).
  </action>
  <verify>
- ThermostatCard imports ScheduleSection
- Schedule section appears between Mode controls and "Vedi Tutte le Stanze" button
- Section only renders when connected and topology exists
- Visual styling matches existing card sections
  </verify>
  <done>
ThermostatCard displays schedule section with active schedule name and switch functionality when connected to Netatmo.
  </done>
</task>

<task type="auto">
  <name>Task 3: Add unit test for ScheduleSection</name>
  <files>__tests__/components/devices/thermostat/ScheduleSection.test.js</files>
  <action>
Create unit tests for the ScheduleSection component:

1. Mock useScheduleData hook to return test data
2. Mock fetch for POST requests to schedules endpoint
3. Test cases:
   - Renders loading spinner when loading=true
   - Renders error message when error is present
   - Renders active schedule name when data loaded
   - Shows select with all schedule options
   - Shows "Applica" button only when selection differs from active
   - Calls POST to switch schedule when Applica clicked
   - Disables select during switching operation

Use existing test patterns from the codebase:
- jest.mock for hooks
- @testing-library/react for rendering
- fireEvent or userEvent for interactions

Follow existing test file structure in `__tests__/` directory.
  </action>
  <verify>
Run: `npm test -- --testPathPattern=ScheduleSection`
All tests pass.
  </verify>
  <done>
ScheduleSection component has unit tests covering loading, error, display, and interaction states.
  </done>
</task>

</tasks>

<verification>
1. Start dev server: `npm run dev`
2. Navigate to homepage
3. Verify ThermostatCard shows "Programmazione" section when connected to Netatmo
4. Verify current active schedule name is displayed
5. Click dropdown and select a different schedule
6. Verify "Applica" button appears
7. Click "Applica" and verify schedule switches (loading state shown)
8. Verify new schedule is reflected in the display
9. Run tests: `npm test -- --testPathPattern=ScheduleSection`
</verification>

<success_criteria>
- ScheduleSection component exists and exports default
- ThermostatCard shows schedule section after mode controls
- Active schedule name is visible in the card
- User can switch schedules via dropdown + Applica button
- Loading and error states are handled gracefully
- Unit tests pass
- No TypeScript/ESLint errors
</success_criteria>

<output>
After completion, create `.planning/quick/001-thermostat-schedule-view-and-edit-in-card/001-SUMMARY.md`
</output>
