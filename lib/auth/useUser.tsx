'use client';

/**
 * Client-side current user (roadmap 8.9: replaces `useUser` from @auth0/nextjs-auth0/client).
 *
 * Reads GET /auth/profile once per page load: 200 → user, 204 → signed out.
 * <UserProvider> shares one fetch across the tree; without a provider each hook
 * call fetches on its own (same fallback the Auth0 hook had).
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface SessionUserProfile {
  sub: string;
  email: string;
  name: string;
  nickname: string;
  picture: string;
  role?: 'admin' | 'user' | 'test';
  id?: number;
  [key: string]: unknown;
}

export interface UserState {
  user: SessionUserProfile | undefined;
  error: Error | undefined;
  isLoading: boolean;
}

const UserContext = createContext<UserState | null>(null);

export async function fetchProfile(): Promise<SessionUserProfile | undefined> {
  const res = await fetch('/auth/profile', { credentials: 'same-origin', cache: 'no-store' });
  if (res.status === 204 || res.status === 401) return undefined;
  if (!res.ok) throw new Error(`Profile request failed (${res.status})`);
  return (await res.json()) as SessionUserProfile;
}

function useProfileState(initialUser: SessionUserProfile | undefined, enabled: boolean): UserState {
  const [state, setState] = useState<UserState>({
    user: initialUser,
    error: undefined,
    isLoading: enabled && !initialUser,
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchProfile()
      .then((user) => {
        if (!cancelled) setState({ user, error: undefined, isLoading: false });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            user: undefined,
            error: error instanceof Error ? error : new Error(String(error)),
            isLoading: false,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}

interface UserProviderProps {
  children: ReactNode;
  /** Known user (dev auth bypass): rendered immediately, then revalidated. */
  user?: SessionUserProfile;
}

export function UserProvider({ children, user }: UserProviderProps) {
  const state = useProfileState(user, true);
  return <UserContext.Provider value={state}>{children}</UserContext.Provider>;
}

export function useUser(): UserState {
  const shared = useContext(UserContext);
  const own = useProfileState(undefined, shared === null);
  return shared ?? own;
}
