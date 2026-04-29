import type { LucideIcon } from 'lucide-react';

/**
 * Sheet button primitive (CONTEXT D-14) — 16px-pad rounded 16px box, 0.5px white border,
 * 14px 500 label with leading lucide icon. Used by StoveSheet (Orari, Manutenzione).
 *
 * Per checker WARNING 6 — JSX accepts only ONE `data-testid`. Class-of-element selector is
 * `data-component="sheet-btn"`; per-instance selector is the slugged `data-testid`.
 *
 * Visual contract verbatim from bundle `sheets.jsx:581-592`. NO Pressable wrap (D-24).
 */
export interface SheetBtnProps {
  Icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

function slugify(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function SheetBtn({ Icon, label, onClick }: SheetBtnProps) {
  return (
    <button
      type="button"
      data-component="sheet-btn"
      data-testid={`sheet-btn-${slugify(label)}`}
      data-sheet-focusable="true"
      onClick={onClick}
      style={{
        padding: 16,
        borderRadius: 16,
        border: '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION (sheets.jsx:585)
        background: 'rgba(255,255,255,0.05)', // AUDIT-EXCEPTION (sheets.jsx:584)
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: '#fff', // AUDIT-EXCEPTION
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      <Icon size={18} stroke="var(--text-2)" />
      {label}
    </button>
  );
}
