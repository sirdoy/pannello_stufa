# Changelog

Tutte le modifiche importanti a questo progetto verranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/),
e questo progetto aderisce al [Versionamento Semantico](https://semver.org/lang/it/).

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
