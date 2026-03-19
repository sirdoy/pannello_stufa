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
  variant: string;
  pulse: boolean;
  health: string;
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
      textColor: 'text-slate-400 [html:not(.dark)_&]:text-slate-500',
      bgColor: 'bg-slate-800/60 [html:not(.dark)_&]:bg-slate-100/80',
      borderColor: 'border-slate-700/50 [html:not(.dark)_&]:border-slate-200',
      boxBgColor: 'bg-slate-800/80 [html:not(.dark)_&]:bg-white/80',
      boxLabelColor: 'text-slate-400 [html:not(.dark)_&]:text-slate-500',
      boxValueColor: 'text-slate-200 [html:not(.dark)_&]:text-slate-900',
      boxSuffixColor: 'text-slate-500 [html:not(.dark)_&]:text-slate-400',
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
        textColor: 'text-ember-400 [html:not(.dark)_&]:text-ember-600',
        bgColor: 'bg-gradient-to-br from-ember-900/40 via-slate-900/60 to-flame-900/30 [html:not(.dark)_&]:from-ember-100/80 [html:not(.dark)_&]:via-ember-50/90 [html:not(.dark)_&]:to-flame-100/70',
        borderColor: 'border-ember-500/40 [html:not(.dark)_&]:border-ember-300',
        boxBgColor: 'bg-ember-900/50 backdrop-blur-xl [html:not(.dark)_&]:bg-ember-100/80',
        boxLabelColor: 'text-ember-300 [html:not(.dark)_&]:text-ember-600',
        boxValueColor: 'text-ember-100 [html:not(.dark)_&]:text-ember-700',
        boxSuffixColor: 'text-ember-400/70 [html:not(.dark)_&]:text-ember-500',
        glowColor: 'shadow-ember-glow [html:not(.dark)_&]:shadow-[0_0_20px_rgba(237,111,16,0.15)]',
        animated: true,
        pulse: true,
      };

    // ❄️ off - Spenta (Cool slate)
    case 'off':
      return {
        label: 'SPENTA',
        icon: '❄️',
        textColor: 'text-slate-400 [html:not(.dark)_&]:text-slate-500',
        bgColor: 'bg-gradient-to-br from-slate-800/60 via-slate-900/70 to-slate-800/50 [html:not(.dark)_&]:from-slate-100/80 [html:not(.dark)_&]:via-white/90 [html:not(.dark)_&]:to-slate-100/70',
        borderColor: 'border-slate-600/40 [html:not(.dark)_&]:border-slate-200',
        boxBgColor: 'bg-slate-800/60 backdrop-blur-xl [html:not(.dark)_&]:bg-white/80',
        boxLabelColor: 'text-slate-400 [html:not(.dark)_&]:text-slate-500',
        boxValueColor: 'text-slate-200 [html:not(.dark)_&]:text-slate-900',
        boxSuffixColor: 'text-slate-500 [html:not(.dark)_&]:text-slate-400',
        glowColor: '',
        animated: false,
      };

    // 🚀 igniting - Avvio in corso (Ocean blue)
    case 'igniting':
      return {
        label: 'AVVIO IN CORSO',
        icon: '🚀',
        textColor: 'text-ocean-400 [html:not(.dark)_&]:text-ocean-600',
        bgColor: 'bg-gradient-to-br from-ocean-900/40 via-slate-900/60 to-ocean-800/30 [html:not(.dark)_&]:from-ocean-100/80 [html:not(.dark)_&]:via-ocean-50/90 [html:not(.dark)_&]:to-ocean-100/70',
        borderColor: 'border-ocean-500/40 [html:not(.dark)_&]:border-ocean-300',
        boxBgColor: 'bg-ocean-900/50 backdrop-blur-xl [html:not(.dark)_&]:bg-ocean-100/80',
        boxLabelColor: 'text-ocean-300 [html:not(.dark)_&]:text-ocean-600',
        boxValueColor: 'text-ocean-100 [html:not(.dark)_&]:text-ocean-700',
        boxSuffixColor: 'text-ocean-400/70 [html:not(.dark)_&]:text-ocean-500',
        glowColor: 'shadow-[0_0_30px_rgba(67,125,174,0.3)] [html:not(.dark)_&]:shadow-[0_0_20px_rgba(67,125,174,0.15)]',
        animated: true,
        pulse: true,
      };

    // 💤 standby - In attesa (Warning amber)
    case 'standby':
      return {
        label: 'IN ATTESA',
        icon: '💤',
        textColor: 'text-warning-400 [html:not(.dark)_&]:text-warning-700',
        bgColor: 'bg-gradient-to-br from-warning-900/30 via-slate-900/60 to-warning-800/20 [html:not(.dark)_&]:from-warning-100/80 [html:not(.dark)_&]:via-warning-50/90 [html:not(.dark)_&]:to-warning-100/70',
        borderColor: 'border-warning-500/40 [html:not(.dark)_&]:border-warning-300',
        boxBgColor: 'bg-warning-900/40 backdrop-blur-xl [html:not(.dark)_&]:bg-warning-100/80',
        boxLabelColor: 'text-warning-300 [html:not(.dark)_&]:text-warning-700',
        boxValueColor: 'text-warning-100 [html:not(.dark)_&]:text-warning-700',
        boxSuffixColor: 'text-warning-400/70 [html:not(.dark)_&]:text-warning-500',
        glowColor: 'shadow-[0_0_20px_rgba(234,179,8,0.2)] [html:not(.dark)_&]:shadow-[0_0_15px_rgba(234,179,8,0.1)]',
        animated: true,
      };

    // ⚠️ alarm - Errore (Danger red)
    case 'alarm':
      return {
        label: 'ERRORE',
        icon: '⚠️',
        textColor: 'text-danger-400 [html:not(.dark)_&]:text-danger-600',
        bgColor: 'bg-gradient-to-br from-danger-900/40 via-slate-900/60 to-danger-800/30 [html:not(.dark)_&]:from-danger-100/80 [html:not(.dark)_&]:via-danger-50/90 [html:not(.dark)_&]:to-danger-100/70',
        borderColor: 'border-danger-500/50 [html:not(.dark)_&]:border-danger-300',
        boxBgColor: 'bg-danger-900/50 backdrop-blur-xl [html:not(.dark)_&]:bg-danger-100/80',
        boxLabelColor: 'text-danger-300 [html:not(.dark)_&]:text-danger-600',
        boxValueColor: 'text-danger-100 [html:not(.dark)_&]:text-danger-700',
        boxSuffixColor: 'text-danger-400/70 [html:not(.dark)_&]:text-danger-500',
        glowColor: 'shadow-[0_0_30px_rgba(239,68,68,0.3)] [html:not(.dark)_&]:shadow-[0_0_20px_rgba(239,68,68,0.15)]',
        animated: true,
        pulse: true,
      };

    // 🔄 cleaning - Pulizia (Sage green)
    case 'cleaning':
      return {
        label: 'PULIZIA',
        icon: '🔄',
        textColor: 'text-sage-400 [html:not(.dark)_&]:text-sage-600',
        bgColor: 'bg-gradient-to-br from-sage-900/40 via-slate-900/60 to-sage-800/30 [html:not(.dark)_&]:from-sage-100/80 [html:not(.dark)_&]:via-sage-50/90 [html:not(.dark)_&]:to-sage-100/70',
        borderColor: 'border-sage-500/40 [html:not(.dark)_&]:border-sage-300',
        boxBgColor: 'bg-sage-900/50 backdrop-blur-xl [html:not(.dark)_&]:bg-sage-100/80',
        boxLabelColor: 'text-sage-300 [html:not(.dark)_&]:text-sage-600',
        boxValueColor: 'text-sage-100 [html:not(.dark)_&]:text-sage-700',
        boxSuffixColor: 'text-sage-400/70 [html:not(.dark)_&]:text-sage-500',
        glowColor: 'shadow-[0_0_20px_rgba(96,115,96,0.3)] [html:not(.dark)_&]:shadow-[0_0_15px_rgba(96,115,96,0.15)]',
        animated: true,
        pulse: true,
      };

    // 🌡️ modulating - Modulazione (Ocean blue)
    case 'modulating':
      return {
        label: 'MODULAZIONE',
        icon: '🌡️',
        textColor: 'text-ocean-400 [html:not(.dark)_&]:text-ocean-600',
        bgColor: 'bg-gradient-to-br from-ocean-900/40 via-slate-900/60 to-ocean-800/30 [html:not(.dark)_&]:from-ocean-100/80 [html:not(.dark)_&]:via-ocean-50/90 [html:not(.dark)_&]:to-ocean-100/70',
        borderColor: 'border-ocean-500/40 [html:not(.dark)_&]:border-ocean-300',
        boxBgColor: 'bg-ocean-900/50 backdrop-blur-xl [html:not(.dark)_&]:bg-ocean-100/80',
        boxLabelColor: 'text-ocean-300 [html:not(.dark)_&]:text-ocean-600',
        boxValueColor: 'text-ocean-100 [html:not(.dark)_&]:text-ocean-700',
        boxSuffixColor: 'text-ocean-400/70 [html:not(.dark)_&]:text-ocean-500',
        glowColor: 'shadow-[0_0_20px_rgba(67,125,174,0.25)] [html:not(.dark)_&]:shadow-[0_0_15px_rgba(67,125,174,0.12)]',
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
