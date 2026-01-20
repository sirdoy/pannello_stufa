/**
 * Philips Hue Bridge Pairing Route
 * Create application key (requires link button press within 30 seconds)
 */

import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  parseJsonOrThrow,
  ERROR_CODES,
  error,
  HTTP_STATUS,
} from '@/lib/core';
import { createApplicationKey } from '@/lib/hue/hueApi';
import { saveHueConnection } from '@/lib/hue/hueLocalHelper';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (request) => {
  const { bridgeIp, bridgeId } = await parseJsonOrThrow(request);

  if (!bridgeIp) {
    return badRequest('Bridge IP obbligatorio');
  }

  try {
    // Create application key (requires link button press)
    const result = await createApplicationKey(bridgeIp);

    // Save to Firebase
    await saveHueConnection(
      bridgeIp,
      result.username,
      result.clientkey,
      bridgeId
    );

    return success({
      username: result.username,
    });
  } catch (err) {
    if (err.message === 'LINK_BUTTON_NOT_PRESSED') {
      return error(
        'Premi il pulsante sul bridge entro 30 secondi',
        ERROR_CODES.HUE_LINK_BUTTON_NOT_PRESSED,
        HTTP_STATUS.BAD_REQUEST
      );
    }
    throw err;
  }
}, 'Hue/Pair');
