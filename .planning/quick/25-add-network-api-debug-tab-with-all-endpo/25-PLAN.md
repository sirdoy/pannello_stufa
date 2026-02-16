---
phase: quick-25
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/debug/components/tabs/NetworkTab.tsx
  - app/debug/page.tsx
autonomous: true

must_haves:
  truths:
    - "Network tab appears as 9th tab in debug console with Wifi icon"
    - "All Fritz!Box API endpoints are displayed organized into logical sections"
    - "GET endpoints can be individually refreshed and show JSON responses"
    - "POST endpoints (auth) show input fields and can be executed"
    - "Auto-refresh and manual refresh work like all other tabs"
    - "Keyboard shortcut 9 switches to the Network tab"
  artifacts:
    - path: "app/debug/components/tabs/NetworkTab.tsx"
      provides: "Network API debug tab component"
      min_lines: 150
    - path: "app/debug/page.tsx"
      provides: "Updated debug page with 9th tab"
      contains: "NetworkTab"
  key_links:
    - from: "app/debug/page.tsx"
      to: "app/debug/components/tabs/NetworkTab.tsx"
      via: "import and Tabs.Content"
      pattern: "import NetworkTab"
    - from: "app/debug/components/tabs/NetworkTab.tsx"
      to: "/api/fritzbox/*"
      via: "fetch calls to proxy routes"
      pattern: "fetch.*api/fritzbox"
---

<objective>
Add a "Network" tab to the debug console that displays all Fritz!Box Network Monitor API endpoints organized into logical sections (Health, Devices, Bandwidth, WAN, History, Auth, Vendor), using the same EndpointCard/PostEndpointCard patterns as existing tabs.

Purpose: Give developers a single debug view to test all network-related API endpoints, matching the existing debug console UX.
Output: NetworkTab.tsx component + updated debug page with 9 tabs.
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/debug/page.tsx
@app/debug/components/ApiTab.tsx
@app/debug/components/tabs/WeatherTab.tsx
@app/debug/components/tabs/StoveTab.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create NetworkTab component</name>
  <files>app/debug/components/tabs/NetworkTab.tsx</files>
  <action>
Create `app/debug/components/tabs/NetworkTab.tsx` following the exact same pattern as `WeatherTab.tsx` and `StoveTab.tsx`.

The component receives `{ autoRefresh: boolean; refreshTrigger: number }` props.

State management (same as StoveTab):
- `getResponses: Record<string, any>` for GET responses
- `postResponses: Record<string, any>` for POST responses
- `loadingGet: Record<string, boolean>` for GET loading states
- `loadingPost: Record<string, boolean>` for POST loading states
- `timings: Record<string, number>` for response timings
- `copiedUrl: string | null` for copy feedback

Constants:
- `EXTERNAL_BASE = 'https://pdupun8zpr7exw43.myfritz.net'`

Helper functions (copy from WeatherTab pattern):
- `copyUrlToClipboard(url: string)` — copies and sets copiedUrl with 2s timeout
- `fetchGetEndpoint(name: string, url: string)` — useCallback, sets loading/timing/response
- `callPostEndpoint(name: string, url: string, body: any)` — sets loading/timing/postResponse
- `fetchAllGetEndpoints()` — calls fetchGetEndpoint for all GET endpoints

Lifecycle hooks (same as WeatherTab):
- Initial fetch via useEffect on fetchAllGetEndpoints
- refreshTrigger effect
- autoRefresh 5s interval effect

Organize endpoints into sections using `<Heading level={2} size="lg">` with emoji prefixes (matching WeatherTab style). Each section wraps endpoints in `<div className="space-y-3">`.

**Section 1: Health**
```tsx
<EndpointCard
  name="Health Check"
  url="/api/fritzbox/health"
  externalUrl={`${EXTERNAL_BASE}/health`}
  response={getResponses.health}
  loading={loadingGet.health ?? false}
  timing={timings.health}
  onRefresh={() => fetchGetEndpoint('health', '/api/fritzbox/health')}
  onCopyUrl={() => copyUrlToClipboard(`${EXTERNAL_BASE}/health`)}
  isCopied={copiedUrl === `${EXTERNAL_BASE}/health`}
/>
```

