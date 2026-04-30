/**
 * Phase 180 — automations namespace barrel.
 *
 * Re-exported from app/components/EmberGlass/index.ts via:
 *   export * from './automations'
 *
 * All symbols are namespaced to the automations domain.
 * Barrel collision check against rooms/ and sheets/ performed before release:
 *   no shared names (StatChip, SheetRow, etc. are in different namespaces).
 */

// ── Orchestrator + main components ───────────────────────────────────────────
export { AutomationsTab } from './AutomationsTab';
export { AutomationRow } from './AutomationRow';
export type { AutomationRowProps } from './AutomationRow';
export { AutomationEditor } from './AutomationEditor';
export type { AutomationEditorProps } from './AutomationEditor';

// ── Editor sub-components ─────────────────────────────────────────────────────
export { ConditionGroup } from './ConditionGroup';
export type { ConditionGroupProps } from './ConditionGroup';
export { ConditionItem } from './ConditionItem';
export type { ConditionItemProps } from './ConditionItem';
export { ActionRow } from './ActionRow';
export type { ActionRowProps } from './ActionRow';

// ── Sections ─────────────────────────────────────────────────────────────────
export { TriggerSection } from './sections/TriggerSection';
export type { TriggerSectionProps } from './sections/TriggerSection';
export { ConditionsSection } from './sections/ConditionsSection';
export type { ConditionsSectionProps } from './sections/ConditionsSection';
export { ActionsSection } from './sections/ActionsSection';
export type { ActionsSectionProps } from './sections/ActionsSection';
export { AdvancedSection } from './sections/AdvancedSection';
export type { AdvancedSectionProps } from './sections/AdvancedSection';

// ── Forms ─────────────────────────────────────────────────────────────────────
export {
  ScheduleCronForm,
  ManualApiCallForm,
  TriggerForm,
} from './forms/TriggerForms';
export {
  TimeWindowForm,
  DeviceStateForm,
  TemperatureRangeForm,
  AlwaysTrueForm,
  ConditionForm,
} from './forms/ConditionForms';
export {
  NetatmoSetRoomTempForm,
  NetatmoSetHomeModeForm,
  NetatmoSwitchScheduleForm,
  HttpWebhookForm,
  LogEventForm,
  HueLightForm,
  HueGroupForm,
  HueSceneForm,
  ThermorossiForm,
  SonosForm,
  TuyaForm,
  ActionForm,
} from './forms/ActionForms';

// ── Primitives ────────────────────────────────────────────────────────────────
export { FieldLabel } from './primitives/FieldLabel';
export type { FieldLabelProps } from './primitives/FieldLabel';
export { TextInput } from './primitives/TextInput';
export type { TextInputProps } from './primitives/TextInput';
export { NumInput } from './primitives/NumInput';
export type { NumInputProps } from './primitives/NumInput';
export { SegmentedControl } from './primitives/SegmentedControl';
export { TwoCol } from './primitives/TwoCol';
export type { TwoColProps } from './primitives/TwoCol';
export { TypeTile } from './primitives/TypeTile';
export type { TypeTileProps } from './primitives/TypeTile';
export { AddChip } from './primitives/AddChip';
export type { AddChipProps } from './primitives/AddChip';
export { Pill } from './primitives/Pill';
export type { PillProps } from './primitives/Pill';
export { CronHint } from './primitives/CronHint';
export type { CronHintProps } from './primitives/CronHint';
export { IconBtn } from './primitives/IconBtn';
export type { IconBtnProps } from './primitives/IconBtn';

// ── Lib ───────────────────────────────────────────────────────────────────────
export {
  TRIGGER_TYPES,
  CONDITION_TYPES,
  ACTION_TYPES,
  ITALIAN_LABELS,
  defaultTrigger,
  defaultCondition,
  defaultAction,
} from './lib/automations-config';
export { apiToDraft, draftToApi, computePatchDelta } from './lib/automations-mappers';
export { countConditions } from './lib/countConditions';
export { describeTrigger } from './lib/describeTrigger';

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  UIDraft,
  UIConditionGroup,
  UIConditionLeaf,
  UIConditionNode,
} from './types';
export { emptyDraft } from './types';
