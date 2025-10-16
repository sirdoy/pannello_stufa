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

export const APP_VERSION = '1.5.9';
export const APP_AUTHOR = 'Federico Manfredi';
export const LAST_UPDATE = '2025-10-16';

export const VERSION_HISTORY = [
  {
    version: '1.5.9',
    date: '2025-10-16',
    type: 'patch',
    changes: [
      'Netatmo UI: report temperature compatto in home page con polling automatico 30s',
      'Badge tipo dispositivo: termostato/valvola visualizzati in home e pagina dettagli',
      'Ordinamento intelligente: termostati sempre per primi, poi valvole, poi stanze con temperatura',
      'Fix Firebase: filtro automatico valori undefined per prevenire errori write operations',
      'Filtro relè: dispositivi NAPlug rimossi da visualizzazione (non utili per temperature)',
      'Pattern Firebase undefined handling: documentato in CLAUDE.md per riutilizzo future integrazioni',
    ],
  },
  {
    version: '1.5.8',
    date: '2025-10-16',
    type: 'patch',
    changes: [
      'Integrazione Netatmo: OAuth 2.0 flow completo con sessione persistente',
      'Token helper centralizzato: auto-refresh automatico refresh token, gestione errori intelligente',
      'Sessione permanente: token si auto-rinnova ad ogni chiamata API, nessun re-login necessario',
      'UI feedback errori: banner dismissibili con flag reconnect per riconnessione guidata',
      '8 endpoint API Netatmo: topology, status, controls (temperature, modalità, setpoint stanze)',
      'CLAUDE.md ottimizzato: pattern generici OAuth riutilizzabili, rimossi dettagli specifici implementazione',
    ],
  },
  {
    version: '1.5.7',
    date: '2025-10-15',
    type: 'patch',
    changes: [
      'Sistema rilevamento errori esteso: database 23 codici errore Thermorossi con severità (INFO/WARNING/ERROR/CRITICAL)',
      'Suggerimenti risoluzione automatici per ogni codice errore nel database ERROR_CODES',
      'Badge errore pulsante nel display status: animazione pulse rosso con blur effect per massima visibilità',
      'ErrorAlert migliorato: box suggerimenti glassmorphism + pulsante "Vedi Storico Errori"',
      'Pagina debug (/debug): monitoraggio real-time API con auto-refresh 3s, visualizzazione parametri completi',
      'Documentazione ERRORS-DETECTION.md: guida completa 23 codici errore, troubleshooting, best practices',
    ],
  },
  {
    version: '1.5.6',
    date: '2025-10-15',
    type: 'patch',
    changes: [
      'Test suite completa: 288 test (+169 nuovi) per services critici (schedulerService, maintenanceService, changelogService, errorMonitor, logService, stoveApi)',
      'Coverage migliorato: 4 services con 100% coverage (stoveApi, logService, errorMonitor 97%, changelogService 92%)',
      'Jest configurato con @testing-library/react 16.3 per unit test componenti UI e services',
      'README-TESTING.md: documentazione completa testing workflow, best practices, troubleshooting',
      'CLAUDE.md aggiornato: sezione Testing & Quality Assurance con pattern generali riutilizzabili',
    ],
  },
  {
    version: '1.5.5',
    date: '2025-10-10',
    type: 'patch',
    changes: [
      'UI consolidata: CronHealthBanner integrato dentro card "Stato Stufa" con variante inline compatta',
      'Nuovo pattern componenti: supporto varianti multiple (banner/inline) per flessibilità layout',
      'Layout home ottimizzato: tutte le info stufa (status, modalità, cron health, manutenzione) in unica card',
      'Design coerente: styling inline warning simile a Mode Indicator per consistenza visiva',
      'CLAUDE.md aggiornato: documentazione Sistema Monitoring Cronjob riflette nuova integrazione UI',
    ],
  },
  {
    version: '1.5.4',
    date: '2025-10-10',
    type: 'patch',
    changes: [
      'CLAUDE.md aggiornato: Stack tecnologico corretto (React 18 → React 19.2, Next.js 15 → 15.5.4)',
      'Documentazione allineata con librerie installate effettivamente',
      'Verificato che app già ottimizzata per React 19 e Next.js 15 (no modifiche codice necessarie)',
      'Package.json: versioni React esplicitate correttamente (^19.2.0)',
    ],
  },
  {
    version: '1.5.3',
    date: '2025-10-10',
    type: 'patch',
    changes: [
      'Aggiornamento dipendenze npm: React 19.1.1 → 19.2.0, Firebase 11.10.0 → 12.4.0, ESLint 9.36.0 → 9.37.0',
      'Aggiornate dipendenze dev: autoprefixer, postcss',
      'Auth0 mantenuto a 3.8.0 (v4.x ha breaking changes estesi, upgrade rimandato)',
      'Build production verificato con successo dopo tutti gli aggiornamenti',
      'Nessuna vulnerabilità di sicurezza (npm audit clean)',
    ],
  },
  {
    version: '1.5.2',
    date: '2025-10-10',
    type: 'patch',
    changes: [
      'UI consolidata: MaintenanceBar integrato dentro card "Stato Stufa" per ridurre frammentazione UI',
      'Separator "Stato Manutenzione" tra sezione Modalità Controllo e MaintenanceBar',
      'Styling ottimizzato: background più leggero (bg-white/40) per integrazione visiva con card principale',
      'Rimosso link "Vai alle Impostazioni" ridondante (già accessibile da Navbar)',
      'Ridotto max-height collapse animation (200px → 150px) dopo rimozione link',
      'Home page più pulita con tutte le info stufa consolidate in un\'unica card',
    ],
  },
  {
    version: '1.5.1',
    date: '2025-10-10',
    type: 'patch',
    changes: [
      'MaintenanceBar: implementato collapse/expand intelligente con localStorage per risparmio spazio UI',
      'Auto-expand automatico SOLO prima volta quando utilizzo ≥80% (warning visivo)',
      'Preferenza utente persistente: chiusura manuale rispettata anche dopo reload',
      'Badge percentuale e info ore nascoste quando banner espanso (eliminata duplicazione dati)',
      'Animazione collapse smooth con transizione max-height + opacity (300ms)',
      'Fix: auto-expand non più ignora chiusura manuale utente durante polling 5s',
    ],
  },
  {
    version: '1.5.0',
    date: '2025-10-10',
    type: 'minor',
    changes: [
      'Design System completo: palette colori estese 50-900 per tutti i colori semantici (success, warning, info, danger)',
      'Nomenclatura colori uniformata: gray-* → neutral-* in tutta l\'applicazione',
      'Background globale consistente: rimossi override custom arancioni dalle pagine maintenance e not-found',
      'Card styling standardizzato: p-6 default, p-8 per hero sections, glass effect per header importanti',
      'Info card con palette semantiche corrette: bg-info-50 border-info-200 (non più bg-blue-50)',
      'Alias "danger" aggiunto a tailwind.config.js per compatibilità componenti',
      'Migliorata consistenza UI/UX tra tutte le pagine dell\'applicazione',
    ],
  },
  {
    version: '1.4.9',
    date: '2025-10-10',
    type: 'patch',
    changes: [
      'Formato orario HH:MM per ore manutenzione: visualizzazione ore utilizzo/target/rimanenti ora in formato ore:minuti',
      'Utility formatHoursToHHMM() in lib/formatUtils.js per conversione ore decimali → HH:MM',
      'MaintenanceBar e pagina /maintenance aggiornate con nuovo formato (es. 47.5h → 47:30)',
      'Pagina 404 personalizzata (app/not-found.js) richiesta da Next.js 15',
    ],
  },
  {
    version: '1.4.8',
    date: '2025-10-09',
    type: 'patch',
    changes: [
      'Pagina manutenzione: aggiunto pulsante reset contatore con modal di conferma',
      'Modal conferma reset: backdrop blur con escape key e dettaglio effetti operazione',
      'Reset manutenzione disponibile anche da /maintenance oltre che da banner home',
    ],
  },
  {
    version: '1.4.7',
    date: '2025-10-09',
    type: 'patch',
    changes: [
      'Sistema monitoring cronjob: salvataggio timestamp su Firebase ad ogni chiamata (cronHealth/lastCall)',
      'Banner component riutilizzabile con 4 varianti (info, warning, error, success)',
      'CronHealthBanner: alert automatico se cron inattivo >5min con link diretto per riavvio',
      'Refactoring completo banner: ErrorAlert, banner pulizia, CronHealthBanner ora uniformi',
      'Banner dismissibile con supporto icone custom, azioni e contenuto personalizzato',
      'Schema Firebase esteso con cronHealth per monitoring affidabilità scheduler',
    ],
  },
  {
    version: '1.4.6',
    date: '2025-10-08',
    type: 'patch',
    changes: [
      'CSS Modules: modularizzazione globals.css per ridurre bundle size',
      'Creato MaintenanceBar.module.css con animazione shimmer (prima in globals.css)',
      'globals.css ridotto da 27 a 13 righe (-52%) rimuovendo CSS non globale',
      'Animazione shimmer caricata solo quando MaintenanceBar è renderizzato',
      'Best practice: CSS specifico di componente ora in CSS Modules, non in globals.css',
    ],
  },
  {
    version: '1.4.5',
    date: '2025-10-08',
    type: 'minor',
    changes: [
      'Sistema manutenzione stufa: tracking automatico ore utilizzo H24 (anche app chiusa)',
      'Pagina /maintenance per configurazione ore target pulizia (default 50h)',
      'Barra progresso visiva con colori dinamici e animazione shimmer ≥80%',
      'Banner bloccante quando manutenzione richiesta con conferma pulizia',
      'Blocco automatico accensione (manuale e scheduler) quando pulizia necessaria',
      'Tracking server-side via cron job: calcolo tempo reale da lastUpdatedAt Firebase',
      'Log automatico pulizia stufa con ore totali nel Firebase log',
      'MaintenanceBar component sempre visibile in home con link a configurazione',
      'UserProvider Auth0 aggiunto a ClientProviders per supporto useUser hook',
    ],
  },
  {
    version: '1.4.4',
    date: '2025-10-07',
    type: 'patch',
    changes: [
      'Changelog: aggiunto ordinamento semantico per versione (MAJOR.MINOR.PATCH)',
      'Risolto problema ordinamento quando più versioni hanno stessa data',
      'Funzione sortVersions() nella pagina changelog per corretto ordinamento decrescente',
    ],
  },
  {
    version: '1.4.3',
    date: '2025-10-07',
    type: 'patch',
    changes: [
      'Version enforcement: disabilitata modal bloccante in ambiente locale (dev)',
      'Version enforcement: modal bloccante solo se versione locale < Firebase (semantic comparison)',
      'Funzione compareVersions() per confronto semantico MAJOR.MINOR.PATCH',
      'Funzione isLocalEnvironment() per detection ambiente sviluppo',
      'Migliorata UX sviluppatori: no interruzioni durante development',
    ],
  },
  {
    version: '1.4.2',
    date: '2025-10-07',
    type: 'patch',
    changes: [
      'Navbar: aggiunto dropdown utente per miglior gestione viewport intermedi',
      'Navbar: logout spostato nel menu dropdown utente con info complete (nome + email)',
      'Navbar: ottimizzazione spazio header con responsive text truncation',
      'Navbar: gestione click outside, escape key e chiusura automatica al cambio route per dropdown',
    ],
  },
  {
    version: '1.4.1',
    date: '2025-10-07',
    type: 'patch',
    changes: [
      'Fix build error: aggiunto dynamic rendering a /api/admin/sync-changelog route',
      'Risolto "Cannot find module for page" error durante build production',
      'Migliorata compatibilità Firebase Client SDK con Next.js build process',
    ],
  },
  {
    version: '1.4.0',
    date: '2025-10-06',
    type: 'minor',
    changes: [
      'VersionContext per gestione globale stato versioning con check on-demand',
      'Check versione integrato nel polling status stufa (ogni 5s invece di 60s)',
      'ClientProviders wrapper per context React in layout Server Component',
      'Rimosso useVersionEnforcement hook autonomo (ora VersionContext + useVersion)',
      'Performance: un solo Firebase read invece di due polling separati',
      'UX: rilevamento aggiornamenti 12x più veloce (5s vs 60s)',
    ],
  },
  {
    version: '1.3.4',
    date: '2025-10-06',
    type: 'patch',
    changes: [
      'Card regolazioni (ventola e potenza) ora nascosta quando stufa spenta',
      'Layout home più pulito con grid adattivo a singola colonna quando necessario',
      'Rimosso alert e controlli disabilitati per esperienza utente migliorata',
    ],
  },
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
