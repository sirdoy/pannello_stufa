# Feature Landscape: Design System & UI Components

**Domain:** Smart Home PWA (2026)
**Researched:** 2026-01-28
**Context:** Subsequent milestone — completing UI component library for existing functional app

---

## Executive Summary

Based on research into modern design systems (shadcn/ui, Radix UI, Material UI, Carbon) and smart home dashboard patterns (Home Assistant 2026.1, ThingsBoard, Grafana), a complete 2026 design system requires three layers:

1. **Foundation components** (18 essential) — Table stakes for any production UI
2. **Smart home specific** (8 specialized) — Real-time monitoring, controls, status displays
3. **Polish & accessibility** (5 patterns) — Modern UX expectations (WCAG AA, reduced motion, touch targets)

Current state: 12/18 foundation components exist but inconsistently implemented. Missing: advanced form controls (Combobox, Radio Group, Slider), feedback mechanisms (Toast system needs upgrade), and data display patterns (Table, Tabs, Pagination).

**Key insight:** Don't build everything. Focus on closing gaps in existing components + adding missing table stakes. Defer advanced components (Command palette, Multi-step forms) to post-MVP.

---

## Table Stakes Components

Components users expect in a production PWA. Missing these = product feels incomplete or unprofessional.

### Foundation Layer (18 components)

| Component | Status | Complexity | Priority | Notes |
|-----------|--------|------------|----------|-------|
| **Button** | ✅ Exists | Low | — | Has variants, liquid glass, icons. Needs keyboard nav audit |
| **Input** | ✅ Exists | Low | — | Text input works. Consider number input variant |
| **Select** | ✅ Exists | Medium | — | Native select works. Consider custom dropdown for consistency |
| **Checkbox** | ❌ Missing | Low | **HIGH** | Form controls needed for preferences |
| **Switch** | ❌ Missing | Low | **HIGH** | Better than checkbox for on/off settings (mobile-friendly) |
| **Radio Group** | ❌ Missing | Medium | Medium | Needed for mutually exclusive options |
| **Slider** | ❌ Missing | Medium | **HIGH** | Essential for temperature/brightness controls |
| **Card** | ✅ Exists | Low | — | Core layout component, liquid glass style works well |
| **Modal/Dialog** | ⚠️ Partial | Medium | **HIGH** | Pattern exists but no reusable component |
| **Toast** | ⚠️ Partial | Medium | **HIGH** | Exists but basic. Needs queue, positioning, types |
| **Banner** | ✅ Exists | Low | — | Alert banners work (info/warning/error/success) |
| **Loading Spinner** | ✅ Exists | Low | — | LoadingOverlay exists |
| **Skeleton** | ✅ Exists | Low | — | Loading placeholders exist |
| **Tabs** | ❌ Missing | Medium | Medium | Useful for organizing dense settings screens |
| **Accordion** | ❌ Missing | Medium | Low | Collapsible sections (defer to post-MVP) |
| **Tooltip** | ❌ Missing | Medium | Medium | Contextual help for controls |
| **Badge** | ⚠️ Partial | Low | Medium | StatusBadge exists, needs generic Badge variant |
| **Divider** | ✅ Exists | Low | — | Section separators exist |

### Typography & Layout (5 components)

| Component | Status | Complexity | Priority | Notes |
|-----------|--------|------------|----------|-------|
| **Heading** | ✅ Exists | Low | — | Semantic h1-h6 with ember variant |
| **Text** | ✅ Exists | Low | — | Body, secondary, tertiary variants |
| **Section** | ✅ Exists | Low | — | Layout component with title/description |
| **Grid** | ✅ Exists | Low | — | Responsive grid with breakpoints |
| **EmptyState** | ✅ Exists | Low | — | Zero-state messaging |

### Smart Home Specific (8 components)

| Component | Status | Complexity | Priority | Notes |
|-----------|--------|------------|----------|-------|
| **StatusBadge** | ✅ Exists | Low | — | With pulse animation for active states |
| **ControlButton** | ✅ Exists | Low | — | +/- controls for temp/brightness |
| **StatusCard** | ⚠️ Partial | Medium | **HIGH** | Pattern exists, needs consistent component |
| **DeviceCard** | ⚠️ Partial | Medium | Medium | Device status display (inconsistent across pages) |
| **TimelineItem** | ⚠️ Partial | Medium | Medium | Event/notification history display |
| **ScheduleTimeline** | ✅ Exists | High | — | 7-day weekly schedule visualization (complex, already built) |
| **GaugeDisplay** | ❌ Missing | Medium | Low | Radial gauge for temperature/humidity (nice-to-have) |
| **ChartComponent** | ❌ Missing | High | Low | Time series data (defer to analytics milestone) |

