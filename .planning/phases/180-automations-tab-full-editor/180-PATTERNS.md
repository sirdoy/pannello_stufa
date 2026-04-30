---
phase: 180
slug: automations-tab-full-editor
mapped: 2026-04-30
files_analyzed: 36
analogs_found: 36 / 36
---

# Phase 180: Automations Tab Full Editor — Pattern Map

**Mapped:** 2026-04-30
**Files analyzed:** 36 (new/modified files per CONTEXT D-31 wave layout + D-05 consumer fixes)
**Analogs found:** 36 / 36

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `types/automations.ts` | model | transform | `types/automations.ts` (current stub → rewrite) | self |
| `app/automazioni/page.tsx` | route | request-response | `app/stanze/page.tsx` | exact |
| `app/hooks/useAutomationsList.ts` | hook | CRUD | `app/automations/page.tsx` inline `useAutomations` hook | role-match |
| `app/components/EmberGlass/automations/types.ts` | model | transform | `app/components/EmberGlass/rooms/types.ts` | exact |
| `app/components/EmberGlass/automations/lib/automations-config.ts` | utility | transform | `app/components/EmberGlass/rooms/lib/rooms-config.ts` | role-match |
| `app/components/EmberGlass/automations/lib/automations-mappers.ts` | utility | transform | `app/components/EmberGlass/rooms/lib/getDevicesForRoom.ts` | role-match |
| `app/components/EmberGlass/automations/lib/countConditions.ts` | utility | transform | `app/components/EmberGlass/rooms/lib/getDevicesForRoom.ts` | role-match |
| `app/components/EmberGlass/automations/lib/describeTrigger.ts` | utility | transform | `lib/hooks/useRelativeTime.ts` (pure-function part) | role-match |
| `app/components/EmberGlass/automations/AutomationsTab.tsx` | component | CRUD | `app/components/EmberGlass/rooms/RoomsTab.tsx` | exact |
| `app/components/EmberGlass/automations/AutomationRow.tsx` | component | request-response | `app/components/EmberGlass/rooms/RoomCard.tsx` | exact |
| `app/components/EmberGlass/automations/AutomationEditor.tsx` | component | CRUD | `app/components/EmberGlass/rooms/RoomSheet.tsx` | exact |
| `app/components/EmberGlass/automations/sections/TriggerSection.tsx` | component | request-response | `app/components/EmberGlass/rooms/DeviceCard.tsx` | role-match |
| `app/components/EmberGlass/automations/sections/ConditionsSection.tsx` | component | request-response | same | role-match |
| `app/components/EmberGlass/automations/sections/ActionsSection.tsx` | component | request-response | same | role-match |
| `app/components/EmberGlass/automations/sections/AdvancedSection.tsx` | component | request-response | same | role-match |
| `app/components/EmberGlass/automations/ConditionGroup.tsx` | component | request-response | `app/components/EmberGlass/rooms/DeviceBody.tsx` | role-match |
| `app/components/EmberGlass/automations/ConditionItem.tsx` | component | request-response | same | role-match |
| `app/components/EmberGlass/automations/ActionRow.tsx` | component | request-response | same | role-match |
| `app/components/EmberGlass/automations/forms/TriggerForms.tsx` | component | request-response | `app/automations/page.tsx` FormModal body | role-match |
| `app/components/EmberGlass/automations/forms/ConditionForms.tsx` | component | request-response | same | role-match |
| `app/components/EmberGlass/automations/forms/ActionForms.tsx` | component | request-response | same | role-match |
| `app/components/EmberGlass/automations/primitives/FieldLabel.tsx` | component | request-response | `app/components/EmberGlass/rooms/primitives/StatChip.tsx` | role-match |
| `app/components/EmberGlass/automations/primitives/TextInput.tsx` | component | request-response | same | role-match |
| `app/components/EmberGlass/automations/primitives/NumInput.tsx` | component | request-response | same | role-match |
| `app/components/EmberGlass/automations/primitives/SegmentedControl.tsx` | component | request-response | same | role-match |
| `app/components/EmberGlass/automations/primitives/TwoCol.tsx` | component | request-response | same | role-match |
| `app/components/EmberGlass/automations/primitives/TypeTile.tsx` | component | request-response | `app/components/EmberGlass/rooms/DeviceChip.tsx` | role-match |
| `app/components/EmberGlass/automations/primitives/AddChip.tsx` | component | request-response | same | role-match |
| `app/components/EmberGlass/automations/primitives/Pill.tsx` | component | request-response | same | role-match |
| `app/components/EmberGlass/automations/primitives/CronHint.tsx` | component | request-response | none (novel) | no-analog |
| `app/components/EmberGlass/automations/primitives/IconBtn.tsx` | component | request-response | `app/components/EmberGlass/rooms/primitives/MiniButton.tsx` | role-match |
| `app/components/EmberGlass/automations/index.ts` | config | transform | `app/components/EmberGlass/rooms/index.ts` | exact |
| `tests/smoke/automations-tab.spec.ts` | test | request-response | `tests/smoke/rooms-tab.spec.ts` | exact |
| `app/automations/page.tsx` (modify) | component | CRUD | self (bug fix) | self |
| `app/automations/[rule_id]/page.tsx` (modify) | component | CRUD | self (bug fix) | self |
| `__tests__/lib/automationsProxy.test.ts` (modify) | test | CRUD | self (fixture rewrite) | self |

---

## Pattern Assignments

### `app/automazioni/page.tsx` (route, request-response)

**Analog:** `app/stanze/page.tsx`

