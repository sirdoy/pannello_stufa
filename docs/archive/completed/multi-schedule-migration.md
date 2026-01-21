# Multi-Schedule System Migration Guide

**Version**: 1.34.0
**Date**: 2026-01-02
**Status**: Ready for deployment

## Overview

This document describes the migration from single-schedule (`/stoveScheduler`) to multi-schedule system (`/schedules-v2`).

## What Changed

### Before (v1.33.0)
```
/stoveScheduler
  /Lunedì: [intervals]
  /Martedì: [intervals]
  ...
  /mode: { enabled, semiManual, ... }
```

### After (v1.34.0)
```
/schedules-v2
  /schedules
    /{scheduleId}
      name: string
      enabled: boolean
      slots: { Lunedì: [...], Martedì: [...], ... }
      createdAt: ISO timestamp
      updatedAt: ISO timestamp
  /activeScheduleId: string
  /mode: { enabled, semiManual, ... }
```

## Migration Steps

### Step 1: Pre-Migration Checklist

- [ ] Backup Firebase Realtime Database (export `/stoveScheduler` node)
- [ ] Verify all environment variables are set (`.env`)
- [ ] Test migration script in development/staging first
- [ ] Review rollback procedure below

### Step 2: Run Migration Script

**Option A: Via API Route** (Recommended)

Create temporary API route:

```javascript
// app/api/admin/migrate/route.js
import { NextResponse } from 'next/server';
import { migrateSchedulesToV2 } from '@/lib/migrateSchedules';

export async function POST(request) {
  const result = await migrateSchedulesToV2();
  return NextResponse.json(result);
}
```

Then call:
```bash
curl -X POST https://your-domain.com/api/admin/migrate
```

**Option B: Via Firebase Functions**

Deploy as Firebase Function and trigger once.

**Option C: Via npm script** (Local/Development - Recommended for testing)

```bash
# Dry run first (safe - no writes to Firebase)
npm run migrate:schedules:dry-run

# Actual migration
npm run migrate:schedules

# With options
node scripts/migrate-schedules.mjs --dry-run  # Simulate
node scripts/migrate-schedules.mjs --force    # Skip confirmation
```

**Option D: Via Node REPL** (if you have access to production environment)

```bash
node --input-type=module -e "
import { migrateSchedulesToV2 } from './lib/migrateSchedules.js';
const result = await migrateSchedulesToV2();
console.log(JSON.stringify(result, null, 2));
process.exit(result.success ? 0 : 1);
"
```

Note: This requires environment variables to be loaded. Use Option C instead (loads .env.local automatically).

### Step 3: Verify Migration

Check Firebase Console:

1. `/schedules-v2/schedules/default` exists with all intervals
2. `/schedules-v2/activeScheduleId` === "default"
3. `/schedules-v2/mode` matches old `/stoveScheduler/mode`
4. Interval counts match (compare v1 vs v2)

### Step 4: Deploy Application Code

```bash
# Commit changes
git add .
git commit -m "feat: multi-schedule system (v1.34.0)"

# Deploy to production
# (deployment commands depend on your hosting)
vercel --prod
# OR
git push origin main  # if using auto-deploy
```

### Step 5: Test in Production

- [ ] Open scheduler page - loads without errors
- [ ] Existing intervals display correctly
- [ ] Cron job runs and reads correct schedule
- [ ] Mode toggle works
- [ ] Schedule edits save correctly
- [ ] Multi-device sync works

## Safety Features

### Idempotent Migration
- Running migration multiple times is safe
- Script checks if `/schedules-v2` exists and skips if already migrated

### Zero Data Loss
- Migration only **reads** from `/stoveScheduler`
- Never deletes v1 data
- v1 structure remains intact for rollback

### Data Integrity Verification
- Automatic verification after migration
- Checks interval counts, mode settings, activeScheduleId
- Reports any mismatches

## Rollback Procedure

If migration fails or issues found:

### Step 1: Revert Code

```bash
git revert HEAD
git push origin main
```

### Step 2: Restore v1 Firebase Paths (if needed)

Run this script:

```javascript
// scripts/rollback-to-v1.js
import { adminDbGet, adminDbSet } from './lib/firebaseAdmin.js';

const days = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

// Copy default schedule back to v1
const defaultSchedule = await adminDbGet('schedules-v2/schedules/default');

for (const day of days) {
  await adminDbSet(`stoveScheduler/${day}`, defaultSchedule.slots[day] || []);
}

// Restore mode
const mode = await adminDbGet('schedules-v2/mode');
await adminDbSet('stoveScheduler/mode', mode);

console.log('✅ Rolled back to v1 structure');
```

### Step 3: Verify v1 Working

- Check `/stove/scheduler` page loads
- Check cron job executes
- Check all features work

### Step 4: Delete v2 (optional)

```javascript
await adminDbSet('schedules-v2', null);
```

