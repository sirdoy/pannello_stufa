# Versioning Workflow

Sistema di versioning semantico con enforcement automatico e changelog Firebase.

## Semantic Versioning

Formato: `MAJOR.MINOR.PATCH` (es. `1.4.2`)

- **MAJOR** (x.0.0): Breaking changes incompatibili
- **MINOR** (0.x.0): New features backward-compatible
- **PATCH** (0.0.x): Bug fixes

**Esempi**:
- `1.0.0 → 1.1.0`: Nuova feature (notifications system)
- `1.1.0 → 1.1.1`: Bug fix (maintenance tracking)
- `1.9.0 → 2.0.0`: Breaking change (Firebase schema migration)

## Workflow Completo

### 1. Update Version Files

**File da aggiornare** (SEMPRE tutti e 3):

1. **`lib/version.js`**
   ```javascript
   export const APP_VERSION = '1.5.0';

   export const VERSION_HISTORY = [
     {
       version: '1.5.0',
       date: '2025-01-20',
       type: 'minor',
       changes: [
         'Implementato sistema notifiche push',
         'Aggiunto support iOS PWA',
       ],
     },
     // ... versioni precedenti
   ];
   ```

2. **`package.json`**
   ```json
   {
     "version": "1.5.0"
   }
   ```

3. **`CHANGELOG.md`**
   ```markdown
   ## [1.5.0] - 2025-01-20

   ### Added
   - Sistema notifiche push completo
   - Support iOS PWA per notifiche

   ### Fixed
   - Bug maintenance tracking
   ```

### 2. Test Build

```bash
npm run build
```

**⚠️ OBBLIGATORIO**: Build DEVE passare prima di commit/deploy.

### 3. Commit Changes

```bash
git add lib/version.js package.json CHANGELOG.md
git commit -m "Bump version to 1.5.0

- Add push notifications system
- Add iOS PWA support
- Fix maintenance tracking bug

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

git push
```

### 4. Deploy App

Deploy applicazione su hosting (Vercel, Netlify, etc.).

### 5. Sync Firebase (CRITICO)

**⚠️ OBBLIGATORIO**: Sync entro 5 secondi dal deploy.

```bash
node -e "require('./lib/changelogService').syncVersionHistoryToFirebase(require('./lib/version').VERSION_HISTORY)"
```

**Perché critico**: Version enforcer controlla versione Firebase. Se Firebase non aggiornata, utenti vedranno modal "Aggiorna app" anche se già aggiornati.

## Version Enforcement System

### Hard Enforcement (Production)

Modal bloccante se versione locale < Firebase.

**Trigger**: `compareVersions(APP_VERSION, firebaseVersion) < 0`

**Comportamento**:
- Modal full-screen bloccante
- Pulsante "Ricarica Pagina"
- NO chiusura modal
- Hard refresh page on click

**Implementazione**: `app/components/VersionEnforcer.js`

### Soft Notification (Development)

Badge "NEW" + modal dismissibile per nuove versioni.

**Trigger**: `compareVersions(APP_VERSION, lastSeenVersion) > 0`

**Comportamento**:
- Badge "NEW" su link Changelog
- WhatsNewModal dismissibile
- localStorage tracking versione vista

**Implementazione**: `app/hooks/useVersionCheck.js`

### Environment Detection

```javascript
// app/context/VersionContext.js

function isLocalEnvironment() {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}
```

**Regole**:
- **Production**: Hard enforcement attivo
- **Development** (localhost): Hard enforcement DISABILITATO (by design)

### Version Comparison

```javascript
// app/context/VersionContext.js

function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }

  return 0;
}
```

**Returns**:
- `1` se v1 > v2
- `0` se v1 === v2
- `-1` se v1 < v2

### Check Integration

**Polling**: Integrato in StovePanel polling (ogni 5s).

```javascript
// app/page.js - StoveCard

useEffect(() => {
  const fetchData = async () => {
    // ... fetch stove status ...

    // Version check (integrated)
    checkVersion();
  };

  fetchData();
  const interval = setInterval(fetchData, 5000);
  return () => clearInterval(interval);
}, []);
```

**Vantaggi**: 12x più veloce vs polling autonomo 60s.

## Changelog Page