**Full pattern** (lines 1–24):
```tsx
'use client';
/**
 * /automazioni route — Phase 180 (CONTEXT D-06 / D-29).
 *
 * Mounts <AutomationsTab /> as a client route.
 * Auth0 wrap is automatic via app/layout.tsx ClientProviders.
 * Pattern mirrors app/stanze/page.tsx (Phase 179 D-04).
 *
 * Tailwind layout class on <section> is the explicit carve-out per
 * PATTERNS §Inline-style + var(--token) (Phase 177 precedent).
 */
import { AutomationsTab } from '@/app/components/EmberGlass/automations';

export const dynamic = 'force-dynamic';

export default function AutomazioniPage() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <h1 className="sr-only">Automazioni</h1>
      <AutomationsTab />
    </section>
  );
}
```

---

### `app/hooks/useAutomationsList.ts` (hook, CRUD)

**Analog:** `app/automations/page.tsx` inline `useAutomations` hook (lines 35–65)

**Imports pattern** (analog lines 1–10):
```tsx
import { useState, useEffect, useCallback } from 'react';
import type { PaginatedResponse } from '@/types/common';
import type { AutomationRule } from '@/types/automations';
// Phase 180 adds:
import { automationsProxy } from '@/lib/automations/automationsProxy';
import { useToast } from '@/app/hooks/useToast';
```

**Core hook pattern** (analog lines 35–65):
```tsx
// Pattern from app/automations/page.tsx useAutomations():
function useAutomations() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await automationsProxy.getAutomations({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
      setRules(data.items);
      setTotalCount(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { rules, totalCount, loading, error, refetch, page, setPage };
}
```

**Mutation pattern** (analog lines 80–142) — Phase 180 adds toast + proxy calls:
```tsx
// Pattern for create/update/delete (from app/automations/page.tsx handleCreate):
const { success: toastSuccess, error: toastError } = useToast();

const create = useCallback(async (body: AutomationRuleCreate) => {
  try {
    await automationsProxy.createAutomation(body);
    toastSuccess('Automazione creata');
    await refetch();
  } catch (err) {
    toastError(err instanceof Error ? err.message : 'Errore durante il salvataggio');
    throw err;
  }
}, [refetch, toastSuccess, toastError]);
```

**Toggle (optimistic) pattern** — new for Phase 180:
```tsx
const toggle = useCallback(async (id: number, currentEnabled: boolean) => {
  // Optimistic update
  setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !currentEnabled } : r));
  try {
    await automationsProxy.updateAutomation(String(id), { enabled: !currentEnabled });
  } catch (err) {
    // Rollback on error
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: currentEnabled } : r));
    toastError(err instanceof Error ? err.message : 'Errore durante il salvataggio');
  }
}, [toastError]);
```

---

### `app/components/EmberGlass/automations/types.ts` (model, transform)

**Analog:** `app/components/EmberGlass/rooms/types.ts`

**Pattern** (analog lines 1–101 — structure):
```ts
/**
 * Phase 180 — Automations tab canonical UI type contracts.
 * Re-exports API types from @/types/automations (which re-exports from
 * docs/api/automations.types). Adds UI-internal draft shapes.
 */
export type { AutomationRule, TriggerType, ConditionNode, ActionItem,
  AutomationRuleCreate, AutomationRulePatch } from '@/types/automations';

// UI-internal shapes (not on the API)
export interface UIConditionGroup {
  kind: 'group';
  op: 'AND' | 'OR';
  items: UIConditionNode[];
}
export interface UIConditionLeaf {
  kind: 'cond';
  // spreads the API ConditionNode leaf shape — discriminated by `type`
  type: string;
  [key: string]: unknown;
}
export type UIConditionNode = UIConditionGroup | UIConditionLeaf;

export interface UIDraft {
  name: string;
  description: string | null;
  enabled: boolean;
  trigger: TriggerType | null;
  conditions: UIConditionGroup; // always AND-root (D-10)
  actions: ActionItem[];
  min_interval_seconds: number;
  max_triggers_per_hour: number;
}
```

---

### `types/automations.ts` (model, transform — REWRITE per D-05)

**Analog:** existing file (self — full rewrite)

**Target pattern** (from CONTEXT D-05):
```ts
// types/automations.ts — D-05 rewrite
export * from '@/docs/api/automations.types';
import type {
  AutomationRule,
  AutomationRuleCreate,
  AutomationRulePatch,
  AutomationExecution,
} from '@/docs/api/automations.types';
export type { AutomationRule, AutomationRuleCreate, AutomationRulePatch, AutomationExecution };

/** @deprecated alias kept for legacy imports — use AutomationRuleCreate */
export type AutomationCreate = AutomationRuleCreate;
/** @deprecated alias kept for legacy imports — use AutomationRulePatch */
export type AutomationUpdate = AutomationRulePatch;
```

**Critical fix in `app/automations/page.tsx` line 183** (legacy consumer):
```tsx
// BEFORE (broken): row.original.last_execution_at
// AFTER: last_triggered_at is number (Unix seconds) → convert to ms
const val = row.original.last_triggered_at;
return val ? new Date(val * 1000).toLocaleString('it-IT') : '—';
```

---

### `app/components/EmberGlass/automations/lib/automations-config.ts` (utility, transform)

**Analog:** `app/components/EmberGlass/rooms/lib/rooms-config.ts`

**Imports pattern** (analog lines 1–31):
```ts
import {
  Clock, Power, Alarm, Home, Calendar, Flame,
  Lightbulb, Plug, Music, AlertCircle, Zap,
  Thermometer, Sparkles, Check,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TriggerType, ConditionNode, ActionItem } from '@/types/automations';
```

