# PWA (Progressive Web App) Documentation

Documentazione per le funzionalita PWA dell'applicazione Pannello Stufa.

## Overview

L'applicazione utilizza **Serwist v9** per il supporto PWA, sostituendo la precedente implementazione con `@ducanh2912/next-pwa`. Questa migrazione offre:

- Migliore supporto iOS Safari
- Service Worker in TypeScript
- Configurazione piu moderna e flessibile
- Strategie di caching ottimizzate

## Architettura

### File Principali

```
/
├── app/
│   ├── sw.ts                        # Service Worker (TypeScript)
│   └── components/
│       └── AppleSplashScreens.js    # Splash screens iOS
├── lib/
│   └── hooks/
│       └── usePWAInstall.js         # Hook per installazione PWA
├── public/
│   ├── manifest.json                # Web App Manifest
│   ├── firebase-messaging-sw.js     # FCM Service Worker (separato)
│   ├── icons/                       # Icone app
│   └── splash/                      # Splash screens iOS (da generare)
├── next.config.mjs                  # Configurazione Serwist
└── tsconfig.json                    # Config TypeScript per SW
```

## Service Worker (app/sw.ts)

Il service worker gestisce:

### 1. Precaching
Assets statici vengono pre-cachati durante l'installazione.

### 2. Runtime Caching

| Tipo | Strategia | Cache Name | TTL |
|------|-----------|------------|-----|
| Navigation (HTML) | NetworkFirst | pages-cache | 1 giorno |
| Stove API | NetworkFirst | stove-api-cache | 1 minuto |
| Immagini | CacheFirst | image-cache | 7 giorni |
| JS/CSS | StaleWhileRevalidate | static-resources | 1 giorno |

### 3. Push Notifications
Gestione notifiche Firebase Cloud Messaging in background:
- Ricezione push (`push` event)
- Click su notifica (`notificationclick` event)
- Navigazione all'URL specifico

### 4. Offline Fallback
Pagina `/offline` mostrata quando non c'e connessione.

### 5. Background Sync (v1.61.0+)
Sincronizzazione automatica comandi offline:
- Accoda comandi stufa quando offline (accensione, spegnimento, potenza)
- Esegue automaticamente al ritorno della connessione
- Retry con backoff esponenziale (max 3 tentativi)
- Notifica client quando comando completato

### 6. App Badges (v1.61.0+)
Contatore notifiche su icona app:
- Incrementa su ogni push notification
- Mostra count errori + alert manutenzione
- Clear automatico quando app viene aperta

### 7. Device State Cache (v1.61.0+)
Cache automatica stato dispositivi in IndexedDB:
- Intercetta risposte API `/api/stove/status` e `/api/netatmo/status`
- Salva stato con timestamp per visualizzazione offline
- Indicatore "dati non recenti" dopo 30 minuti

## Manifest (public/manifest.json)

### Campi Chiave

```json
{
  "id": "/?source=pwa",
  "prefer_related_applications": false,
  "handle_links": "preferred"
}
```

- **id**: Identificatore univoco per aggiornamenti
- **prefer_related_applications**: Preferisce PWA over app native
- **handle_links**: Apre link esterni nella PWA

### Icone

Configurazione con purpose separati per compatibilita cross-platform:

```json
{
  "src": "/icons/icon-192.png",
  "sizes": "192x192",
  "purpose": "any"
},
{
  "src": "/icons/icon-192.png",
  "sizes": "192x192",
  "purpose": "maskable"
}
```

## iOS Splash Screens

### Componente AppleSplashScreens

Genera tutti i `<link rel="apple-touch-startup-image">` necessari per iOS.

Dispositivi supportati:
- iPhone 15 Pro Max / 14 Pro Max
- iPhone 15 Pro / 14 Pro
- iPhone 15 / 14 / 13 / 12
- iPhone SE
- iPad Pro 12.9" / 11"
- iPad Air
- iPad Mini

### Generazione Immagini

Per generare le immagini splash screen, usare un tool come:

```bash
# Usando pwa-asset-generator
npx pwa-asset-generator ./public/icons/icon-512.png ./public/splash \
  --background "#ffffff" \
  --splash-only \
  --type png
```

Oppure manualmente creare immagini con le dimensioni specificate in `AppleSplashScreens.js`.

### Formato File

