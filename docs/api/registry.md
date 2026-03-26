# Device Registry API

**Base path:** `/api/v1/registry`

Central device registry for tracking all smart home devices across providers. Manage device types (the taxonomy of device categories: light, sensor, thermostat, etc.) and register individual devices with custom names and type assignments. Device types include a set of built-in types that cannot be deleted. 9 endpoints.

---

## Quick Reference

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/v1/registry/types` | List all device types | No |
| `POST` | `/api/v1/registry/types` | Create a custom device type | Yes |
| `PUT` | `/api/v1/registry/types/{slug}` | Update a device type label | Yes |
| `DELETE` | `/api/v1/registry/types/{slug}` | Delete a custom device type | Yes |
| `GET` | `/api/v1/registry/devices` | List registered devices (paginated) | Yes |
| `POST` | `/api/v1/registry/devices` | Register a new device | Yes |
| `PUT` | `/api/v1/registry/devices/{device_id}` | Update a registered device | Yes |
| `DELETE` | `/api/v1/registry/devices/{device_id}` | Unregister a device | Yes |
| `GET` | `/api/v1/registry/health` | Registry statistics | No |

---

## Table of Contents

- [Device Types](#device-types)
  - [GET /registry/types](#get-registrytypes)
  - [POST /registry/types](#post-registrytypes)
  - [PUT /registry/types/{slug}](#put-registrytypesslug)
  - [DELETE /registry/types/{slug}](#delete-registrytypesslug)
- [Devices](#devices)
  - [GET /registry/devices](#get-registrydevices)
  - [POST /registry/devices](#post-registrydevices)
  - [PUT /registry/devices/{device_id}](#put-registrydevicesdevice_id)
  - [DELETE /registry/devices/{device_id}](#delete-registrydevicesdevice_id)
- [Health](#health)
  - [GET /registry/health](#get-registryhealth)
- [TypeScript Interfaces](#typescript-interfaces)

---

## Device Types

### GET /registry/types

Return all device types (the taxonomy used for classifying registered devices).

**Authentication:** Not required

**Response (200):**

```json
[
  {
    "slug": "light",
    "label": "Light",
    "is_builtin": true,
    "created_at": 1711000000,
    "is_deletable": false
  },
  {
    "slug": "sensor",
    "label": "Sensor",
    "is_builtin": true,
    "created_at": 1711000000,
    "is_deletable": false
  },
  {
    "slug": "thermostat",
    "label": "Thermostat",
    "is_builtin": true,
    "created_at": 1711000000,
    "is_deletable": false
  },
  {
    "slug": "irrigatore",
    "label": "Irrigatore giardino",
    "is_builtin": false,
    "created_at": 1711200000,
    "is_deletable": true
  }
]
```

> **Note:** `is_deletable` is `true` only when `is_builtin` is `false` AND no devices are currently assigned to the type. Built-in types always have `is_deletable: false`.

**Error responses:**

| Status | Condition |
|--------|-----------|
| 503 | Registry DB not initialized |

**curl:**

```bash
curl http://localhost:8000/api/v1/registry/types
```

---

### POST /registry/types

Create a custom device type. Slug must be lowercase alphanumeric with underscores.

**Authentication:** Required (JWT Bearer or API Key)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string | Yes | Unique identifier, pattern `^[a-z0-9_]+$`, max 64 chars |
| `label` | string | Yes | Human-readable display name, max 128 chars |

**Response (201):**

```json
{
  "slug": "irrigatore",
  "label": "Irrigatore giardino",
  "is_builtin": false,
  "created_at": 1711200000
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 409 | Device type with this slug already exists |
| 503 | Registry DB not initialized |

**curl:**

```bash
curl -X POST http://localhost:8000/api/v1/registry/types \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"slug": "irrigatore", "label": "Irrigatore giardino"}'
```

---

### PUT /registry/types/{slug}

Update the label of a device type. The slug is immutable — only the label can be changed.

**Authentication:** Required (JWT Bearer or API Key)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | Yes | New human-readable display name, 1-128 chars |

**Response (200):**

```json
{
  "slug": "irrigatore",
  "label": "Irrigatore giardino (aggiornato)",
  "is_builtin": false,
  "created_at": 1711200000
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 404 | Device type with this slug not found |
| 422 | Label is empty or missing |
| 503 | Registry DB not initialized |

**curl:**

```bash
curl -X PUT http://localhost:8000/api/v1/registry/types/irrigatore \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"label": "Irrigatore giardino (aggiornato)"}'
```

---

### DELETE /registry/types/{slug}

Delete a custom device type. Built-in types (where `is_builtin=true`) cannot be deleted. A type that is currently assigned to one or more registered devices cannot be deleted.

**Authentication:** Required (JWT Bearer or API Key)

**Response (204):** Empty body.

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 403 | Type is built-in (`is_builtin=true`) and cannot be deleted |
| 404 | Device type not found |
| 409 | Device type is in use by registered devices |
| 503 | Registry DB not initialized |

**curl:**

```bash
curl -X DELETE http://localhost:8000/api/v1/registry/types/irrigatore \
  -H "Authorization: Bearer <token>"
```

---

## Devices

### GET /registry/devices

Return a paginated list of all registered devices. Supports optional filtering by provider name.

**Authentication:** Required (JWT Bearer or API Key)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 20 | Items per page (1–1000) |
| `offset` | integer | 0 | Items to skip (≥ 0) |
| `provider_name` | string | — | Optional: filter by provider (e.g. `"hue"`, `"dirigera"`) |

Returns `PaginatedResponse<RegistryDevice>`. For the `PaginatedResponse<T>` generic interface, see [common.md](./common.md#typescript-interfaces).

**Response (200):**

```json
{
  "items": [
    {
      "id": 1,
      "provider_name": "hue",
      "device_id": "5",
      "custom_name": "Lampada IKEA Soggiorno",
      "device_type_slug": "light",
      "created_at": 1711090000,
      "updated_at": 1711090000
    },
    {
      "id": 2,
      "provider_name": "dirigera",
      "device_id": "abc-001",
      "custom_name": "Sensore DIRIGERA Camera",
      "device_type_slug": "sensor",
      "created_at": 1711091000,
      "updated_at": 1711091000
    }
  ],
  "total_count": 2,
  "limit": 20,
  "offset": 0
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 503 | Registry DB not initialized |

**curl:**

```bash
curl "http://localhost:8000/api/v1/registry/devices?limit=20&offset=0" \
  -H "Authorization: Bearer <token>"
```

Filter by provider:

```bash
curl "http://localhost:8000/api/v1/registry/devices?provider_name=hue" \
  -H "Authorization: Bearer <token>"
```

---

### POST /registry/devices

Register a new device with a custom name and type assignment.

**Authentication:** Required (JWT Bearer or API Key)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider_name` | string | Yes | Provider identifier (1–64 chars), e.g. `"hue"`, `"dirigera"`, `"netatmo"` |
| `device_id` | string | Yes | Provider-internal device ID (1–256 chars) |
| `custom_name` | string | Yes | Human-readable device name (1–128 chars) |
| `device_type_slug` | string | Yes | Must match an existing device type slug (1–64 chars) |

**Response (201):**

```json
{
  "id": 5,
  "provider_name": "hue",
  "device_id": "12",
  "custom_name": "Lampada IKEA Soggiorno",
  "device_type_slug": "light",
  "created_at": 1711200000,
  "updated_at": 1711200000
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 409 | Device already registered for this provider (same `provider_name` + `device_id` pair) |
| 422 | Unknown `device_type_slug` (does not match any registered type) |
| 503 | Registry DB not initialized |

**curl:**

```bash
curl -X POST http://localhost:8000/api/v1/registry/devices \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"provider_name": "hue", "device_id": "12", "custom_name": "Lampada IKEA Soggiorno", "device_type_slug": "light"}'
```

---

### PUT /registry/devices/{device_id}

Update the custom name and device type slug of a registered device.

**Authentication:** Required (JWT Bearer or API Key)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `custom_name` | string | Yes | New human-readable device name (1–128 chars) |
| `device_type_slug` | string | Yes | New device type slug (1–64 chars) |

**Response (200):**

```json
{
  "id": 5,
  "provider_name": "hue",
  "device_id": "12",
  "custom_name": "Lampada Philips Soggiorno",
  "device_type_slug": "light",
  "created_at": 1711200000,
  "updated_at": 1711300000
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 404 | Device registry entry not found |
| 503 | Registry DB not initialized |

**curl:**

```bash
curl -X PUT http://localhost:8000/api/v1/registry/devices/5 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"custom_name": "Lampada Philips Soggiorno", "device_type_slug": "light"}'
```

---

### DELETE /registry/devices/{device_id}

Unregister a device. Removes the device from the registry. If the device was assigned to a room, the room assignment is also removed.

**Authentication:** Required (JWT Bearer or API Key)

**Response (204):** Empty body.

**Error responses:**

| Status | Condition |
|--------|-----------|
| 401 | Missing or invalid authentication |
| 404 | Device registry entry not found |
| 503 | Registry DB not initialized |

**curl:**

```bash
curl -X DELETE http://localhost:8000/api/v1/registry/devices/5 \
  -H "Authorization: Bearer <token>"
```

---

## Health

### GET /registry/health

Return device registry statistics: number of device types and total registered devices.

**Authentication:** Not required

**Response (200):**

```json
{
  "device_types_count": 8,
  "device_registry_count": 12
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 503 | Registry DB not initialized |

**curl:**

```bash
curl http://localhost:8000/api/v1/registry/health
```

---

## Frontend Component Suggestions

**Device Types** (GET /types, GET /types/{id}, POST, PUT, DELETE)
- **Table** -- map `device_types[]` to rows; columns: name, slug, device_count, created_at. Sortable by device_count to see most-used types. Per D-10 (list endpoint).
- **Modal Form** -- create/edit type with fields: name (text input). Per D-15 (CRUD write).
- **ConfirmDialog** -- delete confirmation showing type name and associated device count; warn if devices exist. Per D-15 (CRUD write).

**Devices** (GET /devices, GET /devices/{id}, POST, PUT, DELETE)
- **Table** -- map `devices[]` to rows; columns: name, provider (Badge), device_type, ip_address, mac_address, is_online (StatusBadge). Sortable by provider and type for filtering. Per D-10 (list endpoint).
- **Modal Form** -- create/edit device with fields: name (text), provider (Select), device_type_id (Select from types list), ip_address (text), mac_address (text). Per D-15 (CRUD write).
- **ConfirmDialog** -- delete confirmation showing device name. Per D-15 (CRUD write).

**Health** (GET /health)
- **StatusBadge** -- map `status` to color (healthy -> green, degraded -> yellow). Per D-12 (health endpoint).
- **StatCards** -- display total_types, total_devices, orphaned_devices as metric cards. Highlight orphaned_devices in amber if > 0. Per D-12 (health endpoint).

---

## TypeScript Interfaces

```typescript
// Source: api/device_registry/models.py

interface DeviceType {
  slug: string;        // Pattern: ^[a-z0-9_]+$, max 64 chars
  label: string;       // Max 128 chars
  is_builtin: boolean; // Built-in types cannot be deleted
  is_deletable: boolean; // true when custom type has no devices assigned
  created_at: number;  // Unix timestamp
}

interface DeviceTypeCreate {
  slug: string;    // Pattern: ^[a-z0-9_]+$, max 64 chars
  label: string;   // Max 128 chars
}

interface DeviceTypeLabelUpdate {
  label: string;   // 1-128 chars
}

interface RegistryDevice {
  id: number;
  provider_name: string;    // e.g. "hue", "dirigera", "netatmo"
  device_id: string;        // Provider-internal device identifier
  custom_name: string;
  device_type_slug: string;
  created_at: number;       // Unix timestamp
  updated_at: number;       // Unix timestamp
}

interface DeviceCreate {
  provider_name: string;    // 1–64 chars
  device_id: string;        // 1–256 chars
  custom_name: string;      // 1–128 chars
  device_type_slug: string; // 1–64 chars, must match existing type
}

interface DeviceUpdate {
  custom_name: string;      // 1–128 chars
  device_type_slug: string; // 1–64 chars
}

interface RegistryHealthResponse {
  device_types_count: number;
  device_registry_count: number;
}
```

> For `PaginatedResponse<T>`, see [common.md](./common.md#typescript-interfaces).
