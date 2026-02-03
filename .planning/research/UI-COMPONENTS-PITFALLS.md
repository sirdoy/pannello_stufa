# Pitfalls Research: Advanced UI Components

**Domain:** Smart Home Control PWA - Advanced UI Components
**Components:** Tabs, Accordion, Data Table, Command Palette, Context Menu, Popover, Sheet, Dialog
**Researched:** 2026-02-03
**Overall Confidence:** HIGH (based on Radix UI official docs, verified issues, and project-specific knowledge)

## Executive Summary

This research identifies **25 pitfalls** across accessibility, performance, and mobile/PWA compatibility for advanced UI components. The project's existing Radix UI foundation (172 axe tests, 436 keyboard tests) provides a strong baseline, but these new components introduce specific risks that must be addressed during implementation.

**Critical risks by severity:**
- **CRITICAL (5):** VoiceOver focus trap escape, iOS Safari scroll lock, Data Table accessibility, Command Palette keyboard conflicts, Context Menu mobile trigger
- **HIGH (8):** Tab panel focus, Accordion hidden content, Sheet swipe gesture, Dialog z-index stacking, Animation performance
- **MEDIUM (8):** Bundle size, aria-controls support, reduced motion, typeahead interference
- **LOW (4):** Minor UX issues with clear workarounds

---

## Accessibility Pitfalls

