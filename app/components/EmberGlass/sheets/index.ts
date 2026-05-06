// Sheet bodies (Plans 178-04..178-08 implement; this barrel forwards as named exports)
//
// 260506-d45: each sheet exports BOTH a presentational `*Sheet` (REQUIRED
// data + cmds props — used by production cards to dedup hook mounts) AND a
// zero-prop `*SheetSelfFetch` wrapper (used by Section10SheetGallery on
// /debug/design-system-v2 to preserve the Phase 178 D-04 zero-prop contract).
export { StoveSheet, StoveSheetSelfFetch } from './StoveSheet';
export type { StoveSheetProps } from './StoveSheet';
export { ClimateSheet, ClimateSheetSelfFetch } from './ClimateSheet';
export type { ClimateSheetProps } from './ClimateSheet';
export { LightsSheet, LightsSheetSelfFetch } from './LightsSheet';
export type { LightsSheetProps } from './LightsSheet';
export { SonosSheet, SonosSheetSelfFetch } from './SonosSheet';
export type { SonosSheetProps } from './SonosSheet';
export { PlugsSheet, PlugsSheetSelfFetch } from './PlugsSheet';
export type { PlugsSheetProps } from './PlugsSheet';

// Sub-primitives (Plan 178-01)
export { SheetRow } from './primitives/SheetRow';
export type { SheetRowProps } from './primitives/SheetRow';
export { Stepper } from './primitives/Stepper';
export type { StepperProps } from './primitives/Stepper';
export { Slider } from './primitives/Slider';
export type { SliderProps } from './primitives/Slider';
export { RadialDial } from './primitives/RadialDial';
export type { RadialDialProps } from './primitives/RadialDial';
export { SheetBtn } from './primitives/SheetBtn';
export type { SheetBtnProps } from './primitives/SheetBtn';
export { QuickActionButton } from './primitives/QuickActionButton';
export type { QuickActionButtonProps } from './primitives/QuickActionButton';

// Helper
export { findSceneByName } from './lib/findSceneByName';

// Phase 182 — BigSlider primitive (D-06)
export { BigSlider } from './primitives/BigSlider';
export type { BigSliderProps } from './primitives/BigSlider';
