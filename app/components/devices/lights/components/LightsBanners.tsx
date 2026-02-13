'use client';

/**
 * LightsBanners - Builds banner configuration array for LightsCard
 *
 * Follows Phase 58 StoveBanners pattern - creates banner configs for:
 * - Retry infrastructure errors (room/scene commands)
 * - Pairing flow states (discovering, waitingForButtonPress, pairing, success, selectBridge, noLocalBridge)
 * - Connection errors
 * - Pairing errors
 */

export interface LightsBannersProps {
  // Retry infrastructure errors
  hueRoomCmd: { lastError: Error | null; retry: () => void };
  hueSceneCmd: { lastError: Error | null; retry: () => void };

  // Pairing state
  pairing: boolean;
  pairingStep: 'discovering' | 'waitingForButtonPress' | 'pairing' | 'success' | 'noLocalBridge' | 'selectBridge' | null;
  pairingCountdown: number;
  pairingError: string | null;
  discoveredBridges: any[];
  selectedBridge: any;

  // Connection error
  error: string | null;

  // Callbacks
  onRemoteAuth: () => void;
  onCancelPairing: () => void;
  onConfirmButtonPressed: () => void;
  onSelectBridge: (bridge: any) => void;
  onRetryPairing: () => void;
  onDismissError: () => void;
  onDismissPairingError: () => void;
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
    pairing,
    pairingStep,
    pairingCountdown,
    pairingError,
    discoveredBridges,
    selectedBridge,
    error,
    onRemoteAuth,
    onCancelPairing,
    onConfirmButtonPressed,
    onSelectBridge,
    onRetryPairing,
    onDismissError,
    onDismissPairingError,
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

  // 2. No local bridge found - offer remote option
  if (pairing && pairingStep === 'noLocalBridge') {
    banners.push({
      variant: 'info',
      icon: '☁️',
      title: 'Bridge non trovato sulla rete locale',
      description: 'Sei da remoto o il bridge non è sulla stessa rete Wi-Fi. Puoi connetterti via cloud con Philips Hue Remote API.',
      actions: [
        { label: '☁️ Connetti via Cloud', onClick: onRemoteAuth, variant: 'primary' },
        { label: 'Annulla', onClick: onCancelPairing }
      ]
    });
  }

  // 3. Waiting for user to press bridge button - INSTRUCTION STEP
  if (pairing && pairingStep === 'waitingForButtonPress') {
    const remoteApiAvailable = !!process.env.NEXT_PUBLIC_HUE_CLIENT_ID;
    banners.push({
      variant: 'warning',
      icon: '👆',
      title: 'Premi il pulsante sul Bridge Hue',
      description: `Bridge trovato: ${selectedBridge?.internalipaddress || 'N/A'}. Premi il pulsante rotondo al centro del bridge, poi clicca "Avvia Pairing".${remoteApiAvailable ? ' Oppure connettiti via Cloud.' : ''}`,
      actions: [
        { label: '✓ Avvia Pairing', onClick: onConfirmButtonPressed, variant: 'primary' },
        ...(remoteApiAvailable ? [{ label: '☁️ Cloud', onClick: onRemoteAuth }] : []),
        { label: 'Annulla', onClick: onCancelPairing }
      ]
    });
  }

  // 4. Bridge selection (multiple bridges found)
  if (pairing && pairingStep === 'selectBridge' && discoveredBridges.length > 1) {
    banners.push({
      variant: 'info',
      icon: '🔗',
      title: 'Seleziona Bridge',
      description: `Trovati ${discoveredBridges.length} bridge sulla rete. Seleziona quello da connettere.`,
      actions: discoveredBridges.map((bridge: any) => ({
        label: `${bridge.internalipaddress}`,
        onClick: () => onSelectBridge(bridge),
        variant: (selectedBridge?.id === bridge.id ? 'ember' : 'outline') as any
      })).concat([
        { label: 'Annulla', onClick: onCancelPairing, variant: 'subtle' }
      ])
    });
  }

  // 5. Connection error (e.g., timeout, network failure)
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

  // 6. Pairing in progress (countdown timer)
  if (pairing && pairingStep === 'pairing') {
    banners.push({
      variant: 'info',
      icon: '🔗',
      title: `Pairing in corso... (${pairingCountdown}s)`,
      description: 'Premi il pulsante sul bridge Hue entro 30 secondi per completare la connessione.',
      actions: [
        { label: 'Annulla', onClick: onCancelPairing }
      ]
    });
  }

  // 7. Pairing success
  if (pairing && pairingStep === 'success') {
    banners.push({
      variant: 'success',
      icon: '✅',
      title: 'Pairing completato!',
      description: 'Bridge Hue connesso con successo.'
    });
  }

  // 8. Pairing error - offer Cloud option if available
  if (pairingError) {
    const remoteApiAvailable = !!process.env.NEXT_PUBLIC_HUE_CLIENT_ID;
    const isNetworkError = pairingError.includes('timeout') ||
                           pairingError.includes('TIMEOUT') ||
                           pairingError.includes('network') ||
                           pairingError.includes('raggiungibile');

    banners.push({
      variant: 'error',
      icon: '⚠️',
      title: 'Errore Pairing',
      description: isNetworkError && remoteApiAvailable
        ? `${pairingError}. Sei da remoto? Prova a connetterti via Cloud.`
        : pairingError,
      dismissible: true,
      onDismiss: onDismissPairingError,
      actions: [
        ...(isNetworkError && remoteApiAvailable
          ? [{ label: '☁️ Connetti via Cloud', onClick: onRemoteAuth, variant: 'primary' as const }]
          : [{ label: 'Riprova', onClick: onRetryPairing }]
        ),
        { label: 'Annulla', onClick: onCancelPairing }
      ]
    });
  }

  // 9. Discovering bridges (loading state)
  if (pairing && pairingStep === 'discovering') {
    banners.push({
      variant: 'info',
      icon: '🔍',
      title: 'Ricerca bridge...',
      description: 'Ricerca bridge Hue sulla rete locale in corso...'
    });
  }

  return banners;
}
