# Project Research Summary - Advanced UI Components

**Project:** Pannello Stufa v4.0 Advanced UI Components
**Domain:** PWA Component Library Enhancement
**Researched:** 2026-02-03
**Confidence:** HIGH

---

## Executive Summary

The v4.0 milestone adds 8 advanced UI components (Tabs, Accordion, Data Table, Command Palette, Context Menu, Popover, Sheet, Dialog variants) to the Ember Noir design system. The research confirms this is achievable with **minimal new dependencies** (only 3 new Radix primitives + cmdk) because the existing codebase already has strong foundations: 12 Radix primitives installed, established compound component patterns, CVA variant system, and comprehensive accessibility testing (172 axe tests, 436 keyboard tests).

The recommended approach is **CSS-only animations** (no Framer Motion needed, ~45KB saved) and **leveraging existing primitives**. The @radix-ui/react-tabs and @radix-ui/react-popover are already installed; the existing Modal.js serves as the Dialog foundation and can be extended for Sheet. Only Accordion, Context Menu, and cmdk require new package installations. All components must follow the established namespace pattern (e.g., `Tabs.List`, `Tabs.Trigger`) and CVA variants with `[html:not(.dark)_&]:` light mode overrides.

Critical risks center on **mobile PWA compatibility** and **Safari VoiceOver**. The five critical pitfalls are: (1) VoiceOver escaping focus traps, (2) Safari 26 focus regression, (3) Context Menu requiring long-press on touch devices, (4) iOS Safari scroll lock failures, and (5) Data Table ARIA grid pattern complexity. All are mitigable through documented patterns and device testing. The build order should prioritize Popover and Tabs first (already installed, establishes patterns) before moving to components requiring new packages.

---

## Key Findings

### Recommended Stack Additions

| Package | Version | Purpose | Bundle Impact |
|---------|---------|---------|---------------|
| `@radix-ui/react-accordion` | ^1.2.12 | Accordion component | ~4KB |
| `@radix-ui/react-collapsible` | ^1.1.12 | Simple expand/collapse | ~3KB |
| `@radix-ui/react-context-menu` | ^2.2.16 | Context menu with full a11y | ~5KB |
| `cmdk` | ^1.1.0 | Command palette (powers Linear, Raycast) | ~3KB |

**Already installed (use as-is):**
- `@radix-ui/react-tabs` ^1.1.12
- `@radix-ui/react-popover` ^1.1.14
- `@radix-ui/react-dialog` ^1.1.14 (for Sheet)
- `@radix-ui/react-dropdown-menu` ^2.1.15

**Explicitly NOT recommended:**
- Framer Motion (CSS animations sufficient, saves ~45KB)
- @tanstack/react-table (overkill for current needs; build simple table first)
- Unified `radix-ui` package (migration risk for existing 12 packages)

**Total new dependencies:** 4 packages, ~15KB gzipped

### Component Features Overview

| Component | Table Stakes | Key Differentiator | Anti-Features |
|-----------|--------------|-------------------|---------------|
| **Tabs** | WAI-ARIA tablist, arrow key nav, roving tabindex | Animated indicator slide | Hover-only tabs, nested tabs |
| **Accordion** | aria-expanded, Enter/Space toggle, hidden attribute | Smooth CSS animation, multiple open | Non-focusable headers |
| **Data Table** | Native table elements, aria-sort on headers | Sticky header, loading skeleton | Complex grid role (unless editable) |
| **Command Palette** | Cmd+K trigger, combobox role, fuzzy search | Category grouping, shortcuts | >2 nesting levels |
| **Context Menu** | Right-click + long-press, menu role | Submenus, keyboard shortcuts | Right-click only (no mobile) |
| **Popover** | aria-haspopup, Escape close, auto-position | Arrow pointer, native API fallback | Hover-only trigger |
| **Sheet** | aria-modal, focus trap, focus return | Snap points, swipe dismiss | Swipe-only close |
| **Dialog** | Already exists as Modal.js | Add `role="alertdialog"` for destructive | Nested modals |

### Architecture Approach

**Build Order (Dependency-Based):**

1. **Popover** - No dependencies, Radix installed, establishes portal patterns
2. **Tabs** - No dependencies, Radix installed, high-value component
3. **Accordion** - Requires new Radix package, similar pattern to Tabs
4. **Sheet** - Reuses existing Modal/Dialog, adds side variants
5. **Context Menu** - Requires new Radix, replaces custom implementation
6. **Command Palette** - Requires cmdk, depends on Modal for dialog variant
7. **Data Table** - Most complex, may use other components for actions

**Established Patterns to Follow:**

