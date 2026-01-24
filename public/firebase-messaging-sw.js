/**
 * Firebase Cloud Messaging Service Worker
 *
 * Gestisce notifiche push in background (quando l'app è chiusa o in background)
 *
 * Note:
 * - Questo file viene servito da /firebase-messaging-sw.js (Firebase lo cerca qui)
 * - NON usare import/export ES6 (Service Worker usa CommonJS o importScripts)
 * - Funziona su iOS solo se app è installata come PWA
 */

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Firebase configuration (same as client config)
// NOTA: Le variabili env non sono disponibili qui, usiamo valori hardcoded
// Questi valori sono public e safe per essere esposti (NEXT_PUBLIC_*)
const firebaseConfig = {
  apiKey: "AIzaSyABYIVE_ITsYKfpb2LanNpa7KNEK619t8Q",
  authDomain: "pannellostufa.firebaseapp.com",
  projectId: "pannellostufa",
  storageBucket: "pannellostufa.firebasestorage.app",
  messagingSenderId: "170058221044",
  appId: "1:170058221044:web:88a3a8bcd5e3c67cb9a5a1",
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

/**
 * Background message handler
 * Si attiva quando arriva una notifica mentre l'app è in background
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  // Estrai dati notifica
  const notificationTitle = payload.notification?.title || 'Pannello Stufa';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    tag: payload.data?.type || 'default',
    requireInteraction: payload.data?.priority === 'high',
    data: {
      url: payload.data?.url || '/',
      ...payload.data,
    },
    vibrate: payload.data?.priority === 'high' ? [200, 100, 200] : [100],
  };

  // Mostra notifica
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Notification click handler
 * Si attiva quando l'utente clicca sulla notifica
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification);

  event.notification.close();

  // Estrai URL da navigare
  const urlToOpen = event.notification.data?.url || '/';

  // Apri l'app o porta in focus se già aperta
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se l'app è già aperta, portala in focus
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            // Naviga all'URL specifico
            client.navigate(urlToOpen);
            return;
          }
        }

        // Altrimenti apri nuova finestra/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Service worker installation
 */
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installing...');
  self.skipWaiting();
});

/**
 * Service worker activation
 */
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activating...');
  event.waitUntil(clients.claim());
});
