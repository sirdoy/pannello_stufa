/**
 * Status Utility Functions for StoveCard
 *
 * Pure functions for mapping stove status strings to display objects.
 * All functions are stateless - no React hooks, no side effects.
 *
 * These utilities are extracted from StoveCard to enable reuse across
 * sub-components in the orchestrator pattern.
 *
 * Uses exact equality matching against StoveState union from the proxy API.
 */

import type { StoveState } from '@/types/thermorossiProxy';

/**
 * Full status info with colors, icons, and animation flags
 */
export interface StoveStatusInfo {
  label: string;
  icon: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  boxBgColor: string;
  boxLabelColor: string;
  boxValueColor: string;
  boxSuffixColor: string;
  glowColor: string;
  animated: boolean;
  pulse?: boolean;
}

/**
 * CVA-aligned status display properties
 */
export interface StoveStatusDisplay {
  label: string;
  icon: string;
  variant: 'ember' | 'sage' | 'ocean' | 'warning' | 'danger' | 'neutral';
  pulse: boolean;
  health: 'ok' | 'warning' | 'error' | 'critical';
  animated: boolean;
}

/**
 * Get full status information with Ember Noir styling
 *
 * Maps proxy stove_state strings to user-friendly display objects
 * with theme-aware colors and animation flags.
 *
 * @param status - Proxy stove_state value (StoveState union)
 * @returns Complete status display configuration
 */
export function getStatusInfo(status: StoveState | null): StoveStatusInfo {
  if (!status) {
    return {
      label: 'CARICAMENTO...',
      icon: '⏳',
      textColor: 'text-slate-400',
      bgColor: 'bg-slate-800/60',
      borderColor: 'border-slate-700/50',
      boxBgColor: 'bg-slate-800/80',
      boxLabelColor: 'text-slate-400',
      boxValueColor: 'text-slate-200',
      boxSuffixColor: 'text-slate-500',
      glowColor: '',
      animated: true,
    };
  }

  switch (status) {
    // 🔥 working - In funzione (Ember glow - warm copper/amber)
    case 'working':
      return {
        label: 'IN FUNZIONE',
        icon: '🔥',
        textColor: 'text-ember-400',
        bgColor: 'bg-gradient-to-br from-ember-900/40 via-slate-900/60 to-flame-900/30',
        borderColor: 'border-ember-500/40',
        boxBgColor: 'bg-ember-900/50 backdrop-blur-xl',
        boxLabelColor: 'text-ember-300',
        boxValueColor: 'text-ember-100',
        boxSuffixColor: 'text-ember-400/70',
        glowColor: 'shadow-ember-glow',
        animated: true,
        pulse: true,
      };

    // ❄️ off - Spenta (Cool slate)
    case 'off':
      return {
        label: 'SPENTA',
        icon: '❄️',
        textColor: 'text-slate-400',
        bgColor: 'bg-gradient-to-br from-slate-800/60 via-slate-900/70 to-slate-800/50',
        borderColor: 'border-slate-600/40',
        boxBgColor: 'bg-slate-800/60 backdrop-blur-xl',
        boxLabelColor: 'text-slate-400',
        boxValueColor: 'text-slate-200',
        boxSuffixColor: 'text-slate-500',
        glowColor: '',
        animated: false,
      };

    // 🚀 igniting - Avvio in corso (Ocean blue)
    case 'igniting':
      return {
        label: 'AVVIO IN CORSO',
        icon: '🚀',
        textColor: 'text-ocean-400',
        bgColor: 'bg-gradient-to-br from-ocean-900/40 via-slate-900/60 to-ocean-800/30',
        borderColor: 'border-ocean-500/40',
        boxBgColor: 'bg-ocean-900/50 backdrop-blur-xl',
        boxLabelColor: 'text-ocean-300',
        boxValueColor: 'text-ocean-100',
        boxSuffixColor: 'text-ocean-400/70',
        glowColor: 'shadow-[0_0_30px_rgba(67,125,174,0.3)]',
        animated: true,
        pulse: true,
      };

    // 💤 standby - In attesa (Warning amber)
    case 'standby':
      return {
        label: 'IN ATTESA',
        icon: '💤',
        textColor: 'text-warning-400',
        bgColor: 'bg-gradient-to-br from-warning-900/30 via-slate-900/60 to-warning-800/20',
        borderColor: 'border-warning-500/40',
        boxBgColor: 'bg-warning-900/40 backdrop-blur-xl',
        boxLabelColor: 'text-warning-300',
        boxValueColor: 'text-warning-100',
        boxSuffixColor: 'text-warning-400/70',
        glowColor: 'shadow-[0_0_20px_rgba(234,179,8,0.2)]',
        animated: true,
      };

    // ⚠️ alarm - Errore (Danger red)
    case 'alarm':
      return {
        label: 'ERRORE',
        icon: '⚠️',
        textColor: 'text-danger-400',
        bgColor: 'bg-gradient-to-br from-danger-900/40 via-slate-900/60 to-danger-800/30',
        borderColor: 'border-danger-500/50',
        boxBgColor: 'bg-danger-900/50 backdrop-blur-xl',
        boxLabelColor: 'text-danger-300',
        boxValueColor: 'text-danger-100',
        boxSuffixColor: 'text-danger-400/70',
        glowColor: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]',
        animated: true,
        pulse: true,
      };

    // 🔄 cleaning - Pulizia (Sage green)
    case 'cleaning':
      return {
        label: 'PULIZIA',
        icon: '🔄',
        textColor: 'text-sage-400',
        bgColor: 'bg-gradient-to-br from-sage-900/40 via-slate-900/60 to-sage-800/30',
        borderColor: 'border-sage-500/40',
        boxBgColor: 'bg-sage-900/50 backdrop-blur-xl',
        boxLabelColor: 'text-sage-300',
        boxValueColor: 'text-sage-100',
        boxSuffixColor: 'text-sage-400/70',
        glowColor: 'shadow-[0_0_20px_rgba(96,115,96,0.3)]',
        animated: true,
        pulse: true,
      };

    // 🌡️ modulating - Modulazione (Ocean blue)
    case 'modulating':
      return {
        label: 'MODULAZIONE',
        icon: '🌡️',
        textColor: 'text-ocean-400',
        bgColor: 'bg-gradient-to-br from-ocean-900/40 via-slate-900/60 to-ocean-800/30',
        borderColor: 'border-ocean-500/40',
        boxBgColor: 'bg-ocean-900/50 backdrop-blur-xl',
        boxLabelColor: 'text-ocean-300',
        boxValueColor: 'text-ocean-100',
        boxSuffixColor: 'text-ocean-400/70',
        glowColor: 'shadow-[0_0_20px_rgba(67,125,174,0.25)]',
        animated: true,
      };
  }
}

