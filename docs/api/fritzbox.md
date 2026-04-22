# Fritz!Box Provider API

**Base path:** `/api/v1/fritzbox`

Data is served from an in-memory cache polled from the Fritz!Box via TR-064. Fast-tier endpoints poll every 30 seconds; slow-tier endpoints poll every hour. If the router is unreachable and the cache is empty, endpoints return 503.

All endpoints require authentication via JWT Bearer token or API Key (`X-API-Key` header). See [Authentication](./README.md#authentication) for details.

---

## Quick Reference

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/v1/fritzbox/devices` | Paginated list of connected devices | Required |
| `GET` | `/api/v1/fritzbox/bandwidth` | Current WAN upload/download bandwidth | Required |
| `GET` | `/api/v1/fritzbox/wan` | WAN connection status and IP info | Required |
| `GET` | `/api/v1/fritzbox/system` | Router uptime, firmware, CPU load | Required |
| `GET` | `/api/v1/fritzbox/wifi/clients` | Active WiFi clients with signal and band | Required |
| `GET` | `/api/v1/fritzbox/wifi/networks` | Configured WiFi networks and enabled state | Required |
| `GET` | `/api/v1/fritzbox/network/dhcp/reservations` | Static DHCP leases | Required |
| `GET` | `/api/v1/fritzbox/network/port-forwarding` | Active port forwarding rules | Required |
| `GET` | `/api/v1/fritzbox/network/upnp` | UPnP status and port mappings | Required |
| `GET` | `/api/v1/fritzbox/network/mesh` | Mesh topology nodes and links | Required |
| `GET` | `/api/v1/fritzbox/telephony/dect` | Registered DECT handsets | Required |
| `GET` | `/api/v1/fritzbox/telephony/calls` | Paginated call history | Required |
| `GET` | `/api/v1/fritzbox/telephony/tam` | Telephone answering machine status | Required |
| `GET` | `/api/v1/fritzbox/history/bandwidth` | Raw bandwidth history (auto-granularity) | Required |
| `GET` | `/api/v1/fritzbox/history/devices` | Raw device presence history | Required |
| `GET` | `/api/v1/fritzbox/history/device-events` | Device join/leave event log | Required |
| `GET` | `/api/v1/fritzbox/history/bandwidth/hourly` | Hourly aggregated bandwidth | Required |
| `GET` | `/api/v1/fritzbox/history/bandwidth/daily` | Daily aggregated bandwidth | Required |
| `GET` | `/api/v1/fritzbox/history/devices/daily` | Daily device count history | Required |
| `GET` | `/api/v1/fritzbox/history/bandwidth/auto` | Auto-granularity bandwidth (hour/day switch) | Required |
| `GET` | `/api/v1/fritzbox/service-discovery` | TR-064 service descriptor debug dump | Required |
| `GET` | `/api/v1/fritzbox/budget-stats` | Data volume budget statistics | Required |

---

## Table of Contents

- [Real-time Data](#real-time-data)
- [WiFi](#wifi)
- [Network Services](#network-services)
- [Telephony](#telephony)
- [Historical Data](#historical-data)
- [Debug](#debug)
- [Legacy / Deprecated Endpoints](#legacy--deprecated-endpoints)

---

## Real-time Data

### GET /api/v1/fritzbox/devices

Connected device list from the Fritz!Box host table, paginated.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `limit` | integer | 100 | Items per page (1-1000) |
| `offset` | integer | 0 | Items to skip |

**Response:**

```json
{
  "items": [
    {
      "ip": "192.168.178.25",
      "name": "iPhone-Federico",
      "mac": "AA:BB:CC:DD:EE:FF",
      "status": 1,
      "provider_type": "fritzbox"
    },
    {
      "ip": "192.168.178.10",
      "name": "NAS-Server",
      "mac": "11:22:33:44:55:66",
      "status": 1,
      "provider_type": "fritzbox"
    }
  ],
  "total_count": 14,
  "limit": 100,
  "offset": 0
}
```

```typescript
interface Device {
  ip: string;
  name: string;
  mac: string;
  status: 0 | 1; // 1=online, 0=offline
  provider_type: string | null;
  custom_name: string | null;  // Custom name from device registry
  device_type: string | null;  // Device type from device registry
}

interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  limit: number;
  offset: number;
}
```

**curl:**

```bash
curl "YOUR_BASE_URL/api/v1/fritzbox/devices?limit=50" \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### GET /api/v1/fritzbox/bandwidth

Current WAN bandwidth — upstream/downstream rates and total bytes transferred.

