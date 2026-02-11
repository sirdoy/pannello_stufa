/**
 * useInstallPrompt Hook
 *
 * Manages PWA install prompt state and behavior:
 * - Captures beforeinstallprompt event
 * - Tracks visit count (shows after 2+ visits)
 * - Handles 30-day dismissal cooldown
 * - Detects iOS for manual instructions
 * - Provides install() method to trigger native prompt
 *
 * Usage:
 * ```tsx
 * const { canInstall, isIOS, install, dismiss } = useInstallPrompt();
 *
 * if (canInstall && !isIOS) {
 *   return <button onClick={install}>Install</button>;
 * }
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  incrementVisitCount,
  isDismissed,
  dismissPrompt,
  isIOSDevice,
  isStandalone,
} from '@/lib/pwa/installPromptService';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface UseInstallPromptReturn {
  /** Should show the install prompt */
  canInstall: boolean;
  /** Show iOS manual instructions instead of native prompt */
  isIOS: boolean;
  /** Trigger native install prompt (Chrome/Edge) */
  install: () => Promise<boolean>;
  /** Dismiss prompt with 30-day cooldown */
  dismiss: () => void;
}

const MIN_VISITS = 2;

export function useInstallPrompt(): UseInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Increment visit count on mount
    const visitCount = incrementVisitCount();

    // Detect iOS
    const iosDetected = isIOSDevice();
    setIsIOS(iosDetected);

    // Check if should show prompt
    const shouldShow =
      !isStandalone() &&
      visitCount >= MIN_VISITS &&
      !isDismissed();

    // For iOS, show if conditions met (no beforeinstallprompt event)
    if (iosDetected && shouldShow) {
      setCanInstall(true);
    }

    // Listen for beforeinstallprompt event (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Show prompt if conditions met
      if (shouldShow) {
        setCanInstall(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  /**
   * Trigger native install prompt
   * Returns true if user accepted, false if dismissed or failed
   */
  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      // Show native prompt
      await deferredPrompt.prompt();

      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;

      // Clear deferred prompt regardless of outcome
      setDeferredPrompt(null);
      setCanInstall(false);

      return outcome === 'accepted';
    } catch (error) {
      // Prompt failed (already called, browser doesn't support, etc.)
      return false;
    }
  }, [deferredPrompt]);

  /**
   * Dismiss prompt with 30-day cooldown
   */
  const dismiss = useCallback(() => {
    dismissPrompt();
    setCanInstall(false);
  }, []);

  return {
    canInstall,
    isIOS,
    install,
    dismiss,
  };
}
