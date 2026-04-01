/**
 * Theme utilities for StovePage
 * Pure functions for status-to-theme mapping (immersive volcanic design)
 */

import type { StoveState } from '@/types/thermorossiProxy';

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
export function getStovePageStatusConfig(status: StoveState | string): StovePageStatusConfig {
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
      bg: 'from-ember-950/80 via-slate-950 to-flame-950/60',
      glow: 'shadow-[0_0_120px_40px_rgba(237,111,16,0.15)]',
      accent: 'text-ember-400',
      accentBg: 'bg-ember-500/20',
      border: 'border-ember-500/30',
    },
    slate: {
      bg: 'from-slate-950 via-slate-900 to-slate-950',
      glow: '',
      accent: 'text-slate-400',
      accentBg: 'bg-slate-500/20',
      border: 'border-slate-600/30',
    },
    ocean: {
      bg: 'from-ocean-950/80 via-slate-950 to-ocean-950/60',
      glow: 'shadow-[0_0_100px_30px_rgba(67,125,174,0.12)]',
      accent: 'text-ocean-400',
      accentBg: 'bg-ocean-500/20',
      border: 'border-ocean-500/30',
    },
    warning: {
      bg: 'from-warning-950/60 via-slate-950 to-warning-950/40',
      glow: 'shadow-[0_0_80px_25px_rgba(234,179,8,0.1)]',
      accent: 'text-warning-400',
      accentBg: 'bg-warning-500/20',
      border: 'border-warning-500/30',
    },
    danger: {
      bg: 'from-danger-950/70 via-slate-950 to-danger-950/50',
      glow: 'shadow-[0_0_100px_35px_rgba(239,68,68,0.15)]',
      accent: 'text-danger-400',
      accentBg: 'bg-danger-500/20',
      border: 'border-danger-500/30',
    },
    sage: {
      bg: 'from-sage-950/70 via-slate-950 to-sage-950/50',
      glow: 'shadow-[0_0_80px_25px_rgba(96,115,96,0.12)]',
      accent: 'text-sage-400',
      accentBg: 'bg-sage-500/20',
      border: 'border-sage-500/30',
    },
  };

  return themeColors[themeKey] ?? themeColors['slate']!;
}
