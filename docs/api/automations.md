# Automations API

**Base path:** `/api/v1/automations`

Rule-based automation engine for smart home devices — define triggers (sensor changes, thresholds, cron schedules), conditions (time windows, device states, temperature ranges), and actions (Netatmo control, webhooks, log events). All endpoints require authentication via JWT Bearer token or API Key (`X-API-Key` header). Triggers, conditions, and actions use Pydantic discriminated unions with a `type` field as the discriminator. 11 endpoints (6 automation CRUD + trigger + evaluate + 3 capabilities).

---

## Quick Reference

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/v1/automations` | List automation rules (paginated) | Yes |
| `POST` | `/api/v1/automations` | Create a new automation rule | Yes |
| `GET` | `/api/v1/automations/{rule_id}` | Get automation rule by ID | Yes |
| `PATCH` | `/api/v1/automations/{rule_id}` | Update an automation rule (partial) | Yes |
| `DELETE` | `/api/v1/automations/{rule_id}` | Delete an automation rule | Yes |
| `GET` | `/api/v1/automations/{rule_id}/history` | List execution history for a rule (paginated, newest first) | Yes |
| `POST` | `/api/v1/automations/{rule_id}/trigger` | Manually trigger a rule, bypassing conditions and safety guards | Yes |
| `POST` | `/api/v1/automations/{rule_id}/evaluate` | Dry-run evaluate a rule's condition tree without executing actions | Yes |
| `GET` | `/api/v1/capabilities` | List conditions and actions available for every provider | Yes |
| `GET` | `/api/v1/capabilities/{provider}` | List conditions and actions for a single provider | Yes |
| `GET` | `/api/v1/capabilities/{provider}/{device_id}` | List conditions and actions scoped to a specific device | Yes |

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
- [GET /api/v1/automations/{rule_id}/history](#get-apiv1automationsrule_idhistory)
- [POST /api/v1/automations/{rule_id}/trigger](#post-apiv1automationsrule_idtrigger)
- [POST /api/v1/automations/{rule_id}/evaluate](#post-apiv1automationsrule_idevaluate)
- [GET /api/v1/capabilities](#get-apiv1capabilities)
- [GET /api/v1/capabilities/{provider}](#get-apiv1capabilitiesprovider)
- [GET /api/v1/capabilities/{provider}/{device_id}](#get-apiv1capabilitiesproviderdevice_id)
- [Real-Time Execution Events (WebSocket)](#real-time-execution-events-websocket)
- [TypeScript Interfaces](#typescript-interfaces)

---

## Trigger, Condition, and Action Types

All three fields — `trigger`, `condition`, `actions[*]` — use discriminated unions (`actions` is an array; each element is a discriminated union). The `type` field is the discriminator. An unrecognized `type` value results in a `422 Unprocessable Entity` response.

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
      "actions": [{"type": "netatmo_set_home_mode", "home_id": "abc123", "mode": "away"}],
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
curl https://pdupun8zpr7exw43.myfritz.net/api/v1/automations \
  -H "X-API-Key: ${API_KEY}"
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
| `trigger` | TriggerType \| null | No | `null` | When to fire the rule. When omitted, the rule only fires via manual trigger. |
| `condition` | ConditionNode | Yes | — | Condition tree evaluated before actions run. Use `{"type":"always_true"}` to always pass. |
| `actions` | ActionItem[] | Yes | — | Array of actions executed in sequence when the rule fires. Minimum length: 1. |
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
  "actions": [
    {
      "type": "netatmo_set_home_mode",
      "home_id": "abc123",
      "mode": "away"
    }
  ],
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
| `422` | Validation error — fires when `trigger.type`, `condition.type`, or `actions[*].type` contains an unrecognized discriminator value, when `actions` is missing or empty, or when required fields are missing |

**curl:**

```bash
curl -X POST https://pdupun8zpr7exw43.myfritz.net/api/v1/automations \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Riscaldamento notturno",
    "trigger": {"type": "schedule_cron", "cron_expression": "0 22 * * *"},
    "condition": {"type": "always_true"},
    "actions": [{"type": "netatmo_set_home_mode", "home_id": "abc123", "mode": "away"}]
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
curl https://pdupun8zpr7exw43.myfritz.net/api/v1/automations/1 \
  -H "X-API-Key: ${API_KEY}"
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
| `condition` | ConditionNode \| null | Replace the condition tree |
| `actions` | ActionItem[] \| null | Replace the full actions array (minimum 1 element when provided) |
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
curl -X PATCH https://pdupun8zpr7exw43.myfritz.net/api/v1/automations/1 \
  -H "X-API-Key: ${API_KEY}" \
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
curl -X DELETE https://pdupun8zpr7exw43.myfritz.net/api/v1/automations/1 \
  -H "X-API-Key: ${API_KEY}"
