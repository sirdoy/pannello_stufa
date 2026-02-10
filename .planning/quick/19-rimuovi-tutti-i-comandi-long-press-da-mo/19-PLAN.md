---
phase: 19-rimuovi-long-press
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/ui/DeviceCard.tsx
  - app/components/devices/stove/StoveCard.tsx
  - app/components/ui/ControlButton.tsx
  - app/components/ui/__tests__/ControlButton.test.tsx
  - app/hooks/useLongPress.ts
  - app/hooks/__tests__/useLongPress.test.ts
  - app/hooks/useContextMenuLongPress.ts
  - app/debug/design-system/page.tsx
autonomous: true

must_haves:
  truths:
    - "Device cards no longer respond to long-press on mobile (no context menu trigger, no scale animation)"
    - "Device cards still show right-click context menu on desktop (Radix native behavior preserved)"
    - "ControlButton responds to single tap/click only, no repeat-on-hold behavior"
    - "All existing unit tests pass (updated to reflect new behavior)"
    - "No TypeScript errors introduced"
  artifacts:
    - path: "app/components/ui/DeviceCard.tsx"
      provides: "DeviceCard without long-press handlers"
    - path: "app/components/devices/stove/StoveCard.tsx"
      provides: "StoveCard without long-press handlers"
    - path: "app/components/ui/ControlButton.tsx"
      provides: "ControlButton with simple onClick instead of useLongPress"
  key_links:
    - from: "app/components/ui/DeviceCard.tsx"
      to: "app/components/ui/RightClickMenu.tsx"
      via: "Radix context menu (right-click only, no long-press trigger)"
    - from: "app/components/devices/stove/StoveCard.tsx"
      to: "app/components/ui/RightClickMenu.tsx"
      via: "Radix context menu (right-click only, no long-press trigger)"
---

<objective>
Remove all long-press interactions from mobile: both context-menu long-press (useContextMenuLongPress) and control-button long-press (useLongPress).

Purpose: Long-press on mobile causes accidental triggers and conflicts with native OS gestures. Desktop right-click context menus (via Radix) are preserved.
Output: Clean components with no long-press behavior, deleted hook files, updated tests.
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/components/ui/DeviceCard.tsx
@app/components/devices/stove/StoveCard.tsx
@app/components/ui/ControlButton.tsx
@app/hooks/useContextMenuLongPress.ts
@app/hooks/useLongPress.ts
@app/components/ui/__tests__/ControlButton.test.tsx
@app/hooks/__tests__/useLongPress.test.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove context-menu long-press from DeviceCard and StoveCard</name>
  <files>
    app/components/ui/DeviceCard.tsx
    app/components/devices/stove/StoveCard.tsx
    app/hooks/useContextMenuLongPress.ts
    app/hooks/__tests__/useLongPress.test.ts
    app/debug/design-system/page.tsx
  </files>
  <action>
**DeviceCard.tsx:**
1. Remove import of `useContextMenuLongPress` and `longPressPreventSelection` (line 14)
2. Remove `import type { CSSProperties }` from React import if no longer needed (line 3 - check if CSSProperties is used elsewhere)
3. Remove the `useContextMenuLongPress` hook call (lines 130-132): `const { bind: longPressBind, isPressed } = useContextMenuLongPress(...)`
4. Replace `contextMenuProps` block (lines 220-230) with just the role override:
   ```tsx
   const contextMenuProps = hasContextMenu
     ? { role: '' } // Override Radix's role="button" to fix accessibility error
     : {};
   ```
   This removes `longPressBind()`, `longPressPreventSelection`, `isPressed` scale transform, and the transition style.
5. Keep ALL RightClickMenu wrapping intact (lines 321-342) - desktop right-click still works via Radix.

**StoveCard.tsx:**
1. Remove import of `useContextMenuLongPress` and `longPressPreventSelection` (line 32)
2. Remove the hook call (lines 916-918): `const { bind: longPressBind, isPressed } = useContextMenuLongPress(...)`
3. Remove `contextMenuOpen` state (line 915) - it was only used by the long-press callback
4. On the status display div (line 1081-1087), remove:
   - `{...longPressBind()}` (line 1082)
   - `...longPressPreventSelection` from style (line 1084)
   - `transform: isPressed ? 'scale(0.98)' : 'scale(1)'` from style (line 1085)
   - `transition: 'transform 150ms ...'` from style (line 1086)
   The div should keep its className and `data-status-variant` attribute. Remove the `style` prop entirely if it becomes empty.
5. Keep ALL RightClickMenu structure intact (lines 964, 1060-1161, 1460-1476) - desktop right-click still works.

**app/debug/design-system/page.tsx:**
1. Remove the unused import (line 40): `import { useContextMenuLongPress, longPressPreventSelection } from '@/app/hooks/useContextMenuLongPress';`

**Delete hook files:**
1. Delete `app/hooks/useContextMenuLongPress.ts` - no remaining consumers after above changes
2. Delete `app/hooks/__tests__/useLongPress.test.ts` - tests for the useLongPress hook being deleted in Task 2

