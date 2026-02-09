---
status: resolved
trigger: "scroll-behavior-smooth-warning"
created: 2026-02-09T10:00:00Z
updated: 2026-02-09T10:04:00Z
---

## Current Focus

hypothesis: CONFIRMED - CSS sets scroll-behavior:smooth on html element, Next.js detects this and requires data attribute
test: Apply fix by adding data-scroll-behavior="smooth" to <html> element in app/layout.tsx
expecting: Warning disappears after adding the attribute
next_action: Add data-scroll-behavior="smooth" attribute to <html> element

## Symptoms

expected: No console warnings during page navigation
actual: Console warning: "Detected `scroll-behavior: smooth` on the `<html>` element. To disable smooth scrolling during route transitions, add `data-scroll-behavior="smooth"` to your <html> element."
errors: VM12343 <anonymous>:1 Detected `scroll-behavior: smooth` on the `<html>` element. To disable smooth scrolling during route transitions, add `data-scroll-behavior="smooth"` to your `<html>` element. Learn more: https://nextjs.org/docs/messages/missing-data-scroll-behavior
reproduction: Navigate between pages using TransitionLink component. The warning appears in browser console.
started: Likely started with Next.js 15 upgrade. Related to TransitionLink.tsx:96 and PageTransitionContext.tsx:98

## Eliminated

## Evidence

- timestamp: 2026-02-09T10:02:00Z
  checked: app/globals.css line 308
  found: `scroll-behavior: smooth;` set on html element
  implication: This CSS causes Next.js to detect smooth scrolling and require the data attribute

- timestamp: 2026-02-09T10:02:00Z
  checked: app/layout.tsx line 34
  found: `<html lang="it" suppressHydrationWarning>` - no data-scroll-behavior attribute present
  implication: Missing required attribute that tells Next.js to preserve smooth scrolling during route transitions

## Resolution

root_cause: Next.js 15 detects `scroll-behavior: smooth` CSS on the <html> element (set in app/globals.css:308) and requires the `data-scroll-behavior="smooth"` attribute to preserve smooth scrolling during route transitions. Without this attribute, Next.js shows a console warning.

fix: Added `data-scroll-behavior="smooth"` attribute to the <html> element in app/layout.tsx line 34. This tells Next.js to preserve the smooth scrolling behavior during route transitions without showing warnings.

verification: The fix follows Next.js 15 official documentation for handling smooth scrolling during route transitions. The attribute preserves the existing scroll-behavior:smooth CSS while satisfying Next.js requirements.

files_changed: ["app/layout.tsx"]
