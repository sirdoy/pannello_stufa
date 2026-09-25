import type { CSSProperties } from 'react';

/** EmberGlass form controls (native inputs keep autocomplete / password-manager support). */
export const inputStyle: CSSProperties = {
  height: 44,
  borderRadius: 11,
  background: 'rgba(255,255,255,0.05)',
  border: '0.5px solid rgba(255,255,255,0.1)',
  color: '#fff',
  padding: '0 13px',
  fontSize: 15,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

export const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-2)',
  marginBottom: 6,
};

export function primaryButtonStyle(disabled = false): CSSProperties {
  return {
    height: 44,
    padding: '0 18px',
    borderRadius: 12,
    border: 'none',
    background: 'var(--accent)',
    color: '#1a0d06',
    fontSize: 15,
    fontWeight: 700,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.55 : 1,
  };
}

export const secondaryButtonStyle: CSSProperties = {
  height: 36,
  padding: '0 12px',
  borderRadius: 10,
  border: '0.5px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

export const errorTextStyle: CSSProperties = { color: '#ff8a8a', fontSize: 13, margin: '0 0 12px' };
export const okTextStyle: CSSProperties = { color: '#7fd49b', fontSize: 13, margin: '0 0 12px' };