**Catalog pattern** (analog lines 34–41 `ROOMS` → `TRIGGER_TYPES`):
```ts
// Pattern: ReadonlyArray satisfies const tuple
export const TRIGGER_TYPES = [
  { id: 'schedule_cron' as const, label: 'Pianificazione', Icon: Clock, tone: '#5eafff', desc: 'Ora o cron schedule' },
  { id: 'manual_api_call' as const, label: 'Manuale', Icon: Power, tone: 'var(--text-2)', desc: 'Attivata solo via app o API' },
] as const satisfies readonly Array<{ id: TriggerType['type']; label: string; Icon: LucideIcon; tone: string; desc: string }>;
```

**Factory pattern** (new — no direct analog, but follows pure-function convention):
```ts
export function defaultTrigger(type: TriggerType['type']): TriggerType {
  switch (type) {
    case 'schedule_cron': return { type: 'schedule_cron', cron_expression: '0 8 * * *' };
    case 'manual_api_call': return { type: 'manual_api_call' };
    default: return assertNever(type);
  }
}
```

---

### `app/components/EmberGlass/automations/lib/automations-mappers.ts` (utility, transform)

**Analog:** `app/components/EmberGlass/rooms/lib/getDevicesForRoom.ts` (pure transform function)

**Pattern** — pure function, no React, no I/O:
```ts
/**
 * Pure mappers — no React, no side effects.
 * Implements D-10 condition root normalization.
 */
import type { AutomationRule, AutomationRuleCreate, AutomationRulePatch, ConditionNode } from '@/types/automations';
import type { UIDraft, UIConditionGroup, UIConditionNode } from '../types';

export function apiToDraft(rule: AutomationRule): UIDraft {
  return {
    name: rule.name,
    description: rule.description ?? null,
    enabled: rule.enabled,
    trigger: rule.trigger ?? null,
    conditions: conditionNodeToUIGroup(rule.condition),
    actions: [...rule.actions],
    min_interval_seconds: rule.min_interval_seconds,
    max_triggers_per_hour: rule.max_triggers_per_hour,
  };
}

function conditionNodeToUIGroup(node: ConditionNode): UIConditionGroup {
  if (node.type === 'always_true') return { kind: 'group', op: 'AND', items: [] };
  if (node.type === 'and' || node.type === 'or') {
    return {
      kind: 'group',
      op: node.type === 'and' ? 'AND' : 'OR',
      items: node.conditions.map(asUINode),
    };
  }
  // bare leaf — wrap in AND root
  return { kind: 'group', op: 'AND', items: [{ kind: 'cond', ...node }] };
}

function asUINode(node: ConditionNode): UIConditionNode {
  if (node.type === 'and' || node.type === 'or') {
    return conditionNodeToUIGroup(node) as unknown as UIConditionNode;
  }
  return { kind: 'cond', ...node };
}

export function draftToApi(draft: UIDraft): AutomationRuleCreate {
  return {
    name: draft.name,
    description: draft.description,
    enabled: draft.enabled,
    trigger: draft.trigger,
    condition: uiGroupToConditionNode(draft.conditions),
    actions: draft.actions,
    min_interval_seconds: draft.min_interval_seconds,
    max_triggers_per_hour: draft.max_triggers_per_hour,
  };
}

function uiGroupToConditionNode(group: UIConditionGroup): ConditionNode {
  if (group.items.length === 0) return { type: 'always_true' };
  if (group.items.length === 1 && group.items[0]!.kind === 'cond') {
    const { kind: _, ...leaf } = group.items[0]!;
    return leaf as unknown as ConditionNode;
  }
  return {
    type: group.op.toLowerCase() as 'and' | 'or',
    conditions: group.items.map(asApiNode),
  };
}
```

---

### `app/components/EmberGlass/automations/lib/countConditions.ts` (utility, transform)

**Analog:** pure recursion pattern — no direct analog; closest is `app/components/EmberGlass/rooms/lib/getDevicesForRoom.ts`

**Pattern** (pure recursive function, from bundle line 236-244):
```ts
import type { ConditionNode } from '@/types/automations';

/** Counts leaf condition nodes recursively. always_true = 0. */
export function countConditions(node: ConditionNode): number {
  if (node.type === 'always_true') return 0;
  if (node.type === 'and' || node.type === 'or') {
    return node.conditions.reduce((sum, c) => sum + countConditions(c), 0);
  }
  return 1; // leaf
}
```

---

### `app/components/EmberGlass/automations/lib/describeTrigger.ts` (utility, transform)

**Analog:** `lib/hooks/useRelativeTime.ts` pure-function part (`formatRelativeTime` lines 13–21)

**Pattern** (pure function, Italian output, null-safe):
```ts
import type { TriggerType } from '@/types/automations';

/** Returns the trigger status pill string (Italian). */
export function describeTrigger(trigger: TriggerType | null | undefined): string {
  if (!trigger) return 'Manuale';
  switch (trigger.type) {
    case 'schedule_cron': return `⏰ ${trigger.cron_expression}`;
    case 'manual_api_call': return 'Manuale';
    default: return 'Manuale';
  }
}
```

---

### `app/components/EmberGlass/automations/AutomationsTab.tsx` (component, CRUD)

**Analog:** `app/components/EmberGlass/rooms/RoomsTab.tsx`

**Imports pattern** (analog lines 1–27):
```tsx
'use client';
import { useState } from 'react';
import { useAutomationsList } from '@/app/hooks/useAutomationsList';
import { AutomationRow } from './AutomationRow';
import { AutomationEditor } from './AutomationEditor';
import { Sheet } from '@/app/components/EmberGlass/Sheet';
import type { AutomationRule } from '@/types/automations';
import type { UIDraft } from './types';
```