1. **Compound components with namespace:** `Component.Subcomponent` pattern (like Modal.Header)
2. **forwardRef on all primitives:** Enable ref forwarding for composition
3. **CVA variants:** Type-safe variant props with dark-first styling
4. **Dual export:** Both named exports and default export with namespace
5. **Flat file structure:** Single files in `app/components/ui/`, tests in `__tests__/`

**Replace vs Extend:**

| Existing Component | Action | Rationale |
|-------------------|--------|-----------|
| `ContextMenu.js` (99 lines) | **Replace** with Radix | Missing keyboard nav, no long-press |
| `BottomSheet.js` (155 lines) | **Extend** via Sheet | Custom portal, needs Radix for a11y |
| `DayAccordionItem.js` (239 lines) | **Extract** Accordion primitive | Contains reusable pattern |

### Critical Pitfalls (Top 5 with Mitigation)

| # | Pitfall | Severity | Mitigation |
|---|---------|----------|------------|
| 1 | **VoiceOver escapes focus trap** | CRITICAL | Use `visibility: hidden` not `display: none`; Radix handles correctly |
| 2 | **iOS Safari scroll lock fails** | CRITICAL | Use `position: fixed` on body with calculated top offset (existing BottomSheet pattern) |
| 3 | **Context Menu unusable on mobile** | CRITICAL | Add 500ms long-press trigger with haptic feedback via existing Vibration API |
| 4 | **Data Table ARIA incomplete** | CRITICAL | Implement full ARIA grid pattern: aria-sort, aria-rowcount, live regions for changes |
| 5 | **Command Palette keyboard conflicts** | CRITICAL | Use `e.preventDefault()` early; avoid Cmd+P; test Safari/Chrome/PWA standalone |

**Additional High-Priority Pitfalls:**

- Tabs: Use `activationMode="manual"` for VoiceOver compatibility
- Accordion: Use `hidden` attribute on collapsed panels (not just CSS)
- Sheet: Only swipe-to-dismiss when scrolled to top
- Z-Index: Establish scale (50-53) for nested overlays
- Performance: Virtualize Data Table at 50+ rows

---

## Implications for Roadmap

### Suggested Phase Structure

Based on dependency analysis and risk assessment, recommend **4 phases**:

#### Phase 1: Foundation Components (Popover, Tabs)

**Components:** Popover, Tabs
**Packages:** None (already installed)
**Rationale:** Both use existing Radix packages. Establishes patterns for namespace attachment, CVA variants, and accessibility testing before adding new dependencies.

**Delivers:**
- Popover component for dropdowns, tooltips, quick actions
- Tabs component for device pages (Status/Schedule/Settings)

**Features from FEATURES.md:**
- Tabs: aria-selected, arrow key nav, roving tabindex, focus indicator
- Popover: aria-haspopup, Escape close, auto-position, click outside close

