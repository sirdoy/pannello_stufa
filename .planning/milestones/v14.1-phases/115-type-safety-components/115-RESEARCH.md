# Phase 115: Type Safety app/ Components - Research

**Researched:** 2026-03-22
**Domain:** TypeScript type safety — React component props, CVA variant unions, Radix UI callback signatures
**Confidence:** HIGH

## Summary

Phase 115 eliminates 37 `as any` casts across 22 component files in `app/components/` and `app/thermostat/`. The casts fall into six distinct categories identified in CONTEXT.md. All decisions are locked — this is a mechanical execution of those decisions, not an exploratory phase.

Every cast has a clear root cause that was diagnosed during discussion: mismatched prop types that are narrower than the values passed (icon `string` vs `ReactNode`, variant `string` vs CVA union), index-signature interfaces used as spread targets, unnecessary casts where types already match, and one pattern-property antipattern. No cast requires a new library or architectural change.

The key risk is integration: `ButtonProps.icon` widening affects all Button consumers, and `DeviceCard` interface changes affect all device cards (7 device types). Changes must be backward-compatible by design — widening a type to `string | ReactNode` never breaks callers that pass strings.

**Primary recommendation:** Group into 3 plans by pattern proximity — (1) icon props + DeviceCard interface alignment (TYPE-07 + TYPE-10), (2) spread patterns (TYPE-08), (3) variant casts + remaining component casts (TYPE-09 + TYPE-11 + TYPE-12).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Widen `ButtonProps.icon` from `string` to `string | React.ReactNode`
**D-02:** Affected icon cast files: `HlsPlayer.tsx:291`, `EventPreviewModal.tsx:65`, `CameraCard.tsx:359`, `ManualOverrideSheet.tsx:181`, `ScheduleSelector.tsx:96`, `DeviceCard.tsx:275`
**D-03:** `LoadingOverlay.icon` prop also needs widening from `string` to `string | ReactNode`
**D-04:** DeviceCard's `BannerItem`, `FooterAction`, `ToastNotification` index signatures — align with actual component props they spread into
**D-05:** `BannerItem` → extend `BannerProps` directly, drop redundant interface
**D-06:** `FooterAction` → extend `ButtonProps` with required `label: string`, drop `[key: string]: any`
**D-07:** `ToastNotification` → extend `ToastProps` with required `show: boolean`, drop `[key: string]: any`
**D-08:** Empty spread patterns in `ConfirmDialog.tsx:111`, `Panel.tsx:61`, `ErrorAlert.tsx:101` — pass explicit props or remove spread
**D-09:** `BottomSheet.tsx:140` — type the ActionButton inline object as `ActionButtonProps`
**D-10:** `FormModal.tsx:302` — type the inline object to match `ModalProps`
**D-11:** `StoveCard.tsx:111` — type `statusDisplay.variant` as Badge variant union
**D-12:** `StoveCard.tsx:118` — type `statusDisplay.health` as HealthIndicator status union
**D-13:** `DataTable.tsx:659` — replace `<Text as="label">` with a plain `<label>` element using same design system classes
**D-14:** `LightsCard.tsx:63` — `'outline' as any` in footerActions; ensure `FooterAction.variant` includes `'outline'` (D-06 already covers this)
**D-15:** `LightsRoomControl.tsx:257,269` — type `adaptive.buttonVariant` as ControlButton variant union
**D-16:** `LightsRoomControl.tsx:233,241` — Slider `onChange`/`onValueCommit` callbacks cast; match actual Slider callback signature
**D-17:** `LightsCard.tsx:88,92` — export `StatusBadgeConfig` and `FooterAction` from DeviceCard; LightsCard constructs them correctly
**D-18:** `SmartHomeCard.tsx:214` — pass `children` as explicit prop to Banner (already accepts it)
**D-19:** `TransitionLink.tsx:62` — remove `as any`; types already match
**D-20:** `ControlButton.tsx:141,145` — replace property-on-function pattern with module-level `WeakSet<(...args: unknown[]) => void>`
**D-21:** `RoomCard.tsx:436` — render `<BatteryBadge>` as JSX instead of calling as function
**D-22:** `ThermostatCard.tsx:74-75` — type `activeSchedule` with interface that includes `id`
**D-23:** `ThermostatCard.tsx:340` — `NETATMO_ROUTES` is already typed with `setRoomThermpoint`; remove the cast
**D-24:** `WeatherCardWrapper.tsx:128` — align `WeatherData` interface in wrapper with `WeatherCardProps.weatherData` type
**D-25:** `FormModal.tsx:87` — use `error instanceof Error ? error.message : 'Invalid value'`
**D-26:** `WeeklyTimeline.tsx:50` — type the schedule parameter to match what `parseTimelineSlots` expects

