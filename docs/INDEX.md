# Documentation Index

Indice documentazione Pannello Stufa. **Ottimizzato per token efficiency**.

---

## Core

| File | Contenuto |
|------|-----------|
| [quick-start.md](quick-start.md) | Setup, installazione |
| [architecture.md](architecture.md) | Multi-device pattern |
| [troubleshooting.md](troubleshooting.md) | Problemi comuni (compresso) |

## Development

| File | Contenuto |
|------|-----------|
| [api-routes.md](api-routes.md) | API endpoints, OAuth (compresso) |
| [patterns.md](patterns.md) | Pattern app-specifici |
| [data-flow.md](data-flow.md) | Polling, cron, OAuth flow |
| [firebase.md](firebase.md) | Schema, operations, security |

## UI & Design

| File | Contenuto |
|------|-----------|
| [design-system.md](design-system.md) | Ember Noir v2 |
| [ui-components.md](ui-components.md) | Component API |
| [ui-modal.md](ui-modal.md) | Modal patterns |
| [page-transitions.md](page-transitions.md) | View Transitions API |
| [components/navigation.md](components/navigation.md) | Navbar component |

**Live preview**: `/debug/design-system`

## Systems

| File | Contenuto |
|------|-----------|
| [systems/maintenance.md](systems/maintenance.md) | Tracking ore H24 |
| [systems/monitoring.md](systems/monitoring.md) | Cron health |
| [systems/errors.md](systems/errors.md) | Error detection |
| [systems/notifications.md](systems/notifications.md) | FCM push |

## External Integrations

| File | Contenuto |
|------|-----------|
| [setup/netatmo-setup.md](setup/netatmo-setup.md) | Netatmo OAuth 2.0 |
| [setup/hue-setup.md](setup/hue-setup.md) | Philips Hue Local API |
| [setup/fritzbox-setup.md](setup/fritzbox-setup.md) | Fritz!Box TR-064 |

## PWA & Testing

| File | Contenuto |
|------|-----------|
| [pwa.md](pwa.md) | Serwist, offline, Background Sync |
| [testing.md](testing.md) | Unit + E2E tests |
| [sandbox.md](sandbox.md) | Sandbox mode |
| [versioning.md](versioning.md) | Semantic versioning |
| [deployment.md](deployment.md) | Deploy workflow |

## Security

| File | Contenuto |
|------|-----------|
| [security/](security/) | Firebase rules, verification reports |

## Reference

| File | Contenuto |
|------|-----------|
| [stove-status-mapping.md](stove-status-mapping.md) | Thermorossi status codes |
| [visual-screenshots.md](visual-screenshots.md) | UI screenshots |

## Archive

Documentazione storica: [archive/](archive/)

---

**Docs attivi**: 30 file | **Archive**: 28 file | **Last Updated**: 2026-01-21

---

## Optimization Summary (v1.76.0)

| File | Before | After | Saved |
|------|--------|-------|-------|
| api-routes.md | 779 | 236 | **70%** |
| troubleshooting.md | 763 | 209 | **73%** |
| testing.md + E2E | 859 | 200 | 77% |
| firebase.md + security | 1143 | 190 | 83% |
| ui-components.md | 1001 | 240 | 76% |
| design-system.md | 1719 | 240 | 86% |
| patterns.md | 1515 | 200 | 87% |
| netatmo-setup.md | 481 | 115 | 76% |
| **Total** | **8260** | **1630** | **80%** |

**Principi**:
- Tabelle > prose verbose
- Reference > duplicazione
- Pattern comuni estratti
- Code examples minimali
