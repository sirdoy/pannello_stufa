# Project Research Summary - Design System Evolution

**Project:** Pannello Stufa v3.0 Design System Evolution
**Domain:** PWA Component Library & Design System Completion
**Researched:** 2026-01-28
**Confidence:** HIGH

## Executive Summary

Pannello Stufa requires a production-grade design system built on **custom components using Radix UI primitives** with **Atomic Design methodology** (Atoms → Molecules → Organisms). The current system has 12 foundational components but lacks complex interactive patterns (Dialog, Dropdown, Slider, Tooltip) and consistent accessibility implementation.

The recommended approach combines **headless UI primitives for complex patterns** (Radix provides battle-tested accessibility, focus management, keyboard navigation) with **custom-built simple components** controlled via class-variance-authority for type-safe variant APIs. This gives full control over Ember Noir v2 styling while avoiding 100+ hours of accessibility edge case development. Bundle impact: ~68KB gzipped for complete primitive set versus 500KB+ for full UI frameworks that would conflict with existing design system.

**Critical risks:** Partial adoption (inconsistent UI), accessibility regressions (keyboard nav/focus management), dark mode token failures (hard-coded colors), and performance degradation (bundle bloat from poor tree-shaking). Mitigation: establish ESLint enforcement, comprehensive jest-axe testing, semantic design tokens only, and bundle size budgets with CI gates.

## Key Findings

### Recommended Stack

**Foundation:** Radix UI primitives for complex patterns + CVA for variant management + jest-axe for accessibility testing.

**Core technologies:**
- **@radix-ui/react-dialog** (v1.1.4): Modal/Dialog components — handles focus trapping, ESC close, backdrop, portal rendering, ARIA patterns you shouldn't build from scratch
- **@radix-ui/react-dropdown-menu** (v2.1.4): Dropdown menus — keyboard navigation (arrows, typeahead), nested menus, collision detection
- **@radix-ui/react-select** (v2.1.8): Custom select dropdowns — native select has poor styling, Radix provides accessible alternative with search/multi-select
- **@radix-ui/react-tooltip** (v2.1.8): Tooltips — positioning engine, viewport collision detection, keyboard triggers
- **@radix-ui/react-slider** (implied): Range controls — essential for temperature/brightness but missing from current system
- **class-variance-authority** (v0.7.1): Type-safe variant APIs — standardizes your existing ad-hoc variant logic, provides autocomplete, works seamlessly with Tailwind
- **clsx + tailwind-merge** (v2.1.1 + v2.7.0): Conditional class merging + conflict resolution — canonical "cn utility" pattern (25KB total)
- **jest-axe + @axe-core/react** (v10.0.0 + v4.10.2): Automated accessibility testing — catches ~70% of WCAG violations, runtime console warnings in dev
- **lucide-react** (v0.562.0 KEEP): Icon system already installed — 1,500+ consistent icons, tree-shakable, correct choice verified

**What NOT to add:**
- Full UI frameworks (MUI, Chakra): 500KB-2MB, fight Tailwind, override Ember Noir design system
- Storybook (defer post-milestone): 100+ dependencies, React 19 compatibility issues, single-developer project already has `/debug/design-system` page
- Tailwind v4 migration: Zero functional benefit, configuration paradigm change (JS → CSS), current setup already exposes CSS variables
- CSS-in-JS (Styled Components, Emotion): Runtime cost, conflicts with Tailwind, Server Components compatibility issues
- Animation libraries (Framer Motion): 40KB, existing Tailwind animations + Radix hooks sufficient

### Expected Features

