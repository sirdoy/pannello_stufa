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

## Riferimenti

- [Serwist Documentation](https://serwist.pages.dev/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Apple PWA Support](https://developer.apple.com/documentation/webkit/promoting-apps-with-smart-app-banners)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