**Section 2: Devices**
- "Devices (Proxy)" — GET `/api/fritzbox/devices`, external `${EXTERNAL_BASE}/api/v1/devices`
- "Fritz!Box Devices" — GET `/api/fritzbox/devices`, external `${EXTERNAL_BASE}/api/v1/fritzbox/devices` (note: same proxy, different external reference)

**Section 3: Bandwidth**
- "Bandwidth (Deprecated)" — GET `/api/fritzbox/bandwidth`, external `${EXTERNAL_BASE}/api/v1/bandwidth`
- "Fritz!Box Bandwidth" — GET `/api/fritzbox/bandwidth`, external `${EXTERNAL_BASE}/api/v1/fritzbox/bandwidth`

**Section 4: WAN Status**
- "WAN Status (Deprecated)" — GET `/api/fritzbox/wan`, external `${EXTERNAL_BASE}/api/v1/wan`
- "Fritz!Box WAN" — GET `/api/fritzbox/wan`, external `${EXTERNAL_BASE}/api/v1/fritzbox/wan`

**Section 5: History**
- "Bandwidth History" — GET `/api/fritzbox/history?type=bandwidth`, external `${EXTERNAL_BASE}/api/v1/history/bandwidth?hours=24&page=1`
  - Note: if the proxy route uses a `type` query param, use that; if it calls different external endpoints for bandwidth vs devices history, reflect that. Based on the existing route at `/api/fritzbox/history`, it handles device events. Add a note that bandwidth history goes to the external API directly.
- "Device History" — GET `/api/fritzbox/history?range=24h`, external `${EXTERNAL_BASE}/api/v1/history/devices?hours=24&page=1`
- "Fritz!Box Bandwidth History" — external only `${EXTERNAL_BASE}/api/v1/fritzbox/history/bandwidth?hours=24&page=1` (no local proxy, show external URL)
- "Fritz!Box Device History" — external only `${EXTERNAL_BASE}/api/v1/fritzbox/history/devices?hours=24&page=1`

**Section 6: Vendor & Categories**
- "Vendor Lookup" — GET `/api/network/vendor-lookup?mac=AA:BB:CC:DD:EE:FF`, show as EndpointCard with a note about the MAC param
- "Category Override" — GET `/api/network/category-override`, external URL not applicable (local only)

