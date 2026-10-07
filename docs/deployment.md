# Deploy Guide

Deploy del frontend su Vercel e verifica della build in produzione.

---

## 🚀 Deploy su Vercel

### 1. Setup Iniziale

**Environment Variables su Vercel:**

Dashboard Vercel → Settings → Environment Variables → Aggiungi:

```bash
# Firebase (tutte le var con NEXT_PUBLIC_)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...

# Login session (first-party, utenti sul Pi DB)
SESSION_SECRET=... # >= 32 caratteri, openssl rand -hex 32

# HA Proxy (Fritz!Box + Netatmo via HomeAssistant)
HA_API_URL=http://your-homeassistant-host:port
HA_API_KEY=your-ha-api-key
```

### 2. Deploy App

```bash
# Push a GitHub (se connesso a Vercel)
git push origin main

# Oppure deploy manuale
vercel --prod
```

Vercel builderà e deployerà automaticamente.

---

## 🔎 Versione deployata

Il versioning semantico (`lib/version.ts`, `APP_VERSION`) è fermo alla 1.77.0 e non si incrementa più (ROADMAP M36).
Ogni deploy è identificato dal commit della build:

- `NEXT_PUBLIC_BUILD_ID` viene valorizzato al build da `VERCEL_GIT_COMMIT_SHA` (`lib/buildVersion.ts`);
- `GET /api/version` restituisce i commit di frontend e backend in esecuzione;
- `NewVersionBanner` (`useNewVersion`) propone il reload quando il commit deployato differisce da quello
  della pagina aperta (M17);
- `/changelog` mostra lo storico archiviato in `VERSION_HISTORY` (dal bundle) e il commit della build corrente.

Verifica dello stato del deploy:

```bash
gh api repos/sirdoy/pannello_stufa/commits/<sha>/status --jq .state   # success = deploy Vercel ok
```