Note: Do NOT delete `use-long-press` npm package from package.json (per project rule: NEVER run npm install). The package can be cleaned up separately.
  </action>
  <verify>
Run `npx tsc --noEmit 2>&1 | head -30` to confirm no TypeScript errors from removed imports/usage. Grep for `useContextMenuLongPress` and `longPressPreventSelection` in app/ directory to confirm zero remaining usage in source files.
  </verify>
  <done>
DeviceCard and StoveCard no longer import or use useContextMenuLongPress. The long-press scale animation and touch handlers are removed. RightClickMenu structure preserved for desktop right-click. useContextMenuLongPress hook file deleted. Design system page cleaned of unused import.
  </done>
</task>

<task type="auto">
  <name>Task 2: Replace ControlButton long-press with simple click and update tests</name>
  <files>
    app/components/ui/ControlButton.tsx
    app/components/ui/__tests__/ControlButton.test.tsx
    app/hooks/useLongPress.ts
  </files>
  <action>
**ControlButton.tsx:**
1. Remove import of `useLongPress` (line 8): `import { useLongPress } from '@/app/hooks/useLongPress';`
2. Remove these props from `ControlButtonProps` interface:
   - `longPressDelay?: number;` (line 115)
   - `longPressInterval?: number;` (line 117)
   - `haptic?: boolean;` (line 119)
3. Remove these from destructured props (lines 138-140):
   - `longPressDelay = 400,`
   - `longPressInterval = 100,`
   - `haptic = true,`
4. Remove the `useLongPress` hook call (lines 165-169):
   ```tsx
   const longPressHandlers = useLongPress(handlePress, {
     delay: longPressDelay,
     interval: longPressInterval,
     haptic,
   });
   ```
5. Replace the event handlers logic (lines 178):
   - Remove: `const eventHandlers = disabled ? {} : longPressHandlers;`
   - The button should use a simple `onClick={disabled ? undefined : handlePress}` prop instead of spreading event handlers
6. Update the button element (line 187):
   - Remove: `{...eventHandlers}`
   - Add: `onClick={disabled ? undefined : handlePress}`
7. Keep the `handlePress` function as-is (it already handles both legacy onClick and onChange).
8. Keep `onClick` prop in the interface (it's the legacy prop).

**ControlButton.test.tsx:**
1. Remove the entire `describe('Long Press Behavior', ...)` block (lines 194-281) - these 4 tests test long-press repeat which no longer exists
2. Remove the entire `describe('Haptic Feedback', ...)` block (lines 317-348) - haptic was tied to long-press
3. Update `describe('onChange with Step', ...)` tests (lines 144-192):
   - Change `fireEvent.mouseDown(button); fireEvent.mouseUp(button);` to `fireEvent.click(button);` in all 4 tests
4. Update `describe('Legacy onClick Support', ...)` test (lines 351-367):
   - Change `fireEvent.mouseDown(button); fireEvent.mouseUp(button);` to `fireEvent.click(button);`
5. Remove `longPressDelay` and `longPressInterval` props from any remaining test renders if present

**Delete hook file:**
1. Delete `app/hooks/useLongPress.ts` - no remaining consumers after ControlButton change
  </action>
  <verify>
Run `npm test -- --testPathPattern="ControlButton" --no-coverage 2>&1 | tail -20` to confirm all remaining ControlButton tests pass. Run `npx tsc --noEmit 2>&1 | head -30` for type check. Grep for `useLongPress` in `app/` (excluding .planning/) to confirm zero remaining source usage.
  </verify>
  <done>
ControlButton uses simple onClick instead of long-press handlers. Props longPressDelay, longPressInterval, haptic removed from interface. Tests updated: long-press and haptic test blocks removed, click-based tests use fireEvent.click. useLongPress hook file deleted. All remaining tests pass.
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` - zero errors
2. `npm test -- --testPathPattern="ControlButton" --no-coverage` - all tests pass
3. Grep `useContextMenuLongPress` in `app/` - zero matches in source files
4. Grep `useLongPress` in `app/` (excluding hooks dir) - zero matches in source files
5. Grep `longPressDelay|longPressInterval` in `app/components/` - zero matches
6. Verify `app/hooks/useLongPress.ts` does not exist
7. Verify `app/hooks/useContextMenuLongPress.ts` does not exist
8. Verify `app/hooks/__tests__/useLongPress.test.ts` does not exist
</verification>

<success_criteria>
- All long-press behavior removed from DeviceCard, StoveCard, and ControlButton
- RightClickMenu preserved on all cards (desktop right-click works via Radix)
- ControlButton fires once on tap/click, no repeat-on-hold
- Three hook/test files deleted: useLongPress.ts, useContextMenuLongPress.ts, useLongPress.test.ts
- Design system page unused import removed
- TypeScript compiles cleanly
- ControlButton tests pass with updated assertions
</success_criteria>

<output>
After completion, create `.planning/quick/19-rimuovi-tutti-i-comandi-long-press-da-mo/19-SUMMARY.md`
</output>
