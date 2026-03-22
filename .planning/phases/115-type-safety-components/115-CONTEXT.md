# Phase 115: Type Safety app/ Components - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate all `as any` casts in app/ component files (.tsx). Each cast gets replaced with proper typed interfaces, generics, or structural alignment. API route files and page files are Phase 116. Test files are out of scope.

**Scope:** 37 `as any` casts across 22 component files in `app/components/` and `app/thermostat/`.

</domain>

<decisions>
## Implementation Decisions

### Icon prop typing (TYPE-07) — 6 occurrences
- **D-01:** The root cause is `Button.icon` accepting `string` (emoji) while callers pass Lucide JSX (`<X />`, `<Minimize />`, `<RefreshCw />`). Fix by widening `ButtonProps.icon` to `string | React.ReactNode` — the render path already handles both via `typeof icon === 'string'` conditional
- **D-02:** Affected files: `HlsPlayer.tsx:291`, `EventPreviewModal.tsx:65`, `CameraCard.tsx:359`, `ManualOverrideSheet.tsx:181`, `ScheduleSelector.tsx:96`, `DeviceCard.tsx:275` (LoadingOverlay icon)
- **D-03:** `LoadingOverlay` icon prop in DeviceCard also needs widening — currently typed `string` but receives ReactNode from DeviceCard's `icon?: ReactNode` prop

### Design system spread patterns (TYPE-08) — 10 occurrences
- **D-04:** DeviceCard's `BannerItem`, `FooterAction`, and `ToastNotification` interfaces already have `[key: string]: any` index signatures — the spreads cast because TypeScript still requires explicit compatibility. Fix by aligning these interfaces with the actual component props they spread into (`BannerProps`, `ButtonProps`, `ToastProps`)
- **D-05:** `BannerItem` → extend `BannerProps` (from Banner.tsx) directly, dropping the redundant interface
- **D-06:** `FooterAction` → extend `ButtonProps` with required `label: string`, drop `[key: string]: any`
- **D-07:** `ToastNotification` → extend `ToastProps` with required `show: boolean`, drop `[key: string]: any`
- **D-08:** Empty spread patterns in `ConfirmDialog.tsx:111`, `Panel.tsx:61`, `ErrorAlert.tsx:101` (`{...({} as any)}`) — these are Card/Banner compatibility workarounds. Fix by passing explicit props instead of empty spreads, or removing the spread entirely if no additional props are needed
- **D-09:** `BottomSheet.tsx:140` — inline object spread for ActionButton. Fix by typing the object as `ActionButtonProps` directly
- **D-10:** `FormModal.tsx:302` — complex spread with ref, isOpen, size. Fix by typing the inline object to match Modal component props

### Variant prop casts (TYPE-09) — 8 occurrences
- **D-11:** `StoveCard.tsx:111` — `statusDisplay.variant` is `string` but Badge expects a CVA union. Fix by typing `statusDisplay.variant` as the Badge variant union (`'ember' | 'ocean' | 'sage' | ...`)
- **D-12:** `StoveCard.tsx:118` — `statusDisplay.health` same pattern for HealthIndicator status prop
- **D-13:** `DataTable.tsx:659` — Text component with `as: "label"` and `htmlFor` props that Text doesn't support. Fix by replacing `<Text>` with a styled `<label>` element using the same design system classes
- **D-14:** `LightsCard.tsx:63` — `'outline' as any` in footerActions array. Fix by ensuring FooterAction variant union includes `'outline'`
- **D-15:** `LightsRoomControl.tsx:257,269` — `adaptive.buttonVariant` typed as `string`. Fix by typing the adaptive config object's `buttonVariant` field as the ControlButton variant union
- **D-16:** `LightsRoomControl.tsx:233,241` — Slider `onValueChange`/`onValueCommit` callback casts. Fix by matching the actual Slider callback signature

### DeviceCard prop alignment (TYPE-10) — 3 occurrences
- **D-17:** `LightsCard.tsx:88,92` — `statusBadge` and `footerActions` cast because LightsCard builds them with slightly different shapes than DeviceCard expects. Fix by having DeviceCard export its prop interfaces (`StatusBadgeConfig`, `FooterAction`) and LightsCard construct them correctly
- **D-18:** `SmartHomeCard.tsx:214` — Banner spread with children prop. Fix by passing children as a prop to Banner (which already accepts `children` via `BannerProps`)

### TransitionLink hook cast (TYPE-11) — 1 occurrence
- **D-19:** `TransitionLink.tsx:62` — `usePageTransition() as any` is unnecessary. The hook already returns `PageTransitionContextValue` with `startTransition` and `setTransitionType`. Simply remove the `as any` cast — the types already match

