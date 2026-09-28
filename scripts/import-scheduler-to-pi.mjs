#!/usr/bin/env node
/**
 * One-off import of the stove scheduler from Firebase to the Pi (workspace ROADMAP D2.6).
 *
 * Reads Firebase `schedules-v2` and `maintenance` (Admin SDK) and writes them to the
 * backend API (HA_API_URL + X-API-Key). The Pi scheduler is left DISABLED: enable it
 * (POST /scheduler/mode) only after the frontend without the Firebase scheduler is live.
 *
 * Usage (from frontend/):
 *   node --env-file=.env.local scripts/import-scheduler-to-pi.mjs            # dry run
 *   node --env-file=.env.local scripts/import-scheduler-to-pi.mjs --apply    # write
 *
 * Aborts if the Pi already has schedules (no duplicates, no merge).
 */
import { cert, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const APPLY = process.argv.includes('--apply');
const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

const { HA_API_URL, HA_API_KEY } = process.env;
if (!HA_API_URL || !HA_API_KEY) throw new Error('HA_API_URL / HA_API_KEY missing');

async function ha(method, path, body) {
  const res = await fetch(`${HA_API_URL}/api/v1/thermorossi${path}`, {
    method,
    headers: { 'X-API-Key': HA_API_KEY, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

const minutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

function toWeek(slots = {}) {
  const days = {};
  for (const [name, intervals] of Object.entries(slots)) {
    const index = DAYS.indexOf(name);
    if (index < 0) throw new Error(`Unknown day key: ${name}`);
    days[String(index)] = (intervals || [])
      .map((i) => ({ start_minutes: minutes(i.start), end_minutes: minutes(i.end), power: i.power, fan: i.fan }))
      .sort((a, b) => a.start_minutes - b.start_minutes);
  }
  return days;
}

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
});
const fb = getDatabase(app);
const read = async (path) => (await fb.ref(path).get()).val();

const source = await read('schedules-v2');
const maintenance = await read('maintenance');
const schedules = Object.entries(source?.schedules ?? {}).sort(
  ([, a], [, b]) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''))
);

const existing = await ha('GET', '/schedules');
if (existing.schedules.length > 0) {
  throw new Error(`Pi already has ${existing.schedules.length} schedule(s): aborting (no merge).`);
}

console.log(`Mode on Firebase: ${JSON.stringify(source?.mode)} (Pi will stay disabled)`);
console.log(`Active on Firebase: ${source?.activeScheduleId}`);
for (const [id, s] of schedules) {
  const week = toWeek(s.slots);
  const count = Object.values(week).reduce((n, d) => n + d.length, 0);
  console.log(`- ${id} "${s.name}": ${count} slots on ${Object.keys(week).length} days`);
}
const maintenanceBody = {
  current_hours: Number(maintenance.currentHours),
  target_hours: Number(maintenance.targetHours),
  ...(maintenance.lastCleanedAt
    ? { last_cleaned_at: Math.floor(Date.parse(maintenance.lastCleanedAt) / 1000) }
    : {}),
};
console.log(`Maintenance: ${JSON.stringify(maintenanceBody)}`);

if (!APPLY) {
  console.log('\nDry run: nothing written. Re-run with --apply.');
  process.exit(0);
}

await ha('POST', '/scheduler/mode', { enabled: false });
const idMap = {};
for (const [id, s] of schedules) {
  const created = await ha('POST', '/schedules', { name: s.name });
  const detail = await ha('PUT', `/schedules/${created.id}/week`, { days: toWeek(s.slots) });
  idMap[id] = created.id;
  console.log(`✓ "${s.name}" → id ${created.id} (${detail.interval_count} slots)`);
}
const activeId = idMap[source.activeScheduleId];
if (activeId) {
  await ha('PUT', `/schedules/${activeId}/active`);
  console.log(`✓ active schedule: ${activeId}`);
}
const m = await ha('PATCH', '/maintenance', maintenanceBody);
console.log(`✓ maintenance: ${JSON.stringify(m)}`);
console.log(`✓ mode: ${JSON.stringify(await ha('GET', '/scheduler/mode'))}`);
process.exit(0);