### Claude's Discretion
- Grouping into plans (by pattern type vs by file cluster)
- Whether to export DeviceCard interfaces or keep them internal with re-exports
- Exact variant union literals for StoveCard statusDisplay (derive from actual usage)
- Whether Slider callback types come from Radix or are declared locally

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TYPE-07 | Component `icon` prop casts (`<X /> as any`) eliminated with proper typing | Button.icon widened to `string \| ReactNode`; LoadingOverlay.icon widened identically |
| TYPE-08 | Component spread patterns (`{...({} as any)}`) eliminated | DeviceCard interfaces restructured; BottomSheet/ConfirmDialog/Panel/ErrorAlert/FormModal empty spreads replaced |
| TYPE-09 | `variant` prop casts eliminated with proper union types | CVA `VariantProps` extractions; Slider callback signature matched; Text→label swap in DataTable |
| TYPE-10 | `DeviceCard` banner/action/toast prop types aligned | Export `StatusBadgeConfig`, `FooterAction` from DeviceCard; LightsCard/SmartHomeCard use them |
| TYPE-11 | `TransitionLink` `usePageTransition()` return typed | Hook already returns `PageTransitionContextValue` — cast is simply unnecessary |
| TYPE-12 | `ControlButton` `_warned` property typed properly | Module-level `WeakSet` replaces property-on-function antipattern |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| class-variance-authority | ^0.7.1 | CVA variant union extraction via `VariantProps<typeof xyzVariants>` | Already used throughout codebase for all design system variants |
| React | ^19 | `React.ReactNode` type for icon widening | Project baseline |
| TypeScript | ^5.x | Structural alignment, union types, `WeakSet` | Project baseline |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-toast | current | `ToastProps` target type for ToastNotification alignment | D-07 |
| lucide-react | current | Icon components passed as `ReactNode` (no type change needed to icons themselves) | D-01 through D-03 |

**No new installations required.** All libraries already present.

## Architecture Patterns

### Recommended Project Structure
No structural changes. All edits are within existing files.

### Pattern 1: Widening icon props (TYPE-07)
**What:** Change `icon?: string` to `icon?: string | React.ReactNode` in Button and LoadingOverlay
**When to use:** Component accepts both emoji strings and Lucide JSX elements
**Example:**
```typescript
// Button.tsx — before
icon?: string;
// After
icon?: string | React.ReactNode;

// LoadingOverlay.tsx — before
icon?: string;
// After
icon?: string | React.ReactNode;
```
The render path in Button already handles both via `typeof icon === 'string'`. No render logic changes needed.

### Pattern 2: Replacing index-signature interfaces (TYPE-08, TYPE-10)
**What:** Replace `[key: string]: any` interfaces with typed extensions of target component props
**When to use:** An interface is used only to spread into a specific component
**Example:**
```typescript
// DeviceCard.tsx — before
interface BannerItem {
  variant: 'info' | 'success' | 'warning' | 'error';
  icon?: any;
  [key: string]: any;
}

// After — extends the actual BannerProps
import type { BannerProps } from './Banner';
export interface BannerItem extends BannerProps {
  // variant already in BannerProps; no additional fields needed
}

// FooterAction — before
interface FooterAction {
  label: string;
  variant?: 'ember' | ...;
  [key: string]: any;
}

// After — extends ButtonProps, adds required label
import type { ButtonProps } from './Button';
export interface FooterAction extends ButtonProps {
  label: string;
}

// ToastNotification — extends ToastProps
import type { ToastProps } from './Toast';
export interface ToastNotification extends ToastProps {
  show: boolean;
}
```
Note: Once exported, `LightsCard.ts` and other callers use these interfaces directly (D-17).

