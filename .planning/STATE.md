# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-28)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Phase 13 - Foundation Refactoring (v3.0 Design System Evolution) - COMPLETE

## Current Position

Phase: 13 of 18 (Foundation Refactoring) - COMPLETE
Plan: 5 of 5 in phase 13 (ALL COMPLETE)
Status: Phase 13 complete
Last activity: 2026-01-29 - Completed 13-05-PLAN.md (Button legacy props migration)

Progress: [███████████████░░░] 77.8% (14 phases complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 61 (v1.0: 29 plans, v2.0: 21 plans, v3.0: 11 plans)
- Average duration: ~4.7 min per plan
- Total execution time: ~5.0 hours across 3 milestones

**By Milestone:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1.0 Push Notifications | 5 | 29 | 4 days (2026-01-23 -> 2026-01-26) |
| v2.0 Netatmo Control | 5 | 21 | 1.4 days (2026-01-27 -> 2026-01-28) |
| v3.0 Design System | 8 | 11 | In progress |

**Recent Trend:**
- Milestone velocity improving (v2.0 shipped in 1/3 the time of v1.0)
- Plan complexity stable (~5 min average)
- Phase 13 COMPLETE (5/5 plans done)

*Updated after 13-05 completion*

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

### Pending Todos

**Operational Setup (v1.0 + v2.0 shipped, pending deployment):**
- Scheduler cron configuration (cron-job.org account, 15-30 min)
- Health monitoring cron (1-min frequency): `/api/health-monitoring/check`
- Coordination cron (1-min frequency): `/api/coordination/enforce`
- Firestore indexes: `firebase deploy --only firestore:indexes`

### Blockers/Concerns

None. Phase 13 complete. Ready for Phase 14.

**Known Tech Debt:**
- TODO: Track STARTING state entry time for grace period (Phase 7, low priority)
- Warning: DMS polling continues when page backgrounded (Phase 10, should use Page Visibility API)

## Session Continuity

Last session: 2026-01-29
Stopped at: Completed 13-05-PLAN.md (Button legacy props migration across 32 files)
Resume file: None
Next step: Begin Phase 14 (Smart Home Components) or phase review