**Section 7: Auth (External Only)**
Use an info box (same style as WeatherTab's info box) explaining these are external API endpoints, not proxied:
- "Auth Login" — PostEndpointCard, url `${EXTERNAL_BASE}/auth/login`, params: `[{ name: 'username', label: 'Username', type: 'text', defaultValue: '' }, { name: 'password', label: 'Password', type: 'password', defaultValue: '' }]`
- "List API Keys" — EndpointCard, url `${EXTERNAL_BASE}/auth/api-keys`, external URL same
- "Create API Key" — PostEndpointCard, url `${EXTERNAL_BASE}/auth/api-keys`, params: `[{ name: 'name', label: 'Key Name', type: 'text', defaultValue: '' }]`

For Auth endpoints, since they hit the external API directly (no proxy), the fetch will likely fail due to CORS. Add a note in an info box before the auth section: "Auth endpoints hit the external API directly. These may fail due to CORS restrictions — use them as URL references."

Add an info box at the top of the tab (same pattern as WeatherTab):
```tsx
<div className="bg-slate-800/50 [html:not(.dark)_&]:bg-slate-50 border border-slate-700 [html:not(.dark)_&]:border-slate-300 rounded-lg p-4">
  <Text variant="secondary" size="sm">
    Network API endpoints proxy to the Fritz!Box Home Network API at{' '}
    <code className="text-xs">{EXTERNAL_BASE}</code>. All proxy routes require Auth0 authentication.
    Devices endpoint is rate limited to 10 req/min with 60s cache.
  </Text>
</div>
```

Import from:
- `{ EndpointCard, PostEndpointCard }` from `@/app/debug/components/ApiTab`
- `Heading` from `@/app/components/ui/Heading`
- `Text` from `@/app/components/ui/Text`
- `{ useState, useEffect, useCallback }` from `react`
  </action>
  <verify>
File exists at `app/debug/components/tabs/NetworkTab.tsx`, exports default function `NetworkTab`, imports `EndpointCard` and `PostEndpointCard`, contains sections for Health, Devices, Bandwidth, WAN, History, Vendor, Auth. TypeScript compiles without errors (check with `npx tsc --noEmit app/debug/components/tabs/NetworkTab.tsx` or just visually verify the structure).
  </verify>
  <done>NetworkTab.tsx exists with all API endpoint sections, follows the exact same patterns as existing tabs (WeatherTab/StoveTab), uses EndpointCard/PostEndpointCard components, handles autoRefresh and refreshTrigger props.</done>
</task>

<task type="auto">
  <name>Task 2: Wire NetworkTab into debug page</name>
  <files>app/debug/page.tsx</files>
  <action>
Edit `app/debug/page.tsx` to add the 9th "Network" tab:

1. **Add import** (after the SchedulerTab import, line ~37):
```tsx
import NetworkTab from '@/app/debug/components/tabs/NetworkTab';
```

2. **Add Wifi icon import** — add `Wifi` to the lucide-react import on line 29:
```tsx
import { Flame, Thermometer, Lightbulb, Cloud, Database, Clock, FileText, Bell, Palette, RefreshCw, Wifi } from 'lucide-react';
```

3. **Update keyboard shortcuts** — in the `handleKeyDown` function (line ~304-313):
- Change the range check from `e.key <= '8'` to `e.key <= '9'`
- Add 'network' to the tabs array: `const tabs = ['stufa', 'netatmo', 'hue', 'weather', 'firebase', 'scheduler', 'log', 'notifiche', 'network'];`

4. **Update keyboard hint** — change the hint text on line ~372 from `1-8: Switch tabs` to `1-9: Switch tabs`

5. **Add tab trigger** (after the Notifiche trigger, line ~387):
```tsx
<Tabs.Trigger value="network" icon={<Wifi size={18} />}>Network</Tabs.Trigger>
```

6. **Add tab content** (after the notifiche Tabs.Content, line ~421):
```tsx
<Tabs.Content value="network">
  <div className="mt-6">
    <NetworkTab autoRefresh={autoRefresh} refreshTrigger={refreshTrigger} />
  </div>
</Tabs.Content>
```

7. **Update component comment** at top (line ~7-14) to include "Network: Fritz!Box Network Monitor API" in the list.
  </action>
  <verify>
Run `npm test -- --testPathPattern="debug" --passWithNoTests` to ensure no test regressions. Verify the file has 9 Tabs.Trigger elements and 9 Tabs.Content elements. Verify the keyboard shortcut array has 9 entries.
  </verify>
  <done>Debug page has 9 tabs. Network tab appears last with Wifi icon. Keyboard shortcut 9 switches to it. The tab renders NetworkTab component with autoRefresh and refreshTrigger props.</done>
</task>

</tasks>

<verification>
1. `app/debug/components/tabs/NetworkTab.tsx` exists and exports a default component
2. `app/debug/page.tsx` imports NetworkTab and renders it in a Tabs.Content
3. 9 Tabs.Trigger elements exist in the debug page
4. Keyboard shortcut range covers 1-9
5. All API sections present: Health, Devices, Bandwidth, WAN, History, Vendor, Auth
6. EndpointCard and PostEndpointCard used correctly with all required props
</verification>

<success_criteria>
- Network tab renders in the debug console as the 9th tab with Wifi icon
- All Fritz!Box API proxy endpoints (health, devices, bandwidth, wan, history) are testable via EndpointCard
- Vendor lookup and category override endpoints are included
- Auth endpoints shown as external-only with CORS warning
- Auto-refresh, manual refresh, and keyboard shortcut 9 all work
- No TypeScript errors introduced
</success_criteria>

<output>
After completion, create `.planning/quick/25-add-network-api-debug-tab-with-all-endpo/25-SUMMARY.md`
</output>
