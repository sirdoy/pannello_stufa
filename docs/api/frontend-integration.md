# Frontend Integration Guide

A step-by-step tutorial for building a **dynamic, capability-driven automation editor** in a fresh Next.js 14+ (App Router) project against the HomeAssistant Network API. Follow this top to bottom and you'll ship a UI that lets users compose condition trees, configure actions for all 11 supported action types, submit rules, and receive live execution feedback over WebSocket — without reverse-engineering any backend.

This guide composes the outputs of two prior phases:

- [`./automations.md`](./automations.md) — REST reference (authoritative for endpoints, payloads, error responses).
- [`./websocket.md`](./websocket.md) — WebSocket contract (authoritative for the `automations` topic, connection lifecycle, and close codes).
- [`./automations.types.ts`](./automations.types.ts) — TypeScript interfaces (authoritative for every payload shape you'll import).

If something in this guide ever drifts from those three files, the three files win.

## Table of Contents

1. [Prerequisites & Setup](#1-prerequisites--setup)
2. [Auth (X-API-Key)](#2-auth-x-api-key)
3. [Fetching Capabilities](#3-fetching-capabilities)
4. [Condition Builder](#4-condition-builder)
5. [Worked Example: Hue Light Condition](#5-worked-example-hue-light-condition)
6. [Action Configurator](#6-action-configurator)
7. [Submitting a Rule](#7-submitting-a-rule)
8. [Live Execution Feedback](#8-live-execution-feedback)
9. [Testing Your Rule](#9-testing-your-rule)
10. [Troubleshooting](#10-troubleshooting)
11. [Appendix: Error Code Cheatsheet](#appendix-error-code-cheatsheet)

---

## 1. Prerequisites & Setup

**Audience.** You're a frontend developer comfortable with React and TypeScript. You do **not** need to know Python, FastAPI, or anything about how the backend is implemented — everything you need is exposed via REST + WebSocket.

**Stack assumed by this guide:**

- Next.js **14+** with the **App Router** (`src/app/...`).
- TypeScript.
- Plain `fetch` for REST (no axios).
- Plain `WebSocket` (the browser global) for live feedback (no socket.io).
- No opinion on UI library — bring your own (Tailwind, shadcn, Chakra, MUI, plain CSS — whatever).

### 1.1 Bootstrap a new project

```bash
npx create-next-app@latest ha-automations --typescript --app --tailwind=false
cd ha-automations
```

### 1.2 Copy the TypeScript types

The API ships a single source-of-truth types file: [`./automations.types.ts`](./automations.types.ts). Copy it into your repo:

```bash
mkdir -p src/types
cp path/to/docs/api/automations.types.ts src/types/automations.ts
```

From this point on, all imports in the guide reference `@/types/automations`. If you prefer a different path, adjust the `tsconfig.json` paths or rewrite the imports — the file name is conventional, not load-bearing.

> Whenever the backend team ships a new version of `automations.types.ts`, re-copy it. The file is a frozen snapshot; your app needs the latest copy to stay in sync.

### 1.3 Configure environment variables

Create `.env.local` at the project root:

```env
# Base URL of the HomeAssistant Network API.
NEXT_PUBLIC_API_BASE=https://pdupun8zpr7exw43.myfritz.net

# API key — use the server-side form for Route Handlers / Server Actions.
API_KEY=ha_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Client-exposed API key — WARNING: visible in the browser bundle.
# Prefer routing REST calls through a Next.js Route Handler that uses API_KEY
# server-side; only use NEXT_PUBLIC_API_KEY if the security tradeoff is acceptable.
NEXT_PUBLIC_API_KEY=ha_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **JWT vs API key for browser clients.** For pure server-side code (Route Handlers, Server Actions), use `API_KEY` with the `X-API-Key` header — it never leaves the server. For browser code that must authenticate directly (e.g., the WebSocket), a short-lived JWT is preferable to a long-lived API key. See the Authentication section of [`./automations.md`](./automations.md#authentication) and the auth section of [`./websocket.md`](./websocket.md) for details on obtaining and rotating credentials.

### 1.4 Sanity check

After the next section you'll have a reusable fetch wrapper. Once that's in place, hitting `GET /api/v1/capabilities` should return a `{ providers: [...] }` object populated with the providers currently registered on your server.

---

## 2. Auth (X-API-Key)

Every REST request to the HomeAssistant Network API requires authentication. You have two choices:

| Method              | Header                          | Best for                          |
|---------------------|---------------------------------|-----------------------------------|
| API key (long-lived)| `X-API-Key: ha_live_...`        | Server-side (Route Handlers, CI)  |
| JWT (short-lived)   | `Authorization: Bearer ...`     | Interactive UIs, WebSocket browser clients |

This guide uses the `X-API-Key` header throughout because it's the simpler starting point. The header name `X-API-Key` is **case-sensitive** and must match exactly.

API keys are created and revoked through `POST /auth/api-keys` and `DELETE /auth/api-keys/{id}` — see the API Key Management section in [`./automations.md`](./automations.md) (or the root API [`./README.md`](./README.md) index) for the request/response contract.

### 2.1 Reusable fetch wrapper

Put this in `src/lib/apiClient.ts` and route every REST call through it:

```typescript
// src/lib/apiClient.ts
const BASE = process.env.NEXT_PUBLIC_API_BASE!;
const KEY = process.env.NEXT_PUBLIC_API_KEY!; // or process.env.API_KEY on the server

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: string
  ) {
    super(`${status} ${statusText}: ${body}`);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": KEY,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, res.statusText, body);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
```

Everything in this guide — capability fetching, rule submission, dry-run evaluation, manual trigger — goes through `apiFetch`. The wrapper always attaches `X-API-Key` so you never have to remember it per call.

### 2.2 curl sanity check

Before writing any code, verify your key is valid:

```bash
curl https://pdupun8zpr7exw43.myfritz.net/api/v1/capabilities \
  -H "X-API-Key: $API_KEY"
```

A valid key returns `{"providers": [...]}`. A missing or wrong key returns `401 Unauthorized`. A revoked key returns `403 Forbidden`. See [Troubleshooting](#10-troubleshooting) for the full matrix.

---

## 3. Fetching Capabilities

The **capabilities API** is the single source of truth for "what conditions can I use and what actions can I fire, per provider, for this specific backend right now". Your UI should treat it as authoritative — do **not** hardcode the list of providers, action types, or parameter names in your frontend. Re-fetch capabilities on editor mount.

### 3.1 Endpoints

| Method | Path                                            | Returns                                       |
|--------|-------------------------------------------------|-----------------------------------------------|
| GET    | `/api/v1/capabilities`                          | `CapabilitiesResponse` — all providers + system block |
| GET    | `/api/v1/capabilities/{provider}`               | `ProviderBlock` for one provider              |
| GET    | `/api/v1/capabilities/{provider}/{device_id}`   | Device-scoped provider block (e.g. one specific Hue light) |

All three endpoints require the `X-API-Key` header. For full endpoint docs see [`./automations.md`](./automations.md#capabilities).

### 3.2 Response shape

The top-level shape (from `automations.types.ts`):

```typescript
interface CapabilitiesResponse {
  providers: ProviderBlock[];
}

interface ProviderBlock {
  name: string;                      // "hue", "netatmo", "thermorossi", "sonos", "tuya", "dirigera", "system"
  conditions: CapabilityDescriptor[];
  actions: CapabilityDescriptor[];
}

interface CapabilityDescriptor {
  type: string;                      // discriminator, e.g. "hue_light" or "sensor_threshold"
  category: "condition" | "action";
  parameters: ParameterDescriptor[];
}
```

Each parameter has a **flat shape** with every key always present (null when absent):

```typescript
interface ParameterDescriptor {
  name: string;
  type: "string" | "integer" | "number" | "boolean" | "enum";
  required: boolean;
  default: unknown | null;
  min: number | null;
  max: number | null;
  enum: string[] | null;             // populated for Literal[...] fields
  pattern: string | null;            // populated for Field(pattern=...) regex
  description: string | null;
}
```

Notes:

- The synthetic `"system"` provider block is always present last and carries cross-provider capabilities (`time_window`, `always_true`, `http_webhook`, `log_event`).
- Keys are never omitted — expect `min: null` not a missing property. Your UI code can rely on `p.min !== null` to branch.
- `enum` is populated exactly when a Pydantic `Literal["a","b","c"]` field is in play — great for native `<select>` elements.
- `pattern` is populated for regex-validated strings (`active_hours_start`, `active_hours_end`, `cron_expression`, etc.) — render a text input and show the regex as a hint.

### 3.3 Typed fetch hook

```typescript
// src/hooks/useCapabilities.ts
"use client";

import { useEffect, useState } from "react";
import type { CapabilitiesResponse, ProviderBlock } from "@/types/automations";
import { apiFetch } from "@/lib/apiClient";

export function useCapabilities() {
  const [data, setData] = useState<CapabilitiesResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<CapabilitiesResponse>("/api/v1/capabilities")
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error };
}

export function findProvider(
  caps: CapabilitiesResponse | null,
  name: string
): ProviderBlock | undefined {
  return caps?.providers.find((p) => p.name === name);
}
```

SWR, React Query, or any other data-fetching library works equally well — the only requirement is that you eventually pass `CapabilitiesResponse`-shaped data into your editor.

---

## 4. Condition Builder

The **condition tree** is the `condition` field of an automation rule. It's a recursive discriminated union with exactly **9 shapes**: 7 leaves plus `and`/`or` composites that wrap a non-empty array of child nodes.

### 4.1 Condition leaves (7)

| `type` discriminator                | Leaf model              | Typical use                                      |
|-------------------------------------|-------------------------|--------------------------------------------------|
| `sensor_state_change`               | SensorStateChangeLeaf   | "when door goes from closed to open"             |
| `sensor_threshold`                  | SensorThresholdLeaf     | "temperature > 22°C"                             |
| `netatmo_temperature_threshold`     | NetatmoTemperatureThresholdLeaf | Netatmo room-scoped threshold             |
| `time_window`                       | TimeWindowCondition     | `"07:00"` – `"23:00"` window (HH:MM)             |
| `device_state`                      | DeviceStateCondition    | "light is currently on"                          |
| `temperature_range`                 | TemperatureRangeCondition | min/max range gate                              |
| `always_true`                       | AlwaysTrueCondition     | Zero-config pass (useful for time-only rules)    |

### 4.2 Composites (2)

Both `and` and `or` use the same shape — a single `conditions: ConditionNode[]` with `min_length=1`:

```typescript
interface AndNode { type: "and"; conditions: ConditionNode[]; }
interface OrNode  { type: "or";  conditions: ConditionNode[]; }
```

Nesting is unrestricted: `and(or(leaf, leaf), leaf)` is valid.

### 4.3 Editor state shape

```typescript
// src/types/editorState.ts
import type { ConditionNode } from "@/types/automations";

export type EditorState = {
  name: string;
  enabled: boolean;
  condition: ConditionNode;
  // actions added in section 6
};
```

### 4.4 Recursive component outline

The editor should be **metadata-driven**: it reads descriptors from the capabilities response and renders inputs accordingly. It never hardcodes provider-specific knowledge.

```tsx
// src/components/ConditionNodeEditor.tsx
"use client";

import type {
  ConditionNode,
  CapabilityDescriptor,
  ParameterDescriptor,
} from "@/types/automations";

type Props = {
  node: ConditionNode;
  descriptors: CapabilityDescriptor[]; // flat list of all available condition descriptors
  onChange: (next: ConditionNode) => void;
  onDelete?: () => void;
};

export function ConditionNodeEditor({ node, descriptors, onChange, onDelete }: Props) {
  // Composite: render child editors + "add child" controls
  if (node.type === "and" || node.type === "or") {
    return (
      <fieldset>
        <legend>{node.type.toUpperCase()}</legend>
        {node.conditions.map((child, i) => (
          <ConditionNodeEditor
            key={i}
            node={child}
            descriptors={descriptors}
            onChange={(next) => {
              const copy = [...node.conditions];
              copy[i] = next;
              onChange({ ...node, conditions: copy });
            }}
            onDelete={() => {
              const copy = node.conditions.filter((_, j) => j !== i);
              // respect min_length=1 in your UI (disable delete when len === 1)
              onChange({ ...node, conditions: copy });
            }}
          />
        ))}
        <button
          onClick={() =>
            onChange({
              ...node,
              conditions: [...node.conditions, { type: "always_true" }],
            })
          }
        >
          + Add child
        </button>
      </fieldset>
    );
  }

  // Leaf: look up the descriptor by `type`, render one input per parameter
  const descriptor = descriptors.find((d) => d.type === node.type);
  if (!descriptor) return <div>Unknown condition type: {node.type}</div>;

  return (
    <div>
      <strong>{node.type}</strong>
      {descriptor.parameters.map((p) => (
        <ParameterInput
          key={p.name}
          param={p}
          value={(node as any)[p.name]}
          onChange={(v) => onChange({ ...node, [p.name]: v } as ConditionNode)}
        />
      ))}
      {onDelete && <button onClick={onDelete}>Delete</button>}
    </div>
  );
}
```

### 4.5 Metadata → input mapping

One `ParameterInput` component covers every parameter shape by branching on `param.type` and `param.enum`:

```tsx
function ParameterInput({
  param,
  value,
  onChange,
}: {
  param: ParameterDescriptor;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  // Enum -> dropdown over param.enum
  if (param.type === "enum" && param.enum) {
    return (
      <label>
        {param.name}
        <select
          value={(value as string) ?? param.default ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">--</option>
          {param.enum.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
    );
  }

  // Boolean -> toggle
  if (param.type === "boolean") {
    return (
      <label>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {param.name}
      </label>
    );
  }

  // Numeric with min/max -> slider (integer/number)
  if ((param.type === "integer" || param.type === "number") && param.min !== null && param.max !== null) {
    return (
      <label>
        {param.name} ({String(value ?? param.default ?? param.min)})
        <input
          type="range"
          min={param.min}
          max={param.max}
          step={param.type === "integer" ? 1 : 0.1}
          value={Number(value ?? param.default ?? param.min)}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </label>
    );
  }

  // Numeric without bounds -> number input
  if (param.type === "integer" || param.type === "number") {
    return (
      <label>
        {param.name}
        <input
          type="number"
          value={(value as number) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
      </label>
    );
  }

  // String, possibly with a regex pattern
  return (
    <label>
      {param.name}
      <input
        type="text"
        value={(value as string) ?? ""}
        pattern={param.pattern ?? undefined}
        placeholder={param.pattern ? `must match ${param.pattern}` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {param.pattern && <small>Regex: <code>{param.pattern}</code></small>}
    </label>
  );
}
```

That's the whole trick: **every condition, every leaf, every provider falls out of the capabilities response automatically**. If the backend ships a new condition type next week, your UI renders it without a code change — as long as the new fields use the same primitive types.

---

## 5. Worked Example: Hue Light Condition

Let's build a concrete condition: **fire when the kitchen Hue light is on AND its brightness is above 100**. This walks the metadata-driven pipeline end-to-end.

### 5.1 Discover the device

Hit `GET /api/v1/capabilities/hue` to list Hue capabilities, then `GET /api/v1/capabilities/hue/{device_id}` to scope down. `{device_id}` comes from the Hue provider's device list (see [`./hue.md`](./hue.md) for `GET /api/v1/hue/lights`).

```bash
curl https://pdupun8zpr7exw43.myfritz.net/api/v1/capabilities/hue/5 \
  -H "X-API-Key: $API_KEY"
```

### 5.2 Example response

```json
{
  "name": "hue",
  "conditions": [
    {
      "type": "sensor_state_change",
      "category": "condition",
      "parameters": [
        {"name": "sensor_id",  "type": "string",  "required": true,  "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
        {"name": "from_state", "type": "string",  "required": false, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
        {"name": "to_state",   "type": "string",  "required": false, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null}
      ]
    },
    {
      "type": "sensor_threshold",
      "category": "condition",
      "parameters": [
        {"name": "sensor_id", "type": "string",  "required": true,  "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
        {"name": "metric",    "type": "string",  "required": true,  "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
        {"name": "operator",  "type": "enum",    "required": true,  "default": null, "min": null, "max": null, "enum": ["gt","lt","gte","lte"], "pattern": null, "description": null},
        {"name": "threshold", "type": "number",  "required": true,  "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null}
      ]
    },
    {
      "type": "device_state",
      "category": "condition",
      "parameters": [
        {"name": "sensor_id",      "type": "string", "required": true, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
        {"name": "expected_state", "type": "string", "required": true, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null}
      ]
    }
  ],
  "actions": [
    {
      "type": "hue_light",
      "category": "action",
      "parameters": [
        {"name": "light_id",   "type": "string",  "required": true,  "default": null, "min": null,  "max": null,   "enum": null, "pattern": null, "description": null},
        {"name": "on",         "type": "boolean", "required": false, "default": null, "min": null,  "max": null,   "enum": null, "pattern": null, "description": null},
        {"name": "brightness", "type": "integer", "required": false, "default": null, "min": 1,     "max": 254,    "enum": null, "pattern": null, "description": null},
        {"name": "color_temp", "type": "integer", "required": false, "default": null, "min": 153,   "max": 500,    "enum": null, "pattern": null, "description": null},
        {"name": "hue",        "type": "integer", "required": false, "default": null, "min": 0,     "max": 65535,  "enum": null, "pattern": null, "description": null},
        {"name": "sat",        "type": "integer", "required": false, "default": null, "min": 0,     "max": 254,    "enum": null, "pattern": null, "description": null}
      ]
    },
    {
      "type": "hue_group",
      "category": "action",
      "parameters": [
        {"name": "group_id",   "type": "string",  "required": true,  "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
        {"name": "on",         "type": "boolean", "required": false, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
        {"name": "brightness", "type": "integer", "required": false, "default": null, "min": 1,    "max": 254,  "enum": null, "pattern": null, "description": null},
        {"name": "color_temp", "type": "integer", "required": false, "default": null, "min": 153,  "max": 500,  "enum": null, "pattern": null, "description": null}
      ]
    },
    {
      "type": "hue_scene",
      "category": "action",
      "parameters": [
        {"name": "group_id", "type": "string", "required": true, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null},
        {"name": "scene_id", "type": "string", "required": true, "default": null, "min": null, "max": null, "enum": null, "pattern": null, "description": null}
      ]
    }
  ]
}
```

### 5.3 UI mapping

Given the descriptors above, the editor renders these controls automatically:

| Capability field                          | Descriptor type                       | UI control                       |
|-------------------------------------------|---------------------------------------|----------------------------------|
| `expected_state` (device_state)           | `string` (free text)                  | text input                       |
| `operator` (sensor_threshold)             | `enum ["gt","lt","gte","lte"]`        | **dropdown**                     |
| `threshold` (sensor_threshold)            | `number`                              | number input                     |
| `on` (hue_light action)                   | `boolean`                             | **toggle**                       |
| `brightness` (hue_light action)           | `integer` min=1 max=254               | **slider**                       |
| `color_temp` (hue_light action)           | `integer` min=153 max=500             | **slider** (Mired)               |
| `hue` (hue_light action)                  | `integer` min=0 max=65535             | **slider** or color wheel        |
| `sat` (hue_light action)                  | `integer` min=0 max=254               | **slider**                       |

No hand-written switch-case needed. The UI control choice falls out of `param.type` + presence of `param.enum` + presence of `param.min`/`param.max`.

### 5.4 Editor JSX for "kitchen light on AND brightness > 100"

```tsx
// We want device_state(expected_state="on") AND sensor_threshold(brightness > 100).
import type { ConditionNode } from "@/types/automations";

const KITCHEN_LIGHT_ID = "hue-light-5";

const initial: ConditionNode = {
  type: "and",
  conditions: [
    { type: "device_state",     sensor_id: KITCHEN_LIGHT_ID, expected_state: "on" },
    { type: "sensor_threshold", sensor_id: KITCHEN_LIGHT_ID, metric: "brightness", operator: "gt", threshold: 100 },
  ],
};

// <ConditionNodeEditor node={initial} descriptors={hueBlock.conditions} onChange={...} />
```

### 5.5 Resulting ConditionNode JSON

```json
{
  "type": "and",
  "conditions": [
    {
      "type": "device_state",
      "sensor_id": "hue-light-5",
      "expected_state": "on"
    },
    {
      "type": "sensor_threshold",
      "sensor_id": "hue-light-5",
      "metric": "brightness",
      "operator": "gt",
      "threshold": 100
    }
  ]
}
```

This literal JSON object is the value you'll drop into the `condition` field of an `AutomationRuleCreate` in [Section 7](#7-submitting-a-rule).

---

## 6. Action Configurator

Actions use the same metadata-driven approach as conditions. A rule carries `actions: ActionType[]` with `min_length=1`, and each array item is one of **11 discriminated shapes**.

### 6.1 The 11 action type discriminators

| Discriminator                   | Provider    | Purpose                                      |
|---------------------------------|-------------|----------------------------------------------|
| `netatmo_set_room_temp`         | Netatmo     | Set manual/home temp for one room            |
| `netatmo_set_home_mode`         | Netatmo     | Set home mode (`schedule`/`away`/`hg`)       |
| `netatmo_switch_schedule`       | Netatmo     | Switch the active heating schedule           |
| `http_webhook`                  | system      | GET/POST arbitrary URL with optional payload |
| `log_event`                     | system      | Append a line to the execution log           |
| `hue_light`                     | Hue         | Control one specific bulb                    |
| `hue_group`                     | Hue         | Control a Hue group (room/zone)              |
| `hue_scene`                     | Hue         | Activate a saved scene                       |
| `thermorossi`                   | Thermorossi | Pellet-stove commands (ignite/shutdown/…)    |
| `sonos`                         | Sonos       | Playback / volume / source commands          |
| `tuya`                          | Tuya        | Smart-plug on/off + timer                    |

Every discriminator string above appears verbatim in `ActionType` in [`./automations.types.ts`](./automations.types.ts) and is a valid value for the `type` field of an action item.

### 6.2 Editor loop

```tsx
// src/components/ActionListEditor.tsx
"use client";

import type { ActionType as Action, CapabilitiesResponse, CapabilityDescriptor } from "@/types/automations";

function allActionDescriptors(caps: CapabilitiesResponse): CapabilityDescriptor[] {
  return caps.providers.flatMap((p) => p.actions);
}

export function ActionListEditor({
  caps,
  actions,
  onChange,
}: {
  caps: CapabilitiesResponse;
  actions: Action[];
  onChange: (next: Action[]) => void;
}) {
  const descriptors = allActionDescriptors(caps);

  return (
    <div>
      {actions.map((a, i) => {
        const d = descriptors.find((x) => x.type === a.type);
        if (!d) return <div key={i}>Unknown action: {a.type}</div>;
        return (
          <ActionForm
            key={i}
            descriptor={d}
            value={a}
            onChange={(next) => {
              const copy = [...actions];
              copy[i] = next;
              onChange(copy);
            }}
            onDelete={() => onChange(actions.filter((_, j) => j !== i))}
          />
        );
      })}
      <AddActionMenu descriptors={descriptors} onAdd={(a) => onChange([...actions, a])} />
    </div>
  );
}
```

`ActionForm` reuses the same `ParameterInput` component from [Section 4](#4-condition-builder) — one enum becomes a dropdown, one boolean becomes a toggle, one bounded integer becomes a slider.

### 6.3 Worked example: HueLightAction

We'll configure an action that turns the kitchen light on at 80% brightness with a cool-white color temperature.

**Parameters from the descriptor (matches `HueLightAction` in the types file):**

| Parameter    | Type     | Required | Range       | UI control |
|--------------|----------|----------|-------------|------------|
| `light_id`   | string   | yes      | –           | text input (or dropdown populated from `/api/v1/hue/lights`) |
| `on`         | boolean  | no       | –           | **toggle** |
| `brightness` | integer  | no       | 1 – 254     | **slider** |
| `color_temp` | integer  | no       | 153 – 500   | **slider** (Mired — lower = cooler, higher = warmer) |
| `hue`        | integer  | no       | 0 – 65535   | **slider** |
| `sat`        | integer  | no       | 0 – 254     | **slider** |

**JSX sketch:**

```tsx
import type { ActionType as Action } from "@/types/automations";

type HueLightAct = Extract<Action, { type: "hue_light" }>;

function HueLightActionForm({
  value,
  onChange,
}: {
  value: HueLightAct;
  onChange: (next: HueLightAct) => void;
}) {
  const set = <K extends keyof HueLightAct>(k: K, v: HueLightAct[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div>
      <label>
        Light ID
        <input value={value.light_id} onChange={(e) => set("light_id", e.target.value)} />
      </label>

      <label>
        <input type="checkbox" checked={value.on ?? false} onChange={(e) => set("on", e.target.checked)} />
        On
      </label>

      <label>
        Brightness ({value.brightness ?? 0})
        <input type="range" min={1} max={254} value={value.brightness ?? 1} onChange={(e) => set("brightness", Number(e.target.value))} />
      </label>

      <label>
        Color temp ({value.color_temp ?? 0})
        <input type="range" min={153} max={500} value={value.color_temp ?? 153} onChange={(e) => set("color_temp", Number(e.target.value))} />
      </label>

      <label>
        Hue ({value.hue ?? 0})
        <input type="range" min={0} max={65535} value={value.hue ?? 0} onChange={(e) => set("hue", Number(e.target.value))} />
      </label>

      <label>
        Saturation ({value.sat ?? 0})
        <input type="range" min={0} max={254} value={value.sat ?? 0} onChange={(e) => set("sat", Number(e.target.value))} />
      </label>
    </div>
  );
}
```

### 6.4 Resulting ActionItem JSON

```json
{
  "type": "hue_light",
  "light_id": "hue-light-5",
  "on": true,
  "brightness": 200,
  "color_temp": 250
}
```

Because `HueLightAction` fields other than `type` and `light_id` are optional (`Optional[...] = None` in Pydantic), you may omit any you don't want to set — the backend treats `null`/missing as "don't touch".

### 6.5 422 constraint violations

Sending `brightness: 300` (above the 254 max) will come back as `422 Unprocessable Entity` with a Pydantic error detail pointing at `body.actions.0.brightness`. See [Section 7](#7-submitting-a-rule) for how to surface that error and [Section 10](#10-troubleshooting) for the full matrix.

---

## 7. Submitting a Rule

Time to POST a complete `AutomationRuleCreate` that combines the condition from [Section 5](#5-worked-example-hue-light-condition) with the action from [Section 6](#6-action-configurator).

### 7.1 Required vs optional fields

Required (from `AutomationRuleCreate`):

- `name` — non-empty string
- `condition` — one `ConditionNode`
- `actions` — non-empty array of `ActionType`

Optional:

- `description` (string)
- `enabled` (boolean, default `true`)
- `trigger` (discriminated union — `schedule_cron` or `manual_api_call`; omit to make the rule fire on condition changes only)
- `min_interval_seconds` (cooldown)
- `max_triggers_per_hour` (rate cap)
- `active_hours_start` / `active_hours_end` (HH:MM window)

### 7.2 Build the payload

```typescript
// src/lib/submitRule.ts
import type { AutomationRuleCreate, AutomationRule } from "@/types/automations";
import { apiFetch } from "@/lib/apiClient";

export async function submitRule(payload: AutomationRuleCreate): Promise<AutomationRule> {
  return apiFetch<AutomationRule>("/api/v1/automations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Example:
const payload: AutomationRuleCreate = {
  name: "Dim kitchen when bright",
  description: "When the kitchen light is on and very bright, lower it.",
  enabled: true,
  condition: {
    type: "and",
    conditions: [
      { type: "device_state",     sensor_id: "hue-light-5", expected_state: "on" },
      { type: "sensor_threshold", sensor_id: "hue-light-5", metric: "brightness", operator: "gt", threshold: 200 },
    ],
  },
  actions: [
    {
      type: "hue_light",
      light_id: "hue-light-5",
      on: true,
      brightness: 120,
      color_temp: 300,
    },
  ],
  min_interval_seconds: 60,
};

const created = await submitRule(payload);
console.log("Created rule id:", created.id);
```

### 7.3 curl equivalent

```bash
curl -X POST https://pdupun8zpr7exw43.myfritz.net/api/v1/automations \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dim kitchen when bright",
    "enabled": true,
    "condition": {
      "type": "and",
      "conditions": [
        {"type": "device_state", "sensor_id": "hue-light-5", "expected_state": "on"},
        {"type": "sensor_threshold", "sensor_id": "hue-light-5", "metric": "brightness", "operator": "gt", "threshold": 200}
      ]
    },
    "actions": [
      {"type": "hue_light", "light_id": "hue-light-5", "on": true, "brightness": 120, "color_temp": 300}
    ],
    "min_interval_seconds": 60
  }'
```

### 7.4 Error handling

Wrap the call and surface Pydantic errors back to the user:

```typescript
import { ApiError } from "@/lib/apiClient";

try {
  const rule = await submitRule(payload);
  // ...
} catch (e) {
  if (e instanceof ApiError) {
    switch (e.status) {
      case 401:
        // Missing or invalid X-API-Key
        showAuthError("Check your API key configuration");
        break;
      case 403:
        // Key revoked
        showAuthError("Your API key has been revoked");
        break;
      case 422: {
        // Unknown discriminator ("type": "wrong_thing") OR constraint violation
        // (e.g. brightness: 300 exceeds max=254). The body carries a
        // Pydantic-shaped detail: { detail: [{ loc, msg, type, input }, ...] }
        const errors = JSON.parse(e.body).detail as Array<{
          loc: (string | number)[];
          msg: string;
          type: string;
        }>;
        showFieldErrors(errors);
        break;
      }
      case 429:
        showRateLimitError();
        break;
      default:
        throw e;
    }
  } else {
    throw e;
  }
}
```

See [`./automations.md`](./automations.md) for the authoritative error-response contract.

---

## 8. Live Execution Feedback

The server pushes a structured envelope to subscribed clients every time an automation rule is evaluated (with DB write) or manually triggered. Your UI subscribes to the `automations` topic on `wss://pdupun8zpr7exw43.myfritz.net/ws/live` and renders toasts/banners/history based on `data.status`. See [`./websocket.md`](./websocket.md#automations) for the full envelope spec including reconnection and close codes.

### 8.1 Connecting

**Browser WebSocket auth is via query parameter** — the browser WebSocket API cannot set custom headers on the handshake. Use `?api_key=...` or, preferred for browser clients, a short-lived `?token=<JWT>` issued by `POST /auth/login`:

```typescript
// src/lib/automationsWS.ts
"use client";

import type { AutomationsEvent } from "@/types/automations";

export function openAutomationsSocket(onEvent: (ev: AutomationsEvent) => void) {
  const url =
    `wss://pdupun8zpr7exw43.myfritz.net/ws/live` +
    `?api_key=${encodeURIComponent(process.env.NEXT_PUBLIC_API_KEY!)}`;

  const ws = new WebSocket(url);

  ws.addEventListener("open", () => {
    ws.send(JSON.stringify({ action: "subscribe", topic: "automations" }));
  });

  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data) as AutomationsEvent;
    if (msg.topic === "automations") {
      onEvent(msg);
    }
  });

  ws.addEventListener("close", (e) => {
    // 1008 = auth failed; 1013 = server busy (MAX_CONNECTIONS=10).
    // See section 10 for reconnection strategy.
    console.warn("automations WS closed", e.code, e.reason);
  });

  return ws;
}
```

> The exact envelope for each `AutomationsEvent` — including the `data.trigger_source` field — is fixed by [`./websocket.md`](./websocket.md#automations). Import the type from `@/types/automations` rather than hand-rolling it.

### 8.2 The 5 DB-write branch statuses

Every time the automation engine evaluates a rule and writes a row to `automation_executions`, it emits one of these statuses. Your UI should render each one differently:

| `data.status`          | Meaning                                                                                     | Recommended UI                                   |
|------------------------|---------------------------------------------------------------------------------------------|--------------------------------------------------|
| `condition_not_met`    | The condition tree evaluated false. The rule did **not** fire, no actions ran.              | Don't show by default (noisy); surface in a debug panel. |
| `skipped`              | A safety guard blocked execution (rule disabled, cooldown, rate cap, outside active hours). Check `data.cause.reason`. | Muted banner: "Skipped: {reason}" |
| `success`              | The condition matched and **every** action succeeded.                                        | Green toast: "Rule '{name}' fired successfully". |
| `partial_failure`      | At least one action failed. Inspect `data.cause.action_type` + `data.cause.error`.          | Yellow banner with the failing action name and error. |
| `failure`              | Every action failed (e.g. provider unreachable). Inspect `data.cause.actions` array.        | Red banner with details + retry hint.            |

The status strings are the same values used by the `AutomationExecution.status` enum — [`./automations.md`](./automations.md) documents them with example payloads, and `./automations.types.ts` declares the literal union.

### 8.3 Manual-trigger variant

When a rule is fired via `POST /api/v1/automations/{rule_id}/trigger` (see [Section 9](#9-testing-your-rule)), the engine emits the same envelope **but with `data.trigger_source: "manual"`** (the default is `"auto"`). Your UI should distinguish the two so users don't confuse manual dry-runs with organic firings:

```typescript
function renderExecution(ev: AutomationsEvent) {
  const isManual = ev.data.trigger_source === "manual";
  const badge = isManual ? "[Manual]" : "[Auto]";
  // dispatch by ev.data.status
}
```

### 8.4 Reconnection

If `onclose` fires with a non-1000 code, reconnect with exponential backoff and **re-subscribe** on the `open` event of the new socket. See [`./websocket.md`](./websocket.md#reconnection) for the full lifecycle and subscription protocol.

---

## 9. Testing Your Rule

Two endpoints let you exercise a saved rule without waiting for a real trigger.

### 9.1 Dry-run: `POST /api/v1/automations/{rule_id}/evaluate`

Evaluates the condition tree against current state and returns the result **without** executing actions and **without** emitting a WebSocket event. Use this to preview whether a condition would match right now.

```typescript
import type { EvaluateResponse } from "@/types/automations";
import { apiFetch } from "@/lib/apiClient";

export async function evaluateRule(ruleId: number) {
  return apiFetch<EvaluateResponse>(`/api/v1/automations/${ruleId}/evaluate`, {
    method: "POST",
  });
}
```

```bash
curl -X POST https://pdupun8zpr7exw43.myfritz.net/api/v1/automations/42/evaluate \
  -H "X-API-Key: $API_KEY"
```

The response carries `matched: boolean` plus a `trace` showing which leaves passed/failed — great for building a "why did this not fire?" debugger.

### 9.2 Manual fire: `POST /api/v1/automations/{rule_id}/trigger`

Runs the rule's actions **unconditionally**, bypassing both the condition tree and the safety guards (cooldown / rate cap / active hours / enabled). Writes to the execution log **and** emits an `automations` WebSocket event with `trigger_source: "manual"`.

```typescript
import type { TriggerResponse } from "@/types/automations";

export async function triggerRule(ruleId: number) {
  return apiFetch<TriggerResponse>(`/api/v1/automations/${ruleId}/trigger`, {
    method: "POST",
  });
}
```

```bash
curl -X POST https://pdupun8zpr7exw43.myfritz.net/api/v1/automations/42/trigger \
  -H "X-API-Key: $API_KEY"
```

Use `/evaluate` to verify your condition logic, then `/trigger` to verify your actions, then sit back and watch the real engine fire the rule organically.

---

## 10. Troubleshooting

### Common errors

| Symptom                      | Likely cause                                                                 | Fix                                                       |
|------------------------------|------------------------------------------------------------------------------|-----------------------------------------------------------|
| `401 Unauthorized`           | Missing or wrong `X-API-Key`                                                 | Check `.env.local`; verify header name is exact.          |
| `403 Forbidden`              | Key was revoked                                                              | Rotate via `POST /auth/api-keys` and update env vars.     |
| `422 Unprocessable Entity`   | Unknown `type` discriminator or constraint violation (e.g. `brightness: 300`)| Inspect `error.detail[].loc` to locate the offending field; your UI should already be validating against `min`/`max`/`enum`. |
| `429 Too Many Requests`      | Rate limit exceeded                                                          | Back off; check `Retry-After` header.                     |
| `WebSocket close 1008`       | Invalid `?api_key=` or `?token=` on the handshake URL                        | Reobtain the credential; verify the env var.              |
| `WebSocket close 1013`       | Server at `MAX_CONNECTIONS=10`                                                | Retry with exponential backoff.                           |

### Stale capability cache

The server may cache introspected capability descriptors. Always refetch `/api/v1/capabilities` on editor mount so a user opening the editor right after a provider change sees the latest capability list. If you use a fetch cache (SWR / React Query), bust it on navigation.

### WebSocket reconnection

Standard exponential-backoff pattern: 1s → 2s → 4s → 8s → capped at 30s. Re-subscribe to `automations` in the new socket's `open` handler. The server supports subscribing to any subset of topics per connection; don't try to reuse a closed socket — open a fresh one.

### Nothing renders for a condition type

If `ConditionNodeEditor` shows "Unknown condition type: X", it means your frontend is aware of `X` as a TypeScript union member but the backend didn't return a descriptor for it in `/capabilities`. Most likely: the provider that owns `X` isn't registered on this server (or the `system` block is missing). Re-check `caps.providers.map(p => p.name)`.

---

## Appendix: Error Code Cheatsheet

| Code | Name                           | Context                                             |
|------|--------------------------------|-----------------------------------------------------|
| 200  | OK                             | Standard success                                    |
| 201  | Created                        | Rule created; body is the new `AutomationRule`      |
| 204  | No Content                     | e.g. DELETE /auth/api-keys/{id}                     |
| 401  | Unauthorized                   | Missing/bad `X-API-Key`                             |
| 403  | Forbidden                      | API key revoked                                     |
| 404  | Not Found                      | Rule/device ID not found                            |
| 422  | Unprocessable Entity           | Pydantic validation error (see `detail`)            |
| 429  | Too Many Requests              | Rate limit exceeded                                 |
| 503  | Service Unavailable            | Upstream provider unreachable (Hue bridge, etc.)    |
| WS 1000 | Normal close                | Graceful close; don't reconnect                      |
| WS 1008 | Policy violation            | Auth failed on handshake                            |
| WS 1013 | Try again later             | Server at connection cap                            |

---

**Next steps.** You now have a capability-driven editor that can build arbitrary condition trees, configure all 11 action types, submit rules, and render live execution feedback. The next iteration — not covered here — is typically a rule list view + edit/delete (see `GET /api/v1/automations`, `PATCH /api/v1/automations/{id}`, `DELETE /api/v1/automations/{id}` in [`./automations.md`](./automations.md)) and an execution history panel (`GET /api/v1/automations/{id}/executions`).

Questions? The three files at the top of this guide — [`./automations.md`](./automations.md), [`./websocket.md`](./websocket.md), [`./automations.types.ts`](./automations.types.ts) — are authoritative for every shape you touch.
