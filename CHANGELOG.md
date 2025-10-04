# Changelog

Tutte le modifiche importanti a questo progetto verranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/),
e questo progetto aderisce al [Versionamento Semantico](https://semver.org/lang/it/).

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
