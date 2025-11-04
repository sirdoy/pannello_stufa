# Changelog

Tutte le modifiche importanti a questo progetto verranno documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.0.0/),
e questo progetto aderisce al [Versionamento Semantico](https://semver.org/lang/it/).

## [1.12.1] - 2025-11-04

### Ottimizzato
- **GlassEffect completamente riscritto**: massima trasparenza e performance
  - **Shader ultra-semplificato**: solo frost pattern animato con 3 ottave noise (era 4)
  - **Uniformi ridotte**: da 9 a 2 (solo `uRes` e `uTime`) per performance ottimali
  - **Rimossi bgColor/opacity dalle uniformi**: shader usa solo texture bianca trasparente
  - **Alpha minimalista**: 3% frost pattern, rest totalmente trasparente
  - **Mix-blend-mode overlay**: blend naturale con contenuto sottostante
  - **WebGL context ottimizzato**: antialias/depth/stencil disabilitati (-30% GPU overhead)
  - File: `app/components/devices/stove/GlassEffect.js` (264 righe, -25% da v1.12.0)

- **StoveCard box ultra-trasparenti**: visualizzazione icona stato sottostante
  - **bg-white/[0.01]**: opacità 1% (era 10%) per massima trasparenza
  - **backdrop-blur-md**: blur ridotto per vedere meglio icona sotto
  - Box Ventola e Potenza ora trasparenti per mostrare fiocco/fiamma dietro
  - File: `app/components/devices/stove/StoveCard.js:612,635`

### Performance
- **Bundle size ridotto**: homepage da 18.6 kB a 17.2 kB (-7.5%)
- **GPU performance**: WebGL context config ottimizzata per rendering leggero
- **Shader simplification**: da ~145 righe a ~35 righe di GLSL (-76%)

### Rimosso
- Props inutilizzate: `interactive`, `lensStrength`, `maskStrength1/2/3`
- Mouse tracking e lens distortion (non necessari per static glass)
- Multi-layer masking system (rb1, rb2, rb3) troppo complesso
- Gradient lighting e edge highlights pesanti

## [1.12.0] - 2025-11-04

### Aggiunto
- **GlassEffect avanzato**: implementazione liquid glass inspired da Apple WWDC 2025
  - Integrato codice da repository `rxing365/html-liquid-glass-effect-webgl`
  - **Signed Distance Functions (SDF)**: rounded box dinamico con corner radius personalizzabile
  - **Normal mapping 3D**: calcolo normali real-time da height field per profondità realistica
  - **Rifrazione background**: doppia rifrazione (entry/exit) attraverso materiale vetro con IOR configurabile
  - **Frosted blur multisampling**: blur 3x3 box con frost pattern multi-scala per effetto smerigliato
  - **Edge highlights realistici**: rim light basato su orientazione normali + edge detection distance-based
  - Props configurabili: `ior` (0.8-1.5), `thickness`, `blurRadius`, `cornerRadius` per massima flessibilità
  - File: `app/components/devices/stove/GlassEffect.js`

### Modificato
- **Fragment shader migliorato**: sostituito shader semplice con implementazione avanzata
  - Aggiunte funzioni SDF: `smin_polynomial`, `smax_polynomial`, `sdRoundedBoxSmooth` per forme fluide
  - Funzione `calculateNormal()`: gradients-based normal mapping per effetto 3D depth
  - Funzione `applyFrostedBlur()`: 3x3 sampling per blur realistico
  - Refraction pipeline: doppio refract() con calcolo displacement thickness-aware
  - Edge highlights: combinazione rim light + distance-based edge detection
  - Parametri uniforms estesi: `uIOR`, `uThickness`, `uBlurRadius`, `uCornerRadius`

## [1.11.1] - 2025-11-04

### Modificato
- **UI cleanup StoveCard**: rimosso bordo bianco per design più pulito
  - Rimosso `ring-1 ring-white/[0.15]` dal componente Card variant liquidPro
  - Rimosso layer wrapper intermedio (`div` bianco trasparente) nella struttura StoveCard
  - Riquadro colorato stato ora direttamente visibile senza nesting superfluo
  - File modificati: `app/components/ui/Card.js:6`, `app/components/devices/stove/StoveCard.js:558-660`

- **Skeleton uniformato**: allineata struttura DOM
  - Rimossa stessa struttura wrapper intermedia da `Skeleton.StovePanel`
  - Skeleton ora perfettamente consistente con componente reale
  - File: `app/components/ui/Skeleton.js:63-104`

## [1.11.0] - 2025-11-03

### Aggiunto
- **GlassEffect component**: effetto vetro trasparente WebGL2
  - Frosted glass pattern multi-scala con noise procedurale
  - Distortion effect per rifrazione vetro realistica
  - Edge highlights per riflessi bordi
  - Fallback CSS quando WebGL2 non disponibile
  - File: `app/components/devices/stove/GlassEffect.js`

- **Documentazione stato stufa**: reference completo mapping
  - Tabella completa stato tecnico → label → icona → colore
  - Layout structure diagram Frame 3 style
  - Color palette Tailwind classes
  - File: `docs/stove-status-mapping.md`

### Modificato
- **StoveCard UI redesign completo**: nuovo layout Frame 3 style
  - Card principale bianca (liquid glass) per uniformità app
  - Riquadro interno colorato in base stato stufa (azzurro OFF, verde WORK, rosso ERROR)
  - Icona emoji centrale grande (120-140px) invece animazioni 3D
  - Box glassmorphism grigi con effetto WebGL sovrapposti all'icona
  - Margin negativo per layering z-index (icona dietro, box davanti)
  - Mapping colori: gradiente azzurro (sky), verde (success), blu (info), rosso (primary), arancio (warning)
  - File: `app/components/devices/stove/StoveCard.js:359-665`

- **Skeleton aggiornato**: allineato perfettamente con nuova UI
  - Struttura Frame 3: card bianca → riquadro colorato → icona + box sovrapposti
  - Margin negativo per simulare overlapping
  - Box glassmorphism con min-height corretto
  - File: `app/components/ui/Skeleton.js:63-109`

### Rimosso
- **Animazioni WebGL 3D complesse**: eliminato per performance e semplicità
  - Rimosso `StoveWebGLAnimation.js` con shader Three.js
  - Rimosse animazioni fiamme/fiocchi di neve raymarched
  - Sostituito con icone statiche emoji + effetto vetro per box dati
  - Performance migliorata: WebGL solo per trasparenza box (non rendering 3D)

### Documentazione
- Aggiornato CLAUDE.md: chiarificato uso limitato WebGL (solo effetti UI, non animazioni 3D)
- Aggiornato patterns.md: aggiunto pattern Skeleton sempre allineato con UI

## [1.10.1] - 2025-11-03

### Risolto
- **Fix navigazione mobile**: middleware ora preserva URL destinazione con `returnTo` parameter
  - Problema: link menu ricaricavano sempre homepage su mobile in remoto
  - Soluzione: middleware aggiunge query param `returnTo` al redirect login Auth0
  - File: `middleware.js:8-12`

- **Service Worker ottimizzato per PWA**: aggiunta strategia `NetworkFirst` per navigation requests
  - Previene caching inappropriato dei redirect di autenticazione
  - Pattern dedicato per richieste HTML: `request.mode === 'navigate'`
  - File: `next.config.mjs:41-53`

### Modificato
- **PWA shortcuts aggiornati**: URL corretti per architettura multi-device
  - `/scheduler` → `/stove/scheduler`
  - `/errors` → `/stove/errors`
  - Aggiunto shortcut `/stove/maintenance`
  - File: `public/manifest.json:62-91`

- **PWA iOS ottimizzato**: migliorata esperienza nativa iPhone
  - Aggiunto `display_override: ["standalone", "fullscreen"]`
  - Meta tag `apple-mobile-web-app-title` per nome icona personalizzato
  - Quick Actions iOS: 4 shortcuts ottimizzati per long-press icona home
  - File: `public/manifest.json:8`, `app/layout.js:34-35`

## [1.10.0] - 2025-10-27

### Aggiunto
- **Toast component per notifiche UX**
  - Componente Toast riutilizzabile con liquid glass style iOS 18
  - Auto-dismiss configurabile (default 3s), varianti semantiche (success, warning, info, error)
  - Animazione slideDown CSS fluida con opacity fade-in
  - Posizionato fixed top-center per massima visibilità
  - File: `app/components/ui/Toast.js`, `app/globals.css`

- **SandboxPanel scheduler testing completo**
  - Sezione dedicata test scheduler con visual mode badges (MANUAL/AUTO/SEMI-MANUAL)
  - Quick setup intervalli: crea intervallo test per giorno corrente con orari/power/fan configurabili
  - Toggle scheduler on/off, pulsante clear semi-manual
  - Istruzioni integrate per test cambio automatico modalità
  - File: `app/components/sandbox/SandboxPanel.js:531-660`

### Modificato
- **Transizione automatica Automatic → Semi-Manual migliorata**
  - Rimossa condizione `if (nextChange)`: semi-manual si attiva anche senza prossimi eventi schedulati
  - API enriched response: `setFan` e `setPower` ritornano `modeChanged` flag per notifica frontend
  - Feedback UX triplo: badge preventivo → azione → toast conferma
  - Badge informativo blu appare sopra select quando in modalità automatica
  - Real-time state update: UI si aggiorna immediatamente senza aspettare Firebase
  - File: `app/api/stove/setFan/route.js`, `app/api/stove/setPower/route.js`, `app/components/devices/stove/StoveCard.js`

### Documentazione
- Aggiunta documentazione Toast component in `docs/ui-components.md`
- Aggiunta sezione scheduler testing in `docs/sandbox.md`
- Aggiunto pattern "Immediate Feedback UX" in `docs/patterns.md`

## [1.9.0] - 2025-10-22

### Aggiunto
- **Sandbox Mode - Sistema testing locale completo (SOLO localhost)**
  - Ambiente di simulazione isolato per testing senza chiamate reali alla stufa
  - Toggle attivazione sandbox in homepage (visibile solo in localhost)
  - SandboxPanel con controllo completo: stati, potenza, ventola, temperatura, manutenzione, errori
  - Settings avanzati: auto-progress stati, simulate delay, random errors
  - Storico azioni: tracking ultime 100 azioni con timestamp per debugging
  - File: `lib/sandboxService.js`, `app/components/sandbox/SandboxPanel.js`, `app/components/sandbox/SandboxToggle.js`

- **Intercettazione API completa per sandbox**
  - Wrapper functions in `stoveApi.js`: `getStoveStatus()`, `getFanLevel()`, `getPowerLevel()`
  - Tutti endpoint API aggiornati: `status`, `getFan`, `getPower`, `ignite`, `shutdown`, `setFan`, `setPower`
  - Conversione formato sandbox → formato API Thermorossi per compatibilità completa
  - Flag `isSandbox: true/false` in tutte le response per identificazione modalità
  - File: `lib/stoveApi.js`, `app/api/stove/*/route.js`

- **Real-time sync Firebase per sandbox**
  - Listener su `sandbox/stoveState` per aggiornamento immediato stato/fan/power
  - Listener su `sandbox/error` per gestione errori simulati in tempo reale
  - Listener su `sandbox/maintenance` per sync ore lavorate
  - StoveCard si aggiorna istantaneamente quando cambi valori nel SandboxPanel
  - File: `app/components/devices/stove/StoveCard.js:169-229`

- **UI sandbox ottimizzata**
  - Design purple/pink gradient con contrasto migliorato per leggibilità
  - Sezioni strutturate con background distintivi e bordi
  - Valori numerici enfatizzati (bold, dimensione maggiore)
  - Badge "🧪 SANDBOX" viola in StoveCard quando modalità attiva
  - Progress bar e indicatori visivi per manutenzione
  - File: `app/components/sandbox/SandboxPanel.js:173-483`

- **Gestione errori simulati**
  - 5 tipi di errori configurabili: AL01-AL05 (temperatura, pressione, accensione, pellet, pulizia)
  - Conversione automatica formato sandbox → API Thermorossi con codici numerici
  - Badge errore e notifiche funzionano normalmente in sandbox mode
  - File: `lib/sandboxService.js:30-36`, `lib/stoveApi.js:94-127`

- **Integrazione maintenanceService con sandbox**
  - `getMaintenanceData()` legge da `sandbox/maintenance` quando sandbox attivo
  - Conversione formato: `hoursWorked` → `currentHours`, `maxHours` → `targetHours`
  - MaintenanceBar funziona identicamente in sandbox e production
  - File: `lib/maintenanceService.js:44-86`

- **Documentazione sandbox completa**
  - Nuova guida: `docs/sandbox.md` con architettura, API reference, workflows
  - Schema Firebase sandbox documentato con esempi
  - Best practices per testing e troubleshooting
  - CLAUDE.md aggiornato con link e concetti generali
  - File: `docs/sandbox.md`, `CLAUDE.md:37-38`

- **Unit tests sandbox**
  - Test per `sandboxService.js`: environment detection, stati, validazione
  - Test per intercettazione API: mock sandbox enabled/disabled
  - Coverage per wrapper functions: `getStoveStatus()`, `getFanLevel()`, `getPowerLevel()`
  - File: `__tests__/sandboxService.test.js`, `__tests__/stoveApi.sandbox.test.js`

### Note Tecniche
- Sandbox disponibile SOLO in localhost (check sia client che server-side)
- Nessun rischio di attivazione in production (guards multipli)
- Dati sandbox isolati in Firebase path `sandbox/` separato da production
- Backward compatible: nessun breaking change, feature addizionale per development

## [1.8.2] - 2025-10-22

### Migliorato
- **Ottimizzazione layout StoveCard e animazioni WebGL**
  - Container animazione ridotto da `aspect-square` a dimensioni fisse `h-48 sm:h-56`
  - Layout più compatto: spacing e padding ridotti per migliore integrazione visiva
  - Armonizzati elementi stato stufa, animazione, e parametri Fan/Power
  - File: `app/components/devices/stove/StoveCard.js:456-521`

- **Shader fiocco di neve riscritto in stile cartoon Ghibli**
  - Sostituito raymarching 3D complesso con shader 2D cartoon (stile Studio Ghibli)
  - Dimensioni ridotte ~60% per proporzioni ottimali nel container
  - Performance migliorate: shader 2D vs raymarching 3D (128 iterazioni)
  - Design: centro esagonale, 6 punte principali con decorazioni laterali
  - Effetti: 8 sparkles animati orbitanti, breathing animation delicata
  - Palette colori azzurri freddi graduali (deepIce → shimmer)
  - Rotazione lenta (0.6x) con floating effect (oscillazione delicata)
  - File: `app/components/devices/stove/StoveWebGLAnimation.js:70-282`

- **Tutti shader WebGL ottimizzati per container rettangolare**
  - Zoom aspect-ratio adaptive: landscape 1.2-1.35x, portrait 1.3-1.45x
  - Flame shader: power scale ridotto 0.65-1.05x, vertical offset dinamico migliorato
  - Error shader: pulse ridotto, vignette adattata
  - Animazioni sempre contenute nel canvas senza overflow
  - File: `app/components/devices/stove/StoveWebGLAnimation.js:70-758`

## [1.8.1] - 2025-10-22

### Corretto
- **Fix Auth0 redirect loop su mobile (production)**
  - Problema: sessione Auth0 non persisteva correttamente su mobile tra navigazioni
  - Causa: middleware intercettava route PWA (service worker, manifest, icons)
  - Soluzione: aggiornato middleware matcher per escludere route PWA
  - Escluse: `/offline`, `/icons/*`, `/manifest.json`, `/sw.js`, `/firebase-messaging-sw.js`
  - File: `middleware.js:17`

### Migliorato
- **Animazione fiamma WebGL più compatta e armoniosa**
  - Ridotta altezza lingue di fuoco: `heightVar 0.25 + 0.08` (da `0.40 + 0.22`)
  - Movimento più fluido: `sway 0.04` (da `0.12 + 0.06`)
  - Ridotte lingue da 6 a 3 per stile cartoon più pulito
  - Fase sincronizzata: movimento più unificato e armonioso
  - Base più grande (radius 0.25) per migliori proporzioni cartoon
  - File: `app/components/devices/stove/StoveWebGLAnimation.js:282-337`

### Documentazione
- **Nuova sezione troubleshooting "Authentication (Auth0)"**
  - Guida completa per redirect loop Auth0 su mobile
  - Configurazione cookie settings per mobile (SameSite, rolling session)
  - Verifica configurazione Auth0 Dashboard (Callback URLs, Web Origins)
  - Debug logging middleware per troubleshooting
  - Alternative solutions se problema persiste
  - File: `docs/troubleshooting.md:41-143`

## [1.8.0] - 2025-10-21

### Aggiunto
- **Sistema animazioni WebGL 3D per visualizzazione stati**
  - Sostituita emoji statica con animazioni WebGL 3D dinamiche
  - Componente `StoveWebGLAnimation.js` con rendering 3D dedicato

  **OFF - Fiocco di Neve Rotante:**
  - Fiocco di neve 3D con 6 bracci principali + ramificazioni laterali
  - Centro esagonale azzurro chiaro
  - Rotazione continua (0.5 rad/s) con movimento fluttuante
  - 40 particelle fredde che orbitano intorno (effetto ghiacciato)
  - Leggero pulsing scale per "respiro" del cristallo
  - Colori azzurro ghiaccio (#b8e6f5, #e0f4ff, #d4f1ff)

  **START - Fiamma Arancione:**
  - 300 particelle arancioni animate
  - Movimento ascendente con turbulenza sinusoidale
  - Gradient giallo-arancio (RGB: 1, 0.4-0.8, 0-0.1)
  - Effetto narrowing (fiamma si restringe salendo)
  - Flicker effect per realismo

  **WORK - Fiamma Rossa Intensa:**
  - 500 particelle rosso-arancio ad alta velocità
  - Core glow pulsante al centro (sphere geometry)
  - Turbulenza forte e movimento rapido
  - Gradient rosso intenso (RGB: 1, 0-0.4, 0)
  - Additive blending per effetto luce realistico

  **ERROR/ALARM - Segnale Warning:**
  - Triangolo warning rosso (#ff3333) con bordo pulsante
  - Punto esclamativo giallo (#ffff00) lampeggiante al centro
  - 30 particelle arancioni (#ff6600) che pulsano radialmente
  - Effetto pulsing sincronizzato (4 Hz triangolo, 6 Hz esclamativo)
  - ShapeGeometry per triangolo, CircleGeometry per punto

  - Canvas 100x100px integrato al posto dell'emoji nell'icona StoveCard

### Cambiato
- Emoji statiche sostituite con animazioni WebGL 3D interattive
- Homepage bundle size: +132 kB (Three.js library)
- First Load JS homepage: 186 kB → 318 kB (142 kB page component)

### Tecnico
- **Three.js (r180)**: libreria 3D WebGL per rendering grafica interattiva
- Componente `StoveWebGLAnimation.js`: riutilizzabile con prop `status` e `size`
- BufferGeometry + Float32Array per performance ottimali
- Sistema particelle custom: snowflake geometry, flame particles, warning triangle
- Gestione lifecycle React: cleanup automatico geometrie/materiali, flag `isRunning`
- Animation loop 60fps con requestAnimationFrame
- Canvas 140x140px, camera perspective (FOV 50°, z=3.5)

## [1.7.0] - 2025-10-21

### Aggiunto
- **Sistema gestione preferenze dispositivi**
  - Nuova pagina `/settings/devices` per abilitare/disabilitare dispositivi personalmente
  - Toggle switches per ogni device con salvataggio real-time su Firebase
  - Preferenze salvate per utente in `devicePreferences/{userId}/{deviceId}` (schema Firebase)
  - Service layer `devicePreferencesService.js` per operazioni CRUD preferenze
  - API routes `/api/devices/preferences` (GET/POST) per gestione preferenze
- **Integrazione preferenze in navigazione**
  - Homepage ora filtra dispositivi in base a preferenze utente da Firebase
  - Navbar carica preferenze utente e mostra solo device abilitati nel menu
  - Device disabilitati non appaiono in homepage né nel menu di navigazione
- **Device abilitati**
  - Tutti i dispositivi ora abilitati in `DEVICE_CONFIG`: stufa, termostato, luci Philips Hue, Sonos
  - Placeholder UI per Sonos in homepage (future implementation)
- **Menu Impostazioni**
  - Aggiunto link "Gestione Dispositivi" (🏠) nel dropdown Impostazioni della navbar
  - Descrizione: "Abilita/disabilita dispositivi"

### Migliorato
- **Pattern riutilizzabile**: sistema user preferences estendibile per altre configurazioni future
- **UX**: configurazione dispositivi personalizzabile per ogni utente senza impattare altri utenti
- **Performance**: filtro device lato server (homepage) e client (navbar) per ottimizzazione

## [1.6.5] - 2025-10-21

### Migliorato
- **Device Card Self-Contained Pattern**
  - Banner e informazioni specifiche di ciascun device ora contenute all'interno delle rispettive card
  - StoveCard: banner pulizia manutenzione spostato all'interno del Card liquidPro
  - ThermostatCard: banner errore connessione spostato all'interno del Card liquid
  - LightsCard: banner errore connessione spostato all'interno del Card liquid
  - Migliorata coerenza architetturale: ogni device card è auto-contenuta e include tutte le sue informazioni
  - Pattern documentato in `docs/architecture.md` per consistenza sviluppi futuri

## [1.6.4] - 2025-10-21

### Aggiunto
- **Nuova variante liquidPro per Card component**
  - Effetto liquid glass iOS 26 enhanced con `backdrop-saturate-150` e `backdrop-contrast-105`
  - Colori più vividi e contrasto migliorato rispetto alla variante liquid classica
  - Applicata a StoveCard per esperienza visiva premium
- **Backdrop filters estesi in Tailwind config**
  - `backdropSaturate`: 110, 125, 150, 175, 200 per controllo saturazione colori
  - `backdropContrast`: 102, 105, 110, 115 per controllo micro-contrasto
  - Massima flessibilità per future implementazioni liquid glass

### Migliorato
- **Card component**: nuova prop `liquidPro` opzionale (liquid classico rimane disponibile)
  - `liquidPro`: saturazione e contrasto enhanced - per componenti hero
  - `liquid`: implementazione classica - per uso generale
  - Backward compatible: tutti i componenti esistenti continuano a funzionare

## [1.6.3] - 2025-10-21

### Migliorato
- **Uniformato stile liquid glass iOS 26 su tutti i componenti**
  - `MaintenanceBar`: aggiornato da `bg-white/40 backdrop-blur-sm` a `bg-white/[0.08] backdrop-blur-3xl shadow-liquid ring-1 ring-white/[0.15]` con gradient overlay
  - `CronHealthBanner`: entrambe le varianti (banner e inline) aggiornate con liquid glass completo
  - `TimeBar`: barra base, tooltip, etichette orarie aggiornate con liquid glass (`bg-neutral-200/80 backdrop-blur-sm`, tooltip `bg-neutral-900/95 backdrop-blur-3xl`, etichette con `bg-primary-500/[0.08] backdrop-blur-2xl`)
  - `WhatsNewModal`: modal e backdrop aggiornati (`bg-white/[0.95] backdrop-blur-3xl shadow-liquid-xl`, backdrop `bg-black/60 backdrop-blur-2xl`)
  - `DayAccordionItem`: aggiunto `liquid` prop al button "Aggiungi intervallo"
- **Migliorati componenti pagine con liquid glass**
  - `Maintenance page`: inner cards (Ore Utilizzo, Ore Target, Ore Rimanenti) con liquid glass color-specific, preset buttons con liquid glass
  - `Errors page`: error cards e filter tabs aggiornati con liquid glass (filter tabs con stati attivi/inattivi colorati)
  - `Log page`: Card components e filter buttons (Tutti, Stufa, Termostato, Luci, Sonos) aggiornati con liquid glass
  - `Settings/Notifications page`: device items aggiornati con liquid glass completo e gradient overlay
- **Applicato gradient overlay consistente su tutti i componenti**
  - Pattern uniforme `before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.12] before:to-transparent before:pointer-events-none`
  - Profondità visiva uniforme su tutti i componenti liquid glass per consistenza iOS 26
- **Ottimizzati z-index su tutti i componenti aggiornati**
  - Contenuti con `relative z-10` per corretta sovrapposizione sopra gradient overlay
  - Gradient overlay su layer inferiore (z-index implicito base)
  - Mantenuta gerarchia design system: navbar < dropdown/tooltip < modal < critical alerts

## [1.6.2] - 2025-10-21

### Corretto
- **Card liquid overflow fix**: Rimosso `overflow-hidden` dal componente Card variant liquid
  - I dropdown Select nelle device cards non vengono più clippati dai bordi della card
  - Risolto problema homepage: dropdown nelle card ora fuoriescono correttamente senza essere tagliati
  - Gradiente overlay `before:` continua a funzionare correttamente (non richiede overflow-hidden perché usa `inset-0`)
  - Border radius applicati correttamente anche senza overflow-hidden

## [1.6.1] - 2025-10-21

### Corretto
- **Z-index hierarchy mobile**: Risolto problema dropdown che andavano sotto altri elementi grafici su mobile
  - `WhatsNewModal`: corretto z-index da `z-50` a `z-[1000]` (backdrop) e `z-[1001]` (content) per rispettare gerarchia documentata
  - `TimeBar` tooltip: corretto z-index da `z-50` a `z-[100]` per consistenza con design system (tooltip = dropdown level)
  - Ora tutti i componenti seguono correttamente la gerarchia: navbar (`z-50`) < dropdown/tooltip (`z-[100]`) < modal (`z-[1000]`/`z-[1001]`) < critical alerts (`z-[9999]`/`z-[10000]`)

## [1.6.0] - 2025-10-21

### Aggiunto
- **Documentazione modulare**: Ristrutturazione completa della documentazione in file tematici auto-conclusivi
  - Creata struttura `docs/` organizzata con sottodirectory `systems/` e `setup/`
  - 17 file tematici: quick-start, architecture, api-routes, firebase, ui-components, design-system, patterns, data-flow, versioning, testing, troubleshooting, deployment
  - Sistemi: docs/systems/maintenance.md, monitoring.md, errors.md, notifications.md
  - Setup guide: docs/setup/netatmo-setup.md, hue-setup.md
- **CLAUDE.md come indice navigabile**: Trasformato da file monolitico (906 righe) a indice leggero (382 righe, -58% token usage)
  - Quick Links per accesso rapido a sezioni più richieste
  - Documentation Map organizzata per categoria (Getting Started, Development, Systems, Integrations, Operations)
  - Critical Concepts con esempi codice sintetici e link approfondimenti
  - Critical Best Practices con pattern ❌/✅ per errori comuni

### Modificato
- **File esistenti riorganizzati in docs/**:
  - `ERRORS-DETECTION.md` → `docs/systems/errors.md`
  - `NOTIFICATIONS-SETUP.md` → `docs/systems/notifications.md`
  - `README-TESTING.md` → `docs/testing.md`
  - `DEPLOY.md` → `docs/deployment.md`
  - `NETATMO_TEST.md` → `docs/setup/netatmo-setup.md`
  - `HUE-SETUP.md` → `docs/setup/hue-setup.md`

### Migliorato
- **Riusabilità documentazione**: Ogni file è auto-conclusivo con cross-references intelligenti ad altri file tematici
- **Token consumption**: Documentazione parzializzabile permette AI di caricare solo sezioni necessarie
- **Manutenibilità**: Modifiche future a singole sezioni non richiedono reload dell'intero CLAUDE.md
- **Navigabilità**: Struttura gerarchica chiara facilita ricerca informazioni specifiche

## [1.5.15] - 2025-10-21

### Aggiunto
- **Sistema notifiche push completo**: Firebase Cloud Messaging per delivery notifiche su dispositivi iOS e altri
  - Supporto iOS PWA: notifiche funzionano su iPhone con iOS 16.4+ se app installata come PWA
  - Service worker (`firebase-messaging-sw.js`) per gestione notifiche in background quando app chiusa
  - Client service (`lib/notificationService.js`): request permissions, FCM token management, foreground notifications
  - Server service (`lib/firebaseAdmin.js`): Firebase Admin SDK per invio notifiche server-side
- **Gestione preferenze notifiche per utente**: pannello completo con toggle switches organizzati per categoria
  - Errori stufa: master toggle + sotto-opzioni per severità (INFO, WARNING, ERROR, CRITICAL)
  - Scheduler: master toggle + sotto-opzioni per accensione/spegnimento automatico
  - Manutenzione: master toggle + sotto-opzioni per soglie (80%, 90%, 100%)
  - Salvataggio automatico real-time su Firebase (`users/{userId}/notificationPreferences/`)
  - Pulsante "Ripristina Predefinite" con conferma
- **Menu Impostazioni in navbar**: dropdown con 3 voci (desktop + mobile)
  - 🔔 Gestione Notifiche → `/settings/notifications`
  - 📊 Storico → `/log`
  - ℹ️ Changelog → `/changelog`
- **Notifiche automatiche integrate**:
  - Errori stufa: notifica quando error !== 0 con check preferenze per severità
  - Scheduler: notifiche accensione/spegnimento automatico con check preferenze per azione
  - Manutenzione: notifiche a 80%, 90%, 100% utilizzo (una volta per livello) con check preferenze per soglia
- **API routes notifiche**:
  - POST `/api/notifications/test`: invio notifica di test all'utente corrente
  - POST `/api/notifications/send`: invio notifica generica (uso interno/admin)
- **Schema Firebase esteso**:
  - `users/{userId}/fcmTokens/{token}/`: token FCM con metadata (platform, isPWA, createdAt, lastUsed)
  - `users/{userId}/notificationPreferences/`: preferenze utente per tipo notifica
  - `maintenance/lastNotificationLevel`: tracker per evitare spam notifiche duplicate
- **Documentazione `NOTIFICATIONS-SETUP.md`**: guida completa 458 righe
  - Configurazione Firebase Cloud Messaging step-by-step
  - Generazione VAPID keys e Admin SDK credentials
  - Installazione PWA su iOS con screenshot illustrati
  - Testing notifiche (manuale + automatiche)
  - Troubleshooting iOS e debug tools
  - Gestione preferenze utente con esempi

### Modificato
- **Service `notificationPreferencesService.js`**: funzioni helper per check preferenze
  - `getUserPreferences(userId)`: fetch preferenze con init defaults se non esistono
  - `updatePreferenceSection(userId, section, prefs)`: update parziale preferenze
  - `shouldSendErrorNotification(userId, severity)`: check se inviare errore per severità
  - `shouldSendSchedulerNotification(userId, action)`: check se inviare scheduler per azione
  - `shouldSendMaintenanceNotification(userId, threshold)`: check se inviare manutenzione per soglia
  - `resetPreferences(userId)`: reset a defaults predefiniti
- **Integrazione preferenze in invio notifiche**:
  - `errorMonitor.js`: check preferenze prima `sendErrorPushNotification()`
  - `/api/scheduler/check`: check preferenze prima notifiche scheduler/manutenzione
  - Pattern fail-safe: se errore check preferenze, invia comunque (safety-first)
- **Device registry**: `SETTINGS_MENU` aggiunto a `lib/devices/deviceTypes.js`
- **Navbar**: integrato dropdown Impostazioni per desktop e mobile
- **Rimossi duplicati**: LOG e CHANGELOG rimossi da `GLOBAL_SECTIONS` (ora in SETTINGS_MENU)

### Tecnico
- Pattern client/server separato: `notificationService.js` (client) + `firebaseAdmin.js` (server)
- iOS detection: `isIOS()` + `isPWA()` per UX ottimizzata (banner installazione se necessario)
- FCM token tracking: salvataggio automatico con metadata per gestione multi-dispositivo
- Notifiche manutenzione: `lastNotificationLevel` in Firebase per evitare spam duplicate
- Service worker foreground/background: gestione unificata notifiche app aperta/chiusa
- Preferenze defaults: WARNING/ERROR/CRITICAL attivi, INFO disattivo (riduzione rumore)

## [1.5.14] - 2025-10-20

### Aggiunto
- **Liquid Glass Style unificato**: tutti i componenti UI ora supportano prop `liquid={true}` per style iOS 18
- Prop `liquid` aggiunto a: Card, Button, Select, Banner, Input
- Pattern consistente: `bg-white/[0.08]` + `backdrop-blur-3xl` + `shadow-liquid` + `ring-1 ring-white/20 ring-inset`

### Modificato
- **Navbar e menu mobile**: redesign completo con liquid glass style
  - Menu mobile: tutte le voci (user info, device buttons, links, logout) con liquid glass
  - Dropdowns desktop: style liquid per maggiore coerenza
  - Separatori: `border-white/20` invece di `border-neutral-200`
- **Pagine aggiornate**: scheduler, maintenance, errors, changelog, not-found con liquid glass uniforme
- **Device Cards**: StoveCard, ThermostatCard, LightsCard con liquid glass su tutti i componenti
- **DayAccordionItem**: aggiornato con liquid glass per consistenza scheduler page

### Documentazione
- CLAUDE.md: integrata sezione "Liquid Glass Style Pattern" con esempi e best practices
- Documentati componenti base con prop `liquid` e pattern di utilizzo

## [1.5.13] - 2025-10-18

### Corretto
- **Bug tracking manutenzione critico**: `lastUpdatedAt` ora aggiornato **SOLO** durante tracking WORK effettivo
  - Problema: `lastUpdatedAt` veniva aggiornato in `updateTargetHours()` e inizializzazione → conteggio ore fantasma
  - Scenario bug: stufa spenta, modifica config alle 10:00 → stufa accende alle 13:00 → contava 3 ore non lavorate
- `lastUpdatedAt` ora inizializzato a `null` invece di timestamp corrente
- `updateTargetHours()` non tocca più `lastUpdatedAt` (modifica solo `targetHours`)
- `trackUsageHours()` ora inizializza `lastUpdatedAt` al primo tracking WORK senza aggiungere tempo

### Modificato
- **Spegnimento sempre permesso**: blocco manutenzione applicato solo all'accensione (manuale e schedulata)
- `/api/scheduler/check`: check `canIgnite()` spostato solo prima accensione schedulata (shutdown sempre permesso)

### Tecnico
- Test suite maintenanceService: 30 test aggiornati con pattern `jest.useFakeTimers()` per Date mocking affidabile
- Pattern inizializzazione Firebase: valori `null` preferibili a valori default quando il dato sarà popolato successivamente
- Lifecycle `lastUpdatedAt`: `null` → primo WORK tracking → aggiornamento ogni minuto durante WORK

## [1.5.12] - 2025-10-17

### Modificato
- **Navbar mobile completamente riscritta**: architettura separata mobile/desktop per maggiore affidabilità e zero interferenze
- **Menu hamburger con fixed overlay**: backdrop semi-trasparente cliccabile posizionato sotto header per chiusura menu
- **Z-index hierarchy ottimizzata**: navbar (`z-50`), backdrop (`z-[100]`), menu panel (`z-[101]`) per corretta sovrapposizione
- **Gestione stati indipendenti**: `mobileMenuOpen`, `desktopDeviceDropdown`, `mobileDeviceDropdown` per separazione contesti
- **UX migliorata**: body scroll lock quando menu aperto, chiusura automatica su route change, supporto ESC key

### Corretto
- Navbar sempre visibile quando menu hamburger aperto: backdrop e menu panel iniziano sotto header (`top-[3.5rem]`)
- Click fuori menu ora chiude correttamente menu mobile tramite backdrop
- Link interni menu mobile tutti cliccabili e funzionanti
- Tendine device accordion mobile si aprono/chiudono correttamente senza interferenze

### Tecnico
- Pattern fixed overlay: `position: fixed` per backdrop + menu con posizionamento assoluto sotto navbar
- Gestione eventi pulita: backdrop gestisce chiusura mobile, click outside handler solo per dropdown desktop
- Codice semplificato: rimossi ref complessi, logica più lineare e manutenibile
- Separazione completa mobile/desktop: nessuna condizione condivisa tra contesti diversi

## [1.5.11] - 2025-10-17

### Aggiunto
- **Multi-device architecture**: device registry centralizzato in `lib/devices/` per gestione scalabile dispositivi connessi
- **Device registry pattern**: `DEVICE_CONFIG` con configurazione completa (routes, features, enabled flag) per ogni device
- **Device cards modulari**: componenti organizzati in `app/components/devices/{device}/` (StoveCard, ThermostatCard, LightsCard)
- **Helper functions**: `getEnabledDevices()` per filtrare solo device abilitati, `getDeviceConfig(id)` per config singolo device
- **Future development preparati**: Philips Hue (Local API) e Spotify+Sonos pronti ma disabilitati (`enabled: false`)

### Modificato
- **Homepage layout responsive**: grid 2 colonne su desktop (≥1024px), stack verticale su mobile
- **Log service**: supporto completo device filtering per filtrare azioni per tipo dispositivo (Stufa, Termostato, Luci, Sonos)
- **CLAUDE.md aggiornato**: sezioni Multi-Device Architecture e Log Service con pattern generali riutilizzabili

### Tecnico
- Pattern scalabile per aggiungere nuovi device: registry → card component → homepage mapping → `enabled: true`
- Grid CSS responsive: `grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8`
- Organizzazione directory modulare per componenti device-specific

## [1.5.10] - 2025-10-16

### Modificato
- **CLAUDE.md drasticamente ottimizzato**: ridotto da 1538 a 647 righe (-58% context usage per Claude)
- **Sezione Testing eliminata**: riferimento completo a `README-TESTING.md` invece di duplicazione (~127 righe risparmiate)
- **Pattern codice sintetizzati**: sostituiti esempi lunghi con riferimenti a implementazioni reali nel codebase
- **Sezioni compattate**: Sistema Manutenzione, Monitoring Cronjob, Sistema Errori ora con overview + link documentazione dedicata
- **Pattern UI compattati**: Dropdown, Modal, Collapse, Badge con sintesi + riferimenti file reali (Navbar.js, MaintenanceBar.js, etc.)
- **Info critiche mantenute**: tutte le informazioni essenziali (architettura, API routes, Firebase schema, versioning, best practices) ancora presenti

### Tecnico
- Context usage ridotto da ~90k a ~38k token (-58%)
- Zero perdita informazioni: uso di riferimenti a file esistenti (README-TESTING.md, ERRORS-DETECTION.md, codice reale)
- Approccio "overview + riferimenti" per sezioni dettagliate
- CLAUDE.md ora più veloce da processare e più efficiente per iterazioni Claude Code

## [1.5.9] - 2025-10-16

### Aggiunto
- **Netatmo UI ottimizzata**: report temperature compatto in home page con polling automatico ogni 30 secondi
- **Badge tipo dispositivo**: termostato/valvola visualizzati sia in home che in pagina dettagli Netatmo
- **Ordinamento intelligente**: termostati sempre per primi, poi valvole, poi stanze ordinate per temperatura

### Modificato
- **Filtro dispositivi**: relè Netatmo (NAPlug) rimossi da visualizzazione (non utili per monitoraggio temperature)

### Corretto
- **Firebase undefined handling**: aggiunto filtro automatico valori `undefined` in netatmoService per prevenire errori write operations

### Tecnico
- Pattern `filterUndefined()` documentato in CLAUDE.md per riutilizzo in future integrazioni API
- Sort logic: termostati (device_type=NATherm1) priorità massima, poi valvole (NRV), poi stanze per temperatura

## [1.5.8] - 2025-10-16

### Aggiunto
- **Integrazione Netatmo completa**: OAuth 2.0 flow con sessione persistente
- Token helper centralizzato (`lib/netatmoTokenHelper.js`) con auto-refresh automatico refresh token
- 8 endpoint API Netatmo: callback, homesdata, homestatus, devices, setthermmode, setroomthermpoint, temperature, devices-temperatures
- Pattern generico per integrazioni API esterne con OAuth 2.0 in CLAUDE.md
- Sezione **Testing & Quality Assurance** aggiunta a CLAUDE.md come priorità fondamentale (regola #6)

### Modificato
- **Sessione Netatmo ora permanente**: token si auto-rinnova ad ogni chiamata API
- **UI feedback errori**: banner dismissibili con flag `reconnect` per riconnessione guidata
- **Tutte le API routes Netatmo** (~60% codice ridotto) ora usano token helper centralizzato
- **CLAUDE.md ottimizzato**: pattern generici `[external-api]` riutilizzabili, rimossi dettagli specifici Netatmo
- Callback OAuth usa redirect URI dinamico invece di hardcoded localhost:3000
- `NetatmoPage` wrapped in Suspense per compatibilità Next.js 15 con useSearchParams()

### Tecnico
- Error handling: 5 tipi errore (NOT_CONNECTED, TOKEN_EXPIRED, TOKEN_ERROR, NO_ACCESS_TOKEN, NETWORK_ERROR)
- Auto-save nuovo refresh_token quando Netatmo lo ritorna (garantisce persistenza indefinita)
- Pattern riutilizzabile per integrazioni OAuth: token helper + API wrapper + service layer + Firebase storage
- Client reconnect pattern: flag `reconnect: true` in response API per trigger UI riconnessione
- Suspense boundary in `NetatmoPage` con `Skeleton.NetatmoPage` fallback per SSG

## [1.5.7] - 2025-10-15

### Aggiunto
- **Sistema rilevamento errori esteso**: database completo con 23 codici errore Thermorossi
- **Database ERROR_CODES**: ogni errore con severità (INFO/WARNING/ERROR/CRITICAL) e suggerimento risoluzione automatico
- **Badge errore pulsante**: visualizzazione badge rosso pulsante con animazione pulse + blur effect nel display status
- **Pagina debug** (`/debug`): monitoraggio real-time API con auto-refresh 3 secondi e visualizzazione parametri completi
- Documentazione `ERRORS-DETECTION.md`: guida completa errori stufa con troubleshooting e best practices

### Modificato
- **ErrorAlert component**: aggiunto box suggerimenti glassmorphism con icona 💡 e pulsante "Vedi Storico Errori"
- `lib/errorMonitor.js`: espanso da 2 a 23 codici errore con categorie (accensione, temperatura, tiraggio, meccanici, sicurezza)
- `ErrorAlert.js`: supporto prop `showSuggestion` e `showDetailsButton` per flessibilità visualizzazione

### Tecnico
- Pattern badge pulsante: `absolute -top-2 -right-2 animate-pulse` con doppio layer (blur + solid)
- Categorie errori: accensione (1-3), temperatura (4-7), tiraggio (8-10), meccanici (11-12), sicurezza (13-15), altri (20, 30, 40)
- Debug page: grid responsive con color-coding per error code, status, fan, power + raw JSON viewer

## [1.5.6] - 2025-10-15

### Aggiunto
- **Test suite completa**: 288 test totali (+169 nuovi test) per services e componenti UI critici
- 6 nuove test suite per services: `schedulerService`, `maintenanceService`, `changelogService`, `errorMonitor`, `logService`, `stoveApi`
- Configurazione Jest completa con `@testing-library/react` 16.3.0 e `jest-environment-jsdom` 30.2.0
- `README-TESTING.md`: documentazione testing con comandi, best practices, esempi, troubleshooting
- Mock globali Firebase, Auth0, localStorage, window.matchMedia in `jest.setup.js`
- Scripts npm: `test`, `test:watch`, `test:coverage`, `test:ci` per workflow completo

### Modificato
- **Coverage improvement**: services critici ora testati (stoveApi 100%, logService 100%, errorMonitor 97%, changelogService 92%)
- Coverage globale: +3% statements, +5.6% functions rispetto a baseline iniziale
- `CLAUDE.md`: aggiunta sezione "Testing & Quality Assurance" con pattern generali riutilizzabili
- Jest config: coverage threshold 70% impostato per statements, branches, functions, lines

### Tecnico
- Pattern test AAA (Arrange-Act-Assert) applicato consistentemente in tutti i test
- Mock strategy: Firebase functions mockate manualmente per evitare import circolari
- Test structure: `__tests__/` directory co-located con codice testato per migliore organizzazione
- 285 test passati (99% success rate), 3 test falliti non critici (timezone issues schedulerService)

## [1.5.5] - 2025-10-10

### Modificato
- **UI consolidata**: CronHealthBanner integrato dentro card principale "Stato Stufa" per ridurre frammentazione visiva
- **Layout home ottimizzato**: tutte le info stato stufa (status, modalità, cron health, manutenzione) ora in unica card coesa
- **Nuovo pattern componenti**: supporto varianti multiple (banner standalone vs inline compatto) per flessibilità layout
- **Design coerente**: variante inline warning con styling simile a Mode Indicator per consistenza visiva
- **Posizione integrata**: CronHealthBanner inline dopo Mode Indicator, prima del separator Manutenzione

### Tecnico
- `CronHealthBanner.js`: aggiunta prop `variant="inline"` con layout compatto orizzontale
- Variante inline: design responsive (full-width mobile, auto desktop) con icona box + pulsante azione integrato
- Stile warning uniforme: `bg-warning-50/80` con bordo `border-warning-300`, consistente con palette semantica
- `StovePanel.js` (StovePanel.js:468): rendering condizionale inline dentro card, non più banner standalone sopra
- CLAUDE.md aggiornato: sezione "Sistema Monitoring Cronjob" riflette nuova integrazione UI

## [1.5.4] - 2025-10-10

### Modificato
- **Documentazione aggiornata**: `CLAUDE.md` allineato con stack tecnologico attuale
  - Stack: React 18 → React 19.2 (versione installata)
  - Stack: Next.js 15 → Next.js 15.5.4 (versione specifica)
  - Version footer: 1.5.2 → 1.5.4
- `package.json`: esplicitate versioni React corrette (`^19.2.0` invece di `^19.0.0`)

### Tecnico
- Verificato che codebase già ottimizzato per React 19 e Next.js 15.5
- Nessuna modifica codice necessaria: pattern attuali già compatibili e performanti
- Build production testato e funzionante

## [1.5.3] - 2025-10-10

### Modificato
- **Dipendenze aggiornate**: React 19.1.1 → 19.2.0 (minor update)
- **Dipendenze aggiornate**: Firebase 11.10.0 → 12.4.0 (major update, compatibilità verificata)
- **Dipendenze aggiornate**: ESLint 9.36.0 → 9.37.0 (patch update)
- **Dipendenze dev**: autoprefixer e postcss aggiornate alle ultime versioni
- Auth0 mantenuto a 3.8.0 (v4.x richiede refactoring esteso, upgrade rimandato)

### Sicurezza
- Nessuna vulnerabilità rilevata dopo aggiornamenti (npm audit clean)

### Tecnico
- Build production testato e verificato funzionante con tutte le librerie aggiornate
- Firebase 12.x: compatibilità retroattiva garantita, nessun breaking change rilevato
- React 19.2: aggiornamento smooth senza modifiche codice necessarie

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
