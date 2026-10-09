'use client';
/**
 * RunSection — "Prova" (dry-run of the conditions) and "Esegui ora" (run the
 * actions now) for the rule being edited (edit mode only, workspace ROADMAP D1).
 *
 * Both act on the rule as saved on the backend, not on the draft: the parent
 * disables them while there are unsaved changes. D-02: inline-style +
 * var(--token) only.
 */
import { useState } from 'react';
import type { EvaluateResponse, TraceNode, TriggerResponse } from '@/types/automations';
import ConfirmationDialog from '@/app/components/ui/ConfirmationDialog';
import { ITALIAN_LABELS } from '../lib/automations-config';

const OK = '#6aa86a';
const KO = '#ff6676';
const WARN = '#ffb84a';

const NODE_LABELS: Record<string, string> = {
  ...ITALIAN_LABELS.condition,
  and: 'Tutte (AND)',
  or: 'Almeno una (OR)',
  sensor_threshold: 'Soglia sensore',
  sensor_state_change: 'Stato sensore',
  netatmo_temperature_threshold: 'Soglia temperatura Netatmo',
};

const TRIGGER_STATUS: Record<TriggerResponse['status'], { label: string; color: string }> = {
  success: { label: 'Azioni eseguite', color: OK },
  partial_failure: { label: 'Eseguita in parte', color: WARN },
  failure: { label: 'Nessuna azione riuscita', color: KO },
};

const SHORT_CIRCUIT = 'not evaluated (short-circuit)';

type Result =
  | { kind: 'evaluate'; data: EvaluateResponse }
  | { kind: 'trigger'; data: TriggerResponse }
  | { kind: 'error'; message: string };

async function post<T>(ruleId: number, action: 'trigger' | 'evaluate'): Promise<T> {
  const res = await fetch(`/api/v1/automations/${ruleId}/${action}`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(
      action === 'trigger' ? "Errore nell'esecuzione dell'automazione" : 'Errore nella prova delle condizioni',
    );
  }
  return (await res.json()) as T;
}

function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      style={{ width: 7, height: 7, borderRadius: 999, background: color, flexShrink: 0, marginTop: 5 }}
    />
  );
}

function TraceRow({ node, depth }: { node: TraceNode; depth: number }) {
  const skipped = node.detail === SHORT_CIRCUIT;
  const color = skipped ? 'var(--text-2)' : node.matched ? OK : KO;
  const outcome = skipped ? 'non valutata' : node.matched ? 'vera' : 'falsa';
  return (
    <>
      <li
        data-testid="automation-trace-row"
        style={{ display: 'flex', gap: 8, paddingLeft: depth * 14, opacity: skipped ? 0.6 : 1 }}
      >
        <Dot color={color} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
            {NODE_LABELS[node.type] ?? node.type}
            <span style={{ fontWeight: 400, color: 'var(--text-2)' }}> · {outcome}</span>
          </div>
          {node.detail && !skipped && (
            <div style={{ fontSize: 11, color: 'var(--text-2)', overflowWrap: 'anywhere' }}>{node.detail}</div>
          )}
        </div>
      </li>
      {node.children.map((child, i) => (
        <TraceRow key={i} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

export interface RunSectionProps {
  ruleId: number;
  ruleName: string;
  /** Unsaved changes in the editor: the buttons would act on the saved rule. */
  isDirty: boolean;
  /** Called after "Esegui ora" answered (a new execution row exists). */
  onTriggered?: () => void;
}

export function RunSection({ ruleId, ruleName, isDirty, onTriggered }: RunSectionProps) {
  const [busy, setBusy] = useState<'trigger' | 'evaluate' | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const disabled = isDirty || busy !== null;

  const run = async (action: 'trigger' | 'evaluate') => {
    setBusy(action);
    setResult(null);
    try {
      if (action === 'trigger') {
        setResult({ kind: 'trigger', data: await post<TriggerResponse>(ruleId, action) });
        onTriggered?.();
      } else {
        setResult({ kind: 'evaluate', data: await post<EvaluateResponse>(ruleId, action) });
      }
    } catch (err) {
      setResult({ kind: 'error', message: err instanceof Error ? err.message : 'Errore sconosciuto' });
    } finally {
      setBusy(null);
    }
  };

  const button = {
    flex: 1,
    height: 38,
    borderRadius: 10,
    border: '0.5px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.06)',
    color: disabled ? 'rgba(255,255,255,0.35)' : '#fff',
    fontSize: 12,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
  } as const;
  const hint = { fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 } as const;
  const panel = {
    marginTop: 10,
    padding: '10px 12px',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid rgba(255,255,255,0.06)',
  } as const;
  const list = {
    listStyle: 'none',
    margin: '8px 0 0',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  } as const;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => void run('evaluate')} disabled={disabled} style={button}>
          {busy === 'evaluate' ? 'Prova in corso…' : 'Prova'}
        </button>
        <button type="button" onClick={() => setShowConfirm(true)} disabled={disabled} style={button}>
          {busy === 'trigger' ? 'Esecuzione…' : 'Esegui ora'}
        </button>
      </div>

      {isDirty && (
        <div style={{ ...hint, marginTop: 8 }}>Salva le modifiche per provare o eseguire l&apos;automazione.</div>
      )}

      {result?.kind === 'error' && (
        <div role="alert" style={{ ...hint, marginTop: 8, color: KO }}>
          {result.message}
        </div>
      )}

      {result?.kind === 'evaluate' && (
        <div role="status" aria-label="Esito della prova" style={panel}>
          <div style={{ fontSize: 13, fontWeight: 600, color: result.data.matched ? OK : KO }}>
            {result.data.matched ? 'Condizioni soddisfatte adesso' : 'Condizioni non soddisfatte adesso'}
          </div>
          <div style={hint}>Solo una prova: nessuna azione eseguita.</div>
          <ul aria-label="Dettaglio condizioni" style={list}>
            <TraceRow node={result.data.trace} depth={0} />
          </ul>
        </div>
      )}

      {result?.kind === 'trigger' && (
        <div role="status" aria-label="Esito dell'esecuzione" style={panel}>
          <div style={{ fontSize: 13, fontWeight: 600, color: TRIGGER_STATUS[result.data.status]?.color ?? '#fff' }}>
            {TRIGGER_STATUS[result.data.status]?.label ?? result.data.status}
          </div>
          <ul aria-label="Dettaglio azioni" style={list}>
            {result.data.action_results.map((a) => (
              <li key={a.index} data-testid="automation-action-result" style={{ display: 'flex', gap: 8 }}>
                <Dot color={a.success ? OK : KO} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
                    {(ITALIAN_LABELS.action as Record<string, string>)[a.action_type] ?? a.action_type}
                    <span style={{ fontWeight: 400, color: 'var(--text-2)' }}>
                      {' '}
                      · {a.success ? 'riuscita' : 'fallita'}
                    </span>
                  </div>
                  {a.error && (
                    <div style={{ fontSize: 11, color: 'var(--text-2)', overflowWrap: 'anywhere' }}>{a.error}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          void run('trigger');
        }}
        title={`Eseguire ora "${ruleName}"?`}
        description="Le azioni partono subito, senza controllare condizioni, pausa minima e limite orario."
        confirmLabel="Esegui ora"
        cancelLabel="Annulla"
        variant="default"
      />
    </div>
  );
}
