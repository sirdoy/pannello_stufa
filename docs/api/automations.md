# Automations API

**Base path:** `/api/v1/automations`

Rule-based automation engine for smart home devices — define triggers (sensor changes, thresholds, cron schedules), conditions (time windows, device states, temperature ranges), and actions (Netatmo control, webhooks, log events). All endpoints require authentication via JWT Bearer token or API Key (`X-API-Key` header). Triggers, conditions, and actions use Pydantic discriminated unions with a `type` field as the discriminator. 6 endpoints.

---

## Quick Reference

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/v1/automations` | List automation rules (paginated) | Yes |
| `POST` | `/api/v1/automations` | Create a new automation rule | Yes |
| `GET` | `/api/v1/automations/{rule_id}` | Get automation rule by ID | Yes |
| `PATCH` | `/api/v1/automations/{rule_id}` | Update an automation rule (partial) | Yes |
| `DELETE` | `/api/v1/automations/{rule_id}` | Delete an automation rule | Yes |
| `GET` | `/api/v1/automations/{rule_id}/executions` | List execution history for a rule (paginated) | Yes |

---

## Table of Contents

- [Trigger, Condition, and Action Types](#trigger-condition-and-action-types)
  - [Trigger Types](#trigger-types)
  - [Condition Types](#condition-types)
  - [Action Types](#action-types)
- [Pagination Parameters](#pagination-parameters)
- [GET /api/v1/automations](#get-apiv1automations)
- [POST /api/v1/automations](#post-apiv1automations)
- [GET /api/v1/automations/{rule_id}](#get-apiv1automationsrule_id)
- [PATCH /api/v1/automations/{rule_id}](#patch-apiv1automationsrule_id)
- [DELETE /api/v1/automations/{rule_id}](#delete-apiv1automationsrule_id)
- [GET /api/v1/automations/{rule_id}/executions](#get-apiv1automationsrule_idexecutions)
- [TypeScript Interfaces](#typescript-interfaces)

---

## Trigger, Condition, and Action Types

All three fields — `trigger`, `condition`, `action` — use discriminated unions. The `type` field is the discriminator. An unrecognized `type` value results in a `422 Unprocessable Entity` response.

### Trigger Types

| `type` | Additional Fields | Description |
|--------|------------------|-------------|
| `"sensor_state_change"` | `sensor_id` (str), `from_state` (str\|null), `to_state` (str\|null) | Fires when a sensor state transitions |
| `"sensor_threshold"` | `sensor_id` (str), `metric` (str), `operator` (`"gt"`\|`"lt"`\|`"gte"`\|`"lte"`), `threshold` (float) | Fires when a sensor metric crosses a threshold |
| `"netatmo_temperature_threshold"` | `home_id` (str), `room_id` (str), `operator` (`"gt"`\|`"lt"`\|`"gte"`\|`"lte"`), `threshold` (float) | Fires on Netatmo room temperature threshold |
| `"schedule_cron"` | `cron_expression` (str) | Fires on a cron schedule (e.g. `"0 22 * * *"`) |
| `"manual_api_call"` | _(none)_ | Fires when manually triggered via API |

### Condition Types

| `type` | Additional Fields | Description |
|--------|------------------|-------------|
| `"time_window"` | `start_time` (str HH:MM), `end_time` (str HH:MM) | Only runs during a time window |
| `"device_state"` | `sensor_id` (str), `expected_state` (str) | Only runs if device is in expected state |
| `"temperature_range"` | `min_temp` (float\|null), `max_temp` (float\|null) | Only runs if temperature is in range |
| `"always_true"` | _(none)_ | No condition — always passes (default) |

### Action Types

| `type` | Additional Fields | Description |
|--------|------------------|-------------|
| `"netatmo_set_room_temp"` | `home_id` (str), `room_id` (str), `mode` (`"manual"`\|`"home"`), `temp` (float\|null, 5.0–30.0) | Set Netatmo room temperature |
| `"netatmo_set_home_mode"` | `home_id` (str), `mode` (`"schedule"`\|`"away"`\|`"hg"`) | Set Netatmo home mode |
| `"netatmo_switch_schedule"` | `home_id` (str), `schedule_id` (str) | Switch Netatmo heating schedule |
| `"http_webhook"` | `url` (str), `method` (`"GET"`\|`"POST"`, default `"POST"`), `payload` (object\|null) | Call an external webhook |
| `"log_event"` | `message` (str) | Log a message to the automation log |

---

## Pagination Parameters

Paginated endpoints accept:

| Parameter | Type | Default | Constraints | Description |
|-----------|------|---------|-------------|-------------|
| `limit` | int | 20 | 1–1000 | Items per page |
| `offset` | int | 0 | >= 0 | Items to skip |

---

## GET /api/v1/automations

Return a paginated list of all automation rules.

**Authentication:** Required (JWT Bearer or API Key)

**Query parameters:** `limit`, `offset` — see [Pagination Parameters](#pagination-parameters).

**Response (200) — `PaginatedResponse<AutomationRule>`** (see [common.md](./common.md#typescript-interfaces)):

```json
{
  "items": [
    {
      "id": 1,
      "name": "Riscaldamento notturno",
      "enabled": true,
      "trigger": {"type": "schedule_cron", "cron_expression": "0 22 * * *"},
      "condition": {"type": "always_true"},
      "action": {"type": "netatmo_set_home_mode", "home_id": "abc123", "mode": "away"},
      "min_interval_seconds": 0,
      "max_triggers_per_hour": 0,
      "last_triggered_at": 1771113600,
      "created_at": 1771000000,
      "updated_at": 1771000000
    }
  ],
  "total_count": 1,
  "limit": 20,
  "offset": 0
}
```

**Error responses:**

| Status | Description |
|--------|-------------|
| `401` | Missing or invalid authentication |

**curl:**

```bash
curl http://localhost:8000/api/v1/automations \
  -H "Authorization: Bearer <token>"
