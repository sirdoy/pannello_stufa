'use client';

/**
 * AutomationsTab — Phase 180 Plan 08 Task 3
 *
 * Orchestrator for the /automazioni route.
 * Owns: page chrome (headline + counter + Nuova button) + list + Sheet + editor wiring.
 *
 * Design rules:
 *  - D-02: inline-style + var(--token) only. Zero Tailwind for visual values.
 *  - D-13: create dispatches POST body; update dispatches PATCH delta (via hook).
 *  - paddingTop: 70 accounts for the Phase 181 nav bar overlay.
 *
 * Bundle source: automations.jsx lines 102-169
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { AutomationRule, AutomationRuleCreate, AutomationRulePatch } from '@/types/automations';
import { useAutomationsList } from '@/app/hooks/useAutomationsList';
import { Sheet } from '../Sheet';
import { AutomationRow } from './AutomationRow';
import { AutomationEditor } from './AutomationEditor';

type EditingState = AutomationRule | 'new' | null;

export function AutomationsTab() {
  const {
    rules,
    totalCount,
    loading,
    create,
    update,
    remove,
    toggle,
  } = useAutomationsList({ pageSize: 20 });

  const [editingRule, setEditingRule] = useState<EditingState>(null);

  const handleClose = () => setEditingRule(null);
  const isNew = editingRule === 'new';

  const enabledCount = rules.filter((r) => r.enabled).length;

  const handleSaveCreate = async (body: AutomationRuleCreate) => {
    await create(body);
    setEditingRule(null);
  };

  const handleSavePatch = async (id: number, patch: AutomationRulePatch) => {
    await update(id, patch);
    setEditingRule(null);
  };

  const handleDelete = async (id: number) => {
    await remove(id);
    setEditingRule(null);
  };

  return (
    <>
      <div style={{ paddingTop: 70 }}>
        {/* Page header: counter + headline + Nuova button */}
        <div
          style={{
            padding: '0 20px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 16,
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-2)',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              {enabledCount} di {totalCount} attive
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 30,
                fontWeight: 600,
                color: '#fff',
                letterSpacing: -0.8,
                lineHeight: 1.2,
              }}
            >
              Automazioni
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEditingRule('new')}
            aria-label="Nuova automazione"
            style={{
              height: 38,
              padding: '0 14px',
              borderRadius: 999,
              background: 'var(--accent)',
              border: 'none',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
            }}
          >
            <Plus size={14} /> Nuova
          </button>
        </div>

        {/* Rule list */}
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Empty state */}
          {!loading && rules.length === 0 && (
            <div
              style={{
                padding: 24,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.03)',
                border: '0.5px dashed rgba(255,255,255,0.12)',
                color: 'var(--text-2)',
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              Nessuna automazione. Tocca <strong>Nuova</strong> per crearne una.
            </div>
          )}

          {rules.map((r) => (
            <AutomationRow
              key={r.id}
              rule={r}
              onOpen={(rule) => setEditingRule(rule)}
              onToggle={toggle}
            />
          ))}
        </div>
      </div>

      {/* Sheet — always mounted; open reflects editingRule !== null */}
      <Sheet
        open={editingRule !== null}
        onClose={handleClose}
        title={isNew ? 'Nuova automazione' : 'Modifica automazione'}
      >
        {editingRule !== null && (
          <AutomationEditor
            rule={isNew ? null : (editingRule as AutomationRule)}
            isNew={isNew}
            onSaveCreate={handleSaveCreate}
            onSavePatch={handleSavePatch}
            onDelete={handleDelete}
            onClose={handleClose}
          />
        )}
      </Sheet>
    </>
  );
}
