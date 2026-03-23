# Rooms API

**Base path:** `/api/v1/rooms`

Room management for organizing smart home devices by location. Provides CRUD operations for rooms, device association (assign/remove devices to rooms), per-room and whole-house status aggregation, and health statistics. 11 endpoints. Most read endpoints are public; write and association endpoints require authentication.

---

## Quick Reference

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/v1/rooms/` | List all rooms with device counts | No |
| `POST` | `/api/v1/rooms/` | Create a new room | Yes |
| `GET` | `/api/v1/rooms/health` | Room count and device statistics | No |
| `GET` | `/api/v1/rooms/house/status` | Aggregated status for all rooms | No |
| `GET` | `/api/v1/rooms/{room_id}` | Get room by ID | No |
| `PUT` | `/api/v1/rooms/{room_id}` | Update a room | Yes |
| `DELETE` | `/api/v1/rooms/{room_id}` | Delete a room | Yes |
| `GET` | `/api/v1/rooms/{room_id}/devices` | List devices in a room | No |
| `POST` | `/api/v1/rooms/{room_id}/devices` | Assign device to room | Yes |
| `DELETE` | `/api/v1/rooms/{room_id}/devices/{device_registry_id}` | Remove device from room | Yes |
| `GET` | `/api/v1/rooms/{room_id}/status` | Aggregated status for one room | No |

---

## Table of Contents

- [Room CRUD](#room-crud)
  - [GET /rooms/](#get-rooms)
  - [POST /rooms/](#post-rooms)
  - [GET /rooms/{room_id}](#get-roomsroom_id)
  - [PUT /rooms/{room_id}](#put-roomsroom_id)
  - [DELETE /rooms/{room_id}](#delete-roomsroom_id)
- [Device Association](#device-association)
  - [GET /rooms/{room_id}/devices](#get-roomsroom_iddevices)
  - [POST /rooms/{room_id}/devices](#post-roomsroom_iddevices)
  - [DELETE /rooms/{room_id}/devices/{device_registry_id}](#delete-roomsroom_iddevicesdevice_registry_id)
- [Status & Health](#status--health)
  - [GET /rooms/health](#get-roomshealth)
  - [GET /rooms/house/status](#get-roomshousestatus)
  - [GET /rooms/{room_id}/status](#get-roomsroom_idstatus)
- [TypeScript Interfaces](#typescript-interfaces)

---

## Room CRUD

### GET /rooms/

Return all rooms with their device counts.

**Authentication:** Not required

**Response (200):**

```json
[
  {
    "id": 1,
    "name": "Soggiorno",
    "description": "Piano terra",
    "created_at": 1711094400,
    "updated_at": 1711094400,
    "device_count": 3
  },
  {
    "id": 2,
    "name": "Camera da letto",
    "description": null,
    "created_at": 1711094500,
    "updated_at": 1711094500,
    "device_count": 1
  }
]
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 503 | Room DB not initialized |

**curl:**

```bash
curl http://localhost:8000/api/v1/rooms/
```

---

### POST /rooms/

Create a new room.

**Authentication:** Required (JWT Bearer or API Key)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique room name (1–100 chars) |
| `description` | string \| null | No | Optional room description (max 500 chars) |

**Response (201):**

