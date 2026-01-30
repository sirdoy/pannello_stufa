# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-28)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** v3.0 MILESTONE COMPLETE — Design System Evolution shipped

## Current Position

Phase: 18 of 18 (Documentation Polish) - COMPLETE
Plan: 4 of 4 in phase 18 (COMPLETE)
Status: v3.0 MILESTONE COMPLETE
Last activity: 2026-01-30 - Completed Phase 18 (Documentation & Polish)

Progress: [████████████████████] 100% (99 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 99 (v1.0: 29 plans, v2.0: 21 plans, v3.0: 49 plans)
- Average duration: ~4.5 min per plan
- Total execution time: ~7.0 hours across 3 milestones

**By Milestone:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1.0 Push Notifications | 5 | 29 | 4 days (2026-01-23 -> 2026-01-26) |
| v2.0 Netatmo Control | 5 | 21 | 1.4 days (2026-01-27 -> 2026-01-28) |
| v3.0 Design System | 8 | 50 | 2.5 days (2026-01-28 -> 2026-01-30) |

**Recent Trend:**
- Milestone velocity improving (v2.0 shipped in 1/3 the time of v1.0, v3.0 in 2.5 days)
- Plan complexity stable (~5 min average)
- All 3 milestones shipped: v1.0 (29 plans), v2.0 (21 plans), v3.0 (50 plans)

*Updated after Phase 18 completion (v3.0 milestone complete)*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v3.0: Design system approach chosen (Radix UI primitives + CVA + custom components over full UI frameworks)
- v3.0: Comprehensive depth (8 phases) to maintain natural requirement boundaries without artificial compression
- v3.0: Bottom-up build order (Foundation -> Core -> Smart Home -> Pages) respects dependency hierarchy
- **11-01: Named export cn (not default) for better tree-shaking**
- **11-01: tailwind-merge v3.4.0 (latest) compatible with Tailwind v4**
- **11-02: Individual @radix-ui packages (not monolithic) for better tree-shaking**
- **11-02: Color contrast disabled in axe (JSDOM limitation)**
- **11-02: runAxeWithRealTimers helper for fake timer compatibility**
- **11-03: eslint-plugin-tailwindcss v4 beta (only version supporting Tailwind v4)**
- **11-03: Native eslint-config-next flat config (FlatCompat caused circular reference)**
- **11-03: Warn mode for no-arbitrary-value (gradual cleanup)**
- **12-01: Radix CheckboxPrimitive for full WAI-ARIA compliance**
- **12-01: Switch uses duration-250 for smooth animation per CONTEXT decision**
- **12-01: Toggle.js deprecated - re-exports Switch for backwards compatibility**
- **12-01: focus-visible:ring-ember-500/50 for all form controls (ember glow)**
- **12-02: JSDOM polyfills for Radix UI (hasPointerCapture, scrollIntoView, ResizeObserver, DOMRect)**
- **12-02: Select backwards-compatible API (options array, onChange synthetic event)**
- **12-02: Number value preservation in Select onChange wrapper**
- **12-03: Input clearable/showCount are opt-in props (not default)**
- **12-03: Real-time validation runs on every change (immediate feedback)**
- **12-03: Slider accepts number, converts to array internally (simpler API)**
- **12-03: Slider aria-label passed to Thumb, not Root (axe compliance)**
- **13-01: Remove legacy Button props entirely (no backwards compatibility)**
- **13-01: Button.Icon defaults to ghost variant**
- **13-01: Compound variants for iconOnly sizing**
- **13-02: Namespace pattern (Card.Header) over separate imports for better DX**
- **13-02: forwardRef on all Card sub-components for composability**
- **13-02: No backwards compatibility for legacy Card props (liquid, glass, elevation)**
- **13-02: Boolean variants (hover, glow, padding) via CVA for cleaner API**
- **13-03: Label uses ::after pseudo for required asterisk (CSS-only, no extra DOM)**
- **13-03: Divider adds role=separator and aria-orientation for accessibility**
- **13-03: Dashed variant uses border-t-2 instead of background (proper dashing)**
- **13-04: Level-to-size auto-calculation preserved (h1->3xl, h2->2xl, etc.)**
- **13-04: Explicit size prop overrides auto-calculation in Heading**
- **13-04: Label variant deduplication (uppercase+tracking built-in)**
- **13-04: Default sizes per Text variant for backwards compatibility**
- **13-05: Extended migration scope to ensure complete codebase coverage**
- **13-05: variant='ocean' replaced with variant='outline' for consistency**
- **13-06: Complete migration pattern (all legacy props removed in single phase)**
- **13-07: Gap closure for 5 scheduler files missed in 13-06**
- **13-08: Gap closure for ButtonIcon import in design-system page**
- **14-02: Tooltip delay 400ms/300ms for show/skip, 4px sideOffset default**
- **14-02: Arrow included by default in TooltipContent**
- **14-02: Skip JSDOM mouse leave test (Radix handles internally)**
- **14-03: Provider pattern for toast stacking (max 3 visible)**
- **14-03: Error toasts get 8s duration (vs 5s default)**
- **14-03: listitem a11y rule disabled in tests (JSDOM portal limitation)**
- **14-04: Spinner uses SVG with two circles (background + spinning arc)**
- **14-04: Progress uses aria-label prop (default 'Progress') for axe compliance**
- **14-04: Progress auto-detects indeterminate when value is undefined/null**
- **14-04: Keep ProgressBar.js for backwards compatibility**
- **14-05: EmptyState icon marked aria-hidden for accessibility**
- **14-05: Banner uses lucide-react icons instead of emoji by default**
- **14-05: Banner falls back to info variant for invalid variants**
- **14-05: Banner exports bannerVariants for external CVA styling**
- **14-06: PageLayout uses slot pattern (header, footer props) instead of children-based structure**
- **14-06: SidebarContext default values (no throw on outside use)**
- **14-06: DashboardLayout 7 namespace sub-components for maximum composability**
- **14-07: Section level={2} size='2xl' for h2 semantic heading**
- **14-07: Subtitle optional (no default value) for flexible usage**
- **14-07: Grid 'as' prop enables ul/ol/nav semantic patterns**
- **14-07: Props spread to support data-testid and other attributes**
- **15-02: Pulse animation via CVA boolean variant (pulse: { true: 'animate-glow-pulse' })**
- **15-02: Badge neutral variant as default (inactive state first, active explicitly set)**
- **15-03: Separate dotVariants CVA for ConnectionStatus dot styling**
- **15-03: forwardRef pattern for status indicator components**
- **15-03: Italian status labels (Online, Offline, Connessione..., OK, Attenzione, Errore, Critico)**
- **15-04: SmartHomeCard namespace sub-components (Header, Status, Controls) for semantic card areas**
- **15-04: Icon aria-hidden='true' for decorative device icons in SmartHomeCard**
- **15-04: Loading overlay z-10 for proper stacking within cards**
- **15-04: CardAccentBar animation disabled when card disabled**
- **15-06: DeviceCard backwards compatibility maintained (all legacy props work)**
- **15-06: DeviceCard uses Badge for statusBadge (CVA integration)**
- **15-06: Pulse animation for ember, sage, primary, success statusBadge colors**
- **15-06: LoadingOverlay separate from SmartHomeCard isLoading for full-page blocking**
- **15-07: Grid CVA accepts numeric cols (1-6), not objects**
- **15-07: Grid CVA gap variants: none/sm/md/lg (not "large")**
- **15-08: ControlButton step=5 matches original 5% brightness increment**
- **15-08: onChange(delta) uses delta to calculate new bounded value with Math.max/min**
- **15-09: Design system showcase includes all Phase 15 components**
- **16-01: Section level prop defaults to 2 (h2), pages set level={1} for h1 accessibility**
- **16-01: Section size='3xl' for level 1, '2xl' for level 2+ (visual hierarchy)**
- **16-01: spacing='lg' for main page sections (Dashboard pattern)**
- **16-02: Badge variant mapping for stove page status indicators (sage/neutral, warning/ocean, danger/neutral)**
- **16-02: Button variant='warning' for mode return action, variant='outline' for navigation**
- **16-03: Mode buttons use Button with variant='subtle'/'ghost' + custom activeClassName for mode-specific colors**
- **16-03: Grid cols={3} with className override for md breakpoint (topology info needs 3 cols at md)**
- **16-03: Banner variant='info' replaces custom div styling for troubleshooting boxes**
- **16-04: Slider onChange receives number directly (not array) per 12-03 API**
- **16-04: Badge ember variant with pulse for room ACCESO, without pulse for light ON**
- **16-04: cn() for conditional card borders (on/off states)**
- **16-05: Section spacing='none' for grid wrappers (Grid provides gap)**
- **16-05: aria-hidden='true' on decorative icons for accessibility**
- **16-05: role='region' + aria-label + tabIndex={0} for scrollable containers**
- **16-06: variant='secondary' is invalid Button variant - must use subtle for secondary actions**
- **16-07: Banner variant='success' with dismissible for save confirmation**
- **16-07: Banner variant='error' compact for inline error messages**
- **16-07: Badge variant='ocean' for device count, Badge variant='sage' for PWA indicator**
- **16-07: Card component for device list items (replaces inline bg/border styling)**
- **16-07: border-default token for dividers (eliminates light mode overrides)**
- **16-10: Badge variant='sage' size='sm' for device active indicator**
- **16-10: Banner variant='info' compact for theme saving status**
- **16-10: Theme selection buttons are styled divs (radio-button pattern, not action buttons)**
- **16-08: PageLayout wrapper for design system showcase**
- **16-08: SectionShowcase helper renamed to avoid Section import conflict**
- **16-08: Tooltip.Provider wrapper required for tooltip context in demos**
- **16-11: Card glow for status indicator in transitions page**
- **16-11: Banner info variant for help sections in debug pages**
- **16-11: Design tokens: bg-{color}-500/10 for dark, bg-{color}-50 for light**
- **17-01: SSR defaults to reduced motion (true) for accessibility safety**
- **17-01: Query for no-preference instead of reduce for simpler logic**
- **17-01: CSS handles animation reduction; useReducedMotion hook for JS logic changes**
- **17-03: Tab focus test pattern: render with button Before, user.tab(), expect element toHaveFocus()**
- **17-03: Tab skip test pattern: disabled element between two buttons, Tab should skip**
- **17-03: Readonly vs disabled distinction: readonly receives focus but blocks editing**
- **17-03: Slider Home/End keys for min/max, PageUp/PageDown for 10% steps**
- **17-02: RadioGroup arrow tests check focus only (not selection) due to JSDOM limitation with Radix auto-select**
- **17-04: Focus trap tests verify both forward and reverse Tab cycling**
- **17-04: Enter and Space key activation tests for close/dismiss buttons**
- **17-04: Toast ARIA roles tested via viewport region semantics**
- **17-04: Banner keyboard accessibility tests for Tab navigation**
- **17-05: Design token contrast documented via test comments (JSDOM cannot verify actual contrast ratios)**
- **17-05: Focus indicator tests verify CSS classes, not visual behavior (JSDOM limitation)**
- **17-05: All variant/size loops for comprehensive axe coverage**
- **17-06: ControlButton keyboard tests verify focus, not activation (uses mouse events for long-press)**
- **17-06: ConnectionStatus/HealthIndicator already had complete accessibility tests (no changes needed)**
- **17-06: SmartHomeCard/DeviceCard keyboard tests focus on interactive elements within cards**
- **17-06: StatusCard tests verify status badge visibility and connection status announcements**
- **17-07: Select axe tests disable aria-required-parent rule (JSDOM portal artifact)**
- **17-07: Button.Icon uses aria-label prop (not label prop)**
- **17-07: Touch target verification via class checks (min-h-[44px], min-w-[44px])**
- **17-07: Animation reduction verified via CSS globals.css @media prefers-reduced-motion**
- **18-01: vscDarkPlus theme for syntax highlighting (VS Code Dark+ aesthetic)**
- **18-01: Copy button uses ghost variant with visual feedback (2s timeout)**
- **18-01: PropTable required props marked with asterisk**
- **18-01: ComponentDemo responsive grid: code left/bottom, preview right/top**
- **18-02: Single file for all component metadata (component-docs.js)**
- **18-02: Italian default labels documented for ConnectionStatus and HealthIndicator**
- **18-02: ControlButton keyboard triggers single step only (long-press uses mouse events)**
- **18-03: PropTable shown for all documented components**
- **18-03: CodeBlock for components with complex usage patterns**
- **18-03: AccessibilitySection for interactive components only (not presentational Badge)**
- **18-03: Documentation integration pattern: PropTable + optional CodeBlock + optional AccessibilitySection**
- **18-04: Comprehensive component tables by category in design-system.md**
- **18-04: Keyboard navigation tables per component type in accessibility.md**
- **18-04: ARIA patterns with code examples for all interactive components**
- **18-04: Manual testing checklist included in accessibility.md**

Key architectural patterns from v1.0 + v2.0:
- Dual persistence strategy (IndexedDB + localStorage) for token survival
- Firebase RTDB for real-time state, Firestore for historical queries
- HMAC-secured cron webhooks for security without key rotation
- Fire-and-forget logging pattern (don't block critical operations)
- Global 30-minute notification throttle across system events

**v3.0 Patterns Established:**
- cn() pattern: `cn(baseClasses, conditionalClasses, className)` - last argument wins conflicts
- Test location: `lib/utils/__tests__/*.test.js` for utility tests
- A11y test pattern: `render(component) -> await axe(container) -> expect(results).toHaveNoViolations()`
- Global axe matcher: toHaveNoViolations available in all tests via jest.setup.js
- Semantic token naming: `{purpose}-{variant}` (bg-primary, text-muted, border-default)
- Light mode overrides: Same token name, different value via html:not(.dark)
- CVA variants: `cva(baseClasses, { variants: { size, variant }, defaultVariants })` for component variants
- Radix primitive wrapping: Import as `* as Primitive`, wrap Root/Indicator/Thumb with cn()
- Input validation: `validate` prop for real-time `(value) => errorString | null`
- Slider API: Accept number, convert to array for Radix, unwrap on callback
- Namespace components: `Component.Sub` pattern for compound components (Button.Icon, Button.Group, Card.Header)
- buttonVariants export: Allow external styling with CVA variant function
- cardVariants export: Allow external styling with CVA variant function
- Namespace compound pattern: `Card.Header = CardHeader; export both for tree-shaking`
- CVA boolean variants: `{ true: [...], false: [] }` pattern for hover/glow/padding
- Label: Radix Label.Root with CVA variants for consistent form labels
- Divider: role=separator with aria-orientation for screen reader context
- **Button migration pattern: variant="ember" for primary, variant="subtle" for secondary**
- **Complete codebase migration over partial (ensure no legacy props remain)**
- **Card migration pattern: variant="glass" for glass/liquid effect**
- **Polymorphic component pattern: as prop with Component alias**
- **CVA spacing pattern: none/sm/md/lg with responsive classes**
- **Badge CVA pattern: badgeVariants with variant/size/pulse for status indicators**
- **Status components pattern: role='status' + aria-live='polite' for accessibility**
- **HealthIndicator icons: CheckCircle2 (ok), AlertTriangle (warning), XCircle (error), AlertOctagon (critical)**
- **SmartHomeCard composition: Card + CardAccentBar internally, padding handled by content wrapper**
- **SmartHomeCard size variants: compact (p-3 sm:p-4) for dashboard, default (p-5 sm:p-6) for full view**
- **DeviceCard legacy prop preservation: Maintain all existing props while adding new API**
- **DeviceCard Badge integration: statusBadge converted to Badge internally with CVA styling**
- **ControlButton integration: onChange with Math.max/min bounds checking for safe range**
- **Page title pattern: Section level={1} for h1 accessibility, level={2} for sub-sections**
- **Slider brightness pattern: value/onChange with number API, aria-label per control**
- **Badge status pattern: ember with pulse for major status, ember without pulse for inline indicators**
- **Button variant override pattern: Use className to override variant colors while keeping Button base styling**
- **Grid breakpoint override pattern: Pass className='md:grid-cols-X' when default responsive pattern doesn't match**
- **Banner for help boxes pattern: Use Banner component with children for complex help/info content**
- **Debug page layout: PageLayout maxWidth='4xl' with space-y-6 content wrapper**
- **useReducedMotion pattern: typeof window check for SSR, matchMedia listener for updates**
- **Reduced motion testing: verify animation classes present, document CSS handles reduction**
- **Essential feedback preservation: components remain visible regardless of motion preference**
- **Keyboard navigation test pattern: Tab focus, arrow keys, Enter selection, Escape close**
- **Disabled tab order pattern: disabled elements skipped, readonly elements receive focus**
- **Focus trap testing pattern: Tab cycles forward, Shift+Tab cycles backward within container**
- **Keyboard activation testing pattern: focus element, keyboard press, verify callback**
- **ARIA role testing pattern: verify container roles and screen reader semantics**
- **Icon aria-hidden pattern: decorative icons marked aria-hidden=true**
- **Design token contrast test pattern: verify class, document expected ratio in comment**
- **Semantic role test pattern: screen.getByRole with level/orientation attributes**
- **Variant loop test pattern: iterate all variants in single test for comprehensive coverage**
- **Smart home card keyboard pattern: Tab navigates through interactive elements within cards**
- **Status indicator pattern: role='status' + aria-live='polite' for screen reader announcements**
- **Button activation pattern: Enter and Space keys trigger onClick handlers**
- **Comprehensive axe suite pattern: Group tests by component category (Form, Feedback, Layout, Smart Home)**
- **Variant loop test pattern: test.each for all variants/sizes in single describe block**
- **Focus ring verification pattern: expect(element).toHaveClass('focus-visible:ring-ember-500/50')**
- **Touch target verification pattern: expect(button).toHaveClass('min-h-[44px]')**
- **Documentation component pattern: CodeBlock for code display with copy functionality**
- **PropTable pattern: { name, type, default, description, required } object structure**
- **AccessibilitySection pattern: { keyboard, aria, screenReader } props for a11y docs**
- **ComponentDemo pattern: side-by-side code/preview in responsive grid**
- **componentDocs structure: { name, description, category, props[], keyboard[], aria[], screenReader, codeExample }**
- **Component categorization: Form Controls, Feedback, Layout, Smart Home**
- **Helper functions pattern: getComponentsByCategory, getCategories, getComponentDoc for filtering**

### Pending Todos

**Operational Setup (v1.0 + v2.0 shipped, pending deployment):**
- Scheduler cron configuration (cron-job.org account, 15-30 min)
- Health monitoring cron (1-min frequency): `/api/health-monitoring/check`
- Coordination cron (1-min frequency): `/api/coordination/enforce`
- Firestore indexes: `firebase deploy --only firestore:indexes`

### Blockers/Concerns

None - Phase 18 complete. v3.0 Design System Evolution milestone complete!

**Known Tech Debt:**
- TODO: Track STARTING state entry time for grace period (Phase 7, low priority)
- Warning: DMS polling continues when page backgrounded (Phase 10, should use Page Visibility API)

## Session Continuity

Last session: 2026-01-30
Stopped at: Completed 18-04-PLAN.md (Documentation Update) - Phase 18 complete
Resume file: None - v3.0 milestone complete
Next step: v3.0 Design System Evolution milestone complete. Ready for operational deployment or new milestone.