### ControlButton _warned property (TYPE-12) — 2 occurrences
- **D-20:** `ControlButton.tsx:141,145` — `(handlePress as any)._warned` attaches a flag to a function object. Replace with a module-level `WeakSet<Function>` to track warned functions: `const warnedFns = new WeakSet<(...args: unknown[]) => void>()` — check `warnedFns.has(handlePress)` and `warnedFns.add(handlePress)` instead of property assignment

### Remaining component casts — 8 occurrences
- **D-21:** `RoomCard.tsx:436` — `(BatteryBadge as any)({ ... })` calling component as function. Fix by rendering as JSX: `<BatteryBadge batteryState={module.battery_state} showLabel />`
- **D-22:** `ThermostatCard.tsx:74-75` — `(activeSchedule as any).id` accessing schedule ID. Fix by typing `activeSchedule` with an interface that includes `id`
- **D-23:** `ThermostatCard.tsx:340` — `(NETATMO_ROUTES as any).setRoomThermpoint`. Fix by ensuring `NETATMO_ROUTES` constant has proper type including `setRoomThermpoint` key
- **D-24:** `WeatherCardWrapper.tsx:128` — `weatherData as any`. Fix by aligning the weather data type between wrapper and WeatherCard props
- **D-25:** `FormModal.tsx:87` — `(error as any)?.message`. Fix with `error instanceof Error ? error.message : 'Invalid value'` pattern (already used elsewhere in codebase)
- **D-26:** `WeeklyTimeline.tsx:50` — `schedule as any` for `parseTimelineSlots`. Fix by typing the schedule parameter to match what the parser expects

### Claude's Discretion
- Grouping into plans (by pattern type vs by file cluster)
- Whether to export DeviceCard interfaces or keep them internal with re-exports
- Exact variant union literals for StoveCard statusDisplay (derive from actual usage)
- Whether Slider callback types come from Radix or are declared locally

</decisions>

<specifics>
## Specific Ideas

No specific requirements — standard type safety improvements following the same patterns established in Phase 114. Each fix is mechanical: identify the actual runtime type, declare or align it, and remove the cast.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design system component types
- `app/components/ui/Button.tsx` lines 198-213 — `ButtonProps` interface (icon: string, variant union)
- `app/components/ui/Banner.tsx` lines 105-115 — `BannerProps` interface
- `app/components/ui/DeviceCard.tsx` lines 14-51 — `BannerItem`, `InfoBoxItem`, `FooterAction`, `ToastNotification` interfaces (all have `as any` issues)
- `app/components/ui/SmartHomeCard.tsx` — SmartHomeCard compound component props
- `app/components/ui/ControlButton.tsx` — ControlButton variant definitions

### Context and hooks
- `app/context/PageTransitionContext.tsx` lines 20-26 — `PageTransitionContextValue` interface (TYPE-11 source of truth)

### Device components with casts
- `app/components/devices/stove/StoveCard.tsx` — statusDisplay variant/health casts
- `app/components/devices/lights/LightsCard.tsx` — footerActions/statusBadge casts
- `app/components/devices/lights/components/LightsRoomControl.tsx` — Slider callback + adaptive variant casts
- `app/components/devices/camera/HlsPlayer.tsx` — icon JSX casts
- `app/components/devices/camera/EventPreviewModal.tsx` — icon JSX cast
- `app/components/devices/camera/CameraCard.tsx` — icon JSX cast
- `app/components/devices/thermostat/ThermostatCard.tsx` — schedule ID + route casts
- `app/components/devices/weather/WeatherCardWrapper.tsx` — weatherData cast

### Prior phase decisions
- `.planning/phases/114-type-safety-lib/114-CONTEXT.md` — Phase 114 patterns (error instanceof Error, type guard patterns)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BannerProps` (Banner.tsx) — already defines the correct prop shape for banner spreads
- `ButtonProps` (Button.tsx) — already defines variant union, just missing ReactNode icon support
- `PageTransitionContextValue` (PageTransitionContext.tsx) — already correctly typed, TransitionLink cast is simply unnecessary
- `ToastProps` (Toast.tsx) — target type for ToastNotification alignment

### Established Patterns
- CVA `VariantProps<typeof xxxVariants>` for extracting variant unions (used throughout design system)
- `error instanceof Error` type guard (established in Phase 114)
- `WeakSet` / `WeakMap` available in the codebase for function tracking patterns
- Component compound pattern (`SmartHomeCard.Controls`, `Button.Icon`) already established

### Integration Points
- `ButtonProps.icon` widening from `string` to `string | ReactNode` affects all Button consumers — must verify no caller relies on string-only behavior
- DeviceCard interface changes affect all device cards (Stove, Lights, Camera, Thermostat, Weather, Raspi, Network) — interfaces must remain backward-compatible or all consumers updated
- `FooterAction` variant union must include `'outline'` to support LightsCard usage

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 115-type-safety-components*
*Context gathered: 2026-03-22*
