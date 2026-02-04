# Quick Task 005: Thermostat Card Active Device Indicator

## Objective

Aggiungere alla ThermostatCard un indicatore chiaro e immediato che mostri quali dispositivi (termostato o valvole) sono attivi e stanno riscaldando in ogni stanza.

## Current State

La card mostra:
- Un badge "🔥 ATTIVO" quando la stanza sta riscaldando
- Il deviceType della stanza (thermostat/valve) calcolato dai moduli

Non mostra:
- Quanti dispositivi ci sono nella stanza selezionata
- Quali tipi di dispositivi (termostato vs valvole)
- Indicazione immediata dello stato di ciascun dispositivo

## Implementation

### Task 1: Add Active Devices Summary Component

Aggiungere sotto il display della temperatura una riga informativa che mostri i dispositivi della stanza selezionata con icone chiare.

**Location:** `app/components/devices/thermostat/ThermostatCard.js`

**Change:** Dopo il Temperature Display Grid (linea ~576), aggiungere:

```jsx
{/* Active Devices Summary */}
{selectedRoom.roomModules && selectedRoom.roomModules.length > 0 && (
  <div className="mt-3 flex items-center justify-center gap-3">
    {selectedRoom.roomModules.map(module => {
      const isValve = module.type === 'NRV';
      const isThermostat = module.type === 'NATherm1' || module.type === 'OTH';
      const isReachable = module.reachable !== false;

      return (
        <div
          key={module.id}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
            selectedRoom.heating && isReachable
              ? "bg-ember-900/40 border-ember-500/40 text-ember-300 [html:not(.dark)_&]:bg-ember-100 [html:not(.dark)_&]:border-ember-300 [html:not(.dark)_&]:text-ember-700"
              : isReachable
              ? "bg-slate-800/40 border-slate-600/30 text-slate-300 [html:not(.dark)_&]:bg-slate-100 [html:not(.dark)_&]:border-slate-300 [html:not(.dark)_&]:text-slate-600"
              : "bg-slate-900/40 border-slate-700/30 text-slate-500 [html:not(.dark)_&]:bg-slate-200 [html:not(.dark)_&]:border-slate-400 [html:not(.dark)_&]:text-slate-500 opacity-60"
          )}
          title={`${module.name || 'Dispositivo'} - ${isReachable ? (selectedRoom.heating ? 'Attivo' : 'Standby') : 'Offline'}`}
        >
          <span>{isValve ? '🔧' : isThermostat ? '🌡️' : '📡'}</span>
          <span>{isValve ? 'Valvola' : isThermostat ? 'Termostato' : module.type}</span>
          {selectedRoom.heating && isReachable && (
            <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-ember-400 animate-pulse" />
          )}
        </div>
      );
    })}
  </div>
)}
```

### Task 2: Update Unit Tests

Aggiungere test per verificare che i dispositivi attivi vengano mostrati correttamente.

**Location:** Create or update `__tests__/components/ThermostatCard.test.js`

## Verification

1. Aprire la homepage con la ThermostatCard
2. Verificare che sotto la temperatura appaia una riga con i dispositivi
3. Quando il riscaldamento è attivo, i dispositivi devono avere sfondo ember e pallino pulsante
4. Quando il riscaldamento è inattivo, i dispositivi devono avere sfondo neutro
5. Dispositivi offline devono apparire sfumati

## Files Modified

- `app/components/devices/thermostat/ThermostatCard.js` - Add active devices summary

## Rollback

Rimuovere il blocco JSX aggiunto dopo il Temperature Display Grid.