**Pitfalls to address:**
- Tabs focus management (#3)
- Popover z-index stacking (#20)

**Risk level:** LOW - patterns well-documented, Radix handles heavy lifting

---

#### Phase 2: Expandable Components (Accordion, Sheet)

**Components:** Accordion, Sheet
**Packages:** `@radix-ui/react-accordion`, `@radix-ui/react-collapsible`
**Rationale:** Accordion and Collapsible share animation patterns. Sheet extends Modal (already exists). Group for efficiency.

**Delivers:**
- Accordion for settings, FAQ, schedule details
- Sheet for side panels, mobile nav, filter panels

**Features from FEATURES.md:**
- Accordion: aria-expanded, Enter/Space toggle, smooth CSS animation, multiple open
- Sheet: focus trap, slide animations, snap points, swipe dismiss (with scroll awareness)

**Pitfalls to address:**
- Accordion hidden content still accessible (#4)
- Sheet swipe conflicts with scroll (#17)
- iOS Safari scroll lock (#16)

**Risk level:** MEDIUM - new packages but established patterns

---

#### Phase 3: Action Components (Context Menu, Command Palette)

**Components:** Context Menu, Command Palette
**Packages:** `@radix-ui/react-context-menu`, `cmdk`
**Rationale:** Both are quick-action patterns. Context Menu replacement needed before widespread use. Command Palette integrates with Modal.

**Delivers:**
- Context Menu for device cards, schedule items, log entries
- Command Palette for global search, quick navigation, quick actions

**Features from FEATURES.md:**
- Context Menu: right-click + long-press, menu role, submenus, keyboard shortcuts
- Command Palette: Cmd+K trigger, fuzzy search, category grouping, shortcut hints

**Pitfalls to address:**
- Context Menu mobile trigger (#14)
- Long-press conflicts with text selection (#15)
- Command Palette keyboard conflicts (#6)
- Focus restoration (#21)

**Risk level:** MEDIUM-HIGH - mobile compatibility requires device testing

---

#### Phase 4: Data Table + Integration

**Components:** Data Table, Dialog variants (Confirmation, Form)
**Packages:** None (or @tanstack/react-table if simple table insufficient)
**Rationale:** Data Table is most complex. Dialog variants extend existing Modal. Group for final integration testing.

**Delivers:**
- Data Table for logs, schedules, maintenance history
- Confirmation Dialog for destructive actions
- Form Modal for add/edit flows

**Features from FEATURES.md:**
- Data Table: native table elements, sortable headers, row actions, pagination
- Dialog: alertdialog role for destructive, form validation, unsaved changes warning

**Pitfalls to address:**
- Data Table re-renders (#9)
- Virtualization decision (#10)
- Pagination state persistence (#22)
- VoiceOver Safari 26 regression (#2)

**Risk level:** HIGH - accessibility complexity, performance considerations

---

### Phase Ordering Rationale

1. **Popover/Tabs first:** Zero new dependencies, high-value, establishes patterns
2. **Accordion/Sheet second:** New packages but similar to Phase 1 patterns
3. **Context Menu/Command third:** Higher mobile risk, needs existing components
4. **Data Table last:** Most complex, benefits from all prior components

This order ensures:
- Each phase builds on previous patterns
- Risk increases gradually (fail fast on simpler components)
- Mobile-critical features tested early (Phase 2 Sheet, Phase 3 Context Menu)
- Most complex component has full foundation

### Research Flags

| Phase | Research Needed? | Rationale |
|-------|------------------|-----------|
| Phase 1 | **No** | Standard patterns, Radix docs sufficient |
| Phase 2 | **No** | iOS scroll lock pattern exists in codebase |
| Phase 3 | **Maybe** | Device test findings may require iteration |
| Phase 4 | **Yes** | Data Table architecture decision (simple vs TanStack) |

**Recommendation:** Research Phase 4 before implementation to decide:
- Simple native table with sorting OR TanStack Table
- Virtualization threshold (50 rows? 100 rows?)
- ARIA grid vs simple table role

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | Versions verified via npm, minimal additions needed |
| Features | **HIGH** | Based on W3C APG, Radix docs, MDN; comprehensive checklist |
| Architecture | **HIGH** | Patterns derived from existing codebase; consistent with Modal.js, Card.js |
| Pitfalls | **HIGH** | 25 pitfalls identified from Radix issues, verified bugs, project analysis |

**Overall confidence:** HIGH

### Gaps to Address

1. **Data Table architecture decision:** Simple table vs TanStack Table - defer to Phase 4 planning
2. **Safari 26 VoiceOver testing:** Recent regression needs device verification
3. **PWA standalone mode testing:** Some scroll lock behaviors differ from browser mode
4. **Virtualization threshold:** Needs performance testing to determine 50 vs 100 row cutoff

---

## Sources

### Stack Research
- [Radix UI Accordion](https://www.radix-ui.com/primitives/docs/components/accordion)
- [Radix UI Context Menu](https://www.radix-ui.com/primitives/docs/components/context-menu)
- [cmdk GitHub](https://github.com/pacocoursey/cmdk)
- [npm package versions](https://www.npmjs.com/)

### Features Research
- [W3C WAI-ARIA APG Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [W3C WAI-ARIA APG Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)
- [W3C WAI-ARIA APG Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [MDN ARIA menu role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/menu_role)
- [A11Y Collective Accessible Tab Interfaces](https://www.a11y-collective.com/blog/accessibility-tab/)

### Architecture Research
- [Radix UI Server-Side Rendering](https://www.radix-ui.com/primitives/docs/guides/server-side-rendering)
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/data-table)
- [TanStack Table](https://tanstack.com/table/latest)
- Existing codebase: Modal.js, Card.js, Select.js patterns

### Pitfalls Research
- [Radix Tabs Issue #1047](https://github.com/radix-ui/primitives/issues/1047)
- [Radix Z-Index Issue #1317](https://github.com/radix-ui/primitives/issues/1317)
- [TPGi Modal Dialog Accessibility](https://www.tpgi.com/the-current-state-of-modal-dialog-accessibility/)
- [iOS Safari Scroll Lock](https://www.jayfreestone.com/writing/locking-body-scroll-ios/)
- [Apple Developer Forums VoiceOver](https://developer.apple.com/forums/thread/724127)

---

*Research completed: 2026-02-03*
*Ready for roadmap: yes*
*Suggested phases: 4 (Foundation -> Expandable -> Actions -> Data Table)*
*Research needs: Phase 4 (Data Table architecture decision)*
