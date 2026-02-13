import { buildLightsBanners, LightsBannersProps } from '@/app/components/devices/lights/components/LightsBanners';

describe('buildLightsBanners', () => {
  const mockProps: LightsBannersProps = {
    hueRoomCmd: { lastError: null, retry: jest.fn() },
    hueSceneCmd: { lastError: null, retry: jest.fn() },
    pairing: false,
    pairingStep: null,
    pairingCountdown: 30,
    pairingError: null,
    discoveredBridges: [],
    selectedBridge: null,
    error: null,
    onRemoteAuth: jest.fn(),
    onCancelPairing: jest.fn(),
    onConfirmButtonPressed: jest.fn(),
    onSelectBridge: jest.fn(),
    onRetryPairing: jest.fn(),
    onDismissError: jest.fn(),
    onDismissPairingError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty array when no banners needed', () => {
    const banners = buildLightsBanners(mockProps);
    expect(banners).toEqual([]);
  });

  describe('Retry Infrastructure Errors', () => {
    it('builds banner for hueRoomCmd error', () => {
      const error = new Error('Room command failed');
      const banners = buildLightsBanners({
        ...mockProps,
        hueRoomCmd: { lastError: error, retry: jest.fn() },
      });

      expect(banners).toHaveLength(1);
      expect(banners[0]).toMatchObject({
        variant: 'error',
        description: 'Room command failed',
      });
      expect(banners[0].actions).toHaveLength(1);
      expect(banners[0].actions?.[0].label).toBe('Riprova');
    });

    it('builds banner for hueSceneCmd error', () => {
      const error = new Error('Scene command failed');
      const banners = buildLightsBanners({
        ...mockProps,
        hueSceneCmd: { lastError: error, retry: jest.fn() },
      });

      expect(banners).toHaveLength(1);
      expect(banners[0].description).toBe('Scene command failed');
    });

    it('retry button calls correct retry function', () => {
      const retryFn = jest.fn();
      const banners = buildLightsBanners({
        ...mockProps,
        hueRoomCmd: { lastError: new Error('Failed'), retry: retryFn },
      });

      banners[0].actions?.[0].onClick();
      expect(retryFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pairing Flow States', () => {
    it('builds banner for discovering state', () => {
      const banners = buildLightsBanners({
        ...mockProps,
        pairing: true,
        pairingStep: 'discovering',
      });

      expect(banners).toHaveLength(1);
      expect(banners[0]).toMatchObject({
        variant: 'info',
        icon: '🔍',
        title: 'Ricerca bridge...',
      });
    });

    it('builds banner for noLocalBridge state', () => {
      const banners = buildLightsBanners({
        ...mockProps,
        pairing: true,
        pairingStep: 'noLocalBridge',
      });

      expect(banners).toHaveLength(1);
      expect(banners[0]).toMatchObject({
        variant: 'info',
        icon: '☁️',
        title: 'Bridge non trovato sulla rete locale',
      });
      expect(banners[0].actions).toHaveLength(2);
      expect(banners[0].actions?.[0].label).toContain('Cloud');
    });

    it('builds banner for waitingForButtonPress state', () => {
      const banners = buildLightsBanners({
        ...mockProps,
        pairing: true,
        pairingStep: 'waitingForButtonPress',
        selectedBridge: { internalipaddress: '192.168.1.100' },
      });

      expect(banners).toHaveLength(1);
      expect(banners[0]).toMatchObject({
        variant: 'warning',
        icon: '👆',
        title: 'Premi il pulsante sul Bridge Hue',
      });
      expect(banners[0].description).toContain('192.168.1.100');
    });

    it('builds banner for pairing state with countdown', () => {
      const banners = buildLightsBanners({
        ...mockProps,
        pairing: true,
        pairingStep: 'pairing',
        pairingCountdown: 15,
      });

      expect(banners).toHaveLength(1);
      expect(banners[0]).toMatchObject({
        variant: 'info',
        icon: '🔗',
        title: 'Pairing in corso... (15s)',
      });
    });

    it('builds banner for success state', () => {
      const banners = buildLightsBanners({
        ...mockProps,
        pairing: true,
        pairingStep: 'success',
      });

      expect(banners).toHaveLength(1);
      expect(banners[0]).toMatchObject({
        variant: 'success',
        icon: '✅',
        title: 'Pairing completato!',
      });
    });

    it('builds banner for selectBridge state with multiple bridges', () => {
      const bridges = [
        { id: 'bridge1', internalipaddress: '192.168.1.100' },
        { id: 'bridge2', internalipaddress: '192.168.1.101' },
      ];
      const banners = buildLightsBanners({
        ...mockProps,
        pairing: true,
        pairingStep: 'selectBridge',
        discoveredBridges: bridges,
        selectedBridge: bridges[0],
      });

      expect(banners).toHaveLength(1);
      expect(banners[0]).toMatchObject({
        variant: 'info',
        icon: '🔗',
        title: 'Seleziona Bridge',
      });
      // 2 bridges + cancel button
      expect(banners[0].actions).toHaveLength(3);
    });
  });

  describe('Connection Error', () => {
    it('builds banner for connection error', () => {
      const banners = buildLightsBanners({
        ...mockProps,
        error: 'Network timeout',
      });

      expect(banners).toHaveLength(1);
      expect(banners[0]).toMatchObject({
        variant: 'error',
        icon: '⚠️',
        title: 'Errore Connessione',
        description: 'Network timeout',
        dismissible: true,
      });
    });

    it('calls onDismissError when dismissed', () => {
      const onDismiss = jest.fn();
      const banners = buildLightsBanners({
        ...mockProps,
        error: 'Error',
        onDismissError: onDismiss,
      });

      banners[0].onDismiss?.();
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pairing Error', () => {
    it('builds banner for pairing error with retry', () => {
      const banners = buildLightsBanners({
        ...mockProps,
        pairingError: 'Button not pressed in time',
      });

      expect(banners).toHaveLength(1);
      expect(banners[0]).toMatchObject({
        variant: 'error',
        icon: '⚠️',
        title: 'Errore Pairing',
        description: 'Button not pressed in time',
      });
    });

    it('offers cloud option for network errors when API available', () => {
      const originalEnv = process.env.NEXT_PUBLIC_HUE_CLIENT_ID;
      process.env.NEXT_PUBLIC_HUE_CLIENT_ID = 'test-client-id';

      const banners = buildLightsBanners({
        ...mockProps,
        pairingError: 'Bridge timeout non raggiungibile',
      });

      expect(banners[0].description).toContain('Sei da remoto?');
      expect(banners[0].actions?.[0].label).toContain('Cloud');

      process.env.NEXT_PUBLIC_HUE_CLIENT_ID = originalEnv;
    });

    it('calls onDismissPairingError when dismissed', () => {
      const onDismiss = jest.fn();
      const banners = buildLightsBanners({
        ...mockProps,
        pairingError: 'Error',
        onDismissPairingError: onDismiss,
      });

      banners[0].onDismiss?.();
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Banner Priority', () => {
    it('shows retry error banner first when multiple states active', () => {
      const banners = buildLightsBanners({
        ...mockProps,
        hueRoomCmd: { lastError: new Error('Failed'), retry: jest.fn() },
        error: 'Connection error',
        pairingError: 'Pairing failed',
      });

      expect(banners).toHaveLength(3);
      expect(banners[0].variant).toBe('error');
      expect(banners[0].description).toBe('Failed');
    });
  });

  describe('Action Callbacks', () => {
    it('calls onConfirmButtonPressed from waitingForButtonPress banner', () => {
      const onConfirm = jest.fn();
      const banners = buildLightsBanners({
        ...mockProps,
        pairing: true,
        pairingStep: 'waitingForButtonPress',
        selectedBridge: { internalipaddress: '192.168.1.100' },
        onConfirmButtonPressed: onConfirm,
      });

      banners[0].actions?.[0].onClick();
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancelPairing from pairing banner', () => {
      const onCancel = jest.fn();
      const banners = buildLightsBanners({
        ...mockProps,
        pairing: true,
        pairingStep: 'pairing',
        onCancelPairing: onCancel,
      });

      banners[0].actions?.[0].onClick();
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onSelectBridge with correct bridge from selectBridge banner', () => {
      const onSelect = jest.fn();
      const bridges = [
        { id: 'bridge1', internalipaddress: '192.168.1.100' },
        { id: 'bridge2', internalipaddress: '192.168.1.101' },
      ];
      const banners = buildLightsBanners({
        ...mockProps,
        pairing: true,
        pairingStep: 'selectBridge',
        discoveredBridges: bridges,
        onSelectBridge: onSelect,
      });

      banners[0].actions?.[1].onClick();
      expect(onSelect).toHaveBeenCalledWith(bridges[1]);
    });
  });
});