**Must have (table stakes):**
- **Checkbox** — form controls for preferences (LOW effort, missing)
- **Switch** — better mobile UX for toggles (LOW effort, missing)
- **Slider** — essential for temperature/brightness controls (MEDIUM effort, missing)
- **Modal/Dialog** — pattern exists but no reusable component (MEDIUM effort, critical)
- **Toast System** — upgrade existing to support queue + positioning + types (MEDIUM effort, partially implemented)
- **Tooltip** — contextual help for controls (MEDIUM effort, missing)
- **Keyboard Navigation** — full keyboard accessibility, logical tab order (MEDIUM effort, needs audit)
- **Touch Targets** — 44px minimum across all interactive elements (LOW effort, needs audit)
- **Focus Management** — visible ember-glow indicators in all themes (LOW effort, needs consistency)

**Should have (competitive):**
- **StatusCard** — unify stove/thermostat/Hue patterns (MEDIUM effort, inconsistent)
- **DeviceCard** — consistent device display component (MEDIUM effort, inconsistent)
- **Badge** — generic variant extracted from StatusBadge (LOW effort)
- **Radio Group** — mutually exclusive options (MEDIUM effort, upcoming settings)
- **Tabs** — organize dense settings screens (MEDIUM effort, useful but not blocking)
- **Reduced Motion** — respect prefers-reduced-motion (LOW effort, partially implemented)

**Defer (v2+):**
- **Accordion** — collapsible sections (MEDIUM effort, nice-to-have)
- **Combobox** — searchable select (HIGH effort, not needed unless device list grows)
- **Command Palette** — power user ⌘K navigation (HIGH effort, not essential for smart home)
- **Drag-and-Drop** — reorder devices, customize layout (HIGH effort, customization milestone)
- **Gauge Display** — radial gauge for temperature/humidity (MEDIUM effort, visual enhancement)
- **Chart Component** — time series data visualization (HIGH effort, belongs in analytics milestone)

### Architecture Approach

**Atomic Design with Server-First Client Islands:** Four-tier hierarchy (Atoms → Molecules → Organisms → Templates) with clear dependency flow. Components default to Server Components, mark `'use client'` only where necessary.

**Major components:**
1. **Foundation Layer (Atoms)** — Icon, Text, Heading, Divider — no dependencies, semantic HTML, zero client-side logic
2. **Core Components (Atoms)** — Button, Badge, Input, Card, Skeleton — depend on Foundation, minimal props (<10), composition over configuration
3. **Form Controls (Molecules)** — Checkbox, Switch, Slider, Select, Radio Group — depend on Core + Radix primitives, WCAG AA compliance mandatory
4. **Feedback Components (Molecules)** — Banner, Toast, Modal/Dialog, Tooltip — depend on Core + Layout, focus management, ARIA attributes
5. **Layout Components (Molecules)** — Section, Grid, Tabs — depend on Foundation, responsive breakpoints (375px, 768px, 1024px, 1920px)
6. **Smart Home Components (Organisms)** — StatusBadge, ControlButton, StatusCard, DeviceCard, TimelineItem — depend on Core + Layout, real-time status indicators

**Key patterns:**
- **Flat-File Open Code:** Copy components into codebase (not npm dependencies) — shadcn/ui philosophy of owned source code
- **Design Token Foundation:** All colors from CSS variables (`var(--color-bg-surface)`), never hard-coded hex — semantic tokens enable dark mode
- **CVA Variant API:** Standardized variant management — replaces manual switch statements, provides type-safety and autocomplete
- **Bottom-Up Build Order:** Foundation → Core → Form Controls → Feedback → Smart Home — respect dependency hierarchy

### Critical Pitfalls

1. **Partial Component Adoption (CRITICAL)** — Some pages use design system, others use inline styles/old components. After 6 months only 40% adoption. **Prevention:** Create Storybook catalog, ESLint rules blocking old imports, migration tracker spreadsheet, code review checklist, 80%+ adoption target. **Warning signs:** New PRs contain inline styles, multiple button implementations, developers asking "how do I..." for existing patterns.

2. **Accessibility Regressions (CRITICAL)** — Using `<div onClick>` instead of `<button>`, missing focus traps in modals, broken keyboard navigation, color contrast failures. **Prevention:** Semantic HTML first, WCAG AA checklist before merge, keyboard testing (tab through every component), focus management (modals trap focus), jest-axe + manual screen reader testing. **Warning signs:** Can't tab to interactive elements, Lighthouse accessibility <90, screen reader announces incorrectly.