```

---

## POST /api/v1/automations

Create a new automation rule.

**Authentication:** Required (JWT Bearer or API Key)

**Request body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | Yes | — | Rule name (min 1 character) |
| `enabled` | boolean | No | `true` | Whether the rule is active |
| `trigger` | TriggerType | Yes | — | When to fire the rule |
| `condition` | ConditionType | No | `{"type":"always_true"}` | Optional condition to check before action |
| `action` | ActionType | Yes | — | What to do when triggered |
| `min_interval_seconds` | int | No | `0` | Minimum seconds between triggers (0 = no limit) |
| `max_triggers_per_hour` | int | No | `0` | Maximum triggers per hour (0 = no limit) |

**Response (201):**

```json
{
  "id": 3,
  "name": "Riscaldamento notturno",
  "enabled": true,
  "trigger": {
    "type": "schedule_cron",
    "cron_expression": "0 22 * * *"
  },
  "condition": {
    "type": "always_true"
  },
  "action": {
    "type": "netatmo_set_home_mode",
    "home_id": "abc123",
    "mode": "away"
  },
  "min_interval_seconds": 0,
  "max_triggers_per_hour": 0,
  "last_triggered_at": null,
  "created_at": 1771179600,
  "updated_at": 1771179600
}
```

**Error responses:**

| Status | Description |
|--------|-------------|
| `401` | Missing or invalid authentication |
| `422` | Validation error — fires when `trigger.type`, `condition.type`, or `action.type` contains an unrecognized discriminator value, or when required fields are missing |

**curl:**

```bash
curl -X POST http://localhost:8000/api/v1/automations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Riscaldamento notturno",
    "trigger": {"type": "schedule_cron", "cron_expression": "0 22 * * *"},
    "action": {"type": "netatmo_set_home_mode", "home_id": "abc123", "mode": "away"}
  }'
```

---

## GET /api/v1/automations/{rule_id}

Return a single automation rule by ID.

**Authentication:** Required (JWT Bearer or API Key)

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `rule_id` | int | Automation rule ID |

**Response (200):** Single `AutomationRule` object (same structure as items in list endpoint).

**Error responses:**

| Status | Description |
|--------|-------------|
| `401` | Missing or invalid authentication |
| `404` | Rule not found |

**curl:**

```bash
curl http://localhost:8000/api/v1/automations/1 \
  -H "Authorization: Bearer <token>"
```

---

## PATCH /api/v1/automations/{rule_id}

Partially update an automation rule. Only fields included in the request body are modified.

**Authentication:** Required (JWT Bearer or API Key)

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `rule_id` | int | Automation rule ID |

**Request body (all fields optional):**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string \| null | New name |
| `enabled` | boolean \| null | Enable or disable the rule |
| `trigger` | TriggerType \| null | Replace trigger |
| `condition` | ConditionType \| null | Replace condition |
| `action` | ActionType \| null | Replace action |
| `min_interval_seconds` | int \| null | Update minimum interval |
| `max_triggers_per_hour` | int \| null | Update max triggers per hour |

Example — disable a rule:

```json
{"enabled": false}
```

**Response (200):** Updated `AutomationRule` object.

**Error responses:**

| Status | Description |
|--------|-------------|
| `401` | Missing or invalid authentication |
| `404` | Rule not found |
| `422` | Invalid discriminator value in trigger/condition/action |

**curl:**

```bash
curl -X PATCH http://localhost:8000/api/v1/automations/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

---

## DELETE /api/v1/automations/{rule_id}

Delete an automation rule and all its execution history permanently.

**Authentication:** Required (JWT Bearer or API Key)

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `rule_id` | int | Automation rule ID |

**Response:** `204 No Content` (empty body)

**Error responses:**

| Status | Description |
|--------|-------------|
| `401` | Missing or invalid authentication |
| `404` | Rule not found |

**curl:**

```bash
curl -X DELETE http://localhost:8000/api/v1/automations/1 \
  -H "Authorization: Bearer <token>"
```

---

## GET /api/v1/automations/{rule_id}/executions

Return paginated execution history for an automation rule.

**Authentication:** Required (JWT Bearer or API Key)

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `rule_id` | int | Automation rule ID |

