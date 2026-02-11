---
phase: quick-23
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/Navbar.tsx
  - app/components/__tests__/Navbar.test.tsx
autonomous: true

must_haves:
  truths:
    - "Hamburger menu button is visible on both mobile and desktop viewports"
    - "Desktop navigation (device dropdowns, settings, user) still visible alongside hamburger"
    - "Mobile menu overlay opens when clicking hamburger on desktop"
  artifacts:
    - path: "app/components/Navbar.tsx"
      provides: "Hamburger button visible at all breakpoints"
      min_lines: 680
  key_links:
    - from: "app/components/Navbar.tsx"
      to: "Mobile menu state"
      via: "mobileMenuOpen state toggles menu visibility"
      pattern: "setMobileMenuOpen"
---

<objective>
Make hamburger menu button visible on desktop alongside existing navigation elements.

Purpose: Provide consistent navigation pattern across all device sizes
Output: Hamburger menu accessible on both mobile and desktop viewports
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@app/components/Navbar.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove lg:hidden from hamburger button to show on all viewports</name>
  <files>app/components/Navbar.tsx</files>
  <action>
1. Locate the hamburger menu button (around line 465-487)
2. Remove the `lg:hidden` class from the button element
3. Keep all other styling and functionality intact
4. The button should remain in the same position (right side after user dropdown)
5. Existing desktop navigation (device dropdowns, settings, user) should remain visible
6. Mobile menu overlay functionality remains unchanged - works on both mobile and desktop

Current structure:
- Desktop (lg+): Logo | Device dropdowns | Settings | User | [Hidden Hamburger]
- Mobile: Logo | [Visible Hamburger]

New structure:
- Desktop (lg+): Logo | Device dropdowns | Settings | User | [Visible Hamburger]
- Mobile: Logo | [Visible Hamburger]

Do NOT modify:
- Desktop navigation elements visibility
- Mobile menu overlay behavior
- Button styling or icon
- Mobile bottom navigation bar
  </action>
  <verify>
1. Check that hamburger button no longer has `lg:hidden` class:
   ```bash
   grep -A 10 "Mobile Hamburger Button" app/components/Navbar.tsx | grep -v "lg:hidden"
   ```
2. Verify button is in the "User & Menu Buttons" section (should be visible on all viewports)
  </verify>
  <done>
- Hamburger button visible on all viewport sizes (no lg:hidden class)
- Desktop navigation elements remain visible and functional
- Mobile menu overlay opens when clicking hamburger on any viewport size
  </done>
</task>

<task type="auto">
  <name>Task 2: Update Navbar tests for desktop hamburger visibility</name>
  <files>app/components/__tests__/Navbar.test.tsx</files>
  <action>
Update test expectations to reflect hamburger button being visible on all viewports:

1. Locate tests that check hamburger button visibility
2. Update assertions to expect button to be visible regardless of viewport size
3. Add test case verifying hamburger button is present alongside desktop navigation elements

If test file doesn't exist or doesn't cover hamburger visibility, skip this task (test will be covered by integration tests).
  </action>
  <verify>
   ```bash
   npm test -- Navbar.test.tsx --passWithNoTests
   ```
  </verify>
  <done>
- Test expectations updated for hamburger visibility on all viewports
- All Navbar tests passing
  </done>
</task>

</tasks>

<verification>
Manual verification:
1. Run `npm run dev` (or check already running instance)
2. Open browser at localhost:3000
3. Desktop viewport (>1024px): Verify hamburger button appears after user dropdown
4. Click hamburger on desktop: Mobile menu overlay should open
5. Mobile viewport (<1024px): Verify hamburger still works as before
6. Verify desktop navigation (dropdowns) remains visible and functional
</verification>

<success_criteria>
- Hamburger menu button visible on both desktop and mobile viewports
- Desktop navigation elements (device dropdowns, settings, user) still visible on lg+ screens
- Mobile menu overlay opens when clicking hamburger on any viewport size
- No visual regression in navigation appearance
- All tests passing
</success_criteria>

<output>
After completion, create `.planning/quick/23-fai-in-modo-che-anche-su-desktop-ci-sia-/23-SUMMARY.md`
</output>