Pagina `/changelog` con storico versioni ordinato semanticamente.

### Semantic Sorting (CRITICO)

**Problema**: Firebase ordina solo per data. Serve ordinamento semantico client-side.

```javascript
// app/changelog/page.js

function sortVersions(versions) {
  return versions.sort((a, b) => {
    const aParts = a.version.split('.').map(Number);
    const bParts = b.version.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (bParts[i] !== aParts[i]) {
        return bParts[i] - aParts[i];  // Descending
      }
    }

    return 0;
  });
}

// Fetch versions
const snapshot = await get(ref(db, 'changelog'));
const versions = Object.values(snapshot.val());

// Sort semantically
const sorted = sortVersions(versions);
```

**SEMPRE applicare** `sortVersions()` dopo fetch Firebase.

**Implementazione**: `app/changelog/page.js:45-65`

## Firebase Sync Service

### `syncVersionHistoryToFirebase()`

Sync VERSION_HISTORY da `lib/version.js` a Firebase.

```javascript
// lib/changelogService.js

export async function syncVersionHistoryToFirebase(versionHistory) {
  const updates = {};

  versionHistory.forEach(entry => {
    const key = entry.version.replace(/\./g, '_');  // 1.4.0 → 1_4_0

    updates[`changelog/${key}`] = {
      version: entry.version,
      date: entry.date,
      type: entry.type,
      changes: entry.changes,
      timestamp: new Date(`${entry.date}T00:00:00Z`).getTime(),
    };
  });

  await update(ref(db, '/'), updates);
}
```

**Firebase Key**: Dots replaced with underscores (Firebase constraint).

### `getLatestVersion()`

Fetch versione corrente da Firebase.

```javascript
// lib/changelogService.js

export async function getLatestVersion() {
  const snapshot = await get(ref(db, 'changelog'));

  if (!snapshot.exists()) return null;

  const versions = Object.values(snapshot.val());
  const sorted = sortVersions(versions);

  return sorted[0]?.version || null;
}
```

## Best Practices

### 1. Version Sync Timing

✅ **ALWAYS**: Sync Firebase entro 5s dal deploy
❌ **NEVER**: Deploy senza sync Firebase

**Perché**: Version enforcer controlla Firebase. Se non sincronizzata, falsi positivi.

### 2. Breaking Changes

Per breaking changes (MAJOR bump):
1. Documenta migration in CHANGELOG
2. Notifica utenti in anticipo (email, banner)
3. Mantieni backward compatibility se possibile

### 3. Hotfix Workflow

Per fix urgenti in production:

```bash
# 1. Fix bug
# 2. Bump PATCH version
# 3. Build + test
npm run build && npm test
# 4. Deploy
# 5. Sync Firebase IMMEDIATELY
node -e "require('./lib/changelogService').syncVersionHistoryToFirebase(require('./lib/version').VERSION_HISTORY)"
```

### 4. Pre-release Versions

Per testing versioni pre-release:

```javascript
// lib/version.js
export const APP_VERSION = '1.5.0-beta.1';
```

**Nota**: Version comparison supporta solo MAJOR.MINOR.PATCH. Pre-release tags per development only.

## Troubleshooting

### Modal "Aggiorna App" sempre visibile

**Check**:
1. Firebase sync? → Run sync command
2. Environment? → Modal disabled localhost (by design)
3. Version comparison? → Verify `APP_VERSION` !== `firebaseVersion`

### Badge "NEW" non appare

**Check**:
1. localStorage? → Clear `lastSeenVersion`
2. Version comparison? → Verify `APP_VERSION` > `lastSeenVersion`

### Changelog ordinamento errato

**Fix**: Applica sempre `sortVersions()` dopo fetch.

```javascript
// ❌ WRONG
const versions = Object.values(snapshot.val());
setVersions(versions);  // Ordine Firebase (date only)

// ✅ CORRECT
const versions = Object.values(snapshot.val());
const sorted = sortVersions(versions);
setVersions(sorted);  // Ordine semantico
```

## See Also

- [Firebase - Changelog Schema](./firebase.md#changelog-schema)
- [Testing](./testing.md) - Version comparison unit tests

---

**Last Updated**: 2025-10-21
