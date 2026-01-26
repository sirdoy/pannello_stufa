# Automated Token Cleanup Setup

**Purpose:** Weekly automated cleanup of stale FCM tokens (>90 days inactive) using cron-job.org external cron service.

**Endpoint:** `/api/cron/cleanup-tokens`

---

## Overview

This setup enables zero-touch token hygiene through weekly automated cleanup of stale tokens, eliminating manual intervention and ensuring consistent delivery rates.

The endpoint uses HMAC-SHA256 signature verification for webhook security, which is more appropriate for external cron services compared to Bearer token authentication.

---

## Prerequisites

- Vercel deployment with `CRON_WEBHOOK_SECRET` environment variable configured
- Free cron-job.org account

---

## Step 1: Generate Webhook Secret

Generate a secure random string (32+ characters):

```bash
openssl rand -hex 32
```

Copy the output and add to Vercel Environment Variables as `CRON_WEBHOOK_SECRET`.

**Vercel Configuration:**

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add new variable:
   - Name: `CRON_WEBHOOK_SECRET`
   - Value: (paste the generated hex string)
   - Environments: Production (and Preview if testing)
4. Save and redeploy your application

---

## Step 2: Configure cron-job.org

### 2.1 Create Account

Create a free account at [https://cron-job.org/en/signup/](https://cron-job.org/en/signup/)

### 2.2 Create Cronjob

1. Navigate to "Create Cronjob" in the dashboard
2. Configure the job:

   **Basic Settings:**
   - **Title:** `Pannello Stufa Token Cleanup`
   - **URL:** `https://your-domain.vercel.app/api/cron/cleanup-tokens`
   - **Schedule:** Weekly, Sunday, 03:00 (any timezone)

   **Advanced Settings:**
   - **Request method:** `POST`
   - **Request body:** `{}` (empty JSON object)
   - **Content-Type:** `application/json`

### 2.3 Add HMAC Signature Header

**Important:** cron-job.org may not support dynamic HMAC generation. Use this workaround:

#### Pre-compute the HMAC signature

Since the request body is always `{}`, we can pre-compute the signature:

```bash
SECRET="your-secret-here"  # Replace with your CRON_WEBHOOK_SECRET
BODY='{}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')
echo "Signature: $SIGNATURE"
```

#### Add as custom header

In the cron-job.org advanced settings:

1. Add custom header
2. **Header name:** `x-cron-signature`
3. **Header value:** (paste the computed signature from above)

**Example:**
```
x-cron-signature: abc123def456...
```

---

## Step 3: Test the Webhook

### Local Testing

Test locally with your `.env.local` file:

```bash
# Generate signature for empty body
SECRET="your-secret-here"  # Replace with your CRON_WEBHOOK_SECRET
BODY='{}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

# Test the endpoint
curl -X POST http://localhost:3000/api/cron/cleanup-tokens \
  -H "Content-Type: application/json" \
  -H "x-cron-signature: $SIGNATURE" \
  -d "$BODY"
```

**Expected response:**
```json
{
  "success": true,
  "tokensRemoved": 0,
  "tokensScanned": 5,
  "errorsRemoved": 0,
  "executionMs": 234,
  "timestamp": "2026-01-26T12:00:00Z"
}
```

### Production Testing

Replace `localhost:3000` with your Vercel domain:

```bash
curl -X POST https://your-domain.vercel.app/api/cron/cleanup-tokens \
  -H "Content-Type: application/json" \
  -H "x-cron-signature: $SIGNATURE" \
  -d "$BODY"
```

### Test Invalid Signature

Verify that invalid signatures are rejected:

```bash
curl -X POST https://your-domain.vercel.app/api/cron/cleanup-tokens \
  -H "Content-Type: application/json" \
  -H "x-cron-signature: invalid-signature" \
  -d "{}"
```

**Expected response:**
```json
{
  "error": "Invalid signature"
}
```

---

## Step 4: Enable Monitoring

### cron-job.org Email Alerts

1. Go to cron-job.org dashboard
2. Edit your cronjob
3. Enable "Email notifications"
4. Configure:
   - **On failure:** Yes
   - **After N consecutive failures:** 2 (recommended)
   - **Email address:** Your admin email

### Vercel Function Logs

Monitor cleanup execution in Vercel:

1. Go to your Vercel project
2. Navigate to Deployments > Functions
3. Filter by `/api/cron/cleanup-tokens`
4. Review logs for:
   - `🧹 Starting automated token cleanup (cron trigger)...`
   - `✅ Token cleanup complete: X/Y tokens, Z errors (Nms)`
   - Any error messages

---

## Troubleshooting

### Issue: 401 Unauthorized

**Cause:** Invalid or missing HMAC signature

**Solution:**
1. Verify `CRON_WEBHOOK_SECRET` is set in Vercel
2. Regenerate signature using the exact secret from Vercel
3. Ensure cron-job.org header value matches the computed signature
4. Check for whitespace or encoding issues in the header value

### Issue: 500 Server Configuration Error

**Cause:** `CRON_WEBHOOK_SECRET` not configured in Vercel

**Solution:**
1. Add the environment variable in Vercel dashboard
2. Redeploy the application
3. Verify the variable is available in the production environment

### Issue: Cleanup executes but no tokens removed

**Cause:** No tokens are older than 90 days

**Solution:**
- This is normal for new installations
- Verify token ages in Firebase Realtime Database:
  - Navigate to `users/{userId}/fcmTokens`
  - Check `lastUsed` or `createdAt` timestamps
- To test cleanup logic, temporarily reduce threshold in code (development only)

### Issue: Cron job times out

**Cause:** Cleanup takes longer than 60 seconds (maxDuration)

**Solution:**
1. Check Vercel function logs for execution time
2. Verify Firebase Admin SDK is initialized correctly
3. Consider pagination for very large token databases (>1000 tokens)
4. Increase `maxDuration` in `route.ts` if needed (max 300s on Pro plan)

---

## Maintenance

### Verify Cleanup is Running

Check cron-job.org execution history:
1. Login to cron-job.org
2. View "Execution History" for your job
3. Verify weekly executions are successful (HTTP 200)

### Review Cleanup Statistics

Monitor cleanup effectiveness in Vercel logs:
- **tokensRemoved:** Number of stale tokens cleaned up
- **tokensScanned:** Total tokens checked
- **errorsRemoved:** Old error logs cleaned up
- **executionMs:** Performance metric (should be <10s for <500 tokens)

**Healthy metrics:**
- Execution time: <10 seconds for typical workloads
- Removal rate: 5-15% of scanned tokens (depends on user activity)
- Zero failures in cron-job.org history

---

## Security Notes

- **Never commit `CRON_WEBHOOK_SECRET` to git** - Use Vercel environment variables only
- **Use different secrets for development and production** - Generate separate values
- **Rotate secrets periodically** - Update both Vercel and cron-job.org configuration
- **Timing-safe comparison** - The endpoint uses `crypto.timingSafeEqual` to prevent timing attacks
- **No public endpoint** - HMAC signature prevents unauthorized cleanup triggers

---

## Alternative: Vercel Cron (Hobby/Pro Plan)

If you prefer Vercel's built-in cron over cron-job.org:

**vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-tokens",
      "schedule": "0 3 * * 0"
    }
  ]
}
```

**Note:** Vercel Cron:
- Requires Hobby or Pro plan (not free)
- No email alerts on failure
- Automatic HMAC signature via `x-vercel-signature` header (requires different verification)
- See: https://vercel.com/docs/cron-jobs

---

## Related Documentation

- [Firebase Admin SDK](../firebase.md) - Token management
- [Notification System Architecture](../architecture.md) - Phase 1 token lifecycle
- [API Routes Reference](../api-routes.md) - All notification endpoints

---

**Last updated:** 2026-01-26
**Phase:** 5 (Automation & Testing)
**Plan:** 05-02 (HMAC-Secured Cron Webhook)
