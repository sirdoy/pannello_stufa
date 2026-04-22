/**
 * docs/api/automations.types.ts — Authoritative TypeScript types for the
 * v3.0 Automation Engine REST + WebSocket API.
 *
 * Field-for-field mirror of api/automations/models.py and
 * api/capabilities/{introspect,registry}.py. Every JSON field name matches
 * the Python snake_case wire format exactly.
 *
 * DO NOT HAND-EDIT drift from models.py — verified by grep contract tests.
 * Frontend consumers import from this file only.
 */

// ----- 1. Triggers -----

// api/automations/models.py — ScheduleCronTrigger
export interface ScheduleCronTrigger {
  type: 'schedule_cron';
  cron_expression: string;
}

// api/automations/models.py — ManualApiCallTrigger
export interface ManualApiCallTrigger {
  type: 'manual_api_call';
}

export type TriggerType = ScheduleCronTrigger | ManualApiCallTrigger;


// ----- 2. Condition Leaves -----

// api/automations/models.py — SensorStateChangeLeaf
export interface SensorStateChangeLeaf {
  type: 'sensor_state_change';
  sensor_id: string;
  from_state?: string | null;
  to_state?: string | null;
}

// api/automations/models.py — SensorThresholdLeaf
export interface SensorThresholdLeaf {
  type: 'sensor_threshold';
  sensor_id: string;
  metric: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte';
  threshold: number;
}

// api/automations/models.py — NetatmoTemperatureThresholdLeaf
export interface NetatmoTemperatureThresholdLeaf {
  type: 'netatmo_temperature_threshold';
  home_id: string;
  room_id: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte';
  threshold: number;
}

// api/automations/models.py — TimeWindowCondition
export interface TimeWindowCondition {
  type: 'time_window';
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
}

// api/automations/models.py — DeviceStateCondition
export interface DeviceStateCondition {
  type: 'device_state';
  sensor_id: string;
  expected_state: string;
}

// api/automations/models.py — TemperatureRangeCondition
export interface TemperatureRangeCondition {
  type: 'temperature_range';
  min_temp?: number | null;
  max_temp?: number | null;
}

// api/automations/models.py — AlwaysTrueCondition
export interface AlwaysTrueCondition {
  type: 'always_true';
}


// ----- 3. Composite Condition Nodes + ConditionNode union -----

// api/automations/models.py — AndNode (line 99-101, field name is `conditions`)
export interface AndNode {
  type: 'and';
  conditions: ConditionNode[]; // min length 1 (server-enforced)
}

// api/automations/models.py — OrNode (line 104-106, field name is `conditions`)
export interface OrNode {
  type: 'or';
  conditions: ConditionNode[]; // min length 1 (server-enforced)
}

export type ConditionNode = AndNode
  | OrNode
  | SensorStateChangeLeaf
  | SensorThresholdLeaf
  | NetatmoTemperatureThresholdLeaf
  | TimeWindowCondition
  | DeviceStateCondition
  | TemperatureRangeCondition
  | AlwaysTrueCondition;


// ----- 4. Actions -----

// api/automations/models.py — NetatmoSetRoomTempAction (line 138-143)
export interface NetatmoSetRoomTempAction {
  type: 'netatmo_set_room_temp';
  home_id: string;
  room_id: string;
  mode: 'manual' | 'home';
  temp?: number | null; // 5.0..30.0
}

// api/automations/models.py — NetatmoSetHomeModeAction (line 146-149)
export interface NetatmoSetHomeModeAction {
  type: 'netatmo_set_home_mode';
  home_id: string;
  mode: 'schedule' | 'away' | 'hg';
}

// api/automations/models.py — NetatmoSwitchScheduleAction (line 152-155)
export interface NetatmoSwitchScheduleAction {
  type: 'netatmo_switch_schedule';
  home_id: string;
  schedule_id: string;
}

// api/automations/models.py — HttpWebhookAction (line 158-162)
// Server default method is 'POST'; field is required on the wire.
export interface HttpWebhookAction {
  type: 'http_webhook';
  url: string;
  method: 'GET' | 'POST';
  payload?: Record<string, unknown> | null;
}

