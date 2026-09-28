/**
 * How long a device hook waits for the WS snapshot (sent on subscribe when the
 * backend cache is populated) before bootstrapping with one HTTP fetch.
 * ROADMAP M15.
 */
export const WS_SNAPSHOT_GRACE_MS = 1500;
