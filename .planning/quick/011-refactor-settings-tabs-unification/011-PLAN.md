---
phase: quick
plan: 011
type: execute
wave: 1
depends_on: []
files_modified:
  - app/settings/page.js
  - lib/devices/deviceTypes.js
autonomous: true

must_haves:
  truths:
    - "User sees unified settings page with 4 tabs at /settings"
    - "Tab navigation preserves state within session"
    - "All original settings functionality works within tabs"
  artifacts:
    - path: "app/settings/page.js"
      provides: "Unified tabbed settings page"
      min_lines: 100
  key_links:
    - from: "app/settings/page.js"
      to: "Tabs component"
      via: "namespace import"
      pattern: "Tabs\\.List|Tabs\\.Trigger|Tabs\\.Content"
    - from: "lib/devices/deviceTypes.js"
      to: "/settings"
      via: "SETTINGS_MENU routes"
      pattern: "route.*settings"
---

<objective>
Unify Theme, Location, Dashboard, and Devices settings into a single tabbed page at /settings.

Purpose: Reduce navigation complexity. Currently 4 separate settings pages require multiple clicks - consolidating them into tabs improves UX while keeping complex pages (Notifications, Thermostat) separate.

Output: Single `/settings` page with Tabs component containing 4 tabs (Aspetto, Posizione, Dashboard, Dispositivi). Menu routes updated to point to `/settings?tab=X`.
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/components/ui/Tabs.js
@app/settings/theme/page.js
@app/settings/location/page.js
@app/settings/dashboard/page.js
@app/settings/devices/page.js
@app/components/SettingsLayout.js
@lib/devices/deviceTypes.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create unified settings page with Tabs</name>
  <files>app/settings/page.js</files>
  <action>
Create `app/settings/page.js` as unified tabbed settings page:

1. **Imports:**
   - Tabs from '@/app/components/ui/Tabs'
   - SettingsLayout from '@/app/components/SettingsLayout'
   - All hooks/components from the 4 existing pages (useUser, useTheme, useState, useEffect, etc.)
   - All UI components needed (Card, Button, Text, Heading, Banner, Badge, Switch, Toggle, Skeleton, LocationSearch)
   - lucide-react icons (ChevronUp, ChevronDown, Palette, MapPin, LayoutGrid, Smartphone)

2. **URL Tab Sync:**
   - Use useSearchParams to read `?tab=` query param
   - Use useRouter for tab navigation updates
   - Default tab: 'aspetto' (theme)
   - Tab values: 'aspetto', 'posizione', 'dashboard', 'dispositivi'

3. **Extract content from existing pages:**
   - ThemeContent: Extract lines 23-221 logic from theme/page.js (handleThemeChange, theme options)
   - LocationContent: Extract lines 24-163 logic from location/page.js (fetchLocation, handleLocationSelected)
   - DashboardContent: Extract lines 25-225 logic from dashboard/page.js (cards state, moveUp/Down, toggleVisibility, handleSave)
   - DevicesContent: Extract lines 23-258 logic from devices/page.js (fetchDevicePreferences, handleToggleDevice, handleSave)

4. **Page structure:**
```jsx
'use client';

// ... imports

// Tab content components (inline in same file for simplicity)
function ThemeContent() { /* from theme/page.js */ }
function LocationContent() { /* from location/page.js */ }
function DashboardContent() { /* from dashboard/page.js */ }
function DevicesContent() { /* from devices/page.js */ }

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();

  const currentTab = searchParams.get('tab') || 'aspetto';

  const handleTabChange = (value) => {
    router.push(`/settings?tab=${value}`, { scroll: false });
  };

  // Loading state
  if (userLoading) {
    return (
      <SettingsLayout title="Impostazioni" icon="⚙️">
        <Skeleton className="h-64 w-full" />
      </SettingsLayout>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <SettingsLayout title="Impostazioni" icon="⚙️">
        <Card variant="glass">
          <Text variant="secondary">Devi essere autenticato per accedere alle impostazioni.</Text>
        </Card>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Impostazioni" icon="⚙️">
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <Tabs.List>
          <Tabs.Trigger value="aspetto" icon={<Palette size={18} />}>Aspetto</Tabs.Trigger>
          <Tabs.Trigger value="posizione" icon={<MapPin size={18} />}>Posizione</Tabs.Trigger>
          <Tabs.Trigger value="dashboard" icon={<LayoutGrid size={18} />}>Dashboard</Tabs.Trigger>
          <Tabs.Trigger value="dispositivi" icon={<Smartphone size={18} />}>Dispositivi</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="aspetto"><ThemeContent /></Tabs.Content>
        <Tabs.Content value="posizione"><LocationContent /></Tabs.Content>
        <Tabs.Content value="dashboard"><DashboardContent /></Tabs.Content>
        <Tabs.Content value="dispositivi"><DevicesContent /></Tabs.Content>
      </Tabs>
    </SettingsLayout>
  );
}
```

