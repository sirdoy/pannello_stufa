# Data Flow

Flussi dati principali dell'applicazione.

## Polling Status (ogni 5s)

```text
StoveCard useEffect
  ↓
Fetch: status + fan + power + mode
  ↓
checkVersion() integrated
  ↓
If error !== 0 → log + notify
  ↓
Update UI
```

**Frequency**: 5 secondi  
**Implementation**: `app/components/devices/stove/StoveCard.js`

## Scheduler stufa

Scheduler e tracking manutenzione girano sul Pi (ROADMAP D2); il Pi notifica il frontend su
`/api/internal/stove-events`. Il cron esterno `/api/scheduler/check` è stato rimosso (ROADMAP V12).

Vedi [Systems - Maintenance](./systems/maintenance.md) e [Systems - Monitoring](./systems/monitoring.md).

## OAuth Token Flow

```text
Client → API route
  ↓
getValidAccessToken()
  ↓
Fetch refresh_token from Firebase
  ↓
Exchange for access_token
  ↓
If expired: return { reconnect: true }
  ↓
Return { accessToken }
```

Vedi [API Routes - OAuth Pattern](./api-routes.md#oauth-20-pattern).

## Push Notifications

Vedi [Systems - Notifications](./systems/notifications.md).

## Version Check

```text
useNewVersion (poll GET /api/version)
  ↓
Compare FRONTEND_BUILD_ID / backend commit vs deployed
  ↓
If changed: show NewVersionBanner (reload)
```

Vedi [Versioning](./versioning.md).

---

**Last Updated**: 2025-10-21