```

---

## GET /api/v1/automations/{rule_id}/history

Return paginated execution history for an automation rule (newest first).

Renamed from `/executions` to `/history` in Phase 129 (D-16) to match the
convention used by the hue, tuya, and dirigera providers. The old path has
been removed, not aliased — clients must use `/history`.

### Event-driven execution & log semantics

- Rules are evaluated automatically every 30 seconds by the engine tick,
  driven by provider cache deltas. No manual trigger is required.
- Only rules whose condition tree references at least one changed sensor are
  evaluated on a given tick; unaffected rules write no row.
- Rules fire on FALSE → TRUE transitions of their condition tree
  (edge-trigger semantics). Sustained TRUE produces no duplicate rows.
- `status` is one of `success`, `failure`, `partial_failure`, `skipped`,
  `condition_not_met`.
- `trigger_snapshot` is a compact JSON blob recording the changed sensor IDs
  that caused this evaluation and, on any non-success outcome, the cause
  (`leaf_false` / `guard` / `action` / `all_actions_failed`) to help
  diagnose why the rule did not succeed.

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
curl https://pdupun8zpr7exw43.myfritz.net/api/v1/automations/1/history \
  -H "X-API-Key: ${API_KEY}"
```

---

## POST /api/v1/automations/{rule_id}/trigger

Manually trigger a rule's actions, bypassing conditions and all safety guards.

This endpoint runs the rule's action array inline, skipping the condition
tree evaluation and every Phase 128 safety guard (`enabled` flag, cooldown,
rate cap, active hours). It still writes `last_triggered_at` BEFORE executing
actions so the engine's next automatic tick sees the manual run as a cooldown
baseline. Exactly one execution row is written with `trigger_source='manual'`,
and the automations WebSocket topic receives the event broadcast BEFORE the
HTTP response returns. Per-action failures do not produce 4xx/5xx — the
response is always 200 with an `action_results` array describing each action's
outcome. The handler only returns 404 when `rule_id` is unknown.

**Authentication:** Required (JWT Bearer or API Key)

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `rule_id` | int | Automation rule ID |

**Request body:** _(none — POST with no body)_

**Response (200) — `TriggerResponse`:**

```json
{
  "execution_id": 128,
  "rule_id": 1,
  "trigger_source": "manual",
  "status": "partial_failure",
  "triggered_at": 1771200000,
  "triggered_by": "api-key:nextjs-frontend",
  "action_results": [
    {
      "index": 0,
      "action_type": "netatmo_set_home_mode",
      "success": true,
      "error": null
    },
    {
      "index": 1,
      "action_type": "http_webhook",
      "success": false,
      "error": "HTTPError: 500 Internal Server Error"
    }
  ]
}
```

**TriggerResponse fields:**

| Field | Type | Description |
|-------|------|-------------|
| `execution_id` | int | ID of the execution row written for this manual trigger |
| `rule_id` | int | ID of the rule that was triggered |
| `trigger_source` | `"manual"` | Always `"manual"` for this endpoint |
| `status` | `"success"` \| `"partial_failure"` \| `"failure"` | Aggregate outcome: all actions succeeded, some succeeded, or all failed |
| `triggered_at` | int | Unix epoch seconds when the trigger started |
| `triggered_by` | string | Username (JWT) or API key name that invoked the trigger |
| `action_results` | ManualActionResult[] | Per-action outcome list, indexed in declaration order |