---

## Differentiators

Features that provide competitive advantage or modern polish. Not expected, but elevate the experience.

### Advanced Interactions (5 patterns)

| Feature | Value Proposition | Complexity | Priority | Notes |
|---------|-------------------|------------|----------|-------|
| **Combobox** | Searchable select, better UX for long lists | High | Low | Defer unless device list grows significantly |
| **Command Palette** | Power user shortcut (⌘K navigation) | High | Low | Nice-to-have, not essential for smart home |
| **Drag-and-Drop** | Reorder devices, customize layout | High | Low | Defer to customization milestone |
| **Haptic Feedback** | Mobile tactile response on actions | Medium | Medium | PWA feature, enhances mobile UX |
| **Gesture Controls** | Swipe actions on cards (delete, archive) | Medium | Low | Mobile enhancement, defer to post-MVP |

### Visual Polish (6 patterns)

| Feature | Value Proposition | Complexity | Priority | Notes |
|---------|-------------------|------------|----------|-------|
| **Micro-interactions** | Button press feedback, hover states | Low | **HIGH** | Already partially implemented, needs consistency |
| **Page Transitions** | View Transitions API (already implemented) | Low | — | ✅ Already working |
| **Loading States** | Skeleton screens during data fetch | Low | — | ✅ Already implemented |
| **Empty States** | Friendly zero-state messaging | Low | — | ✅ Already implemented |
| **Focus Management** | Logical tab order, focus rings | Medium | **HIGH** | WCAG AA requirement, needs audit |
| **Reduced Motion** | Respects prefers-reduced-motion | Low | **HIGH** | Accessibility requirement, partially implemented |

### Smart Defaults (4 patterns)

| Feature | Value Proposition | Complexity | Priority | Notes |
|---------|-------------------|------------|----------|-------|
| **Auto Dark Mode** | Respects system preference | Low | — | ✅ Already implemented (dark-first with toggle) |
| **Touch-Friendly** | 44px minimum touch targets | Low | **HIGH** | Needs audit across all components |
| **Keyboard Navigation** | Full keyboard accessibility | Medium | **HIGH** | WCAG AA requirement, needs systematic implementation |
| **Responsive Typography** | Fluid font scaling (clamp) | Low | — | ✅ Already implemented |

---

## Anti-Features

Features to deliberately NOT build. Common mistakes in design systems.

### Kitchen Sink Components (avoid over-engineering)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **20+ Button variants** | Overwhelming choice, inconsistent usage | Limit to 7 variants (already defined): primary, secondary, success, danger, accent, outline, ghost |
| **Custom Date Picker** | Complex accessibility, native works | Use native `<input type="datetime-local">` for mobile, defer fancy picker |
| **Rich Text Editor** | Unnecessary complexity for settings app | Smart home app doesn't need text editing |
| **Mega Menu** | Over-engineered navigation | Simple bottom nav (mobile) + top nav (desktop) sufficient |
| **Animated Illustrations** | Performance cost, maintenance burden | Use simple emoji icons + SVG for status indicators |

### Premature Abstractions

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Component Composition System** | Complex API, over-abstraction | Build concrete components first, extract patterns later if needed |
| **Theming Engine** | YAGNI for single-brand app | Current ember/slate colors sufficient, light/dark mode enough |
| **Icon Library** | Large bundle, unused assets | Use lucide-react sparingly (already in use), emoji for most icons |
| **Animation Library** | Heavy dependency (Framer Motion ~60kb) | Use CSS animations (already working) + View Transitions API |

### Accessibility Theater

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Keyboard Shortcuts Everywhere** | Cognitive overload, conflicts with browser | Focus on logical tab order and essential shortcuts only |
| **Screen Reader Announcements for Everything** | Verbose, annoying experience | Announce state changes only (loading, errors, success) |
| **High Contrast Mode** | Niche requirement, complex to maintain | WCAG AA contrast ratios sufficient (already meeting) |

---

## Component Dependencies

Visual representation of which components depend on others.