```json
{
  "id": 3,
  "name": "Cucina",
  "description": "Piano terra, adiacente al soggiorno",
  "created_at": 1711100000,
  "updated_at": 1711100000
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 409 | Room with this name already exists |
| 503 | Room DB not initialized |

**curl:**

```bash
curl -X POST http://localhost:8000/api/v1/rooms/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Cucina", "description": "Piano terra"}'
```

---

### GET /rooms/{room_id}

Return a single room by ID. Does not include device_count.

**Authentication:** Not required

**Response (200):**

```json
{
  "id": 1,
  "name": "Soggiorno",
  "description": "Piano terra",
  "created_at": 1711094400,
  "updated_at": 1711094400
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 404 | Room not found |
| 503 | Room DB not initialized |

**curl:**

```bash
curl http://localhost:8000/api/v1/rooms/1
```

---

### PUT /rooms/{room_id}

Update an existing room's name and description. Both fields must be provided.

**Authentication:** Required (JWT Bearer or API Key)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | New room name (1–100 chars) |
| `description` | string \| null | No | New room description (max 500 chars) |

**Response (200):**

```json
{
  "id": 1,
  "name": "Soggiorno Principale",
  "description": "Piano terra",
  "created_at": 1711094400,
  "updated_at": 1711200000
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 404 | Room not found |
| 409 | New name duplicates an existing room |
| 503 | Room DB not initialized |

**curl:**

```bash
curl -X PUT http://localhost:8000/api/v1/rooms/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Soggiorno Principale", "description": "Piano terra"}'
```

---

### DELETE /rooms/{room_id}

Delete a room and its device associations.

> **Note:** Devices themselves remain in the registry — only room membership is removed. No devices are deleted from the device registry when a room is deleted.

**Authentication:** Required (JWT Bearer or API Key)

**Response (204):** Empty body.

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 404 | Room not found |
| 503 | Room DB not initialized |

**curl:**

```bash
curl -X DELETE http://localhost:8000/api/v1/rooms/1 \
  -H "Authorization: Bearer <token>"
```

---

## Device Association

### GET /rooms/{room_id}/devices

Return all devices assigned to a room. Returns full device registry rows.

**Authentication:** Not required

**Response (200):**

```json
[
  {
    "id": 3,
    "provider_name": "hue",
    "device_id": "5",
    "custom_name": "Lampada IKEA Soggiorno",
    "device_type_slug": "light",
    "created_at": 1711090000,
    "updated_at": 1711090000
  }
]
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 404 | Room not found |
| 503 | Room DB not initialized |

**curl:**

```bash
curl http://localhost:8000/api/v1/rooms/1/devices
```

---

### POST /rooms/{room_id}/devices

Assign a device from the registry to a room. If the device is already assigned to another room, it is moved automatically (implicit move — no error).

**Authentication:** Required (JWT Bearer or API Key)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `device_registry_id` | integer | Yes | Device registry row ID to assign |

**Response (200):**

```json
{
  "device_registry_id": 3,
  "room_id": 1,
  "previous_room_id": null,
  "assigned_at": 1711200000
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 404 | Room not found or device not found in registry |
| 503 | Room DB not initialized |

**curl:**

```bash
curl -X POST http://localhost:8000/api/v1/rooms/1/devices \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"device_registry_id": 3}'
```

---

### DELETE /rooms/{room_id}/devices/{device_registry_id}

Remove a device from a room. The device remains in the registry and can be reassigned to another room.

**Authentication:** Required (JWT Bearer or API Key)

**Response (204):** Empty body.

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 404 | Device not assigned to this room |
| 503 | Room DB not initialized |

**curl:**

```bash
curl -X DELETE http://localhost:8000/api/v1/rooms/1/devices/3 \
  -H "Authorization: Bearer <token>"
```

---

## Status & Health

### GET /rooms/health

Return rooms health statistics: room count, total devices assigned, and orphan device count (devices in registry not assigned to any room).

> **Note:** This is a static path declared before `/{room_id}` in FastAPI to avoid path parameter collision — "health" is not treated as a room ID.

**Authentication:** Not required

**Response (200):**

```json
{
  "room_count": 4,
  "total_device_count": 9,
  "orphan_device_count": 2
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 503 | Room DB not initialized |

**curl:**

```bash
curl http://localhost:8000/api/v1/rooms/health
```

---

### GET /rooms/house/status

Return aggregated real-time status for all rooms and their devices. Requires both the room DB and the status aggregator to be initialized.

> **Note:** This is a static path declared before `/{room_id}` in FastAPI to avoid path parameter collision — "house" is not treated as a room ID.

**Authentication:** Not required

**Response (200):**

```json
{
  "rooms": [
    {
      "room_id": 1,
      "room_name": "Soggiorno",
      "devices": [
        {
          "device_registry_id": 3,
          "custom_name": "Lampada IKEA Soggiorno",
          "provider_name": "hue",
          "device_type": "light",
          "status": "available",
          "data": {
            "status": "available",
            "on": true,
            "brightness": 200,
            "reachable": true
          }
        }
      ],
      "device_count": 1,
      "available_count": 1,
      "unavailable_count": 0
    }
  ],
  "total_devices": 1,
  "total_available": 1,
  "total_unavailable": 0
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 503 | Room DB or status aggregator not initialized |

**curl:**

```bash
curl http://localhost:8000/api/v1/rooms/house/status
```

---

### GET /rooms/{room_id}/status

Return aggregated real-time status for a single room and all its devices. Requires both the room DB and the status aggregator to be initialized.

**Authentication:** Not required

**Response (200):**

```json
{
  "room_id": 2,
  "room_name": "Camera da letto",
  "devices": [
    {
      "device_registry_id": 7,
      "custom_name": "Sensore temperatura camera",
      "provider_name": "dirigera",
      "device_type": "sensor",
      "status": "available",
      "data": {
        "status": "available",
        "temperature": 21.5,
        "humidity": 55.0,
        "battery_percentage": 87,
        "is_reachable": true
      }
    }
  ],
  "device_count": 1,
  "available_count": 1,
  "unavailable_count": 0
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 404 | Room not found |
| 503 | Room DB or status aggregator not initialized |

**curl:**

```bash
curl http://localhost:8000/api/v1/rooms/2/status
```

---

## Frontend Component Suggestions

**Room CRUD** (GET /rooms, GET /rooms/{id}, POST, PUT, DELETE)
- **Table** -- map `rooms[]` array to rows; columns: name, device_count, created_at. Use sortable columns for large lists. Per D-10 (list endpoint).
- **Modal Form** -- create/edit room with fields: name (text input). Open on "Add Room" button or row click. Per D-15 (CRUD write).
- **ConfirmDialog** -- delete confirmation showing room name and device count before removal. Per D-15 (CRUD write).

**Device Association** (POST /rooms/{id}/devices, DELETE /rooms/{id}/devices/{device_id}, POST /rooms/{id}/devices/move)
- **List** -- display devices in current room with provider badge and type label. Per D-10 (list sub-resource).
- **Select** -- dropdown or multi-select for adding devices to room; source from GET /api/v1/devices. Per D-14 (action endpoint).
- **Select** -- target room picker for move-device action. Per D-14 (action endpoint).

**Status and Health** (GET /rooms/{id}/status, GET /rooms/house/status, GET /rooms/health)
- **CardGrid** -- one card per room showing room name, device count, and per-device status badges (online green, offline red). Per D-12 (status endpoint).
- **StatusBadge** -- map `status` field to color (healthy -> green, degraded -> yellow, unhealthy -> red) on the health endpoint response. Per D-12 (health endpoint).
- **StatCards** -- display total_rooms, total_devices, rooms_with_devices as individual metric cards from house status. Per D-12 (status endpoint).

---

## TypeScript Interfaces

```typescript
// Source: api/rooms/models.py

interface Room {
  id: number;
  name: string;
  description: string | null;
  created_at: number;        // Unix timestamp
  updated_at: number;        // Unix timestamp
  device_count?: number;     // Present in list response only
}

interface RoomCreate {
  name: string;              // 1–100 chars
  description?: string | null; // Max 500 chars
}

interface RoomUpdate {
  name: string;              // 1–100 chars
  description?: string | null; // Max 500 chars
}

interface DeviceAssignment {
  device_registry_id: number;
  room_id: number;
  previous_room_id: number | null;  // null if not previously assigned
  assigned_at: number;              // Unix timestamp
}

interface RoomsHealthResponse {
  room_count: number;
  total_device_count: number;
  orphan_device_count: number;  // Devices in registry not in any room
}

interface DeviceStatus {
  device_registry_id: number;
  custom_name: string;
  provider_name: string;
  device_type: string;
  status: "available" | "unavailable";
  data: LightStatus | SensorStatus | ThermostatStatus | SpeakerStatus | StoveStatus | CameraStatus | null;
}

interface RoomStatusResponse {
  room_id: number;
  room_name: string;
  devices: DeviceStatus[];
  device_count: number;
  available_count: number;
  unavailable_count: number;
}

interface HouseStatusResponse {
  rooms: RoomStatusResponse[];
  total_devices: number;
  total_available: number;
  total_unavailable: number;
}

// Provider-specific status objects (DeviceStatus.data variants)

interface LightStatus {
  status: "available";
  on: boolean;
  brightness: number | null;
  reachable: boolean;
}

interface SensorStatus {
  status: "available";
  temperature: number | null;
  humidity: number | null;
  battery_percentage: number | null;
  is_reachable: boolean;
}

interface ThermostatStatus {
  status: "available";
  setpoint_temp: number | null;
  measured_temp: number | null;
  heating: boolean | null;
}

interface SpeakerStatus {
  status: "available";
  playing: boolean;
  volume: number | null;
  group_name: string | null;
}

interface StoveStatus {
  status: "available";
  active: boolean;
  temperature: number | null;
  power_level: number | null;
}

interface CameraStatus {
  status: "available";
  vpn_url: string | null;
  is_reachable: boolean;
}
```
