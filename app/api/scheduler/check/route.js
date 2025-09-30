import { get, ref } from 'firebase/database';
import { db } from '@/lib/firebase';
import { clearSemiManualMode } from '@/lib/schedulerService';
import { STOVE_ROUTES } from '@/lib/routes';

export async function GET(req) {
  try {
    const secret = req.nextUrl.searchParams.get('secret');
    if (secret !== process.env.CRON_SECRET) {
      return new Response('Unauthorized', {status: 401});
    }

    // Check if scheduler mode is enabled
    const modeSnapshot = await get(ref(db, `stoveScheduler/mode`));
    const modeData = modeSnapshot.exists() ? modeSnapshot.val() : { enabled: false, semiManual: false };
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

    const snapshot = await get(ref(db, `stoveScheduler/${giorno}`));
    if (!snapshot.exists()) {
      return Response.json({message: 'Nessuno scheduler', giorno, ora});
    }

    const intervals = snapshot.val();
    const active = intervals.find(({start, end}) => {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      return currentMinutes >= startMin && currentMinutes < endMin;
    });

    const baseUrl = `${req.nextUrl.protocol}//${req.headers.get('host')}`;
    console.log(baseUrl);


    const statusRes = await fetch(`${baseUrl}${STOVE_ROUTES.status}`);
    const statusJson = await statusRes.json();
    const isOn = statusJson?.StatusDescription?.includes('WORK') || statusJson?.StatusDescription?.includes('START');

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
        await fetch(`${baseUrl}${STOVE_ROUTES.ignite}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
        changeApplied = true;
      }
      if (currentPowerLevel !== active.power) {
        await fetch(`${baseUrl}${STOVE_ROUTES.setPower}`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({level: active.power}),
        });
        changeApplied = true;
      }
      if (currentFanLevel !== active.fan) {
        await fetch(`${baseUrl}${STOVE_ROUTES.setFan}`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({level: active.fan}),
        });
        changeApplied = true;
      }
    } else {
      if (isOn) {
        await fetch(`${baseUrl}${STOVE_ROUTES.shutdown}`, {method: 'POST'});
        changeApplied = true;
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
