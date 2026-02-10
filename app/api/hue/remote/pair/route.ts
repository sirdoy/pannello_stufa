/**
 * Hue Remote API - Remote Pairing Endpoint
 * Creates bridge username via Philips Hue Remote API (cloud)
 * Requires: OAuth tokens AND physical button press on bridge
 *
 * Flow:
 * 1. User presses physical button on bridge
 * 2. POST /api/hue/remote/pair is called
 * 3. PUT to Hue Remote API /bridge/0/config to enable link mode
 * 4. POST to Hue Remote API /bridge/ to create username
 * 5. Save username to Firebase
 */

import { withAuthAndErrorHandler, success, error, HTTP_STATUS, ERROR_CODES } from '@/lib/core';
import { getValidRemoteAccessToken, setConnectionMode } from '@/lib/hue/hueRemoteTokenHelper';
import { ref, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getEnvironmentPath } from '@/lib/environmentHelper';

export const dynamic = 'force-dynamic';

const HUE_REMOTE_BASE = 'https://api.meethue.com';
const APP_NAME = 'pannello-stufa';
const DEVICE_NAME = 'pwa-remote';

export const POST = withAuthAndErrorHandler(async () => {

  // Step 1: Get valid access token
  const { accessToken, error: tokenError, message } = await getValidRemoteAccessToken();

  if (tokenError || !accessToken) {
    console.error('❌ [Hue Remote Pair] Token error:', tokenError, message);
    return error(
      message || 'Non connesso al cloud Hue. Effettua prima il login OAuth.',
      ERROR_CODES.UNAUTHORIZED,
      HTTP_STATUS.UNAUTHORIZED
    );
  }


  // Step 2: Enable link button mode via Remote API
  // This tells the cloud that we want to pair (user must have pressed physical button)

  try {
    interface LinkButtonError {
      error?: {
        type: number;
        description?: string;
      };
    }

    const linkButtonResponse = await fetch(`${HUE_REMOTE_BASE}/bridge/0/config`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ linkbutton: true }),
    });

    const linkButtonData = await linkButtonResponse.json() as unknown;

    // The response might be an array with success/error objects
    if (Array.isArray(linkButtonData)) {
      const hasError = (linkButtonData as LinkButtonError[]).find(item => item.error);
      if (hasError && hasError.error) {
        console.error('❌ [Hue Remote Pair] Link button error:', hasError.error);
        // Error 101 = link button not pressed
        if (hasError.error.type === 101) {
          return error(
            'Premi il pulsante sul bridge Hue e riprova entro 30 secondi.',
            ERROR_CODES.HUE_LINK_BUTTON_NOT_PRESSED,
            HTTP_STATUS.BAD_REQUEST
          );
        }
        return error(
          hasError.error.description || 'Errore durante l\'abilitazione del link button',
          ERROR_CODES.HUE_ERROR,
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }
  } catch (err: unknown) {
    console.error('❌ [Hue Remote Pair] Link button request failed:', err instanceof Error ? err.message : 'Unknown error');
    return error(
      'Errore di comunicazione con il cloud Hue',
      ERROR_CODES.NETWORK_ERROR,
      HTTP_STATUS.BAD_GATEWAY
    );
  }

  // Step 3: Create username (application key) via Remote API

  try {
    const createUserResponse = await fetch(`${HUE_REMOTE_BASE}/bridge/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        devicetype: `${APP_NAME}#${DEVICE_NAME}`,
      }),
    });

    interface CreateUserResponse {
      success?: {
        username: string;
        clientkey?: string;
      };
      error?: {
        type: number;
        description?: string;
      };
    }

    const createUserData = await createUserResponse.json() as unknown;

    // Parse response - should be array with success containing username
    if (Array.isArray(createUserData) && createUserData.length > 0) {
      const successItem = (createUserData as CreateUserResponse[]).find(item => item.success);
      const errorItem = (createUserData as CreateUserResponse[]).find(item => item.error);

      if (errorItem && errorItem.error) {
        console.error('❌ [Hue Remote Pair] Create user error:', errorItem.error);

        // Error 101 = link button not pressed
        if (errorItem.error.type === 101) {
          return error(
            'Pulsante bridge non premuto. Premi il pulsante rotondo sul bridge e riprova entro 30 secondi.',
            ERROR_CODES.HUE_LINK_BUTTON_NOT_PRESSED,
            HTTP_STATUS.BAD_REQUEST
          );
        }

        return error(
          errorItem.error.description || 'Errore durante la creazione dell\'utente',
          ERROR_CODES.HUE_ERROR,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (successItem && successItem.success && successItem.success.username) {
        const username = successItem.success.username;
        const clientkey = successItem.success.clientkey || null;


        // Step 4: Save username to Firebase
        const hueRef = ref(db, getEnvironmentPath('hue'));
        await update(hueRef, {
          username,
          clientkey,
          remote_paired_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });


        // Update connection mode to 'remote' (since we paired via cloud)
        await setConnectionMode('remote');


        return success({
          paired: true,
          message: 'Bridge Hue connesso via cloud con successo!',
        });
      }
    }

    // Unexpected response format
    console.error('❌ [Hue Remote Pair] Unexpected response format:', createUserData);
    return error(
      'Risposta inattesa dal cloud Hue',
      ERROR_CODES.HUE_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );

  } catch (err: unknown) {
    console.error('❌ [Hue Remote Pair] Create user request failed:', err instanceof Error ? err.message : 'Unknown error');
    return error(
      'Errore di comunicazione con il cloud Hue',
      ERROR_CODES.NETWORK_ERROR,
      HTTP_STATUS.BAD_GATEWAY
    );
  }
}, 'Hue/Remote/Pair');