/**
 * Get CVA-aligned status display properties
 *
 * Returns simplified status info using design system variants
 * for Badge and HealthIndicator components.
 *
 * @param status - Proxy stove_state value (StoveState union)
 * @returns CVA variant configuration
 */
export function getStatusDisplay(status: StoveState | null): StoveStatusDisplay {
  if (!status) {
    return {
      label: 'CARICAMENTO...',
      icon: '',
      variant: 'neutral',
      pulse: true,
      health: 'ok',
      animated: true
    };
  }

  switch (status) {
    // working - In funzione (Ember)
    case 'working':
      return {
        label: 'IN FUNZIONE',
        icon: '',
        variant: 'ember',
        pulse: true,
        health: 'ok',
        animated: true
      };

    // off - Spenta (Neutral)
    case 'off':
      return {
        label: 'SPENTA',
        icon: '',
        variant: 'neutral',
        pulse: false,
        health: 'ok',
        animated: false
      };

    // igniting - Avvio in corso (Ocean)
    case 'igniting':
      return {
        label: 'AVVIO IN CORSO',
        icon: '',
        variant: 'ocean',
        pulse: true,
        health: 'ok',
        animated: true
      };

    // standby - In attesa (Warning)
    case 'standby':
      return {
        label: 'IN ATTESA',
        icon: '',
        variant: 'warning',
        pulse: true,
        health: 'warning',
        animated: true
      };

    // alarm - Errore (Danger)
    case 'alarm':
      return {
        label: 'ERRORE',
        icon: '',
        variant: 'danger',
        pulse: true,
        health: 'error',
        animated: true
      };

    // cleaning - Pulizia (Sage)
    case 'cleaning':
      return {
        label: 'PULIZIA',
        icon: '',
        variant: 'sage',
        pulse: true,
        health: 'ok',
        animated: true
      };

    // modulating - Modulazione (Ocean)
    case 'modulating':
      return {
        label: 'MODULAZIONE',
        icon: '',
        variant: 'ocean',
        pulse: true,
        health: 'ok',
        animated: true
      };
  }
}

/**
 * Map CVA variants to glow shadow classes
 *
 * Used for status display box glow effects.
 *
 * @param variant - CVA variant name
 * @returns Shadow class string
 */
export function getStatusGlow(variant: string): string {
  const glows: Record<string, string> = {
    ember: 'shadow-ember-glow',
    sage: 'shadow-[0_0_20px_rgba(96,115,96,0.3)]',
    ocean: 'shadow-[0_0_30px_rgba(67,125,174,0.3)]',
    warning: 'shadow-[0_0_20px_rgba(234,179,8,0.2)]',
    danger: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]',
    neutral: ''
  };
  return glows[variant] ?? '';
}

/**
 * Check if stove is actively running
 *
 * @param status - Proxy stove_state value
 * @returns True if stove is working, igniting, or modulating
 */
export function isStoveActive(status: StoveState): boolean {
  return status === 'working' || status === 'igniting' || status === 'modulating';
}

/**
 * Check if stove is off or in error/standby state
 *
 * @param status - Proxy stove_state value
 * @returns True if stove is off, alarm, or standby
 */
export function isStoveOff(status: StoveState): boolean {
  return status === 'off' || status === 'alarm' || status === 'standby';
}
