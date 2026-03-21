'use client';

/**
 * LightsBanners - Builds banner configuration array for LightsCard
 *
 * Follows Phase 58 StoveBanners pattern - creates banner configs for:
 * - Retry infrastructure errors (room/scene commands)
 * - Staleness warning (data_freshness === 'STALE')
 * - Connection errors
 *
 * Pairing banners removed — proxy handles Bridge connectivity.
 */

export interface LightsBannersProps {
  // Retry infrastructure errors
  hueRoomCmd: { lastError: Error | null; retry: () => void };
  hueSceneCmd: { lastError: Error | null; retry: () => void };

  // Staleness state
  stale: boolean;

  // Connection error
  error: string | null;

  // Callbacks
  onDismissError: () => void;
}

export interface BannerConfig {
  variant: 'error' | 'warning' | 'success' | 'info';
  icon?: string;
  title?: string;
  description?: string | React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'ghost' | 'subtle' | 'outline' | 'ember';
  }>;
}

/**
 * Build banner configurations for DeviceCard consumption
 * Returns array in priority order (DeviceCard renders top to bottom)
 */
export function buildLightsBanners(props: LightsBannersProps): BannerConfig[] {
  const {
    hueRoomCmd,
    hueSceneCmd,
    stale,
    error,
    onDismissError,
  } = props;

  const banners: BannerConfig[] = [];

  // 1. Retry Infrastructure Error Banner (highest priority - blocks commands)
  if (hueRoomCmd.lastError || hueSceneCmd.lastError) {
    banners.push({
      variant: 'error',
      description: (hueRoomCmd.lastError || hueSceneCmd.lastError)?.message,
      actions: [
        {
          label: 'Riprova',
          onClick: () => {
            const failedCmd = [hueRoomCmd, hueSceneCmd].find(cmd => cmd.lastError);
            failedCmd?.retry();
          },
          variant: 'ghost'
        }
      ]
    });
  }

  // 2. Staleness warning (data_freshness === 'STALE')
  if (stale) {
    banners.push({
      variant: 'warning',
      icon: '⏳',
      title: 'Dati non aggiornati',
      description: 'La connessione con il Bridge Hue potrebbe essere instabile. I dati mostrati potrebbero non riflettere lo stato attuale.',
    });
  }

  // 3. Connection error (e.g., timeout, network failure)
  if (error) {
    banners.push({
      variant: 'error',
      icon: '⚠️',
      title: 'Errore Connessione',
      description: error,
      dismissible: true,
      onDismiss: onDismissError
    });
  }

  return banners;
}
