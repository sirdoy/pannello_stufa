import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { saveCategoryOverride } from '@/lib/network/deviceCategories';
import type { DeviceCategory } from '@/types/firebase/network';

export const dynamic = 'force-dynamic';

const VALID_CATEGORIES: DeviceCategory[] = ['iot', 'mobile', 'pc', 'smart-home', 'unknown'];

export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await request.json() as { mac?: string; category?: string };

  if (!body.mac) {
    throw new ApiError(ERROR_CODES.VALIDATION_ERROR, 'Indirizzo MAC richiesto', HTTP_STATUS.BAD_REQUEST);
  }

  if (!body.category || !VALID_CATEGORIES.includes(body.category as DeviceCategory)) {
    throw new ApiError(
      ERROR_CODES.VALIDATION_ERROR,
      `Categoria non valida. Valori ammessi: ${VALID_CATEGORIES.join(', ')}`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  await saveCategoryOverride(body.mac, body.category as DeviceCategory);

  return success({ mac: body.mac, category: body.category, saved: true });
}, 'Network/CategoryOverride');
