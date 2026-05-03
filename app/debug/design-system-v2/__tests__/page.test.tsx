/**
 * Tests for /debug/design-system-v2 page (Phase 174 — DS-03, DS-05).
 *
 * Validates:
 * - 6 hue swatches with aria-pressed semantics + click → setProperty('--accent', …) +
 *   localStorage persistence under 'ember-glass-accent'.
 * - Ambient toggle as <button role="switch" aria-checked> → localStorage persistence
 *   under 'ember-glass-ambient' + dispatch of CustomEvent<boolean>('ember-glass-ambient-change').
 * - Page structure (single h1 "Ember Glass", .glass-surface demo card, no a11y violations).
 *
 * AUDIT-EXCEPTION (DS-02): The literal oklch strings here mirror the source-of-truth
 * preset map and the test contracts; they are not visual styling values.
 */

// Phase 182: hook mocks — Section10SheetGallery mounts <*Sheet> components which
// self-fetch via these hooks. Mocking prevents jsdom errors about missing
// WebSocket context, missing Auth0 user, etc.

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({ user: { sub: 'auth0|test-182' }, isLoading: false, error: undefined }),
}));

jest.mock('@/app/context/VersionContext', () => ({
  useVersion: () => ({ checkVersion: jest.fn(), version: 'test' }),
}));

jest.mock('@/app/components/devices/stove/hooks/useStoveData', () => ({
  useStoveData: () => ({
    isAccesa: false,
    powerLevel: null,
    fanLevel: null,
    initialLoading: true,
    errorDescription: '',
    errorCode: 0,
    needsMaintenance: false,
    setLoading: jest.fn(),
    setLoadingMessage: jest.fn(),
    fetchStatusAndUpdate: jest.fn(),
    setSchedulerEnabled: jest.fn(),
    setSemiManualMode: jest.fn(),
    setReturnToAutoAt: jest.fn(),
    setNextScheduledAction: jest.fn(),
    setCleaningInProgress: jest.fn(),
    fetchMaintenanceStatus: jest.fn(),
    semiManualMode: false,
  }),
}));

jest.mock('@/app/components/devices/stove/hooks/useStoveCommands', () => ({
  useStoveCommands: () => ({
    handleIgnite: jest.fn(),
    handleShutdown: jest.fn(),
    handlePowerChange: jest.fn(),
    handleFanChange: jest.fn(),
  }),
}));

