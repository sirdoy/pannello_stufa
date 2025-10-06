/**
 * Application Version Management
 *
 * Update this file whenever significant changes are made to the application.
 *
 * Version format: MAJOR.MINOR.PATCH
 * - MAJOR: Breaking changes or major feature releases
 * - MINOR: New features, non-breaking changes
 * - PATCH: Bug fixes, minor improvements
 *
 * IMPORTANTE: Dopo ogni aggiornamento, sincronizzare con Firebase e CHANGELOG.md:
 * 1. Aggiorna APP_VERSION, LAST_UPDATE e VERSION_HISTORY
 * 2. Esegui script di sync: node scripts/syncChangelog.js (opzionale, sync automatico su deploy)
 * 3. Aggiorna CHANGELOG.md manualmente con le modifiche
 */

export const APP_VERSION = '1.3.3';
export const APP_AUTHOR = 'Federico Manfredi';
export const LAST_UPDATE = '2025-10-06';

export const VERSION_HISTORY = [
  {
    version: '1.3.3',
    date: '2025-10-06',
    type: 'patch',
    changes: [
      'Design glassmorphism moderno stile iOS 18 per UI ancora più moderna',
      'Card: nuova prop glass per effetto vetro smerigliato',
      'Button: nuova variante glass con trasparenza e blur',
      'Select: dropdown automaticamente con effetto glassmorphism',
      'Tailwind: aggiunte shadow-glass, shadow-glass-lg, shadow-inner-glow, backdrop-blur-xs',
    ],
  },
  {
    version: '1.3.2',
    date: '2025-10-06',
    type: 'patch',
    changes: [
      'Corretto z-index dropdown componente Select (z-50 → z-[100])',
      'Risolto problema tendine select coperte da card successive',
    ],
  },
  {
    version: '1.3.1',
    date: '2025-10-06',
    type: 'patch',
    changes: [
      'Modalità semi-manuale ora si attiva SOLO da comandi manuali homepage (ignite, shutdown, setPower, setFan)',
      'Parametro source="manual"|"scheduler" nelle API routes per distinguere origine comando',
      'Verifica stufa accesa prima di attivare semi-manual con setPower/setFan',
      'Gestione fusi orari standardizzata con helper createDateInRomeTimezone()',
      'Tutti gli orari scheduler ora gestiti con timezone Europe/Rome e salvataggio UTC consistente',
      'Risolto problema orari incorretti quando server in timezone diverso da Europe/Rome',
    ],
  },
  {
    version: '1.3.0',
    date: '2025-10-04',
    type: 'minor',
    changes: [
      'Sistema controllo versione bloccante con modal forzato aggiornamento',
      'Hook useVersionEnforcement per polling periodico versione Firebase (ogni 60s)',
      'Componente ForceUpdateModal bloccante quando versione locale ≠ Firebase',
      'Integrazione VersionEnforcer in layout.js per controllo globale',
      'Prevenzione uso applicazione con versione obsoleta',
    ],
  },
  {
    version: '1.2.1',
    date: '2025-10-04',
    type: 'patch',
    changes: [
      'Risolto warning ESLint per export anonimo in lib/version.js',
      'Aggiunta direttiva \'use client\' mancante in 4 componenti con React hooks',
      'Corretti componenti scheduler: DayAccordionItem, DayScheduleCard, TimeBar',
      'Corretto hook useVersionCheck con direttiva client',
    ],
  },
  {
    version: '1.2.0',
    date: '2025-10-04',
    type: 'minor',
    changes: [
      'Sistema notifiche nuove versioni con badge "NEW" nel footer',
      'Modal "What\'s New" automatico al primo accesso post-update',
      'Hook useVersionCheck per confronto versioni e gestione localStorage',
      'Badge animato con pulse quando disponibile nuova versione',
      'Opzione "Non mostrare più" per versioni specifiche',
      'Chiusura modal con tasto ESC',
    ],
  },
  {
    version: '1.1.0',
    date: '2025-10-04',
    type: 'minor',
    changes: [
      'Aggiunta visualizzazione prossimo cambio scheduler in modalità automatica (azione, orario, potenza, ventola)',
      'Aggiunto pulsante "Torna in Automatico" in modalità semi-manuale (StovePanel e Scheduler page)',
      'Nuova funzione getNextScheduledAction() in schedulerService.js per dettagli cambio scheduler',
      'Formato orari unificato: "HH:MM del DD/MM"',
      'Migliorato layout sezione Modalità Controllo con design responsive',
      'Sistema changelog centralizzato con sincronizzazione Firebase',
      'Pagina dedicata /changelog per visualizzare storico versioni',
    ],
  },
  {
    version: '1.0.0',
    date: '2025-10-01',
    type: 'major',
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

const versionInfo = {
  version: APP_VERSION,
  author: APP_AUTHOR,
  lastUpdate: LAST_UPDATE,
  history: VERSION_HISTORY,
};

export default versionInfo;
