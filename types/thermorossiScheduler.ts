/**
 * Thermorossi scheduler + stove maintenance (backend on the Pi).
 * Source of truth: ../docs/api/scheduler.md (workspace ROADMAP D2).
 * Days: 0 = Monday … 6 = Sunday. Times: minutes from midnight (multiples of 15).
 */

export interface ScheduleSlot {
  start_minutes: number; // 0..1439
  end_minutes: number; // 1..1440, > start
  power: number; // 1-5
  fan: number; // 1-6
}

export interface ScheduleSlotWithId extends ScheduleSlot {
  id: number;
  day: number;
}

export interface ScheduleSummary {
  id: number;
  name: string;
  enabled: boolean;
  created_at: number; // Unix seconds
  updated_at: number; // Unix seconds
  interval_count: number;
  is_active: boolean;
}

export interface ScheduleDetail extends ScheduleSummary {
  /** Keys are day numbers as strings ("0".."6"); empty days are omitted. */
  slots_by_day: Record<string, ScheduleSlotWithId[]>;
}

export interface ScheduleListResponse {
  schedules: ScheduleSummary[];
  active_schedule_id: number | null;
}

export interface SchedulerMode {
  enabled: boolean;
  semi_manual: boolean;
  semi_manual_activated_at: number | null; // Unix seconds
  return_to_auto_at: number | null; // Unix seconds
}

export interface NextAction {
  action: 'ignite' | 'shutdown' | 'adjust';
  at: number; // Unix seconds
  power: number;
  fan: number;
}

export interface NextActionResponse {
  nextAction: NextAction | null;
  reason?: 'scheduler_disabled' | 'semi_manual_override_active' | 'no_active_schedule' | 'no_upcoming_slots';
}

export interface MaintenanceState {
  current_hours: number;
  target_hours: number;
  percentage: number;
  needs_cleaning: boolean;
  last_cleaned_at: number | null; // Unix seconds
  last_notification_level: 0 | 80 | 90 | 100;
  updated_at: number | null; // Unix seconds
}

export interface MaintenanceCleanResponse extends MaintenanceState {
  previous_hours: number;
}

export interface ExecutionLogItem {
  id: number;
  timestamp: number;
  action:
    | 'ignite'
    | 'shutdown'
    | 'adjust'
    | 'safety_blocked'
    | 'stale_cache'
    | 'ignite_failed'
    | 'adjust_failed';
  stoveState: string | null;
  matchedSlot: ScheduleSlot | null;
  executionDurationMs: number | null;
  details: Record<string, unknown> | null;
}

export interface ExecutionLogResponse {
  items: ExecutionLogItem[];
  total: number;
  page: number;
  pageSize: number;
}

/** GET /scheduler/engine and WS `scheduler` snapshot `data.engine` (ROADMAP V8). */
export interface SchedulerEngineHealth {
  initialized: boolean;
  started_at: number | null; // Unix seconds
  last_tick_at: number | null; // Unix seconds
  last_action: string | null;
  tick_interval_s: number;
  stale_after_s: number;
  healthy: boolean;
}

/** WS topic `scheduler` snapshot `data`. */
export interface SchedulerSnapshotData {
  schedules: ScheduleSummary[];
  active_schedule_id: number | null;
  mode: SchedulerMode;
  maintenance: MaintenanceState | null;
  engine?: SchedulerEngineHealth; // absent on backends before V8
}

/** WS topic `scheduler` payload (snapshot or event); `data` shape depends on `event`. */
export interface SchedulerWsPayload {
  event: string; // snapshot | schedule.* | slots.updated | week.updated | mode.changed | override.* | maintenance.updated | engine.tick
  data: unknown;
  timestamp: string | null;
}
