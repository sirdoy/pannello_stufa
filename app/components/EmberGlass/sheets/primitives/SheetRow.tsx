import type { ReactNode } from 'react';

/**
 * Sheet row primitive (CONTEXT D-10) — label + optional 12px subtitle + optional right-slot child.
 *
 * Used by StoveSheet (Livello fiamma, Ventola), ClimateSheet (Tipo).
 *
 * Visual contract verbatim from bundle `sheets.jsx:469-482`. NO Pressable wrap (D-24)
 * — sheet sub-primitives are bare structural elements, not glass surfaces.
 */
export interface SheetRowProps {
  label: string;
  value?: string;
  children?: ReactNode;
}

export function SheetRow({ label, value, children }: SheetRowProps) {
  return (
    <div
      data-testid="sheet-row"
      style={{
        marginTop: 18,
        padding: '14px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '0.5px solid rgba(255,255,255,0.06)', // AUDIT-EXCEPTION (sheets.jsx:473)
        gap: 12,
      }}
    >
      <div>
        <div
          data-testid="sheet-row-label"
          style={{ fontSize: 14, color: '#fff', fontWeight: 500 }} // AUDIT-EXCEPTION '#fff' (sheets.jsx:477)
        >
          {label}
        </div>
        {value !== undefined && (
          <div
            data-testid="sheet-row-value"
            style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}
          >
            {value}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