3. **Dark Mode Token Mistakes (CRITICAL)** — Hard-coded hex values break theme switching, flash of unstyled content, white text on white background in dark mode. **Prevention:** Semantic design tokens (`--color-bg-surface` not `--color-gray-100`), CSS variables only (never hex), ESLint blocking hex values, contrast testing both themes. **Warning signs:** `grep -r "#[0-9a-f]{6}"` returns >20 results, dark mode toggle doesn't affect all components, FOUC on load.

4. **Component API Over-Engineering (HIGH)** — 847-line Button with 35 props trying to handle every edge case. **Prevention:** Start minimal (one use case), max 10 props rule, composition over configuration (separate IconButton, ButtonWithIcon), YAGNI principle (only add features when 3+ real use cases exist). **Warning signs:** Component >200 lines, developers say "I don't know which props to use", documentation longer than code.

5. **Performance Regressions (HIGH)** — Bundle grows from 150KB to 450KB, importing entire icon library (500 icons for 3 used), no tree-shaking. **Prevention:** Named imports only, tree-shakeable exports, lazy load heavy components, bundle analysis before/after, zero-runtime CSS (Tailwind not CSS-in-JS), 200KB performance budget in CI. **Warning signs:** Webpack bundle size warnings, Lighthouse performance score decreases, mobile users report "app feels slow".

## Implications for Roadmap

Based on research, suggested 5-phase structure following bottom-up dependency hierarchy and risk mitigation:

### Phase 1: Foundation & Tooling (Week 1-2)
**Rationale:** Establish infrastructure before building components — prevents token mistakes, enforces consistency from day one
**Delivers:** CVA utility, jest-axe setup, design token audit, ESLint rules, component adoption tracker
**Addresses:** Critical pitfalls #3 (dark mode tokens), #1 (partial adoption prevention)
**Avoids:** Building components without consistency/accessibility framework
**Research needs:** None — well-documented patterns
**Dependencies:** None (sets foundation for all subsequent phases)