jest.mock('@/app/components/devices/thermostat/hooks/useThermostatData', () => ({
  useThermostatData: () => ({
    connected: false,
    topology: null,
    status: null,
    loading: true,
    error: null,
    stale: false,
    staleness: null,
    lastUpdatedAt: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('@/app/components/devices/thermostat/hooks/useThermostatCommands', () => ({
  useThermostatCommands: () => ({
    setRoomSetpoint: jest.fn(),
    setHomeMode: jest.fn(),
    setRoomMode: jest.fn(),
    netatmoTempCmd: null,
    netatmoModeCmd: null,
  }),
}));

jest.mock('@/app/components/devices/lights/hooks/useLightsData', () => ({
  useLightsData: () => ({
    loading: true,
    error: null,
    connected: false,
    stale: false,
    groups: [],
    lights: [],
    scenes: [],
    selectedGroupId: null,
    refreshing: false,
    loadingMessage: null,
    localBrightness: null,
    selectedGroup: undefined,
    selectedGroupId_action: null,
    roomLights: [],
    roomScenes: [],
    effectiveLights: [],
    hasColorLights: false,
    lightsOnCount: 0,
    lightsOffCount: 0,
    allLightsOn: false,
    allLightsOff: true,
    isRoomOn: false,
    totalLightsOn: 0,
    totalLightsOff: 0,
    allHouseLightsOn: false,
    allHouseLightsOff: true,
    hasAnyLights: false,
    avgBrightness: 0,
    lastUpdatedAt: null,
    roomColors: [],
    roomOnBrightness: 0,
    dynamicRoomStyle: {},
    contrastMode: false,
    adaptive: false,
    setSelectedGroupId: jest.fn(),
    setLocalBrightness: jest.fn(),
    setError: jest.fn(),
    setRefreshing: jest.fn(),
    setLoadingMessage: jest.fn(),
    checkConnection: jest.fn(),
    fetchData: jest.fn(),
    handleRefresh: jest.fn(),
  }),
}));

jest.mock('@/app/components/devices/lights/hooks/useLightsCommands', () => ({
  useLightsCommands: () => ({
    handleRoomToggle: jest.fn(),
    handleBrightnessChange: jest.fn(),
    handleSceneActivate: jest.fn(),
    handleAllLightsToggle: jest.fn(),
    hueRoomCmd: null,
    hueSceneCmd: null,
  }),
}));

jest.mock('@/app/components/devices/sonos/hooks/useSonosFullData', () => ({
  useSonosFullData: () => ({
    data: null,
    loading: true,
    error: null,
    stale: false,
    fetchData: jest.fn(),
  }),
}));

jest.mock('@/app/components/devices/sonos/hooks/useSonosCommands', () => ({
  useSonosCommands: () => ({
    handlePlay: jest.fn(),
    handlePause: jest.fn(),
    handleStop: jest.fn(),
    handleNext: jest.fn(),
    handlePrevious: jest.fn(),
    handleSetVolume: jest.fn(),
    handleSetMute: jest.fn(),
    handleSetPlayMode: jest.fn(),
    handleSetSleepTimer: jest.fn(),
    handleSetEq: jest.fn(),
    handleSetHomeTheater: jest.fn(),
    handleSwitchSource: jest.fn(),
    handleJoinGroup: jest.fn(),
    handleUnjoinGroup: jest.fn(),
    handleSetZoneVolume: jest.fn(),
    handleSeek: jest.fn(),
    sonosTransportCmd: null,
    sonosVolumeCmd: null,
    sonosExtendedCmd: null,
  }),
}));

jest.mock('@/app/components/devices/tuya/hooks/useTuyaData', () => ({
  useTuyaData: () => ({
    plugs: null,
    loading: true,
    error: null,
    stale: false,
    lastUpdatedAt: null,
  }),
}));

jest.mock('@/app/components/devices/tuya/hooks/useTuyaCommands', () => ({
  useTuyaCommands: () => ({
    togglePlug: jest.fn(),
    setTimer: jest.fn(),
    cancelTimer: jest.fn(),
  }),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import DesignSystemV2Page from '../page';

expect.extend(toHaveNoViolations);

describe('DesignSystemV2Page (Phase 174 — DS-03, DS-05)', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.ambient;
    document.documentElement.style.removeProperty('--accent');
  });

  describe('Hue picker (DS-03)', () => {
    it('renders 6 hue swatches', () => {
      render(<DesignSystemV2Page />);
      const swatches = screen.getAllByRole('button', { name: /Set accent to/i });
      expect(swatches).toHaveLength(6);
    });

    it('Copper is initially active (aria-pressed=true)', () => {
      render(<DesignSystemV2Page />);
      expect(screen.getByRole('button', { name: /Set accent to Copper/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /Set accent to Rose/i })).toHaveAttribute('aria-pressed', 'false');
    });

    it('clicking Rose calls setProperty(--accent, oklch(0.68 0.17 0))', async () => {
      const setProp = jest.spyOn(document.documentElement.style, 'setProperty');
      render(<DesignSystemV2Page />);
      await userEvent.click(screen.getByRole('button', { name: /Set accent to Rose/i }));
      expect(setProp).toHaveBeenCalledWith('--accent', 'oklch(0.68 0.17 0)');
      setProp.mockRestore();
    });

    it('clicking Rose persists ember-glass-accent in localStorage', async () => {
      render(<DesignSystemV2Page />);
      await userEvent.click(screen.getByRole('button', { name: /Set accent to Rose/i }));
      expect(localStorage.getItem('ember-glass-accent')).toBe('oklch(0.68 0.17 0)');
    });

    it('clicking Rose updates aria-pressed (Rose=true, Copper=false)', async () => {
      render(<DesignSystemV2Page />);
      await userEvent.click(screen.getByRole('button', { name: /Set accent to Rose/i }));
      expect(screen.getByRole('button', { name: /Set accent to Rose/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /Set accent to Copper/i })).toHaveAttribute('aria-pressed', 'false');
    });

    it('does not throw when localStorage.setItem fails', async () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });
      render(<DesignSystemV2Page />);
      await expect(
        userEvent.click(screen.getByRole('button', { name: /Set accent to Rose/i }))
      ).resolves.not.toThrow();
      setItemSpy.mockRestore();
    });
  });

  describe('Ambient toggle (DS-05)', () => {
    it('renders a switch with aria-label "Attiva glow ambient"', () => {
      render(<DesignSystemV2Page />);
      const toggle = screen.getByRole('switch', { name: /Attiva glow ambient/i });
      expect(toggle).toBeInTheDocument();
    });

    it('initial aria-checked is false (default OFF — D-14)', () => {
      render(<DesignSystemV2Page />);
      expect(screen.getByRole('switch', { name: /Attiva glow ambient/i })).toHaveAttribute('aria-checked', 'false');
    });

    it('click sets aria-checked=true, persists localStorage, dispatches event with detail=true', async () => {
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
      render(<DesignSystemV2Page />);
      const toggle = screen.getByRole('switch', { name: /Attiva glow ambient/i });
      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-checked', 'true');
      expect(localStorage.getItem('ember-glass-ambient')).toBe('true');
      const event = dispatchSpy.mock.calls
        .map((c) => c[0])
        .find((e): e is CustomEvent<boolean> => (e as Event).type === 'ember-glass-ambient-change') as CustomEvent<boolean> | undefined;
      expect(event).toBeDefined();
      expect(event!.detail).toBe(true);
      dispatchSpy.mockRestore();
    });

    it('second click sets aria-checked=false, persists "false", dispatches detail=false', async () => {
      render(<DesignSystemV2Page />);
      const toggle = screen.getByRole('switch', { name: /Attiva glow ambient/i });
      await userEvent.click(toggle);
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-checked', 'false');
      expect(localStorage.getItem('ember-glass-ambient')).toBe('false');
      const event = dispatchSpy.mock.calls
        .map((c) => c[0])
        .find((e): e is CustomEvent<boolean> => (e as Event).type === 'ember-glass-ambient-change') as CustomEvent<boolean> | undefined;
      expect(event!.detail).toBe(false);
      dispatchSpy.mockRestore();
    });
  });

  describe('Page structure (DS-01 demo + DS-06 demo)', () => {
    it('renders a single h1 with text "Ember Glass"', () => {
      render(<DesignSystemV2Page />);
      const headings = screen.getAllByRole('heading', { level: 1 });
      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveTextContent('Ember Glass');
    });

    it('contains a .glass-surface demo card (DS-06 visible demo)', () => {
      const { container } = render(<DesignSystemV2Page />);
      expect(container.querySelector('.glass-surface')).not.toBeNull();
    });

    it('has no a11y violations', async () => {
      const { container } = render(<DesignSystemV2Page />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Phase 182 — section decomposition (D-21)', () => {
    it('renders all 10 section headings', async () => {
      render(<DesignSystemV2Page />);
      // Sections 01/02 — Phase 174 carry-forward
      expect(screen.getByRole('heading', { level: 2, name: /Tinte accento/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /Glow ambient/i })).toBeInTheDocument();
      // Sections 03/04/05/06/07 — assert by section ID
      expect(document.getElementById('sec-03-heading')).toBeInTheDocument();
      expect(document.getElementById('sec-04-heading')).toBeInTheDocument();
      expect(document.getElementById('sec-05-heading')).toBeInTheDocument();
      expect(document.getElementById('sec-06-heading')).toBeInTheDocument();
      expect(document.getElementById('sec-07-heading')).toBeInTheDocument();
      // Sections 08/09/10 — Phase 182 new
      expect(screen.getByRole('heading', { level: 2, name: /Primitive carta/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /Primitive sheet/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /Sheet device dal vivo/i })).toBeInTheDocument();
    });

    it('renders 5 launcher pills with device keys', () => {
      render(<DesignSystemV2Page />);
      for (const key of ['stove', 'climate', 'lights', 'sonos', 'plugs']) {
        expect(screen.getByTestId(`launcher-${key}`)).toBeInTheDocument();
      }
    });
  });
});
