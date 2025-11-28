import { adminDbGet, adminDbSet, sendNotificationToUser } from '@/lib/firebaseAdmin';
import { clearSemiManualMode } from '@/lib/schedulerService';
import { canIgnite, trackUsageHours } from '@/lib/maintenanceServiceAdmin';
import { STOVE_ROUTES, NETATMO_ROUTES } from '@/lib/routes';
import {
  shouldSendSchedulerNotification,
  shouldSendMaintenanceNotification,
} from '@/lib/notificationPreferencesService';

export const dynamic = 'force-dynamic';

/**
 * Helper: Invia notifica push per azione scheduler
 * Controlla preferenze utente prima di inviare
 */
async function sendSchedulerNotification(action, details = '') {
  try {
    // Get admin user ID from env (opzionale)
    const adminUserId = process.env.ADMIN_USER_ID;

    if (!adminUserId) {
      console.log('⚠️ ADMIN_USER_ID non configurato - notifiche scheduler disabilitate');
      return;
    }

    // Check user preferences
    const actionType = action === 'IGNITE' ? 'ignition' : 'shutdown';
    const shouldSend = await shouldSendSchedulerNotification(adminUserId, actionType);

    if (!shouldSend) {
      console.log(`⏭️ Scheduler notification skipped (user preferences): ${action}`);
      return;
    }

    const emoji = action === 'IGNITE' ? '🔥' : action === 'SHUTDOWN' ? '🌙' : '⚙️';
    const actionText = action === 'IGNITE' ? 'Accensione' :
                       action === 'SHUTDOWN' ? 'Spegnimento' :
                       action === 'POWER_CHANGE' ? 'Cambio potenza' :
                       action === 'FAN_CHANGE' ? 'Cambio ventola' : 'Modifica';

    const notification = {
      title: `${emoji} ${actionText} Automatica`,
      body: details || `La stufa è stata ${action === 'IGNITE' ? 'accesa' : 'spenta'} automaticamente`,
      icon: '/icons/icon-192.png',
      priority: 'normal',
      data: {
        type: 'scheduler_action',
        action,
        url: '/stove/scheduler',
      },
    };

    await sendNotificationToUser(adminUserId, notification);
    console.log(`✅ Notifica scheduler inviata: ${action}`);

  } catch (error) {
    console.error('❌ Errore invio notifica scheduler:', error);
  }
}

/**
 * Helper: Calibra valvole Netatmo ogni 12 ore
 * Controlla timestamp ultima calibrazione e calibra se necessario
 */