**Authentication:** Required (JWT Bearer or API Key)

**Response:**

```json
{
  "upstream_bps": 12500000,
  "downstream_bps": 95000000,
  "bytes_sent": 45678901234,
  "bytes_received": 123456789012,
  "is_stale": false,
  "fetched_at": "2026-02-13T14:00:00Z"
}
```

```typescript
interface BandwidthResponse {
  upstream_bps: number;     // current upload speed in bits/s
  downstream_bps: number;   // current download speed in bits/s
  bytes_sent: number;       // cumulative bytes sent
  bytes_received: number;   // cumulative bytes received
  is_stale: boolean;
  fetched_at: string | null; // ISO 8601
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/fritzbox/bandwidth \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### GET /api/v1/fritzbox/wan

WAN connection status — public IP, link state, uptime, and maximum line speeds.

**Authentication:** Required (JWT Bearer or API Key)

**Response:**

```json
{
  "external_ip": "93.219.123.45",
  "is_connected": true,
  "is_linked": true,
  "uptime": 345678,
  "max_upstream_bps": 50000000,
  "max_downstream_bps": 250000000,
  "is_stale": false,
  "fetched_at": "2026-02-13T14:00:00Z"
}
```

```typescript
interface WanResponse {
  external_ip: string;
  is_connected: boolean;
  is_linked: boolean;
  uptime: number;           // connection uptime in seconds
  max_upstream_bps: number;
  max_downstream_bps: number;
  is_stale: boolean;
  fetched_at: string | null;
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/fritzbox/wan \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### GET /api/v1/fritzbox/system

Fritz!Box model, firmware version, pending update, and device uptime. Polled hourly via slow tier.

**Authentication:** Required (JWT Bearer or API Key)

**Response:**

```json
{
  "model": "FRITZ!Box 7590 AX",
  "firmware_version": "8.20",
  "update_available": "",
  "device_uptime_seconds": 432000,
  "device_uptime_formatted": "5 days, 0:00:00",
  "is_stale": false,
  "fetched_at": "2026-02-16T12:34:56Z"
}
```

```typescript
interface SystemResponse {
  model: string;
  firmware_version: string;
  update_available: string;   // empty string = no update available
  device_uptime_seconds: number;
  device_uptime_formatted: string; // e.g. "5 days, 0:00:00"
  is_stale: boolean;
  fetched_at: string | null;
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/fritzbox/system \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## WiFi

### GET /api/v1/fritzbox/wifi/clients

All currently connected WiFi clients across all bands. Optional band filter.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `band` | string | — | Filter by band: `2.4GHz`, `5GHz`, `guest` |
| `limit` | integer | 100 | Items per page (1-1000) |
| `offset` | integer | 0 | Items to skip |

**Response:**

```json
{
  "items": [
    {
      "hostname": "iPhone-Federico",
      "mac": "AA:BB:CC:DD:EE:FF",
      "ip": "192.168.178.25",
      "band": "5GHz",
      "ssid": "HomeNetwork",
      "signal_strength": 85,
      "link_speed_mbps": 866,
      "is_active": true
    }
  ],
  "total_count": 8,
  "limit": 100,
  "offset": 0
}
```

```typescript
interface WiFiClientModel {
  hostname: string;
  mac: string;
  ip: string;
  band: string;          // "2.4GHz" | "5GHz" | "guest" | "wlanN"
  ssid: string;
  signal_strength: number; // 0-100 Fritz!Box quality scale (not dBm)
  link_speed_mbps: number;
  is_active: boolean;
}
```

**curl:**

```bash
# All WiFi clients
curl "YOUR_BASE_URL/api/v1/fritzbox/wifi/clients" \
  -H "X-API-Key: YOUR_API_KEY"

# Only 5GHz clients
curl "YOUR_BASE_URL/api/v1/fritzbox/wifi/clients?band=5GHz" \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### GET /api/v1/fritzbox/wifi/networks

WiFi network configuration per band — SSID, channel, and security settings. Polled hourly via slow tier.

**Authentication:** Required (JWT Bearer or API Key)

**Response:**

```json
{
  "networks": [
    {
      "service": 1,
      "band": "2.4GHz",
      "ssid": "HomeNetwork",
      "channel": 6,
      "possible_channels": "1,2,3,4,5,6,7,8,9,10,11,12,13",
      "is_enabled": true,
      "beacon_type": "11iandWPA3"
    },
    {
      "service": 2,
      "band": "5GHz",
      "ssid": "HomeNetwork",
      "channel": 36,
      "possible_channels": "36,40,44,48,52,56,60,64",
      "is_enabled": true,
      "beacon_type": "11iandWPA3"
    }
  ],
  "is_stale": false,
  "fetched_at": "2026-02-17T10:30:00Z"
}
```

```typescript
interface WiFiNetworkModel {
  service: number;       // 1=2.4GHz, 2=5GHz, 3=guest
  band: string;
  ssid: string;
  channel: number;
  possible_channels: string; // comma-separated list
  is_enabled: boolean;
  beacon_type: string;   // e.g. "11iandWPA3"
}

interface WiFiStatusResponse {
  networks: WiFiNetworkModel[];
  is_stale: boolean;
  fetched_at: string | null;
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/fritzbox/wifi/networks \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## Network Services

### GET /api/v1/fritzbox/network/dhcp/reservations

DHCP reservations (static IP assignments). Derived from the device cache — no extra TR-064 calls. Polled every 30 seconds.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `limit` | integer | 100 | Items per page (1-1000) |
| `offset` | integer | 0 | Items to skip |

**Response:**

```json
{
  "items": [
    {
      "ip": "192.168.178.10",
      "name": "NAS-Server",
      "mac": "AA:BB:CC:DD:EE:FF",
      "interface_type": "Ethernet",
      "address_source": "Static"
    }
  ],
  "total_count": 5,
  "limit": 100,
  "offset": 0
}
```

```typescript
interface DhcpReservationModel {
  ip: string;
  name: string;
  mac: string;
  interface_type: string;   // "Ethernet" | "WLAN" | ""
  address_source: string;   // always "Static"
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/fritzbox/network/dhcp/reservations \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### GET /api/v1/fritzbox/network/port-forwarding

Static port forwarding rules (rules with `lease_duration == 0`). UPnP-created rules are excluded — see `/network/upnp` for those. Polled hourly.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `limit` | integer | 100 | Items per page (1-1000) |
| `offset` | integer | 0 | Items to skip |

**Response:**

```json
{
  "items": [
    {
      "external_port": 8443,
      "internal_port": 443,
      "protocol": "TCP",
      "internal_client": "192.168.178.10",
      "enabled": true,
      "description": "HTTPS NAS",
      "lease_duration": 0
    }
  ],
  "total_count": 3,
  "limit": 100,
  "offset": 0
}
```

```typescript
interface PortForwardingRuleModel {
  external_port: number;
  internal_port: number;
  protocol: "TCP" | "UDP";
  internal_client: string;
  enabled: boolean;
  description: string;
  lease_duration: number; // 0 = static rule
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/fritzbox/network/port-forwarding \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### GET /api/v1/fritzbox/network/upnp

UPnP status and list of UPnP-created port mappings (`lease_duration > 0`). Polled hourly.

**Authentication:** Required (JWT Bearer or API Key)

**Response:**

```json
{
  "enabled": true,
  "upnp_ports": [
    {
      "external_port": 51234,
      "internal_port": 51234,
      "protocol": "UDP",
      "internal_client": "192.168.178.25",
      "enabled": true,
      "description": "BitTorrent",
      "lease_duration": 3600
    }
  ],
  "is_stale": false,
  "fetched_at": "2026-02-17T10:30:00Z"
}
```

```typescript
interface UPnPStatusResponse {
  enabled: boolean;
  upnp_ports: PortForwardingRuleModel[];
  is_stale: boolean;
  fetched_at: string | null;
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/fritzbox/network/upnp \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### GET /api/v1/fritzbox/network/mesh

Full mesh topology — all Fritz!Box nodes and their connections. Polled hourly with a 15-minute cache TTL.

**Authentication:** Required (JWT Bearer or API Key)

**Response:**

```json
{
  "schema_version": "1.0",
  "node_count": 2,
  "link_count": 1,
  "nodes": [
    {
      "uid": "node-000000000000",
      "name": "FRITZ!Box 7590 AX",
      "model": "FRITZ!Box 7590 AX",
      "mac": "AA:BB:CC:DD:EE:01",
      "vendor": "AVM",
      "is_meshed": true,
      "device_category": "FRITZ!Box"
    },
    {
      "uid": "node-aabbccddeeff",
      "name": "FRITZ!Repeater 1200",
      "model": "FRITZ!Repeater 1200",
      "mac": "AA:BB:CC:DD:EE:02",
      "vendor": "AVM",
      "is_meshed": true,
      "device_category": "FRITZ!Repeater"
    }
  ],
  "links": [
    {
      "source_uid": "node-000000000000",
      "source_name": "FRITZ!Box 7590 AX",
      "target_uid": "node-aabbccddeeff",
      "target_name": "FRITZ!Repeater 1200",
      "type": "WLAN",
      "state": "CONNECTED",
      "cur_rx_kbps": 866000.0,
      "cur_tx_kbps": 866000.0,
      "max_rx_kbps": 1200000.0,
      "max_tx_kbps": 1200000.0
    }
  ],
  "is_stale": false,
  "fetched_at": "2026-02-17T10:30:00Z"
}
```

```typescript
interface MeshNodeModel {
  uid: string;
  name: string;
  model: string;
  mac: string;
  vendor: string;
  is_meshed: boolean;
  device_category: string;
}

interface MeshLinkModel {
  source_uid: string;
  source_name: string;
  target_uid: string;
  target_name: string;
  type: string | null;       // "WLAN" | "LAN" | "DECT" | etc.
  state: string | null;      // "CONNECTED" | "DISCONNECTED"
  cur_rx_kbps: number | null;
  cur_tx_kbps: number | null;
  max_rx_kbps: number | null;
  max_tx_kbps: number | null;
}

interface MeshTopologyResponse {
  schema_version: string | null;
  node_count: number;
  link_count: number;
  nodes: MeshNodeModel[];
  links: MeshLinkModel[];
  is_stale: boolean;
  fetched_at: string | null;
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/fritzbox/network/mesh \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## Telephony

### GET /api/v1/fritzbox/telephony/dect

Registered DECT handsets. Polled hourly. Model name is not available via TR-064 and is always `null`.

**Authentication:** Required (JWT Bearer or API Key)

**Response:**

```json
{
  "handsets": [
    {
      "dect_id": 1,
      "name": "Wohnzimmer",
      "phonebook_id": 0,
      "model": null,
      "registration_status": "registered"
    },
    {
      "dect_id": 2,
      "name": "Schlafzimmer",
      "phonebook_id": 0,
      "model": null,
      "registration_status": "registered"
    }
  ],
  "handset_count": 2,
  "is_stale": false,
  "fetched_at": "2026-02-17T13:00:00Z"
}
```

```typescript
interface DectHandsetModel {
  dect_id: number;
  name: string;
  phonebook_id: number;
  model: null;                      // always null (TR-064 limitation)
  registration_status: "registered"; // always "registered"
}

interface DectListResponse {
  handsets: DectHandsetModel[];
  handset_count: number;
  is_stale: boolean;
  fetched_at: string | null;
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/fritzbox/telephony/dect \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### GET /api/v1/fritzbox/telephony/calls

Recent call history with optional type filter. Polled hourly.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `call_type` | string | — | Filter: `received`, `missed`, `outgoing`, `rejected` |
| `limit` | integer | 100 | Items per page (1-1000) |
| `offset` | integer | 0 | Items to skip |

**Call type codes:**

| Code | `call_type` | Description |
|------|-------------|-------------|
| 1 | `received` | Answered incoming call |
| 2 | `missed` | Unanswered incoming call |
| 3 | `outgoing` | Outgoing call |
| 9 | `active_received` | Active incoming call |
| 10 | `rejected` | Rejected incoming call |
| 11 | `active_outgoing` | Active outgoing call |

**Response:**

```json
{
  "items": [
    {
      "call_type": "received",
      "call_type_code": 1,
      "name": "Max Mustermann",
      "caller": "+49301234567",
      "called": "030987654",
      "caller_number": "+49301234567",
      "called_number": "030987654",
      "date": "2026-02-17T10:30:00",
      "duration_seconds": 183,
      "device": "Wohnzimmer",
      "port": "FON1"
    },
    {
      "call_type": "missed",
      "call_type_code": 2,
      "name": null,
      "caller": "+49301234567",
      "called": "030987654",
      "caller_number": "+49301234567",
      "called_number": "030987654",
      "date": "2026-02-17T09:15:00",
      "duration_seconds": null,
      "device": "Wohnzimmer",
      "port": "FON1"
    }
  ],
  "total_count": 42,
  "limit": 100,
  "offset": 0
}
```

```typescript
interface CallRecordModel {
  call_type: "received" | "missed" | "outgoing" | "active_received" | "rejected" | "active_outgoing";
  call_type_code: number;
  name: string | null;         // caller name from phonebook
  caller: string | null;       // caller number (incoming calls)
  called: string | null;       // called number (outgoing calls)
  caller_number: string | null;
  called_number: string | null;
  date: string | null;         // ISO 8601 timestamp
  duration_seconds: number | null; // null for missed/rejected calls
  device: string | null;       // handset that handled the call
  port: string | null;         // Fritz!Box port/line used
}
```

**curl:**

```bash
# All calls
curl "YOUR_BASE_URL/api/v1/fritzbox/telephony/calls" \
  -H "X-API-Key: YOUR_API_KEY"

# Only missed calls
curl "YOUR_BASE_URL/api/v1/fritzbox/telephony/calls?call_type=missed" \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### GET /api/v1/fritzbox/telephony/tam

Answering machine (TAM) voicemail status — total messages, new messages, and enabled state. Polled hourly.

**Authentication:** Required (JWT Bearer or API Key)

**Response:**

```json
{
  "tam": {
    "total_messages": 3,
    "new_messages": 1,
    "tam_enabled": true,
    "tam_name": "Anrufbeantworter"
  },
  "is_stale": false,
  "fetched_at": "2026-02-17T13:00:00Z"
}
```

```typescript
interface TamStatusModel {
  total_messages: number;
  new_messages: number;
  tam_enabled: boolean;
  tam_name: string | null;
}

interface TamStatusResponse {
  tam: TamStatusModel;
  is_stale: boolean;
  fetched_at: string | null;
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/fritzbox/telephony/tam \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## Historical Data

All history endpoints read from SQLite. Data is written by the Fritz!Box poller every 30 seconds (raw), aggregated hourly (hourly tables), and aggregated daily (daily tables).

### GET /api/v1/fritzbox/history/bandwidth

Raw bandwidth history for the past N hours. One record per polling cycle (~30s interval).

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `hours` | integer | 24 | Hours of history (1-168, max 7 days) |
| `limit` | integer | 100 | Items per page (1-1000) |
| `offset` | integer | 0 | Items to skip |

**Response:**

```json
{
  "items": [
    {
      "timestamp": 1770989851,
      "bytes_sent": 12345678,
      "bytes_received": 87654321,
      "upstream_rate": 50000000,
      "downstream_rate": 100000000,
      "latency_ms": 12.5,
      "connection_uptime": 3600,
      "external_ip": "93.219.123.45",
      "connection_type": "DSL"
    }
  ],
  "total_count": 2880,
  "limit": 100,
  "offset": 0
}
```

```typescript
interface BandwidthHistoryRecord {
  timestamp: number;           // Unix timestamp
  bytes_sent: number;
  bytes_received: number;
  upstream_rate: number;       // bits per second
  downstream_rate: number;     // bits per second
  latency_ms: number | null;
  connection_uptime: number | null; // seconds
  external_ip: string | null;
  connection_type: string | null;   // "DSL" | "Ethernet" | etc.
}
```

**curl:**

```bash
curl "YOUR_BASE_URL/api/v1/fritzbox/history/bandwidth?hours=6&limit=100" \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### GET /api/v1/fritzbox/history/devices

Raw device presence history — one record per device per polling snapshot.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `hours` | integer | 24 | Hours of history (1-168) |
| `limit` | integer | 100 | Items per page (1-1000) |
| `offset` | integer | 0 | Items to skip |

**Response:**

```json
{
  "items": [
    {
      "timestamp": 1770989851,
      "ip": "192.168.178.25",
      "name": "iPhone-Federico",
      "mac": "AA:BB:CC:DD:EE:FF",
      "is_online": 1,
      "connection_type": "wifi"
    }
  ],
  "total_count": 40320,
  "limit": 100,
  "offset": 0
}
```

```typescript
interface DeviceHistoryRecord {
  timestamp: number;
  ip: string;
  name: string;
  mac: string;
  is_online: 0 | 1;
  connection_type: string | null; // "wifi" | "ethernet" | null
}
```

**curl:**

```bash
curl "YOUR_BASE_URL/api/v1/fritzbox/history/devices?hours=24&limit=100" \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### GET /api/v1/fritzbox/history/device-events

Device connection/disconnection events — computed by comparing consecutive snapshots. Only state changes are returned (not raw snapshots).

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `hours` | integer | 24 | Hours of history (1-168) |
| `mac` | string | — | Filter by MAC address |
| `limit` | integer | 100 | Items per page (1-1000) |
| `offset` | integer | 0 | Items to skip |

**Response:**

```json
{
  "items": [
    {
      "timestamp": 1773824500,
      "mac": "AA:BB:CC:DD:EE:FF",
      "name": "iPhone-Federico",
      "ip": "192.168.178.25",
      "event_type": "connected"
    },
    {
      "timestamp": 1773820900,
      "mac": "AA:BB:CC:DD:EE:FF",
      "name": "iPhone-Federico",
      "ip": "192.168.178.25",
      "event_type": "disconnected"
    }
  ],
  "total_count": 42,
  "limit": 100,
  "offset": 0
}
```

```typescript
interface DeviceEventRecord {
  timestamp: number;
  mac: string;
  name: string;
  ip: string;
  event_type: "connected" | "disconnected";
}
```

**curl:**

```bash
curl "YOUR_BASE_URL/api/v1/fritzbox/history/device-events?hours=24&limit=100" \
  -H "X-API-Key: YOUR_API_KEY"
```

**Filter by device:**

```bash
curl "YOUR_BASE_URL/api/v1/fritzbox/history/device-events?hours=48&mac=AA:BB:CC:DD:EE:FF" \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### GET /api/v1/fritzbox/history/bandwidth/hourly

Hourly bandwidth aggregations (avg/min/max per hour). Use for 1-30 day charts.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `days` | integer | 7 | Days of history (1-365) |
| `limit` | integer | 100 | Items per page (1-1000) |
| `offset` | integer | 0 | Items to skip |

**Response:**

```json
{
  "items": [
    {
      "hour_timestamp": 1771179600,
      "avg_upstream_rate": 50000.0,
      "min_upstream_rate": 40000,
      "max_upstream_rate": 60000,
      "avg_downstream_rate": 100000.0,
      "min_downstream_rate": 80000,
      "max_downstream_rate": 120000,
      "avg_bytes_sent": 1000.0,
      "avg_bytes_received": 5000.0,
      "sample_count": 120
    }
  ],
  "total_count": 168,
  "limit": 100,
  "offset": 0
}
```

```typescript
interface BandwidthHourlyRecord {
  hour_timestamp: number;      // Unix timestamp of hour start
  avg_upstream_rate: number;
  min_upstream_rate: number;
  max_upstream_rate: number;
  avg_downstream_rate: number;
  min_downstream_rate: number;
  max_downstream_rate: number;
  avg_bytes_sent: number;
  avg_bytes_received: number;
  sample_count: number;        // raw samples aggregated into this hour
}
```

**curl:**

```bash
curl "YOUR_BASE_URL/api/v1/fritzbox/history/bandwidth/hourly?days=7" \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### GET /api/v1/fritzbox/history/bandwidth/daily

Daily bandwidth aggregations (avg/min/max per day). Use for 30-day+ charts.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `days` | integer | 30 | Days of history (1-3650) |
| `limit` | integer | 100 | Items per page (1-1000) |
| `offset` | integer | 0 | Items to skip |

**Response:**

```json
{
  "items": [
    {
      "day_timestamp": 1771113600,
      "avg_upstream_rate": 50000.0,
      "min_upstream_rate": 30000,
      "max_upstream_rate": 70000,
      "avg_downstream_rate": 100000.0,
      "min_downstream_rate": 60000,
      "max_downstream_rate": 140000,
      "avg_bytes_sent": 1200.0,
      "avg_bytes_received": 6000.0,
      "sample_count": 24
    }
  ],
  "total_count": 30,
  "limit": 100,
  "offset": 0
}
```

```typescript
interface BandwidthDailyRecord {
  day_timestamp: number;       // Unix timestamp of day start (00:00 UTC)
  avg_upstream_rate: number;
  min_upstream_rate: number;
  max_upstream_rate: number;
  avg_downstream_rate: number;
  min_downstream_rate: number;
  max_downstream_rate: number;
  avg_bytes_sent: number;
  avg_bytes_received: number;
  sample_count: number;        // hourly samples aggregated into this day
}
```

**curl:**

```bash
curl "YOUR_BASE_URL/api/v1/fritzbox/history/bandwidth/daily?days=30" \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### GET /api/v1/fritzbox/history/devices/daily

Daily device presence aggregations — online/offline counts per hour-of-day bucket.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `days` | integer | 30 | Days of history (1-3650) |
| `limit` | integer | 100 | Items per page (1-1000) |
| `offset` | integer | 0 | Items to skip |

**Note:** Returns 24 rows per day (one per `hour_bucket`), so `total_count` = days × 24.

**Response:**

```json
{
  "items": [
    {
      "day_timestamp": 1771113600,
      "hour_bucket": 14,
      "online_count": 10,
      "offline_count": 5,
      "total_devices": 15
    }
  ],
  "total_count": 720,
  "limit": 100,
  "offset": 0
}
```

```typescript
interface DeviceDailyRecord {
  day_timestamp: number;  // Unix timestamp of day start (00:00 UTC)
  hour_bucket: number;    // 0-23, hour of day
  online_count: number;
  offline_count: number;
  total_devices: number;
}
```

**curl:**

```bash
curl "YOUR_BASE_URL/api/v1/fritzbox/history/devices/daily?days=7" \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### GET /api/v1/fritzbox/history/bandwidth/auto

Bandwidth history with automatic granularity selection. Selects hourly data for `days <= 7`, daily data for `days > 7`. The recommended endpoint for charts when the time range is dynamic.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `days` | integer | 7 | Days of history (1-3650) |
| `limit` | integer | 100 | Items per page (1-1000) |
| `offset` | integer | 0 | Items to skip |

**Granularity selection:**

| `days` range | Granularity | Source table |
|--------------|-------------|--------------|
| <= 7 | `hourly` | bandwidth_hourly |
| > 7 | `daily` | bandwidth_daily |

**Response:**

```json
{
  "items": [
    {
      "timestamp": 1771179600,
      "granularity": "hourly",
      "avg_upstream_rate": 50000.0,
      "min_upstream_rate": 40000,
      "max_upstream_rate": 60000,
      "avg_downstream_rate": 100000.0,
      "min_downstream_rate": 80000,
      "max_downstream_rate": 120000,
      "avg_bytes_sent": 1000.0,
      "avg_bytes_received": 5000.0,
      "sample_count": 120
    }
  ],
  "total_count": 168,
  "limit": 100,
  "offset": 0
}
```

```typescript
interface BandwidthAggregatedRecord {
  timestamp: number;           // Unix timestamp of period start
  granularity: "hourly" | "daily";
  avg_upstream_rate: number;
  min_upstream_rate: number;
  max_upstream_rate: number;
  avg_downstream_rate: number;
  min_downstream_rate: number;
  max_downstream_rate: number;
  avg_bytes_sent: number;
  avg_bytes_received: number;
  sample_count: number;
}
```

**curl:**

```bash
# Auto-select granularity for last 14 days (returns daily data)
curl "YOUR_BASE_URL/api/v1/fritzbox/history/bandwidth/auto?days=14" \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## Debug

These endpoints are intended for development, debugging, and operational insight. Do not use in production polling loops.

### GET /api/v1/fritzbox/service-discovery

Introspects all available TR-064 services, actions, and action arguments from the Fritz!Box. Useful for understanding what capabilities are exposed.

**Warning:** This is a heavyweight operation (1-2 second response time) that performs live TR-064 enumeration. Use for debugging only.

**Authentication:** Required (JWT Bearer or API Key)

**Response:**

```json
{
  "model": "FRITZ!Box 7590 AX",
  "firmware": {
    "model": "FRITZ!Box 7590 AX",
    "serial": "ABCDEF123456",
    "firmware_version": "8.20",
    "hardware_version": "233"
  },
  "service_count": 1,
  "services": {
    "WANIPConnection:1": {
      "version": "1",
      "service_type": "urn:dslforum-org:service:WANIPConnection:1",
      "control_url": "/upnp/control/WANIPConn1",
      "actions": [
        {
          "name": "GetExternalIPAddress",
          "arguments": [
            {"name": "NewExternalIPAddress", "direction": "out", "data_type": "string"}
          ]
        }
      ],
      "action_count": 1
    }
  }
}
```

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/fritzbox/service-discovery \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### GET /api/v1/fritzbox/budget-stats

TR-064 request budget statistics — rolling window utilization and health status. Useful for monitoring polling rate limits.

**Authentication:** Required (JWT Bearer or API Key)

**Response:**

```json
{
  "window_seconds": 30,
  "current_window_requests": 2,
  "soft_limit": 5,
  "hard_limit": 6,
  "total_lifetime_requests": 1234,
  "warning_count": 0,
  "utilization_percent": 40.0,
  "status": "ok",
  "message": "Budget OK - 40.0% utilization"
}
```

```typescript
interface BudgetStats {
  window_seconds: number;
  current_window_requests: number;
  soft_limit: number;
  hard_limit: number;
  total_lifetime_requests: number;
  warning_count: number;
  utilization_percent: number;
  status: "ok" | "warning" | "danger";
  message: string;
}
```

**Status interpretation:**

| Status | Condition |
|--------|-----------|
| `ok` | utilization < 80% |
| `warning` | utilization 80-99% |
| `danger` | utilization >= 100% (hard limit reached) |

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/fritzbox/budget-stats \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## Legacy / Deprecated Endpoints

These four endpoints exist for backward compatibility with pre-v1 clients and are marked `deprecated=True` in the FastAPI router. They proxy to the corresponding Fritz!Box provider endpoints. **Do not use these in new integrations.**

| Method | Path | Status | Replacement |
|--------|------|--------|-------------|
| `GET` | `/api/v1/bandwidth` | Deprecated | `GET /api/v1/fritzbox/bandwidth` |
| `GET` | `/api/v1/wan` | Deprecated | `GET /api/v1/fritzbox/wan` |
| `GET` | `/api/v1/history/bandwidth` | Deprecated | `GET /api/v1/fritzbox/history/bandwidth` |
| `GET` | `/api/v1/history/devices` | Deprecated | `GET /api/v1/fritzbox/history/devices` |

### GET /api/v1/bandwidth (Deprecated)

**Deprecated** — use `/api/v1/fritzbox/bandwidth` instead.

Proxies to the Fritz!Box provider bandwidth endpoint. Returns current WAN upload/download bandwidth from the in-memory cache.

**Authentication:** Required (JWT Bearer or API Key)

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/bandwidth \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### GET /api/v1/wan (Deprecated)

**Deprecated** — use `/api/v1/fritzbox/wan` instead.

Proxies to the Fritz!Box provider WAN status endpoint. Returns WAN connection status and external IP information from the in-memory cache.

**Authentication:** Required (JWT Bearer or API Key)

**curl:**

```bash
curl YOUR_BASE_URL/api/v1/wan \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### GET /api/v1/history/bandwidth (Deprecated)

**Deprecated** — use `/api/v1/fritzbox/history/bandwidth` instead.

Returns paginated bandwidth history records. Accepts `hours` (1–168, default 24), `limit`, and `offset` query parameters.

**Authentication:** Required (JWT Bearer or API Key)

**curl:**

```bash
curl "YOUR_BASE_URL/api/v1/history/bandwidth?hours=24&limit=100" \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### GET /api/v1/history/devices (Deprecated)

**Deprecated** — use `/api/v1/fritzbox/history/devices` instead.

Returns paginated device presence history records. Accepts `hours` (1–168, default 24), `limit`, and `offset` query parameters.

**Authentication:** Required (JWT Bearer or API Key)

**curl:**

```bash
curl "YOUR_BASE_URL/api/v1/history/devices?hours=24&limit=100" \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## Frontend Component Suggestions

| Endpoint Group | Component | Data Mapping | Usage Hint |
|----------------|-----------|--------------|------------|
| Health | StatusBadge + StatCards | `status` -> badge color; `uptime`, `model`, `firmware` -> stat cards | Show green/yellow/red badge; display model and firmware version as info cards |
| Bandwidth | StatCards | `downstream_kbps`, `upstream_kbps`, `max_downstream`, `max_upstream` -> metric cards | Show current vs max throughput; use ProgressBar for utilization percentage |
| Connected Devices | Table | `devices[]` -> rows; columns: name, ip, mac, connection_type, online (StatusBadge) | Sortable by name and connection type; use Badge for online/offline state |
| WAN Status | DataCard | `external_ip`, `connection_status`, `uptime`, `dns_servers` -> labeled fields | Single card with key WAN metrics; StatusBadge for connection_status |
| WiFi | Table + Toggle | `wifi_networks[]` -> rows; columns: ssid, band, channel, device_count, enabled (Toggle) | Table for network list; Toggle to enable/disable per-band |
| Network Services and Telephony | Table | `port_mappings[]`, `call_log[]` -> rows | Separate tables for port forwards and call log; call log sorted by date descending |
| Historical Data | LineChart or AreaChart | `data_points[]` -> time series; x-axis: timestamp, y-axis: value (bandwidth, device count) | API returns auto-granularity data -- chart component must handle variable time intervals (raw within 48h, hourly within 30d, daily beyond) |
| Debug | DataCard | `service_discovery`, `budget_stats` -> labeled fields | Developer-only view; render raw JSON as formatted key-value pairs |

---

## Real-Time (WebSocket)

For real-time push updates without polling, subscribe to the `fritzbox` topic on the WebSocket endpoint.

See [WebSocket API - fritzbox topic](./websocket.md#fritzbox) for the full payload schema, TypeScript interfaces, and subscription example.

**Topic:** `fritzbox`
**Snapshot on subscribe:** Yes -- current devices, bandwidth, and WAN state
