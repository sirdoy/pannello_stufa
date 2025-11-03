# Stove Status Mapping

Mapping completo degli stati della stufa con relativi colori, icone e label UI.

## 📊 Status Reference Table

| Stato Tecnico | Label UI | Icona | Colore Sfondo | Colore Testo | Note |
|--------------|----------|-------|---------------|--------------|------|
| `OFF` | SPENTA | ❄️ | `bg-gradient-to-b from-sky-50 to-sky-100` | `text-info-700` | Azzurro chiaro, stato spenta |
| `WORK` | IN FUNZIONE | 🔥 | `bg-gradient-to-b from-success-50 to-success-100` | `text-success-800` | Verde chiaro, stato attivo + pulse |
| `START` | AVVIO IN CORSO | 🚀 | `bg-gradient-to-b from-info-50 to-info-100` | `text-info-700` | Blu chiaro, fase avvio + pulse |
| `STANDBY`/`WAIT` | IN ATTESA | 💤 | `bg-gradient-to-b from-warning-50 to-warning-100` | `text-warning-700` | Arancio chiaro, standby |
| `ERROR`/`ALARM` | ERRORE | ⚠️ | `bg-gradient-to-b from-primary-50 to-primary-100` | `text-primary-700` | Rosso chiaro, errore + pulse |
| `CLEAN` | PULIZIA | 🔄 | `bg-gradient-to-b from-accent-50 to-accent-100` | `text-accent-700` | Viola chiaro, pulizia automatica + pulse |
| `MODULATION` | MODULAZIONE | 🌡️ | `bg-gradient-to-b from-info-50 to-info-100` | `text-info-700` | Blu chiaro, modulazione |
| `null`/undefined | CARICAMENTO... | ⏳ | `bg-gradient-to-b from-neutral-50 to-neutral-100` | `text-neutral-700` | Grigio chiaro, caricamento |
| Default | [STATO] | ❔ | `bg-gradient-to-b from-neutral-50 to-neutral-100` | `text-neutral-700` | Grigio chiaro, sconosciuto |

## 🎨 Color Palette

### Tailwind Classes Used
- **Sky (Azzurro)**: `sky-50`, `sky-100` - Per stato OFF
- **Success (Verde)**: `success-50`, `success-100` - Per stato WORK
- **Info (Blu)**: `info-50`, `info-100` - Per stati START/MODULATION
- **Warning (Arancio)**: `warning-50`, `warning-100` - Per stato STANDBY/WAIT
- **Primary (Rosso)**: `primary-50`, `primary-100` - Per stati ERROR/ALARM
- **Accent (Viola)**: `accent-50`, `accent-100` - Per stato CLEAN
- **Neutral (Grigio)**: `neutral-50`, `neutral-100` - Per caricamento/default

### Glassmorphism Box
I box glassmorphism (fan e power) utilizzano sempre:
- **Colore**: `#d1d5db` (grigio neutro)
- **Opacity**: `0.35`
- **Backdrop blur**: `backdrop-blur-2xl`

Questo permette di vedere chiaramente l'icona sottostante mantenendo la leggibilità dei valori.

## 🏗️ Layout Structure

```
┌─────────────────────────────────────────┐
│ Card Principale (BIANCA)                │
│ bg-white/[0.08] backdrop-blur-2xl       │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Riquadro Interno (COLORATO)       │ │
│  │ bg-gradient-to-b [colore stato]   │ │
│  │                                   │ │
│  │     [LABEL STATO]                 │ │
│  │                                   │ │
│  │        [ICONA 120px]              │ │
│  │             ▲                     │ │
│  │  ┌──────────┼──────────┐          │ │
│  │  │ 💨       │      ⚡ │          │ │
│  │  │ Box      │     Box  │          │ │
│  │  │ Glass    │    Glass │          │ │
│  │  │ (grigio  │  (grigio │          │ │
│  │  │ traspar.)│ traspar.)│          │ │
│  │  └──────────┴──────────┘          │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🔄 Animation Effects

- **Pulse**: Applicato a stati dinamici (WORK, START, ERROR, CLEAN)
- **Drop shadow**: `drop-shadow-xl` su icone grandi
- **Transition**: `transition-all duration-500` su card hover

## 📝 Implementation Reference

Vedi `app/components/devices/stove/StoveCard.js` linea ~359 per la funzione `getStatusInfo()` che contiene il mapping completo.

## 🎯 Design Goal

- **Card bianca**: Mantiene coerenza con resto dell'app (liquid glass style)
- **Riquadro colorato**: Indica visivamente lo stato corrente
- **Box trasparenti**: Permettono di vedere l'icona creando depth effect
- **Label uppercase**: Migliora leggibilità e consistenza UI

---

**Last Updated**: 2025-11-03
**Version**: 1.10.1
