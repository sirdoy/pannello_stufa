/**
 * What an action lacks to do anything (workspace ROADMAP D17). Mirrors the backend
 * check that answers 422 on save (docs/api/automations.md, "Complete actions"), so the
 * editor can say it in plain words before the request.
 */
import type { ActionItem } from '@/types/automations';

const isSet = (v: unknown): boolean => v !== null && v !== undefined;

/** Italian message for the first thing missing, or null when the action is complete. */
export function incompleteActionMessage(action: ActionItem): string | null {
  const a = action as unknown as Record<string, unknown>;
  switch (a.type) {
    case 'netatmo_set_room_temp':
      if (!a.home_id || !a.room_id) return 'Temperatura stanza: scegli casa e stanza.';
      if (a.mode === 'manual' && !isSet(a.temp)) return 'Temperatura stanza: indica la temperatura.';
      return null;
    case 'netatmo_set_home_mode':
      return a.home_id ? null : 'Modalità casa: scegli la casa.';
    case 'netatmo_switch_schedule':
      return a.home_id && a.schedule_id ? null : 'Cambia programma: scegli casa e programma.';
    case 'hue_light':
      if (!a.light_id) return 'Luce: scegli la luce.';
      return [a.on, a.brightness, a.color_temp, a.hue, a.sat].some(isSet)
        ? null
        : 'Luce: scegli Accendi o Spegni, oppure un valore.';
    case 'hue_group':
      if (!a.group_id) return 'Gruppo luci: scegli il gruppo.';
      return [a.on, a.brightness, a.color_temp].some(isSet)
        ? null
        : 'Gruppo luci: scegli Accendi o Spegni, oppure un valore.';
    case 'hue_scene':
      return a.group_id && a.scene_id ? null : 'Scena Hue: scegli gruppo e scena.';
    case 'thermorossi':
      if (a.command === 'set_power' && !isSet(a.power_level)) return 'Stufa: indica il livello di potenza.';
      if (a.command === 'set_fan' && !isSet(a.fan_level)) return 'Stufa: indica il livello della ventola.';
      if (a.command === 'set_water_temp' && !isSet(a.water_temp)) return "Stufa: indica la temperatura dell'acqua.";
      return null;
    case 'sonos':
      if (!a.speaker_uid) return 'Sonos: scegli lo speaker.';
      if (a.command === 'set_volume' && !isSet(a.volume)) return 'Sonos: indica il volume.';
      if (a.command === 'switch_source' && !isSet(a.source)) return 'Sonos: scegli la sorgente.';
      return null;
    case 'tuya':
      if (!a.device_id) return 'Presa: scegli il dispositivo.';
      if (a.command === 'set_status' && !isSet(a.on)) return 'Presa: scegli Accendi o Spegni.';
      if (a.command === 'set_timer' && !isSet(a.timer_seconds)) return 'Presa: indica i secondi del timer.';
      return null;
    case 'http_webhook':
      return typeof a.url === 'string' && /^https?:\/\//i.test(a.url)
        ? null
        : 'Webhook: l\'URL deve iniziare con http:// o https://.';
    case 'log_event':
      return typeof a.message === 'string' && a.message.trim() ? null : 'Scrivi log: indica il messaggio.';
    default:
      return null;
  }
}