**Orchestrator pattern** (analog lines 29–171):
```tsx
export function AutomationsTab() {
  const { rules, totalCount, loading, error, refetch, page, setPage,
          create, update, remove, toggle } = useAutomationsList({ pageSize: 20 });
  const [editingRule, setEditingRule] = useState<AutomationRule | 'new' | null>(null);

  const handleClose = () => setEditingRule(null);
  const isNew = editingRule === 'new';

  return (
    <>
      {/* Page chrome — bundle line 132-148: 70px top padding + title + "Nuova" button */}
      <div style={{ paddingTop: 70 }}>
        <div style={{ padding: '0 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {rules.filter(r => r.enabled).length} di {totalCount} attive
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: '#fff', letterSpacing: -0.8 }}>
              Automazioni
            </div>
          </div>
          {/* "Nuova" pill CTA — bundle line 139 */}
          <button
            type="button"
            onClick={() => setEditingRule('new')}
            style={{ height: 38, padding: '0 14px', borderRadius: 999, background: 'var(--accent)',
                     border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                     display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> Nuova
          </button>
        </div>
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rules.map(r => (
            <AutomationRow key={r.id} rule={r} onToggle={toggle} onOpen={() => setEditingRule(r)} />
          ))}
        </div>
      </div>
      <Sheet
        open={!!editingRule}
        onClose={handleClose}
        title={isNew ? 'Nuova automazione' : 'Modifica automazione'}
      >
        {editingRule && (
          <AutomationEditor
            rule={isNew ? null : (editingRule as AutomationRule)}
            isNew={isNew}
            onSave={isNew ? create : update}
            onDelete={remove}
            onClose={handleClose}
          />
        )}
      </Sheet>
    </>
  );
}
```

---

### `app/components/EmberGlass/automations/AutomationRow.tsx` (component, request-response)

**Analog:** `app/components/EmberGlass/rooms/RoomCard.tsx`

**Glass row pattern** (analog lines 33–107, adapted from bundle lines 172–212):
```tsx
// Row background: enabled=true uses tone gradient (bundle line 175-177)
// enabled=false uses flat glass (bundle line 178-179)
const bg = rule.enabled
  ? `linear-gradient(135deg, color-mix(in oklab, ${tone} 10%, rgba(255,255,255,0.04)) 0%, rgba(255,255,255,0.03) 100%)`
  : 'rgba(255,255,255,0.03)';
const border = rule.enabled
  ? `0.5px solid color-mix(in oklab, ${tone} 22%, rgba(255,255,255,0.06))`
  : '0.5px solid rgba(255,255,255,0.06)';

// Row container — bundle line 174
<div
  onClick={onOpen}
  style={{ borderRadius: 'var(--r-card)', padding: 14, background: bg, border,
           cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
>
  {/* 40×40 icon container — bundle line 181-189 */}
  <div style={{ width: 40, height: 40, borderRadius: 12,
                background: rule.enabled ? `color-mix(in oklab, ${tone} 18%, transparent)` : 'rgba(255,255,255,0.05)',
                color: rule.enabled ? tone : 'rgba(255,255,255,0.4)', display: 'flex',
                alignItems: 'center', justifyContent: 'center' }}>
    <Icon size={18} />
  </div>
  {/* Name + description + pills */}
  ...
  {/* InlineToggle — D-13 toggle dispatch (stop propagation) */}
  <InlineToggle on={rule.enabled} color={tone}
    onChange={(e) => { e.stopPropagation(); void onToggle(rule.id, rule.enabled); }} />
</div>
```

**Pill pattern** (bundle lines 214–225):
```tsx
// Pill component — tone-colored, neutral, muted modes
<span style={{
  padding: '4px 9px', borderRadius: 999, fontSize: 10, fontWeight: 600, letterSpacing: 0.2,
  background: tone ? `color-mix(in oklab, ${tone} 16%, transparent)` : 'rgba(255,255,255,0.06)',
  color: tone ?? '#fff',
  border: tone ? `0.5px solid color-mix(in oklab, ${tone} 25%, transparent)` : '0.5px solid rgba(255,255,255,0.08)',
}}>
  {children}
</span>
```

---

### `app/components/EmberGlass/automations/AutomationEditor.tsx` (component, CRUD)

**Analog:** `app/components/EmberGlass/rooms/RoomSheet.tsx`

**Sheet consumer pattern** (analog lines 37–123):
```tsx
// Sheet is imported from Phase 175 — NOT re-implemented
import { Sheet } from '../Sheet';   // already done by AutomationsTab — editor is Sheet's children

// Editor is mounted as children of Sheet in AutomationsTab:
// <Sheet open={!!editingRule} onClose={handleClose} title={...}>
//   <AutomationEditor ... />
// </Sheet>
```

**Tab bar pattern** (bundle lines 274–300):
```tsx
// 4-tab segmented control (inline-style, bundle verbatim)
const TABS = ['Trigger', 'Condizioni', 'Azioni', 'Avanzate'] as const;
// Tab container — bundle line 276-282:
<div style={{
  display: 'grid', gridTemplateColumns: `repeat(${TABS.length}, 1fr)`,
  gap: 4, padding: 4, borderRadius: 12,
  background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.06)',
  marginBottom: 16,
}}>
  {TABS.map((tab, i) => (
    <button key={tab} onClick={() => setActiveTab(i)} style={{
      padding: '8px 4px', borderRadius: 9, border: 'none',
      background: activeTab === i ? 'rgba(255,255,255,0.09)' : 'transparent',
      color: activeTab === i ? '#fff' : 'var(--text-2)',
      fontSize: 11, fontWeight: 600, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    }}>
      {tab}
      {/* Badge on Condizioni/Azioni — bundle line 286-289 */}
      {(i === 1 || i === 2) && badgeCount > 0 && (
        <span aria-label={`${badgeCount} ${i === 1 ? 'condizioni' : 'azioni'}`} style={{
          background: 'var(--accent)', color: '#fff', fontSize: 9, fontWeight: 700,
          padding: '1px 5px', borderRadius: 999,
        }}>{badgeCount}</span>
      )}
    </button>
  ))}
</div>
```