**ManualActionResult fields:**

| Field | Type | Description |
|-------|------|-------------|
| `index` | int | 0-based index of the action in the rule's `actions` array |
| `action_type` | string | Action discriminator string (e.g. `"netatmo_set_home_mode"`) |
| `success` | boolean | `true` if the action completed without raising |
| `error` | string \| null | Exception type + message if `success` is `false`, else `null` |

**Error responses:**

| Status | Description |
|--------|-------------|
| `401` | Missing or invalid authentication |
| `404` | Rule not found (unknown `rule_id`) |
| `500` | Defensive — only fires if the handler itself crashes. Per-action failures still return 200 with `status="failure"` or `"partial_failure"` |

**curl:**

```bash
curl -X POST https://pdupun8zpr7exw43.myfritz.net/api/v1/automations/1/trigger \
  -H "X-API-Key: ${API_KEY}"
```

---

## POST /api/v1/automations/{rule_id}/evaluate

Dry-run evaluate a rule's condition tree and return the result plus a per-node trace, without executing any actions.

This endpoint walks the rule's condition tree with a trace-capable evaluator
and returns both the overall boolean outcome and a recursive `TraceNode` tree
describing how each node evaluated. It writes NOTHING to
`automation_executions` and does NOT broadcast on the `automations` WebSocket
topic — the endpoint is strictly diagnostic. The response is always 200 on a
well-formed request; evaluator errors appear inline as `matched=false` with a
diagnostic `detail` string on the offending node (fail-closed semantics).
Short-circuited children (in AND/OR nodes) are still emitted in the trace with
`detail="not evaluated (short-circuit)"` so the UI can render the full tree.

**Authentication:** Required (JWT Bearer or API Key)

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `rule_id` | int | Automation rule ID |

**Request body:** _(none — POST with no body)_

**Response (200) — `EvaluateResponse`:**

```json
{
  "rule_id": 1,
  "matched": false,
  "trace": {
    "type": "and",
    "matched": false,
    "detail": null,
    "children": [
      {
        "type": "time_window",
        "matched": true,
        "detail": "22:00 <= 22:30 < 06:00",
        "children": []
      },
      {
        "type": "sensor_threshold",
        "matched": false,
        "detail": "dirigera:salon:temperature 19.2 >= 20.0",
        "children": []
      }
    ]
  }
}
```

**EvaluateResponse fields:**

| Field | Type | Description |
|-------|------|-------------|
| `rule_id` | int | ID of the rule that was evaluated |
| `matched` | boolean | Overall condition tree outcome for the current state |
| `trace` | TraceNode | Root node of the per-node evaluation trace |

**TraceNode fields:**

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Source node's discriminator (`"and"`, `"or"`, `"sensor_threshold"`, `"time_window"`, `"sensor_state_change"`, `"netatmo_temperature_threshold"`, `"device_state"`, `"temperature_range"`, `"always_true"`) |
| `matched` | boolean | `true` if the source node evaluated to true this pass |
| `detail` | string \| null | Human-readable evaluator diagnostic (leaves describe the comparison; compound nodes may be `null`) |
| `children` | TraceNode[] | Sub-traces for AND/OR nodes; empty array for leaves |

**Error responses:**

| Status | Description |
|--------|-------------|
| `401` | Missing or invalid authentication |
| `404` | Rule not found (unknown `rule_id`) |

**curl:**

```bash
curl -X POST https://pdupun8zpr7exw43.myfritz.net/api/v1/automations/1/evaluate \
  -H "X-API-Key: ${API_KEY}"
```

---

## GET /api/v1/capabilities

List all conditions and actions supported by every registered provider.

The response enumerates each provider's supported condition leaves and action
types together with parameter schemas — enough for a frontend to render a
condition builder and action configurator without hardcoded provider
knowledge. The synthetic `system` provider is always present and carries the
cross-provider primitives (`time_window`, `always_true`, `http_webhook`,
`log_event`). Each capability entry exposes `type` (discriminator string),
`category` (`"condition"` or `"action"`), and a `parameters` array. Every
parameter descriptor carries the full set of keys — `name`, `type`,
`required`, `default`, `min`, `max`, `enum`, `pattern`, `description` — with
`null` for absent fields (keys are never omitted).

