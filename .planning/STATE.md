# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-28)

**Core value:** I dispositivi vengono riconosciuti automaticamente dopo il riavvio del browser e le notifiche arrivano sempre (100% delivery rate per dispositivi registrati).
**Current focus:** Phase 13 - Foundation Refactoring (v3.0 Design System Evolution)

## Current Position

Phase: 12 of 18 (Core Interactive Components) - COMPLETE
Plan: 3 of 3 in phase 12 (COMPLETE)
Status: Phase 12 verified and complete
Last activity: 2026-01-28 - Phase 12 verification passed (6/6 must-haves)

Progress: [██████████████░░░░] 66.7% (12 phases complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 56 (v1.0: 29 plans, v2.0: 21 plans, v3.0: 6 plans)
- Average duration: ~5.0 min per plan
- Total execution time: ~4.7 hours across 3 milestones

**By Milestone:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1.0 Push Notifications | 5 | 29 | 4 days (2026-01-23 -> 2026-01-26) |
| v2.0 Netatmo Control | 5 | 21 | 1.4 days (2026-01-27 -> 2026-01-28) |
| v3.0 Design System | 8 | 6 | In progress |

**Recent Trend:**
- Milestone velocity improving (v2.0 shipped in 1/3 the time of v1.0)
- Plan complexity stable (~5 min average)
- Phase 12 in progress (3/5 plans)

*Updated after 12-03 completion*

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

### Pending Todos

**Operational Setup (v1.0 + v2.0 shipped, pending deployment):**
- Scheduler cron configuration (cron-job.org account, 15-30 min)
- Health monitoring cron (1-min frequency): `/api/health-monitoring/check`
- Coordination cron (1-min frequency): `/api/coordination/enforce`
- Firestore indexes: `firebase deploy --only firestore:indexes`

### Blockers/Concerns

None. Phase 12 complete with all 3 plans executed and verified.

**Known Tech Debt:**
- TODO: Track STARTING state entry time for grace period (Phase 7, low priority)
- Warning: DMS polling continues when page backgrounded (Phase 10, should use Page Visibility API)

## Session Continuity

Last session: 2026-01-28
Stopped at: Phase 12 complete - all 6 components delivered (Checkbox, Switch, RadioGroup, Select, Input, Slider)
Resume file: None
Next step: Begin Phase 13 (Foundation Refactoring)