**Dirty-tracking + unsaved-changes guard pattern** (D-15):
```tsx
const [original] = useState<UIDraft | null>(() => rule ? apiToDraft(rule) : null);
const [draft, setDraft] = useState<UIDraft>(() => rule ? apiToDraft(rule) : emptyDraft());
const isDirty = JSON.stringify(original) !== JSON.stringify(draft);

const handleClose = () => {
  if (isDirty) { setShowUnsavedDialog(true); return; }
  onClose();
};
// ConfirmationDialog (existing component) for unsaved-changes guard
<ConfirmationDialog
  isOpen={showUnsavedDialog}
  onClose={() => setShowUnsavedDialog(false)}
  onConfirm={() => { setShowUnsavedDialog(false); onClose(); }}
  title="Hai modifiche non salvate. Chiudere lo stesso?"
  confirmLabel="Chiudi senza salvare"
  cancelLabel="Continua a modificare"
  variant="default"
/>
```

**Footer pattern** (bundle lines 305–320):
```tsx
// Footer — bundle line 308: 46px height, 12px radius
const saveAllowed = draft.name.trim().length >= 1 && draft.actions.length >= 1;
<div style={{ display: 'flex', gap: 8, marginTop: 24, marginBottom: 20 }}>
  {!isNew && (
    <button onClick={() => setShowDeleteDialog(true)}
      style={{ height: 46, flex: '0 0 auto', padding: '0 16px', borderRadius: 12,
               color: '#ff6676', background: 'rgba(255,102,118,0.08)',
               border: '0.5px solid rgba(255,102,118,0.25)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
      Elimina
    </button>
  )}
  <button onClick={handleClose} style={{ flex: 1, height: 46, borderRadius: 12,
    border: '0.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
    color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
    Annulla
  </button>
  <button onClick={handleSave} disabled={!saveAllowed} aria-disabled={!saveAllowed}
    style={{ flex: 1, height: 46, borderRadius: 12, border: 'none',
             background: saveAllowed ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
             boxShadow: saveAllowed ? '0 4px 20px color-mix(in oklab, var(--accent) 40%, transparent)' : 'none',
             color: '#fff', fontSize: 14, fontWeight: 600,
             cursor: saveAllowed ? 'pointer' : 'not-allowed' }}>
    {isNew ? 'Crea automazione' : 'Salva modifiche'}
  </button>
</div>
```

---

### `app/components/EmberGlass/automations/sections/TriggerSection.tsx` (component, request-response)

**Analog:** bundle lines 325–397; inline-style convention from `RoomSheet.tsx`

**Edit-mode read-only pattern** (D-12 — unique to this phase):
```tsx
// TypeTile — disabled state when !isNew (D-12)
<TypeTile
  icon={<Icon size={13} />}
  label={t.label}
  tone={t.tone}
  selected={draft.trigger?.type === t.id}
  disabled={!isNew}
  onClick={() => !isNew ? undefined : onSelectTrigger(t.id)}
/>

// TypeTile disabled visual — bundle line 894-896 + UI-SPEC line 274
style={{
  ...(disabled ? { opacity: 0.45, cursor: 'not-allowed', pointerEvents: 'none' } : {}),
}}

// Edit-mode explanatory note (D-12)
{!isNew && (
  <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10 }}>
    Per cambiare il trigger, elimina e ricrea l'automazione.
  </div>
)}
```

---

### `app/components/EmberGlass/automations/ConditionGroup.tsx` (component, request-response)

**Analog:** bundle lines 420–491

**Recursive component + depth guard pattern** (D-11):
```tsx
// Depth-aware bar color (UI-SPEC line 194)
const opColor = op === 'AND' ? '#5eafff' : '#ffb84a';

// Left sidebar — only at depth > 0 (bundle line 428)
{depth > 0 && (
  <div style={{ width: 2, background: `color-mix(in oklab, ${opColor} 35%, transparent)`,
                alignSelf: 'stretch', borderRadius: 1, flexShrink: 0 }} />
)}

// "+ Gruppo" hidden at depth >= 2 (D-11, bundle line 487)
{depth < 2 && <AddChip onClick={addGroup}>{op === 'AND' ? '+ Gruppo O' : '+ Gruppo E'}</AddChip>}

// Recursive rendering
{group.items.map((item, i) => (
  item.kind === 'group'
    ? <ConditionGroup key={i} group={item} depth={depth + 1} ... />
    : <ConditionItem key={i} item={item} ... />
))}
```

---

### `app/components/EmberGlass/automations/ActionRow.tsx` (component, request-response)

**Analog:** bundle lines 641–674

**Numbered row + ↑/↓/remove pattern** (bundle verbatim):
```tsx
// Tone-based card background (UI-SPEC line 338)
const tone = ACTION_TYPES.find(a => a.id === action.type)?.tone ?? 'var(--text-2)';
<div style={{
  padding: 12, borderRadius: 12,
  background: `color-mix(in oklab, ${tone} 8%, rgba(255,255,255,0.03))`,
  border: `0.5px solid color-mix(in oklab, ${tone} 18%, rgba(255,255,255,0.06))`,
}}>
  {/* Number badge — bundle line 656-660 */}
  <span style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.06)',
                 color: 'var(--text-2)', fontSize: 10, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                 display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {index + 1}
  </span>
  {/* ↑/↓/remove IconBtns */}
  <IconBtn onClick={onMoveUp} disabled={index === 0} aria-label="Sposta su"><ChevronUp size={12} /></IconBtn>
  <IconBtn onClick={onMoveDown} disabled={isLast} aria-label="Sposta giù"><ChevronDown size={12} /></IconBtn>
  <IconBtn onClick={onRemove} aria-label="Rimuovi azione"><X size={12} /></IconBtn>
</div>
```

