# WebSocket Real-Time API

Single endpoint for real-time push from all providers. The server sends data immediately when provider state changes — no polling required. Authentication is required via query parameter. Subscriptions are topic-based and per-connection.

---

## Quick Reference

| Protocol | Path | Description | Auth |
|----------|------|-------------|------|
| `wss://` | `/ws/live` | Real-time provider data push via topic subscription | Required (`?api_key=` or `?token=`) |

**Available topics:** `fritzbox`, `dirigera`, `netatmo`, `thermorossi`, `hue`, `sonos`, `raspi`

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
  - [hue](#hue)
  - [sonos](#sonos)
  - [raspi](#raspi)
- [Reconnection](#reconnection)
- [Complete Example](#complete-example)
- [Error Codes / Close Codes](#error-codes--close-codes)

---

## Overview

The `/ws/live` endpoint provides real-time push for all providers. Key behaviours:

- **Delta detection:** The server only pushes when provider data changes (MD5 fingerprint comparison). If the router returns the same device list twice in a row, no WebSocket message is sent.
- **Snapshot on subscribe:** When you subscribe to a topic, the server immediately sends the current cached state (`type: "snapshot"`). You do not have to wait for the next poll cycle.
- **Topic-based subscription:** A single connection can subscribe to any combination of topics. Each subscription is independent.
- **Enriched payloads:** All topic payloads include `data_freshness` and registry metadata (`custom_name`, `device_type`) matching the corresponding REST endpoints exactly.
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

Credentials are validated before the connection is accepted. An invalid or missing credential results in close code `1008`.

**How to get credentials:** See [Authentication](./auth.md) for API key creation (`POST /auth/api-keys`) and JWT login (`POST /auth/login`).

> **Security note:** `?api_key=` in the URL appears in server access logs, browser history, and network inspector tabs. Use short-lived **JWT tokens** for browser-side Next.js clients. Reserve API keys for server-side Next.js route handlers where the URL is not exposed to the browser.

---

## Connection Lifecycle

1. Client opens a WebSocket connection with auth query parameter.
2. Server validates credentials. On failure, accepts the connection then immediately closes with code `1008`.
3. If the server is already at `MAX_CONNECTIONS = 2`, it accepts the connection then closes with code `1013`.
4. If accepted, a per-connection `asyncio.Queue(maxsize=10)` is created. When the queue is full (slow consumer), the oldest pending message is dropped to make room for new events.
5. Client sends `subscribe` messages for the topics it needs.
6. Server sends a `snapshot` message immediately for each subscribed topic (if cache is populated).
7. Server sends `event` messages whenever provider data changes.

**Heartbeat:** The server sends a WebSocket `ping` frame every **30 seconds**. If no `pong` is received within **10 seconds**, the connection is considered dead and closed. Standard WebSocket clients (browser, react-use-websocket) handle pong automatically.

**Send timeout:** Each message write has a **5-second** timeout. A connection that cannot receive within 5 seconds is detected as dead and closed.

> **Warning — Max 2 concurrent connections (code 1013):** The server accepts only 2 simultaneous WebSocket connections. In Next.js development mode, React StrictMode double-invokes effects and hot reload can create a stale connection that hasn't closed yet when the new connection attempts to open. If you get immediate disconnections in dev, check browser DevTools for close code `1013`. Use one browser tab at a time during development.

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

**Valid topic values:** `fritzbox`, `dirigera`, `netatmo`, `thermorossi`, `hue`, `sonos`

On subscribe, the server immediately sends a `snapshot` message for the requested topic (if the cache is populated). Subsequent `event` messages arrive whenever the provider's data changes.

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

> **Enrichment metadata:** All topic payloads now include enrichment metadata (`data_freshness`, and where applicable: `is_stale`, `fetched_at`, `custom_name`, `device_type`). These fields match the corresponding REST API endpoints exactly, so clients consuming both channels receive identical data shapes.

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
  status: 0 | 1;              // 1 = online, 0 = offline
  custom_name?: string | null; // registry override, null if not set
  device_type?: string | null; // registry device type slug, null if not set
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
  is_stale: boolean;                  // true if cache is older than max_age_seconds
  fetched_at: string | null;          // ISO 8601 timestamp of last successful fetch, or null
  data_freshness: 'LIVE' | 'STALE';  // 'LIVE' if not stale, 'STALE' otherwise
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
      "custom_name": "Federico iPhone",
      "device_type": "smartphone"
    },
    {
      "ip": "192.168.178.31",
      "name": "MacBook-Federico",
      "mac": "11:22:33:44:55:66",
      "status": 1,
      "custom_name": null,
      "device_type": null
    },
    {
      "ip": "192.168.178.50",
      "name": "RaspberryPi",
      "mac": "DC:A6:32:AA:BB:CC",
      "status": 1,
      "custom_name": "Raspberry Pi",
      "device_type": "server"
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
  "fetched_at": "2026-03-28T14:00:00.000000Z",
  "data_freshness": "LIVE"
}
```

**Nullability:** `devices`, `bandwidth`, and `wan` are each independently nullable. A partial snapshot (e.g., `devices` populated but `bandwidth: null`) is valid.

---

### dirigera

IKEA DIRIGERA hub sensors: contact sensors (open/close), motion sensors, and occupancy sensors.

```typescript
interface DirigeraBaseSensor {
  id: string;
  relation_id: string | null;
  type: 'openCloseSensor' | 'occupancySensor' | 'motionSensor';
  custom_name: string | null;  // hub name, overridden by registry if registry has a value
  room: string | null;
  firmware_version: string | null;
  battery_percentage: number | null;
  is_reachable: boolean;
  last_seen: string | null;     // ISO 8601
  device_type?: string | null;  // registry device type slug, null if not set
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
  data_freshness: 'LIVE' | 'STALE';  // based on cache staleness
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
      "device_type": "motion_sensor"
    }
  ],
  "data_freshness": "LIVE"
}
```

**Nullability:** `sensors` is nullable. Individual fields `relation_id`, `custom_name`, `room`, `firmware_version`, `battery_percentage`, `last_seen`, `device_type` can be `null` if the hub did not report them or the device is not in the registry.

---

### netatmo

Netatmo energy system data: thermostat state, room temperatures, schedule, valve status.

```typescript
// Raw Netatmo cloud API homestatus response with enrichment metadata.
// This is a large nested object mirroring the Netatmo API format.
// For full schema, see the REST endpoint: GET /api/v1/netatmo/energy/homestatus
interface NetatmoData {
  body: Record<string, unknown>;  // Netatmo API envelope (home, rooms, modules)
  status: string;
  time_server: number;
  data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE';  // based on last poll recency
  [key: string]: unknown;  // additional Netatmo API top-level fields
}
```

The WebSocket payload is the raw `get_last_homestatus()` response from the Netatmo cloud API, enriched with `data_freshness`. Top-level structure follows Netatmo's standard API envelope:

```json
{
  "body": {
    "home": {
      "id": "abc123def456",
      "rooms": [...],
      "modules": [...]
    }
  },
  "status": "ok",
  "time_server": 1742728441,
  "data_freshness": "LIVE"
}
```

For the full field-by-field documentation, refer to `GET /api/v1/netatmo/energy/homestatus` in [Netatmo REST endpoints](./netatmo.md). The WebSocket payload is identical to that endpoint's response.

**Nullability:** The entire payload can be `null` if Netatmo cloud hasn't responded since server start.

---

### thermorossi

Thermorossi pellet stove status: operating state, power level, fan level, error codes.

```typescript
interface ThermorossiData {
  stove_state: string;            // 'off' | 'igniting' | 'working' | 'cooling' | 'alarm' | ...
  power_level: number | null;     // 1–5 (fuel feed rate)
  fan_level: number | null;       // 1–5 (combustion air)
  error_code: number | null;
  error_description: string | null;
  data_freshness: 'LIVE' | 'STALE';  // based on last successful poll recency
  custom_name?: string | null;    // registry override for device display name
  device_type?: string | null;    // registry device type slug
  [key: string]: unknown;         // additional raw WiNet fields may be present
}
```

The payload is the raw WiNet API status response enriched with registry metadata. The documented fields above are the key operational fields. Additional raw WiNet fields may be present — for full field documentation see `GET /api/v1/thermorossi/status` in [Thermorossi REST endpoints](./thermorossi.md).

**JSON example:**

```json
{
  "stove_state": "working",
  "power_level": 3,
  "fan_level": 2,
  "error_code": null,
  "error_description": null,
  "data_freshness": "LIVE",
  "custom_name": "Stufa Pellet",
  "device_type": "pellet_stove"
}
```

**Nullability:** The entire payload can be `null` if no status has been fetched since server start. `power_level`, `fan_level`, `error_code`, `error_description` can be `null` when the stove is off or when the field is not reported by the WiNet firmware. `custom_name` and `device_type` are `null` if the device is not in the registry.

---

### hue

Philips Hue Bridge lights and groups: light states, brightness, color temperature, group membership.

```typescript
interface HueLightState {
  on: boolean;
  bri: number | null;                          // brightness 0–254
  ct: number | null;                           // color temperature in mirek
  colormode: 'ct' | 'hs' | 'xy' | null;
  reachable: boolean;
  [key: string]: unknown;
}

interface HueLight {
  state: HueLightState;
  name: string;
  type: string;
  modelid: string | null;
  custom_name?: string | null;  // registry override for display name
  device_type?: string | null;  // registry device type slug
  [key: string]: unknown;
}

interface HueGroupState {
  any_on: boolean;
  all_on: boolean;
}

interface HueGroup {
  name: string;
  lights: string[];              // array of light_id strings
  state: HueGroupState;
  action: Record<string, unknown>;
  [key: string]: unknown;
}

interface HueData {
  lights: Record<string, HueLight> | null;    // key = light_id (e.g. "1", "2")
  groups: Record<string, HueGroup> | null;    // key = group_id (e.g. "1")
  data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE';  // based on Bridge reachability and poll age
}
```

`lights` and `groups` are raw Hue Bridge v1 API dicts — the keys are numeric IDs as strings (e.g. `"1"`, `"2"`).

**JSON example:**

```json
{
  "lights": {
    "1": {
      "state": {
        "on": true,
        "bri": 200,
        "ct": 370,
        "colormode": "ct",
        "reachable": true
      },
      "name": "Luce Soggiorno",
      "type": "Extended color light",
      "modelid": "LCT016",
      "custom_name": "Luce Soggiorno",
      "device_type": "hue_color"
    },
    "2": {
      "state": {
        "on": false,
        "bri": 128,
        "ct": 300,
        "colormode": "ct",
        "reachable": true
      },
      "name": "Luce Camera",
      "type": "Extended color light",
      "modelid": "LCT010",
      "custom_name": null,
      "device_type": null
    }
  },
  "groups": {
    "1": {
      "name": "Soggiorno",
      "lights": ["1"],
      "state": {
        "any_on": true,
        "all_on": true
      },
      "action": {
        "on": true,
        "bri": 200
      }
    }
  },
  "data_freshness": "LIVE"
}
```

**Nullability:** `lights` and `groups` are each independently nullable. `custom_name` and `device_type` per light are `null` if the light is not in the device registry.

---

### sonos

Sonos system: speaker details, group topology, coordinator assignments.

```typescript
interface SonosSpeaker {
  uid: string;
  name: string;
  ip: string;
  model: string | null;
  firmware: string | null;
  serial: string | null;
  role: 'soundbar' | 'sub' | 'surround' | 'speaker';
  is_visible: boolean;
  is_coordinator: boolean;
  custom_name?: string | null;  // registry override for display name
  device_type?: string | null;  // registry device type slug
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
  data_freshness: 'LIVE' | 'STALE' | 'UNREACHABLE';  // based on Sonos network reachability
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
      "is_coordinator": true,
      "custom_name": "Soundbar Soggiorno",
      "device_type": "soundbar"
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
      "is_coordinator": false,
      "custom_name": null,
      "device_type": null
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
  "data_freshness": "LIVE"
}
```

**Nullability:** `speakers` and `groups` are each independently nullable. `custom_name` and `device_type` per speaker are `null` if the speaker is not in the device registry.

---

### raspi

Raspberry Pi system stats: CPU, memory, disk, temperature, uptime, network, and load average. Data is always collected live on each poll — no caching involved.

```typescript
interface RaspiData {
  cpu_percent: number;          // current CPU usage percentage
  memory: Record<string, unknown>;  // RAM usage statistics
  disk: Record<string, unknown>;    // disk usage for root partition
  system: Record<string, unknown>;  // temperature, uptime, load, processes, network
  data_freshness: 'LIVE';       // always 'LIVE' — raspi is an on-demand provider
}
```

`data_freshness` is always `"LIVE"` for this topic. The Raspberry Pi collects data via `psutil` on each poll cycle — there is no cache with a freshness threshold.

**JSON example:**

```json
{
  "cpu_percent": 12.5,
  "memory": {
    "total": 8589934592,
    "available": 4294967296,
    "percent": 50.0,
    "used": 4294967296
  },
  "disk": {
    "total": 32212254720,
    "used": 12884901888,
    "free": 19327352832,
    "percent": 40.0
  },
  "system": {
    "temperature": 42.5,
    "uptime": 86400,
    "load_avg": [0.5, 0.3, 0.2],
    "process_count": 145
  },
  "data_freshness": "LIVE"
}
```

**Nullability:** Individual fields within `memory`, `disk`, and `system` may be `null` if `psutil` cannot read a specific metric on the hardware.

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

Note that each `useProviderData` call opens a separate WebSocket connection. With `MAX_CONNECTIONS = 2`, you can only have 2 simultaneous WebSocket connections from all clients combined. If you need multiple topics from one component, consider a single shared connection subscribing to all topics and dispatching messages internally.

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
| `1013` | Try Again Later — server at `MAX_CONNECTIONS = 2` | Wait and reconnect; check for stale connections in dev |

> **Tip for code 1013 in development:** React StrictMode may open a connection on the first render and a second on the second render before the first has closed. Disable StrictMode during WebSocket development, or ensure the hook's cleanup path closes the old connection before the new one opens. react-use-websocket handles this automatically when the component fully unmounts.
