# Changelog

Tutte le modifiche importanti a questo progetto verranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/),
e questo progetto aderisce al [Versionamento Semantico](https://semver.org/lang/it/).

## [1.5.2] - 2025-10-10

### Modificato
- **UI consolidata**: MaintenanceBar integrato dentro card principale "Stato Stufa" per ridurre frammentazione visiva
- **Layout home ottimizzato**: tutte le informazioni stato stufa (status, modalità, manutenzione) ora in un'unica card
- **Separator dedicato**: aggiunta sezione "Stato Manutenzione" con separator consistente tra Modalità Controllo e MaintenanceBar
- **Styling integrato**: background più leggero (`bg-white/40` vs `bg-white/70`) per migliore integrazione visiva con card principale
- **Animazione collapse**: ridotto `max-height` da 200px a 150px dopo rimozione link settings

### Rimosso
- Link "Vai alle Impostazioni" dal MaintenanceBar espanso (già disponibile nel menu Navbar principale)
- Import `Link` non utilizzato in `MaintenanceBar.js`

### Tecnico
- `StovePanel.js` (StovePanel.js:470-485): MaintenanceBar ora renderizzato dentro card con conditional separator
- `MaintenanceBar.js` (MaintenanceBar.js:78): styling aggiornato per integrazione visiva
- `MaintenanceBar.module.css` (MaintenanceBar.module.css:24): max-height collapse ridotto a 150px

## [1.5.1] - 2025-10-10

### Modificato
- **MaintenanceBar collapse/expand**: banner manutenzione home ora a scomparsa per ottimizzazione spazio UI
  - Collapsed by default: mini-bar compatta con badge percentuale colorato + info ore (desktop)
  - Expand on-demand: click per dettagli completi (progress bar + ore rimanenti + link settings)
  - Auto-expand intelligente: apertura automatica SOLO prima volta quando utilizzo ≥80% (warning visivo)
  - Persistenza localStorage: preferenza utente rispettata tra reload e polling

### Corretto
- Auto-expand non più ignora chiusura manuale: fix logica prioritaria in `useEffect` (savedState priorità massima)
- Eliminata duplicazione dati: badge e info ore nascoste quando banner espanso
- Polling 5s non forza più riapertura banner dopo chiusura manuale utente

### Tecnico
- Pattern collapse/expand: CSS Modules con animazione `max-height + opacity` (300ms ease-in/out)
- Logica prioritaria localStorage: `'false'` (max) → `'true'` (alta) → `null + percentage ≥80%` (bassa)
- Conditional rendering responsive: `{!isExpanded && <Badge />}` per evitare duplicazioni

## [1.5.0] - 2025-10-10

### Aggiunto
- **Design System completo**: palette colori semantici estese con scala 50-900 per tutti i colori (success, warning, info, danger)
- Alias `danger` in `tailwind.config.js` per compatibilità componenti che usano nomenclatura "danger" (punta a palette primary)
- Sezione **Design System** in CLAUDE.md con guidelines colori, spacing e nomenclature per sviluppi futuri

### Modificato
- **Nomenclatura colori uniformata**: `gray-*` → `neutral-*` in tutta l'applicazione per consistenza
  - MaintenanceBar: 3 occorrenze aggiornate
  - Pagina maintenance: 12 occorrenze aggiornate
  - Pagina not-found: 2 occorrenze aggiornate
- **Background globale consistente**: rimossi override custom arancioni (`from-orange-50 via-red-50 to-orange-100`) dalle pagine `/maintenance` e `/not-found`
- **Card styling standardizzato**: definito pattern chiaro per padding e styling
  - `p-6`: padding standard per tutte le card
  - `p-8`: padding aumentato per hero sections (es. StovePanel main card)
  - `glass` prop: per header importanti con effetto glassmorphism
  - `bg-{color}-50 border-2 border-{color}-200`: pattern per info card colorate
- Info card manutenzione: `bg-blue-50 border-blue-200` → `bg-info-50 border-2 border-info-200` (palette semantica corretta)
- Changelog header: da custom gradient a glass effect standard con layout responsive migliorato
- Log page: titolo aggiornato con emoji e font bold per consistenza con altre pagine

### Tecnico
- Palette colori Tailwind complete: success (10 tonalità), warning (10 tonalità), info (10 tonalità), danger (10 tonalità)
- Best practices UI/UX documentate in CLAUDE.md per riferimento futuro sviluppi
- Build production verificata con successo dopo tutte le modifiche

## [1.4.9] - 2025-10-10

### Modificato
- **Formato orario HH:MM per manutenzione**: ore utilizzo, target e rimanenti ora visualizzate in formato ore:minuti
  - Esempio: `47.5h` → `47:30`, `2.5h rimanenti` → `2:30 rimanenti`
  - MaintenanceBar home e card pagina /maintenance aggiornate
- Pagina 404 personalizzata (`app/not-found.js`) con design glassmorphism consistente

### Aggiunto
- Utility `formatHoursToHHMM()` in `lib/formatUtils.js` per conversione ore decimali → formato HH:MM
  - Gestisce edge cases (null, undefined, arrotondamento 60 minuti)
  - Riutilizzabile per altre feature future

### Tecnico
- Pattern utility functions: file dedicato `lib/formatUtils.js` per helper generici
- Next.js 15: aggiunta pagina `not-found.js` richiesta dal framework

## [1.4.8] - 2025-10-09

### Aggiunto
- **Pulsante reset manutenzione**: pagina `/maintenance` ora include pulsante "Azzera Contatore Manutenzione"
- **Modal conferma reset**: confirmation modal con backdrop blur, warning dettagliato effetti operazione
  - Chiusura con tasto Escape
  - Disabilitato quando contatore già a 0
  - Feedback visivo durante reset (loading state)
- Reset manutenzione ora disponibile sia da banner home che da pagina configurazione

### Tecnico
- Pattern confirmation modal: `fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000]`
- Gestione stati: `showResetConfirm`, `isResetting`
- Chiamata `confirmCleaning(user)` da `maintenanceService.js`

## [1.4.7] - 2025-10-09

### Aggiunto
- **Sistema monitoring cronjob**: endpoint `/api/scheduler/check` ora salva timestamp su Firebase (`cronHealth/lastCall`) ad ogni chiamata
- **Componente `Banner` riutilizzabile**: componente UI unificato con 4 varianti (info, warning, error, success)
- **CronHealthBanner**: alert automatico in home se cronjob non eseguito da più di 5 minuti
  - Monitoraggio realtime Firebase su `cronHealth/lastCall`
  - Check automatico ogni 30 secondi client-side
  - Link diretto a console.cron-job.org per riavvio immediato
  - Auto-hide quando cron riprende a funzionare
- Schema Firebase `cronHealth/lastCall` per tracking affidabilità scheduler
- Props componente `Banner`: `variant`, `icon`, `title`, `description`, `actions`, `dismissible`, `onDismiss`, `children`

### Modificato
- **Refactoring completo banner UI**: tutti i banner ora utilizzano componente `Banner` unificato
  - `CronHealthBanner`: da Card custom a Banner variant="warning"
  - Banner pulizia stufa in `StovePanel`: da Card custom a Banner variant="warning"
  - `ErrorAlert`: refactoring completo con mapping dinamico severity → variant
- `/api/scheduler/check`: aggiunto salvataggio timestamp `cronHealth/lastCall` all'inizio dell'esecuzione (dopo auth check)
- `StovePanel.js`: integrato `CronHealthBanner` sopra MaintenanceBar

### Tecnico
- Pattern Banner component: supporto `React.ReactNode` per `description` e `actions` (permette JSX inline)
- Responsive design: breakpoint sm per layout mobile/desktop
- Glassmorphism style consistente con resto dell'app
- Console log: "✅ Cron health updated: {timestamp}" ad ogni chiamata cron

## [1.4.6] - 2025-10-08

### Modificato
- **CSS Modules**: modularizzazione `globals.css` per ridurre bundle size e migliorare organizzazione
- Creato `app/components/MaintenanceBar.module.css` con animazione shimmer (precedentemente in globals.css)
- `globals.css` ridotto da 27 a 13 righe (-52%) rimuovendo CSS non globale
- Animazione shimmer ora caricata solo quando componente `MaintenanceBar` è renderizzato
- Best practice: CSS specifico di componente ora in CSS Modules (`.module.css`), non in `globals.css`

### Tecnico
- Pattern CSS Modules Next.js: `import styles from './Component.module.css'` + `className={styles.shimmer}`
- Code splitting CSS: animazioni e stili componente-specifici ora caricati on-demand
- Separazione chiara: `globals.css` solo per base Tailwind + stili veramente globali (html/body)

## [1.4.5] - 2025-10-08

### Aggiunto
- **Sistema manutenzione stufa completo** con tracking automatico ore utilizzo H24 (funziona anche se app chiusa)
- Pagina `/maintenance` per configurazione ore target pulizia con default 50h e preselezioni rapide (25/50/75/100/150/200h)
- `lib/maintenanceService.js`: servizio completo per gestione manutenzione con funzioni Firebase
  - `getMaintenanceData()`: recupera dati manutenzione
  - `updateTargetHours()`: aggiorna ore target configurazione
  - `trackUsageHours()`: tracking automatico server-side via cron (calcolo tempo reale da lastUpdatedAt)
  - `confirmCleaning()`: reset contatore con log automatico su Firebase
  - `canIgnite()`: verifica se accensione consentita
  - `getMaintenanceStatus()`: status completo con percentuale e ore rimanenti
- Componente `MaintenanceBar`: barra progresso lineare sempre visibile in home con:
  - Colori dinamici (verde → giallo → arancione → rosso)
  - Animazione shimmer quando utilizzo ≥80%
  - Link diretto a `/maintenance`
- Banner bloccante in home quando pulizia richiesta con pulsante conferma "Ho Pulito la Stufa"
- Blocco automatico accensione (manuale e scheduler) quando `needsCleaning=true`
- Schema Firebase `maintenance/` con `currentHours`, `targetHours`, `lastCleanedAt`, `needsCleaning`, `lastUpdatedAt`
- Tracking integrato in `/api/scheduler/check`: chiamata `trackUsageHours()` ogni minuto quando stufa in status WORK
- Log dettagliati console: "✅ Maintenance tracked: +1.2min → 47.5h total"
- Link "Manutenzione" in Navbar (desktop + mobile) dopo "Pianificazione"

### Modificato
- `StovePanel.js`: rimosso tracking client-side (ora server-side via cron), aggiunto fetch `maintenanceStatus` e banner pulizia
- `/api/stove/ignite`: aggiunto check `canIgnite()` prima accensione, return 403 se manutenzione richiesta
- `/api/scheduler/check`: aggiunto check `canIgnite()` iniziale, skip silenzioso scheduler se manutenzione richiesta
- `ClientProviders.js`: aggiunto `UserProvider` da Auth0 per supporto hook `useUser()` nelle pagine
- Pulsanti Accendi/Spegni e Select Ventola/Potenza ora disabilitati quando `needsMaintenance=true`

### Tecnico
- Tracking autonomo H24: cron calcola tempo trascorso da `lastUpdatedAt` Firebase, non dipende più da app aperta
- Auto-recovery: se cron salta chiamate, prossima esecuzione recupera automaticamente minuti persi
- Accuratezza 100%: contatore si aggiorna sempre, anche se nessuno usa l'app per giorni

## [1.4.4] - 2025-10-07

### Corretto
- Ordinamento changelog nella pagina `/changelog` ora utilizza confronto semantico versioni (MAJOR.MINOR.PATCH)
- Risolto problema quando più versioni hanno la stessa data (es. 1.4.4 > 1.4.3 > 1.4.2 tutte del 2025-10-07)
- Funzione `sortVersions()` nella pagina changelog per ordinamento decrescente corretto

### Modificato
- `changelogService.getChangelogFromFirebase()` ora ordina solo per data
- Ordinamento semantico finale applicato nella pagina changelog per garantire ordine corretto

## [1.4.3] - 2025-10-07

### Modificato
- **Version enforcement**: disabilitata modal bloccante in ambiente locale/development per migliore developer experience
- **Version enforcement**: modal bloccante ora appare SOLO se versione locale è **inferiore** a quella su Firebase (semantic comparison)
- Aggiunta funzione `compareVersions()` per confronto semantico versioni MAJOR.MINOR.PATCH
- Aggiunta funzione `isLocalEnvironment()` per detection ambiente sviluppo (NODE_ENV, localhost, 127.0.0.1, IP privati)
- Migliorata UX sviluppatori: nessuna interruzione durante development su macchina locale

## [1.4.2] - 2025-10-07

### Modificato
- Navbar: aggiunto dropdown utente cliccabile per miglior gestione viewport intermedi (riduce affollamento header)
- Navbar: logout spostato nel menu dropdown utente con sezione info complete (nome + email dell'utente connesso)
- Navbar: ottimizzazione spazio header con responsive text truncation (max-w-[80px] su schermi md-xl, max-w-[120px] su xl+)
- Navbar: gestione completa dropdown (click outside, tasto ESC, chiusura automatica al cambio route)

## [1.4.1] - 2025-10-06

### Corretto
- Fix build error: aggiunto `export const dynamic = 'force-dynamic'` alla route `/api/admin/sync-changelog`
- Risolto "Cannot find module for page: /api/admin/sync-changelog" durante `npm run build`
- Migliorata compatibilità Firebase Client SDK con Next.js build process (evita inizializzazione Firebase durante build-time)

## [1.4.0] - 2025-10-06

### Aggiunto
- **VersionContext**: Context React per gestione globale stato versioning con funzione `checkVersion()` on-demand
- **ClientProviders**: Wrapper componente per provider client-side in layout Server Component
- Hook `useVersion()` per accedere a VersionContext da qualsiasi componente
- Check versione integrato nel polling status stufa (ogni 5 secondi invece di 60)

### Modificato
- `VersionEnforcer` ora usa `VersionContext` invece di hook autonomo
- `StovePanel` chiama `checkVersion()` ogni 5s nel polling status esistente
- Layout root wrappato in `ClientProviders` per context globale
- Performance migliorata: un solo Firebase read invece di due polling separati
- UX migliorata: rilevamento aggiornamenti **12x più veloce** (5s vs 60s)

### Rimosso
- Hook `useVersionEnforcement.js` (sostituito da VersionContext + useVersion)
- Polling autonomo 60 secondi (ora integrato nel polling status)

## [1.3.4] - 2025-10-06

### Modificato
- Card regolazioni (ventola e potenza) ora completamente nascosta quando stufa spenta
- Layout home più pulito con grid adattivo a singola colonna quando necessario
- Esperienza utente migliorata: nessun controllo disabilitato visibile, solo elementi utilizzabili

### Rimosso
- Alert "⚠️ Regolazioni disponibili solo con stufa accesa" (non più necessario con card nascosta)
- Stati disabilitati Select ventola/potenza (ora mostrati solo quando utilizzabili)

## [1.3.3] - 2025-10-06

### Aggiunto
- Design glassmorphism moderno stile iOS 18 per UI ancora più moderna e raffinata
- Componente `Card`: nuova prop opzionale `glass` per effetto vetro smerigliato (`bg-white/70`, `backdrop-blur-xl`)
- Componente `Button`: nuova variante `glass` con trasparenza, blur e bordi luminosi
- Componente `Select`: dropdown automaticamente aggiornato con effetto glassmorphism (`bg-white/90`, `backdrop-blur-xl`)
- Tailwind config: nuove shadow personalizzate (`shadow-glass`, `shadow-glass-lg`, `shadow-inner-glow`)
- Tailwind config: nuovo backdrop-blur utility (`backdrop-blur-xs` = 2px)

### Modificato
- Migliorato design system con effetti trasparenza e blur professionali
- UI più leggera e moderna con separazione visiva elegante

## [1.3.2] - 2025-10-06

### Corretto
- Z-index dropdown componente Select aumentato da `z-50` a `z-[100]` per evitare sovrapposizione con card successive
- Tendine select ora visualizzate correttamente sopra altri elementi della pagina

## [1.3.1] - 2025-10-06

### Modificato
- Modalità semi-manuale ora si attiva **SOLO** da comandi manuali homepage (ignite, shutdown, setPower, setFan con stufa accesa)
- API routes `/api/stove/*` ora richiedono parametro `source` ("manual" o "scheduler") per distinguere origine comando
- Comandi da scheduler cron (`source="scheduler"`) **non** attivano più modalità semi-manuale

### Aggiunto
- Helper `createDateInRomeTimezone()` in `schedulerService.js` per gestione consistente fusi orari
- Verifica stato stufa accesa prima di attivare semi-manual con setPower/setFan
- Parametro `source` in tutti i comandi API stove (ignite, shutdown, setPower, setFan)

### Corretto
- Problema orari scheduler incorretti quando server in timezone diverso da Europe/Rome
- Tutti gli orari scheduler ora gestiti con timezone Europe/Rome e salvataggio UTC consistente
- Attivazione semi-manual non intenzionale da comandi automatici scheduler

## [1.3.0] - 2025-10-04

### Aggiunto
- Sistema controllo versione bloccante con modal forzato aggiornamento
- Hook `useVersionEnforcement` per polling periodico versione Firebase (ogni 60 secondi)
- Componente `ForceUpdateModal` bloccante quando versione locale è diversa da Firebase
- Integrazione `VersionEnforcer` in `layout.js` per controllo globale applicazione
- Prevenzione uso applicazione con versione obsoleta

### Modificato
- Layout principale ora include controllo versione automatico al caricamento

## [1.2.1] - 2025-10-04

### Corretto
- Warning ESLint per export anonimo in `lib/version.js` (ora usa variabile prima dell'export)
- Direttiva `'use client'` mancante in componenti con React hooks
- Componente `DayAccordionItem.js` ora ha direttiva client corretta
- Componente `DayScheduleCard.js` ora ha direttiva client corretta
- Componente `TimeBar.js` now ha direttiva client corretta
- Hook `useVersionCheck.js` ora ha direttiva client corretta

## [1.2.0] - 2025-10-04

### Aggiunto
- Sistema notifiche nuove versioni con badge "NEW" animato nel footer
- Modal "What's New" automatico al primo accesso post-update
- Hook personalizzato `useVersionCheck` per confronto versioni e gestione localStorage
- Badge animato con effetto pulse quando disponibile nuova versione
- Opzione "Non mostrare più" per versioni specifiche
- Chiusura modal con tasto ESC
- Tracking versioni viste tramite localStorage

### Modificato
- Footer ora è client component per supportare notifiche real-time
- Migliorata UX scoperta nuove features con modal visuale

## [1.1.0] - 2025-10-04

### Aggiunto
- Visualizzazione prossimo cambio scheduler in modalità automatica (azione, orario, potenza, ventola)
- Pulsante "Torna in Automatico" in modalità semi-manuale (StovePanel e Scheduler page)
- Nuova funzione `getNextScheduledAction()` in `schedulerService.js` per dettagli cambio scheduler
- Sistema changelog centralizzato con sincronizzazione Firebase
- Pagina dedicata `/changelog` per visualizzare storico versioni
- Link nel footer per accesso rapido ai changelog

### Modificato
- Formato orari unificato: "HH:MM del DD/MM"
- Layout sezione Modalità Controllo migliorato con design responsive
- Sistema di versionamento esteso con salvataggio su Firebase

## [1.0.0] - 2025-10-01

### Aggiunto
- Sistema di controllo completo stufa Thermorossi
- Schedulazione settimanale automatica
- Integrazione Auth0 per autenticazione
- Logging azioni utente su Firebase
- Sistema monitoraggio errori e allarmi
- Integrazione Netatmo per temperatura
- PWA con supporto offline
- Sistema di versioning implementato

---

## Tipi di modifiche

- `Aggiunto` per le nuove funzionalità
- `Modificato` per le modifiche a funzionalità esistenti
- `Deprecato` per funzionalità che saranno rimosse nelle prossime versioni
- `Rimosso` per funzionalità rimosse
- `Corretto` per bug fix
- `Sicurezza` per vulnerabilità corrette
