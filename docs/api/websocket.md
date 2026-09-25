# WebSocket Real-Time API

Single endpoint for real-time push from all providers. The server sends data immediately when provider state changes — no polling required. Authentication is required via query parameter. Subscriptions are topic-based and per-connection.

---

## Quick Reference

| Protocol | Path | Description | Auth |
|----------|------|-------------|------|
| `wss://` | `/ws/live` | Real-time provider data push via topic subscription | Required (`?api_key=` or `?token=`) |

**Available topics:** `fritzbox`, `dirigera`, `netatmo`, `thermorossi`, `tuya`, `hue`, `sonos`, `raspi`, `scheduler`, `sonos_transport`, `sonos_volume`, `sonos_topology`, `automations`

> **Push-only topics (no snapshot on subscribe):** `sonos_transport`, `sonos_volume`, `sonos_topology`, `automations` — `_get_snapshot()` has no branch for them. `sonos_transport` and `sonos_volume` are pushed both after Sonos mutations and by the 30 s Sonos poller whenever a zone's playback / a speaker's volume changes (including changes made from the Sonos app); `sonos_topology` only after join/unjoin/source mutations; `automations` on automation executions. Subscribe to receive future pushes; no immediate snapshot is delivered.

---

## Table of Contents

- [Overview](#overview)
- [Endpoint](#endpoint)
- [Authentication](#authentication)
- [Connection Lifecycle](#connection-lifecycle)
- [Message Protocol](#message-protocol)
- [Event Format](#event-format)
- [Topics and Payload Interfaces](#topics-and-payload-interfaces)
  - [fritzbox](#fritzbox)
  - [dirigera](#dirigera)
  - [netatmo](#netatmo)
  - [thermorossi](#thermorossi)
  - [tuya](#tuya)
  - [hue](#hue)
  - [sonos](#sonos)
  - [sonos_transport](#sonos_transport)
  - [sonos_volume](#sonos_volume)
  - [sonos_topology](#sonos_topology)
  - [raspi](#raspi)
  - [scheduler](#scheduler)
  - [automations](#automations)
- [Reconnection](#reconnection)
- [Complete Example](#complete-example)
- [Error Codes / Close Codes](#error-codes--close-codes)

---

## Overview

The `/ws/live` endpoint replaces REST polling for all providers. Key behaviours:

- **Delta detection:** The server only pushes when provider data changes (MD5 fingerprint comparison). If the router returns the same device list twice in a row, no WebSocket message is sent.
- **Snapshot on subscribe:** When you subscribe to a topic, the server immediately sends the current cached state (`type: "snapshot"`). You do not have to wait for the next poll cycle.
- **Topic-based subscription:** A single connection can subscribe to any combination of the 13 topics. Each subscription is independent.
- **Per-connection subscriptions:** Subscriptions are not persisted. If the connection drops and reconnects, you must re-subscribe. Always send subscribe messages inside the `onOpen` callback.

---

## Endpoint

| Environment | URL |
|-------------|-----|
| Production | `wss://pdupun8zpr7exw43.myfritz.net/ws/live` |
| Local dev | `ws://localhost:8000/ws/live` |

**Template:**

```
wss://YOUR_BASE_URL_HOST/ws/live?api_key=YOUR_API_KEY
```

Replace `YOUR_BASE_URL_HOST` with the hostname only (no `https://` prefix). See the [Authentication](#authentication) section for JWT URL construction.

---

## Authentication

Authentication is provided via URL query parameters. The WebSocket browser API does not support custom headers on the initial handshake — query parameters are the only supported method.

| Method | Query Parameter | Example |
|--------|----------------|---------|
| API Key | `?api_key=ha_live_...` | `wss://host/ws/live?api_key=ha_live_abc123...` |
| JWT Token | `?token=eyJ...` | `wss://host/ws/live?token=eyJhbGci...` |
| User WS token (browsers) | `?token=eyJ...` | 60 s token from `POST /auth/ws-token` (JWT `typ: "ws"`, active user) |

Credentials are validated before the connection is accepted. An invalid or missing credential results in close code `1008`.

**How to get credentials:** See [Authentication](./auth.md) for API key creation (`POST /auth/api-keys`), JWT login (`POST /auth/login`) and user WS tokens (`POST /auth/ws-token`).

**Browsers (Pannello Stufa):** the Next.js server calls `POST /auth/ws-token` for the logged-in user and hands the
token to the page, which connects with `?token=`. A new token is requested for every (re)connect; it is checked
only at connect time, so an open connection outlives the token's 60 s.

> **Security note:** `?api_key=` in the URL appears in server access logs, browser history, and network inspector tabs. Use short-lived **JWT tokens** for browser-side Next.js clients. Reserve API keys for server-side Next.js route handlers where the URL is not exposed to the browser.

---

## Connection Lifecycle

1. Client opens a WebSocket connection with auth query parameter.
2. Server validates credentials. On failure, accepts the connection then immediately closes with code `1008`.
3. If the server is already at `MAX_CONNECTIONS = 10`, it accepts the connection then closes with code `1013`.
4. If accepted, a per-connection `asyncio.Queue(maxsize=10)` is created. When the queue is full (slow consumer), the oldest pending message is dropped to make room for new events.
5. Client sends `subscribe` messages for the topics it needs.
6. Server sends a `snapshot` message immediately for each subscribed topic (if cache is populated).
7. Server sends `event` messages whenever provider data changes.

**Heartbeat:** there is no application-level ping/pong message. Keep-alive is done with WebSocket protocol `ping` frames by **Uvicorn**, configured on the command line of the production systemd unit (`deploy/systemd/homeassistant.service`: `--ws-ping-interval 30 --ws-ping-timeout 10`, asserted by `tests/test_ws_manager.py::test_systemd_service_has_ping_flags`). In production the server pings every **30 s** and drops the connection if no `pong` arrives within **10 s**. When the app is started with `python main.py` (local dev), `uvicorn.run()` does not pass these options, so Uvicorn's defaults apply (20 s / 20 s). Browsers and react-use-websocket answer protocol pings automatically; clients must not send `{"action": "ping"}` (unknown actions are ignored, no reply). Nginx keeps idle `/ws/` upgrades open for up to `proxy_read_timeout 3600s`.

**Send timeout:** Each message write has a **5-second** timeout (`asyncio.wait_for(ws.send_json(...), 5.0)`). If a write fails or times out, the server closes the socket with code **`1011`** (so the client sees the drop and can reconnect) and unregisters the connection.

> **Warning — Max 10 concurrent connections (code 1013):** The server accepts only 10 simultaneous WebSocket connections. In Next.js development mode, React StrictMode double-invokes effects and hot reload can create a stale connection that hasn't closed yet when the new connection attempts to open. If you get immediate disconnections in dev, check browser DevTools for close code `1013`. Use one browser tab at a time during development.

---

## Message Protocol

All messages are JSON objects. The client sends action messages; the server sends event/snapshot messages.

### Client → Server

**Subscribe to a topic:**

```json
{"action": "subscribe", "topic": "fritzbox"}
```

**Unsubscribe from a topic:**

```json
{"action": "unsubscribe", "topic": "fritzbox"}
```

**Valid topic values:** `fritzbox`, `dirigera`, `netatmo`, `thermorossi`, `tuya`, `hue`, `sonos`, `raspi`, `scheduler`, `sonos_transport`, `sonos_volume`, `sonos_topology`, `automations`

On subscribe, the server immediately sends a `snapshot` message for the requested topic (if the cache is populated). Subsequent `event` messages arrive whenever the provider's data changes.

**Invalid client frames are ignored, not fatal:** a frame that is not valid JSON, or valid JSON that is not an object (e.g. `[]`, `"x"`, `42`), is logged (`ws.message.invalid_json` / `ws.message.not_an_object`) and skipped — the connection stays open. Objects with an unknown `action` or a `topic` not in the valid list are silently ignored (no error reply).

### Server → Client

See [Event Format](#event-format) for the message envelope and [Topics and Payload Interfaces](#topics-and-payload-interfaces) for per-topic payload shapes.

---

## Event Format

All server-to-client messages use the same envelope regardless of message type:

```typescript
interface WebSocketMessage<T = unknown> {
  type: 'event' | 'snapshot';
  topic: string;
  data: T;
  ts: number;  // Unix timestamp (integer seconds)
}
```

**Discriminated union on `type`:**

- `"snapshot"` — sent immediately on subscribe. Contains the current cached state.
- `"event"` — sent when provider data changes (delta detected). Contains the new state.

**The payload shape is identical for `snapshot` and `event` on the same topic.** You can parse them with the same code.

**Example envelope:**

```json
{
  "type": "snapshot",
  "topic": "fritzbox",
  "data": { "devices": [...], "bandwidth": {...}, "wan": {...} },
  "ts": 1742728441
}
```

---

## Topics and Payload Interfaces

Each topic section shows the TypeScript interfaces and a JSON example. The interfaces are derived directly from the server's `_get_snapshot()` method and the underlying cache getters. The payload shape is identical for `snapshot` and `event` messages.

> **Nullability:** Fields that depend on cache availability can be `null` if the cache slot has not been populated yet (e.g., the provider hasn't completed its first poll cycle since server start).

---

### fritzbox

Network router data: connected devices, current bandwidth, and WAN connection status.

```typescript
interface FritzBoxDevice {
  ip: string;
  name: string;
  mac: string;
  status: 0 | 1;               // 1 = online, 0 = offline
  custom_name?: string | null; // from device registry (only if registry entry exists)
  device_type?: string | null; // from device registry (only if registry entry exists)
}

interface FritzBoxBandwidth {
  upstream_bps: number;
  downstream_bps: number;
  bytes_sent: number;
  bytes_received: number;
}

interface FritzBoxWan {
  external_ip: string | null;
  is_connected: boolean;
  is_linked: boolean;
  uptime: number;            // seconds
  max_upstream_bps: number;
  max_downstream_bps: number;
}

interface FritzBoxData {
  devices: FritzBoxDevice[] | null;
  bandwidth: FritzBoxBandwidth | null;
  wan: FritzBoxWan | null;
  is_stale: boolean;                    // true when cache exceeds CACHE_MAX_AGE_SECONDS
  fetched_at: string | null;            // ISO 8601 with trailing "Z"
  data_freshness: "LIVE" | "STALE";    // "STALE" when is_stale is true
}
```

**JSON example:**

```json
{
  "devices": [
    {
      "ip": "192.168.178.25",
      "name": "iPhone-Federico",
      "mac": "AA:BB:CC:DD:EE:FF",
      "status": 1,
      "custom_name": "Federico's iPhone",
      "device_type": "smartphone"
    },
    {
      "ip": "192.168.178.31",
      "name": "MacBook-Federico",
      "mac": "11:22:33:44:55:66",
      "status": 1
    },
    {
      "ip": "192.168.178.50",
      "name": "RaspberryPi",
      "mac": "DC:A6:32:AA:BB:CC",
      "status": 1
    }
  ],
  "bandwidth": {
    "upstream_bps": 145000,
    "downstream_bps": 8200000,
    "bytes_sent": 18234567890,
    "bytes_received": 245678901234
  },
  "wan": {
    "external_ip": "93.184.216.34",
    "is_connected": true,
    "is_linked": true,
    "uptime": 432000,
    "max_upstream_bps": 50000000,
    "max_downstream_bps": 250000000
  },
  "is_stale": false,
  "fetched_at": "2026-04-03T08:30:00.000000Z",
  "data_freshness": "LIVE"
}
```

**Nullability:** `devices`, `bandwidth`, and `wan` are each independently nullable. A partial snapshot (e.g., `devices` populated but `bandwidth: null`) is valid. `fetched_at` is `null` if no successful poll has completed since server start.

---

### dirigera

IKEA DIRIGERA hub sensors: contact sensors (open/close), motion sensors, and occupancy sensors.

```typescript
interface DirigeraBaseSensor {
  id: string;
  relation_id: string | null;
  type: 'openCloseSensor' | 'occupancySensor' | 'motionSensor';
  custom_name: string | null;          // overridden from registry if entry exists, else from DIRIGERA hub
  room: string | null;
  firmware_version: string | null;
  battery_percentage: number | null;
  is_reachable: boolean;
  last_seen: string | null;            // ISO 8601
  device_type: string | null;         // always set from device registry (null if no entry)
}

interface DirigeraContactSensor extends DirigeraBaseSensor {
  type: 'openCloseSensor';
  is_open: boolean;
}

interface DirigeraMotionSensor extends DirigeraBaseSensor {
  type: 'occupancySensor' | 'motionSensor';
  is_detected: boolean;
  light_level: number | null;
}

type DirigeraSensor = DirigeraContactSensor | DirigeraMotionSensor;

interface DirigeraData {
  sensors: DirigeraSensor[] | null;
  count: number;                       // len(sensors) — added by enrichment (D-07)
  data_freshness: "LIVE" | "STALE";
  is_stale: boolean;
  fetched_at: string | null;           // ISO 8601 with trailing "Z"
}
```

Discriminate on `type` to narrow to the correct sensor interface:

```typescript
function processSensor(sensor: DirigeraSensor) {
  switch (sensor.type) {
    case 'openCloseSensor':
      // sensor.is_open is available
      break;
    case 'occupancySensor':
    case 'motionSensor':
      // sensor.is_detected and sensor.light_level are available
      break;
  }
}
```

**JSON example:**

```json
{
  "sensors": [
    {
      "id": "abc123-def456-7890-abcd-ef1234567890",
      "relation_id": "xyz789-0123-4567-89ab-cdef01234567",
      "type": "openCloseSensor",
      "custom_name": "Porta Ingresso",
      "room": "Ingresso",
      "firmware_version": "2.4.5",
      "battery_percentage": 87,
      "is_reachable": true,
      "last_seen": "2026-03-23T10:00:00.000Z",
      "is_open": false,
      "device_type": "contact_sensor"
    },
    {
      "id": "ghi012-3456-7890-abcd-ef1234567891",
      "relation_id": "jkl345-6789-0123-45ab-cdef01234568",
      "type": "occupancySensor",
      "custom_name": "Movimento Soggiorno",
      "room": "Soggiorno",
      "firmware_version": "2.4.5",
      "battery_percentage": 72,
      "is_reachable": true,
      "last_seen": "2026-03-23T09:58:00.000Z",
      "is_detected": false,
      "light_level": 45,
      "device_type": null
    }
  ],
  "count": 2,
  "data_freshness": "LIVE",
  "is_stale": false,
  "fetched_at": "2026-04-03T08:30:00.000000Z"
}
```

**Nullability:** `sensors` is nullable. Individual fields `relation_id`, `custom_name`, `room`, `firmware_version`, `battery_percentage`, `last_seen`, `device_type` can be `null` if the hub did not report them or no registry entry exists. `fetched_at` is `null` if no successful poll since server start.

---

### netatmo

Netatmo energy system data (thermostat / rooms) plus security camera inventory with browser-safe media proxy URLs.

> **Note:** As of Phase 120, the WS payload is no longer the raw Netatmo cloud API blob. It is now a structured object with a `rooms` array matching the REST endpoint response. As of quick task `260513-dlo` it also carries a `cameras` array sourced from the `gethomedata` cache and augmented with proxy URLs (browsers cannot use raw Netatmo VPN URLs directly).

```typescript
interface NetatmoRoom {
  id: string;
  name: string;
  // Fields from Netatmo cloud API room measurement (varies by module type)
  // For complete room field schema, see GET /api/v1/netatmo/energy/homestatus
  [key: string]: unknown;
}

interface NetatmoCameraStreamUrls {
  high: string;
  medium: string;
  low: string;
}

interface NetatmoCamera {
  camera_id: string;
  name: string | null;
  device_type: string | null;        // e.g. "NACamera"
  status: string | null;              // "on" | "off" | "disconnected" | ...
  sd_status: string | null;
  alim_status: string | null;
  firmware: number | null;
  is_local: boolean;
  vpn_url: string | null;             // raw Netatmo VPN URL (server-side use)
  snapshot_url?: string;              // raw VPN snapshot (only when vpn_url present)
  vpn_streams?: NetatmoCameraStreamUrls;  // raw VPN HLS (only when vpn_url present)
  snapshot_proxy_url: string;         // browser-safe JPEG proxy (always present)
  proxy_streams: NetatmoCameraStreamUrls; // browser-safe HLS proxy (always present)
  local_streams?: NetatmoCameraStreamUrls; // only when is_local && local_url known
}

interface NetatmoPayload {
  rooms: NetatmoRoom[];                // parsed from body.home.rooms in raw cache
  cameras: NetatmoCamera[];            // parsed from cached gethomedata response
  data_freshness: "LIVE" | "STALE";
}
```

For the full room field-by-field documentation, refer to `GET /api/v1/netatmo/energy/homestatus` in [Netatmo REST endpoints](./netatmo.md). The `rooms` array shape is identical to that endpoint's response. The `cameras` array shape mirrors `GET /api/v1/netatmo/camera/status` plus the proxy URL fields documented under [GET /camera/{camera_id}/snapshot](./netatmo.md#get-cameracamera_idsnapshot) and [GET /camera/{camera_id}/stream](./netatmo.md#get-cameracamera_idstream).

> **Browser usage:** load `cameras[].snapshot_proxy_url` into `<img src>` and `cameras[].proxy_streams.*` into `hls.js`. The raw `vpn_url` / `vpn_streams` / `snapshot_url` are not browser-usable (no session, no CORS, mixed-content under reverse proxies) — they are exposed only for server-to-server consumers.

**JSON example:**

```json
{
  "rooms": [
    {
      "id": "2535128276",
      "name": "Soggiorno",
      "reachable": true,
      "therm_measured_temperature": 21.5,
      "therm_setpoint_temperature": 20.0,
      "heating_power_request": 0
    }
  ],
  "cameras": [
    {
      "camera_id": "70:ee:50:aa:bb:cc",
      "name": "Indoor",
      "device_type": "NACamera",
      "status": "on",
      "sd_status": "on",
      "alim_status": "on",
      "firmware": 176,
      "is_local": true,
      "vpn_url": "https://v.netatmo.com/restricted/.../...",
      "snapshot_url": "https://v.netatmo.com/restricted/.../live/snapshot_720.jpg",
      "vpn_streams": {
        "high": "https://v.netatmo.com/restricted/.../live/files/high/index.m3u8",
        "medium": "https://v.netatmo.com/restricted/.../live/files/medium/index.m3u8",
        "low": "https://v.netatmo.com/restricted/.../live/files/low/index.m3u8"
      },
      "snapshot_proxy_url": "/api/v1/netatmo/camera/70:ee:50:aa:bb:cc/live/snapshot.jpg",
      "proxy_streams": {
        "high": "/api/v1/netatmo/camera/70:ee:50:aa:bb:cc/live/high/index.m3u8",
        "medium": "/api/v1/netatmo/camera/70:ee:50:aa:bb:cc/live/medium/index.m3u8",
        "low": "/api/v1/netatmo/camera/70:ee:50:aa:bb:cc/live/low/index.m3u8"
      },
      "local_streams": {
        "high": "http://192.168.178.x/.../live/files/high/index.m3u8",
        "medium": "http://192.168.178.x/.../live/files/medium/index.m3u8",
        "low": "http://192.168.178.x/.../live/files/low/index.m3u8"
      }
    }
  ],
  "data_freshness": "LIVE"
}
```

**Nullability / when it is sent:**
- The payload is built from the cached raw **homestatus** (`rooms` = `body.home.rooms`) plus the cached **homedata** (`cameras`). Both snapshot and event have exactly the keys `rooms`, `cameras`, `data_freshness`.
- **Empty cache → no snapshot:** if no homestatus has been cached yet, subscribing sends **no** snapshot message at all (it does not send an empty payload). `cameras` is `[]` while homedata has not been polled yet.
- **After a camera mutation** (`POST /camera/{id}/monitoring`) the backend re-polls `gethomedata` and pushes an event built from the **cached homestatus** (so `rooms` is populated, not `[]`) with `cameras` rebuilt from the fresh homedata. If no homestatus is cached, that push is skipped.
- After energy / valve mutations the re-polled homestatus is pushed the same way.
- A camera with no `vpn_url` (offline / unreachable) still appears in `cameras` with the proxy URL fields populated but without `vpn_url`, `snapshot_url`, `vpn_streams`, or `local_streams`.

---

### thermorossi

Thermorossi pellet stove status: operating state, power level, fan level, error codes.

```typescript
interface ThermorossiData {
  stove_state: string;              // 'off' | 'igniting' | 'working' | 'cooling' | 'alarm' | ...
  power_level: number | null;       // 1–5 (fuel feed rate)
  fan_level: number | null;         // 1–6 (combustion air)
  error_code: number | null;
  error_description: string | null;
  data_freshness: "LIVE" | "STALE";
  last_poll_at: string | null;      // ISO 8601 WITHOUT trailing "Z" (uses .isoformat())
  custom_name?: string | null;      // from device registry (only if registry entry exists)
  device_type?: string | null;      // from device registry (only if registry entry exists)
  // Note: stove_state_raw is STRIPPED from WS payload (D-08)
  // Note: is_stale is NOT present on thermorossi — only data_freshness
  [key: string]: unknown;           // additional raw WiNet fields may be present
}
```

The payload is the enriched WiNet API status response. `stove_state_raw` is stripped from the WS payload. For full field documentation see `GET /api/v1/thermorossi/status` in [Thermorossi REST endpoints](./thermorossi.md).

**JSON example:**

```json
{
  "stove_state": "working",
  "power_level": 3,
  "fan_level": 2,
  "error_code": null,
  "error_description": null,
  "data_freshness": "LIVE",
  "last_poll_at": "2026-04-03T08:30:00+00:00",
  "custom_name": "Stufa Pellet",
  "device_type": "pellet_stove"
}
```

**Nullability:** The entire payload can be `null` if no status has been fetched since server start. `power_level`, `fan_level`, `error_code`, `error_description` can be `null` when the stove is off or when the field is not reported by the WiNet firmware. `last_poll_at` is `null` if no poll has occurred.

---

### tuya

Tuya smart plugs: switch state, power monitoring (watts, voltage, current, energy), countdown timers. See [Tuya REST endpoints](./tuya.md) for REST endpoint details.

> **Snapshot and events have the same shape.** Publishers (poller and `POST /plugs/{id}/state|timer` re-poll) send the raw cache dict; `_enrich_payload()` converts it into `{plugs: [...]}` where every item is built with the same `_build_plug_response()` used by `GET /tuya/plugs` (`TuyaPlugResponse`), plus registry `custom_name` / `device_type`. No snapshot is sent while the Tuya cache is empty.

```typescript
interface TuyaPlug {
  device_id: string;
  switch_on: boolean | null;           // null when never polled successfully
  power_w: number | null;              // watts
  voltage_v: number | null;            // volts
  current_ma: number | null;           // milliamps
  energy_kwh: number | null;           // cumulative kWh
  countdown_s: number | null;          // active timer countdown in seconds, null if none
  data_freshness: "LIVE" | "STALE" | "UNREACHABLE";
  last_polled_at: number | null;       // Unix epoch seconds (float) of last successful poll, null if never polled
  custom_name: string | null;          // from device registry (null if no entry) — key always present
  device_type: string | null;          // device_type_slug from registry (null if no entry) — key always present
}

interface TuyaPayload {
  plugs: TuyaPlug[];                   // exactly the GET /tuya/plugs item shape (TuyaPlugResponse)
}
```

The payload wraps all plugs in a `plugs` array (no top-level `data_freshness`; freshness is per plug). Item order follows the cache dict order.

**JSON example:**

```json
{
  "plugs": [
    {
      "device_id": "bfabc123456789",
      "switch_on": true,
      "power_w": 45.2,
      "voltage_v": 230.1,
      "current_ma": 196.5,
      "energy_kwh": 1.23,
      "countdown_s": null,
      "data_freshness": "LIVE",
      "last_polled_at": 1775205000.123,
      "custom_name": "Presa Soggiorno",
      "device_type": "smart_plug"
    },
    {
      "device_id": "bfdef987654321",
      "switch_on": false,
      "power_w": 0.0,
      "voltage_v": 229.4,
      "current_ma": 0.0,
      "energy_kwh": 0.87,
      "countdown_s": 0,
      "data_freshness": "UNREACHABLE",
      "last_polled_at": 1775196000.456,
      "custom_name": "Presa Cucina",
      "device_type": "smart_plug"
    }
  ]
}
```

**Nullability:** The state fields (`switch_on`, `power_w`, `voltage_v`, `current_ma`, `energy_kwh`, `countdown_s`) are `null` when the device has never been polled successfully or the DP was not reported. An `UNREACHABLE` plug keeps its **last known** values (the cache retains `data` on poll failures) — check `data_freshness` before trusting them. `last_polled_at` is `null` if no successful poll has occurred. `custom_name` and `device_type` are always present and `null` when the device has no registry entry.

---

### hue

Philips Hue Bridge lights and groups: light states, brightness, color temperature, group membership.

> **Note:** As of Phase 120, the WS payload uses flat interfaces derived from the REST Pydantic models (`HueLightFlat` below). The old nested `state.on` shape is no longer returned — all fields are at the top level of each light object.

```typescript
interface HueLightFlat {
  light_id: string;                           // numeric Hue Bridge ID as string (e.g. "1")
  name: string;
  on: boolean;
  brightness: number | null;                  // 0–254 (was bri in old API)
  ct_mirek: number | null;                    // 153–500
  ct_kelvin: number | null;                   // derived: round(1_000_000 / ct_mirek)
  hue: number | null;                         // 0–65535
  saturation: number | null;                  // 0–254 (was sat in old API)
  colormode: 'ct' | 'hs' | 'xy' | null;
  reachable: boolean;
  capability_tier: 'white' | 'ambiance' | 'color';
  room_id: string | null;                     // group_id of the room this light belongs to
  room_name: string | null;
  model_id: string | null;
  light_type: string | null;                  // e.g. "Extended color light"
  custom_name: string | null;                 // from device registry
  device_type: string | null;                 // from device registry
}

interface HueGroupFlat {
  group_id: string;                           // numeric Hue Bridge ID as string (e.g. "1")
  name: string;
  type: string | null;                        // e.g. "Room", "Zone"
  group_class: string | null;                 // e.g. "Living room" (was class in raw API)
  lights: string[];                           // array of light_id strings
  any_on: boolean;
  all_on: boolean;
  brightness: number | null;                  // from action.bri
  color_temp: number | null;                  // from action.ct
  colormode: string | null;                   // from action.colormode
}

interface HuePayload {
  lights: Record<string, HueLightFlat>;       // key = light_id
  groups: Record<string, HueGroupFlat>;       // key = group_id
  data_freshness: "LIVE" | "STALE";
  is_stale: boolean;
  last_poll_at: string | null;                // ISO 8601 with trailing "Z"
  fetched_at: string | null;                  // ISO 8601 with trailing "Z"
}
```

**JSON example:**

```json
{
  "lights": {
    "1": {
      "light_id": "1",
      "name": "Luce Soggiorno",
      "on": true,
      "brightness": 200,
      "ct_mirek": 370,
      "ct_kelvin": 2703,
      "hue": null,
      "saturation": null,
      "colormode": "ct",
      "reachable": true,
      "capability_tier": "ambiance",
      "room_id": "1",
      "room_name": "Soggiorno",
      "model_id": "LCT016",
      "light_type": "Extended color light",
      "custom_name": null,
      "device_type": null
    },
    "2": {
      "light_id": "2",
      "name": "Luce Camera",
      "on": false,
      "brightness": 128,
      "ct_mirek": 300,
      "ct_kelvin": 3333,
      "hue": null,
      "saturation": null,
      "colormode": "ct",
      "reachable": true,
      "capability_tier": "ambiance",
      "room_id": null,
      "room_name": null,
      "model_id": "LCT010",
      "light_type": "Color temperature light",
      "custom_name": null,
      "device_type": null
    }
  },
  "groups": {
    "1": {
      "group_id": "1",
      "name": "Soggiorno",
      "type": "Room",
      "group_class": "Living room",
      "lights": ["1"],
      "any_on": true,
      "all_on": true,
      "brightness": 200,
      "color_temp": 370,
      "colormode": "ct"
    }
  },
  "data_freshness": "LIVE",
  "is_stale": false,
  "last_poll_at": "2026-04-03T08:30:00.000000Z",
  "fetched_at": "2026-04-03T08:30:00.000000Z"
}
```

**Nullability:** `lights` and `groups` are each independently nullable (empty dict `{}` when cache is populated but empty). `last_poll_at` and `fetched_at` are `null` if no poll has occurred since server start.

---

### sonos

Sonos system: speaker details, group topology, coordinator assignments.

```typescript
interface SonosSpeaker {
  uid: string;                         // guaranteed non-null (fallback: "unknown")
  name: string;                        // guaranteed non-null (fallback: "Unknown Speaker")
  ip: string;                          // guaranteed non-null (fallback: "0.0.0.0")
  model: string | null;
  firmware: string | null;
  serial: string | null;
  role: 'soundbar' | 'sub' | 'surround' | 'speaker';
  is_visible: boolean;
  is_coordinator: boolean;
  custom_name?: string | null;         // from device registry (only if registry entry exists)
  device_type?: string | null;         // from device registry (only if registry entry exists)
}

interface SonosGroupMember {
  uid: string;
  name: string;
  ip: string;
  role: string;
}

interface SonosGroup {
  group_id: string;
  label: string;
  coordinator_uid: string;
  coordinator_name: string;
  member_count: number;
  members: SonosGroupMember[];
}

interface SonosData {
  speakers: SonosSpeaker[] | null;
  groups: SonosGroup[] | null;
  data_freshness: "LIVE" | "STALE";
  is_stale: boolean;
  last_poll_at: string | null;       // ISO 8601 with trailing "Z"
  fetched_at: string | null;         // ISO 8601 with trailing "Z"
}
```

**JSON example:**

```json
{
  "speakers": [
    {
      "uid": "RINCON_7828CA123456789001400",
      "name": "Soggiorno",
      "ip": "192.168.178.101",
      "model": "Sonos One (Gen 2)",
      "firmware": "77.1-53250",
      "serial": "00-0E-58-12:34:56:7",
      "role": "soundbar",
      "is_visible": true,
      "is_coordinator": true
    },
    {
      "uid": "RINCON_7828CA987654321001400",
      "name": "Camera",
      "ip": "192.168.178.102",
      "model": "Sonos Era 100",
      "firmware": "77.1-53250",
      "serial": "00-0E-58-98:76:54:3",
      "role": "speaker",
      "is_visible": true,
      "is_coordinator": false
    }
  ],
  "groups": [
    {
      "group_id": "RINCON_7828CA123456789001400",
      "label": "Soggiorno",
      "coordinator_uid": "RINCON_7828CA123456789001400",
      "coordinator_name": "Soggiorno",
      "member_count": 1,
      "members": [
        {
          "uid": "RINCON_7828CA123456789001400",
          "name": "Soggiorno",
          "ip": "192.168.178.101",
          "role": "soundbar"
        }
      ]
    }
  ],
  "data_freshness": "LIVE",
  "is_stale": false,
  "last_poll_at": "2026-04-03T08:30:00.000000Z",
  "fetched_at": "2026-04-03T08:30:00.000000Z"
}
```

**Nullability:** `speakers` and `groups` are each independently nullable. `last_poll_at` and `fetched_at` are `null` if no poll has occurred since server start.

---

### sonos_transport

Sonos playback state for **one zone per message** (the payload is a single playback snapshot, not a list).

> **Push-only:** No snapshot is delivered on subscribe. Pushes come from two sources:
> 1. **Poller (every 30 s):** for each zone coordinator, the fresh playback snapshot is pushed when it differs from the last one pushed for that zone (fingerprint key `sonos_transport:<group_id>`). This catches changes made outside the app (Sonos app, remotes, voice assistants), new tracks, and position changes while playing.
> 2. **Transport mutations** (`POST /zones/{group_id}/play|pause|stop|next|previous`, `PUT /zones/{group_id}/seek`): after a 0.5 s re-poll, the new snapshot is pushed if it changed.
>
> Use `GET /api/v1/sonos/zones/{group_id}/playback` for the initial state.

```typescript
// Same shape as REST SonosPlaybackResponse (GET /zones/{group_id}/playback)
interface SonosTransportPayload {
  group_id: string;                  // zone coordinator UID (RINCON_...), same as GET /zones group_id
  transport_state: string | null;    // "PLAYING" | "PAUSED_PLAYBACK" | "STOPPED" | "TRANSITIONING"
  title: string | null;              // current track title
  artist: string | null;
  album: string | null;
  album_art_url: string | null;      // absolute http://<speaker-ip>:1400/... URL
  position: string | null;           // "H:MM:SS" string from SoCo (e.g. "0:00:47"); null when "0:00:00"/NOT_IMPLEMENTED
  duration: string | null;           // "H:MM:SS" string; null for radio/TV/line-in or "0:00:00"
  source_type: "tv" | "streaming" | "radio" | "line_in" | "airplay" | "unknown";
}
```

`source_type` comes from SoCo `music_source`: `TV`→`tv`, `LINE_IN`→`line_in`, `AIRPLAY`→`airplay`, `RADIO`→`radio`, `LIBRARY`/`WEB_FILE`→`streaming`, otherwise `unknown` (with a fallback on `is_playing_tv` / `is_playing_radio` / `is_playing_line_in`).

No freshness enrichment — `_enrich_payload()` has no branch for `sonos_transport`.

**JSON example:**

```json
{
  "group_id": "RINCON_7828CA123456789001400",
  "transport_state": "PLAYING",
  "title": "Bohemian Rhapsody",
  "artist": "Queen",
  "album": "A Night at the Opera",
  "album_art_url": "http://192.168.178.101:1400/getaa?s=1&u=x-sonos-spotify%3a...",
  "position": "0:00:47",
  "duration": "0:05:54",
  "source_type": "streaming"
}
```

---

### sonos_volume

Sonos volume change per speaker or per zone.

> **Push-only:** No snapshot is delivered on subscribe. Use `GET /api/v1/sonos/speakers/{uid}/volume` for the initial state.

Two payload shapes are possible:

| Source | Shape |
|--------|-------|
| Poller (every 30 s), one message per speaker whose volume/mute changed (fingerprint key `sonos_volume:<uid>`) — includes changes from the Sonos app | `SonosVolumePayload` `{uid, volume, mute}` |
| `PUT /speakers/{uid}/volume`, `PUT /speakers/{uid}/mute` (per-speaker re-poll) | `SonosVolumePayload` `{uid, volume, mute}` |
| `PUT /zones/{group_id}/volume` (zone re-poll of all members) | `SonosZoneVolumePayload` `{group_id, volumes: [...]}` |

Discriminate with `"uid" in data` vs `"group_id" in data`.

```typescript
// Single speaker volume change
interface SonosVolumePayload {
  uid: string;
  volume: number | null;             // 0–100; null if the speaker read failed
  mute: boolean | null;
}

// Zone-wide volume change (after group volume mutation)
interface SonosZoneVolumePayload {
  group_id: string;
  volumes: SonosVolumePayload[];     // one entry per zone member
}
```

No freshness enrichment.

**JSON example (single speaker):**

```json
{
  "uid": "RINCON_7828CA123456789001400",
  "volume": 42,
  "mute": false
}
```

**JSON example (zone-wide):**

```json
{
  "group_id": "RINCON_7828CA123456789001400",
  "volumes": [
    {"uid": "RINCON_7828CA123456789001400", "volume": 42, "mute": false},
    {"uid": "RINCON_7828CA987654321001400", "volume": 42, "mute": false}
  ]
}
```

---

### sonos_topology

Sonos group topology change: speakers and groups after a topology repoll.

> **Push-only:** No snapshot is delivered on subscribe. Pushed only after `POST /speakers/{uid}/join`, `/unjoin` or `/source` (full topology re-poll), when the result changed. Topology changes detected by the 30 s poller are delivered on the `sonos` topic instead.

Shape mirrors the `sonos` topic payload but without freshness or registry enrichment (speakers have no `custom_name` / `device_type`):

```typescript
interface SonosTopologyPayload {
  speakers: SonosSpeaker[];          // same SonosSpeaker interface as sonos topic
  groups: SonosGroup[];              // same SonosGroup interface as sonos topic
  // Note: no data_freshness, is_stale, last_poll_at, fetched_at
}
```

No freshness enrichment.

**JSON example:**

```json
{
  "speakers": [
    {
      "uid": "RINCON_7828CA123456789001400",
      "name": "Soggiorno",
      "ip": "192.168.178.101",
      "model": "Sonos One (Gen 2)",
      "firmware": "77.1-53250",
      "serial": "00-0E-58-12:34:56:7",
      "role": "soundbar",
      "is_visible": true,
      "is_coordinator": true
    }
  ],
  "groups": [
    {
      "group_id": "RINCON_7828CA123456789001400",
      "label": "Soggiorno",
      "coordinator_uid": "RINCON_7828CA123456789001400",
      "coordinator_name": "Soggiorno",
      "member_count": 1,
      "members": [
        {
          "uid": "RINCON_7828CA123456789001400",
          "name": "Soggiorno",
          "ip": "192.168.178.101",
          "role": "soundbar"
        }
      ]
    }
  ]
}
```

---

### raspi

Raspberry Pi system statistics: CPU, RAM, disk, temperature, uptime, load averages, network I/O, and process count. See [Raspberry Pi API](./raspberry-pi.md) for REST endpoint details.

Collected by the `system_stats` job every **15 s** (`_poll_raspi()` in `api/providers/raspi/provider.py`) with psutil, stored in `raspi_cache` (used for the snapshot) and pushed only when the payload changed. Sub-object keys match the REST models (`CpuResponse`, `MemoryResponse`, `DiskResponse`, `SystemResponse`), without their per-object `data_freshness`.

```typescript
interface RaspiCpu {
  cpu_percent: number;               // psutil.cpu_percent(interval=0.1)
}

interface RaspiMemory {
  used_bytes: number;
  total_bytes: number;
  percent: number;
}

interface RaspiDisk {
  used_bytes: number;
  total_bytes: number;
  percent: number;
  mount_point: "/";                  // always "/" (added by enrichment, D-03)
}

interface RaspiNetwork {
  bytes_sent: number;
  bytes_recv: number;
  interface: string;                 // most active non-loopback NIC by bytes_sent ("unknown" if none)
}

interface RaspiSystem {
  cpu_temperature: number | null;    // °C from psutil cpu_thermal; null if unavailable (e.g. macOS dev)
  uptime_seconds: number;
  load_avg_1: number;
  load_avg_5: number;
  load_avg_15: number;
  process_count: number;
  network: RaspiNetwork;             // nested inside system (there is no top-level network key)
}

interface RaspiData {
  cpu: RaspiCpu;
  memory: RaspiMemory;
  disk: RaspiDisk;
  system: RaspiSystem;
  data_freshness: "LIVE";           // always "LIVE" — hardcoded by enrichment
}
```

**JSON example:**

```json
{
  "cpu": {
    "cpu_percent": 12.5
  },
  "memory": {
    "used_bytes": 2147483648,
    "total_bytes": 8589934592,
    "percent": 25.0
  },
  "disk": {
    "used_bytes": 21474836480,
    "total_bytes": 64424509440,
    "percent": 33.3,
    "mount_point": "/"
  },
  "system": {
    "cpu_temperature": 48.5,
    "uptime_seconds": 864000,
    "load_avg_1": 0.42,
    "load_avg_5": 0.38,
    "load_avg_15": 0.31,
    "process_count": 142,
    "network": {
      "bytes_sent": 1073741824,
      "bytes_recv": 5368709120,
      "interface": "eth0"
    }
  },
  "data_freshness": "LIVE"
}
```

**Nullability:** No snapshot is sent until the first 15 s poll has populated the cache; after that all four sub-objects are always present. Only `system.cpu_temperature` can be `null`. `data_freshness` is always `"LIVE"`.

---

### scheduler

The `scheduler` topic delivers a snapshot of current scheduler state on subscribe and pushes events for Thermorossi heating schedule changes and cron engine executions. See [Scheduler API](./scheduler.md) for the full REST endpoint reference.

**Snapshot on subscribe:** When you subscribe to `scheduler`, the server immediately delivers a snapshot of the current schedules, active schedule, and mode. This is a change from pre-Phase-120 behaviour — the topic now sends a snapshot (previously it sent only push events).

**Snapshot shape:**

```typescript
interface SchedulerSnapshot {
  event: "snapshot";
  data: {
    schedules: ScheduleSummary[];
    active_schedule_id: number | null;
    mode: SchedulerMode;
  };
  timestamp: null;                   // always null for snapshot
  data_freshness: "LIVE";           // always "LIVE" (event-driven, not polled)
}

interface ScheduleSummary {
  id: number;
  name: string;
  enabled: boolean;
  created_at: number;
  updated_at: number;
  interval_count: number;
  is_active: boolean;
}

interface SchedulerMode {
  enabled: boolean;
  semi_manual: boolean;                    // snake_case (was semiManual in pre-Phase-120)
  semi_manual_activated_at: number | null; // snake_case (was semiManualActivatedAt)
  return_to_auto_at: number | null;        // snake_case (was returnToAutoAt)
}
```

**Events pushed after subscribe:**

| Event | Trigger | Data Shape |
|-------|---------|------------|
| `schedule.created` | POST /schedules | `ScheduleSummary` |
| `schedule.updated` | PATCH /schedules/{id} | `ScheduleSummary` |
| `schedule.deleted` | DELETE /schedules/{id} | `{id: number}` |
| `schedule.activated` | PUT /schedules/{id}/active | `{active_schedule_id: number}` |
| `slots.updated` | PUT /schedules/{id}/days/{day}/slots | `{schedule_id: number, day: number, slot_count: number}` |
| `mode.changed` | POST /scheduler/mode | `SchedulerMode` |
| `override.set` | POST /scheduler/override | `SchedulerMode` |
| `override.cleared` | DELETE /scheduler/override | `SchedulerMode` |
| `engine.tick` | Cron engine (every 5 min) | `EngineTick` |

```typescript
/** Wrapper for all scheduler WS event messages (non-snapshot) */
interface SchedulerEvent {
  event: string;
  data: ScheduleSummary | SchedulerMode | EngineTick | Record<string, unknown>;
  timestamp: string;                 // ISO 8601 with trailing "Z"
}

interface EngineTick {
  action: string;
  stove_state: string | null;        // snake_case (was stoveState in pre-Phase-120)
  matched_slot: {start_minutes: number; end_minutes: number; power: number; fan: number} | null;
  execution_duration_ms: number;     // snake_case (was executionDurationMs)
}
```

**JSON example (snapshot on subscribe):**

```json
{
  "type": "snapshot",
  "topic": "scheduler",
  "data": {
    "event": "snapshot",
    "data": {
      "schedules": [
        {
          "id": 1,
          "name": "Winter Schedule",
          "enabled": true,
          "created_at": 1743600000,
          "updated_at": 1743600000,
          "interval_count": 14,
          "is_active": true
        }
      ],
      "active_schedule_id": 1,
      "mode": {
        "enabled": true,
        "semi_manual": false,
        "semi_manual_activated_at": null,
        "return_to_auto_at": null
      }
    },
    "timestamp": null,
    "data_freshness": "LIVE"
  },
  "ts": 1743600000
}
```

**JSON example (schedule.created event):**

```json
{
  "topic": "scheduler",
  "type": "event",
  "data": {
    "event": "schedule.created",
    "data": {
      "id": 3,
      "name": "Winter Schedule",
      "enabled": true,
      "created_at": 1743600000,
      "updated_at": 1743600000,
      "interval_count": 0,
      "is_active": false
    },
    "timestamp": "2026-04-02T10:00:00.000000Z"
  }
}
```

---

### automations

The `automations` topic pushes one event per execution-log row written by the automation engine (Phase 129) or by a manual `POST /api/v1/automations/{rule_id}/trigger` call (Phase 131). There is no snapshot on subscribe — events arrive only when a rule is evaluated by the engine's 30s tick or when a client invokes the manual trigger endpoint. The full REST contract for automation rules is documented in [automations.md](./automations.md).

**Connection:**

```
wss://pdupun8zpr7exw43.myfritz.net/ws/live?api_key=${API_KEY}
```

**Subscribe message:**

```json
{"action": "subscribe", "topic": "automations"}
```

The server sends no initial snapshot. Events begin flowing immediately after `subscribe` is acknowledged and are delivered as `type: "event"` messages (matching the shape described in the [Event Format](#event-format) section above).

**Event envelope** (output of `build_automations_ws_payload` in `api/automations/engine.py`):

| Field | Type | Description |
|-------|------|-------------|
| `event` | string | Always `"rule_executed"` |
| `execution_id` | int | `automation_executions.id` of the row just written |
| `rule_id` | int | ID of the automation rule |
| `rule_name` | string | Human-readable rule name |
| `trigger_source` | `"auto"` \| `"manual"` | `"auto"` for engine edge-trigger, `"manual"` for POST /trigger |
| `status` | string | `"success"` \| `"failure"` \| `"partial_failure"` \| `"skipped"` \| `"condition_not_met"` |
| `triggered_at` | int | Unix epoch seconds |
| `triggered_by` | string \| null | Username or API-key name for manual; `null` for engine |
| `error_message` | string \| null | Per-branch error string, `null` on success |
| `trigger_snapshot` | object \| null | Decoded snapshot blob; shape varies per branch (documented below) |

**Branch enumeration:**

The engine writes exactly one execution row per evaluated rule per tick. There are **five** DB-write branches; each produces one WS broadcast on the `automations` topic with the envelope above. Each branch is distinguished by the combination of `status` and `trigger_snapshot.cause.kind`.

#### 1. Condition Not Met (engine, condition FALSE)

Engine tick evaluated an affected rule and the condition tree returned false. `_evaluate_rule` Branch 1.

- `status`: `"condition_not_met"`, `trigger_source`: `"auto"`, `cause.kind`: `"leaf_false"`

```json
{
  "type": "event",
  "topic": "automations",
  "data": {
    "event": "rule_executed",
    "execution_id": 1234,
    "rule_id": 7,
    "rule_name": "Notturno soggiorno",
    "trigger_source": "auto",
    "status": "condition_not_met",
    "triggered_at": 1771179600,
    "triggered_by": null,
    "error_message": "condition false: hue:12345:on",
    "trigger_snapshot": {
      "changed": ["hue:12345:on"],
      "result": false,
      "cause": {"kind": "leaf_false", "failed_sensor_ids": ["hue:12345:on"]}
    }
  },
  "ts": 1771179600
}
```

#### 2. Skipped by Safety Guard (engine, edge TRUE but guard denied)

Engine detected a FALSE→TRUE edge, but a Phase 128 guard (disabled, cooldown, rate cap, or active-hours window) prevented action execution. `_write_edge_row` Case A.

- `status`: `"skipped"`, `trigger_source`: `"auto"`, `cause.kind`: `"guard"`, `reason` ∈ {`"disabled"`, `"cooldown"`, `"rate_cap"`, `"outside_active_hours"`, ...}

```json
{
  "type": "event",
  "topic": "automations",
  "data": {
    "event": "rule_executed",
    "execution_id": 1235,
    "rule_id": 7,
    "rule_name": "Notturno soggiorno",
    "trigger_source": "auto",
    "status": "skipped",
    "triggered_at": 1771179630,
    "triggered_by": null,
    "error_message": "skipped: cooldown",
    "trigger_snapshot": {
      "changed": ["hue:12345:on"],
      "result": true,
      "cause": {"kind": "guard", "reason": "cooldown"}
    }
  },
  "ts": 1771179630
}
```

#### 3. Success (engine, actions all succeeded)

Engine detected a FALSE→TRUE edge, guards passed, and every action succeeded. `_write_edge_row` Case B, `status='success'`.

- `status`: `"success"`, `trigger_source`: `"auto"`, `cause` omitted (not present on success)

```json
{
  "type": "event",
  "topic": "automations",
  "data": {
    "event": "rule_executed",
    "execution_id": 1236,
    "rule_id": 7,
    "rule_name": "Notturno soggiorno",
    "trigger_source": "auto",
    "status": "success",
    "triggered_at": 1771179660,
    "triggered_by": null,
    "error_message": null,
    "trigger_snapshot": {
      "changed": ["hue:12345:on"],
      "result": true
    }
  },
  "ts": 1771179660
}
```

#### 4. Partial Failure (engine, some actions failed)

Engine ran the rule's actions; at least one succeeded and at least one failed. `_write_edge_row` Case B, `status='partial_failure'`.

- `status`: `"partial_failure"`, `trigger_source`: `"auto"`, `cause.kind`: `"action"`, fields: `action_index`, `action_type`, `error`

```json
{
  "type": "event",
  "topic": "automations",
  "data": {
    "event": "rule_executed",
    "execution_id": 1237,
    "rule_id": 7,
    "rule_name": "Notturno soggiorno",
    "trigger_source": "auto",
    "status": "partial_failure",
    "triggered_at": 1771179690,
    "triggered_by": null,
    "error_message": "action[1] hue.set_light: device unreachable",
    "trigger_snapshot": {
      "changed": ["hue:12345:on"],
      "result": true,
      "cause": {
        "kind": "action",
        "action_index": 1,
        "action_type": "hue.set_light",
        "error": "device unreachable"
      }
    }
  },
  "ts": 1771179690
}
```

#### 5. Failure (engine, all actions failed)

Engine ran the rule's actions; every action failed. `_write_edge_row` Case B, `status='failure'`.

- `status`: `"failure"`, `trigger_source`: `"auto"`, `cause.kind`: `"all_actions_failed"`, `cause.actions` is an array of `{index, type, error}`.

```json
{
  "type": "event",
  "topic": "automations",
  "data": {
    "event": "rule_executed",
    "execution_id": 1238,
    "rule_id": 7,
    "rule_name": "Notturno soggiorno",
    "trigger_source": "auto",
    "status": "failure",
    "triggered_at": 1771179720,
    "triggered_by": null,
    "error_message": "all 2 actions failed: hue.set_light: device unreachable; tuya.turn_off: timeout",
    "trigger_snapshot": {
      "changed": ["hue:12345:on"],
      "result": true,
      "cause": {
        "kind": "all_actions_failed",
        "actions": [
          {"index": 0, "type": "hue.set_light", "error": "device unreachable"},
          {"index": 1, "type": "tuya.turn_off", "error": "timeout"}
        ]
      }
    }
  },
  "ts": 1771179720
}
```

#### Manual-trigger variant (same envelope, trigger_source="manual")

A `POST /api/v1/automations/{rule_id}/trigger` call produces a broadcast with the same envelope shape. It bypasses the engine's condition evaluation and guards, so only `success` / `partial_failure` / `failure` appear — never `condition_not_met` or `skipped`. `trigger_source` is `"manual"`, `triggered_by` is the authenticated identity name, and `trigger_snapshot.kind` is `"manual"` (NOT `leaf_false`/`guard`/`action`). `cause` inside `trigger_snapshot` follows the same `action`/`all_actions_failed` shape for non-success outcomes.

```json
{
  "type": "event",
  "topic": "automations",
  "data": {
    "event": "rule_executed",
    "execution_id": 1239,
    "rule_id": 7,
    "rule_name": "Notturno soggiorno",
    "trigger_source": "manual",
    "status": "success",
    "triggered_at": 1771179750,
    "triggered_by": "admin",
    "error_message": null,
    "trigger_snapshot": {
      "kind": "manual",
      "triggered_by": "admin",
      "result": true,
      "cause": null
    }
  },
  "ts": 1771179750
}
```

**TypeScript interfaces:**

```typescript
type AutomationsEventStatus =
  | "success"
  | "failure"
  | "partial_failure"
  | "skipped"
  | "condition_not_met";

type AutomationsTriggerSnapshotCause =
  | { kind: "leaf_false"; failed_sensor_ids: string[] }
  | { kind: "guard"; reason: string }
  | { kind: "action"; action_index: number; action_type: string; error: string }
  | { kind: "all_actions_failed"; actions: Array<{ index: number; type: string; error: string }> }
  | null;

interface AutomationsTriggerSnapshotAuto {
  changed: string[];
  result: boolean;
  cause?: Exclude<AutomationsTriggerSnapshotCause, null>;
}

interface AutomationsTriggerSnapshotManual {
  kind: "manual";
  triggered_by: string;
  result: true;
  cause:
    | null
    | { kind: "action"; action_index: number; action_type: string | null; error: string | null }
    | { kind: "all_actions_failed"; actions: Array<{ index: number; type: string; error: string }> };
}

interface AutomationsEvent {
  event: "rule_executed";
  execution_id: number;
  rule_id: number;
  rule_name: string;
  trigger_source: "auto" | "manual";
  status: AutomationsEventStatus;
  triggered_at: number;          // Unix epoch seconds
  triggered_by: string | null;
  error_message: string | null;
  trigger_snapshot:
    | AutomationsTriggerSnapshotAuto
    | AutomationsTriggerSnapshotManual
    | null;
}
```

---

## Reconnection

Reconnection must be handled by the client. The recommended approach is exponential backoff starting at 1 second, capped at 30 seconds.

> **Critical: Re-subscribe on every reconnect.** Subscriptions are per-connection state on the server. When a connection closes, all subscription state is discarded. A new connection starts with zero subscriptions — the client receives no events until it re-subscribes. Always send `subscribe` messages inside the `onOpen` callback, not just at component mount time.

### react-use-websocket options

```typescript
const { lastMessage, sendJsonMessage, readyState } = useWebSocket(wsUrl, {
  onOpen: () => {
    // Re-subscribe on every connection — including reconnects
    sendJsonMessage({ action: 'subscribe', topic: 'fritzbox' });
  },
  shouldReconnect: (closeEvent) => true,         // reconnect on all close events
  reconnectAttempts: 10,                          // number of retries
  reconnectInterval: (attemptNumber) =>           // exponential backoff
    Math.min(1000 * 2 ** attemptNumber, 30000),
});
```

**Backoff schedule:**

| Attempt | Delay |
|---------|-------|
| 0 | 1s |
| 1 | 2s |
| 2 | 4s |
| 3 | 8s |
| 4 | 16s |
| 5+ | 30s (capped) |

---

## Complete Example

### useProviderData hook (react-use-websocket v4.x)

Install the library:

```bash
npm install react-use-websocket
```

Full reusable hook:

```typescript
// hooks/useProviderData.ts
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useState, useEffect } from 'react';

type MessageType = 'event' | 'snapshot';

interface WebSocketMessage<T = unknown> {
  type: MessageType;
  topic: string;
  data: T;
  ts: number;  // Unix timestamp (seconds)
}

type Topic = 'fritzbox' | 'dirigera' | 'netatmo' | 'thermorossi' | 'hue' | 'sonos';

/**
 * Build a wss:// URL from an https:// base URL + auth credential.
 * Supports both API key (server-side) and JWT token (browser-side).
 */
function buildWsUrl(baseUrl: string, auth: { apiKey: string } | { token: string }): string {
  const wsBase = baseUrl
    .replace(/^https:\/\//, 'wss://')
    .replace(/^http:\/\//, 'ws://');

  if ('apiKey' in auth) {
    return `${wsBase}/ws/live?api_key=${encodeURIComponent(auth.apiKey)}`;
  } else {
    return `${wsBase}/ws/live?token=${encodeURIComponent(auth.token)}`;
  }
}

/**
 * Subscribe to a single provider topic over WebSocket.
 * Reconnects automatically with exponential backoff.
 * Re-subscribes on every reconnect (per D-14).
 */
export function useProviderData<T>(
  topic: Topic,
  auth: { apiKey: string } | { token: string },
  baseUrl: string
) {
  const wsUrl = buildWsUrl(baseUrl, auth);
  const [data, setData] = useState<T | null>(null);
  const [lastTs, setLastTs] = useState<number | null>(null);

  const { lastMessage, sendJsonMessage, readyState } = useWebSocket(wsUrl, {
    onOpen: () => {
      // Must re-subscribe on every (re)connect — subscriptions are per-connection
      sendJsonMessage({ action: 'subscribe', topic });
    },
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  });

  useEffect(() => {
    if (!lastMessage) return;
    try {
      const msg = JSON.parse(lastMessage.data) as WebSocketMessage<T>;
      if (msg.topic === topic) {
        setData(msg.data);
        setLastTs(msg.ts);
      }
    } catch {
      // Ignore malformed messages
    }
  }, [lastMessage, topic]);

  return {
    data,
    lastTs,
    isConnected: readyState === ReadyState.OPEN,
    readyState,
  };
}
```

### Usage in a Next.js component

```typescript
// components/FritzBoxStatus.tsx
'use client';

import { useProviderData } from '@/hooks/useProviderData';
import type { FritzBoxData } from '@/types/websocket';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const API_KEY = process.env.NEXT_PUBLIC_WS_API_KEY!;  // Server-side only; use token for browser

export function FritzBoxStatus() {
  const { data, isConnected, lastTs } = useProviderData<FritzBoxData>(
    'fritzbox',
    { apiKey: API_KEY },
    BASE_URL
  );

  if (!isConnected) return <p>Connecting...</p>;
  if (!data) return <p>Waiting for data...</p>;

  const onlineCount = data.devices?.filter(d => d.status === 1).length ?? 0;

  return (
    <div>
      <h2>Network — {onlineCount} devices online</h2>
      {data.wan && (
        <p>External IP: {data.wan.external_ip} — Uptime: {Math.floor((data.wan.uptime ?? 0) / 3600)}h</p>
      )}
      {data.bandwidth && (
        <p>
          Up: {(data.bandwidth.upstream_bps / 1_000_000).toFixed(1)} Mbps /
          Down: {(data.bandwidth.downstream_bps / 1_000_000).toFixed(1)} Mbps
        </p>
      )}
      {lastTs && <small>Last update: {new Date(lastTs * 1000).toLocaleTimeString()}</small>}
    </div>
  );
}
```

### Multi-topic usage

Subscribe to multiple topics independently — each hook creates its own subscription:

```typescript
const { data: fritzboxData } = useProviderData<FritzBoxData>('fritzbox', auth, BASE_URL);
const { data: dirigeraData } = useProviderData<DirigeraData>('dirigera', auth, BASE_URL);
const { data: sonosData }    = useProviderData<SonosData>('sonos', auth, BASE_URL);
```

Note that each `useProviderData` call opens a separate WebSocket connection. With `MAX_CONNECTIONS = 10`, you can only have 10 simultaneous WebSocket connections from all clients combined. If you need multiple topics from one component, consider a single shared connection subscribing to all topics and dispatching messages internally.

### Testing with wscat

```bash
# Install wscat
npm install -g wscat

# Connect with API key auth
wscat -c "wss://pdupun8zpr7exw43.myfritz.net/ws/live?api_key=YOUR_API_KEY"

# After connecting, subscribe to a topic:
> {"action": "subscribe", "topic": "fritzbox"}
< {"type": "snapshot", "topic": "fritzbox", "data": {"devices": [...], "bandwidth": {...}, "wan": {...}}, "ts": 1742728441}

# Subscribe to another topic:
> {"action": "subscribe", "topic": "dirigera"}
< {"type": "snapshot", "topic": "dirigera", "data": {"sensors": [...]}, "ts": 1742728442}

# Unsubscribe:
> {"action": "unsubscribe", "topic": "fritzbox"}

# Local dev (no TLS):
wscat -c "ws://localhost:8000/ws/live?api_key=YOUR_API_KEY"
```

---

## Error Codes / Close Codes

| Code | Meaning | Action |
|------|---------|--------|
| `1000` | Normal closure — server or client closed the connection cleanly | Reconnect if unexpected |
| `1008` | Auth rejected — invalid, expired, or missing `api_key`/`token` | Check credentials; see [Authentication](./auth.md) |
| `1011` | Internal error — a server-side send failed or exceeded the 5 s send timeout (slow/dead consumer) | Reconnect and re-subscribe |
| `1013` | Try Again Later — server at `MAX_CONNECTIONS = 10` | Wait and reconnect; check for stale connections in dev |
| `1006` | Abnormal closure (no close frame) — typically the Uvicorn keep-alive ping timed out or the network dropped | Reconnect with backoff |

> **Tip for code 1013 in development:** React StrictMode may open a connection on the first render and a second on the second render before the first has closed. Disable StrictMode during WebSocket development, or ensure the hook's cleanup path closes the old connection before the new one opens. react-use-websocket handles this automatically when the component fully unmounts.
