/**
 * Theme utilities for StovePage
 * Pure functions for status-to-theme mapping (immersive volcanic design)
 */

export interface StovePageStatusConfig {
  label: string;
  icon: string;
  theme: string;
  pulse: boolean;
}

export interface StovePageTheme {
  bg: string;
  glow: string;
  accent: string;
  accentBg: string;
  border: string;
}

/**
 * Map stove status to display configuration
 */
export function getStovePageStatusConfig(status: string): StovePageStatusConfig {
  if (!status) return { label: 'CARICAMENTO', icon: '⏳', theme: 'slate', pulse: true };

  const s = status.toUpperCase();
  if (s.includes('WORK')) return { label: 'IN FUNZIONE', icon: '🔥', theme: 'ember', pulse: true };
  if (s.includes('OFF')) return { label: 'SPENTA', icon: '❄️', theme: 'slate', pulse: false };
  if (s.includes('START')) return { label: 'AVVIO', icon: '🚀', theme: 'ocean', pulse: true };
  if (s.includes('STANDBY') || s.includes('WAIT')) return { label: 'ATTESA', icon: '💤', theme: 'warning', pulse: true };
  if (s.includes('ERROR') || s.includes('ALARM')) return { label: 'ERRORE', icon: '⚠️', theme: 'danger', pulse: true };
  if (s.includes('CLEAN')) return { label: 'PULIZIA', icon: '🔄', theme: 'sage', pulse: true };
  if (s.includes('MODULATION')) return { label: 'MODULAZIONE', icon: '🌡️', theme: 'ocean', pulse: true };
  return { label: status.toUpperCase(), icon: '❔', theme: 'slate', pulse: false };
}

/**
 * Get theme colors for a given theme key
 * Supports: ember, slate, ocean, warning, danger, sage
 */
export function getStovePageTheme(themeKey: string): StovePageTheme {
  const themeColors: Record<string, StovePageTheme> = {
    ember: {
      bg: 'from-ember-950/80 via-slate-950 to-flame-950/60 [html:not(.dark)_&]:from-ember-50/80 [html:not(.dark)_&]:via-slate-50 [html:not(.dark)_&]:to-flame-50/60',
      glow: 'shadow-[0_0_120px_40px_rgba(237,111,16,0.15)] [html:not(.dark)_&]:shadow-[0_0_80px_30px_rgba(237,111,16,0.06)]',
      accent: 'text-ember-400 [html:not(.dark)_&]:text-ember-700',
      accentBg: 'bg-ember-500/20 [html:not(.dark)_&]:bg-ember-500/10',
      border: 'border-ember-500/30 [html:not(.dark)_&]:border-ember-500/20',
    },
    slate: {
      bg: 'from-slate-950 via-slate-900 to-slate-950 [html:not(.dark)_&]:from-slate-100 [html:not(.dark)_&]:via-slate-50 [html:not(.dark)_&]:to-slate-100',
      glow: '',
      accent: 'text-slate-400 [html:not(.dark)_&]:text-slate-600',
      accentBg: 'bg-slate-500/20 [html:not(.dark)_&]:bg-slate-500/10',
      border: 'border-slate-600/30 [html:not(.dark)_&]:border-slate-300/50',
    },
    ocean: {
      bg: 'from-ocean-950/80 via-slate-950 to-ocean-950/60 [html:not(.dark)_&]:from-ocean-50/80 [html:not(.dark)_&]:via-slate-50 [html:not(.dark)_&]:to-ocean-50/60',
      glow: 'shadow-[0_0_100px_30px_rgba(67,125,174,0.12)] [html:not(.dark)_&]:shadow-[0_0_60px_20px_rgba(67,125,174,0.06)]',
      accent: 'text-ocean-400 [html:not(.dark)_&]:text-ocean-700',
      accentBg: 'bg-ocean-500/20 [html:not(.dark)_&]:bg-ocean-500/10',
      border: 'border-ocean-500/30 [html:not(.dark)_&]:border-ocean-500/20',
    },
    warning: {
      bg: 'from-warning-950/60 via-slate-950 to-warning-950/40 [html:not(.dark)_&]:from-warning-50/60 [html:not(.dark)_&]:via-slate-50 [html:not(.dark)_&]:to-warning-50/40',
      glow: 'shadow-[0_0_80px_25px_rgba(234,179,8,0.1)] [html:not(.dark)_&]:shadow-[0_0_50px_15px_rgba(234,179,8,0.05)]',
      accent: 'text-warning-400 [html:not(.dark)_&]:text-warning-700',
      accentBg: 'bg-warning-500/20 [html:not(.dark)_&]:bg-warning-500/10',
      border: 'border-warning-500/30 [html:not(.dark)_&]:border-warning-500/20',
    },
    danger: {
      bg: 'from-danger-950/70 via-slate-950 to-danger-950/50 [html:not(.dark)_&]:from-danger-50/70 [html:not(.dark)_&]:via-slate-50 [html:not(.dark)_&]:to-danger-50/50',
      glow: 'shadow-[0_0_100px_35px_rgba(239,68,68,0.15)] [html:not(.dark)_&]:shadow-[0_0_60px_20px_rgba(239,68,68,0.08)]',
      accent: 'text-danger-400 [html:not(.dark)_&]:text-danger-700',
      accentBg: 'bg-danger-500/20 [html:not(.dark)_&]:bg-danger-500/10',
      border: 'border-danger-500/30 [html:not(.dark)_&]:border-danger-500/20',
    },
    sage: {
      bg: 'from-sage-950/70 via-slate-950 to-sage-950/50 [html:not(.dark)_&]:from-sage-50/70 [html:not(.dark)_&]:via-slate-50 [html:not(.dark)_&]:to-sage-50/50',
      glow: 'shadow-[0_0_80px_25px_rgba(96,115,96,0.12)] [html:not(.dark)_&]:shadow-[0_0_50px_15px_rgba(96,115,96,0.06)]',
      accent: 'text-sage-400 [html:not(.dark)_&]:text-sage-700',
      accentBg: 'bg-sage-500/20 [html:not(.dark)_&]:bg-sage-500/10',
      border: 'border-sage-500/30 [html:not(.dark)_&]:border-sage-500/20',
    },
  };

  return themeColors[themeKey] || themeColors.slate;
}