**Authentication:** Required (JWT Bearer or API Key)

**Response (200):**

```json
{
  "providers": [
    {
      "name": "hue",
      "conditions": [
        {
          "type": "sensor_state_change",
          "category": "condition",
          "parameters": [
            {"name": "sensor_id", "type": "string", "required": true, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
            {"name": "from_state", "type": "string", "required": false, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
            {"name": "to_state", "type": "string", "required": false, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null}
          ]
        }
      ],
      "actions": [
        {
          "type": "hue_light",
          "category": "action",
          "parameters": [
            {"name": "light_id", "type": "string", "required": true, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
            {"name": "on", "type": "boolean", "required": false, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
            {"name": "brightness", "type": "integer", "required": false, "default": null, "min": 1, "max": 254, "enum": null, "pattern": null, "description": null},
            {"name": "color_temp", "type": "integer", "required": false, "default": null, "min": 153, "max": 500, "enum": null, "pattern": null, "description": null},
            {"name": "hue", "type": "integer", "required": false, "default": null, "min": 0, "max": 65535, "enum": null, "pattern": null, "description": null},
            {"name": "sat", "type": "integer", "required": false, "default": null, "min": 0, "max": 254, "enum": null, "pattern": null, "description": null}
          ]
        }
      ]
    },
    {
      "name": "system",
      "conditions": [
        {
          "type": "time_window",
          "category": "condition",
          "parameters": [
            {"name": "start_time", "type": "string", "required": true, "default": null, "min": null, "max": null, "enum": null, "pattern": "^\\d{2}:\\d{2}$", "description": null},
            {"name": "end_time", "type": "string", "required": true, "default": null, "min": null, "max": null, "enum": null, "pattern": "^\\d{2}:\\d{2}$", "description": null}
          ]
        },
        {
          "type": "always_true",
          "category": "condition",
          "parameters": []
        }
      ],
      "actions": [
        {
          "type": "log_event",
          "category": "action",
          "parameters": [
            {"name": "message", "type": "string", "required": true, "default": null, "min": 1, "max": null, "enum": null, "pattern": null, "description": null}
          ]
        }
      ]
    }
  ]
}
```

**Response top-level fields:**

| Field | Type | Description |
|-------|------|-------------|
| `providers` | ProviderBlock[] | Array of `{name, conditions, actions}` objects, sorted alphabetically, plus `system` always appended |

**ProviderBlock fields:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Provider name (`hue`, `netatmo`, `thermorossi`, `sonos`, `tuya`, `dirigera`, `system`) |
| `conditions` | CapabilityDescriptor[] | Supported condition leaves for this provider |
| `actions` | CapabilityDescriptor[] | Supported action types for this provider |

**CapabilityDescriptor fields:**

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Discriminator literal (e.g. `"hue_light"`, `"time_window"`) — matches the `type` field of the corresponding condition/action payload |
| `category` | `"condition"` \| `"action"` | Capability kind |
| `parameters` | ParameterDescriptor[] | Parameter schema for this capability (see below) |

**ParameterDescriptor fields (every key always present, `null` when absent):**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Parameter name |
| `type` | `"string"` \| `"integer"` \| `"number"` \| `"boolean"` \| `"enum"` | Parameter primitive type |
| `required` | boolean | `true` if the Pydantic field is required |
| `default` | any \| null | Default value if the field is optional |
| `min` | number \| null | Minimum numeric value (or minimum string length) |
| `max` | number \| null | Maximum numeric value (or maximum string length) |
| `enum` | any[] \| null | Allowed values if the field is a `Literal[...]` |
| `pattern` | string \| null | Regex pattern if `Field(pattern=...)` is set |
| `description` | string \| null | Optional human description |

**Error responses:**

| Status | Description |
|--------|-------------|
| `401` | Missing or invalid authentication |

**curl:**

```bash
curl https://pdupun8zpr7exw43.myfritz.net/api/v1/capabilities \
  -H "X-API-Key: ${API_KEY}"
```

---

