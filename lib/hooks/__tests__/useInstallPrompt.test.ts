/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useInstallPrompt } from '../useInstallPrompt';
import * as installPromptService from '@/lib/pwa/installPromptService';

// Mock the installPromptService module
jest.mock('@/lib/pwa/installPromptService');

describe('useInstallPrompt', () => {
  const mockIncrementVisitCount = jest.mocked(installPromptService.incrementVisitCount);
  const mockIsDismissed = jest.mocked(installPromptService.isDismissed);
  const mockDismissPrompt = jest.mocked(installPromptService.dismissPrompt);
  const mockIsIOSDevice = jest.mocked(installPromptService.isIOSDevice);
  const mockIsStandalone = jest.mocked(installPromptService.isStandalone);

  // Mock beforeinstallprompt event
  let beforeInstallPromptEvent: Event | null = null;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Default mock implementations
    mockIncrementVisitCount.mockReturnValue(1);
    mockIsDismissed.mockReturnValue(false);
    mockIsIOSDevice.mockReturnValue(false);
    mockIsStandalone.mockReturnValue(false);

    // Reset event listener
    beforeInstallPromptEvent = null;
  });

  // Helper to trigger beforeinstallprompt event
  const triggerBeforeInstallPrompt = () => {
    const mockPrompt = jest.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });

    beforeInstallPromptEvent = new Event('beforeinstallprompt');
    Object.assign(beforeInstallPromptEvent, {
      prompt: mockPrompt,
      userChoice: mockUserChoice,
    });

    window.dispatchEvent(beforeInstallPromptEvent);
  };

  it('increments visit count on mount', () => {
    renderHook(() => useInstallPrompt());
    // React 18+ strict mode calls effects twice in dev, so check at least once
    expect(mockIncrementVisitCount).toHaveBeenCalled();
  });

  it('returns canInstall=false when visit count < 2', () => {
    mockIncrementVisitCount.mockReturnValue(1);

    const { result } = renderHook(() => useInstallPrompt());

    expect(result.current.canInstall).toBe(false);
  });

  it('returns canInstall=false when dismissed within 30 days', () => {
    mockIncrementVisitCount.mockReturnValue(3);
    mockIsDismissed.mockReturnValue(true);

    const { result } = renderHook(() => useInstallPrompt());

    expect(result.current.canInstall).toBe(false);
  });

  it('returns canInstall=false when already in standalone mode', () => {
    mockIncrementVisitCount.mockReturnValue(3);
    mockIsStandalone.mockReturnValue(true);

    const { result } = renderHook(() => useInstallPrompt());

    expect(result.current.canInstall).toBe(false);
  });

  it('returns canInstall=true when >= 2 visits, not dismissed, and beforeinstallprompt fires', async () => {
    mockIncrementVisitCount.mockReturnValue(2);
    mockIsDismissed.mockReturnValue(false);

    const { result } = renderHook(() => useInstallPrompt());

    // Initially false (no event yet)
    expect(result.current.canInstall).toBe(false);

    // Trigger event
    act(() => {
      triggerBeforeInstallPrompt();
    });

    // Should now be true
    await waitFor(() => {
      expect(result.current.canInstall).toBe(true);
    });
  });

  it('returns canInstall=true for iOS when >= 2 visits and not dismissed', () => {
    mockIncrementVisitCount.mockReturnValue(2);
    mockIsDismissed.mockReturnValue(false);
    mockIsIOSDevice.mockReturnValue(true);

    const { result } = renderHook(() => useInstallPrompt());

    expect(result.current.isIOS).toBe(true);
    expect(result.current.canInstall).toBe(true);
  });

  it('detects iOS device correctly', () => {
    mockIsIOSDevice.mockReturnValue(true);

    const { result } = renderHook(() => useInstallPrompt());

    expect(result.current.isIOS).toBe(true);
  });

  it('prevents default on beforeinstallprompt event', () => {
    mockIncrementVisitCount.mockReturnValue(2);

    renderHook(() => useInstallPrompt());

    const mockEvent = new Event('beforeinstallprompt');
    const preventDefaultSpy = jest.spyOn(mockEvent, 'preventDefault');

    window.dispatchEvent(mockEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('install() triggers native prompt and returns true when accepted', async () => {
    mockIncrementVisitCount.mockReturnValue(2);

    const { result } = renderHook(() => useInstallPrompt());

    // Create mock prompt with methods
    const mockPrompt = jest.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });

    const mockEvent = new Event('beforeinstallprompt');
    Object.assign(mockEvent, {
      prompt: mockPrompt,
      userChoice: mockUserChoice,
    });

    act(() => {
      window.dispatchEvent(mockEvent);
    });

    // Wait for state update
    await waitFor(() => {
      expect(result.current.canInstall).toBe(true);
    });

    // Call install
    let installResult: boolean = false;
    await act(async () => {
      installResult = await result.current.install();
    });

    expect(mockPrompt).toHaveBeenCalled();
    expect(installResult).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it('install() returns false when user dismisses prompt', async () => {
    mockIncrementVisitCount.mockReturnValue(2);

    const { result } = renderHook(() => useInstallPrompt());

    const mockPrompt = jest.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: 'dismissed' as const, platform: 'web' });

    const mockEvent = new Event('beforeinstallprompt');
    Object.assign(mockEvent, {
      prompt: mockPrompt,
      userChoice: mockUserChoice,
    });

    act(() => {
      window.dispatchEvent(mockEvent);
    });

    await waitFor(() => {
      expect(result.current.canInstall).toBe(true);
    });

    let installResult: boolean = true;
    await act(async () => {
      installResult = await result.current.install();
    });

    expect(installResult).toBe(false);
  });

  it('install() returns false when no deferred prompt available', async () => {
    const { result } = renderHook(() => useInstallPrompt());

    let installResult: boolean = true;
    await act(async () => {
      installResult = await result.current.install();
    });

    expect(installResult).toBe(false);
  });

  it('dismiss() stores timestamp and sets canInstall to false', async () => {
    mockIncrementVisitCount.mockReturnValue(2);

    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      triggerBeforeInstallPrompt();
    });

    await waitFor(() => {
      expect(result.current.canInstall).toBe(true);
    });

    act(() => {
      result.current.dismiss();
    });

    expect(mockDismissPrompt).toHaveBeenCalled();
    expect(result.current.canInstall).toBe(false);
  });

  it('cleans up event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useInstallPrompt());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'beforeinstallprompt',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });

  it('handles visit count >= 2 after dismissal period expires', () => {
    mockIncrementVisitCount.mockReturnValue(5);
    mockIsDismissed.mockReturnValue(false); // > 30 days

    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      triggerBeforeInstallPrompt();
    });

    // Should show again after cooldown expires
    expect(result.current.canInstall).toBe(true);
  });
});
