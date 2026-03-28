'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OnlineStatusState {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
  offlineSince: Date | null;
  checkConnection: () => Promise<boolean>;
}

const OnlineStatusContext = createContext<OnlineStatusState | null>(null);

/**
 * Single-instance online status provider.
 * One timer for the whole app — no duplicate HEAD /api/health polling.
 */
export function OnlineStatusProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null);
  const [offlineSince, setOfflineSince] = useState<Date | null>(null);

  const checkConnection = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-store',
      });
      return response.ok;
    } catch {
      return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }
  };

  // Initialize on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        setLastOnlineAt(new Date());
      } else {
        setOfflineSince(new Date());
      }
    }
  }, []);

  // Listen to online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineAt(new Date());
      setWasOffline(true);
      setOfflineSince(null);
      setTimeout(() => setWasOffline(false), 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineSince(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Single periodic check — 30s online, 10s offline
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const interval = setInterval(async () => {
      const online = await checkConnection();
      if (online !== isOnline) {
        if (online) {
          setIsOnline(true);
          setLastOnlineAt(new Date());
          if (offlineSince) {
            setWasOffline(true);
            setOfflineSince(null);
            setTimeout(() => setWasOffline(false), 5000);
          }
        } else {
          setIsOnline(false);
          if (!offlineSince) {
            setOfflineSince(new Date());
          }
        }
      }
    }, isOnline ? 30000 : 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, offlineSince]);

  return (
    <OnlineStatusContext.Provider
      value={{ isOnline, wasOffline, lastOnlineAt, offlineSince, checkConnection }}
    >
      {children}
    </OnlineStatusContext.Provider>
  );
}

export function useOnlineStatusContext(): OnlineStatusState {
  const ctx = useContext(OnlineStatusContext);
  if (!ctx) {
    throw new Error('useOnlineStatusContext must be used within OnlineStatusProvider');
  }
  return ctx;
}
