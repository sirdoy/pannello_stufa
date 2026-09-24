/**
 * Device Registry API type definitions.
 * Source: docs/api/registry.md
 */

export interface DeviceType {
  slug: string;        // Pattern: ^[a-z0-9_]+$, max 64 chars
  label: string;       // Max 128 chars
  is_builtin: 0 | 1 | boolean; // raw SQLite INTEGER (0/1) from the backend — use truthiness only
  is_deletable?: boolean;       // only in GET /registry/types; true when no device uses the type
  created_at: number;  // Unix timestamp
}

export interface DeviceTypeCreate {
  slug: string;    // Pattern: ^[a-z0-9_]+$, max 64 chars
  label: string;   // Max 128 chars
}

export interface RegistryDevice {
  id: number;
  provider_name: string;    // e.g. "hue", "dirigera", "netatmo"
  device_id: string;        // Provider-internal device identifier
  custom_name: string;
  device_type_slug: string;
  last_seen_at?: number | null; // last provider poll that saw this device; null until first seen
  created_at: number;       // Unix timestamp
  updated_at: number;       // Unix timestamp
}

export interface DeviceCreate {
  provider_name: string;    // 1–64 chars
  device_id: string;        // 1–256 chars
  custom_name: string;      // 1–128 chars
  device_type_slug: string; // 1–64 chars, must match existing type
}

export interface DeviceUpdate {
  custom_name: string;      // 1–128 chars
  device_type_slug: string; // 1–64 chars
}

export interface RegistryHealthResponse {
  device_types_count: number;
  device_registry_count: number;
}