```
/public/splash/
├── splash-1290x2796.png    # iPhone 15 Pro Max
├── splash-1179x2556.png    # iPhone 15 Pro
├── splash-1170x2532.png    # iPhone 13/14
├── splash-750x1334.png     # iPhone SE
├── splash-2048x2732.png    # iPad Pro 12.9"
└── ...
```

## Hook usePWAInstall

### Utilizzo

```javascript
import { usePWAInstall } from '@/lib/hooks/usePWAInstall';

function InstallBanner() {
  const { isInstalled, isInstallable, isIOS, promptInstall, dismissInstall } = usePWAInstall();

  if (isInstalled) {
    return null; // Gia installata
  }

  if (isIOS) {
    return (
      <div>
        <p>Per installare: Tap Share, poi "Aggiungi a Home"</p>
        <button onClick={dismissInstall}>Chiudi</button>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <div>
        <button onClick={promptInstall}>Installa App</button>
        <button onClick={dismissInstall}>Non ora</button>
      </div>
    );
  }

  return null;
}
```

### Valori Restituiti

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `isInstalled` | boolean | App in modalita standalone |
| `isInstallable` | boolean | Browser supporta installazione |
| `isIOS` | boolean | Dispositivo iOS |
| `isDismissed` | boolean | Utente ha chiuso il banner |
| `promptInstall` | function | Mostra prompt installazione |
| `dismissInstall` | function | Chiude banner per sessione |

## Push Notifications

### Setup

Le notifiche push usano Firebase Cloud Messaging (FCM).

1. **Service Worker**: `app/sw.ts` gestisce push in background
2. **FCM SW**: `public/firebase-messaging-sw.js` per compatibilita legacy

### Flusso

1. Client richiede permesso notifiche
2. Client ottiene FCM token
3. Token salvato su Firebase Database
4. Server invia push tramite Firebase Admin SDK
5. Service Worker riceve e mostra notifica

### Configurazione iOS

Per iOS Safari, le notifiche funzionano SOLO se:
- App installata come PWA
- iOS 16.4+ (supporto Web Push)

## Configurazione Next.js

### next.config.mjs

```javascript
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',        // Source del service worker
  swDest: 'public/sw.js',    // Output compilato
  cacheOnNavigation: true,   // Cache navigazioni
  reloadOnOnline: true,      // Ricarica quando torna online
  disable: process.env.NODE_ENV === 'development',
});

export default withSerwist(nextConfig);
```

### tsconfig.json

Configurazione necessaria per TypeScript service worker:

```json
{
  "compilerOptions": {
    "lib": ["ES2020", "DOM", "DOM.Iterable", "WebWorker"],
    "types": ["@serwist/next/typings"]
  },
  "exclude": ["public/sw.js"]
}
```

## Testing

### Verifica PWA

1. Build production: `npm run build`
2. Avvia: `npm start`
3. Apri Chrome DevTools > Application
4. Verifica:
   - Manifest caricato correttamente
   - Service Worker registrato
   - Cache popolata

### Lighthouse

Esegui audit Lighthouse per verificare score PWA:
- Chrome DevTools > Lighthouse > Progressive Web App

### iOS Testing

1. Apri Safari su iPhone/iPad
2. Naviga all'app
3. Tap Share > "Aggiungi a Home"
4. Apri dalla home screen
5. Verifica splash screen e standalone mode

## Troubleshooting

### Service Worker non si registra

- Verifica che `public/sw.js` sia generato dopo build
- Controlla console per errori
- In dev mode il SW e disabilitato

### Splash screen non appare su iOS

- Verifica che le immagini esistano in `/public/splash/`
- Controlla media queries in DevTools
- Safari richiede dimensioni esatte

### Notifiche non funzionano su iOS

- Verifica iOS 16.4+
- App deve essere installata come PWA
- Richiedi permesso dopo interazione utente

### Cache non si aggiorna

- Service Worker usa `skipWaiting: true`
- Per forzare aggiornamento: DevTools > Application > Service Workers > Update

## Background Sync (v1.61.0+)

Permette di accodare comandi stufa quando offline ed eseguirli automaticamente al ritorno della connessione.

### File

- `lib/pwa/backgroundSync.js` - Service per gestione coda
- `lib/hooks/useBackgroundSync.js` - React hook per UI
- `app/sw.ts` - Handlers nel Service Worker

