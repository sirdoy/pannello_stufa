# Firestore Index Deployment Guide

**Issue:** Composite indexes defined in `firestore.indexes.json` are not automatically deployed to Firebase. They must be manually deployed using Firebase CLI.

## Prerequisites

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase project** (if not already done):
   ```bash
   firebase init firestore
   # Select existing project: pannellostufa
   # Keep default firestore.rules and firestore.indexes.json
   ```

## Deploy Indexes

**Option 1: Deploy only indexes** (recommended - fast, no risk to other resources):
```bash
firebase deploy --only firestore:indexes
```

**Option 2: Deploy all Firestore config** (includes rules + indexes):
```bash
firebase deploy --only firestore
```

## Verification

After deployment, indexes will build in the background. Check status:

1. **Firebase Console**:
   - Go to https://console.firebase.google.com/project/pannellostufa/firestore/indexes
   - Wait for all indexes to show "Enabled" with green checkmark
   - Usually takes 1-5 minutes depending on existing data volume

2. **Test the query**:
   ```bash
   # Navigate to /settings/notifications/history in the app
   # API call should now succeed without "index required" error
   ```

## Current Index Definitions

From `firestore.indexes.json`:

### Base Query Index
- **Collection**: `notificationLogs`
- **Fields**: `userId` (ASC), `timestamp` (DESC)
- **Used by**: Base notification history query with 90-day filter

### Type Filter Index
- **Collection**: `notificationLogs`
- **Fields**: `userId` (ASC), `type` (ASC), `timestamp` (DESC)
- **Used by**: Notification history filtered by type (scheduler, error, etc.)

### Status Filter Index
- **Collection**: `notificationLogs`
- **Fields**: `userId` (ASC), `status` (ASC), `timestamp` (DESC)
- **Used by**: Notification history filtered by status (sent, delivered, failed)

## Why This Happened

The `firestore.indexes.json` file was created during Phase 4 planning, but Firebase doesn't auto-deploy local index definitions. The indexes must be explicitly deployed via Firebase CLI.

**Manual index creation via console link is temporary** - it only creates that specific index for that query. Other queries with different filter combinations will fail until all indexes from `firestore.indexes.json` are deployed.

## Future Prevention

After any updates to `firestore.indexes.json`, run:
```bash
firebase deploy --only firestore:indexes
```

This ensures Firebase knows about all required indexes.