// api/automations/models.py — LogEventAction (line 165-167)
export interface LogEventAction {
  type: 'log_event';
  message: string;
}

// api/automations/models.py — HueLightAction (line 170-177)
export interface HueLightAction {
  type: 'hue_light';
  light_id: string;
  on?: boolean | null;
  brightness?: number | null;  // 1..254
  color_temp?: number | null;  // 153..500 (Mired)
  hue?: number | null;         // 0..65535
  sat?: number | null;         // 0..254
}

// api/automations/models.py — HueGroupAction (line 180-185) — no hue/sat
export interface HueGroupAction {
  type: 'hue_group';
  group_id: string;
  on?: boolean | null;
  brightness?: number | null;  // 1..254
  color_temp?: number | null;  // 153..500 (Mired)
}

// api/automations/models.py — HueSceneAction (line 188-191)
export interface HueSceneAction {
  type: 'hue_scene';
  group_id: string;
  scene_id: string;
}

// api/automations/models.py — ThermorossiAction (line 194-199)
export interface ThermorossiAction {
  type: 'thermorossi';
  command: 'ignite' | 'shutdown' | 'set_power' | 'set_fan' | 'set_water_temp';
  power_level?: number | null; // 1..5
  fan_level?: number | null;   // 1..6
  water_temp?: number | null;  // 40..80
}

// api/automations/models.py — SonosAction (line 202-207)
export interface SonosAction {
  type: 'sonos';
  speaker_uid: string;
  command: 'play' | 'pause' | 'set_volume' | 'switch_source';
  volume?: number | null; // 0..100
  source?: 'tv' | 'line_in' | null;
}

// api/automations/models.py — TuyaAction (line 210-215)
export interface TuyaAction {
  type: 'tuya';
  device_id: string;
  command: 'set_status' | 'set_timer';
  on?: boolean | null;
  timer_seconds?: number | null; // 0..86400
}

export type ActionItem = NetatmoSetRoomTempAction
  | NetatmoSetHomeModeAction
  | NetatmoSwitchScheduleAction
  | HttpWebhookAction
  | LogEventAction
  | HueLightAction
  | HueGroupAction
  | HueSceneAction
  | ThermorossiAction
  | SonosAction
  | TuyaAction;


// ----- 5. Rule DTOs -----

// api/automations/models.py — AutomationRule (line 251-265)
export interface AutomationRule {
  id: number;
  name: string;
  description?: string | null;
  enabled: boolean;
  trigger?: TriggerType | null;
  condition: ConditionNode;
  actions: ActionItem[];
  min_interval_seconds: number;
  max_triggers_per_hour: number;
  last_triggered_at?: number | null; // Unix seconds
  active_hours_start?: string | null; // HH:MM
  active_hours_end?: string | null;   // HH:MM
  created_at: number; // Unix seconds
  updated_at: number; // Unix seconds
}

// api/automations/models.py — AutomationRuleCreate (line 268-280)
// POST /automations body. `enabled` defaults true server-side; `actions` min length 1.
export interface AutomationRuleCreate {
  name: string;
  description?: string | null;
  enabled?: boolean;
  trigger?: TriggerType | null;
  condition: ConditionNode;
  actions: ActionItem[]; // min length 1 (server-enforced)
  min_interval_seconds?: number;
  max_triggers_per_hour?: number;
  active_hours_start?: string | null; // HH:MM
  active_hours_end?: string | null;   // HH:MM
}

// api/automations/models.py — AutomationRulePatch (line 283-294)
// PATCH /automations/{id} body. All fields optional. NOTE: no `trigger` field — by design.
export interface AutomationRulePatch {
  name?: string;
  description?: string | null;
  enabled?: boolean;
  condition?: ConditionNode;
  actions?: ActionItem[];
  min_interval_seconds?: number;
  max_triggers_per_hour?: number;
  active_hours_start?: string | null; // HH:MM
  active_hours_end?: string | null;   // HH:MM
}


// ----- 6. Execution Log + Response Shapes -----

