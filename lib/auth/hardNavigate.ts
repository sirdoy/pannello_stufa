/**
 * Full-page navigation after sign-in, so server components and the client
 * profile cache (useUser → /auth/profile) all start from the new session.
 */
export function hardNavigate(url: string): void {
  window.location.assign(url);
}
