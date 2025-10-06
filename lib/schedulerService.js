// lib/schedulerService.js
import { ref, set, get } from 'firebase/database';
import { db } from './firebase';

/**
 * Helper per creare una Date UTC da componenti in timezone Europe/Rome
 * Questo garantisce che tutti gli orari siano gestiti consistentemente
 * indipendentemente dal timezone del server
 */
function createDateInRomeTimezone(baseDate, targetHour, targetMinute) {
  // Ottieni i componenti della data base in timezone Europe/Rome
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(baseDate);
  const day = parseInt(parts.find(p => p.type === 'day').value);
  const month = parseInt(parts.find(p => p.type === 'month').value);
  const year = parseInt(parts.find(p => p.type === 'year').value);

  // Crea una stringa ISO per il target time in formato neutro
  const targetDateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${targetHour.toString().padStart(2, '0')}:${targetMinute.toString().padStart(2, '0')}:00`;

  // Crea una data interpretandola come UTC temporaneamente
  const tempDate = new Date(targetDateStr + 'Z');

  // Trova l'offset tra Rome e UTC per questa data specifica
  // Creiamo una data e vediamo che ora è in Rome vs UTC
  const romeTimeStr = tempDate.toLocaleString('en-GB', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const utcTimeStr = tempDate.toLocaleString('en-GB', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // Parse le ore
  const romeHour = parseInt(romeTimeStr.split(', ')[1].split(':')[0]);
  const utcHour = parseInt(utcTimeStr.split(', ')[1].split(':')[0]);

  // Calcola l'offset in ore (Rome è UTC+1 o UTC+2 con DST)
  let offsetHours = romeHour - utcHour;

  // Gestisci il wraparound della giornata
  if (offsetHours > 12) offsetHours -= 24;
  if (offsetHours < -12) offsetHours += 24;

  // Crea la data corretta sottraendo l'offset
  const correctUTCDate = new Date(tempDate);
  correctUTCDate.setUTCHours(correctUTCDate.getUTCHours() - offsetHours);

  return correctUTCDate;
}

// Helper per calcolare il prossimo cambio di scheduler
export const getNextScheduledChange = async () => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const currentDay = formatter.formatToParts(now).find(p => p.type === 'weekday').value;
    const currentDayCapitalized = currentDay.charAt(0).toUpperCase() + currentDay.slice(1);
    const currentHour = parseInt(formatter.formatToParts(now).find(p => p.type === 'hour').value);
    const currentMinute = parseInt(formatter.formatToParts(now).find(p => p.type === 'minute').value);
    const currentMinutes = currentHour * 60 + currentMinute;

    // Cerca nel giorno corrente
    const todaySnapshot = await get(ref(db, `stoveScheduler/${currentDayCapitalized}`));
    if (todaySnapshot.exists()) {
      const intervals = todaySnapshot.val();

      // Cerca prossimo start o end oggi
      for (const interval of intervals) {
        const [startH, startM] = interval.start.split(':').map(Number);
        const [endH, endM] = interval.end.split(':').map(Number);
        const startMin = startH * 60 + startM;
        const endMin = endH * 60 + endM;

        if (startMin > currentMinutes) {
          // Prossimo start oggi
          const changeDate = createDateInRomeTimezone(now, startH, startM);
          return changeDate.toISOString();
        }

        if (endMin > currentMinutes && startMin <= currentMinutes) {
          // Siamo dentro un intervallo, prossimo cambio è la fine
          const changeDate = createDateInRomeTimezone(now, endH, endM);
          return changeDate.toISOString();
        }
      }
    }

    // Se non c'è niente oggi, cerca nei prossimi 7 giorni
    const currentDayIndex = dayNames.indexOf(currentDayCapitalized);
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (currentDayIndex + i) % 7;
      const nextDay = dayNames[nextDayIndex];

      const daySnapshot = await get(ref(db, `stoveScheduler/${nextDay}`));
      if (daySnapshot.exists()) {
        const intervals = daySnapshot.val();
        if (intervals && intervals.length > 0) {
          // Prendi il primo intervallo del giorno
          const [startH, startM] = intervals[0].start.split(':').map(Number);
          // Crea una data per il giorno futuro
          const futureDate = new Date(now);
          futureDate.setDate(futureDate.getDate() + i);
          const changeDate = createDateInRomeTimezone(futureDate, startH, startM);
          return changeDate.toISOString();
        }
      }
    }

    // Se non c'è nessuno scheduler nei prossimi 7 giorni, ritorna null
    return null;
  } catch (error) {
    console.error('Errore nel calcolo del prossimo cambio scheduler:', error);
    return null;
  }
};

// Helper per calcolare il prossimo cambio di scheduler con dettagli azione
export const getNextScheduledAction = async () => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    const currentDay = formatter.formatToParts(now).find(p => p.type === 'weekday').value;
    const currentDayCapitalized = currentDay.charAt(0).toUpperCase() + currentDay.slice(1);
    const currentHour = parseInt(formatter.formatToParts(now).find(p => p.type === 'hour').value);
    const currentMinute = parseInt(formatter.formatToParts(now).find(p => p.type === 'minute').value);
    const currentMinutes = currentHour * 60 + currentMinute;

    // Cerca nel giorno corrente
    const todaySnapshot = await get(ref(db, `stoveScheduler/${currentDayCapitalized}`));
    if (todaySnapshot.exists()) {
      const intervals = todaySnapshot.val();

      // Cerca prossimo start o end oggi
      for (const interval of intervals) {
        const [startH, startM] = interval.start.split(':').map(Number);
        const [endH, endM] = interval.end.split(':').map(Number);
        const startMin = startH * 60 + startM;
        const endMin = endH * 60 + endM;

        if (startMin > currentMinutes) {
          // Prossimo start oggi
          const changeDate = createDateInRomeTimezone(now, startH, startM);
          return {
            timestamp: changeDate.toISOString(),
            action: 'ignite',
            power: interval.power,
            fan: interval.fan,
          };
        }

        if (endMin > currentMinutes && startMin <= currentMinutes) {
          // Siamo dentro un intervallo, prossimo cambio è la fine
          const changeDate = createDateInRomeTimezone(now, endH, endM);
          return {
            timestamp: changeDate.toISOString(),
            action: 'shutdown',
          };
        }
      }
    }

    // Se non c'è niente oggi, cerca nei prossimi 7 giorni
    const currentDayIndex = dayNames.indexOf(currentDayCapitalized);
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (currentDayIndex + i) % 7;
      const nextDay = dayNames[nextDayIndex];

      const daySnapshot = await get(ref(db, `stoveScheduler/${nextDay}`));
      if (daySnapshot.exists()) {
        const intervals = daySnapshot.val();
        if (intervals && intervals.length > 0) {
          // Prendi il primo intervallo del giorno
          const firstInterval = intervals[0];
          const [startH, startM] = firstInterval.start.split(':').map(Number);
          // Crea una data per il giorno futuro
          const futureDate = new Date(now);
          futureDate.setDate(futureDate.getDate() + i);
          const changeDate = createDateInRomeTimezone(futureDate, startH, startM);
          return {
            timestamp: changeDate.toISOString(),
            action: 'ignite',
            power: firstInterval.power,
            fan: firstInterval.fan,
          };
        }
      }
    }

    // Se non c'è nessuno scheduler nei prossimi 7 giorni, ritorna null
    return null;
  } catch (error) {
    console.error('Errore nel calcolo del prossimo cambio scheduler:', error);
    return null;
  }
};

export const saveSchedule = async (day, intervals) => {
  try {
    await set(ref(db, `stoveScheduler/${day}`), intervals);
    console.log(`Scheduler salvato per ${day}`);
  } catch (error) {
    console.error('Errore nel salvataggio scheduler:', error);
  }
};

export const getSchedule = async (day) => {
  try {
    const snapshot = await get(ref(db, `stoveScheduler/${day}`));
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return [];
    }
  } catch (error) {
    console.error('Errore nel recupero scheduler:', error);
    return [];
  }
};


export const getWeeklySchedule = async () => {
  try {
    const snapshot = await get(ref(db, `stoveScheduler`));
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return {};
    }
  } catch (error) {
    console.error('Errore nel recupero completo scheduler:', error);
    return {};
  }
};

export const setSchedulerMode = async (enabled) => {
  try {
    await set(ref(db, `stoveScheduler/mode`), {
      enabled: enabled,
      lastUpdated: new Date().toISOString()
    });
    console.log(`Modalità scheduler impostata su: ${enabled ? 'attiva' : 'disattiva'}`);
  } catch (error) {
    console.error('Errore nel salvataggio modalità scheduler:', error);
  }
};

export const getSchedulerMode = async () => {
  try {
    const snapshot = await get(ref(db, `stoveScheduler/mode`));
    if (snapshot.exists()) {
      return snapshot.val().enabled;
    } else {
      return false; // Default: modalità manuale
    }
  } catch (error) {
    console.error('Errore nel recupero modalità scheduler:', error);
    return false;
  }
};

export const getFullSchedulerMode = async () => {
  try {
    const snapshot = await get(ref(db, `stoveScheduler/mode`));
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return { enabled: false, semiManual: false }; // Default
    }
  } catch (error) {
    console.error('Errore nel recupero modalità scheduler completa:', error);
    return { enabled: false, semiManual: false };
  }
};

export const setSemiManualMode = async (nextScheduledChange) => {
  try {
    const currentMode = await getFullSchedulerMode();
    await set(ref(db, `stoveScheduler/mode`), {
      enabled: currentMode.enabled,
      semiManual: true,
      semiManualActivatedAt: new Date().toISOString(),
      returnToAutoAt: nextScheduledChange,
      lastUpdated: new Date().toISOString()
    });
    console.log(`Modalità semi-manuale attivata. Ritorno automatico previsto: ${nextScheduledChange}`);
  } catch (error) {
    console.error('Errore nell\'attivazione modalità semi-manuale:', error);
  }
};

export const clearSemiManualMode = async () => {
  try {
    const currentMode = await getFullSchedulerMode();
    await set(ref(db, `stoveScheduler/mode`), {
      enabled: currentMode.enabled,
      semiManual: false,
      lastUpdated: new Date().toISOString()
    });
    console.log('Modalità semi-manuale disattivata. Ritorno in automatico.');
  } catch (error) {
    console.error('Errore nella disattivazione modalità semi-manuale:', error);
  }
};
