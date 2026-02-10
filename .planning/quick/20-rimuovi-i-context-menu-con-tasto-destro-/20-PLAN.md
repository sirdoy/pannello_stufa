---
phase: 20-rimuovi-context-menu
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/ui/DeviceCard.tsx
  - app/components/ui/index.ts
  - app/components/ui/__tests__/DeviceCard.test.tsx
  - app/components/ui/__tests__/RightClickMenu.test.tsx
  - app/components/ui/RightClickMenu.tsx
  - app/components/devices/stove/StoveCard.tsx
  - app/components/devices/thermostat/ThermostatCard.tsx
  - app/components/devices/lights/LightsCard.tsx
  - app/components/devices/camera/CameraCard.tsx
  - app/debug/design-system/page.tsx
autonomous: true

must_haves:
  truths:
    - "Right-clicking on any device card (Stove, Thermostat, Lights, Camera) shows the browser default context menu, NOT a custom context menu"
    - "All device cards render their content correctly without RightClickMenu wrapper"
    - "RightClickMenu component file and test file are deleted"
    - "No TypeScript errors (tsc passes)"
    - "All existing tests pass (minus deleted context menu tests)"
  artifacts:
    - path: "app/components/ui/DeviceCard.tsx"
      provides: "DeviceCard without context menu props or RightClickMenu wrapper"
      contains: "cardContent"
    - path: "app/components/devices/stove/StoveCard.tsx"
      provides: "StoveCard without RightClickMenu wrapper"
  key_links:
    - from: "app/components/devices/thermostat/ThermostatCard.tsx"
      to: "app/components/ui/DeviceCard.tsx"
      via: "DeviceCard props (no contextMenuItems)"
      pattern: "<DeviceCard"
---

<objective>
Remove all right-click context menus from device cards across the application.

Purpose: Context menus are no longer wanted on device cards. This removes the RightClickMenu usage from DeviceCard (shared wrapper), StoveCard (has its own RightClickMenu), and all card components that pass contextMenuItems. The RightClickMenu component itself is deleted since no other production code uses it (only the design-system debug page, which will also be cleaned).

Output: Clean device cards with no context menu functionality, deleted RightClickMenu component and tests, passing test suite.
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/components/ui/DeviceCard.tsx
@app/components/ui/RightClickMenu.tsx
@app/components/ui/index.ts
@app/components/ui/__tests__/DeviceCard.test.tsx
@app/components/ui/__tests__/RightClickMenu.test.tsx
@app/components/devices/stove/StoveCard.tsx
@app/components/devices/thermostat/ThermostatCard.tsx
@app/components/devices/lights/LightsCard.tsx
@app/components/devices/camera/CameraCard.tsx
@app/debug/design-system/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove RightClickMenu from DeviceCard and all consumer cards</name>
  <files>
    app/components/ui/DeviceCard.tsx
    app/components/devices/stove/StoveCard.tsx
    app/components/devices/thermostat/ThermostatCard.tsx
    app/components/devices/lights/LightsCard.tsx
    app/components/devices/camera/CameraCard.tsx
  </files>
  <action>
**DeviceCard.tsx:**
1. Remove `import RightClickMenu from './RightClickMenu'` (line 13)
2. Remove the `export interface ContextMenuItem` block (lines 16-22)
3. Remove `contextMenuItems?: ContextMenuItem[]` and `onContextMenu?: () => void` from `DeviceCardProps` (lines 89-91, including the comment on line 89)
4. Remove `contextMenuItems = []` and `onContextMenu` from destructured props (lines 122-123, including the comment on line 121)
5. Remove `const hasContextMenu = contextMenuItems && contextMenuItems.length > 0` (line 210)
6. Remove `const contextMenuProps = hasContextMenu ? { role: '' } : {}` block (lines 212-217)
7. Remove `{...contextMenuProps}` from SmartHomeCard props (line 231)
8. Replace the conditional rendering block (lines 308-332) that wraps `cardContent` in `RightClickMenu` with just `{cardContent}` directly. The return should become:
   ```tsx
   return (
     <>
       {cardContent}
       {/* Toast Notification - rendered outside SmartHomeCard */}
       {toast?.show && (
         <Toast {...(toast as any)} onClose={onToastClose} />
       )}
     </>
   );
   ```

**StoveCard.tsx:**
1. Remove `import RightClickMenu from '../../ui/RightClickMenu'` (line 28)
2. Remove the entire `stoveContextMenuItems` array (lines 913-931)
3. Remove `<RightClickMenu>` opening tag (line 957). The `<Card>` on line 958 should remain as-is, becoming a direct child of the `<div>` parent.
4. Remove `<RightClickMenu.Trigger asChild>` opening tag (line 1073). The inner `<div>` on line 1074 remains.
5. Remove `</RightClickMenu.Trigger>` closing tag (line 1147). The inner `</div>` on line 1146 (or nearby) remains.
6. Remove the entire `<RightClickMenu.Content>...</RightClickMenu.Content>` block (lines 1447-1462)
7. Remove `</RightClickMenu>` closing tag (line 1463)
8. Remove unused lucide-react imports: `Settings`, `Activity`, `RefreshCw` from the import on line 6. Keep `Plus` and `Minus`.
9. Remove the comment on line 956 ("Main Status Card - Ember Noir with Context Menu" -> "Main Status Card - Ember Noir")

