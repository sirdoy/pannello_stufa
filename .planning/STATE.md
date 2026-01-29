# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-28)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Phase 15 - Smart Home Components (v3.0 Design System Evolution)

## Current Position

Phase: 15 of 18 (Smart Home Components)
Plan: 4 of 6 in phase 15
Status: In progress
Last activity: 2026-01-29 - Completed 15-04-PLAN.md (SmartHomeCard)

Progress: [███████████████████░] 94.9% (74 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 74 (v1.0: 29 plans, v2.0: 21 plans, v3.0: 24 plans)
- Average duration: ~4.5 min per plan
- Total execution time: ~5.5 hours across 3 milestones

**By Milestone:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1.0 Push Notifications | 5 | 29 | 4 days (2026-01-23 -> 2026-01-26) |
| v2.0 Netatmo Control | 5 | 21 | 1.4 days (2026-01-27 -> 2026-01-28) |
| v3.0 Design System | 8 | 23 | In progress |

**Recent Trend:**
- Milestone velocity improving (v2.0 shipped in 1/3 the time of v1.0)
- Plan complexity stable (~5 min average)
- Phase 15 in progress (4/6 plans done)

*Updated after 15-04 completion*

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

### Pending Todos

**Operational Setup (v1.0 + v2.0 shipped, pending deployment):**
- Scheduler cron configuration (cron-job.org account, 15-30 min)
- Health monitoring cron (1-min frequency): `/api/health-monitoring/check`
- Coordination cron (1-min frequency): `/api/coordination/enforce`
- Firestore indexes: `firebase deploy --only firestore:indexes`

### Blockers/Concerns

None. Phase 15 in progress.

**Known Tech Debt:**
- TODO: Track STARTING state entry time for grace period (Phase 7, low priority)
- Warning: DMS polling continues when page backgrounded (Phase 10, should use Page Visibility API)

## Session Continuity

Last session: 2026-01-29 14:20 UTC
Stopped at: Completed 15-04-PLAN.md (SmartHomeCard)
Resume file: None
Next step: Continue Phase 15 (15-05 through 15-06)
