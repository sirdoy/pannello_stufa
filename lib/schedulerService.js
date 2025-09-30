// lib/schedulerService.js
import { ref, set, get } from 'firebase/database';
import { db } from './firebase';

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
          const changeDate = new Date(now);
          changeDate.setHours(startH, startM, 0, 0);
          return changeDate.toISOString();
        }

        if (endMin > currentMinutes && startMin <= currentMinutes) {
          // Siamo dentro un intervallo, prossimo cambio è la fine
          const changeDate = new Date(now);
          changeDate.setHours(endH, endM, 0, 0);
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
          const changeDate = new Date(now);
          changeDate.setDate(changeDate.getDate() + i);
          changeDate.setHours(startH, startM, 0, 0);
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