**Rollback Time**: < 10 minutes
**Data Loss**: ZERO (v1 never deleted)

## API Changes

### New Endpoints

**List schedules**:
```
GET /api/schedules
Response: [{ id, name, enabled, createdAt, updatedAt, intervalCount }]
```

**Create schedule**:
```
POST /api/schedules
Body: { name: string, copyFromId?: string }
Response: { success: true, schedule: {...} }
```

**Get schedule**:
```
GET /api/schedules/[id]
Response: { id, name, enabled, slots, createdAt, updatedAt }
```

**Update schedule**:
```
PUT /api/schedules/[id]
Body: { name?, slots?, enabled? }
Response: { success: true, schedule: {...} }
```

**Delete schedule**:
```
DELETE /api/schedules/[id]
Response: { success: true, message: "..." }
Validations:
  - Cannot delete active schedule
  - Cannot delete last schedule
```

**Get active schedule ID**:
```
GET /api/schedules/active
Response: { activeScheduleId: "default" }
```

**Set active schedule**:
```
POST /api/schedules/active
Body: { scheduleId: string }
Response: { success: true, activeScheduleId, scheduleName, message }
```

### Updated Endpoints

**Save schedule (now operates on active schedule)**:
```
POST /api/scheduler/update
Body: { operation: "saveSchedule", data: { day, schedule } }
Behavior: Saves to active schedule's slots
```

**Cron job (now reads active schedule)**:
```
GET /api/scheduler/check?secret=xxx
Behavior: Reads from /schedules-v2/schedules/{activeId}/slots/{day}
```

## Cron Job Impact

The cron job has been updated to:

1. Read `activeScheduleId` first
2. Read intervals from `/schedules-v2/schedules/{activeId}/slots/{day}`
3. Execute scheduler logic as before

**No downtime expected** - migration can happen without stopping cron.

## Client-Side Changes

### Firebase Listeners

Updated to listen to:
- `/schedules-v2/activeScheduleId` (for active schedule changes)
- `/schedules-v2/schedules/{activeId}/slots` (for schedule data)

**Multi-device sync** still works - enhanced to handle active schedule switching.

### Backward Compatibility

- All existing scheduler functions work unchanged
- `getWeeklySchedule()`, `saveSchedule()`, etc. operate on active schedule
- User experience unchanged (single schedule view)

## Performance Impact

**Positive changes**:
- Centralized path resolution (cleaner code)
- Real-time listeners more efficient (targeted subscriptions)
- Active schedule switching is atomic

**No performance degradation expected** - same number of Firebase operations.

## Future Features (Not in v1.34.0)

The following features are **planned but not yet implemented**:

1. **UI for schedule management**:
   - Schedule selector dropdown
   - "Create New" button
   - "Set as Active" button
   - Schedule CRUD UI

2. **Schedule-specific components**:
   - ScheduleSelector component
   - CreateScheduleModal component
   - ScheduleCard component

3. **Copy schedule workflow**:
   - "Copy from existing" option fully functional via API
   - UI not yet built

**Current state**: Backend fully functional, UI still shows single schedule (active one).

## Testing Checklist

### Unit Tests
- [ ] schedulesService functions return correct data
- [ ] API routes handle CRUD operations
- [ ] Validation rules enforced (delete active, last schedule)
- [ ] Migration script handles edge cases

### Integration Tests
- [ ] Migration preserves all data
- [ ] Cron job reads from active schedule
- [ ] Multi-device sync works with v2 structure
- [ ] Active schedule switching is atomic

### Manual Testing
- [ ] Scheduler page loads
- [ ] Intervals display correctly
- [ ] Edit/add/delete intervals work
- [ ] Mode toggle works
- [ ] Cron executes on schedule
- [ ] No console errors

## Troubleshooting

### Migration fails with "already exists"
**Cause**: `/schedules-v2` already exists
**Solution**: This is safe - migration is idempotent, no action needed

### Migration fails with "credentials missing"
**Cause**: Firebase Admin SDK not initialized
**Solution**: Ensure `.env` has all Firebase Admin variables set

### Cron job fails after migration
**Cause**: Active schedule ID not set
**Solution**: Check `/schedules-v2/activeScheduleId` exists in Firebase

### Intervals not showing
**Cause**: Firebase listener not connected
**Solution**: Check browser console for errors, verify Firebase rules allow read

### Cannot delete schedule
**Cause**: Trying to delete active or last schedule
**Solution**: This is expected - activate another schedule first, or create new schedule

## Support

For issues:
1. Check Firebase Console for data integrity
2. Check browser console for client errors
3. Check server logs for API errors
4. Review this migration guide
5. Contact development team

## Version History

- **v1.34.0** (2026-01-02): Multi-schedule system with migration
- **v1.33.0** (2025-12-31): Single schedule system (legacy)

---

**Migration prepared by**: Chief Architect
**Documentation**: Complete
**Status**: Ready for production deployment
