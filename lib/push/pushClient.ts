/**
 * Web Push in the browser (workspace ROADMAP M48).
 *
 * The Pi sends every push (standard Web Push, VAPID); the browser only has to
 * subscribe through the app service worker (`/sw.js`, Serwist) and hand the
 * subscription to `/api/v1/notifications/subscriptions`.
 *
 * The subscription belongs to this browser, not to the login session: logging
 * out (or an expired session) does not unsubscribe, so pushes keep arriving.
 * The user's yes/no answer is stored per device (`push-notifications-choice`):
 * the first-launch prompt asks only while it is unset, settings can change it.
 */

import { generateDeviceFingerprint } from '@/lib/deviceFingerprint';
import type { PushSubscriptionInfo } from '@/types/notificationsProxy';

export const CHOICE_KEY = 'push-notifications-choice';
export const SUBSCRIPTION_ID_KEY = 'push-subscription-id';
/** Cache read by the service worker on `pushsubscriptionchange` when the browser omits the old subscription. */
export const PUSH_META_CACHE = 'push-meta';
export const PUSH_META_URL = '/__push-meta/endpoint';

const API = '/api/v1/notifications';
const SW_URL = '/sw.js';
const SW_TIMEOUT_MS = 15000;

export type PushChoice = 'enabled' | 'disabled' | null;
export type PushSupport = 'supported' | 'unsupported' | 'ios-install';

export type EnableResult =
  | { ok: true; subscriptionId: number }
  | { ok: false; reason: 'unsupported' | 'ios-install' | 'denied' | 'error'; message: string };

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

/** iOS delivers Web Push only to the PWA installed on the Home Screen (iOS 16.4+). */
export function getPushSupport(): PushSupport {
  if (typeof window === 'undefined') return 'unsupported';
  if (isIOS() && !isStandalone()) return 'ios-install';
  const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  return ok ? 'supported' : 'unsupported';
}

export function getPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// ---------------------------------------------------------------------------
// Stored choice (per device; storage can be unavailable in private mode)
// ---------------------------------------------------------------------------

export function getChoice(): PushChoice {
  try {
    const value = localStorage.getItem(CHOICE_KEY);
    return value === 'enabled' || value === 'disabled' ? value : null;
  } catch {
    return null;
  }
}

export function setChoice(choice: Exclude<PushChoice, null>): void {
  try {
    localStorage.setItem(CHOICE_KEY, choice);
  } catch {
    // storage blocked: the prompt may show again, nothing else breaks
  }
}

export function getSubscriptionId(): number | null {
  try {
    const value = Number(localStorage.getItem(SUBSCRIPTION_ID_KEY));
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function setSubscriptionId(id: number | null): void {
  try {
    if (id === null) localStorage.removeItem(SUBSCRIPTION_ID_KEY);
    else localStorage.setItem(SUBSCRIPTION_ID_KEY, String(id));
  } catch {
    // ignore
  }
}

/** Should the first-launch question be shown on this device? */
export function shouldAskForPush(): boolean {
  return getChoice() === null && getPushSupport() === 'supported' && getPermission() !== 'denied';
}

// ---------------------------------------------------------------------------
// Service worker + subscription
// ---------------------------------------------------------------------------

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    );
  });
}

function waitActive(reg: ServiceWorkerRegistration): Promise<ServiceWorkerRegistration> {
  if (reg.active && !reg.installing && !reg.waiting) return Promise.resolve(reg);
  const worker = reg.installing ?? reg.waiting;
  if (!worker) return Promise.resolve(reg);
  return new Promise((resolve) => {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') resolve(reg);
    });
  });
}

/**
 * Registration of the app service worker. `register()` also replaces a stale
 * worker on the same scope (the old `/firebase-messaging-sw.js`, pre-M48).
 */
async function getAppRegistration(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.register(SW_URL, { scope: '/' });
  return withTimeout(waitActive(reg), SW_TIMEOUT_MS, 'Service worker non disponibile, ricarica la pagina');
}

export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function sameKey(a: ArrayBuffer | null | undefined, b: Uint8Array): boolean {
  if (!a) return false;
  const left = new Uint8Array(a);
  return left.length === b.length && left.every((v, i) => v === b[i]);
}