**Unknown action type fallback** (D-09b — fail-open):
```tsx
// Fallback for unknown action type loaded from API (D-09b)
default:
  return (
    <div style={{ fontSize: 12, color: 'var(--text-2)', padding: 8 }}>
      Tipo non supportato — <code>{(action as { type: string }).type}</code>
    </div>
  );
```

---

### `app/components/EmberGlass/automations/forms/ActionForms.tsx` (component, request-response)

**Analog:** bundle lines 686–784 (rewritten for 11 API types)

**Exhaustive switch pattern** (strict TS + `assertNever`):
```tsx
// MUST use assertNever to satisfy TS noUncheckedIndexedAccess + strict
function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${String(x)}`);
}

export function ActionForm({ action, onChange }: ActionFormProps) {
  switch (action.type) {
    case 'netatmo_set_room_temp': return <NetatmoSetRoomTempForm action={action} onChange={onChange} />;
    case 'netatmo_set_home_mode': return <NetatmoSetHomeModeForm action={action} onChange={onChange} />;
    // ... all 11 cases
    default: return assertNever(action); // TS enforces exhaustiveness
  }
}
```

**Conditional field pattern** (D-09a — thermorossi example):
```tsx
// thermorossi form — conditional NumInput per command
function ThermorossiForm({ action, onChange }: ...) {
  return (
    <>
      <SegmentedControl
        options={[
          { value: 'ignite', label: 'Accendi' }, { value: 'shutdown', label: 'Spegni' },
          { value: 'set_power', label: 'Potenza' }, { value: 'set_fan', label: 'Ventola' },
          { value: 'set_water_temp', label: 'Temp. acqua' },
        ]}
        value={action.command}
        onChange={(v) => onChange({ ...action, command: v, power_level: null, fan_level: null, water_temp: null })}
      />
      {action.command === 'set_power' && (
        <NumInput label="Livello potenza" min={1} max={5} value={action.power_level}
                  onChange={(v) => onChange({ ...action, power_level: v })} />
      )}
      {action.command === 'set_fan' && (
        <NumInput label="Livello ventola" min={1} max={6} value={action.fan_level}
                  onChange={(v) => onChange({ ...action, fan_level: v })} />
      )}
      {action.command === 'set_water_temp' && (
        <NumInput label="Temp. acqua" min={40} max={80} unit="°C" value={action.water_temp}
                  onChange={(v) => onChange({ ...action, water_temp: v })} />
      )}
    </>
  );
}
```

**JSON validation pattern** (D-09a, D-14 — http_webhook):
```tsx
// http_webhook JSON payload validation — blocks save on parse failure
const [jsonError, setJsonError] = useState<string | null>(null);
const handlePayloadChange = (raw: string) => {
  if (raw.trim() === '') { setJsonError(null); onChange({ ...action, payload: null }); return; }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    setJsonError(null);
    onChange({ ...action, payload: parsed });
  } catch {
    setJsonError('JSON non valido'); // D-14: blocks save
  }
};
```

---

### `app/components/EmberGlass/automations/primitives/TextInput.tsx` (component, request-response)

**Analog:** bundle lines 824–834 (verbatim)

**Pattern** (38px, 0.5px border, 9px radius — UI-SPEC §TextInput):
```tsx
// Props: value, onChange, placeholder, mono?, readOnly?, ...
<input
  value={value}
  onChange={(e) => onChange(e.target.value)}
  readOnly={readOnly}
  style={{
    height: 38, borderRadius: 9,
    background: 'rgba(255,255,255,0.05)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    color: '#fff', padding: '0 11px', fontSize: 13,
    fontFamily: mono ? 'ui-monospace, SF Mono, monospace' : 'inherit',
    outline: 'none', width: '100%', boxSizing: 'border-box',
  }}
/>
```

---

### `app/components/EmberGlass/automations/primitives/SegmentedControl.tsx` (component, request-response)

**Analog:** bundle lines 855–871 (verbatim)

**Pattern** (inline-style, 3px container padding, 7px segment radius):
```tsx
<div style={{
  display: 'flex', padding: 3, borderRadius: 9,
  background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.08)',
}}>
  {options.map(opt => (
    <button key={opt.value} onClick={() => onChange(opt.value)} style={{
      flex: 1, padding: '7px 4px', borderRadius: 7, border: 'none',
      background: value === opt.value ? 'rgba(255,255,255,0.12)' : 'transparent',
      color: value === opt.value ? '#fff' : 'var(--text-2)',
      fontSize: 12, fontWeight: 600, cursor: 'pointer',
    }}>
      {opt.label}
    </button>
  ))}
