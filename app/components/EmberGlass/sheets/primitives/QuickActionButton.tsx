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
}

function slugify(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function QuickActionButton({ active, onClick, label }: QuickActionButtonProps) {
  return (
    <button
      type="button"
      data-component="quick-action-button"
      data-testid={`quick-action-${slugify(label)}`}
      data-sheet-focusable="true"
      onClick={onClick}
      style={{
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
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