### Utilizzo

```javascript
import { useBackgroundSync } from '@/lib/hooks/useBackgroundSync';

function StoveControls() {
  const { queueStoveCommand, pendingCommands, hasPendingCommands } = useBackgroundSync();

  const handleIgnite = async () => {
    if (!navigator.onLine) {
      // Accoda comando per esecuzione quando online
      await queueStoveCommand('ignite', { source: 'manual' });
      // Mostra feedback "Comando in coda"
    } else {
      // Esegui direttamente
      await fetch('/api/stove/ignite', { method: 'POST' });
    }
  };

  return (
    <div>
      <button onClick={handleIgnite}>Accendi</button>
      {hasPendingCommands && (
        <p>{pendingCommands.length} comandi in attesa</p>
      )}
    </div>
  );
}
```

### Comandi Supportati

| Endpoint | Azione |
|----------|--------|
| `stove/ignite` | Accensione stufa |
| `stove/shutdown` | Spegnimento stufa |
| `stove/set-power` | Impostazione potenza |

### Browser Support

- Chrome/Edge: Completo (Background Sync API)
- Firefox/Safari: Fallback con retry manuale quando app attiva

## useOnlineStatus Hook (v1.61.0+)

Monitora lo stato della connessione con eventi real-time.

### Utilizzo

```javascript
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';

function ConnectionStatus() {
  const { isOnline, wasOffline, offlineSince } = useOnlineStatus();

  if (!isOnline) {
    return <OfflineBanner since={offlineSince} />;
  }

  if (wasOffline) {
    return <div>Riconnesso!</div>;
  }

  return null;
}
```

### Valori Restituiti

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `isOnline` | boolean | Stato connessione attuale |
| `wasOffline` | boolean | Era offline (per 5 secondi dopo riconnessione) |
| `offlineSince` | Date | Timestamp inizio disconnessione |
| `lastOnlineAt` | Date | Ultimo timestamp online |
| `checkConnection` | function | Verifica manuale connessione |

## OfflineBanner Component (v1.61.0+)

Banner persistente per mostrare stato connessione.

### Utilizzo

```javascript
import { OfflineBanner } from '@/app/components/ui';

// Nel layout
<OfflineBanner showPendingCount />

// Fixed in alto
<OfflineBanner fixed />
```

### Props

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `showPendingCount` | boolean | true | Mostra comandi in coda |
| `fixed` | boolean | false | Posizione fixed in alto |
| `className` | string | '' | Classi CSS aggiuntive |

## Enhanced Offline Page (v1.61.0+)

La pagina `/offline` mostra stato cached dei dispositivi invece di un messaggio generico.

### Features

- **Stato Stufa Cached**: Temperatura, stato, potenza
- **Stato Termostato Cached**: Temperatura, setpoint, umidita
- **Comandi in Coda**: Lista comandi pending
- **Warning Dati Stale**: Avviso se dati > 30 minuti
- **Auto-Redirect**: Torna a home quando online

### Cache Automatica

Il Service Worker intercetta le risposte API e salva automaticamente:
- `/api/stove/status` → IndexedDB `deviceState.stove`
- `/api/netatmo/status` → IndexedDB `deviceState.thermostat`

## IndexedDB Schema (v1.61.0+)

Database: `pannello-stufa-pwa`

### Stores

| Store | KeyPath | Descrizione |
|-------|---------|-------------|
| `commandQueue` | id (auto) | Coda comandi background sync |
| `deviceState` | deviceId | Cache stato dispositivi |
| `appState` | key | Stato app (badge count, etc.) |

### Esempio Query

```javascript
import { get, getAll, STORES } from '@/lib/pwa/indexedDB';

// Ottieni stato stufa cached
const stoveState = await get(STORES.DEVICE_STATE, 'stove');

// Ottieni tutti i comandi in coda
const commands = await getAll(STORES.COMMAND_QUEUE);
```

## Screen Wake Lock (v1.62.0+)

Mantiene lo schermo acceso durante il monitoraggio attivo della stufa.

### Utilizzo

```javascript
import { useWakeLock } from '@/lib/hooks/useWakeLock';

function StoveMonitor() {
  const { isLocked, isSupported, lock, unlock, toggle } = useWakeLock();

  return (
    <button onClick={toggle} disabled={!isSupported}>
      {isLocked ? 'Consenti standby' : 'Mantieni schermo acceso'}
    </button>
  );
}
```

