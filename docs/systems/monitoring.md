# Monitoraggio motore stufa

Dal passaggio dello scheduler sul Pi (workspace ROADMAP D2) la stufa è comandata dal motore del backend, che esegue
un giro ogni minuto. La UI controlla quel battito, non più il cron esterno di Vercel (ROADMAP V8).

## Dati

- REST: `GET /api/v1/thermorossi/scheduler/engine` (route Next → backend), contratto in
  `../docs/api/scheduler.md#get-schedulerengine`.
- WebSocket, topic `scheduler`: `data.engine` nello snapshot e il `timestamp` di ogni evento `engine.tick`.

```typescript
interface SchedulerEngineHealth {
  initialized: boolean;
  started_at: number | null;   // Unix s, avvio del backend
  last_tick_at: number | null; // Unix s, ultimo giro del motore
  last_action: string | null;
  tick_interval_s: number;     // 60
  stale_after_s: number;       // 180
  healthy: boolean;
}
```

## Banner

`app/components/SchedulerEngineBanner.tsx` (pagina stufa, variante `inline`):

- una lettura REST al montaggio, poi aggiornamenti dal WS; REST ogni 60 s solo se il WS non è connesso;
- controllo locale ogni 30 s: banner "Motore stufa fermo" quando l'ultimo giro (o l'avvio, prima del primo giro)
  è più vecchio di `stale_after_s`, o se il motore non è avviato;
- si nasconde da solo al primo `engine.tick`.

Il vecchio heartbeat Firebase `cronHealth/lastCall` non è più scritto né letto.