async function calibrateValvesIfNeeded(baseUrl) {
  try {
    // Get last calibration timestamp
    const lastCalibration = await adminDbGet('netatmo/lastAutoCalibration');

    const now = Date.now();
    const TWELVE_HOURS = 12 * 60 * 60 * 1000; // 12 ore in millisecondi

    // Check if 12 hours have passed since last calibration
    if (lastCalibration && (now - lastCalibration) < TWELVE_HOURS) {
      // Not yet time for calibration
      return {
        calibrated: false,
        reason: 'too_soon',
        nextCalibration: new Date(lastCalibration + TWELVE_HOURS).toISOString(),
      };
    }

    console.log('🔧 Avvio calibrazione automatica valvole Netatmo...');

    // Call calibration endpoint
    const response = await fetch(`${baseUrl}${NETATMO_ROUTES.calibrate}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('❌ Calibrazione automatica fallita:', data.error || response.statusText);
      return {
        calibrated: false,
        reason: 'error',
        error: data.error || response.statusText,
      };
    }

    // Update last calibration timestamp
    await adminDbSet('netatmo/lastAutoCalibration', now);

    console.log('✅ Calibrazione automatica valvole completata');

    return {
      calibrated: true,
      timestamp: now,
      nextCalibration: new Date(now + TWELVE_HOURS).toISOString(),
    };

  } catch (error) {
    console.error('❌ Errore calibrazione automatica valvole:', error);
    return {
      calibrated: false,
      reason: 'exception',
      error: error.message,
    };
  }
}

export async function GET(req) {
  try {
    const secret = req.nextUrl.searchParams.get('secret');
    if (secret !== process.env.CRON_SECRET) {
      return new Response('Unauthorized', {status: 401});
    }

    // Save cron health timestamp
    const cronHealthTimestamp = new Date().toISOString();
    console.log(`🔄 Tentativo salvataggio Firebase cronHealth/lastCall: ${cronHealthTimestamp}`);
    try {
      await adminDbSet('cronHealth/lastCall', cronHealthTimestamp);
      console.log(`✅ Cron health updated: ${cronHealthTimestamp}`);
    } catch (error) {
      console.error('❌ ERRORE salvataggio cronHealth:', error);
      throw error;
    }

    // Check if scheduler mode is enabled
    const modeData = (await adminDbGet('stoveScheduler/mode')) || { enabled: false, semiManual: false };
    const schedulerEnabled = modeData.enabled;

    if (!schedulerEnabled) {
      return Response.json({
        status: 'MODALITA_MANUALE',
        message: 'Scheduler disattivato - modalità manuale attiva'
      });
    }

    // Check if in semi-manual mode
    if (modeData.semiManual) {
      // Verifica se è arrivato il momento di tornare in automatico
      const returnToAutoAt = modeData.returnToAutoAt ? new Date(modeData.returnToAutoAt) : null;
      const now = new Date();

      if (returnToAutoAt && now >= returnToAutoAt) {
        // È il momento di tornare in automatico
        console.log('Ritorno in modalità automatica dallo stato semi-manuale');
        // Non chiamiamo clearSemiManualMode qui, lo facciamo dopo aver applicato il cambio
      } else {
        // Siamo ancora in semi-manuale, non fare niente
        return Response.json({
          status: 'MODALITA_SEMI_MANUALE',
          message: 'Modalità semi-manuale attiva - in attesa del prossimo cambio scheduler',
          returnToAutoAt: modeData.returnToAutoAt
        });
      }
    }

    // Fuso orario Europe/Rome con Intl
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const [dayPart, timePart] = formatter.formatToParts(now).reduce((acc, part) => {
      if (part.type === 'weekday') acc[0] = part.value;
      if (part.type === 'hour') acc[1] = part.value;
      if (part.type === 'minute') acc[2] = part.value;
      return acc;
    }, []);

    const giorno = capitalize(dayPart);
    const ora = `${timePart}:${formatter.formatToParts(now).find(p => p.type === 'minute').value}`;
    const currentMinutes = parseInt(timePart) * 60 + parseInt(formatter.formatToParts(now).find(p => p.type === 'minute').value);

    const intervals = await adminDbGet(`stoveScheduler/${giorno}`);
    if (!intervals) {
      return Response.json({message: 'Nessuno scheduler', giorno, ora});
    }
    const active = intervals.find(({start, end}) => {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      return currentMinutes >= startMin && currentMinutes < endMin;
    });

    const baseUrl = `${req.nextUrl.protocol}//${req.headers.get('host')}`;
    console.log(baseUrl);

    // Auto-calibrate Netatmo valves every 12 hours
    const calibrationResult = await calibrateValvesIfNeeded(baseUrl);
    if (calibrationResult.calibrated) {
      console.log(`✅ Calibrazione automatica completata - prossima calibrazione: ${calibrationResult.nextCalibration}`);
    }

    const statusRes = await fetch(`${baseUrl}${STOVE_ROUTES.status}`);
    const statusJson = await statusRes.json();
    const currentStatus = statusJson?.StatusDescription || 'unknown';
    const isOn = currentStatus.includes('WORK') || currentStatus.includes('START');

    // Track maintenance hours (automatic tracking based on WORK/MODULATION status)
    const maintenanceTrack = await trackUsageHours(currentStatus);
    if (maintenanceTrack.tracked) {
      console.log(`✅ Maintenance tracked: +${maintenanceTrack.elapsedMinutes}min → ${maintenanceTrack.newCurrentHours.toFixed(2)}h total`);

      // Send maintenance notification if threshold reached
      if (maintenanceTrack.notificationData) {
        const { notificationLevel, percentage, remainingHours } = maintenanceTrack.notificationData;

        let emoji, urgency, body, priority;

        if (notificationLevel >= 100) {
          emoji = '🚨';
          urgency = 'URGENTE';
          body = 'Manutenzione richiesta! L\'accensione è bloccata fino alla pulizia.';
          priority = 'high';
        } else if (notificationLevel >= 90) {
          emoji = '⚠️';
          urgency = 'Attenzione';
          body = `Solo ${remainingHours.toFixed(1)}h rimanenti prima della pulizia richiesta`;
          priority = 'high';
        } else {
          emoji = 'ℹ️';
          urgency = 'Promemoria';
          body = `${remainingHours.toFixed(1)}h rimanenti prima della manutenzione (${percentage.toFixed(0)}%)`;
          priority = 'normal';
        }

        const notification = {
          title: `${emoji} ${urgency} Manutenzione`,
          body,
          icon: '/icons/icon-192.png',
          priority,
          data: {
            type: 'maintenance',
            percentage: String(percentage),
            remainingHours: String(remainingHours),
            url: '/stove/maintenance',
          },
        };

        const adminUserId = process.env.ADMIN_USER_ID;
        if (adminUserId) {
          try {
            // Check user preferences
            const shouldSend = await shouldSendMaintenanceNotification(adminUserId, notificationLevel);

            if (shouldSend) {
              await sendNotificationToUser(adminUserId, notification);
              console.log(`✅ Notifica manutenzione inviata: ${notificationLevel}%`);
            } else {
              console.log(`⏭️ Maintenance notification skipped (user preferences): ${notificationLevel}%`);
            }
          } catch (error) {
            console.error('❌ Errore invio notifica manutenzione:', error);
          }
        }
      }
    }

    const fanRes = await fetch(`${baseUrl}${STOVE_ROUTES.getFan}`);
    const fanJson = await fanRes.json();
    const currentFanLevel = fanJson?.Result ?? 3;

    const powerRes = await fetch(`${baseUrl}${STOVE_ROUTES.getPower}`);
    const powerJson = await powerRes.json();
    const currentPowerLevel = powerJson?.Result ?? 2;

    // console.log(statusJson);
    // console.log(isOn);
    // console.log(currentFanLevel);
    // console.log(currentPowerLevel);
    // console.log(`Scheduler attivo: ${active ? 'SI' : 'NO'}`);
    // console.log(`Attivo: ${JSON.stringify(active)}`);

    let changeApplied = false;

    if (active) {
      if (!isOn) {
        // Check maintenance ONLY before scheduled ignition
        const maintenanceAllowed = await canIgnite();
        if (!maintenanceAllowed) {
          console.log('⚠️ Accensione schedulata bloccata - manutenzione richiesta');
          return Response.json({
            status: 'MANUTENZIONE_RICHIESTA',
            message: 'Accensione schedulata bloccata - manutenzione stufa richiesta',
            schedulerEnabled: true,
            giorno,
            ora
          });
        }

        await fetch(`${baseUrl}${STOVE_ROUTES.ignite}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({source: 'scheduler'}),
        });
        changeApplied = true;

        // Send notification
        await sendSchedulerNotification('IGNITE', `Stufa accesa automaticamente alle ${ora} (P${active.power}, V${active.fan})`);
      }
      if (currentPowerLevel !== active.power) {
        await fetch(`${baseUrl}${STOVE_ROUTES.setPower}`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({level: active.power, source: 'scheduler'}),
        });
        changeApplied = true;
      }
      if (currentFanLevel !== active.fan) {
        await fetch(`${baseUrl}${STOVE_ROUTES.setFan}`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({level: active.fan, source: 'scheduler'}),
        });
        changeApplied = true;
      }
    } else {
      if (isOn) {
        await fetch(`${baseUrl}${STOVE_ROUTES.shutdown}`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({source: 'scheduler'}),
        });
        changeApplied = true;

        // Send notification
        await sendSchedulerNotification('SHUTDOWN', `Stufa spenta automaticamente alle ${ora}`);
      }
    }

    // Se è stato applicato un cambio e eravamo in semi-manuale, torniamo in automatico
    if (changeApplied && modeData.semiManual) {
      await clearSemiManualMode();
      console.log('Cambio scheduler applicato - modalità semi-manuale disattivata');
    }

    return Response.json({
      status: active ? 'ACCESA' : 'SPENTA',
      schedulerEnabled: true,
      giorno,
      ora,
      activeSchedule: active || null,
    });
  } catch (error) {
    console.error('Errore nel cron:', error);
    return new Response('Errore interno', {status: 500});
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
