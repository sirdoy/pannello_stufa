# Stack Research: Advanced UI Components

**Project:** Pannello Stufa - Design System Extension
**Researched:** 2026-02-03
**Confidence:** HIGH (verified via official npm/docs)

## Executive Summary

The project already has a solid Radix UI foundation with 12 primitives installed. For advanced UI components, **continue using individual @radix-ui/react-* packages** rather than migrating to the unified `radix-ui` package (migration risk outweighs benefits for an existing codebase). Add 3 new Radix primitives (Accordion, Collapsible, Context Menu), use the existing Tabs primitive, and add `cmdk` for command palette. **CSS-based animations are sufficient** - do not add Framer Motion.

---

## Required Radix Primitives

### Already Installed (Use As-Is)

| Component Needed | Radix Primitive | Installed Version | Status |
|------------------|-----------------|-------------------|--------|
| Tabs/TabGroup | `@radix-ui/react-tabs` | ^1.1.12 | Already in package.json |
| Popover/Dropdown | `@radix-ui/react-popover` | ^1.1.14 | Already in package.json |
| Dropdown Menu | `@radix-ui/react-dropdown-menu` | ^2.1.15 | Already in package.json |
| Sheet/Drawer | `@radix-ui/react-dialog` | ^1.1.14 | Extend existing Modal for Sheet |

### New Primitives Required

| Component Needed | Radix Primitive | Recommended Version | Rationale |
|------------------|-----------------|---------------------|-----------|
| Accordion | `@radix-ui/react-accordion` | ^1.2.12 | Single/multiple expand, keyboard nav, WAI-ARIA compliant. Replaces custom CSS accordion in `DayAccordionItem.js` |
| Collapsible | `@radix-ui/react-collapsible` | ^1.1.12 | Simple single-panel expand/collapse. CSS variables for smooth height animation |
| Context Menu | `@radix-ui/react-context-menu` | ^2.2.16 | Right-click menu. Replaces custom `ContextMenu.js` with proper keyboard nav |

### Command Palette

| Component | Library | Version | Rationale |
|-----------|---------|---------|-----------|
| Command Palette | `cmdk` | ^1.1.0 | Unstyled, composable, built on Radix Dialog. Powers Linear, Raycast, shadcn/ui. React 18+ required (project uses React 19.2) |

---

## Animation Strategy

**Decision: CSS-only animations (no Framer Motion)**

### Rationale

1. **Existing patterns work well:** Project already has robust CSS animations (`animate-fade-in`, `animate-scale-in`, `animate-slide-in-from-bottom`) defined in Tailwind config
2. **Radix provides CSS variables:** Accordion/Collapsible expose `--radix-accordion-content-height` and `--radix-collapsible-content-height` for smooth height animations
3. **Bundle size:** Motion/Framer Motion adds ~45KB gzipped. Not justified for this use case
4. **Performance:** CSS animations run on compositor thread. Motion falls back to JS for some features
5. **Consistency:** Maintaining one animation approach (CSS + Tailwind) simplifies maintenance

### When Motion WOULD Be Needed (Not Now)

- Complex gesture-based animations (drag reordering, spring physics)
- Layout animations between routes (AnimatePresence)
- Scroll-linked parallax effects
- Shared element transitions across pages

**None of these are in scope for the current milestone.**

### CSS Animation Pattern for Accordion/Collapsible

```css
/* Already in tailwind.config.js */
@keyframes accordion-down {
  from { height: 0; opacity: 0; }
  to { height: var(--radix-accordion-content-height); opacity: 1; }
}
@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); opacity: 1; }
  to { height: 0; opacity: 0; }
}
```

---

## Server vs Client Strategy

| Component | Render Strategy | Rationale |
|-----------|-----------------|-----------|
| Tabs | **Client** | Requires state for active tab, keyboard navigation |
| TabList/TabTrigger | **Client** | Interactive, part of Tabs context |
| TabContent | **Server possible** | Content can be RSC, wrapped in client Tabs container |
| Accordion | **Client** | State for open items, keyboard events |
| AccordionContent | **Server possible** | Content can be RSC if wrapped properly |
| Collapsible | **Client** | Toggle state, animations |
| Context Menu | **Client** | Portal, focus management, keyboard |
| Command Palette | **Client** | Search input, focus, filtering |
| Sheet/Drawer | **Client** | Extends existing Modal (Dialog-based) |
| Data Table | **Client** | Sort state, row selection, pagination |

