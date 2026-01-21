# Netatmo Setup

OAuth 2.0 integration for Netatmo Energy API.

---

## Quick Setup

1. **Create Netatmo app**: [dev.netatmo.com/apps](https://dev.netatmo.com/apps)
   - **Redirect URI**: `http://localhost:3001/api/netatmo/callback` (dev) / `https://your-domain/api/netatmo/callback` (prod)
   - **Scopes**: `read_thermostat`, `write_thermostat`

2. **Add credentials** to `.env.local`:
   ```bash
   NEXT_PUBLIC_NETATMO_CLIENT_ID=xxx
   NETATMO_CLIENT_SECRET=xxx
   NEXT_PUBLIC_NETATMO_REDIRECT_URI=http://localhost:3001/api/netatmo/callback
   ```

3. **Test**: Visit `/netatmo` → "Connetti con Netatmo"

---

## Dual Credentials (Dev + Prod)

Create **two Netatmo apps** to isolate environments:

```bash
# .env.local (both sets)
# Development
NEXT_PUBLIC_NETATMO_CLIENT_ID_DEV=xxx
NETATMO_CLIENT_SECRET_DEV=xxx
NEXT_PUBLIC_NETATMO_REDIRECT_URI_DEV=http://localhost:3001/api/netatmo/callback

# Production
NEXT_PUBLIC_NETATMO_CLIENT_ID=xxx
NETATMO_CLIENT_SECRET=xxx
NEXT_PUBLIC_NETATMO_REDIRECT_URI=https://your-app.vercel.app/api/netatmo/callback
```

Vercel: Add **only production** credentials (no `_DEV` suffix).

---

## OAuth Flow

1. User clicks "Connetti" → Redirect to Netatmo authorize
2. User approves → Redirect to `/api/netatmo/callback?code=xxx`
3. Callback exchanges code for `refresh_token` → Saved to Firebase
4. Redirect to `/netatmo/authorized` → Success page → Dashboard

**Firebase paths**:
- Development: `dev/netatmo/refresh_token`
- Production: `netatmo/refresh_token`

---

## Features

### Battery Status

```javascript
// GET /api/netatmo/homestatus response
{
  modules: [{ battery_state: "full"|"high"|"medium"|"low"|"very_low" }],
  hasLowBattery: false,
  hasCriticalBattery: false
}
```

### Daily Valve Calibration

Cron job auto-calibrates valves every 24h. Path: `netatmo/lastAutoCalibration`

### Stove-Valve Sync

Living room valve set to 16C when stove is ON.

```javascript
// GET/POST /api/netatmo/stove-sync
{ action: "enable"|"disable"|"sync", roomId, stoveTemperature: 16 }
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Missing CLIENT_ID" | Add `_DEV` credentials to `.env.local` |
| "Redirect URI mismatch" | Check URI registered in Netatmo portal |
| "Invalid client" | Verify CLIENT_ID and SECRET |
| Works locally not prod | Add credentials to Vercel |

---

## Firebase Schema

```
netatmo/
├── refresh_token
├── home_id
├── topology/
├── currentStatus/
└── stoveSync/
```

---

## Testing

```bash
npm test -- netatmo
```

All Netatmo endpoints are covered by unit tests.