### Browser Support

Chrome, Edge, Safari (iOS 16.4+). Non supportato su Firefox.

## Vibration API (v1.62.0+)

Feedback aptico per notifiche e alert critici.

### Utilizzo

```javascript
import { vibrateError, vibrateCritical, vibrateSuccess } from '@/lib/pwa/vibration';

// Su errore stufa
vibrateError();

// Su errore critico
vibrateCritical();

// Su comando completato
vibrateSuccess();
```

### Pattern Disponibili

| Pattern | Uso |
|---------|-----|
| `SHORT` | Conferme rapide |
| `SUCCESS` | Operazioni riuscite |
| `WARNING` | Avvisi |
| `ERROR` | Errori |
| `CRITICAL` | Errori critici stufa |
| `NOTIFICATION` | Notifiche standard |

## Geofencing (v1.62.0+)

Automazione basata sulla posizione per controllo stufa.

### Utilizzo

```javascript
import { useGeofencing } from '@/lib/hooks/useGeofencing';

function GeofenceSettings() {
  const {
    isSupported,
    isConfigured,
    isHome,
    distance,
    setHomeLocation,
    enable,
    disable,
  } = useGeofencing({
    onLeaveHome: () => shutdownStove(),
    onArriveHome: () => igniteStove(),
  });

  return (
    <div>
      <button onClick={setHomeLocation}>Imposta posizione casa</button>
      {isConfigured && (
        <p>
          {isHome ? 'Sei a casa' : `Distanza: ${distance}m`}
        </p>
      )}
    </div>
  );
}
```

### Configurazione

- **Raggio default**: 200 metri
- **Azioni**: Spegnimento all'uscita, accensione all'arrivo
- **Storage**: Configurazione salvata in IndexedDB

## Persistent Storage (v1.62.0+)

Richiede storage persistente per evitare che il browser cancelli i dati IndexedDB.

### Utilizzo

```javascript
import { requestPersistentStorage, getStorageDetails } from '@/lib/pwa/persistentStorage';

// Richiedi persistenza (automatico in PWAInitializer)
const granted = await requestPersistentStorage();

// Verifica stato storage
const details = await getStorageDetails();
console.log(details);
// { usage: 1024000, quota: 100000000, persisted: true, ... }
```

## Periodic Background Sync (v1.62.0+)

Controlla lo stato della stufa periodicamente anche con app chiusa (solo Chrome/Edge).

### Utilizzo

```javascript
import { usePeriodicSync } from '@/lib/hooks/usePeriodicSync';

function PeriodicSyncSettings() {
  const { isSupported, isRegistered, register, unregister } = usePeriodicSync({
    interval: 15 * 60 * 1000, // 15 minuti
  });

  if (!isSupported) {
    return <p>Non supportato su questo browser</p>;
  }

  return (
    <button onClick={isRegistered ? unregister : register}>
      {isRegistered ? 'Disabilita' : 'Abilita'} controllo periodico
    </button>
  );
}
```

### Comportamento

- Controlla `/api/stove/status` in background
- Invia notifica se rileva errori stufa
- Invia notifica se manutenzione richiesta
- Intervallo minimo: 15 minuti (imposto dal browser)

## Web Share API (v1.62.0+)

Condividi stato dispositivi con altri.

### Utilizzo

```javascript
import {
  shareStoveStatus,
  shareThermostatStatus,
  shareDeviceSummary,
  shareApp,
} from '@/lib/pwa/webShare';

// Condividi stato stufa
await shareStoveStatus({
  status: 'on',
  temperature: 21,
  power: 3,
});

// Condividi stato termostato
await shareThermostatStatus({
  temperature: 20,
  setpoint: 21,
  humidity: 45,
});

// Condividi riepilogo
await shareDeviceSummary({ stove, thermostat });

// Condividi l'app
await shareApp();
```

## Riferimenti

- [Serwist Documentation](https://serwist.pages.dev/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Apple PWA Support](https://developer.apple.com/documentation/webkit/promoting-apps-with-smart-app-banners)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)
- [Periodic Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Periodic_Background_Sync_API)
- [Badging API](https://developer.mozilla.org/en-US/docs/Web/API/Badging_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API)
- [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)