**Query parameters:** `limit`, `offset` — see [Pagination Parameters](#pagination-parameters).

**Response (200) — `PaginatedResponse<AutomationExecution>`** (see [common.md](./common.md#typescript-interfaces)):

```json
{
  "items": [
    {
      "id": 42,
      "rule_id": 1,
      "triggered_at": 1771113600,
      "status": "success",
      "trigger_snapshot": "{\"type\": \"schedule_cron\", \"cron_expression\": \"0 22 * * *\"}",
      "error_message": null
    },
    {
      "id": 41,
      "rule_id": 1,
      "triggered_at": 1771027200,
      "status": "failure",
      "trigger_snapshot": "{\"type\": \"schedule_cron\", \"cron_expression\": \"0 22 * * *\"}",
      "error_message": "Netatmo API timeout"
    }
  ],
  "total_count": 42,
  "limit": 20,
  "offset": 0
}
```

**AutomationExecution fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Execution ID |
| `rule_id` | int | ID of the automation rule that fired |
| `triggered_at` | int | Unix timestamp when the rule was triggered |
| `status` | `"success"` \| `"failure"` \| `"skipped"` | Execution outcome |
| `trigger_snapshot` | string \| null | JSON string of the trigger state at execution time |
| `error_message` | string \| null | Error description if status is `"failure"` |

**Error responses:**

| Status | Description |
|--------|-------------|
| `401` | Missing or invalid authentication |
| `404` | Rule not found |

**curl:**

```bash
curl http://localhost:8000/api/v1/automations/1/executions \
  -H "Authorization: Bearer <token>"
```

---

## TypeScript Interfaces

> For `PaginatedResponse<T>`, see [common.md](./common.md#typescript-interfaces).

```typescript
type TriggerType =
  | { type: "sensor_state_change"; sensor_id: string; from_state: string | null; to_state: string | null }
  | { type: "sensor_threshold"; sensor_id: string; metric: string; operator: "gt" | "lt" | "gte" | "lte"; threshold: number }
  | { type: "netatmo_temperature_threshold"; home_id: string; room_id: string; operator: "gt" | "lt" | "gte" | "lte"; threshold: number }
  | { type: "schedule_cron"; cron_expression: string }
  | { type: "manual_api_call" };

type ConditionType =
  | { type: "time_window"; start_time: string; end_time: string }   // HH:MM format
  | { type: "device_state"; sensor_id: string; expected_state: string }
  | { type: "temperature_range"; min_temp: number | null; max_temp: number | null }
  | { type: "always_true" };

type ActionType =
  | { type: "netatmo_set_room_temp"; home_id: string; room_id: string; mode: "manual" | "home"; temp: number | null }
  | { type: "netatmo_set_home_mode"; home_id: string; mode: "schedule" | "away" | "hg" }
  | { type: "netatmo_switch_schedule"; home_id: string; schedule_id: string }
  | { type: "http_webhook"; url: string; method: "GET" | "POST"; payload: Record<string, unknown> | null }
  | { type: "log_event"; message: string };

interface AutomationRule {
  id: number;
  name: string;
  enabled: boolean;
  trigger: TriggerType;
  condition: ConditionType;
  action: ActionType;
  min_interval_seconds: number;
  max_triggers_per_hour: number;
  last_triggered_at: number | null;   // Unix timestamp
  created_at: number;                 // Unix timestamp
  updated_at: number;                 // Unix timestamp
}

interface AutomationRuleCreate {
  name: string;
  enabled?: boolean;                  // default: true
  trigger: TriggerType;
  condition?: ConditionType;          // default: { type: "always_true" }
  action: ActionType;
  min_interval_seconds?: number;      // default: 0
  max_triggers_per_hour?: number;     // default: 0
}

interface AutomationRulePatch {
  name?: string;
  enabled?: boolean;
  trigger?: TriggerType;
  condition?: ConditionType;
  action?: ActionType;
  min_interval_seconds?: number;
  max_triggers_per_hour?: number;
}

interface AutomationExecution {
  id: number;
  rule_id: number;
  triggered_at: number;               // Unix timestamp
  status: "success" | "failure" | "skipped";
  trigger_snapshot: string | null;    // JSON string of trigger at execution time
  error_message: string | null;
}
```

---

## Frontend Component Suggestions

**CRUD Rules** (GET /rules, GET /rules/{id}, POST, PUT, DELETE)
- **Table** -- map `rules[]` to rows; columns: name, trigger_type, enabled (Badge: green if true, gray if false), last_executed, created_at. Sortable by name and enabled status. Per D-10 (list endpoint).
- **Modal Form** -- create/edit rule with fields: name (text), description (textarea), trigger (nested selector for type + config), conditions (list builder), actions (list builder with action type selector), enabled (Toggle). Per D-15 (CRUD write).
- **ConfirmDialog** -- delete confirmation showing rule name. Per D-15 (CRUD write).

**Execution History** (GET /rules/{id}/history)
- **Table** -- map `executions[]` to paginated rows; columns: executed_at, status (Badge: success -> green, failed -> red, skipped -> gray), trigger_reason, duration_ms. Per D-10 (list endpoint).