### 1. VoiceOver Escapes Focus Trap in Modals (CRITICAL)
**The mistake:** Using `display: none` for inactive dialogs causes VoiceOver to ignore programmatic focus, allowing users to navigate outside the modal.
**Warning signs:** VoiceOver users report being able to swipe to content behind modal; focus and VoiceOver cursor desync; users hear page content while modal is open.
**Prevention:** Use `visibility: hidden/visible` instead of `display: none`. Radix Dialog handles this correctly, but custom implementations (like existing `BottomSheet.js`) must be verified. Also require both `role="dialog"` AND `aria-modal="true"`.
**Applies to:** Dialog, Sheet, Modal
**Confidence:** HIGH (verified via [Apple Developer Forums](https://developer.apple.com/forums/thread/724127) and [TPGi Modal Research](https://www.tpgi.com/the-current-state-of-modal-dialog-accessibility/))

### 2. Safari 26 VoiceOver Focus Regression (CRITICAL)
**The mistake:** After Safari 26 upgrade, browser focus moves to first interactive element but VoiceOver focus stays on trigger button.
**Warning signs:** Testing shows VoiceOver announcing wrong element after dialog opens; VO + Left Arrow reaches content behind modal; Tab key syncs focus but arrow keys don't.
**Prevention:** Add brief timeout (~50ms) before programmatically setting focus. Test with Safari 26+ specifically. Consider using native `<dialog>` element which has better VoiceOver support in Safari Tech Preview.
**Applies to:** Dialog, Sheet, Modal, Command Palette
**Confidence:** MEDIUM (recent Safari 26 regression, ongoing [Apple Community discussion](https://discussions.apple.com/thread/256161078))

### 3. Tabs Focus Management (HIGH)
**The mistake:** Focus doesn't move to panel content when tab is selected via keyboard; VoiceOver auto-selects tab on focus.
**Warning signs:** Screen reader users can't access panels from previous tabs; keyboard users get stuck on tab list; users hear "selected" announcement on mere focus.
**Prevention:** Use `activationMode="manual"` for screen reader compatibility. Ensure panel content is reachable via Tab key after tab selection. Consider `tabIndex="-1"` on panel for programmatic focus.
**Applies to:** Tabs
**Confidence:** HIGH (documented [Radix issue #1047](https://github.com/radix-ui/primitives/issues/1047))

### 4. Accordion Hidden Content Still Accessible (HIGH)
**The mistake:** Collapsed accordion panels remain in the accessibility tree, allowing screen readers and keyboard users to reach hidden content.
**Warning signs:** Screen reader users navigate into "invisible" content; keyboard focus disappears visually; tab order includes hidden elements.
**Prevention:** Use `hidden` attribute on collapsed panels, not just CSS `display: none` or `height: 0`. Verify with `aria-expanded="false"` on headers. Don't use `visibility: hidden` alone (keyboard can still reach).
**Applies to:** Accordion
**Confidence:** HIGH (per [Aditus Accessible Accordion Pattern](https://www.aditus.io/patterns/accordion/))

### 5. Data Table Screen Reader Accessibility (CRITICAL)
**The mistake:** TanStack Table's headless nature means developers must manually add all ARIA attributes; most skip this, creating inaccessible tables.
**Warning signs:** Screen readers don't announce table structure; cell navigation doesn't work with arrow keys; sort/filter changes not announced.
**Prevention:** Implement full ARIA grid pattern: `role="grid"`, `aria-rowcount`, `aria-colcount`, `aria-sort`, `aria-label` on every cell. Use React Aria Components integration or verify against WCAG grid pattern. Add live regions for sort/filter announcements.
**Applies to:** Data Table
**Confidence:** HIGH (per [Simple Table Accessibility Guide](https://www.simple-table.com/blog/mit-licensed-react-tables-accessibility-keyboard-navigation) and [TanStack issue #130](https://github.com/tannerlinsley/react-table/issues/130))

### 6. Command Palette Keyboard Conflicts (CRITICAL)
**The mistake:** Using Cmd+K or Cmd+P triggers browser native shortcuts instead of command palette.
**Warning signs:** Browser search bar opens instead of palette; Safari shows bookmarks; Chrome shows print dialog; shortcut works inconsistently.
**Prevention:** Use `e.preventDefault()` early in handler. Check `e.metaKey` (Mac) and `e.ctrlKey` (Windows) explicitly. Avoid Cmd+P (print). Consider Cmd+K with fallback to "/" for search. Test in Safari, Chrome, and standalone PWA mode.
**Applies to:** Command Palette
**Confidence:** HIGH (common pattern documented in [cmdk library](https://github.com/pacocoursey/cmdk))

### 7. aria-controls Limited Support (MEDIUM)
**The mistake:** Relying on `aria-controls` for tab-panel relationship when only JAWS supports it.
**Warning signs:** NVDA and VoiceOver users don't get panel navigation hints; accessibility audits flag missing `aria-controls` as error when it's actually optional.
**Prevention:** Don't rely on `aria-controls` for functionality. Ensure panel immediately follows header in DOM order. Use `aria-labelledby` on panels to reference headers.
**Applies to:** Tabs, Accordion
**Confidence:** HIGH (per [Radix Accessibility docs](https://www.radix-ui.com/primitives/docs/overview/accessibility))

### 8. Disabled Tabs Not Focusable (MEDIUM)
**The mistake:** Disabled tabs are completely removed from tab order, violating a11y recommendations that disabled controls should be focusable.
**Warning signs:** Keyboard users can't discover disabled tabs exist; screen readers skip them entirely; users confused about available options.
**Prevention:** Accept Radix limitation or implement custom roving tabindex. Add `aria-disabled="true"` instead of `disabled` if focus is required. Document disabled state in accessible description.
**Applies to:** Tabs
**Confidence:** MEDIUM (known [Radix limitation](https://github.com/radix-ui/primitives/discussions/3022))

---

## Performance Pitfalls

### 9. Data Table Re-renders on Every Cell Change (HIGH)
**The mistake:** Entire table re-renders when single cell updates, causing lag on datasets >100 rows.
**Warning signs:** Visible lag when editing cells; janky scrolling; high CPU usage during interactions; React DevTools shows entire table tree updating.
**Prevention:** Memoize row components with `React.memo`. Use `useCallback` for event handlers. Consider `@tanstack/react-virtual` for virtualization above 50 rows. Split cell components from row components.
**Applies to:** Data Table
**Confidence:** HIGH (per [Material React Table Virtualization Guide](https://www.material-react-table.com/docs/guides/virtualization))

### 10. Missing Virtualization for Large Datasets (HIGH)
**The mistake:** Rendering 1000+ rows in DOM causes browser to struggle, memory spikes, and scroll performance degrades.
**Warning signs:** Page load time increases with row count; memory usage grows linearly; scrolling drops below 60fps; iOS Safari crashes on large datasets.
**Prevention:** Implement virtualization at 50+ rows. Use `@tanstack/react-virtual` (lightweight) or consider AG Grid for 100k+ rows. Virtualize columns too if >12 columns.
**Applies to:** Data Table
**Confidence:** HIGH (per [Strapi Performance Guide](https://strapi.io/blog/table-in-react-performance-guide))

### 11. Bundle Size from Animation Libraries (MEDIUM)
**The mistake:** Importing full Framer Motion (47KB+) for simple animations that could use CSS or lighter alternatives.
**Warning signs:** Bundle analyzer shows large animation library; lighthouse performance score drops; initial load time increases.
**Prevention:** Use CSS animations where possible (existing globals.css has robust animation system). If Framer Motion needed, use tree-shaking: `import { motion } from 'framer-motion/slim'`. Consider Motion One (3KB) for simpler needs.
**Applies to:** All components with animations (Sheet, Dialog, Command Palette)
**Confidence:** HIGH (project already has 104,000 lines JS; bundle size is explicit constraint)

### 12. requestAnimationFrame vs setInterval for Animations (HIGH)
**The mistake:** Using setInterval for animations drains battery, doesn't respect device state, and causes jank.
**Warning signs:** Animation continues when tab is hidden; battery drain complaints; animation stutters under CPU load; inconsistent frame rate.
**Prevention:** Use requestAnimationFrame for any imperative animations. Use CSS animations (which browsers optimize automatically). Existing project uses CSS-based animations - maintain this pattern.
**Applies to:** Sheet (drag gesture), Command Palette (search highlighting), Data Table (row transitions)
**Confidence:** HIGH (per [Motion.dev Performance Guide](https://motion.dev/docs/performance))

### 13. GPU-Accelerated Properties Only (MEDIUM)
**The mistake:** Animating width, height, top, left instead of transform and opacity triggers expensive layout recalculations.
**Warning signs:** Animation causes layout shift visible in DevTools; paint operations on every frame; poor performance on mobile.
**Prevention:** Use only `transform` (translate, scale, rotate) and `opacity` for animations. Existing Modal.js correctly uses `animate-scale-in-center` - maintain this pattern for new components.
**Applies to:** All animated components
**Confidence:** HIGH (established web performance best practice)

---

## Mobile/PWA Pitfalls

### 14. Context Menu Right-Click on Touch (CRITICAL)
**The mistake:** Context menu only triggers on right-click, which doesn't exist on mobile touchscreens.
**Warning signs:** Component completely unusable on iOS/Android; no way to access menu items; feature gap between desktop and mobile.
**Prevention:** Implement long-press trigger (500ms+ to avoid conflict with scroll). Add haptic feedback via Vibration API (project already has `lib/pwa/vibration.js`). Ensure button trigger still works as fallback. Consider showing explicit "more options" button on mobile.
**Applies to:** Context Menu
**Confidence:** HIGH (project's existing `ContextMenu.js` only has click trigger; needs enhancement)

### 15. Long-Press Conflicts with iOS Text Selection (HIGH)
**The mistake:** Long-press triggers both context menu and iOS native text selection/copy behavior.
**Warning signs:** Text gets selected when trying to open menu; iOS shows magnifier glass; conflicting gestures frustrate users.
**Prevention:** Add `-webkit-touch-callout: none` and `user-select: none` to long-press target. Set appropriate `touch-action` CSS. Ensure the target isn't a text element.
**Applies to:** Context Menu
**Confidence:** HIGH (documented iOS Safari behavior)

### 16. iOS Safari Body Scroll Lock Failure (CRITICAL)
**The mistake:** Standard scroll lock techniques (`overflow: hidden`, `overscroll-behavior: none`) fail when Safari UI chrome is collapsed or in standalone PWA mode.
**Warning signs:** Background page scrolls while modal/sheet is open; rubber-band bounce affects modal content; scroll position lost when modal closes.
**Prevention:** Use `position: fixed` on body with calculated top offset to maintain scroll position. Project's existing `BottomSheet.js` implements this pattern (lines 50-63) - maintain and verify. For iOS 26+, use `position: sticky` wrapper approach.
**Applies to:** Dialog, Sheet, Modal, Command Palette
**Confidence:** HIGH (per [iOS Safari Scroll Lock Research](https://www.jayfreestone.com/writing/locking-body-scroll-ios/) and existing project implementation)

### 17. Sheet Swipe-to-Dismiss Conflicts with Scroll (HIGH)
**The mistake:** Swipe down gesture to dismiss conflicts with scrollable content inside sheet.
**Warning signs:** Users accidentally dismiss when trying to scroll; can't scroll up from middle of content; inconsistent behavior.
**Prevention:** Only enable swipe-to-dismiss when scrolled to top. Use velocity threshold (not just distance). Add visual indicator (drag handle) for affordance. Consider `react-modal-sheet` library which handles this correctly.
**Applies to:** Sheet
**Confidence:** HIGH (per [react-modal-sheet documentation](https://github.com/Temzasse/react-modal-sheet))

### 18. iOS Safari Edge Swipe Conflicts (HIGH)
**The mistake:** Left/right swipe gestures conflict with Safari's back/forward navigation.
**Warning signs:** Swiping left to close sheet navigates browser back; gesture threshold too sensitive; users report accidental navigation.
**Prevention:** Avoid horizontal swipe gestures, use vertical only for dismiss. If horizontal needed, require larger gesture distance than browser threshold. Set `touch-action: pan-y` to disable horizontal browser gestures.
**Applies to:** Sheet, Popover
**Confidence:** MEDIUM (iOS-specific behavior, needs device testing)

### 19. Touch Target Size Below 44px (MEDIUM)
**The mistake:** Close buttons, tab triggers, and accordion headers smaller than 44x44px minimum.
**Warning signs:** Users miss taps; multiple attempts to activate; frustration on mobile; failing WCAG 2.1 AAA.
**Prevention:** Project already enforces 44px minimum (`min-h-[44px]` in Button, per accessibility.test.js lines 1071-1128). Maintain this for all new interactive elements. Verify accordion headers, tab triggers, and table action buttons.
**Applies to:** All interactive elements in all components
**Confidence:** HIGH (project standard, documented in accessibility.md)

---

## Integration Pitfalls

### 20. Dialog/Popover Z-Index Stacking (HIGH)
**The mistake:** Dialog opened from Popover renders behind Popover because z-index not managed by render order.
**Warning signs:** Confirmation dialog appears behind dropdown; nested popovers render incorrectly; focus trap confused by layering.
**Prevention:** Use Radix's portal stacking (renders in DOM order). If mixing Radix components with custom portals, establish z-index scale: base (50), dropdown (51), popover (52), dialog (53). Consider using single portal root with stacking context.
**Applies to:** Dialog, Popover, Sheet, Context Menu
**Confidence:** HIGH (documented [Radix issue #1317](https://github.com/radix-ui/primitives/issues/1317) and [Base UI Quick Start](https://base-ui.com/react/overview/quick-start))

### 21. Command Palette Focus Restoration (MEDIUM)
**The mistake:** After closing command palette, focus goes to body instead of returning to previously focused element.
**Warning signs:** Keyboard users lose their place; screen reader users disoriented; tab order restarts from beginning.
**Prevention:** Store `document.activeElement` before opening. Restore focus on close (Radix Dialog does this automatically). If building custom, use `returnFocus` prop pattern from `@radix-ui/react-dialog`.
**Applies to:** Command Palette, Dialog
**Confidence:** HIGH (Radix handles this, but custom implementations must explicitly implement)

### 22. Data Table Pagination State Loss (MEDIUM)
**The mistake:** Table state (page, sort, filters) lost on navigation or component remount.
**Warning signs:** Users return to page 1 after viewing item details; sort order resets; filters cleared unexpectedly.
**Prevention:** Lift table state to URL params or parent component. Use `useSearchParams()` for persistence. Consider `@tanstack/react-table` controlled state pattern.
**Applies to:** Data Table
**Confidence:** MEDIUM (depends on implementation pattern chosen)

### 23. Accordion Multiple Sections Cause Region Overload (LOW)
**The mistake:** Using `role="region"` on 6+ accordion panels overwhelms screen reader region navigation.
**Warning signs:** VoiceOver region rotor shows too many items; screen reader users confused by landmark structure.
**Prevention:** Don't use `role="region"` for accordions with many panels. Let panels be simple `<div>` elements. Use `aria-labelledby` to associate with header instead.
**Applies to:** Accordion
**Confidence:** HIGH (per [Carbon Design System Accordion Accessibility](https://carbondesignsystem.com/components/accordion/accessibility/))

---

## Reduced Motion Pitfalls

### 24. Animations Ignore prefers-reduced-motion (MEDIUM)
**The mistake:** Animations play regardless of user motion preferences, causing vestibular issues.
**Warning signs:** Users with motion sensitivity report discomfort; accessibility audit fails; animation plays even with OS-level reduced motion enabled.
**Prevention:** Project already has CSS-level reduced motion support (globals.css). Ensure JavaScript animations also check `useReducedMotion()` hook (exists at `app/hooks/useReducedMotion.js`). Test by enabling "Reduce motion" in iOS/macOS accessibility settings.
**Applies to:** All animated components
**Confidence:** HIGH (project has infrastructure, just needs consistent application)

### 25. Essential Feedback Lost with Reduced Motion (LOW)
**The mistake:** Disabling all animations removes important feedback like loading indicators or state changes.
**Warning signs:** Users don't know action is processing; state changes happen "magically" without transition; confusion about current state.
**Prevention:** Keep color changes, opacity transitions, and static state indicators even with reduced motion. Only remove position/scale/rotation animations. Project's approach (instant appearance vs animated) is correct.
**Applies to:** All animated components
**Confidence:** HIGH (existing pattern in project)

---

## Pitfall Prevention Matrix

| Pitfall | Severity | Components | Phase to Address | Test Type |
|---------|----------|------------|------------------|-----------|
| VoiceOver focus trap escape | CRITICAL | Dialog, Sheet, Modal | Build phase | Manual VoiceOver testing |
| Safari 26 VoiceOver regression | CRITICAL | Dialog, Sheet, Modal | Build phase | Safari 26 device testing |
| Data Table accessibility | CRITICAL | Data Table | Build phase | jest-axe + manual |
| Command Palette keyboard | CRITICAL | Command Palette | Build phase | Keyboard tests |
| Context Menu mobile trigger | CRITICAL | Context Menu | Build phase | Device testing |
| Tabs focus management | HIGH | Tabs | Build phase | Keyboard tests |
| Accordion hidden content | HIGH | Accordion | Build phase | Screen reader testing |
| Data Table re-renders | HIGH | Data Table | Build phase | React DevTools profiling |
| Missing virtualization | HIGH | Data Table | Planning (threshold) | Performance testing |
| iOS scroll lock failure | HIGH | Dialog, Sheet | Build phase | iOS device testing |
| Sheet swipe conflicts | HIGH | Sheet | Build phase | Device testing |
| Z-index stacking | HIGH | Dialog, Popover | Build phase | Integration tests |
| Bundle size | MEDIUM | All animated | Build phase | Bundle analyzer |
| GPU properties | MEDIUM | All animated | Build phase | DevTools performance |
| Focus restoration | MEDIUM | Command Palette | Build phase | Keyboard tests |
| Pagination state | MEDIUM | Data Table | Planning | Unit tests |
| aria-controls support | MEDIUM | Tabs, Accordion | Build phase | Documentation |
| Disabled tabs focus | MEDIUM | Tabs | Planning (decision) | Keyboard tests |
| Touch targets | MEDIUM | All | Build phase | Visual inspection |
| Reduced motion | MEDIUM | All animated | Build phase | Preference testing |
| Edge swipe conflicts | MEDIUM | Sheet | Build phase | iOS Safari testing |
| Long-press text selection | HIGH | Context Menu | Build phase | iOS device testing |
| Region overload | LOW | Accordion | Planning | Screen reader testing |
| Essential feedback | LOW | All animated | Build phase | Reduced motion testing |

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Test Strategy |
|-------------|---------------|------------|---------------|
| Tabs/Accordion | Focus management, hidden content accessibility | Use Radix primitives, manual activationMode | VoiceOver + NVDA testing |
| Data Table | Performance at scale, ARIA grid pattern | Virtualize >50 rows, full ARIA implementation | Performance + accessibility audit |
| Command Palette | Keyboard conflicts, focus trap | Browser-specific shortcuts, Radix Dialog base | Multi-browser keyboard testing |
| Context Menu | Mobile trigger, long-press conflicts | Long-press + haptic, button fallback | iOS/Android device testing |
| Popover/Sheet | Z-index stacking, scroll lock | Portal ordering, iOS-specific scroll fix | Integration + device testing |
| Dialog | VoiceOver Safari 26, focus restoration | Timeout workaround, test Safari 26 | Safari + VoiceOver manual testing |

---

## Project-Specific Considerations

Based on existing codebase analysis:

1. **Radix Foundation:** Project already uses `@radix-ui/react-dialog`, `@radix-ui/react-tabs`, and other Radix primitives. Continue using Radix to maintain accessibility consistency.

2. **Existing Patterns:** The `Modal.js` component correctly implements focus trap, ESC close, and bottom sheet mobile behavior. New components should follow same patterns.

3. **BottomSheet.js Gap:** Current implementation uses `createPortal` directly without Radix. Consider migrating to Radix Dialog with bottom sheet styling for consistency and accessibility.

4. **ContextMenu.js Gap:** Current implementation only supports click trigger. Needs long-press enhancement for mobile PWA use case.

5. **Test Infrastructure:** Project has 172 axe tests and 436 keyboard tests. New components must maintain this coverage level.

6. **PWA Constraints:** Project runs as standalone PWA on iOS/Android. All components must work without browser chrome (address bar, navigation).

---

## Component-Specific Quick Reference

### Tabs
- Use `activationMode="manual"` for VoiceOver compatibility
- Ensure panel follows header immediately in DOM
- Don't rely on `aria-controls` for functionality
- Test disabled state discovery with screen readers

### Accordion
- Use `hidden` attribute on collapsed panels
- Avoid `role="region"` for 6+ panels
- Verify `aria-expanded` updates correctly
- Test keyboard navigation through headers

### Data Table
- Implement full ARIA grid pattern
- Add virtualization at 50+ rows
- Memoize row components
- Add live regions for sort/filter announcements
- Preserve state across navigation

### Command Palette
- Use Radix Dialog as base for focus trap
- Handle Cmd+K with `preventDefault` early
- Store and restore focus properly
- Test in Safari, Chrome, PWA standalone mode

### Context Menu
- Add long-press trigger for mobile (500ms)
- Use haptic feedback via Vibration API
- Prevent text selection conflicts
- Keep button trigger as fallback

### Popover
- Use Radix portal stacking
- Avoid conflicts with tooltips
- Handle z-index with established scale
- Test nested popover scenarios

### Sheet
- Only swipe-dismiss when scrolled to top
- Use velocity threshold for dismiss
- Implement iOS scroll lock correctly
- Test rubber-band bounce in PWA mode

### Dialog
- Test Safari 26 VoiceOver regression
- Use visibility instead of display for hiding
- Verify focus restoration on close
- Handle nested dialog z-index

---

## Sources

**Official Documentation:**
- [Radix UI Tabs](https://www.radix-ui.com/primitives/docs/components/tabs)
- [Radix UI Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)

**Verified Issues:**
- [Radix Tabs Screen Reader Issue #1047](https://github.com/radix-ui/primitives/issues/1047)
- [Radix Z-Index Issue #1317](https://github.com/radix-ui/primitives/issues/1317)
- [TanStack Table Accessibility #130](https://github.com/tannerlinsley/react-table/issues/130)

**Accessibility Guides:**
- [Aditus Accessible Accordion](https://www.aditus.io/patterns/accordion/)
- [TPGi Modal Dialog Accessibility](https://www.tpgi.com/the-current-state-of-modal-dialog-accessibility/)
- [Carbon Design Accordion Accessibility](https://carbondesignsystem.com/components/accordion/accessibility/)

**Performance:**
- [Motion.dev Performance Guide](https://motion.dev/docs/performance)
- [Material React Table Virtualization](https://www.material-react-table.com/docs/guides/virtualization)

**Mobile/PWA:**
- [iOS Safari Scroll Lock](https://www.jayfreestone.com/writing/locking-body-scroll-ios/)
- [react-modal-sheet](https://github.com/Temzasse/react-modal-sheet)

---
*Researched: 2026-02-03*
*Confidence: HIGH (Radix official docs, verified GitHub issues, project codebase analysis)*
