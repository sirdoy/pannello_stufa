/**
 * Firebase Admin SDK Helper (Server-side only)
 * Gestisce inizializzazione Firebase Admin e database operations.
 * Le notifiche push non passano più da qui: le manda il Pi (Web Push, ROADMAP M48).
 * Gestisce inizializzazione Firebase Admin, database operations e notifiche push
 *
 * IMPORTANTE:
 * - Usa SOLO in API routes e server components
 * - NON importare in client components
 * - Richiede credenziali Admin SDK in .env
 * - Admin SDK BYPASSA Firebase Security Rules
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getDatabase, Database } from 'firebase-admin/database';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

/**
 * Inizializza Firebase Admin SDK (singleton)
 */
function initializeFirebaseAdmin(): App {
  // Se già inizializzato, return existing app
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  // Verifica credenziali
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin credentials mancanti. ' +
      'Configura FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, ' +
      'e FIREBASE_ADMIN_PRIVATE_KEY nel .env'
    );
  }

  // Fix newlines in private key (common issue when stored in env)
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  // Inizializza app
  const app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: formattedPrivateKey,
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });

  return app;
}

/**
 * Get Admin Database instance
 */
export function getAdminDatabase(): Database {
  initializeFirebaseAdmin();
  return getDatabase();
}

/**
 * Get Admin Firestore instance
 */
export function getAdminFirestore(): Firestore {
  initializeFirebaseAdmin();
  return getFirestore();
}

// ============================================
// DATABASE OPERATIONS (Admin SDK)
// ============================================

/**
 * Read data from Firebase (Admin SDK)
 * @param path - Database path (es. 'maintenance' o 'users/123/fcmTokens')
 * @returns Data at path or null if not exists
 */
export async function adminDbGet<T = unknown>(path: string): Promise<T | null> {
  const db = getAdminDatabase();
  const snapshot = await db.ref(path).once('value');
  return snapshot.val() as T | null;
}

/**
 * Write data to Firebase (Admin SDK) - OVERWRITES existing data
 * @param path - Database path
 * @param data - Data to write
 */
export async function adminDbSet(path: string, data: unknown): Promise<void> {
  const db = getAdminDatabase();
  await db.ref(path).set(data);
}

/**
 * Update data in Firebase (Admin SDK) - MERGES with existing data
 * @param path - Database path
 * @param updates - Object with fields to update
 */
export async function adminDbUpdate(path: string, updates: Record<string, unknown>): Promise<void> {
  const db = getAdminDatabase();
  await db.ref(path).update(updates);
}

/**
 * Push new data to Firebase list (Admin SDK)
 * @param path - Database path
 * @param data - Data to push
 * @returns Generated key
 */
export async function adminDbPush(path: string, data: unknown): Promise<string | null> {
  const db = getAdminDatabase();
  const ref = db.ref(path).push();
  await ref.set(data);
  return ref.key;
}

/**
 * Delete data from Firebase (Admin SDK)
 * @param path - Database path
 */
export async function adminDbRemove(path: string): Promise<void> {
  const db = getAdminDatabase();
  await db.ref(path).remove();
}

/**
 * Run transaction on Firebase data (Admin SDK)
 * @param {string} path - Database path
 * @param {Function} updateFunction - Function(currentData) => newData
 * @returns {Promise<any>} Committed data
 */
export async function adminDbTransaction(
  path: string,
  updateFunction: (currentData: unknown) => unknown
): Promise<unknown> {
  const db = getAdminDatabase();
  const ref = db.ref(path);

  const result = await ref.transaction(updateFunction);

  if (!result.committed) {
    throw new Error('Transaction aborted');
  }

  return result.snapshot.val();
}