async function fetchVapidKey(): Promise<Uint8Array<ArrayBuffer>> {
  const res = await fetch(`${API}/vapid-public-key`);
  if (!res.ok) throw new Error('Notifiche non configurate sul server');
  const data = (await res.json()) as { public_key: string };
  return urlBase64ToUint8Array(data.public_key);
}

/** Current subscription made with our VAPID key, or a new one (a foreign key, e.g. FCM, is replaced). */
async function ensureSubscription(reg: ServiceWorkerRegistration): Promise<PushSubscription> {
  const key = await fetchVapidKey();
  const existing = await reg.pushManager.getSubscription();
  if (existing && sameKey(existing.options.applicationServerKey, key)) return existing;
  if (existing) await existing.unsubscribe();
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
}

async function rememberEndpoint(endpoint: string | null): Promise<void> {
  try {
    const cache = await caches.open(PUSH_META_CACHE);
    if (endpoint) await cache.put(PUSH_META_URL, new Response(endpoint));
    else await cache.delete(PUSH_META_URL);
  } catch {
    // Cache API unavailable: the worker falls back to event.oldSubscription
  }
}

async function registerOnServer(sub: PushSubscription): Promise<PushSubscriptionInfo> {
  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  const res = await fetch(`${API}/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      device_name: generateDeviceFingerprint(navigator.userAgent).displayName.slice(0, 120),
      user_agent: navigator.userAgent.slice(0, 500),
    }),
  });
  if (!res.ok) throw new Error('Registrazione del dispositivo non riuscita');
  const info = (await res.json()) as PushSubscriptionInfo;
  setSubscriptionId(info.id);
  await rememberEndpoint(json.endpoint);
  return info;
}

// ---------------------------------------------------------------------------
// Public actions
// ---------------------------------------------------------------------------

/** Ask the permission (call from a click), subscribe and register this device. */
export async function enablePush(): Promise<EnableResult> {
  const support = getPushSupport();
  if (support === 'ios-install') {
    return { ok: false, reason: 'ios-install', message: "Su iPhone installa prima l'app nella schermata Home" };
  }
  if (support === 'unsupported') {
    return { ok: false, reason: 'unsupported', message: 'Questo browser non supporta le notifiche push' };
  }
  const permission =
    Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') {
    setChoice('disabled');
    return {
      ok: false,
      reason: 'denied',
      message: 'Permesso negato: abilita le notifiche per questa app nelle impostazioni del telefono/browser',
    };
  }
  try {
    const reg = await getAppRegistration();
    const sub = await ensureSubscription(reg);
    const info = await registerOnServer(sub);
    setChoice('enabled');
    return { ok: true, subscriptionId: info.id };
  } catch (err) {
    return { ok: false, reason: 'error', message: err instanceof Error ? err.message : String(err) };
  }
}

/** Stop pushes on this device: server row removed, browser subscription dropped. */
export async function disablePush(): Promise<void> {
  setChoice('disabled');
  setSubscriptionId(null);
  if (getPushSupport() !== 'supported') return;
  const reg = await navigator.serviceWorker.getRegistration('/');
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await fetch(`${API}/subscriptions/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => null); // offline: the Pi drops the row when the push service answers 410
  await sub.unsubscribe().catch(() => false);
  await rememberEndpoint(null);
}

export type SyncResult = 'synced' | 'skipped' | 'permission-lost' | 'error';

/**
 * Re-register this device at app start while notifications are on: heals a
 * subscription renewed by the browser or lost on the Pi. No prompt is shown
 * (subscribe() needs no gesture once the permission is granted).
 */
export async function syncPush(): Promise<SyncResult> {
  if (getChoice() !== 'enabled' || getPushSupport() !== 'supported') return 'skipped';
  if (Notification.permission !== 'granted') return 'permission-lost';
  try {
    const reg = await getAppRegistration();
    const sub = await ensureSubscription(reg);
    await registerOnServer(sub);
    return 'synced';
  } catch {
    return 'error';
  }
}
