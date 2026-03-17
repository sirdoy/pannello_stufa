# Deploy & Sync Guide

Guida completa per deployment e sincronizzazione changelog con Firebase.

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

# Auth0
AUTH0_SECRET=...
AUTH0_BASE_URL=https://your-app.vercel.app
AUTH0_ISSUER_BASE_URL=...
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...

# HA Proxy (Fritz!Box + Netatmo via HomeAssistant)
HA_API_URL=http://your-homeassistant-host:port
HA_API_KEY=your-ha-api-key

# Secrets
CRON_SECRET=your-cron-secret
ADMIN_SECRET=your-admin-secret  # ⚠️ IMPORTANTE per sync
```

**Genera ADMIN_SECRET:**
```bash
openssl rand -hex 32
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

## 🔄 Sincronizzazione Firebase

Dopo ogni deploy che modifica `lib/version.js`, **devi sincronizzare** il changelog con Firebase.

### Opzione A: Script Automatico (Consigliato)

```bash
# Locale (dopo aver fatto export ADMIN_SECRET)
export ADMIN_SECRET="your-admin-secret-here"
./scripts/sync-changelog.sh https://your-app.vercel.app

# Oppure passa direttamente il secret
./scripts/sync-changelog.sh https://your-app.vercel.app your-admin-secret
```

**Output successo:**
```
🔄 Sincronizzazione changelog con Firebase...
URL: https://your-app.vercel.app
✅ Sincronizzazione completata con successo!
{
  "success": true,
  "message": "Changelog sincronizzato con successo",
  "versionsCount": 10,
  "latestVersion": "1.4.0"
}
```

### Opzione B: Chiamata cURL Manuale

```bash
curl -X POST https://your-app.vercel.app/api/admin/sync-changelog \
  -H "Authorization: Bearer your-admin-secret" \
  -H "Content-Type: application/json"
```

### Opzione C: Node.js Script Locale

```bash
# Dalla root del progetto
node -e "require('./lib/changelogService').syncVersionHistoryToFirebase(require('./lib/version').VERSION_HISTORY)"
```

**⚠️ Richiede**: Firebase credentials configurate localmente in `.env.local`

---

## 📋 Workflow Completo Deploy + Sync

### Step by Step

1. **Aggiorna versione** (sempre dopo modifiche)
   ```bash
   # Modifica questi 3 file:
   - lib/version.js → APP_VERSION, VERSION_HISTORY
   - package.json → "version"
   - CHANGELOG.md → nuova sezione
   ```

2. **Commit e push**
   ```bash
   git add .
   git commit -m "Release v1.4.0: Descrizione modifiche"
   git push origin main
   ```

3. **Attendi deploy Vercel** (2-3 minuti)
   - Vercel detecta push e builda automaticamente
   - Verifica su dashboard che deploy sia completato

4. **Sincronizza Firebase** (entro 5 minuti dal deploy)
   ```bash
   export ADMIN_SECRET="your-secret"
   ./scripts/sync-changelog.sh https://your-app.vercel.app
   ```

5. **Verifica enforcement**
   - Utenti con app aperta vedranno `ForceUpdateModal` entro 5 secondi
   - Modal bloccante: devono cliccare "Aggiorna Ora"
   - Hard reload → nuova versione caricata

---

## 🔐 Security Notes

### ADMIN_SECRET
- ✅ **MAI** committare in repository
- ✅ Genera con `openssl rand -hex 32` (64 caratteri hex)
- ✅ Diverso per dev/production
- ✅ Rotazione periodica consigliata
- ✅ Conserva in password manager

### API Route `/api/admin/sync-changelog`
- ✅ Protetta da `Authorization: Bearer` header
- ✅ Esclusa da Auth0 middleware
- ✅ Risponde solo a POST con secret valido
- ✅ GET disponibile per healthcheck

### Vercel Environment Variables
- ✅ Configura ADMIN_SECRET su Vercel Dashboard
- ✅ Scope: Production (non preview/development)
- ✅ Encrypted at rest by Vercel

---

## 🛠️ Troubleshooting

### "Unauthorized" (401)
**Causa**: ADMIN_SECRET errato o mancante
**Fix**: Verifica secret in Vercel Dashboard e nel comando

### "Sync failed" (500)
**Causa**: Firebase credentials invalide o permessi insufficienti
**Fix**: Verifica Firebase config in Vercel Environment Variables

### "Version mismatch persiste"
**Causa**: Sync non eseguito o fallito silenziosamente
**Fix**:
1. Verifica sync con GET: `curl -H "Authorization: Bearer YOUR_SECRET" https://your-app.vercel.app/api/admin/sync-changelog`
2. Riesegui sync con POST
3. Verifica Firebase Console → Realtime Database → `/changelog`

### Script non eseguibile
**Causa**: Permessi file
**Fix**: `chmod +x scripts/sync-changelog.sh`

---

## 📊 Monitoring

### Verificare versione corrente

**In Firebase:**
```
Firebase Console → Realtime Database → /changelog
Cerca la key con versione più recente (es: "1_4_0")
```

**Da API:**
```bash
# Healthcheck (GET)
curl -H "Authorization: Bearer YOUR_SECRET" \
  https://your-app.vercel.app/api/admin/sync-changelog
```

**Output:**
```json
{
  "ready": true,
  "versionsCount": 10,
  "latestVersion": "1.4.0",
  "message": "Use POST to sync"
}
```

---

## 🤖 Automazione Futura (Opzionale)

### GitHub Actions (Post-Deploy Hook)

Crea `.github/workflows/sync-changelog.yml`:

```yaml
name: Sync Changelog to Firebase

on:
  push:
    branches:
      - main
    paths:
      - 'lib/version.js'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Wait for Vercel deployment
        run: sleep 180  # Attendi 3 minuti per deploy

      - name: Sync changelog
        run: |
          curl -X POST ${{ secrets.VERCEL_APP_URL }}/api/admin/sync-changelog \
            -H "Authorization: Bearer ${{ secrets.ADMIN_SECRET }}" \
            -H "Content-Type: application/json"
```

**Secrets da configurare su GitHub:**
- `VERCEL_APP_URL`: `https://your-app.vercel.app`
- `ADMIN_SECRET`: Il tuo admin secret

**Vantaggi:**
- ✅ Completamente automatico
- ✅ Nessun intervento manuale
- ✅ Sync garantito ad ogni deploy

---

## 📝 Checklist Deploy

- [ ] Aggiornato `lib/version.js`
- [ ] Aggiornato `package.json`
- [ ] Aggiornato `CHANGELOG.md`
- [ ] Commit e push a GitHub
- [ ] Deploy Vercel completato (verifica dashboard)
- [ ] **Sincronizzato Firebase** (script o curl)
- [ ] Verificato sync: `getLatestVersion()` ritorna nuova versione
- [ ] Testato enforcement: utenti con versione vecchia vedono modal

---

**Pro Tip**: Salva il comando sync in un alias bash:

```bash
# In ~/.bashrc o ~/.zshrc
alias sync-stufa='export ADMIN_SECRET="your-secret" && ./scripts/sync-changelog.sh https://your-app.vercel.app'

# Usage
sync-stufa
```