## GET /api/v1/capabilities/{provider}

List conditions and actions for a single provider.

Returns the same `ProviderBlock` shape as the list endpoint but for one
provider only. `system` resolves to the cross-provider primitives block.
Unknown or unregistered provider names return 404.

**Authentication:** Required (JWT Bearer or API Key)

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `provider` | string | One of `hue`, `netatmo`, `thermorossi`, `sonos`, `tuya`, `dirigera`, `system` |

**Response (200):**

```json
{
  "name": "hue",
  "conditions": [
    {
      "type": "sensor_state_change",
      "category": "condition",
      "parameters": [
        {"name": "sensor_id", "type": "string", "required": true, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
        {"name": "from_state", "type": "string", "required": false, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
        {"name": "to_state", "type": "string", "required": false, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null}
      ]
    },
    {
      "type": "sensor_threshold",
      "category": "condition",
      "parameters": [
        {"name": "sensor_id", "type": "string", "required": true, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
        {"name": "metric", "type": "string", "required": true, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
        {"name": "operator", "type": "enum", "required": true, "default": null, "min": null, "max": null, "enum": ["gt", "lt", "gte", "lte"], "pattern": null, "description": null},
        {"name": "threshold", "type": "number", "required": true, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null}
      ]
    }
  ],
  "actions": [
    {
      "type": "hue_light",
      "category": "action",
      "parameters": [
        {"name": "light_id", "type": "string", "required": true, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
        {"name": "on", "type": "boolean", "required": false, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
        {"name": "brightness", "type": "integer", "required": false, "default": null, "min": 1, "max": 254, "enum": null, "pattern": null, "description": null},
        {"name": "color_temp", "type": "integer", "required": false, "default": null, "min": 153, "max": 500, "enum": null, "pattern": null, "description": null}
      ]
    }
  ]
}
```

**Error responses:**

| Status | Description |
|--------|-------------|
| `401` | Missing or invalid authentication |
| `404` | Unknown or unregistered provider |

**curl:**

```bash
curl https://pdupun8zpr7exw43.myfritz.net/api/v1/capabilities/hue \
  -H "X-API-Key: ${API_KEY}"
```

---

## GET /api/v1/capabilities/{provider}/{device_id}

List conditions and actions scoped to a specific device, including device-specific parameter ranges.

Returns a `ProviderBlock` plus a top-level `device` object describing the
device's identity (`id`, `name`, `type`). When a device's runtime cache
permits, the response narrows parameter ranges to the legal values for that
particular device — for example, a Hue bulb's `brightness` range reflects
whatever the bulb reports, and a tunable-white bulb's `color_temp` uses its
actual mired min/max. This lets a form render only legal values without
trial-and-error. Narrowing errors fall back silently to the un-narrowed base
block (D-22 fail-safe). `system` never has devices and always returns 404.

**Authentication:** Required (JWT Bearer or API Key)

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `provider` | string | One of `hue`, `netatmo`, `thermorossi`, `sonos`, `tuya`, `dirigera` (not `system`) |
| `device_id` | string | Provider-native device id (Hue light id, Tuya device id, Dirigera sensor id, Sonos `uid`, Netatmo room id, Thermorossi `"default"`) |

**Response (200):**

```json
{
  "name": "hue",
  "device": {
    "id": "12345",
    "name": "Lampada salotto",
    "type": "Extended color light"
  },
  "conditions": [
    {
      "type": "sensor_state_change",
      "category": "condition",
      "parameters": [
        {"name": "sensor_id", "type": "string", "required": true, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
        {"name": "from_state", "type": "string", "required": false, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
        {"name": "to_state", "type": "string", "required": false, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null}
      ]
    }
  ],
  "actions": [
    {
      "type": "hue_light",
      "category": "action",
      "parameters": [
        {"name": "light_id", "type": "string", "required": true, "default": "12345", "min": null, "max": null, "enum": ["12345"], "pattern": null, "description": null},
        {"name": "on", "type": "boolean", "required": false, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
        {"name": "brightness", "type": "integer", "required": false, "default": null, "min": 1, "max": 254, "enum": null, "pattern": null, "description": null},
        {"name": "color_temp", "type": "integer", "required": false, "default": null, "min": 153, "max": 454, "enum": null, "pattern": null, "description": null}
      ]
    }
  ]
}
```

