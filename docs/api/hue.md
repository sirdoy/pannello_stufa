# Hue Provider API

**Base path:** `/api/v1/hue`

Philips Hue lighting API covering Bridge health, light and group state, scene management, light control, and history -- 10 endpoints. Read endpoints serve from local cache populated by 30-second background polling of the Hue Bridge v1 (CLIP v1). Control endpoints proxy directly to the Bridge.

All endpoints require authentication via JWT Bearer token or API Key (`X-API-Key` header). See [Authentication](./README.md#authentication) for details.

---

## Quick Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/hue/health` | Bridge connectivity, firmware version, and cache freshness |
| `GET` | `/api/v1/hue/lights` | List all lights with state, capability tier, and room info |
| `GET` | `/api/v1/hue/lights/{light_id}` | Get single light state by Bridge ID |
| `GET` | `/api/v1/hue/groups` | List all groups (rooms, zones) with member lights |
| `GET` | `/api/v1/hue/groups/{group_id}` | Get single group state by Bridge ID |
| `GET` | `/api/v1/hue/scenes` | List all scenes, optionally filtered by group |
| `POST` | `/api/v1/hue/groups/{group_id}/scenes/{scene_id}` | Activate a scene for a group |
| `PUT` | `/api/v1/hue/lights/{light_id}/state` | Control a single light (on/off, brightness, color) |
| `PUT` | `/api/v1/hue/groups/{group_id}/action` | Apply action to all lights in a group |
| `GET` | `/api/v1/hue/history` | Paginated light state history with auto-granularity |

---

## Table of Contents

- [Health](#health)
  - [GET /health](#get-health)
- [Read Endpoints](#read-endpoints)
  - [GET /lights](#get-lights)
  - [GET /lights/{light_id}](#get-lightslight_id)
  - [GET /groups](#get-groups)
  - [GET /groups/{group_id}](#get-groupsgroup_id)
- [Scenes](#scenes)
  - [GET /scenes](#get-scenes)
  - [POST /groups/{group_id}/scenes/{scene_id}](#post-groupsgroup_idscenessscene_id)

- [Control Endpoints](#control-endpoints)
  - [Polling After Commands](#polling-after-commands)
  - [PUT /lights/{light_id}/state](#put-lightslight_idstate)
  - [PUT /groups/{group_id}/action](#put-groupsgroup_idaction)
- [History](#history)
  - [GET /history](#get-history)
- [Bridge Setup Guide](#bridge-setup-guide)
- [Next.js Fetch Snippets](#nextjs-fetch-snippets)
- [Field Verification Status](#field-verification-status)
- [Common Patterns](#common-patterns)

---

## Health

### GET /health

Returns Hue Bridge connectivity status, firmware version, light count, and cache freshness. Never calls the Bridge directly -- reads from in-memory cache only.

**Authentication:** Required (JWT Bearer or API Key)

**`data_freshness` values:**

| Value | Meaning |
|-------|---------|
| `LIVE` | Last successful poll within 90 seconds (3x the 30s polling interval) |
| `STALE` | Data older than 90 seconds -- available but may not reflect current state |
| `UNREACHABLE` | Bridge persistently unreachable -- triggers HTTP 503, never appears in JSON response body |

**Response (200):**

```json
{
  "connected": true,
  "firmware_version": "1.60.1960144080",
  "api_version": "1.60.0",
  "light_count": 8,
  "data_freshness": "LIVE",
  "last_poll_at": "2026-03-19T08:51:32+00:00",
  "last_success_at": "2026-03-19T08:51:32+00:00"
}
```

```typescript
// Source: api/providers/hue/routes.py — HueHealthResponse
interface HueBridgeHealth {
  connected: boolean;
  firmware_version: string | null;
  api_version: string | null;
  light_count: number;
  data_freshness: "LIVE" | "STALE"; // UNREACHABLE triggers 503 — never in response body
  last_poll_at: string | null;      // ISO 8601
  last_success_at: string | null;   // ISO 8601
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/hue/health \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `503 Service Unavailable` | Bridge is UNREACHABLE (3+ consecutive poll failures) |

---

## Read Endpoints

All read endpoints serve from the in-memory cache populated by 30-second background polling of the Hue Bridge. `STALE` freshness returns HTTP **200** (not 503) -- the dashboard degrades gracefully. Only `UNREACHABLE` (3+ consecutive failures) returns 503.

---

### GET /lights

Returns all Hue lights with state, capability tier, derived `ct_kelvin`, and room enrichment.

**Authentication:** Required (JWT Bearer or API Key)

**Response (200):**

```json
[
  {
    "light_id": "1",
    "name": "Bedside Lamp",
    "on": true,
    "brightness": 200,
    "ct_mirek": 370,
    "ct_kelvin": 2703,
    "hue": null,
    "saturation": null,
    "colormode": "ct",
    "reachable": true,
    "capability_tier": "ambiance",
    "room_id": "2",
    "room_name": "Bedroom",
    "model_id": "LTC001",
    "light_type": "Color temperature light"
  },
  {
    "light_id": "5",
    "name": "Living Room Strip",
    "on": false,
    "brightness": 100,
    "ct_mirek": 300,
    "ct_kelvin": 3333,
    "hue": 12345,
    "saturation": 200,
    "colormode": "hs",
    "reachable": true,
    "capability_tier": "color",
    "room_id": "1",
    "room_name": "Living Room",
    "model_id": "LST002",
    "light_type": "Extended color light"
  }
]
```

```typescript
// Source: api/providers/hue/routes.py — HueLightStateResponse
interface HueLight {
  light_id: string;                           // Bridge string key e.g. "1", "5"
  name: string;
  on: boolean;
  brightness: number | null;                  // 0-254
  ct_mirek: number | null;                    // 153-500
  ct_kelvin: number | null;                   // derived: round(1_000_000 / ct_mirek)
  hue: number | null;                         // 0-65535
  saturation: number | null;                  // 0-254
  colormode: "ct" | "hs" | "xy" | null;
  reachable: boolean;
  capability_tier: "white" | "ambiance" | "color";
  room_id: string | null;
  room_name: string | null;
  model_id: string | null;
  light_type: string | null;                  // e.g. "Extended color light"
}
```

**Capability tier values:**

| Tier | Bridge Light Type | Capabilities |
|------|------------------|--------------|
| `white` | Dimmable light | On/off, brightness only |
| `ambiance` | Color temperature light | On/off, brightness, color temperature |
| `color` | Extended color light | On/off, brightness, color temperature, hue/saturation, effects |

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/hue/lights \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `503 Service Unavailable` | Bridge UNREACHABLE, or light data not yet available (first boot) |

---

### GET /lights/{light_id}

Returns the current state of a single Hue light by its Bridge-assigned string ID.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `light_id` | string | Bridge-assigned string key (e.g. `"1"`, `"5"`) |

**Response (200):** Same shape as a single item from `GET /lights`.

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/hue/lights/1 \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | `light_id` not found in cache |
| `503 Service Unavailable` | Bridge UNREACHABLE or light data not yet available |

---

### GET /groups

Returns all Hue groups (rooms, zones) with member light IDs and current action state.

**Authentication:** Required (JWT Bearer or API Key)

**Response (200):**

```json
[
  {
    "group_id": "1",
    "name": "Living Room",
    "type": "Room",
    "group_class": "Living room",
    "lights": ["5", "6", "7"],
    "any_on": true,
    "all_on": false,
    "brightness": 200,
    "color_temp": 370,
    "colormode": "ct"
  },
  {
    "group_id": "2",
    "name": "Bedroom",
    "type": "Room",
    "group_class": "Bedroom",
    "lights": ["1", "2"],
    "any_on": false,
    "all_on": false,
    "brightness": null,
    "color_temp": null,
    "colormode": null
  }
]
```

```typescript
// Source: api/providers/hue/routes.py — HueGroupResponse
interface HueGroup {
  group_id: string;
  name: string;
  type: string | null;          // "Room", "Zone", "LightGroup", etc.
  group_class: string | null;   // "Living room", "Kitchen", "Bedroom", etc.
  lights: string[];             // member light IDs
  any_on: boolean;
  all_on: boolean;
  brightness: number | null;    // 0-254 (group action state)
  color_temp: number | null;    // mirek (group action state)
  colormode: string | null;
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/hue/groups \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `503 Service Unavailable` | Bridge UNREACHABLE or group data not yet available |

---

### GET /groups/{group_id}

Returns a single Hue group by its Bridge-assigned string ID.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `group_id` | string | Bridge-assigned string key (e.g. `"1"`, `"3"`) |

**Response (200):** Same shape as a single item from `GET /groups`.

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/hue/groups/1 \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | `group_id` not found in cache |
| `503 Service Unavailable` | Bridge UNREACHABLE or group data not yet available |

---

## Scenes

### GET /scenes

Returns all Hue scenes from cache, optionally filtered to a single group. Scene cache refreshes every 5 minutes (not just startup) to catch scenes deleted via the Hue app.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `group_id` | string | none | Filter scenes to a specific group ID |

**Response (200):**

```json
[
  {
    "scene_id": "Ab1Cd2Ef3G",
    "name": "Relax",
    "group_id": "1",
    "group_name": "Living Room",
    "lights": ["5", "6", "7"],
    "type": "GroupScene"
  },
  {
    "scene_id": "Xy9Wz8Vt7U",
    "name": "Concentrate",
    "group_id": "1",
    "group_name": "Living Room",
    "lights": ["5", "6"],
    "type": "GroupScene"
  }
]
```

```typescript
// Source: api/providers/hue/routes.py — HueSceneResponse
interface HueScene {
  scene_id: string;
  name: string;
  group_id: string;
  group_name: string | null;
  lights: string[];
  type: string | null;  // e.g. "GroupScene"
}
```

**curl:**

```bash
# All scenes
curl YOUR_BASE_URL/api/v1/hue/scenes \
  -H "X-API-Key: YOUR_API_KEY"

# Scenes for group "1" only
curl "YOUR_BASE_URL/api/v1/hue/scenes?group_id=1" \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `503 Service Unavailable` | Bridge UNREACHABLE or scene data not yet available |

---

### POST /groups/{group_id}/scenes/{scene_id}

Activates a scene for a group on the Bridge. The path pattern is non-obvious: the `scene_id` is embedded under the group path, not under `/scenes/`. Scene ownership is validated from cache before forwarding to the Bridge.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `group_id` | string | Bridge group ID the scene belongs to |
| `scene_id` | string | Bridge scene ID to activate |

**Request body:** None

**Response (202):**

```json
{
  "command": "activate_scene",
  "status": "accepted",
  "group_id": "1",
  "scene_id": "Ab1Cd2Ef3G",
  "suggested_poll_delay_s": 2,
  "poll_endpoint": "/api/v1/hue/groups/1"
}
```

After `suggested_poll_delay_s` seconds, poll the `poll_endpoint` to read the updated group state.

**curl:**

```bash
curl -X POST YOUR_BASE_URL/api/v1/hue/groups/1/scenes/Ab1Cd2Ef3G \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | `group_id` not found, or `scene_id` not found / does not belong to this group |
| `502 Bad Gateway` | Bridge returned an API error |
| `503 Service Unavailable` | Bridge UNREACHABLE or client not initialized |
| `504 Gateway Timeout` | Bridge request timed out |

---

## Control Endpoints

### Polling After Commands

Hue light transitions are fast (typically <1 second) but the Bridge processes commands asynchronously. All control endpoints return **202 Accepted** immediately with a fire-and-forget pattern and include a `suggested_poll_delay_s` hint.

After sending a command, wait `suggested_poll_delay_s` seconds then poll the `poll_endpoint` to read the updated state. Color and effect transitions may take slightly longer to complete.

---

### PUT /lights/{light_id}/state

Controls a single Hue light: on/off, brightness, color temperature, hue/saturation, effects, or alerts. Checks Bridge reachability (503) and per-light reachability (409) before forwarding.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `light_id` | string | Bridge-assigned string light ID (e.g. `"1"`, `"5"`) |

**Request body:** At least one field required -- 422 if all fields are omitted.

```json
{
  "on": true,
  "bri": 200,
  "ct": 370
}
```

```typescript
// Source: api/providers/hue/routes.py — HueLightStateRequest
// Used for both PUT /lights/{id}/state and PUT /groups/{id}/action
interface HueLightStateRequest {
  on?: boolean;
  bri?: number;                     // 0-254 (Bridge native range)
  ct?: number;                      // 153-500 mirek (153=cool/6500K, 500=warm/2000K)
  hue?: number;                     // 0-65535 (activates colormode "hs" automatically)
  sat?: number;                     // 0-254 (activates colormode "hs" automatically)
  effect?: "none" | "colorloop";    // "colorloop" for continuous color cycle
  alert?: "none" | "select" | "lselect"; // "select"=single flash, "lselect"=15s cycle
  // At least one field required -- 422 if all omitted
}
```

**Response (202):**

```json
{
  "command": "set_light_state",
  "status": "accepted",
  "light_id": "1",
  "requested_state": {
    "on": true,
    "bri": 200,
    "ct": 370
  },
  "suggested_poll_delay_s": 2,
  "poll_endpoint": "/api/v1/hue/lights/1"
}
```

**curl examples:**

```bash
# Turn on
curl -X PUT YOUR_BASE_URL/api/v1/hue/lights/1/state \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"on": true}'

# Turn off
curl -X PUT YOUR_BASE_URL/api/v1/hue/lights/1/state \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"on": false}'

# Set brightness to 50% (~127/254)
curl -X PUT YOUR_BASE_URL/api/v1/hue/lights/1/state \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"bri": 127}'

# Set warm white color temperature (2700K = 370 mirek)
curl -X PUT YOUR_BASE_URL/api/v1/hue/lights/1/state \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"ct": 370}'

# Set color (hue/saturation -- color lights only)
curl -X PUT YOUR_BASE_URL/api/v1/hue/lights/5/state \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"hue": 10000, "sat": 200, "bri": 200}'

# Enable colorloop effect
curl -X PUT YOUR_BASE_URL/api/v1/hue/lights/5/state \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"effect": "colorloop"}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | `light_id` not found in cache |
| `409 Conflict` | Light is unreachable (last poll shows `reachable: false`) -- command not forwarded |
| `422 Unprocessable Entity` | Empty request body, or field value outside valid range |
| `502 Bad Gateway` | Bridge returned an API error |
| `503 Service Unavailable` | Bridge UNREACHABLE or light data not yet available |
| `504 Gateway Timeout` | Bridge request timed out |

**409 Conflict response body:**

```json
{
  "detail": {
    "error": "light_unreachable",
    "light_id": "5",
    "message": "Light 5 is unreachable \u2014 command not forwarded"
  }
}
```

> **Note:** 409 is only returned for per-light control. Group actions do NOT return 409 -- see `PUT /groups/{id}/action`.

---

### PUT /groups/{group_id}/action

Applies on/off, brightness, color temperature, or color to all lights in a group simultaneously. Does NOT check per-light reachability -- the Bridge applies the command to all reachable group members and silently ignores unreachable ones.

**Authentication:** Required (JWT Bearer or API Key)

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `group_id` | string | Bridge-assigned string group ID (e.g. `"1"`, `"3"`) |

**Request body:** Same `HueLightStateRequest` shape as `PUT /lights/{id}/state` above. At least one field required.

**Response (202):**

```json
{
  "command": "set_group_action",
  "status": "accepted",
  "group_id": "1",
  "requested_state": {
    "on": true,
    "bri": 200
  },
  "suggested_poll_delay_s": 2,
  "poll_endpoint": "/api/v1/hue/groups/1"
}
```

**curl examples:**

```bash
# Turn on all lights in group 1
curl -X PUT YOUR_BASE_URL/api/v1/hue/groups/1/action \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"on": true}'

# Set group to warm white at 80% brightness
curl -X PUT YOUR_BASE_URL/api/v1/hue/groups/1/action \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"on": true, "bri": 204, "ct": 370}'
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404 Not Found` | `group_id` not found in cache |
| `422 Unprocessable Entity` | Empty request body, or field value outside valid range |
| `502 Bad Gateway` | Bridge returned an API error |
| `503 Service Unavailable` | Bridge UNREACHABLE or group data not yet available |
| `504 Gateway Timeout` | Bridge request timed out |

> **Note:** No 409 for group actions. Partially-unreachable groups are valid -- reachable members receive the command.

---

## History

### GET /history

Returns paginated Hue light state history with automatic granularity selection. Granularity is resolved from the requested time window -- no manual `scale` parameter needed.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `from` | integer | none | Unix epoch start timestamp (inclusive) |
| `to` | integer | none | Unix epoch end timestamp (exclusive) |
| `light_id` | string | none | Filter to a single light's history |
| `page` | integer | `1` | Page number (1-based) |
| `page_size` | integer | `100` | Items per page (1-1000) |

> **Important:** Query params are `from` and `to` (not `from_ts`/`to_ts`). These are the FastAPI Query aliases that appear in the actual URL.

#### Auto-Granularity

| Time Window | Granularity | Data Source |
|-------------|-------------|-------------|
| <= 48 hours | `raw` | Per-poll per-light readings (~30s interval) |
| <= 30 days | `hourly` | Hourly aggregations per light |
| > 30 days | `daily` | Daily aggregations per light |
| No params (unbounded) | `daily` | Window = now - 0 = very large |

**Response (200 -- raw tier example):**

```json
{
  "items": [
    {
      "timestamp": 1773780000,
      "light_id": "1",
      "granularity": "raw",
      "light_name": "Bedside Lamp",
      "on_state": 1,
      "brightness": 200,
      "color_temp": 370,
      "hue": null,
      "saturation": null,
      "colormode": "ct",
      "reachable": 1,
      "avg_brightness": null,
      "min_brightness": null,
      "max_brightness": null,
      "on_minutes": null,
      "sample_count": null
    }
  ],
  "total": 2880,
  "page": 1,
  "page_size": 100,
  "granularity": "raw",
  "from": 1773693600,
  "to": 1773780000
}
```

**Response (200 -- hourly tier example):**

```json
{
  "items": [
    {
      "timestamp": 1773777600,
      "light_id": "1",
      "granularity": "hourly",
      "light_name": null,
      "on_state": null,
      "brightness": null,
      "color_temp": null,
      "hue": null,
      "saturation": null,
      "colormode": null,
      "reachable": null,
      "avg_brightness": 185.3,
      "min_brightness": 100,
      "max_brightness": 254,
      "on_minutes": 45,
      "sample_count": 120
    }
  ],
  "total": 672,
  "page": 1,
  "page_size": 100,
  "granularity": "hourly",
  "from": 1773177600,
  "to": 1773780000
}
```

**Field availability by granularity tier:**

| Field | raw | hourly | daily |
|-------|-----|--------|-------|
| `timestamp` | epoch int (poll time) | epoch int (hour start) | epoch int (day start) |
| `light_id` | populated | populated | populated |
| `granularity` | `"raw"` | `"hourly"` | `"daily"` |
| `light_name` | populated | null | null |
| `on_state` | 0 or 1 (integer) | null | null |
| `brightness` | 0-254 or null | null | null |
| `color_temp` | mirek or null | null | null |
| `hue` | 0-65535 or null | null | null |
| `saturation` | 0-254 or null | null | null |
| `colormode` | string or null | null | null |
| `reachable` | 0 or 1 (integer) | null | null |
| `avg_brightness` | null | float or null | float or null |
| `min_brightness` | null | int or null | int or null |
| `max_brightness` | null | int or null | int or null |
| `on_minutes` | null | int or null | int or null |
| `sample_count` | null | int or null | int or null |

> **Note:** `on_state` and `reachable` are integers (0 or 1), not booleans. SQLite stores them as integers; the Pydantic model declares `Optional[int]`. This differs from `HueLight.reachable` which is a boolean on live light endpoints.

```typescript
// Source: api/providers/hue/routes.py — HueHistoryItem
interface HueHistoryItem {
  timestamp: number;          // Unix epoch int
  light_id: string;
  granularity: "raw" | "hourly" | "daily";

  // Raw tier only (null for hourly/daily)
  light_name: string | null;
  on_state: number | null;    // 0 or 1 (integer, NOT boolean)
  brightness: number | null;  // 0-254
  color_temp: number | null;  // mirek
  hue: number | null;
  saturation: number | null;
  colormode: string | null;
  reachable: number | null;   // 0 or 1 (integer, NOT boolean)

  // Aggregated tiers only (null for raw)
  avg_brightness: number | null;
  min_brightness: number | null;
  max_brightness: number | null;
  on_minutes: number | null;
  sample_count: number | null;
}

// Source: api/providers/hue/routes.py — HueHistoryResponse
interface HueHistoryResponse {
  items: HueHistoryItem[];
  total: number;
  page: number;
  page_size: number;
  granularity: "raw" | "hourly" | "daily";
  from: number | null;   // Unix epoch (serialization_alias on from_ts field)
  to: number | null;     // Unix epoch (serialization_alias on to_ts field)
}
```

**curl examples:**

```bash
# Last 24 hours -- auto-selects raw tier (<=48h window)
curl "YOUR_BASE_URL/api/v1/hue/history?from=1773693600&to=1773780000" \
  -H "X-API-Key: YOUR_API_KEY"

# Last 7 days -- auto-selects hourly tier (<=30d window)
curl "YOUR_BASE_URL/api/v1/hue/history?from=1773177600" \
  -H "X-API-Key: YOUR_API_KEY"

# No params -- auto-selects daily tier (unbounded window)
curl YOUR_BASE_URL/api/v1/hue/history \
  -H "X-API-Key: YOUR_API_KEY"

# Single light history, last 24h
curl "YOUR_BASE_URL/api/v1/hue/history?from=1773693600&light_id=1" \
  -H "X-API-Key: YOUR_API_KEY"

# Paginate: page 2 with 50 items
curl "YOUR_BASE_URL/api/v1/hue/history?page=2&page_size=50" \
  -H "X-API-Key: YOUR_API_KEY"
```

**Error responses:**

History has no error conditions beyond authentication -- 503 is not returned by this endpoint.

---

## Bridge Setup Guide

> **Authoritative guide:** For the complete step-by-step provisioning procedure, see [docs/HUE_SETUP.md](../HUE_SETUP.md). The section below is a quick reference.

### Prerequisites

- Philips Hue Bridge v1 connected to your local LAN
- Bridge IP address (find it in the Hue app under Settings > My Hue system, e.g. `192.168.178.162`)
- SSH access to the Raspberry Pi at `192.168.178.50`

### Step 1: Obtain HUE_USERNAME via Link Button

Press the physical link button on top of the Hue Bridge, then within 30 seconds run:

```bash
curl -X POST http://<BRIDGE_IP>/api \
  -H "Content-Type: application/json" \
  -d '{"devicetype": "homeassistant#pi5"}'
```

**Success response:**

```json
[{"success": {"username": "aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890abcd"}}]
```

**Failure response (link button not pressed or 30s window expired):**

```json
[{"error": {"type": 101, "address": "", "description": "link button not pressed"}}]
```

If you see the failure response, press the link button again and re-run the curl command immediately.

### Step 2: Configure `.secrets.toml`

Add the credentials to the Pi's secrets file at `/home/pi/HomeAssistant/.secrets.toml`:

```toml
HUE_BRIDGE_HOST = "192.168.178.162"
HUE_USERNAME = "aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890abcd"
```

Replace with your actual Bridge IP and the username from Step 1.

### Step 3: Restart the Service

```bash
ssh pi@192.168.178.50
sudo systemctl restart homeassistant.service
```

### Step 4: Verify Connectivity

```bash
curl YOUR_BASE_URL/api/v1/hue/health \
  -H "X-API-Key: YOUR_API_KEY"
```

Expected response when working correctly:

```json
{
  "connected": true,
  "data_freshness": "LIVE",
  ...
}
```

### Troubleshooting FAQ

**Bridge not found on network:**
- Verify Bridge IP using the Hue app: Settings > My Hue system > My Bridge > About
- Confirm the Bridge is on the same LAN subnet as the Pi
- Check that `HUE_BRIDGE_HOST` in `.secrets.toml` is correct

**Link button timeout:**
- The pairing window is exactly 30 seconds after pressing the button
- Press the button again and run the curl command immediately -- do not wait
- The Bridge LED pulses during the pairing window

**Invalid or expired username:**
- Repeating the provisioning process creates a new username -- old ones remain valid
- Multiple usernames can coexist; update `.secrets.toml` with the newest one
- If `GET /health` returns 503, check logs: `sudo journalctl -u homeassistant.service -n 50`

---

## Frontend Component Suggestions

| Endpoint Group | Component | Data Mapping | Usage Hint |
|----------------|-----------|--------------|------------|
| Health | StatusBadge + StatCards | `status` -> badge color; `light_count`, `group_count`, `last_poll_at` -> stat cards | Show `data_freshness` as color indicator: green if fresh, yellow if stale |
| Read: Lights | Table | `lights[]` -> rows; columns: name, type, on (Badge), brightness, color_temp, reachable (StatusBadge) | Sortable by room grouping; use green/gray Badge for on/off state |
| Read: Groups and Scenes | CardGrid + List | Groups: one card per group showing name, light_count, all_on/any_on badges. Scenes: list with name and activate button | CardGrid for room/zone groups; scene list within each group card |
| Control: Lights and Groups | Toggle + Slider | on/off -> Toggle. Brightness -> Slider (0-254). Color temperature -> Slider (153-500 mirek). IMPORTANT: show current light state before allowing toggle; poll after sending command to confirm state change took effect. Per D-14 | Confirm state change visually -- re-fetch light state 1s after command |
| Historical Data | LineChart | `data_points[]` -> time series; x-axis: timestamp, y-axis: metric value | API returns auto-granularity data -- chart must handle variable time intervals. Use pagination controls for large datasets |

---

## Next.js Fetch Snippets

All snippets use the `X-API-Key` header for server-to-server authentication from a Next.js backend.

### Read: Get All Lights

```typescript
const res = await fetch(`${process.env.API_BASE_URL}/api/v1/hue/lights`, {
  headers: { "X-API-Key": process.env.API_KEY! },
});
if (!res.ok) throw new Error(`Hue lights error: ${res.status}`);
const lights = await res.json() as HueLight[];
```

### Control: Set Light State

```typescript
const body: HueLightStateRequest = { on: true, bri: 200, ct: 370 };

const res = await fetch(
  `${process.env.API_BASE_URL}/api/v1/hue/lights/${lightId}/state`,
  {
    method: "PUT",
    headers: {
      "X-API-Key": process.env.API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }
);

if (res.status === 409) {
  const err = await res.json();
  // err.detail.error === "light_unreachable"
  throw new Error(`Light unreachable: ${err.detail.message}`);
}
if (!res.ok) throw new Error(`Set light state error: ${res.status}`);

const result = await res.json() as {
  command: string;
  status: string;
  light_id: string;
  requested_state: Partial<HueLightStateRequest>;
  suggested_poll_delay_s: number;
  poll_endpoint: string;
};

// Wait then poll for updated state
await new Promise((r) => setTimeout(r, result.suggested_poll_delay_s * 1000));
const updated = await fetch(
  `${process.env.API_BASE_URL}${result.poll_endpoint}`,
  { headers: { "X-API-Key": process.env.API_KEY! } }
);
const updatedLight = await updated.json() as HueLight;
```

### Scenes: List and Activate

```typescript
// List scenes for a group
const res = await fetch(
  `${process.env.API_BASE_URL}/api/v1/hue/scenes?group_id=${groupId}`,
  { headers: { "X-API-Key": process.env.API_KEY! } }
);
if (!res.ok) throw new Error(`Hue scenes error: ${res.status}`);
const scenes = await res.json() as HueScene[];

// Activate a scene
const activateRes = await fetch(
  `${process.env.API_BASE_URL}/api/v1/hue/groups/${groupId}/scenes/${sceneId}`,
  {
    method: "POST",
    headers: { "X-API-Key": process.env.API_KEY! },
  }
);
if (!activateRes.ok) throw new Error(`Activate scene error: ${activateRes.status}`);
const activation = await activateRes.json();
// activation.suggested_poll_delay_s and .poll_endpoint available for follow-up
```

### History: Query with Pagination

```typescript
const now = Math.floor(Date.now() / 1000);
const oneDayAgo = now - 86400;

const res = await fetch(
  `${process.env.API_BASE_URL}/api/v1/hue/history?from=${oneDayAgo}&to=${now}&page=1&page_size=100`,
  { headers: { "X-API-Key": process.env.API_KEY! } }
);
if (!res.ok) throw new Error(`Hue history error: ${res.status}`);
const history = await res.json() as HueHistoryResponse;

// history.granularity will be "raw" for a 24h window
// history.total gives total matching records for pagination
const totalPages = Math.ceil(history.total / history.page_size);
```

---

## Field Verification Status

> Last checked: 2026-03-19

| Field Group | Confidence | Source | Notes |
|-------------|------------|--------|-------|
| `HueBridgeHealth` fields (`connected`, `firmware_version`, `api_version`, `light_count`, `data_freshness`, `last_poll_at`, `last_success_at`) | HIGH | Extracted from `HueHealthResponse` Pydantic model in `routes.py` | VERIFIED 2026-03-19 -- all 7 fields match live response |
| `HueLight` fields (all 15 fields) | HIGH | Extracted from `HueLightStateResponse` Pydantic model in `routes.py` | VERIFIED 2026-03-19 -- 4 lights, all fields present including room enrichment; all 4 are `capability_tier: "color"` |
| `HueGroup` fields (all 10 fields) | HIGH | Extracted from `HueGroupResponse` Pydantic model in `routes.py` | VERIFIED 2026-03-19 -- 5 groups (1 Room, 1 Entertainment, 2 Zone types, 1 Room); `lights` field confirmed (not `light_ids`) |
| `HueScene` fields (all 6 fields) | HIGH | Extracted from `HueSceneResponse` Pydantic model in `routes.py` | VERIFIED 2026-03-19 -- 38 scenes across groups 1, 3, 4, 5; 1 scene has `group_id: "0"` (Hue special group) which is valid Bridge behavior |
| `HueLightStateRequest` fields (`on`, `bri`, `ct`, `hue`, `sat`, `effect`, `alert`) | HIGH | Extracted from `HueLightStateRequest` Pydantic model in `routes.py` | VERIFIED 2026-03-19 -- PUT bri=100 returned 202 accepted |
| 202 response bodies (control + scene endpoints) | HIGH | Extracted from `JSONResponse(content={...})` in route handlers | VERIFIED 2026-03-19 -- `command`, `status`, `light_id`, `requested_state`, `suggested_poll_delay_s`, `poll_endpoint` all present |
| `HueHistoryItem` raw fields (`on_state`, `reachable` as integer 0/1) | HIGH | Pydantic model `Optional[int]` + `database.py` `1 if state.get("on") else 0` | Integer not boolean -- verified in both model and DB layer |
| `HueHistoryResponse` `from`/`to` serialization alias | HIGH | `Field(None, serialization_alias="from")` in `HueHistoryResponse` | VERIFIED 2026-03-19 -- response uses `from`/`to` keys |
| Auto-granularity thresholds (48h raw, 30d hourly, >30d daily) | HIGH | `_resolve_hue_granularity()` in `routes.py` | VERIFIED 2026-03-19 -- defaults to daily when no range specified |
| 409 Conflict on light unreachable (only for PUT /lights/{id}/state) | HIGH | `_check_light_reachable_or_409()` in `routes.py` | All 4 lights reachable -- 409 path not testable without unreachable light |
| Capability tier map (`white`/`ambiance`/`color`) | HIGH | `CAPABILITY_TIER_MAP` in `constants.py` | VERIFIED 2026-03-19 -- all 4 lights returned `capability_tier: "color"` (all are Extended color light / LST002 / LCT015 / LCT001) |

**Live verification status:** VERIFIED 2026-03-19 -- Phase 75 formal verification complete. All 4 success criteria endpoints confirmed against live Bridge at 192.168.178.162. 4 lights, 5 groups, 38 scenes. Firmware 1976081000, API v1.76.0.

---

## Common Patterns

### Pagination (History Endpoint)

The history endpoint uses page/page_size pagination (not limit/offset like other API endpoints). Use `total` and `page_size` to compute total pages:

```typescript
const totalPages = Math.ceil(history.total / history.page_size);
```

Fetch subsequent pages by incrementing `page`. The `from`, `to`, and `light_id` parameters must be repeated on each page request -- they are not preserved server-side.

### Polling After Commands

Control endpoints (PUT /lights/{id}/state, PUT /groups/{id}/action, POST .../scenes/{id}) return 202 immediately. The response always includes:

- `suggested_poll_delay_s`: number of seconds to wait before polling (typically 2)
- `poll_endpoint`: URL path to poll for updated state

This fire-and-forget pattern avoids blocking on Bridge round-trips. Wait `suggested_poll_delay_s` seconds, then GET the `poll_endpoint` to confirm the new state.

### Data Freshness Handling

Read endpoints return 200 even when `data_freshness` is `STALE`. Clients should check the `data_freshness` field in the `/health` response and display a visual indicator when data is stale. Only `UNREACHABLE` (3+ consecutive poll failures) returns 503.

```typescript
const health = await res.json() as HueBridgeHealth;
if (health.data_freshness === "STALE") {
  // Show "may be outdated" indicator -- data is still available
}
// "UNREACHABLE" is never in the response body -- it produces a 503 HTTP status
```

### Handling Unreachable Lights

Before sending a PUT /lights/{id}/state command, check `reachable` in the light state. If `reachable` is false, the API returns 409 Conflict with `error: "light_unreachable"`. Group actions (PUT /groups/{id}/action) do not return 409 -- unreachable members are silently skipped by the Bridge.