5. **Content components adjustments:**
   - Remove SettingsLayout wrapper from each content component (parent already has it)
   - Keep all state management and API calls within each content component
   - Content components receive no props - they manage their own state

6. **Wrap page component with Suspense** for useSearchParams (Next.js requirement):
```jsx
import { Suspense } from 'react';

function SettingsPageContent() { /* main component */ }

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLayout title="Impostazioni" icon="⚙️"><Skeleton className="h-64 w-full" /></SettingsLayout>}>
      <SettingsPageContent />
    </Suspense>
  );
}
```
  </action>
  <verify>
`npm run dev` then visit:
- http://localhost:3000/settings - default tab (Aspetto) loads
- http://localhost:3000/settings?tab=posizione - Location tab loads
- http://localhost:3000/settings?tab=dashboard - Dashboard tab loads
- http://localhost:3000/settings?tab=dispositivi - Devices tab loads
- Tab indicator animates smoothly between tabs
- No console errors
  </verify>
  <done>
- Unified settings page exists at /settings
- All 4 tabs render their respective content
- URL query param syncs with active tab
- Tab switching is smooth with indicator animation
  </done>
</task>

<task type="auto">
  <name>Task 2: Update navigation routes and cleanup</name>
  <files>lib/devices/deviceTypes.js</files>
  <action>
Update SETTINGS_MENU in `lib/devices/deviceTypes.js` to point to unified page with tab params:

1. **Update routes:**
```js
DEVICES: {
  id: 'devices',
  name: 'Gestione Dispositivi',
  icon: '🏠',
  route: '/settings?tab=dispositivi',  // was: /settings/devices
  description: 'Abilita/disabilita dispositivi',
},
THEME: {
  id: 'theme',
  name: 'Tema',
  icon: '🎨',
  route: '/settings?tab=aspetto',  // was: /settings/theme
  description: 'Modalità chiara o scura',
},
LOCATION: {
  id: 'location',
  name: 'Posizione',
  icon: '📍',
  route: '/settings?tab=posizione',  // was: /settings/location
  description: 'Configura posizione meteo',
},
DASHBOARD: {
  id: 'dashboard',
  name: 'Personalizza home',
  icon: '🏠',
  route: '/settings?tab=dashboard',  // was: /settings/dashboard
  description: 'Ordine e visibilità card',
},
```

2. **Keep unchanged:**
- NOTIFICATIONS: stays at '/settings/notifications' (too complex to merge)
- THERMOSTAT: stays at '/settings/thermostat' (device-specific)
- All debug routes stay unchanged

3. **Old routes remain functional:**
- Do NOT delete app/settings/theme/page.js, app/settings/location/page.js, etc.
- They can serve as redirects or be removed in a later cleanup task
- For now, having both routes work is acceptable (no breaking change)
  </action>
  <verify>
1. `npm run dev`
2. Open menu dropdown
3. Click "Tema" - navigates to /settings?tab=aspetto
4. Click "Posizione" - navigates to /settings?tab=posizione
5. Click "Personalizza home" - navigates to /settings?tab=dashboard
6. Click "Gestione Dispositivi" - navigates to /settings?tab=dispositivi
7. Click "Gestione Notifiche" - still goes to /settings/notifications (separate page)
8. Click "Automazione Stufa" - still goes to /settings/thermostat (separate page)
  </verify>
  <done>
- Menu routes updated to use ?tab= params
- Navigation from menu goes directly to correct tab
- Notifications and Thermostat remain as separate pages
  </done>
</task>

</tasks>

<verification>
1. **Tab functionality:** Each tab shows correct content without errors
2. **URL sync:** Browser URL updates when switching tabs, direct URL access works
3. **State preservation:** Changing tabs doesn't lose unsaved changes within that tab
4. **Menu navigation:** All settings menu items link to correct tabs/pages
5. **Responsive:** Tabs work on mobile (horizontal scroll if needed)
6. **Accessibility:** Tab navigation works with keyboard (arrow keys)
</verification>

<success_criteria>
- [ ] `/settings` page loads with Tabs component
- [ ] 4 tabs visible: Aspetto, Posizione, Dashboard, Dispositivi
- [ ] Each tab renders its full content (theme toggle, location search, card reorder, device toggles)
- [ ] URL query param `?tab=X` syncs with active tab
- [ ] Menu dropdown routes to `/settings?tab=X` for the 4 merged pages
- [ ] Notifications and Thermostat still accessible at separate routes
- [ ] No console errors, no visual regressions
</success_criteria>

<output>
After completion, create `.planning/quick/011-refactor-settings-tabs-unification/011-SUMMARY.md`
</output>