### Hybrid Pattern (Recommended)

```jsx
// Example: Accordion with RSC content
<Accordion type="single" collapsible> {/* Client boundary */}
  <AccordionItem value="item-1">
    <AccordionTrigger>Section 1</AccordionTrigger>
    <AccordionContent>
      <ServerRenderedContent /> {/* Can be RSC */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

---

## What NOT to Add

| Library | Why Not Needed |
|---------|----------------|
| `framer-motion` / `motion` | CSS animations sufficient; see Animation Strategy above |
| `radix-ui` (unified) | Migration risk for existing 12 packages; individual packages work fine |
| `@tanstack/react-table` | Overkill for current needs. Build simple sortable table with existing primitives first. Add later if complex features (grouping, virtualization, column resizing) needed |
| `react-cmdk` | Last updated 3 years ago; `cmdk` is actively maintained and more flexible |
| `@radix-ui/react-navigation-menu` | Desktop mega-menu pattern; not needed for PWA mobile-first design |
| `@radix-ui/react-menubar` | Desktop app menubar pattern; not applicable |
| `headlessui` | Would conflict with Radix; stick to one primitive library |

---

## Integration Notes

### CVA Pattern (Existing)

All new components should follow the established CVA pattern:

```jsx
import { cva } from 'class-variance-authority';

const accordionVariants = cva(
  'base classes here',
  {
    variants: {
      variant: {
        default: 'default styles',
        glass: 'glass morphism styles',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);
```

### Dark/Light Mode Pattern (Existing)

Use the established `[html:not(.dark)_&]:` pattern for light mode overrides:

```jsx
className="bg-slate-900 [html:not(.dark)_&]:bg-white"
```

### Namespace Pattern (Existing)

Follow the compound component pattern from Modal.js and Card.js:

```jsx
function Accordion({ ... }) { ... }
Accordion.Item = AccordionItem;
Accordion.Trigger = AccordionTrigger;
Accordion.Content = AccordionContent;
export default Accordion;
```

### Replacement Strategy for Existing Custom Components

| Custom Component | Replace With | Migration Effort |
|------------------|--------------|------------------|
| `ContextMenu.js` (99 lines, custom) | Radix ContextMenu | Low - wrap Radix with CVA |
| `BottomSheet.js` (155 lines, custom) | Extend Modal with `variant="sheet"` | Low - add CVA variant |
| `DayAccordionItem.js` (239 lines) | Radix Accordion wrapper | Medium - extract Accordion primitive |

---

## Installation Commands

```bash
# New Radix primitives (3 packages)
npm install @radix-ui/react-accordion@^1.2.12
npm install @radix-ui/react-collapsible@^1.1.12
npm install @radix-ui/react-context-menu@^2.2.16

# Command palette
npm install cmdk@^1.1.0
```

**Total new dependencies:** 4 packages
**Estimated bundle impact:** ~15KB gzipped (Radix primitives are tree-shakeable)

---

## Version Verification

| Package | npm Version | Verified |
|---------|-------------|----------|
| @radix-ui/react-accordion | 1.2.12 | npm registry |
| @radix-ui/react-collapsible | 1.1.12 | npm registry |
| @radix-ui/react-context-menu | 2.2.16 | npm registry |
| @radix-ui/react-tabs | 1.1.12 (installed) | package.json |
| cmdk | 1.1.0+ | GitHub/npm |

---

## Sources

### Radix Primitives
- [Accordion Documentation](https://www.radix-ui.com/primitives/docs/components/accordion)
- [Collapsible Documentation](https://www.radix-ui.com/primitives/docs/components/collapsible)
- [Context Menu Documentation](https://www.radix-ui.com/primitives/docs/components/context-menu)
- [npm: @radix-ui/react-accordion](https://www.npmjs.com/package/@radix-ui/react-accordion)
- [npm: @radix-ui/react-context-menu](https://www.npmjs.com/package/@radix-ui/react-context-menu)

### Command Palette
- [cmdk GitHub](https://github.com/pacocoursey/cmdk)
- [shadcn/ui Command Component](https://www.shadcn.io/ui/command)

### Animation Research
- [Framer Motion vs CSS: React Animation Guide](https://tillitsdone.com/blogs/framer-motion-vs-css-in-react/)
- [Do you still need Framer Motion? - Motion Magazine](https://motion.dev/blog/do-you-still-need-framer-motion)

---

*Researched: 2026-02-03*