### Pattern 3: CVA variant union extraction (TYPE-09)
**What:** Use `VariantProps<typeof xxxVariants>` or explicit literal union to type props that feed into CVA variant props
**When to use:** A string field is passed as a CVA variant value
**Example:**
```typescript
// StoveCard.tsx statusDisplay object — typed at definition site
interface StatusDisplay {
  variant: 'ember' | 'ocean' | 'sage' | 'warning' | 'danger' | 'neutral';
  health: 'ok' | 'warning' | 'error' | 'critical';
  label: string;
  pulse?: boolean;
}

// LightsRoomControl.tsx adaptive config
interface AdaptiveConfig {
  buttonVariant: 'ember' | 'ocean' | 'sage' | 'warning' | 'danger' | 'subtle';
  slider: string;
  buttonClass: string;
}
```
Derive exact union literals by reading CVA variant definitions in Badge.tsx, HealthIndicator.tsx, ControlButton.tsx.

### Pattern 4: WeakSet for function flag tracking (TYPE-12)
**What:** Module-level WeakSet instead of property assignment on function reference
**When to use:** Need to track per-function state without modifying the function object
**Example:**
```typescript
// ControlButton.tsx — before
if (!(handlePress as any)._warned) {
  (handlePress as any)._warned = true;
}

// After
const warnedFns = new WeakSet<(...args: unknown[]) => void>();

// Inside component:
if (process.env.NODE_ENV === 'development' && !warnedFns.has(handlePress)) {
  console.warn('[ControlButton] onClick prop is deprecated...');
  warnedFns.add(handlePress);
}
```
Important: `handlePress` is re-created on each render (it's a closure defined inside the component). The WeakSet correctly tracks per-instance state because each render produces a new function object. `WeakSet` allows garbage collection when the function goes out of scope.

### Pattern 5: Empty spread removal (TYPE-08)
**What:** `{...({} as any)}` passed to Card/Banner — remove entirely or pass explicit props
**When to use:** Spread serves no runtime purpose
**Example:**
```typescript
// ConfirmDialog.tsx:111 — before
<Card variant="elevated" {...({} as any)}>

// After — simply remove the spread
<Card variant="elevated">

// ErrorAlert.tsx:101 — Banner already has all required props passed explicitly
// Remove {...({} as any)} since nothing is being spread
```

### Pattern 6: Schedule interface with id (TYPE-09/D-22)
**What:** `useScheduleData` returns `Schedule` typed as `{ selected?: boolean; [key: string]: unknown }` — accessing `.id` requires either casting or a typed interface
**Fix:** Declare a `ScheduleItem` interface that extends `Schedule` with `id: string` and use `typedActiveSchedule` (already declared as `activeSchedule as unknown as ScheduleItem | undefined`) consistently.
```typescript
// ThermostatCard.tsx
interface ScheduleItem {
  id: string;
  name: string;
  selected?: boolean;
}
// typedActiveSchedule already cast to ScheduleItem; use typedActiveSchedule.id throughout
// Remove the redundant (activeSchedule as any).id casts at lines 74-75
```

### Pattern 7: NETATMO_ROUTES cast removal (D-23)
**What:** `NETATMO_ROUTES` is `as const` with explicit `setRoomThermpoint` key — cast is unnecessary
**Fix:** Remove `(NETATMO_ROUTES as any)` — TypeScript already knows the key exists.

### Pattern 8: WeatherData type alignment (D-24)
**What:** `WeatherCardWrapper` defines its own local `WeatherData` interface; `WeatherCard` defines `WeatherCardProps.weatherData?: WeatherData | null` with its own local type
**Fix:** Import and use WeatherCard's `WeatherData` type in WeatherCardWrapper, or re-export it.
```typescript
// WeatherCard.tsx — export the type
export interface WeatherData { ... }

// WeatherCardWrapper.tsx — import instead of redeclare
import type { WeatherData } from '@/app/components/weather/WeatherCard';
```

### Pattern 9: Text-as-label swap (D-13)
**What:** `<Text as="label" htmlFor="...">` in DataTable — Text's `as` prop accepts `ElementType` but `htmlFor` is not in `HTMLAttributes<HTMLElement>` generically
**Fix:** Use a plain `<label>` element with identical Tailwind classes rather than the polymorphic `Text` component.
```typescript
// Before
<Text {...({ variant: "secondary", size: "sm", as: "label", htmlFor: "page-size" } as any)}>

// After
<label
  htmlFor="page-size"
  className="text-sm text-slate-300 [html:not(.dark)_&]:text-slate-600"
>
```

### Pattern 10: BatteryBadge JSX (D-21)
**What:** `(BatteryBadge as any)({ ... })` calls a React component as a plain function
**Fix:** Render as JSX:
```typescript
// Before
<>{(BatteryBadge as any)({ batteryState: module.battery_state, showLabel: true })}</>

// After
<BatteryBadge batteryState={module.battery_state} showLabel />
```

### Pattern 11: ActionButton typed spread in BottomSheet (D-09)
**What:** `ActionButton` variant includes `'ember' | 'ocean' | 'sage' | 'warning' | 'danger' | 'ghost'` — does NOT include `'close'`
**Critical:** The inline object has `variant: "close"` which is NOT in `ActionButtonProps.variant`. The cast was hiding this. Fix by either:
1. Adding `'close'` to `ActionButtonProps.variant` union in ActionButton.tsx, OR
2. Changing the spread to pass a valid variant (e.g., `'ghost'`) and using CSS or a separate prop for the close appearance
**Recommendation:** Add `'close'` variant to ActionButton since it's a legitimate design pattern used here.

### Pattern 12: FormModal spread (D-10)
**What:** `<Modal {...({ ref, isOpen, size, className: ..., ...props } as any)}>` — Modal does not accept `ref` directly (it's a function component, not `forwardRef`)
**Check:** Read Modal.tsx carefully. `Modal` function component destructures `isOpen, size, className, ...props` — all are in `ModalProps`. The `ref` forwarding may not be supported. Remove `ref` from the spread if Modal is not a `forwardRef` component, or use `forwardRef` on Modal.
```typescript
// Safe approach — pass only what ModalProps accepts
<Modal isOpen={isOpen} size={size} className={cn('relative', className)} {...props}>
```

### Anti-Patterns to Avoid
- **Casting to silence errors:** Each cast being removed exposes a real type mismatch — understand it before removing
- **Over-widening:** Don't widen `ButtonProps.icon` to `unknown` or `any`; use `string | ReactNode`
- **New index signatures:** Do not introduce new `[key: string]: any` interfaces to fix spreads; use typed extension instead
- **Calling React components as functions:** Always render as JSX (`<Component prop={val} />`)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CVA variant extraction | Manual string union | `VariantProps<typeof xxxVariants>` | Single source of truth; unions auto-update when CVA config changes |
| Per-render function tracking | Ref or useState flag | Module-level `WeakSet` | Survives re-renders, GC-safe, no re-render needed |
| Type-safe polymorphic elements | `as any` with `as` prop | Native HTML element with explicit classes | Text component's `as` prop creates htmlFor incompatibility |

**Key insight:** Every cast in this codebase represents a type system boundary mismatch, not a runtime complexity. The fixes are type declarations, not logic changes.

## Common Pitfalls

### Pitfall 1: DeviceCard Interface Export Breaks Consumers
**What goes wrong:** Changing `BannerItem`, `FooterAction`, `ToastNotification` from unexported to exported interfaces — if other device cards built arrays with inline objects typed differently, TypeScript errors appear across the codebase.
**Why it happens:** The `[key: string]: any` index signatures silently allowed structural mismatches that are now exposed.
**How to avoid:** After changing interfaces in DeviceCard.tsx, run `tsc --noEmit` and fix all resulting errors across device card consumers before committing.
**Warning signs:** Type errors in StoveCard, LightsCard, RaspiCard, NetworkCard, ThermostatCard after DeviceCard changes.

### Pitfall 2: `ButtonProps.icon` Widening Breaks Render Logic
**What goes wrong:** `Button.tsx` render path uses `typeof icon === 'string'` to decide rendering. If non-string icons were previously filtered by the type system, widening might expose runtime differences.
**Why it happens:** The conditional `typeof icon === 'string'` already handles both branches — this is safe. But any code that assumed `icon` was always a string (e.g., passing it to `icon.toUpperCase()`) would break.
**How to avoid:** Search for all usages of `icon` within Button.tsx render path. The existing conditional is correct.
**Warning signs:** None expected — the conditional already exists.

### Pitfall 3: ActionButton `'close'` Variant
**What goes wrong:** BottomSheet passes `variant: "close"` to ActionButton, but ActionButton's variant union does not include `'close'`. Simply typing the object as `ActionButtonProps` will produce a TypeScript error, not fix it.
**Why it happens:** The `as any` hid an actual incompatibility — not just a widening issue.
**How to avoid:** Add `'close'` to ActionButton variants and implement its CSS, OR change the BottomSheet to use a valid variant.

### Pitfall 4: WeakSet Re-creation Per Render
**What goes wrong:** Declaring `const warnedFns = new WeakSet()` inside the component body recreates it on every render, defeating its purpose.
**Why it happens:** Confusion about module scope vs component scope.
**How to avoid:** Declare `warnedFns` at MODULE level (outside the component function), not inside the forwardRef callback.

### Pitfall 5: FormModal's `ref` in Spread
**What goes wrong:** `Modal` is NOT a `forwardRef` component. Spreading `ref` into it via props does nothing (React ignores `ref` as a prop). Typing the object as `ModalProps` will cause a TypeScript error if `ref` is not in `ModalProps`.
**Why it happens:** The cast was hiding a potentially incorrect ref usage.
**How to avoid:** Remove `ref` from the FormModal spread. The `ref` at line 302 likely belongs to a different element or is unused. Verify what `ref` is used for in FormModal before removing.

### Pitfall 6: Schedule `id` Field in useScheduleData
**What goes wrong:** `useScheduleData` returns `Schedule` typed as `{ selected?: boolean; [key: string]: unknown }`. The `id` field is not in the declared type even though the API returns it.
**Why it happens:** The hook's `Schedule` interface is underdeclared relative to the actual Netatmo API response.
**How to avoid:** The existing `typedActiveSchedule` cast pattern (`as unknown as ScheduleItem | undefined`) is the correct fix — a local `ScheduleItem` interface in ThermostatCard that declares `id: string` alongside the known fields. This is better than modifying `useScheduleData`'s `Schedule` interface (which would require audit of all callers).

## Code Examples

Verified patterns from codebase:

### CVA VariantProps extraction (established pattern)
```typescript
// Source: existing usage throughout app/components/ui/
import type { VariantProps } from 'class-variance-authority';
import { badgeVariants } from './Badge'; // if exported

// Or inline:
type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;
```

### WeakSet function tracking
```typescript
// Source: TypeScript standard library
// Module level — OUTSIDE forwardRef/component function
const warnedFns = new WeakSet<(...args: unknown[]) => void>();

// Inside component render/event handler:
if (!warnedFns.has(handlePress)) {
  warnedFns.add(handlePress);
  console.warn('...');
}
```

### Interface extension for spread targets
```typescript
// Source: D-05 through D-07 in CONTEXT.md
import type { BannerProps } from './Banner';
import type { ButtonProps } from './Button';
import type { ToastProps } from './Toast';

export interface BannerItem extends BannerProps {}
export interface FooterAction extends ButtonProps { label: string; }
export interface ToastNotification extends ToastProps { show: boolean; }
```

### error instanceof Error guard (Phase 114 pattern)
```typescript
// Source: established in Phase 114 (MEMORY.md)
message: error instanceof Error ? error.message : 'Invalid value'
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `[key: string]: any` index signatures | Typed interface extension | Phase 115 | No runtime change; TypeScript errors surface structural mismatches |
| Property assignment on function (`fn._warned`) | Module-level `WeakSet` | Phase 115 | No runtime behavior change; eliminates prototype pollution risk |
| `as any` for polymorphic component calls | JSX rendering | Phase 115 | No runtime change |

## Open Questions

1. **BottomSheet `variant: "close"` in ActionButton**
   - What we know: `ActionButtonProps.variant` = `'ember' | 'ocean' | 'sage' | 'warning' | 'danger' | 'ghost'` — no `'close'` variant
   - What's unclear: Does `'close'` have distinct styling, or is `'ghost'` an acceptable substitute?
   - Recommendation: Inspect BottomSheet's current visual output. If `'close'` renders as ghost/neutral, just change to `'ghost'`. If it has distinct styling, add the `'close'` variant to ActionButton.

2. **FormModal `ref` at line 302**
   - What we know: `Modal` is not a `forwardRef` component; `ref` in the spread is likely unused
   - What's unclear: Was `ref` intentionally added for some legacy purpose?
   - Recommendation: Check FormModal component for any usage of `ref` — if unused, remove from spread.

3. **WeatherData type export**
   - What we know: Both files define identical-looking `WeatherData` interfaces locally
   - What's unclear: Whether WeatherCard's local `WeatherData` matches WeatherCardWrapper's exactly
   - Recommendation: Compare both interfaces field-by-field before deciding which to export as canonical.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library |
| Config file | jest.config.ts |
| Quick run command | `npm test -- --testPathPattern="ControlButton|DeviceCard" --passWithNoTests` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TYPE-07 | Button accepts ReactNode icon without error | unit | `npm test -- --testPathPattern="Button\\.test"` | check existing |
| TYPE-08 | DeviceCard renders banners/actions/toasts without cast | unit | `npm test -- --testPathPattern="DeviceCard\\.test"` | ✅ Wave 0 exists |
| TYPE-09 | ControlButton renders with typed variant | unit | `npm test -- --testPathPattern="ControlButton\\.test"` | ✅ Wave 0 exists |
| TYPE-10 | LightsCard footerActions/statusBadge construct without cast | unit | `npm test -- --testPathPattern="LightsCard\\.test"` | check existing |
| TYPE-11 | TransitionLink click handler uses hook types | unit | `npm test -- --testPathPattern="TransitionLink\\.test"` | check existing |
| TYPE-12 | ControlButton _warned replaced by WeakSet | unit | `npm test -- --testPathPattern="ControlButton\\.test"` | ✅ Wave 0 exists |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="ControlButton|DeviceCard" --passWithNoTests`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Verify existing ControlButton.test.tsx covers deprecated `onClick` warning behavior (WeakSet refactor must not break it)
- [ ] Verify existing DeviceCard.test.tsx covers BannerItem/FooterAction/ToastNotification prop shapes (interface changes)

*(Most test infrastructure exists — gaps are verification that existing tests cover the specific changed behaviors)*

## Sources

### Primary (HIGH confidence)
- Direct code inspection of all 22 affected files
- `app/components/ui/Button.tsx` lines 198-213 — ButtonProps.icon: string confirmed
- `app/components/ui/Banner.tsx` lines 105-124 — BannerProps confirmed
- `app/components/ui/DeviceCard.tsx` lines 14-51, 225-291 — current interface state confirmed
- `app/components/ui/ActionButton.tsx` lines 6-11 — variant union confirmed (no 'close')
- `app/components/ui/ControlButton.tsx` lines 138-152 — _warned pattern confirmed
- `app/components/ui/Toast.tsx` — ToastProps confirmed (Radix-based)
- `app/components/ui/Modal.tsx` lines 258-283 — not forwardRef, ref issue confirmed
- `app/components/ui/Text.tsx` lines 75-80 — no htmlFor in TextProps confirmed
- `app/context/PageTransitionContext.tsx` lines 20-36 — hook already typed, cast unnecessary
- `lib/routes.ts` lines 62-75 — NETATMO_ROUTES.setRoomThermpoint exists as const
- `lib/hooks/useScheduleData.ts` lines 42-47 — Schedule interface underdeclared (no id field)
- `app/components/ui/Slider.tsx` lines 12-20 — onChange/onValueCommit accept `number | number[]`

### Secondary (MEDIUM confidence)
- CVA `VariantProps` extraction pattern — verified from existing codebase usage (StoveCard, Badge, etc.)

### Tertiary (LOW confidence)
- WeakSet behavior for per-render function tracking — standard TypeScript/JavaScript behavior, no external source checked

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, existing patterns
- Architecture: HIGH — all decisions locked in CONTEXT.md, verified against actual code
- Pitfalls: HIGH — derived from direct code inspection (ActionButton 'close' gap confirmed, FormModal ref confirmed, WeakSet scope confirmed)

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable TypeScript project, no external API churn)
