---
phase: quick-24
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/analytics/ConsentBanner.tsx
autonomous: true

must_haves:
  truths:
    - "Analytics consent banner appears above mobile hamburger menu"
    - "User can close consent banner on mobile devices"
    - "Close button is clickable on mobile"
  artifacts:
    - path: "app/components/analytics/ConsentBanner.tsx"
      provides: "GDPR consent banner with correct z-index"
      contains: "z-[9999]"
  key_links:
    - from: "app/components/analytics/ConsentBanner.tsx"
      to: "app/components/Navbar.tsx"
      via: "z-index layering hierarchy"
      pattern: "z-\\[9999\\].*fixed.*bottom"
---

<objective>
Fix analytics consent banner z-index layering so it appears above the mobile hamburger menu and is closable on mobile devices.

Purpose: The consent banner currently has z-index 50, while the mobile menu uses z-index 9000-9001, causing the banner to render behind the menu and making the close button inaccessible on mobile.

Output: Consent banner with correct z-index hierarchy that appears above all navigation elements.
</objective>

<execution_context>
@/Users/federicomanfredi/.claude/get-shit-done/workflows/execute-plan.md
@/Users/federicomanfredi/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/Users/federicomanfredi/Sites/localhost/pannello-stufa/.planning/PROJECT.md
@/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/components/analytics/ConsentBanner.tsx
@/Users/federicomanfredi/Sites/localhost/pannello-stufa/app/components/Navbar.tsx
</context>

<tasks>

<task type="auto">
  <name>Increase ConsentBanner z-index to appear above mobile menu</name>
  <files>app/components/analytics/ConsentBanner.tsx</files>
  <action>
Update the ConsentBanner component's z-index from z-50 to z-[9999] to ensure it renders above the mobile menu.

Current state:
- ConsentBanner: z-50 (line 59)
- Mobile menu overlay: z-[9000] (Navbar.tsx line 502)
- Mobile menu panel: z-[9001] (Navbar.tsx line 515)

Change:
Line 59: `className="fixed bottom-4 left-4 right-4 z-50 md:max-w-lg md:mx-auto"`
To: `className="fixed bottom-4 left-4 right-4 z-[9999] md:max-w-lg md:mx-auto"`

Why z-[9999]: Use a z-index above the mobile menu (9001) to ensure the consent banner always appears on top. Using 9999 provides clear separation and follows common practice for modal/overlay components that should appear above all other UI.

Do NOT change any other styling or functionality — only update the z-index value.
  </action>
  <verify>
1. Manual verification: Open dev server on mobile viewport, trigger consent banner, verify it appears above hamburger menu
2. Grep verification: `grep -n "z-\[9999\]" app/components/analytics/ConsentBanner.tsx` should return line 59
3. Visual check: Banner should not be obscured by mobile menu overlay/panel
  </verify>
  <done>
ConsentBanner uses z-[9999] and renders above mobile menu elements on all viewport sizes. Close button is accessible and clickable on mobile devices.
  </done>
</task>

</tasks>

<verification>
**Visual Test (Mobile Viewport):**
1. Open app in browser dev tools, set viewport to mobile (375x667)
2. Trigger consent banner (clear localStorage if needed: `localStorage.removeItem('analyticsConsent')`)
3. Open hamburger menu
4. Verify banner appears ABOVE the menu overlay and panel
5. Click "Only Essential" or "Accept Analytics" button
6. Verify banner closes successfully

**Code Verification:**
```bash
grep -A 2 "fixed bottom-4" app/components/analytics/ConsentBanner.tsx
```
Should show z-[9999] in className.

**Expected Behavior:**
- Banner visible and interactive on mobile
- Close buttons fully clickable
- No z-index conflicts with navigation
</verification>

<success_criteria>
- ConsentBanner.tsx updated with z-[9999]
- Banner appears above mobile menu (z-[9001])
- User can interact with banner buttons on mobile
- No visual regressions on desktop
- Code committed to git
</success_criteria>

<output>
After completion, create `.planning/quick/24-il-banner-di-analytics-su-mobile-appare-/24-SUMMARY.md`
</output>