**Response top-level fields:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Provider name |
| `device` | object | `{id, name, type}` describing the device |
| `conditions` | CapabilityDescriptor[] | Supported conditions, narrowed where applicable |
| `actions` | CapabilityDescriptor[] | Supported actions, narrowed where applicable |

**Error responses:**

| Status | Description |
|--------|-------------|
| `401` | Missing or invalid authentication |
| `404` | Unknown provider, `system` provider, or unknown `device_id` for the given provider |
| `503` | Provider registered but caches not yet populated — retry shortly |

**curl:**

```bash
curl https://pdupun8zpr7exw43.myfritz.net/api/v1/capabilities/hue/12345 \
  -H "X-API-Key: ${API_KEY}"
```

---

## Real-Time Execution Events (WebSocket)

Every rule execution — both engine-driven edge triggers (`trigger_source="auto"`) and manual `POST /trigger` calls (`trigger_source="manual"`) — is pushed in real time on the `automations` WebSocket topic, so a frontend can render live execution feedback without polling `/history`. The engine broadcasts on every DB-write branch (success, failure, partial_failure, skipped, condition_not_met) and the manual-trigger endpoint broadcasts BEFORE returning the HTTP response.

Subscribe to the topic after `ws.accept()`:

```json
{"action": "subscribe", "topic": "automations"}
```

See [Automations WebSocket topic](./websocket.md#automations) for the full contract, connection URL, and all 5 event payload shapes.

---

## TypeScript Interfaces

> **Authoritative source:** [`docs/api/automations.types.ts`](./automations.types.ts) — a single self-contained file with every interface (44 exports) matching `api/automations/models.py` field-for-field. Import it directly from a frontend project to get full type safety for every automation payload and response on this page.
>
> For `PaginatedResponse<T>`, see [common.md](./common.md#typescript-interfaces).

The file exports (among others):

- Discriminated unions: `TriggerType` (5 variants), `ConditionNode` (7 leaves + `AndNode` / `OrNode`), `ActionItem` (11 variants)
- Top-level DTOs: `AutomationRule`, `AutomationRuleCreate`, `AutomationRulePatch`
- Response shapes: `TriggerResponse`, `EvaluateResponse`, `TraceNode`, `ManualActionResult`, `AutomationExecution` (aliased as `ExecutionLogEntry`)
- Capabilities + WebSocket types consumed by the `/capabilities` and `automations` topic

Key facts (so you can sketch against the file without opening it):

- **`AutomationRule.actions`** is `ActionItem[]` (array, min length 1 on create) — never a single object
- **`AutomationRuleCreate.trigger`** is optional (rule fires only via `/trigger` when absent)
- **`AutomationRuleCreate.condition`** is required (use `{ type: "always_true" }` for no-op)
- **`AndNode` / `OrNode`** children are exposed on a `conditions: ConditionNode[]` field (not `children`)
- **Discriminator** is always the string literal `type` — matches the Python `Literal[...]` exactly

---

## Frontend Component Suggestions

**CRUD Rules** (GET /rules, GET /rules/{id}, POST, PUT, DELETE)
- **Table** -- map `rules[]` to rows; columns: name, trigger_type, enabled (Badge: green if true, gray if false), last_executed, created_at. Sortable by name and enabled status. Per D-10 (list endpoint).
- **Modal Form** -- create/edit rule with fields: name (text), description (textarea), trigger (nested selector for type + config), conditions (list builder), actions (list builder with action type selector), enabled (Toggle). Per D-15 (CRUD write).
- **ConfirmDialog** -- delete confirmation showing rule name. Per D-15 (CRUD write).

**Execution History** (GET /automations/{rule_id}/history)
- **Table** -- map `items[]` to paginated rows; columns: triggered_at, status (Badge: success -> green, failure -> red, partial_failure -> orange, skipped -> gray, condition_not_met -> blue), error_message, trigger_snapshot JSON. Per D-10 (list endpoint).
