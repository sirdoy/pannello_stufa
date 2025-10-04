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

export const APP_VERSION = '1.1.0';
export const APP_AUTHOR = 'Federico Manfredi';
export const LAST_UPDATE = '2025-10-04';

export const VERSION_HISTORY = [
  {
    version: '1.1.0',
    date: '2025-10-04',
    changes: [
      'Aggiunta visualizzazione prossimo cambio scheduler in modalità automatica (azione, orario, potenza, ventola)',
      'Aggiunto pulsante "Torna in Automatico" in modalità semi-manuale (StovePanel e Scheduler page)',
      'Nuova funzione getNextScheduledAction() in schedulerService.js per dettagli cambio scheduler',
      'Formato orari unificato: "HH:MM del DD/MM"',
      'Migliorato layout sezione Modalità Controllo con design responsive',
    ],
  },
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
