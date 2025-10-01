/**
 * Application Version Management
 *
 * Update this file whenever significant changes are made to the application.
 *
 * Version format: MAJOR.MINOR.PATCH
 * - MAJOR: Breaking changes or major feature releases
 * - MINOR: New features, non-breaking changes
 * - PATCH: Bug fixes, minor improvements
 */

export const APP_VERSION = '1.0.0';
export const APP_AUTHOR = 'Federico Manfredi';
export const LAST_UPDATE = '2025-10-01';

export const VERSION_HISTORY = [
  {
    version: '1.0.0',
    date: '2025-10-01',
    changes: [
      'Sistema di controllo completo stufa Thermorossi',
      'Schedulazione settimanale automatica',
      'Integrazione Auth0 per autenticazione',
      'Logging azioni utente su Firebase',
      'Sistema monitoraggio errori e allarmi',
      'Integrazione Netatmo per temperatura',
      'PWA con supporto offline',
      'Sistema di versioning implementato',
    ],
  },
];

export default {
  version: APP_VERSION,
  author: APP_AUTHOR,
  lastUpdate: LAST_UPDATE,
  history: VERSION_HISTORY,
};
