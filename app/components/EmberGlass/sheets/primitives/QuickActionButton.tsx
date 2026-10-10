import Spinner from '@/app/components/ui/Spinner';

/**
 * Quick action pill button primitive (CONTEXT D-15) — yellow-active pill for LightsSheet
 * "Tutte on / Tutte off". Active state uses Lights yellow (#f5c84a); inactive is neutral white-04.
 *
 * Visual contract verbatim from bundle `sheets.jsx:299-306` (the `quickBtn` style helper, ported
 * to a tiny presentational component). NO Pressable wrap (D-24).
 */
export interface QuickActionButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  /** Command sent and not yet settled (ROADMAP M80): spinner over the label, taps ignored */
  pending?: boolean;
  disabled?: boolean;
}

function slugify(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function QuickActionButton({ active, onClick, label, pending = false, disabled = false }: QuickActionButtonProps) {
  const locked = pending || disabled;
  return (
    <button
      type="button"
      data-component="quick-action-button"
      data-testid={`quick-action-${slugify(label)}`}
      data-sheet-focusable="true"
      disabled={locked}
      aria-busy={pending || undefined}
      onClick={onClick}
      style={{
        position: 'relative',
        padding: '10px 14px',
        borderRadius: 12,
        border: active
          ? '0.5px solid rgba(245,200,74,0.3)' // AUDIT-EXCEPTION (sheets.jsx:304)
          : '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION
        background: active
          ? 'rgba(245,200,74,0.18)' // AUDIT-EXCEPTION (sheets.jsx:302)
          : 'rgba(255,255,255,0.05)', // AUDIT-EXCEPTION
        color: active ? '#f5c84a' : '#fff', // AUDIT-EXCEPTION (sheets.jsx:303)
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        cursor: locked ? 'default' : 'pointer',
        opacity: locked && !pending ? 0.55 : 1,
      }}
    >
      {/* The label keeps its place while pending, so the pill does not change width. Opacity, not
          visibility: a hidden label would leave the button without an accessible name. */}
      <span style={{ opacity: pending ? 0 : 1 }}>{label}</span>
      {pending && (
        <span
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Spinner size="xs" variant="current" aria-hidden data-testid="quick-action-spinner" />
        </span>
      )}
    </button>
  );
}
