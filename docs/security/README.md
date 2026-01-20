# Security Documentation

Questa cartella contiene documentazione relativa alla sicurezza del progetto.

## Contenuto

| File | Tipo | Descrizione |
|------|------|-------------|
| [SECURITY-RULES-FIXES.md](SECURITY-RULES-FIXES.md) | Fixes | Correzioni Firebase Security Rules |
| [SECURITY-VERIFICATION-REPORT.md](SECURITY-VERIFICATION-REPORT.md) | Audit | Verifica regole di sicurezza |

## Documentazione Correlata

Per la documentazione principale sulla sicurezza Firebase, vedi:
- [Firebase Security Rules](../firebase-security.md) - Guida completa regole di sicurezza

## Best Practices di Sicurezza

### Firebase
- `.read = true`: Solo per dati pubblici (real-time listeners)
- `.write = false`: Scritture solo via Admin SDK server-side
- Validazione dati con `.validate` rules

### API Routes
- Autenticazione via Auth0 middleware
- Verifica `CRON_SECRET` per endpoint scheduler
- Bearer token per endpoint admin

### OAuth
- Refresh token salvati in Firebase (server-side)
- Access token mai esposti client-side
- Auto-refresh con rotazione token

### Environment
- Secrets in `.env.local` (mai committati)
- Variabili `NEXT_PUBLIC_*` solo per dati pubblici
- Admin SDK credentials solo server-side
