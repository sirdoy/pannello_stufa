# Netatmo Setup

Local proxy integration for Netatmo Energy API. No OAuth required — the proxy handles token lifecycle.

---

## Quick Setup

1. **Configure proxy credentials** in `.env.local`:
   ```bash
   NETATMO_PROXY_URL=http://your-homeassistant-host:port/api/v1/netatmo
   NETATMO_PROXY_API_KEY=your-proxy-api-key
   ```

2. **Test connection**: Visit the thermostat card on the dashboard — it will connect via the proxy automatically.

---

## Proxy Architecture

All Netatmo API calls go through a local HomeAssistant Network API proxy:

```
App → NETATMO_PROXY_URL (local network) → Netatmo Cloud
```

**Benefits:**
- No OAuth credentials in this app
- Proxy handles token refresh, rate limiting, and caching
- API key authentication (simpler than OAuth 2.0)

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

Cron job auto-calibrates valves every 12 hours. Path: `netatmo/lastAutoCalibration`

### Stove-Valve Sync

Proxy coordinates stove sync — setpoints are managed by the proxy directly.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| "NETATMO_PROXY_URL missing" | Add proxy URL to `.env.local` |
| "NETATMO_PROXY_API_KEY missing" | Add API key to `.env.local` |
| Connection timeout | Verify proxy host is reachable on local network |
| 401 Unauthorized | Check NETATMO_PROXY_API_KEY matches proxy configuration |

---

## Firebase Schema

```
netatmo/
├── topology/
├── currentStatus/
├── stoveSync/
├── lastAutoCalibration
└── proxyHealth/
```

---

## Testing

```bash
npm test -- netatmo
```

All Netatmo endpoints are covered by unit tests.
