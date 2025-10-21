# Data Flow

Flussi dati principali dell'applicazione.

## Polling Status (ogni 5s)

```
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

## Scheduler Cron (ogni minuto)

```
GET /api/scheduler/check?secret=xxx
  ↓
1. Verify CRON_SECRET
2. Save cronHealth/lastCall
3. Check mode (manual/auto/semi-manual)
4. If auto: execute scheduled actions
5. If IGNITE: check maintenance (canIgnite)
6. If scheduled change: clear semi-manual
7. Track usage: trackUsageHours(status)
```

**Frequency**: 1 minuto  
**Implementation**: `app/api/scheduler/check/route.js`

Vedi [Systems - Maintenance](./systems/maintenance.md) e [Systems - Monitoring](./systems/monitoring.md).

## OAuth Token Flow

```
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

```
StoveCard polling (5s)
  ↓
checkVersion()
  ↓
Compare APP_VERSION vs Firebase
  ↓
If outdated: show ForceUpdateModal
```

Vedi [Versioning](./versioning.md).

---

**Last Updated**: 2025-10-21
