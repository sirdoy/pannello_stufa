---
quick: 003
type: execute
files_modified:
  - app/components/ui/Button.js
  - app/hooks/useHaptic.js
  - app/hooks/__tests__/useHaptic.test.js
  - app/layout.js
  - public/manifest.json
autonomous: true
estimated_context: 25%

must_haves:
  truths:
    - "Button clicks trigger haptic feedback on supported devices"
    - "Haptic patterns vary by button variant (ember=success, danger=warning)"
    - "iOS PWA has viewport-fit=cover for notch support"
    - "Touch actions optimized for instant response"
  artifacts:
    - path: "app/hooks/useHaptic.js"
      provides: "Reusable haptic hook wrapping vibration.js"
    - path: "app/components/ui/Button.js"
      provides: "Button with haptic feedback on click"
  key_links:
    - from: "app/hooks/useHaptic.js"
      to: "lib/pwa/vibration.js"
      via: "import vibrateShort, vibrateSuccess"
    - from: "app/components/ui/Button.js"
      to: "app/hooks/useHaptic.js"
      via: "useHaptic hook"
---

<objective>
Enhance iOS PWA experience with expanded haptic feedback and iOS-specific optimizations.

Purpose: Make the PWA feel more native on iOS with tactile feedback on button presses and proper viewport handling for modern iPhones with notches/Dynamic Island.

Output: useHaptic hook, Button component with haptic feedback, iOS viewport optimizations
</objective>

<context>
@lib/pwa/vibration.js - Existing vibration service with patterns (SHORT, SUCCESS, WARNING, etc.)
@app/hooks/useLongPress.js - Example of haptic integration (uses vibrateShort)
@app/components/ui/Button.js - Button component to enhance with haptic
@app/layout.js - Layout with iOS meta tags
@public/manifest.json - PWA manifest
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create useHaptic hook and integrate with Button</name>
  <files>
    app/hooks/useHaptic.js
    app/hooks/__tests__/useHaptic.test.js
    app/hooks/index.js
    app/components/ui/Button.js
  </files>
  <action>
Create `app/hooks/useHaptic.js`:
- Export useHaptic(pattern?) hook that returns a trigger function
- Pattern defaults to 'short', accepts: 'short', 'success', 'warning', 'error'
- Import from lib/pwa/vibration.js (vibrateShort, vibrateSuccess, etc.)
- Return { trigger, isSupported } where trigger() fires the haptic
- Memoize trigger to avoid re-renders

Create basic test file `app/hooks/__tests__/useHaptic.test.js`:
- Test hook returns trigger function
- Test trigger calls correct vibration function

Export from `app/hooks/index.js` barrel (add useHaptic to existing exports).

Update `app/components/ui/Button.js`:
- Import useHaptic from '@/app/hooks/useHaptic'
- Add optional `haptic` prop (boolean, default: true)
- Add optional `hapticPattern` prop ('short' | 'success' | 'warning' | 'error', default based on variant)
- Default hapticPattern mapping: ember/success variants -> 'short', danger -> 'warning', others -> 'short'
- In Button component, call useHaptic with the resolved pattern
- Wrap existing onClick in a handler that calls haptic.trigger() then original onClick
- If haptic=false, skip haptic feedback
- Do NOT break existing functionality - onClick must still work
  </action>
  <verify>
Run: `npm test -- --testPathPattern="useHaptic" --passWithNoTests`
Run: `npm test -- --testPathPattern="Button" --passWithNoTests`
Manually test: Import Button in a test page, click should log vibration (or vibrate on mobile)
  </verify>
  <done>
- useHaptic hook exists and exports trigger function
- Button component has haptic prop and calls vibration on click
- Existing Button tests still pass
- No breaking changes to Button API
  </done>
</task>

<task type="auto">
  <name>Task 2: iOS viewport and touch optimizations</name>
  <files>
    app/layout.js
    app/globals.css
    public/manifest.json
  </files>
  <action>
Update `app/layout.js` viewport export:
- Add viewportFit: 'cover' to enable safe-area-inset support for notch/Dynamic Island
- Keep existing width, initialScale, maximumScale, userScalable values

In head section of layout.js:
- Verify apple-mobile-web-app-status-bar-style is 'black-translucent' (already present, confirm)

Update `app/globals.css`:
- Add `touch-action: manipulation;` to interactive elements (buttons, inputs, links)
- This prevents 300ms tap delay on older iOS versions
- Add to base layer: `button, a, input, select, textarea { touch-action: manipulation; }`
- Add safe-area padding utility if not present:
  `.safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }`
  `.safe-area-top { padding-top: env(safe-area-inset-top); }`

Update `public/manifest.json`:
- Verify display: "standalone" (already present)
- No changes needed - manifest is already well-configured

Note: Siri Shortcuts integration is NOT feasible for PWAs - iOS does not allow web apps to register as Siri Shortcut providers. The existing manifest shortcuts (long-press icon on home screen) are the maximum PWA capability. Do NOT attempt to add Siri integration.
  </action>
  <verify>
Run: `npm run dev`
Inspect layout.js - viewport should have viewportFit: 'cover'
Inspect globals.css - touch-action: manipulation should be present
Test on iOS simulator or device: tap should be instant, no 300ms delay
  </verify>
  <done>
- viewport.viewportFit = 'cover' in layout.js
- touch-action: manipulation in globals.css
- safe-area CSS utilities available
- No 300ms tap delay on iOS
  </done>
</task>

</tasks>

<verification>
1. Run full test suite: `npm test`
2. Verify Button haptic: import Button, click it, verify vibration.js is called
3. On iOS device/simulator: verify instant tap response, proper notch handling
4. No TypeScript errors, no console errors
</verification>

<success_criteria>
- useHaptic hook created and exported
- Button component has haptic feedback on click
- iOS viewport optimizations applied
- All existing tests pass
- No breaking changes to existing components
</success_criteria>

<output>
After completion, create `.planning/quick/003-ios-pwa-haptic-siri-shortcuts/003-SUMMARY.md`
</output>
