/**
 * Status Utility Functions for StoveCard
 *
 * Pure functions for mapping stove status strings to display objects.
 * All functions are stateless - no React hooks, no side effects.
 *
 * These utilities are extracted from StoveCard to enable reuse across
 * sub-components in the orchestrator pattern.
 */

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
 * Maps technical status strings to user-friendly display objects
 * with theme-aware colors and animation flags.
 *
 * @param status - Raw status string from stove API
 * @returns Complete status display configuration
 */
export function getStatusInfo(status: string | null): StoveStatusInfo {
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

  const statusUpper = status.toUpperCase();

  // 🔥 WORK - In funzione (Ember glow - warm copper/amber)
  if (statusUpper.includes('WORK')) {
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
  }

  // ❄️ OFF - Spenta (Cool slate)
  if (statusUpper.includes('OFF')) {
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
  }

  // 🚀 START - Avvio in corso (Ocean blue)
  if (statusUpper.includes('START')) {
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
  }

  // 💤 STANDBY/WAIT - In attesa (Warning amber)
  if (statusUpper.includes('STANDBY') || statusUpper.includes('WAIT')) {
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
  }

  // ⚠️ ERROR - Errore (Danger red)
  if (statusUpper.includes('ERROR') || statusUpper.includes('ALARM')) {
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
  }

  // 🔄 CLEANING - Pulizia (Sage green)
  if (statusUpper.includes('CLEAN')) {
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
  }

  // 🌡️ MODULATION - Modulazione (Ocean blue)
  if (statusUpper.includes('MODULATION')) {
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

  // Default - Stato sconosciuto
  return {
    label: status.toUpperCase(),
    icon: '❔',
    textColor: 'text-slate-400 [html:not(.dark)_&]:text-slate-500',
    bgColor: 'bg-slate-800/60 [html:not(.dark)_&]:bg-slate-100/80',
    borderColor: 'border-slate-700/50 [html:not(.dark)_&]:border-slate-200',
    boxBgColor: 'bg-slate-800/60 backdrop-blur-xl [html:not(.dark)_&]:bg-white/80',
    boxLabelColor: 'text-slate-400 [html:not(.dark)_&]:text-slate-500',
    boxValueColor: 'text-slate-200 [html:not(.dark)_&]:text-slate-900',
    boxSuffixColor: 'text-slate-500 [html:not(.dark)_&]:text-slate-400',
    glowColor: '',
    animated: false,
  };
}

/**
 * Get CVA-aligned status display properties
 *
 * Returns simplified status info using design system variants
 * for Badge and HealthIndicator components.
 *
 * @param status - Raw status string from stove API
 * @returns CVA variant configuration
 */
export function getStatusDisplay(status: string | null): StoveStatusDisplay {
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

  const s = status.toUpperCase();

  // WORK - In funzione (Ember)
  if (s.includes('WORK')) {
    return {
      label: 'IN FUNZIONE',
      icon: '',
      variant: 'ember',
      pulse: true,
      health: 'ok',
      animated: true
    };
  }

  // OFF - Spenta (Neutral)
  if (s.includes('OFF')) {
    return {
      label: 'SPENTA',
      icon: '',
      variant: 'neutral',
      pulse: false,
      health: 'ok',
      animated: false
    };
  }

  // START - Avvio in corso (Ocean)
  if (s.includes('START')) {
    return {
      label: 'AVVIO IN CORSO',
      icon: '',
      variant: 'ocean',
      pulse: true,
      health: 'ok',
      animated: true
    };
  }

  // STANDBY/WAIT - In attesa (Warning)
  if (s.includes('STANDBY') || s.includes('WAIT')) {
    return {
      label: 'IN ATTESA',
      icon: '',
      variant: 'warning',
      pulse: true,
      health: 'warning',
      animated: true
    };
  }

  // ERROR/ALARM - Errore (Danger)
  if (s.includes('ERROR') || s.includes('ALARM')) {
    return {
      label: 'ERRORE',
      icon: '',
      variant: 'danger',
      pulse: true,
      health: 'error',
      animated: true
    };
  }

  // CLEAN - Pulizia (Sage)
  if (s.includes('CLEAN')) {
    return {
      label: 'PULIZIA',
      icon: '',
      variant: 'sage',
      pulse: true,
      health: 'ok',
      animated: true
    };
  }

  // MODULATION - Modulazione (Ocean)
  if (s.includes('MODULATION')) {
    return {
      label: 'MODULAZIONE',
      icon: '',
      variant: 'ocean',
      pulse: true,
      health: 'ok',
      animated: true
    };
  }

  // Default - Stato sconosciuto
  return {
    label: status.toUpperCase(),
    icon: '',
    variant: 'neutral',
    pulse: false,
    health: 'ok',
    animated: false
  };
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
  return glows[variant] || '';
}

/**
 * Check if stove is actively running
 *
 * @param status - Raw status string
 * @returns True if stove is in WORK or START phase
 */
export function isStoveActive(status: string): boolean {
  const s = status.toUpperCase();
  return s.includes('WORK') || s.includes('START');
}

/**
 * Check if stove is off or in error state
 *
 * @param status - Raw status string
 * @returns True if stove is OFF, ERROR, or WAIT
 */
export function isStoveOff(status: string): boolean {
  const s = status.toUpperCase();
  return s.includes('OFF') || s.includes('ERROR') || s.includes('WAIT');
}
