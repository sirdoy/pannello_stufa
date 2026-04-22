# Thermorossi Scheduler API

**Base path:** `/api/v1/thermorossi`

Thermorossi weekly heating scheduler covering schedule CRUD, scheduler mode control, semi-manual override, next-action query, and execution log -- 13 endpoints. See [Thermorossi Provider](./thermorossi.md) for stove state and control reference. Real-time events are pushed via the [WebSocket `scheduler` topic](./websocket.md#scheduler).

All endpoints require authentication via JWT Bearer token or API Key (`X-API-Key` header). See [Authentication](./README.md#authentication) for details.

---

## Quick Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/thermorossi/schedules` | Create a new heating schedule |
| `GET` | `/api/v1/thermorossi/schedules` | List all schedules with metadata |
| `GET` | `/api/v1/thermorossi/schedules/{schedule_id}` | Get a schedule with full slot grid |
| `PATCH` | `/api/v1/thermorossi/schedules/{schedule_id}` | Rename or toggle enabled |
| `DELETE` | `/api/v1/thermorossi/schedules/{schedule_id}` | Delete a schedule and its slots |
| `PUT` | `/api/v1/thermorossi/schedules/{schedule_id}/active` | Set a schedule as active |
| `PUT` | `/api/v1/thermorossi/schedules/{schedule_id}/days/{day}/slots` | Replace all slots for a day |
| `GET` | `/api/v1/thermorossi/scheduler/mode` | Get current scheduler mode and override state |
| `POST` | `/api/v1/thermorossi/scheduler/mode` | Enable or disable the scheduler globally |
| `POST` | `/api/v1/thermorossi/scheduler/override` | Activate semi-manual override with expiry |
| `DELETE` | `/api/v1/thermorossi/scheduler/override` | Clear semi-manual override |
| `GET` | `/api/v1/thermorossi/scheduler/next-action` | Get the next scheduled stove action |
| `GET` | `/api/v1/thermorossi/scheduler/log` | Paginated execution log with time-range filter |

---

## Table of Contents

- [Schedule Management](#schedule-management)
  - [POST /schedules](#post-schedules)
  - [GET /schedules](#get-schedules)
  - [GET /schedules/{schedule_id}](#get-schedulesschedule_id)
  - [PATCH /schedules/{schedule_id}](#patch-schedulesschedule_id)
  - [DELETE /schedules/{schedule_id}](#delete-schedulesschedule_id)
  - [PUT /schedules/{schedule_id}/active](#put-schedulesschedule_idactive)
  - [PUT /schedules/{schedule_id}/days/{day}/slots](#put-schedulesschedule_iddaysdayslots)
- [Scheduler Control](#scheduler-control)
  - [GET /scheduler/mode](#get-schedulermode)
  - [POST /scheduler/mode](#post-schedulermode)
  - [POST /scheduler/override](#post-scheduleroverride)
  - [DELETE /scheduler/override](#delete-scheduleroverride)
  - [GET /scheduler/next-action](#get-schedulernext-action)
- [Execution Log](#execution-log)
  - [GET /scheduler/log](#get-schedulerlog)
- [Error Responses](#error-responses)

---

## Schedule Management

A **schedule** is a named weekly heating programme with time slots per day. One schedule is designated **active** at any time; the scheduler engine executes the active schedule unless overridden or disabled. Day numbers follow ISO 8601 weekday convention: `0` = Monday, `6` = Sunday.

---

### POST /schedules

**Full path:** `POST /api/v1/thermorossi/schedules`

Create a new heating schedule, optionally copying all time slots from an existing one.

**Authentication:** Required (JWT Bearer or API Key)

**Request body (all fields optional):**

```json
{
  "name": "Winter Schedule",
  "copy_from_id": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string \| null` | Schedule name. Defaults to `"New Schedule"` or `"Copy of {source}"` when omitted |
| `copy_from_id` | `number \| null` | ID of schedule to copy slots from. `null` creates an empty schedule |

**Response (201):**

```json
{
  "id": 3,
  "name": "Winter Schedule",
  "enabled": true,
  "created_at": "2026-03-15T10:00:00+00:00",
  "updated_at": "2026-03-15T10:00:00+00:00",
  "interval_count": 0,
  "is_active": false
}
```

```typescript
interface ScheduleSummary {
  id: number;
  name: string;
  enabled: boolean;
  created_at: string;       // ISO 8601
  updated_at: string;       // ISO 8601
  interval_count: number;   // Total slot count across all days
  is_active: boolean;       // true if this is the currently active schedule
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/thermorossi/schedules \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Winter Schedule"}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid authentication |
| `404 Not Found` | `copy_from_id` references a schedule that does not exist |

---

### GET /schedules

**Full path:** `GET /api/v1/thermorossi/schedules`

Return all heating schedules with metadata and the currently active schedule ID.

**Authentication:** Required (JWT Bearer or API Key)

**Response (200):**

```json
{
  "schedules": [
    {
      "id": 1,
      "name": "Default Schedule",
      "enabled": true,
      "created_at": "2026-01-01T00:00:00+00:00",
      "updated_at": "2026-03-01T08:00:00+00:00",
      "interval_count": 14,
      "is_active": true
    },
    {
      "id": 2,
      "name": "Summer Schedule",
      "enabled": false,
      "created_at": "2026-02-01T00:00:00+00:00",
      "updated_at": "2026-02-01T00:00:00+00:00",
      "interval_count": 0,
      "is_active": false
    }
  ],
  "active_schedule_id": 1
}
```

```typescript
interface ScheduleListResponse {
  schedules: ScheduleSummary[];
  active_schedule_id: number | null;
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/thermorossi/schedules \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid authentication |

---

### GET /schedules/{schedule_id}

**Full path:** `GET /api/v1/thermorossi/schedules/{schedule_id}`

Return a single schedule with its complete weekly slot grid.

**Authentication:** Required (JWT Bearer or API Key)

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `schedule_id` | `integer` | Schedule ID |

**Response (200):**

```json
{
  "id": 1,
  "name": "Default Schedule",
  "enabled": true,
  "created_at": "2026-01-01T00:00:00+00:00",
  "updated_at": "2026-03-01T08:00:00+00:00",
  "interval_count": 4,
  "is_active": true,
  "slots_by_day": {
    "0": [
      {
        "id": 10,
        "day": 0,
        "start_minutes": 360,
        "end_minutes": 540,
        "power": 3,
        "fan": 4
      },
      {
        "id": 11,
        "day": 0,
        "start_minutes": 1080,
        "end_minutes": 1320,
        "power": 2,
        "fan": 3
      }
    ],
    "5": [
      {
        "id": 12,
        "day": 5,
        "start_minutes": 480,
        "end_minutes": 600,
        "power": 4,
        "fan": 5
      }
    ]
  }
}
```

> **Note:** Days with no slots are omitted from `slots_by_day`. An empty schedule returns `"slots_by_day": {}`.

```typescript
interface ScheduleSlot {
  id: number;
  day: number;           // 0=Monday, 6=Sunday
  start_minutes: number; // Minutes from midnight (0-1439, multiple of 15)
  end_minutes: number;   // Minutes from midnight (1-1440, multiple of 15)
  power: number;         // 1-5
  fan: number;           // 1-6
}

interface ScheduleDetail extends ScheduleSummary {
  slots_by_day: Record<string, ScheduleSlot[]>; // Key is day number as string
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/thermorossi/schedules/1 \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid authentication |
| `404 Not Found` | Schedule not found |

---

### PATCH /schedules/{schedule_id}

**Full path:** `PATCH /api/v1/thermorossi/schedules/{schedule_id}`

Partially update a schedule -- rename it or toggle the enabled flag. All fields are optional; omit fields you do not wish to change.

**Authentication:** Required (JWT Bearer or API Key)

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `schedule_id` | `integer` | Schedule ID |

**Request body (all fields optional):**

```json
{
  "name": "New Name",
  "enabled": false
}
```

**Response (200):**

Returns the updated `ScheduleSummary`.

```json
{
  "id": 2,
  "name": "New Name",
  "enabled": false,
  "created_at": "2026-02-01T00:00:00+00:00",
  "updated_at": "2026-03-20T14:30:00+00:00",
  "interval_count": 0,
  "is_active": false
}
```

> **Known limitation:** `interval_count` is always `0` in PATCH responses. Use `GET /schedules/{id}` to retrieve the accurate slot count after patching.

**curl:**

```bash
curl -X PATCH YOUR_BASE_URL/api/v1/thermorossi/schedules/2 \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Name"}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid authentication |
| `404 Not Found` | Schedule not found |
| `409 Conflict` | Cannot disable the active schedule — `{"detail": "Cannot disable the active schedule"}` |

---

### DELETE /schedules/{schedule_id}

**Full path:** `DELETE /api/v1/thermorossi/schedules/{schedule_id}`

Delete a schedule and all its time slots. Returns 409 if the schedule is currently active or is the last remaining schedule.

**Authentication:** Required (JWT Bearer or API Key)

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `schedule_id` | `integer` | Schedule ID |

**Response (204):**

No response body.

**curl:**

```bash
curl -X DELETE YOUR_BASE_URL/api/v1/thermorossi/schedules/2 \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid authentication |
| `404 Not Found` | Schedule not found |
| `409 Conflict` | Active schedule: `{"detail": "Cannot delete the active schedule"}` |
| `409 Conflict` | Last schedule: `{"detail": "Cannot delete the last remaining schedule"}` |

---

### PUT /schedules/{schedule_id}/active

**Full path:** `PUT /api/v1/thermorossi/schedules/{schedule_id}/active`

Designate a schedule as the active schedule. The scheduler engine will execute this schedule on the next tick.

**Authentication:** Required (JWT Bearer or API Key)

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `schedule_id` | `integer` | Schedule ID to activate |

**Request body:** None

**Response (200):**

```json
{
  "active_schedule_id": 2
}
```

**curl:**

```bash
curl -X PUT YOUR_BASE_URL/api/v1/thermorossi/schedules/2/active \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid authentication |
| `404 Not Found` | Schedule not found |

---

### PUT /schedules/{schedule_id}/days/{day}/slots

**Full path:** `PUT /api/v1/thermorossi/schedules/{schedule_id}/days/{day}/slots`

Atomically replace all time slots for a given day in a schedule. Sending an empty `slots` array clears all slots for that day.

**Authentication:** Required (JWT Bearer or API Key)

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `schedule_id` | `integer` | Schedule ID |
| `day` | `integer` | Day of week (0=Monday, 6=Sunday) |

**Request body:**

```json
{
  "slots": [
    {
      "start_minutes": 360,
      "end_minutes": 540,
      "power": 3,
      "fan": 4
    },
    {
      "start_minutes": 1080,
      "end_minutes": 1320,
      "power": 2,
      "fan": 3
    }
  ]
}
```

**Slot field constraints:**

| Field | Type | Constraints |
|-------|------|-------------|
| `start_minutes` | `integer` | 0 ≤ x < 1440, multiple of 15 |
| `end_minutes` | `integer` | 0 < x ≤ 1440, multiple of 15 |
| `power` | `integer` | 1--5 |
| `fan` | `integer` | 1--6 |

Additionally: `start_minutes` must be strictly less than `end_minutes`.

**Response (200):**

```json
{
  "schedule_id": 1,
  "day": 0,
  "slot_count": 2
}
```

**curl:**

```bash
curl -X PUT YOUR_BASE_URL/api/v1/thermorossi/schedules/1/days/0/slots \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"slots": [{"start_minutes": 360, "end_minutes": 540, "power": 3, "fan": 4}]}'
```

**curl (clear day):**

```bash
curl -X PUT YOUR_BASE_URL/api/v1/thermorossi/schedules/1/days/0/slots \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"slots": []}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid authentication |
| `404 Not Found` | Schedule not found |
| `422 Unprocessable Entity` | Invalid slot data (out-of-range power/fan, non-15-min alignment, start >= end) |

---

## Scheduler Control

The **scheduler mode** governs whether the engine runs automatically, is paused (disabled), or is suspended via semi-manual override. All mode endpoints return the same `SchedulerMode` shape.

---

### GET /scheduler/mode

**Full path:** `GET /api/v1/thermorossi/scheduler/mode`

Return the current scheduler mode state including enabled flag, semi-manual override status, and associated timestamps.

**Authentication:** Required (JWT Bearer or API Key)

> **Note:** Per D-04, this endpoint returns the raw stored state without live expiry inference. The client is responsible for comparing `returnToAutoAt` against the current time to determine if an override has naturally expired.

**Response (200):**

```json
{
  "enabled": true,
  "semiManual": false,
  "semiManualActivatedAt": null,
  "returnToAutoAt": null
}
```

```typescript
interface SchedulerMode {
  enabled: boolean;
  semiManual: boolean;
  semiManualActivatedAt: number | null;  // Unix timestamp or null
  returnToAutoAt: number | null;          // Unix timestamp or null
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/thermorossi/scheduler/mode \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid authentication |

---

### POST /scheduler/mode

**Full path:** `POST /api/v1/thermorossi/scheduler/mode`

Enable or disable the scheduler globally. Disabling the scheduler does NOT clear the active schedule -- it simply pauses engine execution.

**Authentication:** Required (JWT Bearer or API Key)

**Request body:**

```json
{
  "enabled": true
}
```

**Response (200):**

Returns the updated `SchedulerMode` shape.

```json
{
  "enabled": true,
  "semiManual": false,
  "semiManualActivatedAt": null,
  "returnToAutoAt": null
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/thermorossi/scheduler/mode \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid authentication |

---

### POST /scheduler/override

**Full path:** `POST /api/v1/thermorossi/scheduler/override`

Activate semi-manual override. While active, the scheduler engine skips automatic ignition/shutdown. The override expires automatically at `returnToAutoAt`.

**Authentication:** Required (JWT Bearer or API Key)

**Request body:**

```json
{
  "return_to_auto_at": 1743700000
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `return_to_auto_at` | `integer` | Unix timestamp. Must be strictly in the future |

**Response (200):**

Returns `SchedulerMode` with `semiManual=true`.

```json
{
  "enabled": true,
  "semiManual": true,
  "semiManualActivatedAt": 1743613600,
  "returnToAutoAt": 1743700000
}
```

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/thermorossi/scheduler/override \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"return_to_auto_at": 1743700000}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid authentication |
| `422 Unprocessable Entity` | `return_to_auto_at` is not strictly in the future |

---

### DELETE /scheduler/override

**Full path:** `DELETE /api/v1/thermorossi/scheduler/override`

Clear the semi-manual override and return to automatic scheduling. Atomically clears `semiManual`, `semiManualActivatedAt`, and `returnToAutoAt`.

> **Note:** Per D-11, this endpoint returns **200 with a body** (not 204). The updated mode state is returned.

**Authentication:** Required (JWT Bearer or API Key)

**Request body:** None

**Response (200):**

Returns `SchedulerMode` with `semiManual=false`.

```json
{
  "enabled": true,
  "semiManual": false,
  "semiManualActivatedAt": null,
  "returnToAutoAt": null
}
```

**curl:**

```bash
curl -X DELETE YOUR_BASE_URL/api/v1/thermorossi/scheduler/override \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid authentication |

---

### GET /scheduler/next-action

**Full path:** `GET /api/v1/thermorossi/scheduler/next-action`

Return the next scheduled stove action (ignition or shutdown) based on the active schedule and current Europe/Rome time. Returns `null` with a reason string when no action is available.

**Authentication:** Required (JWT Bearer or API Key)

**Response (200) -- action found:**

```json
{
  "nextAction": {
    "action": "ignite",
    "at": 1743634800,
    "power": 3,
    "fan": 4
  }
}
```

**Response (200) -- no action:**

```json
{
  "nextAction": null,
  "reason": "no_upcoming_slots"
}
```

| `reason` value | Description |
|----------------|-------------|
| `scheduler_disabled` | The scheduler is globally disabled |
| `semi_manual_override_active` | Semi-manual override is currently active |
| `no_active_schedule` | No active schedule has been set |
| `no_upcoming_slots` | Active schedule has no slots within the next 7 days |

```typescript
interface NextAction {
  action: "ignite" | "shutdown";
  at: number;     // Unix timestamp
  power: number;  // 1-5
  fan: number;    // 1-6
}

interface NextActionResponse {
  nextAction: NextAction | null;
  reason?: "scheduler_disabled" | "semi_manual_override_active" | "no_active_schedule" | "no_upcoming_slots";
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/thermorossi/scheduler/next-action \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid authentication |

---

## Execution Log

The execution log records every action the scheduler engine attempted (ignitions and shutdowns), including the matched slot, stove state at time of execution, and duration of the operation.

---

### GET /scheduler/log

**Full path:** `GET /api/v1/thermorossi/scheduler/log`

Return a paginated, optionally time-filtered list of scheduler execution log entries in reverse chronological order.

**Authentication:** Required (JWT Bearer or API Key)

**Query parameters:**

| Parameter | Type | Default | Constraints |
|-----------|------|---------|-------------|
| `page` | `integer` | `1` | ≥ 1 |
| `page_size` | `integer` | `50` | 1--200 |
| `from` | `integer` | — | Unix timestamp (optional) — return entries at or after |
| `to` | `integer` | — | Unix timestamp (optional) — return entries at or before |

**Response (200):**

```json
{
  "items": [
    {
      "id": 42,
      "timestamp": 1743613600,
      "action": "ignite",
      "stoveState": "off",
      "matchedSlot": {
        "start_minutes": 360,
        "end_minutes": 540,
        "power": 3,
        "fan": 4
      },
      "executionDurationMs": 1200,
      "details": null
    },
    {
      "id": 41,
      "timestamp": 1743570000,
      "action": "shutdown",
      "stoveState": "working",
      "matchedSlot": {
        "start_minutes": 1080,
        "end_minutes": 1320,
        "power": 2,
        "fan": 3
      },
      "executionDurationMs": 850,
      "details": null
    }
  ],
  "total": 87,
  "page": 1,
  "pageSize": 50
}
```

```typescript
interface MatchedSlot {
  start_minutes: number;
  end_minutes: number;
  power: number;
  fan: number;
}

interface ExecutionLogItem {
  id: number;
  timestamp: number;               // Unix timestamp
  action: "ignite" | "shutdown";
  stoveState: string | null;       // Stove state at time of execution
  matchedSlot: MatchedSlot | null; // Slot that triggered this action, or null
  executionDurationMs: number | null;
  details: Record<string, unknown> | null;
}

interface ExecutionLogResponse {
  items: ExecutionLogItem[];
  total: number;
  page: number;
  pageSize: number;
}
```

**curl (first page, default page size):**

```bash
curl "YOUR_BASE_URL/api/v1/thermorossi/scheduler/log" \
  -H "X-API-Key: YOUR_API_KEY"
```

**curl (page 2, with time range):**

```bash
curl "YOUR_BASE_URL/api/v1/thermorossi/scheduler/log?page=2&page_size=20&from=1743500000&to=1743700000" \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401 Unauthorized` | Missing or invalid authentication |
| `503 Service Unavailable` | Scheduler DB not initialized — `{"detail": "Scheduler DB not initialized"}` |

---

## Error Responses

This section consolidates the error cases that appear across multiple endpoints.

### 409 Conflict

Returned when a destructive or mutating operation is blocked by business rules.

**Cannot delete the active schedule:**

```json
{
  "detail": "Cannot delete the active schedule"
}
```

**Cannot delete the last remaining schedule:**

```json
{
  "detail": "Cannot delete the last remaining schedule"
}
```

**Cannot disable the active schedule:**

```json
{
  "detail": "Cannot disable the active schedule"
}
```

### 422 Unprocessable Entity

Returned when request data fails validation rules.

**Invalid slot data (example: non-15-minute alignment):**

```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "slots", 0, "start_minutes"],
      "msg": "start_minutes must be a multiple of 15",
      "input": 17
    }
  ]
}
```

**Invalid slot data (example: start >= end):**

```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "slots", 0],
      "msg": "start_minutes must be less than end_minutes",
      "input": {"start_minutes": 540, "end_minutes": 360, "power": 3, "fan": 4}
    }
  ]
}
```

**Override timestamp not in the future:**

```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "return_to_auto_at"],
      "msg": "return_to_auto_at must be in the future",
      "input": 1609459200
    }
  ]
}
```

### 503 Service Unavailable

Returned when the scheduler database has not been initialized (startup in progress or initialization failure).

```json
{
  "detail": "Scheduler DB not initialized"
}
```

Retry with exponential back-off. If the error persists, check `GET /api/v1/thermorossi/health` for provider status.

---

## Real-Time (WebSocket)

For real-time push updates without polling, subscribe to the `scheduler` topic on the WebSocket endpoint.

See [WebSocket API - scheduler topic](./websocket.md#scheduler) for the full payload schema, TypeScript interfaces, and subscription example.

**Topic:** `scheduler`
**Snapshot on subscribe:** Yes -- current schedules, active schedule, and mode state
