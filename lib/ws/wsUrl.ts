/**
 * Builds the /ws/live URL with a fresh auth query from /api/ws-token (roadmap 8.7).
 * react-use-websocket calls the returned function on every (re)connect, so each
 * attempt uses a new short-lived token; a failed fetch is retried with backoff
 * (retryOnError in useWebSocketManager).
 */
export function createWsUrlResolver(baseUrl: string): () => Promise<string> {
  const base = baseUrl.replace(/\/$/, '');
  return async () => {
    const response = await fetch('/api/ws-token', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`ws-token ${response.status}`);
    }
    const { query } = (await response.json()) as { query: string };
    return `${base}/ws/live?${query}`;
  };
}