**ThermostatCard.tsx:**
1. Remove the `thermostatContextMenuItems` array (lines 455-472)
2. Remove `contextMenuItems={thermostatContextMenuItems as any}` from DeviceCard props (line 489)
3. Remove unused lucide-react imports: `Settings`, `Calendar`, `RefreshCw` from the import on line 5. Keep `Plus` and `Minus`.

**LightsCard.tsx:**
1. Remove the `lightsContextMenuItems` array (lines 841-858)
2. Remove `contextMenuItems={lightsContextMenuItems as any}` from DeviceCard props (line 877)
3. Remove unused lucide-react imports: `Palette`, `Settings`, `RefreshCw` from the import on line 5. This should leave the import empty and thus should be deleted entirely if no other lucide icons are imported on that line.

**CameraCard.tsx:**
1. Remove the `cameraContextMenuItems` array (lines 247-264)
2. Remove `contextMenuItems={cameraContextMenuItems}` from DeviceCard props (line 281)
3. Remove unused lucide-react imports: `Activity`, `Settings` from the import on line 5. Keep `RefreshCw` (used at line 374 for refresh button).
  </action>
  <verify>
Run `npx tsc --noEmit 2>&1 | head -30` to confirm no TypeScript errors in modified files.
Grep to confirm no remaining references: `grep -r "contextMenuItems\|RightClickMenu" app/components/devices/ app/components/ui/DeviceCard.tsx` should return nothing.
  </verify>
  <done>All five card files are clean of context menu code. No contextMenuItems props, no RightClickMenu wrappers, no unused imports. TypeScript compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Delete RightClickMenu component and clean up tests and exports</name>
  <files>
    app/components/ui/RightClickMenu.tsx
    app/components/ui/__tests__/RightClickMenu.test.tsx
    app/components/ui/__tests__/DeviceCard.test.tsx
    app/components/ui/index.ts
    app/debug/design-system/page.tsx
  </files>
  <action>
**Delete files:**
1. Delete `app/components/ui/RightClickMenu.tsx`
2. Delete `app/components/ui/__tests__/RightClickMenu.test.tsx`

**index.ts:**
Remove the RightClickMenu export line (line 70): `export { default as RightClickMenu, RightClickMenuTrigger, RightClickMenuContent, RightClickMenuItem, RightClickMenuCheckboxItem, RightClickMenuSeparator, RightClickMenuLabel, RightClickMenuGroup } from './RightClickMenu';`
Also remove the comment on line 69: `// RightClickMenu (v4.0+)`

**DeviceCard.test.tsx:**
Remove the entire `describe('Context Menu (v4.0)')` block (lines 720-774). This removes 4 tests:
- "renders without context menu when contextMenuItems is empty"
- "renders with context menu when contextMenuItems is provided"
- "maintains backwards compatibility without contextMenuItems"
- "has no a11y violations with context menu"

Also check if `Settings` or `RefreshCw` imports at the top of the test file become unused after removing these tests, and remove them if so.

**design-system/page.tsx:**
Remove the `import RightClickMenu` statement (line 36). Remove the entire RightClickMenu showcase section (lines ~1847-1888) which includes the "RightClickMenu (Context Menu)" demo. Also check if `Edit`, `Copy`, `Share`, `Trash2` lucide imports become unused after this removal and remove them if so.
  </action>
  <verify>
1. Confirm files deleted: `ls app/components/ui/RightClickMenu.tsx 2>&1` should say "No such file"
2. Confirm no remaining references: `grep -r "RightClickMenu" app/ --include="*.tsx" --include="*.ts"` should return nothing (except possibly .backup files which are fine)
3. Run tests: `npx jest app/components/ui/__tests__/DeviceCard.test.tsx --no-coverage 2>&1 | tail -5` should show all tests passing
4. Run `npx tsc --noEmit 2>&1 | head -30` should show no errors
  </verify>
  <done>RightClickMenu component and test file deleted. DeviceCard tests updated (context menu describe block removed). index.ts export cleaned. Design system page cleaned. No remaining references to RightClickMenu in any .ts/.tsx file. All tests pass, TypeScript compiles cleanly.</done>
</task>

</tasks>

<verification>
1. `grep -r "RightClickMenu\|contextMenuItems\|ContextMenuItem" app/ --include="*.ts" --include="*.tsx"` returns only ContextMenu.tsx (separate component, unrelated) - no device card references
2. `npx tsc --noEmit` passes with 0 errors
3. `npx jest app/components/ui/__tests__/DeviceCard.test.tsx --no-coverage` passes
4. `npx jest app/components/devices/ --no-coverage` passes (no regressions in device card tests)
5. Right-clicking on any device card in the browser shows default browser context menu
</verification>

<success_criteria>
- Zero references to RightClickMenu in production code (app/**/*.tsx, app/**/*.ts excluding .backup files)
- Zero contextMenuItems props passed to any DeviceCard
- RightClickMenu.tsx and RightClickMenu.test.tsx deleted
- ContextMenuItem interface removed from DeviceCard.tsx
- All existing tests pass (minus the 4 deleted context menu tests)
- TypeScript compiles with no errors
</success_criteria>

<output>
After completion, create `.planning/quick/20-rimuovi-i-context-menu-con-tasto-destro-/20-SUMMARY.md`
</output>
