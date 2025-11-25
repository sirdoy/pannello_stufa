import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import NETATMO_API from '@/lib/netatmoApi';
import { getSession } from '@auth0/nextjs-auth0';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';

// Force dynamic rendering for Firebase operations
export const dynamic = 'force-dynamic';

/**
 * POST /api/netatmo/calibrate
 * Triggers valve calibration by syncing the current schedule
 * This forces all valves in the system to recalibrate
 *
 * The Netatmo API doesn't have a dedicated calibration endpoint.
 * Calibration is triggered automatically when:
 * 1. A valve is installed
 * 2. The schedule is synced via synchomeschedule
 *
 * This endpoint uses method #2 to force calibration on demand.
 */
export async function POST(request) {
  try {
    const session = await getSession();
    const user = session?.user;

    if (!user) {
      return Response.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // ✅ Get valid access token using centralized helper (auto-refresh)
    const { accessToken, error, message } = await getValidAccessToken();
    if (error) {
      const { status, reconnect } = handleTokenError(error);
      return Response.json({ error: message, reconnect }, { status });
    }

    // Get home_id from Firebase
    const homeIdSnap = await get(ref(db, 'netatmo/home_id'));
    if (!homeIdSnap.exists()) {
      return Response.json({
        error: 'home_id non trovato. Chiama prima /api/netatmo/homesdata'
      }, { status: 400 });
    }
    const homeId = homeIdSnap.val();

    // Get homes data directly from Netatmo API to get complete schedule structure
    const homesData = await NETATMO_API.getHomesData(accessToken);

    if (!homesData || homesData.length === 0) {
      return Response.json({
        error: 'Nessuna casa trovata nell\'account Netatmo'
      }, { status: 404 });
    }

    const home = homesData[0]; // Usually single home
    const schedules = home.schedules || [];

    // Find the currently selected schedule
    const currentSchedule = schedules.find(s => s.selected === true);

    if (!currentSchedule) {
      return Response.json({
        error: 'Nessuno schedule attivo trovato'
      }, { status: 400 });
    }

    console.log('🔧 Triggering valve calibration via synchomeschedule');
    console.log('🏠 Home ID:', homeId);
    console.log('📅 Schedule ID:', currentSchedule.id);
    console.log('📅 Schedule Name:', currentSchedule.name);
    console.log('📋 Zones:', JSON.stringify(currentSchedule.zones, null, 2));
    console.log('📋 Timetable:', JSON.stringify(currentSchedule.timetable, null, 2));

    // Validate that zones and timetable exist
    if (!currentSchedule.zones || !Array.isArray(currentSchedule.zones)) {
      return Response.json({
        error: 'Schedule zones non valido',
        details: `zones is ${typeof currentSchedule.zones}`
      }, { status: 400 });
    }

    if (!currentSchedule.timetable || !Array.isArray(currentSchedule.timetable)) {
      return Response.json({
        error: 'Schedule timetable non valido',
        details: `timetable is ${typeof currentSchedule.timetable}`
      }, { status: 400 });
    }

    // ALTERNATIVE APPROACH: Force calibration by switching schedules
    // Netatmo valves calibrate automatically when schedule configuration changes
    // We'll switch to a different schedule (if available) and back to trigger recalibration

    console.log('🔧 Available schedules:', schedules.length);

    if (schedules.length < 2) {
      return Response.json({
        error: 'Calibrazione automatica richiede almeno 2 schedule configurati',
        details: 'Crea uno schedule secondario in Netatmo app per permettere la calibrazione'
      }, { status: 400 });
    }

    // Find another schedule (not the current one)
    const alternativeSchedule = schedules.find(s => s.id !== currentSchedule.id);

    console.log('🔄 Switching to alternative schedule:', alternativeSchedule.name);

    // Switch to alternative schedule
    const switched1 = await NETATMO_API.switchHomeSchedule(accessToken, homeId, alternativeSchedule.id);

    if (!switched1) {
      return Response.json({
        error: 'Errore durante cambio schedule',
        details: 'switchhomeschedule to alternative failed'
      }, { status: 500 });
    }

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('🔄 Switching back to original schedule:', currentSchedule.name);

    // Switch back to original schedule - this triggers calibration
    const switched2 = await NETATMO_API.switchHomeSchedule(accessToken, homeId, currentSchedule.id);

    if (!switched2) {
      return Response.json({
        error: 'Errore durante ripristino schedule',
        details: 'switchhomeschedule back to original failed'
      }, { status: 500 });
    }

    console.log('✅ Valve calibration triggered successfully');

    // Log action
    const logEntry = {
      action: 'netatmo_calibrate_valves',
      schedule_id: currentSchedule.id,
      schedule_name: currentSchedule.name || 'Unknown',
      timestamp: Date.now(),
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture,
        sub: user.sub,
      },
      source: 'manual',
    };

    const { push, ref: dbRef } = await import('firebase/database');
    await push(dbRef(db, 'log'), logEntry);

    // Track calibration in Firebase
    const calibrationEntry = {
      timestamp: Date.now(),
      schedule_id: currentSchedule.id,
      schedule_name: currentSchedule.name || 'Unknown',
      triggered_by: user.email,
      status: 'success',
    };
    await push(dbRef(db, 'netatmo/calibrations'), calibrationEntry);

    return Response.json({
      success: true,
      message: 'Calibrazione valvole avviata con successo',
      schedule_name: currentSchedule.name || 'Unknown',
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('❌ Error in /api/netatmo/calibrate:', err);
    console.error('❌ Error stack:', err.stack);

    // Log failed calibration
    try {
      const { push, ref: dbRef } = await import('firebase/database');
      const session = await getSession();
      const user = session?.user;

      if (user) {
        const calibrationEntry = {
          timestamp: Date.now(),
          triggered_by: user.email,
          status: 'failed',
          error: err.message,
        };
        await push(dbRef(db, 'netatmo/calibrations'), calibrationEntry);
      }
    } catch (logError) {
      console.error('❌ Failed to log calibration error:', logError);
    }

    return Response.json({
      error: err.message || 'Errore server',
      details: err.stack,
    }, { status: 500 });
  }
}
