'use client';
/**
 * HistorySection — execution log of the rule being edited (edit mode only).
 *
 * Replaces the legacy Ember Noir page app/automations/[rule_id], which no page
 * linked to. D-02: inline-style + var(--token) only.
 */
import type { AutomationExecution } from '@/types/automations';
import { useAutomationHistory } from '../hooks/useAutomationHistory';

const STATUS: Record<AutomationExecution['status'], { label: string; color: string }> = {
  success: { label: 'Completata', color: '#6aa86a' },
  failure: { label: 'Fallita', color: '#ff6676' },
  partial_failure: { label: 'Parziale', color: '#ffb84a' },
  skipped: { label: 'Saltata', color: 'var(--text-2)' },
  condition_not_met: { label: 'Condizione non soddisfatta', color: 'var(--text-2)' },
};

function formatWhen(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface HistorySectionProps {
  ruleId: number;
}

export function HistorySection({ ruleId }: HistorySectionProps) {
  const { items, totalCount, loading, error, hasMore, loadMore, reload } =
    useAutomationHistory(ruleId);

  const hint = { fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 } as const;

  if (error && items.length === 0) {
    return (
      <div role="alert" style={hint}>
        {error}.{' '}
        <button
          type="button"
          onClick={reload}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0 }}
        >
          Riprova
        </button>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return <div style={hint}>Caricamento…</div>;
  }

  if (items.length === 0) {
    return <div style={hint}>Nessuna esecuzione registrata.</div>;
  }

  return (
    <div>
      <div style={{ ...hint, marginBottom: 12 }}>
        {totalCount} esecuzion{totalCount === 1 ? 'e' : 'i'}, dalla più recente.
      </div>
      <ul
        aria-label="Storico esecuzioni"
        style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        {items.map((ex) => {
          const status = STATUS[ex.status] ?? { label: ex.status, color: 'var(--text-2)' };
          return (
            <li
              key={ex.id}
              data-testid="automation-history-row"
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: '0.5px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  aria-hidden
                  style={{ width: 7, height: 7, borderRadius: 999, background: status.color, flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{status.label}</span>
                {ex.trigger_source === 'manual' && (
                  <span style={{ fontSize: 10, color: 'var(--text-2)' }}>manuale</span>
                )}
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    color: 'var(--text-2)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatWhen(ex.triggered_at)}
                </span>
              </div>
              {ex.error_message && (
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, marginLeft: 15 }}>
                  {ex.error_message}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {error && <div role="alert" style={{ ...hint, marginTop: 8 }}>{error}</div>}
      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '10px 12px',
            borderRadius: 12,
            border: '0.5px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.06)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Caricamento…' : 'Carica altre'}
        </button>
      )}
    </div>
  );
}