### Phase 2: Core Interactive Components (Week 3-4)
**Rationale:** Close functional gaps with most-needed components first — Checkbox, Switch, Slider, Modal essential for settings/controls
**Delivers:** 6 missing table-stakes components (Checkbox, Switch, Slider, Modal/Dialog, enhanced Toast, Tooltip)
**Uses:** Radix primitives (Dialog, Switch, Checkbox, Tooltip, Slider)
**Implements:** Form Controls + Feedback Molecules from architecture
**Addresses:** Must-have features, accessibility requirements (WCAG AA)
**Avoids:** Building complex patterns from scratch (pitfall #2)
**Research needs:** None — Radix provides documented patterns
**Dependencies:** Phase 1 (needs CVA + testing infrastructure)

### Phase 3: Consistency Refactoring (Week 5-6)
**Rationale:** Unify inconsistent patterns now that tooling exists — StatusCard/DeviceCard appear 8+ times with variations
**Delivers:** Standardized StatusCard, DeviceCard, Badge, Radio Group components
**Addresses:** Should-have features, code duplication reduction
**Avoids:** Over-engineering (pitfall #4) — these are refinements of existing patterns
**Research needs:** None — refactoring existing code
**Dependencies:** Phase 2 (may use Dialog/Toast in cards)

### Phase 4: Accessibility & Performance Audit (Week 7-8)
**Rationale:** Systematic validation after components built — catch regressions before production deployment
**Delivers:** Keyboard navigation audit, touch target audit, reduced motion wrapper, bundle size optimization
**Addresses:** Must-have accessibility patterns, performance budget enforcement
**Avoids:** Accessibility regressions (pitfall #2), performance degradation (pitfall #5)
**Research needs:** None — testing/auditing phase
**Dependencies:** Phases 2-3 (needs all components built)

### Phase 5: Documentation & Adoption (Week 9-10)
**Rationale:** Document everything, track migration, achieve 80%+ adoption target — prevents partial adoption failure
**Delivers:** Updated Storybook (or `/debug/design-system`), migration tracker showing 80%+ pages using design system, deprecated component removal
**Addresses:** Documentation debt (pitfall #7), partial adoption prevention (pitfall #1)
**Avoids:** Components exist but unused, knowledge locked in developer's head
**Research needs:** None — documentation/cleanup phase
**Dependencies:** Phases 1-4 (needs complete component library)

### Phase Ordering Rationale

- **Foundation first:** Design tokens, CVA, testing infrastructure prevent mistakes in all subsequent phases (addresses pitfalls #3, #2)
- **Core components second:** Close functional gaps before refactoring — avoid premature optimization
- **Consistency third:** Refactor with tooling in place — CVA standardizes variant APIs, jest-axe catches accessibility regressions
- **Audit fourth:** Test systematically after build phase — catch issues before production
- **Documentation last:** Document complete system — Storybook with all components and examples

**Dependency chain:**
- Phase 2 depends on Phase 1 (needs CVA + testing)
- Phase 3 depends on Phase 2 (may compose Dialog/Toast in cards)
- Phase 4 depends on Phases 2-3 (tests complete component set)
- Phase 5 depends on Phases 1-4 (documents complete system)

### Research Flags

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** Design token management well-documented (Tailwind + CVA canonical pattern)
- **Phase 2:** Radix UI official docs provide complete implementation examples with accessibility guidance
- **Phase 3:** Refactoring existing code (no new patterns)
- **Phase 4:** Accessibility/performance auditing uses standard tooling (jest-axe, Lighthouse, bundle-analyzer)
- **Phase 5:** Documentation/migration uses established patterns (Storybook or existing `/debug/design-system`)

**No phases need `/gsd:research-phase`** — All patterns are industry-standard with comprehensive documentation from Radix UI, CVA, Tailwind, and WCAG 2.2 specifications.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Radix UI is industry standard (1,500+ production apps), verified with official docs and ecosystem consensus. CVA + clsx + tailwind-merge canonical pattern (7M+ weekly downloads). jest-axe v10.0.0 confirmed current, verified React 19 compatibility. |
| Features | MEDIUM-HIGH | Foundation components verified with shadcn/ui, Radix UI, Material UI, Carbon Design System. Smart home patterns inferred from Home Assistant 2026.1, ThingsBoard, general IoT best practices (no official "smart home design system" exists). Complexity estimates based on Radix primitives + typical React development. |
| Architecture | HIGH | Atomic Design methodology verified from Brad Frost (original author) and 2026 Next.js best practices. Server-first client islands confirmed Next.js 15 App Router canonical pattern. Component hierarchy validated against shadcn/ui architecture (most successful implementation of this pattern). |
| Pitfalls | MEDIUM-HIGH | Design system adoption failures well-documented in recent 2025-2026 sources (Figr, Knapsack, Netguru). Accessibility standards verified with WCAG 2.2 official requirements. Performance optimization validated with framework-specific 2026 guides. Some component API design relies on general best practices rather than project-specific verification. |

**Overall confidence:** HIGH

### Gaps to Address

**Gap: Smart home component patterns** — No canonical "IoT design system" specification exists. StatusCard, DeviceCard, TimelineItem patterns inferred from observing Home Assistant, ThingsBoard, Grafana. **Resolution:** Build minimal viable components in Phase 2, validate with user testing, iterate based on feedback. Pattern extraction (Phase 3) happens after seeing actual usage.

**Gap: Storybook vs `/debug/design-system`** — Recommendation defers Storybook due to React 19 compatibility issues and single-developer context. **Resolution:** Phase 5 documents components in existing `/debug/design-system` page with comprehensive examples. Revisit Storybook post-milestone if team grows or visual regression testing becomes priority.

**Gap: Component adoption enforcement** — ESLint rules can block old imports but can't force design system usage in new code. **Resolution:** Phase 5 includes migration tracker (spreadsheet showing adoption %), code review checklist, and team training. Set 80%+ adoption goal, allocate cleanup sprint if needed.

**Gap: Manual accessibility testing coverage** — jest-axe catches ~70% of WCAG violations, 30% require manual testing (color contrast in JSDOM, screen reader compatibility). **Resolution:** Phase 4 includes manual keyboard navigation testing and spot-checks with VoiceOver/NVDA. Full WCAG AA certification audit deferred to post-milestone if compliance critical.

## Sources

### Primary (HIGH confidence)

**Stack Research:**
- [Radix UI Official Documentation](https://www.radix-ui.com/primitives) — Component primitives, accessibility patterns
- [Headless UI vs Radix: Which One is Better in 2025?](https://www.subframe.com/tips/headless-ui-vs-radix) — Comparative analysis
- [Class Variance Authority Official Documentation](https://cva.style/docs) — Variant API patterns
- [jest-axe npm](https://www.npmjs.com/package/jest-axe) — Version 10.0.0 verification
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4) — Design tokens, configuration

**Features Research:**
- [shadcn/ui Component Library](https://ui.shadcn.com/) — Foundation component inventory
- [Radix UI Primitives Releases](https://www.radix-ui.com/primitives/docs/overview/releases) — Component coverage
- [Carbon Design System — Accessibility](https://carbondesignsystem.com/guidelines/accessibility/overview/) — WCAG patterns
- [Home Assistant 2026.1 Release](https://www.home-assistant.io/blog/2026/01/07/release-20261) — Smart home dashboard patterns

**Architecture Research:**
- [Atomic Design Methodology by Brad Frost](https://atomicdesign.bradfrost.com/chapter-2/) — Original specification
- [Next.js 15 App Router Architecture](https://www.yogijs.tech/blog/nextjs-project-architecture-app-router) — Server-first patterns
- [Building the Ultimate Design System (2026)](https://medium.com/@padmacnu/building-the-ultimate-design-system-a-complete-architecture-guide-for-2026-6dfcab0e9999) — Component organization

**Pitfalls Research:**
- [Why Design Systems Fail | Knapsack](https://www.knapsack.cloud/blog/why-design-systems-fail) — Adoption patterns
- [Design System Adoption Pitfalls](https://www.netguru.com/blog/design-system-adoption-pitfalls) — Common failures
- [Accessibility in Design Systems](https://www.supernova.io/blog/accessibility-in-design-systems-a-comprehensive-approach-through-documentation-and-assets) — WCAG integration
- [Dark Mode with Design Tokens in Tailwind CSS](https://www.richinfante.com/2024/10/21/tailwind-dark-mode-design-tokens-themes-css) — Token management

### Secondary (MEDIUM confidence)

- [15 Best React UI Libraries for 2026](https://www.builder.io/blog/react-component-libraries-2026) — Ecosystem comparison
- [React UI libraries in 2025](https://makersden.io/blog/react-ui-libs-2025-comparing-shadcn-radix-mantine-mui-chakra) — Framework analysis
- [Smart Home Dashboard Design (DevelopEx)](https://developex.com/blog/smart-home-dashboard-ux-design/) — IoT UX patterns
- [Component API Design Guidelines](https://alanbsmith.medium.com/component-api-design-3ff378458511) — Best practices

### Tertiary (LOW confidence, needs validation)

- Smart home component patterns (StatusCard, DeviceCard) — Inferred from multiple dashboard examples, no canonical specification
- Complexity estimates (1-2 hours LOW, 3-5 hours MEDIUM, 6-10 hours HIGH) — Based on Radix primitives + typical React development, not project-specific timing

---
*Research completed: 2026-01-28*
*Ready for roadmap: yes*
*Suggested phases: 5 (Foundation → Core Components → Consistency → Audit → Documentation)*
*Research needs: None (all phases use well-documented patterns)*