```
Foundation Layer (no dependencies):
├── Icon (lucide-react wrapper)
├── Text (typography)
├── Heading (typography)
└── Divider

Core Components (depend on Foundation):
├── Button (depends on: Icon)
├── Badge (depends on: Text)
├── Input (depends on: Text for label)
├── Card (depends on: nothing)
└── Skeleton (depends on: nothing)

Form Controls (depend on Core):
├── Checkbox (depends on: Text for label)
├── Switch (depends on: Text for label)
├── Radio Group (depends on: Text for label)
├── Select (depends on: Text, Icon)
└── Slider (depends on: Text for labels)

Feedback Components (depend on Core):
├── Banner (depends on: Icon, Text, Button)
├── Toast (depends on: Icon, Text, Button)
├── Modal/Dialog (depends on: Card, Button, Icon)
└── Tooltip (depends on: Text)

Layout Components (depend on Foundation):
├── Section (depends on: Heading, Text)
├── Grid (depends on: nothing)
└── Tabs (depends on: Button, Text)

Smart Home Components (depend on Core + Layout):
├── StatusBadge (depends on: Badge, Icon)
├── ControlButton (depends on: Button, Icon)
├── StatusCard (depends on: Card, StatusBadge, Text, Heading)
├── DeviceCard (depends on: Card, StatusBadge, Button)
└── TimelineItem (depends on: Card, Badge, Text)
```

**Key insight:** Build bottom-up. Foundation → Core → Form Controls → Feedback → Smart Home components.

---

## MVP Recommendation

For completing the v3.0 Design System milestone, prioritize based on:
1. **Impact:** Closes functionality gaps or improves consistency across pages
2. **Effort:** Low/Medium complexity components first
3. **Dependencies:** Build foundation components before dependent ones

### Phase 1: Close Critical Gaps (HIGH priority)

**Build these 6 components:**
1. **Checkbox** (Low effort, needed for preferences)
2. **Switch** (Low effort, better mobile UX for toggles)
3. **Slider** (Medium effort, essential for temp/brightness controls)
4. **Modal/Dialog** (Medium effort, formalize existing pattern)
5. **Toast System** (Medium effort, upgrade existing to support queue + positioning)
6. **Tooltip** (Medium effort, contextual help for controls)

**Why:** These fill functional gaps and are expected in modern UIs.

### Phase 2: Consistency Pass (MEDIUM priority)

**Refactor these 4 patterns:**
7. **StatusCard** (Medium effort, make consistent across stove/thermostat/Hue)
8. **DeviceCard** (Medium effort, unified device display component)
9. **Badge** (Low effort, extract generic Badge from StatusBadge)
10. **Radio Group** (Medium effort, needed for upcoming settings screens)

**Why:** Improves consistency, reduces code duplication.

### Phase 3: Accessibility Audit (HIGH priority)

**Audit and fix:**
11. **Keyboard Navigation** (Medium effort, systematic tab order + focus management)
12. **Touch Targets** (Low effort, ensure 44px minimum across all interactive elements)
13. **Reduced Motion** (Low effort, wrap animations in `prefers-reduced-motion` media query)
14. **Focus Rings** (Low effort, consistent ember-glow focus indicator)

**Why:** WCAG AA compliance, production readiness.

### Defer to Post-MVP:

- **Tabs** (Medium effort, useful but not blocking)
- **Accordion** (Medium effort, collapsible sections nice-to-have)
- **Combobox** (High effort, advanced pattern not needed yet)
- **Command Palette** (High effort, power user feature)
- **Gauge Display** (Medium effort, visual enhancement)
- **Chart Component** (High effort, belongs in analytics milestone)
- **Drag-and-Drop** (High effort, customization feature)

---

## Accessibility Requirements by Component

WCAG 2.2 AA compliance baseline (required for production).

| Component | WCAG Requirements | Implementation Notes |
|-----------|-------------------|---------------------|
| **Button** | 4.5:1 contrast, 44px touch target, keyboard accessible | Audit existing, ensure focus ring |
| **Input** | Label association, error messaging, autocomplete hints | Add aria-describedby for errors |
| **Checkbox/Switch** | Label association, keyboard toggle, indeterminate state support | Spacebar to toggle |
| **Slider** | Arrow key adjustment, value announcement, min/max labels | Consider Radix UI Slider primitive |
| **Modal/Dialog** | Focus trap, ESC to close, focus restoration, backdrop click | Use Radix Dialog or build with focus-trap |
| **Toast** | role="status" or role="alert", auto-dismiss or dismissible | Don't trap focus, use aria-live |
| **Tooltip** | Keyboard trigger (focus), aria-describedby, hover delay | ESC to close |
| **Select** | Keyboard navigation, typeahead, label association | Native select = free accessibility |
| **Tabs** | Arrow key navigation, Home/End keys, aria-selected | Radix Tabs provides this |
| **Badge** | Sufficient contrast (3:1 for large text) | Audit ember/sage/ocean colors |

