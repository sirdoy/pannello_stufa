// lib/schedulerService.js
import { ref, set, get } from 'firebase/database';
import { db } from './firebase';

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