// api/automations/models.py — AutomationExecution (line 297-304)
export interface AutomationExecution {
  id: number;
  rule_id: number;
  triggered_at: number; // Unix seconds
  status: 'success' | 'failure' | 'partial_failure' | 'skipped' | 'condition_not_met';
  trigger_snapshot?: string | null;
  error_message?: string | null;
  trigger_source: 'auto' | 'manual';
}

// Alias per CONTEXT.md specifics line 86 — frontend-facing name for AutomationExecution.
export type ExecutionLogEntry = AutomationExecution;

// api/automations/models.py — TraceNode (line 312-340, recursive, children non-optional)
export interface TraceNode {
  type: string;
  matched: boolean;
  detail?: string | null;
  children: TraceNode[];
}

// api/automations/models.py — ManualActionResult (line 348-358)
export interface ManualActionResult {
  index: number;
  action_type: string;
  success: boolean;
  error?: string | null;
}

// api/automations/models.py — TriggerResponse (line 361-376)
export interface TriggerResponse {
  execution_id: number;
  rule_id: number;
  trigger_source: 'manual';
  status: 'success' | 'partial_failure' | 'failure';
  triggered_at: number; // Unix seconds
  triggered_by: string;
  action_results: ManualActionResult[];
}

// api/automations/models.py — EvaluateResponse (line 379-390)
export interface EvaluateResponse {
  rule_id: number;
  matched: boolean;
  trace: TraceNode;
}


// ----- 7. Capabilities -----

// api/capabilities/introspect.py — _classify() return type (line 41-60)
export type CapabilityParameterType =
  | 'string'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'enum';

// api/capabilities/introspect.py — introspect_field() return shape (line 94-115).
// device_min/device_max are only present on the narrowed Hue color_temp parameter
// (see api/capabilities/device_schema.py lines 146-158).
export interface CapabilityParameter {
  name: string;
  type: CapabilityParameterType;
  required: boolean;
  default: unknown;
  min: number | null;
  max: number | null;
  enum: string[] | null;
  pattern: string | null;
  description: string | null;
  device_min?: number;
  device_max?: number;
}

// api/capabilities/introspect.py — introspect_model() return shape (line 118-142)
export interface CapabilityDescriptor {
  type: string;
  category: 'condition' | 'action';
  parameters: CapabilityParameter[];
}

// api/capabilities/registry.py — build_provider_block() return shape (line 94-105)
export interface ProviderBlock {
  name: string;
  conditions: CapabilityDescriptor[];
  actions: CapabilityDescriptor[];
}

// api/capabilities/registry.py — build_all() return shape (line 113-132)
export interface CapabilitiesResponse {
  providers: ProviderBlock[];
}


// ----- 8. WebSocket Events -----

// Mirrors docs/api/websocket.md lines 1340-1384 — authoritative re-export.

export type AutomationsEventStatus =
  | 'success'
  | 'failure'
  | 'partial_failure'
  | 'skipped'
  | 'condition_not_met';

export type AutomationsTriggerSnapshotCause =
  | { kind: 'leaf_false'; failed_sensor_ids: string[] }
  | { kind: 'guard'; reason: string }
  | { kind: 'action'; action_index: number; action_type: string; error: string }
  | { kind: 'all_actions_failed'; actions: Array<{ index: number; type: string; error: string }> }
  | null;

export interface AutomationsTriggerSnapshotAuto {
  changed: string[];
  result: boolean;
  cause?: Exclude<AutomationsTriggerSnapshotCause, null>;
}

export interface AutomationsTriggerSnapshotManual {
  kind: 'manual';
  triggered_by: string;
  result: true;
  cause:
    | null
    | { kind: 'action'; action_index: number; action_type: string | null; error: string | null }
    | { kind: 'all_actions_failed'; actions: Array<{ index: number; type: string; error: string }> };
}

export interface AutomationsEvent {
  event: 'rule_executed';
  execution_id: number;
  rule_id: number;
  rule_name: string;
  trigger_source: 'auto' | 'manual';
  status: AutomationsEventStatus;
  triggered_at: number; // Unix seconds
  triggered_by: string | null;
  error_message: string | null;
  trigger_snapshot:
    | AutomationsTriggerSnapshotAuto
    | AutomationsTriggerSnapshotManual
    | null;
}