</div>
```

---

### `app/components/EmberGlass/automations/primitives/TypeTile.tsx` (component, request-response)

**Analog:** bundle lines 877–896 + UI-SPEC §TypeTile

**Selected/unselected/disabled pattern**:
```tsx
<button style={{
  padding: 10, borderRadius: 11, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
  background: selected
    ? `color-mix(in oklab, ${tone} 18%, transparent)`
    : 'rgba(255,255,255,0.04)',
  border: selected
    ? `0.5px solid color-mix(in oklab, ${tone} 40%, transparent)`
    : '0.5px solid rgba(255,255,255,0.06)',
  boxShadow: selected ? `0 0 14px color-mix(in oklab, ${tone} 25%, transparent)` : 'none',
  ...(disabled ? { opacity: 0.45, pointerEvents: 'none' } : {}),
}}>
  <div style={{ width: 26, height: 26, borderRadius: 7, marginBottom: 6,
                background: `color-mix(in oklab, ${tone} 20%, rgba(255,255,255,0.05))`,
                color: tone, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {icon}
  </div>
  <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>{label}</div>
  {desc && <div style={{ fontSize: 10, color: 'var(--text-2)', lineHeight: 1.3, marginTop: 2 }}>{desc}</div>}
</button>
```

---

### `app/components/EmberGlass/automations/primitives/CronHint.tsx` (component, request-response)

**Analog:** bundle lines 907–924 (verbatim — no existing analog in codebase)

**Pattern** (5-segment split display):
```tsx
const LABELS = ['min', 'ora', 'giorno', 'mese', 'giorno sett.'] as const;
function parseCron(expr: string): string[] {
  const parts = expr.trim().split(/\s+/);
  return LABELS.map((_, i) => parts[i] ?? '—');
}

<div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
  {LABELS.map((label, i) => (
    <div key={label} style={{ flex: 1, padding: '4px 6px', borderRadius: 6,
                              background: 'rgba(255,255,255,0.04)', textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: '#fff', fontFamily: 'ui-monospace, monospace', marginTop: 1 }}>
        {segments[i]}
      </div>
    </div>
  ))}
</div>
```

---

### `app/components/EmberGlass/automations/index.ts` (config, transform)

**Analog:** `app/components/EmberGlass/rooms/index.ts` (exact structure)

**Pattern** (lines 1–61 of analog):
```ts
// Barrel re-export — same structure as rooms/index.ts
export { AutomationsTab } from './AutomationsTab';
export { AutomationRow } from './AutomationRow';
export type { AutomationRowProps } from './AutomationRow';
export { AutomationEditor } from './AutomationEditor';
// ... all sub-components, lib, types
export type { UIDraft, UIConditionGroup, UIConditionNode } from './types';
```

**EmberGlass top-level index.ts** — add at bottom (pattern from lines 41–42):
```ts
// Phase 180 — automations tab
export * from './automations';
```

---

### `tests/smoke/automations-tab.spec.ts` (test, request-response)

**Analog:** `tests/smoke/rooms-tab.spec.ts` (lines 1–80 for helpers)

**Helpers to copy verbatim** (rooms-tab.spec.ts lines 33–70):
```ts
// 1. collectConsoleErrors(page) — lines 33–45
// 2. dismissVersionEnforcerIfPresent(page) — lines 53–70
// 3. dismissWhatsNewModalIfPresent(page) — lines 72–120 (approximate)
// 4. primeDashboardForSheetTest(page) — check if needed for /automazioni
```

**Playwright test structure** (D-27):
```ts
test('AutomationsTab E2E', async ({ page }) => {
  const { errors, cleanup } = collectConsoleErrors(page);
  await page.goto('/automazioni');
  await dismissVersionEnforcerIfPresent(page);
  await dismissWhatsNewModalIfPresent(page);

  // Step 1: list renders or empty state
  // Step 2: click "Nuova" → Sheet opens with title "Nuova automazione"
  await page.getByRole('button', { name: /nuova/i }).click();
  await expect(page.getByText('Nuova automazione')).toBeVisible();

  // Step 3: fill name, add log_event action, save
  // Step 4-9: edit, toggle, delete confirm flow
  // Console error assertion (Phase 97 / 51 pattern)
  cleanup();
  expect(errors).toEqual([]);
});
```

---

### Jest test colocation pattern

**Analog:** `app/components/EmberGlass/rooms/__tests__/RoomsTab.test.tsx`

**Mock pattern** (analog lines 21–95):
```tsx
// 1. jest.mock for proxy — static import after mock declaration
jest.mock('@/lib/automations/automationsProxy', () => ({
  automationsProxy: {
    getAutomations: jest.fn(),
    createAutomation: jest.fn(),
    updateAutomation: jest.fn(),
    deleteAutomation: jest.fn(),
  },
}));
import { automationsProxy } from '@/lib/automations/automationsProxy';
const mockGetAutomations = jest.mocked(automationsProxy.getAutomations);

// 2. beforeEach reset pattern (Phase 43 lesson — prevents mock bleed)
beforeEach(() => {
  jest.clearAllMocks();
  mockGetAutomations.mockResolvedValue({ items: [], total_count: 0, limit: 20, offset: 0 });
});

// 3. Toast mock
jest.mock('@/app/hooks/useToast', () => ({
  useToast: () => ({ success: jest.fn(), error: jest.fn() }),
}));
```

**Hook test pattern** (analog: `app/hooks/__tests__/useVersionCheck.test.ts` lines 1–60):
```ts
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { useAutomationsList } from '../useAutomationsList';

// Mock proxy, assert refetch + toast on each mutation
```

---

## Shared Patterns

### Inline-style + var(--token) discipline
**Source:** `app/components/EmberGlass/rooms/RoomsTab.tsx` (lines 117–168), `RoomSheet.tsx` (lines 58–121)
**Apply to:** ALL files under `app/components/EmberGlass/automations/`
**Rule:** No Tailwind classes for visual values (color, size, spacing, font). CSS tokens via `var(--token)` for theme values. Literal pixel values for constants from the bundle. Layout flex/grid also inline. Only `<section className="py-8 sm:py-12 lg:py-16">` on route pages is Tailwind (Phase 177 precedent).

### Sheet integration
**Source:** `app/components/EmberGlass/Sheet.tsx` (complete file, lines 1–179)
**Apply to:** `AutomationsTab.tsx` (Sheet mount), `AutomationEditor.tsx` (Sheet children)
**Key contract:**
```tsx
// ALWAYS provide title prop (D-07 — VisuallyHidden fallback ONLY when unset)
<Sheet open={!!editingRule} onClose={handleClose} title="Nuova automazione">
  {children}
</Sheet>
// handleClose must intercept dirty state before calling onClose
```

### InlineToggle
**Source:** `app/components/EmberGlass/InlineToggle.tsx` (lines 1–63)
**Apply to:** `AutomationRow.tsx`
**Key contract:** Pass `on`, `color` (tone), `onChange`. Stop propagation in parent row's onClick.
```tsx
<InlineToggle
  on={rule.enabled}
  color={tone}
  onChange={(e) => { e.stopPropagation(); void onToggle(rule.id, rule.enabled); }}
/>
```

### ConfirmationDialog
**Source:** `app/components/ui/ConfirmationDialog.tsx` (lines 127–275)
**Apply to:** `AutomationEditor.tsx` (unsaved-changes D-15, delete D-16)
**Key contract:**
```tsx
<ConfirmationDialog
  isOpen={showDialog}
  onClose={() => setShowDialog(false)}
  onConfirm={async () => { ... }}
  title="Hai modifiche non salvate. Chiudere lo stesso?"
  confirmLabel="Chiudi senza salvare"
  cancelLabel="Continua a modificare"
  variant="default"   // "danger" for delete
/>
// Z-index: ConfirmationDialog is Tailwind z-50 (~50) < Sheet z-index 201 → renders ABOVE Sheet correctly
```

### Toast
**Source:** `app/hooks/useToast.ts` (lines 47–55)
**Apply to:** `app/hooks/useAutomationsList.ts` (all mutation paths)
```tsx
const { success, error: toastError } = useToast();
// D-13 toast messages:
success('Automazione creata');     // on POST 201
success('Automazione aggiornata'); // on PATCH 200
success('Automazione eliminata');  // on DELETE 204
toastError(apiMsg ?? 'Errore durante il salvataggio'); // on any error
```

### automationsProxy function-module transport
**Source:** `lib/automations/automationsProxy.ts` (lines 1–68)
**Apply to:** `app/hooks/useAutomationsList.ts`
**Key contract:** Call `automationsProxy.createAutomation / updateAutomation / deleteAutomation / getAutomations`. IDs passed as `String(id)` when calling proxy (proxy contract: `ruleId: string` even though `AutomationRule.id` is now `number`).

### useRelativeTime
**Source:** `lib/hooks/useRelativeTime.ts` (lines 31–52)
**Apply to:** `AutomationRow.tsx`
```tsx
// D-20: last_triggered_at is Unix seconds → convert to ms
const relTime = useRelativeTime(rule.last_triggered_at ? rule.last_triggered_at * 1000 : null);
// Display: relTime ?? 'mai'
```

### Lucide icon import
**Source:** `app/components/EmberGlass/rooms/lib/rooms-config.ts` (lines 17–29)
**Apply to:** `lib/automations-config.ts`, all section + form components
```ts
import { Clock, Power, Thermometer, Home, Calendar, Flame,
         Lightbulb, Plug, Music, AlertCircle, Zap, Sparkles,
         Check, Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
```

### assertNever exhaustive narrowing
**Source:** (project convention — Phase 41 TypeScript migration, zero `as any` from Phase 114-116)
**Apply to:** All switch/dispatch in `ActionForms.tsx`, `TriggerForms.tsx`, `ConditionForms.tsx`, factory functions in `automations-config.ts`
```ts
function assertNever(x: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(x)}`);
}
// Usage: default: return assertNever(action);
```

### Barrel index pattern
**Source:** `app/components/EmberGlass/rooms/index.ts` (lines 1–61)
**Apply to:** `app/components/EmberGlass/automations/index.ts`
**Rule:** Export all public components, types, lib symbols. Then add `export * from './automations'` to `app/components/EmberGlass/index.ts` (lines 41–42 pattern).

### `export const dynamic = 'force-dynamic'`
**Source:** `app/stanze/page.tsx` (line 15)
**Apply to:** `app/automazioni/page.tsx`

---

## No Analog Found

Files with no close match in the codebase (planner uses RESEARCH.md + CONTEXT.md patterns):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `app/components/EmberGlass/automations/primitives/CronHint.tsx` | component | transform | No cron visualization exists in codebase; pattern comes verbatim from bundle lines 907–924 |
| `app/components/EmberGlass/automations/lib/automations-mappers.ts` | utility | transform | No bidirectional API↔UI mapper exists; pure-function pattern from rooms-config.ts but logic is novel |

---

## Metadata

**Analog search scope:** `app/components/EmberGlass/`, `app/hooks/`, `app/automations/`, `lib/automations/`, `lib/hooks/`, `tests/smoke/`
**Files scanned:** 18 files read directly; 6 directories listed
**Pattern extraction date:** 2026-04-30

**Key precedents confirmed:**
- Phase 175 `<Sheet>` API is `open / onClose / title?`; `title` always provided in Phase 180 (D-07). Z-index 200/201 locked.
- Phase 177 `<InlineToggle>` has `on / color / onChange`; stop-propagation is caller's responsibility.
- Phase 179 route pattern: `'use client'` + `export const dynamic = 'force-dynamic'` + `<section className="py-8...">` + SR-only `<h1>`.
- Phase 179 test pattern: `jest.mocked()` + `beforeEach(jest.clearAllMocks)` + mock sub-components to test composition only.
- `automationsProxy` contract: `ruleId` stays `string` even after D-05 type rewrite; callers pass `String(rule.id)`.
- `useRelativeTime` accepts ms timestamps; `last_triggered_at` is Unix seconds — multiply by 1000 at call site.
