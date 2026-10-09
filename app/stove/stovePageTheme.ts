/**
 * Theme utilities for StovePage
 * Pure functions for status-to-theme mapping
 */

import {
  AlertTriangle, CircleHelp, Flame, Hourglass, Loader, Power, RefreshCw, Rocket, Thermometer,
  type LucideIcon,
} from 'lucide-react';
import type { StoveState } from '@/types/thermorossiProxy';

export interface StovePageStatusConfig {
  label: string;
  Icon: LucideIcon;
  theme: string;
  pulse: boolean;
}

export interface StovePageTheme {
  /** Text colour class of the status icon and label */
  accent: string;
}

/**
 * Map stove status to display configuration
 */
export function getStovePageStatusConfig(status: StoveState | string): StovePageStatusConfig {
  if (!status) return { label: 'CARICAMENTO', Icon: Loader, theme: 'neutral', pulse: true };

  const s = status.toUpperCase();
  if (s.includes('WORK')) return { label: 'IN FUNZIONE', Icon: Flame, theme: 'ember', pulse: true };
  if (s.includes('OFF')) return { label: 'SPENTA', Icon: Power, theme: 'neutral', pulse: false };
  if (s.includes('START')) return { label: 'AVVIO', Icon: Rocket, theme: 'ocean', pulse: true };
  if (s.includes('STANDBY') || s.includes('WAIT')) return { label: 'ATTESA', Icon: Hourglass, theme: 'warning', pulse: true };
  if (s.includes('ERROR') || s.includes('ALARM')) return { label: 'ERRORE', Icon: AlertTriangle, theme: 'danger', pulse: true };
  if (s.includes('CLEAN')) return { label: 'PULIZIA', Icon: RefreshCw, theme: 'sage', pulse: true };
  if (s.includes('MODULATION')) return { label: 'MODULAZIONE', Icon: Thermometer, theme: 'ocean', pulse: true };
  return { label: status.toUpperCase(), Icon: CircleHelp, theme: 'neutral', pulse: false };
}

const THEMES: Record<string, StovePageTheme> = {
  ember: { accent: 'text-ember-400' },
  neutral: { accent: 'text-(--text-2)' },
  ocean: { accent: 'text-ocean-400' },
  warning: { accent: 'text-warning-400' },
  danger: { accent: 'text-danger-400' },
  sage: { accent: 'text-sage-400' },
};

/**
 * Get theme colors for a given theme key
 * Supports: ember, neutral, ocean, warning, danger, sage
 */
export function getStovePageTheme(themeKey: string): StovePageTheme {
  return THEMES[themeKey] ?? THEMES['neutral']!;
}
