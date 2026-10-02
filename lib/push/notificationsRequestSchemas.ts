/** Zod bodies for the /api/v1/notifications proxy routes (workspace ROADMAP M48). */

import { z } from 'zod';

const endpoint = z
  .string()
  .max(2000)
  .refine((v) => v.startsWith('https://'), { message: 'endpoint must be an https URL' });

export const pushSubscriptionBody = z.object({
  endpoint,
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),
});

export const subscribeBody = pushSubscriptionBody.extend({
  device_name: z.string().max(120).nullish(),
  user_agent: z.string().max(500).nullish(),
});

export const endpointBody = z.object({ endpoint });

export const rotateBody = z.object({
  old_endpoint: endpoint,
  subscription: pushSubscriptionBody,
});

export const testBody = z.object({
  subscription_id: z.number().int().positive().optional(),
});

export const historyQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
