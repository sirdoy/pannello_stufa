'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * PWA Install Hook
 *
 * Provides utilities for PWA installation detection and prompting.
 *
 * @returns {Object} PWA install state and functions
 * @returns {boolean} isInstalled - Whether the app is running in standalone/PWA mode
 * @returns {boolean} isInstallable - Whether the app can be installed (beforeinstallprompt fired)
 * @returns {boolean} isIOS - Whether the device is iOS (requires manual install instructions)
 * @returns {Function} promptInstall - Function to trigger the install prompt
 * @returns {Function} dismissInstall - Function to dismiss install prompt for this session
 *
 * @example
 * const { isInstalled, isInstallable, isIOS, promptInstall } = usePWAInstall();
 *
 * if (isInstallable) {
 *   return <button onClick={promptInstall}>Install App</button>;
 * }
 *
 * if (isIOS && !isInstalled) {
 *   return <p>Tap Share then "Add to Home Screen"</p>;
 * }
 */
export function usePWAInstall(): { isInstalled: boolean; isInstallable: boolean; isIOS: boolean; isDismissed: boolean; promptInstall: () => Promise<{ outcome: any; error?: any }>; dismissInstall: () => void } {
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Store the beforeinstallprompt event for later use
  const deferredPromptRef = useRef(null);

  /**
   * Check if app is running in standalone mode (installed as PWA)
   */
  useEffect(() => {
    // Check display mode
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as any).standalone === true; // iOS Safari

      setIsInstalled(isStandalone);
    };

    checkInstalled();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e) => setIsInstalled(e.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  /**
   * Detect iOS devices (need manual install instructions)
   */
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad with iPadOS

    setIsIOS(isIOSDevice);
  }, []);

  /**
   * Listen for beforeinstallprompt event
   * This event fires when the browser determines the app is installable
   */
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the default browser install prompt
      e.preventDefault();

      // Store the event for later use
      deferredPromptRef.current = e;

      // Update state to show our custom install UI
      setIsInstallable(true);

      console.log('[usePWAInstall] App is installable');
    };

    const handleAppInstalled = () => {
      // Clear the deferred prompt
      deferredPromptRef.current = null;

      // Update states
      setIsInstallable(false);
      setIsInstalled(true);

      console.log('[usePWAInstall] App was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * Trigger the install prompt
   */
  const promptInstall = useCallback(async () => {
    if (!deferredPromptRef.current) {
      console.log('[usePWAInstall] No deferred prompt available');
      return { outcome: 'unavailable' };
    }

    try {
      // Show the install prompt
      deferredPromptRef.current.prompt();

      // Wait for user response
      const { outcome } = await deferredPromptRef.current.userChoice;

      console.log(`[usePWAInstall] User response: ${outcome}`);

      // Clear the deferred prompt (can only be used once)
      deferredPromptRef.current = null;

      if (outcome === 'accepted') {
        setIsInstallable(false);
      }

      return { outcome };
    } catch (error) {
      console.error('[usePWAInstall] Error prompting install:', error);
      return { outcome: 'error', error };
    }
  }, []);

  /**
   * Dismiss the install prompt for this session
   */
  const dismissInstall = useCallback(() => {
    setIsDismissed(true);

    // Optionally store in sessionStorage to persist across page navigations
    try {
      sessionStorage.setItem('pwa-install-dismissed', 'true');
    } catch {
      // Ignore storage errors
    }
  }, []);

  /**
   * Check if install was dismissed this session
   */
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem('pwa-install-dismissed');
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  return {
    isInstalled,
    isInstallable: isInstallable && !isDismissed,
    isIOS,
    isDismissed,
    promptInstall,
    dismissInstall,
  };
}

export default usePWAInstall;
