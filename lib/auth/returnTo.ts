/**
 * Post-login redirect target: accept only same-origin absolute paths
 * ("/x", not "//host", "/\\host" or "https://..."), never back into /auth/.
 */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return '/';
  }
  if (value === '/auth' || value.startsWith('/auth/')) return '/';
  return value;
}