**General Requirements:**
- **Contrast ratios:** 4.5:1 for normal text (already meeting with slate-200/slate-900)
- **Touch targets:** 44x44px minimum (needs audit)
- **Keyboard navigation:** Logical tab order, visible focus indicators (ember glow)
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` wraps all animations
- **Screen reader:** Semantic HTML, ARIA labels where needed, status announcements

---

## Complexity Assessment

Estimated effort levels for each category.

### Low Complexity (1-2 hours each)
- Checkbox (render + state)
- Switch (toggle animation)
- Badge (text + color variant)
- Divider (already exists)
- Focus Ring audit (CSS only)
- Touch Target audit (CSS only)
- Reduced Motion audit (media query wrapper)

### Medium Complexity (3-5 hours each)
- Slider (drag interaction, keyboard, accessibility)
- Modal/Dialog (focus trap, backdrop, animations, ESC handling)
- Toast System (queue management, positioning, auto-dismiss, stacking)
- Tooltip (positioning logic, hover/focus triggers, delay)
- Radio Group (keyboard navigation, selection state)
- StatusCard refactor (unify stove/thermostat/Hue patterns)
- DeviceCard refactor (consistent layout across pages)
- Tabs (keyboard navigation, ARIA)
- Keyboard Navigation audit (systematic testing + fixes)

### High Complexity (6-10 hours each)
- Combobox (search, keyboard navigation, virtualization for long lists)
- Command Palette (fuzzy search, keyboard shortcuts, context-aware actions)
- Drag-and-Drop (touch support, accessibility, visual feedback)
- Gauge Display (SVG rendering, animations, responsiveness)
- Chart Component (data visualization, tooltips, responsiveness, accessibility)

---

## Smart Home Dashboard Patterns (2026)

Insights from Home Assistant 2026.1, ThingsBoard, and Grafana.

### Real-Time Status Indicators

**Pattern:** Color-coded visual hierarchy
- **Green/Sage:** Device connected, operating normally
- **Orange/Ember:** Warning state (low battery, maintenance needed)
- **Red/Danger:** Error state (offline, failed action)
- **Blue/Ocean:** Info state (updating, paused)
- **Gray/Slate:** Inactive, standby

**Implementation:** StatusBadge component with pulse animation for active states (already implemented).

### Control Panels

**Pattern:** Touch-friendly controls with immediate visual feedback
- **Large touch targets** (44px minimum)
- **Debounced API calls** (avoid rapid-fire updates)
- **Optimistic UI updates** (show change immediately, rollback on error)
- **Visual feedback** (button press animation, color change)

**Implementation:** ControlButton component for +/- controls, Slider for continuous ranges.

### Device Cards

**Pattern:** Glanceable status with primary action
- **Top:** Device name + online status badge
- **Center:** Current state (temperature, brightness, status text)
- **Bottom:** Primary action button (turn on/off, adjust, configure)

**Implementation:** Standardize DeviceCard component (currently inconsistent across stove/thermostat/Hue).

### Activity Timeline

**Pattern:** Reverse chronological event log with infinite scroll
- **Card-based layout** (one event per card)
- **Timestamp** (relative: "2 minutes ago")
- **Icon + Color** (visual categorization)
- **Infinite scroll** (load more on scroll)
- **Filters** (by device, event type, date range)

**Implementation:** TimelineItem component + InfiniteScroll pattern (already implemented in notification history).

### Summary Dashboard

**Pattern:** High-level overview with drill-down
- **Top:** Critical alerts (banner at top if any)
- **Section 1:** Active devices count + status
- **Section 2:** Quick actions (common controls)
- **Section 3:** Recent activity (last 5 events)

**Implementation:** Grid layout with StatusCard components.

---

## Modern UX Expectations (2026)

Research from Figma Schema 2025, Builder.io, UXPin.

### Mobile-First Touch Interactions

1. **Bottom Sheet Modals** (iOS style) — Better than center modals on mobile
2. **Swipe Gestures** — Swipe to delete, swipe to refresh (defer to post-MVP)
3. **Pull-to-Refresh** — Standard mobile pattern for real-time data
4. **Haptic Feedback** — Tactile response on button press (PWA feature)

**Priority:** Bottom sheet modals (HIGH), others defer.

### Loading & Empty States

1. **Skeleton Screens** — Better UX than spinners (already implemented)
2. **Progressive Loading** — Show partial data while rest loads
3. **Empty State Illustrations** — Friendly messaging when no data (already implemented)
4. **Error Recovery** — Clear actions on error (retry, contact support)

**Status:** Mostly implemented. Audit for consistency.

### Micro-Interactions

1. **Button Press Feedback** — Scale down 0.95 on press
2. **Hover Transitions** — 200ms color/shadow transition
3. **Focus Indicators** — Visible ember-glow ring
4. **State Transitions** — Smooth color changes (already using 200ms transitions)

**Status:** Partially implemented. Needs consistency audit.

### Accessibility-First

1. **Keyboard Navigation** — Full app navigable without mouse
2. **Screen Reader Support** — Semantic HTML + ARIA where needed
3. **Reduced Motion** — Respect user preference (partially implemented)
4. **Color Contrast** — WCAG AA minimum (already meeting)

**Priority:** Keyboard navigation + screen reader = HIGH. Others = Medium.

---

## Component Variants Philosophy

**Rule:** Limit variants to prevent choice paralysis.

### Button Variants (7 total)
- `primary` — Main CTAs (ember accent)
- `secondary` — Secondary actions (slate)
- `success` — Positive actions (sage green)
- `danger` — Destructive actions (red)
- `accent` — Special emphasis (flame orange)
- `outline` — Ghost with border
- `ghost` — Minimal, text-only

**Sizes:** `sm`, `md`, `lg` (3 total)

### Card Variants (2 total)
- `solid` — Default (bg-slate-900)
- `liquid` — Liquid glass (bg-white/[0.08] + backdrop-blur)

### Text Variants (3 total)
- `body` — Primary text (slate-200 dark, slate-900 light)
- `secondary` — Less emphasis (slate-400 dark, slate-600 light)
- `tertiary` — Minimal emphasis (slate-500)

### Banner/Toast Variants (4 total)
- `info` — Informational (ocean blue)
- `success` — Positive feedback (sage green)
- `warning` — Caution (amber yellow)
- `error` — Failure (danger red)

**Philosophy:** Semantic naming prevents misuse. Limit variants to prevent inconsistency.

---

## Sources

### Design System Research
- [Building the Ultimate Design System: A Complete Architecture Guide for 2026](https://medium.com/@padmacnu/building-the-ultimate-design-system-a-complete-architecture-guide-for-2026-6dfcab0e9999)
- [15 Best React UI Libraries for 2026](https://www.builder.io/blog/react-component-libraries-2026)
- [Modern Frontend Accessibility: A 2026 Developer's Guide](https://medium.com/design-bootcamp/modern-frontend-accessibility-a-2026-developers-guide-b2de10d01d02)

### Component Libraries
- [shadcn/ui — The Foundation for your Design System](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Carbon Design System — Accessibility](https://carbondesignsystem.com/guidelines/accessibility/overview/)

### Smart Home Dashboard Patterns
- [Home Assistant 2026.1: Home is where the dashboard is](https://www.home-assistant.io/blog/2026/01/07/release-20261)
- [8 Inspiring Home Assistant Dashboard Ideas](https://www.seeedstudio.com/blog/2026/01/09/best-home-assistant-dashboards/)
- [Smart Home Dashboard Design: Real-Time Monitoring & IoT UX](https://developex.com/blog/smart-home-dashboard-ux-design/)

### PWA & Mobile Patterns
- [Best PWA Frameworks In 2026](https://webosmotic.com/blog/pwa-frameworks/)
- [7 PWA Trends That Will Define Mobile and Web development in 2026](https://www.appstory.org/blog/7-pwa-trends-that-will-define-mobile-and-web-development-in-2026/)

### Data Visualization
- [GitLab Pajamas Design System — Charts](https://design.gitlab.com/data-visualization/charts/)
- [U.S. Web Design System — Data Visualizations](https://designsystem.digital.gov/components/data-visualizations/)
- [Understanding data visualization dashboards in 2026](https://www.fanruan.com/en/blog/data-visualization-dashboard-key-metrics)

### Anti-Patterns
- [Top 5 Software Anti Patterns to Avoid](https://www.bairesdev.com/blog/software-anti-patterns/)
- [Common Pitfalls and Anti-patterns in Software Design](https://medium.com/@satyendra.jaiswal/common-pitfalls-and-anti-patterns-to-avoid-in-software-design-660a15e1c28a)

---

**Confidence Level:** MEDIUM-HIGH

- **HIGH confidence:** Foundation components list (verified with shadcn/ui, Radix UI official docs)
- **MEDIUM confidence:** Smart home specific patterns (based on WebSearch + common IoT dashboard patterns)
- **MEDIUM confidence:** Complexity estimates (based on Radix UI primitives + typical React component development)

**Verification:** Foundation component list cross-referenced with shadcn/ui (official), Radix UI (official), and multiple design system examples (Carbon, Material UI, Atlassian).

**Gaps:** No official "smart home design system" specification exists. Patterns inferred from popular platforms (Home Assistant, ThingsBoard) and general IoT dashboard best practices.
