import { buildLightsBanners, LightsBannersProps } from '@/app/components/devices/lights/components/LightsBanners';

describe('buildLightsBanners', () => {
  const mockProps: LightsBannersProps = {
    hueRoomCmd: { lastError: null, retry: jest.fn() },
    hueSceneCmd: { lastError: null, retry: jest.fn() },
    stale: false,
    error: null,
    onDismissError: jest.fn(),
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
      expect(banners[0]!).toMatchObject({
        variant: 'error',
        description: 'Room command failed',
      });
      expect(banners[0]!.actions).toHaveLength(1);
      expect(banners[0]!.actions?.[0]!.label).toBe('Riprova');
    });

    it('builds banner for hueSceneCmd error', () => {
      const error = new Error('Scene command failed');
      const banners = buildLightsBanners({
        ...mockProps,
        hueSceneCmd: { lastError: error, retry: jest.fn() },
      });

      expect(banners).toHaveLength(1);
      expect(banners[0]!.description).toBe('Scene command failed');
    });

    it('retry button calls correct retry function', () => {
      const retryFn = jest.fn();
      const banners = buildLightsBanners({
        ...mockProps,
        hueRoomCmd: { lastError: new Error('Failed'), retry: retryFn },
      });

      banners[0]!.actions?.[0]!.onClick();
      expect(retryFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Staleness Warning', () => {
    it('builds staleness banner when stale=true', () => {
      const banners = buildLightsBanners({
        ...mockProps,
        stale: true,
      });

      expect(banners).toHaveLength(1);
      expect(banners[0]!).toMatchObject({
        variant: 'warning',
        icon: '⏳',
        title: 'Dati non aggiornati',
      });
      expect(banners[0]!.description).toContain('Bridge Hue');
    });

    it('does not build staleness banner when stale=false', () => {
      const banners = buildLightsBanners({
        ...mockProps,
        stale: false,
      });

      expect(banners).toHaveLength(0);
    });
  });

  describe('Connection Error', () => {
    it('builds banner for connection error', () => {
      const banners = buildLightsBanners({
        ...mockProps,
        error: 'Network timeout',
      });

      expect(banners).toHaveLength(1);
      expect(banners[0]!).toMatchObject({
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

      banners[0]!.onDismiss?.();
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Banner Priority', () => {
    it('shows retry error banner first when multiple states active', () => {
      const banners = buildLightsBanners({
        ...mockProps,
        hueRoomCmd: { lastError: new Error('Failed'), retry: jest.fn() },
        stale: true,
        error: 'Connection error',
      });

      expect(banners).toHaveLength(3);
      // Priority order: retry error, staleness, connection error
      expect(banners[0]!.variant).toBe('error');
      expect(banners[0]!.description).toBe('Failed');
      expect(banners[1]!.variant).toBe('warning');
      expect(banners[2]!.variant).toBe('error');
      expect(banners[2]!.description).toBe('Connection error');
    });

    it('shows staleness banner before connection error', () => {
      const banners = buildLightsBanners({
        ...mockProps,
        stale: true,
        error: 'Connection error',
      });

      expect(banners).toHaveLength(2);
      expect(banners[0]!.variant).toBe('warning');
      expect(banners[1]!.variant).toBe('error');
    });
  });
});
