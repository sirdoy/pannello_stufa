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
  console.log('🔐 [Hue Remote Pair] Starting remote pairing...');

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

  console.log('✅ [Hue Remote Pair] Access token obtained');

  // Step 2: Enable link button mode via Remote API
  // This tells the cloud that we want to pair (user must have pressed physical button)
  console.log('🔗 [Hue Remote Pair] Enabling link button mode...');

  try {
    const linkButtonResponse = await fetch(`${HUE_REMOTE_BASE}/bridge/0/config`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ linkbutton: true }),
    });

    const linkButtonData = await linkButtonResponse.json();
    console.log('📥 [Hue Remote Pair] Link button response:', JSON.stringify(linkButtonData));

    // The response might be an array with success/error objects
    if (Array.isArray(linkButtonData)) {
      const hasError = linkButtonData.find(item => item.error);
      if (hasError) {
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
  } catch (err) {
    console.error('❌ [Hue Remote Pair] Link button request failed:', err);
    return error(
      'Errore di comunicazione con il cloud Hue',
      ERROR_CODES.NETWORK_ERROR,
      HTTP_STATUS.BAD_GATEWAY
    );
  }

  // Step 3: Create username (application key) via Remote API
  console.log('🔑 [Hue Remote Pair] Creating application key...');

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

    const createUserData = await createUserResponse.json();
    console.log('📥 [Hue Remote Pair] Create user response:', JSON.stringify(createUserData));

    // Parse response - should be array with success containing username
    if (Array.isArray(createUserData) && createUserData.length > 0) {
      const successItem = createUserData.find(item => item.success);
      const errorItem = createUserData.find(item => item.error);

      if (errorItem) {
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

      if (successItem && successItem.success.username) {
        const username = successItem.success.username;
        const clientkey = successItem.success.clientkey || null;

        console.log('✅ [Hue Remote Pair] Username created:', username.substring(0, 8) + '...');

        // Step 4: Save username to Firebase
        const hueRef = ref(db, getEnvironmentPath('hue'));
        await update(hueRef, {
          username,
          clientkey,
          remote_paired_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        console.log('✅ [Hue Remote Pair] Username saved to Firebase');

        // Update connection mode to 'remote' (since we paired via cloud)
        await setConnectionMode('remote');
        console.log('✅ [Hue Remote Pair] Connection mode set to remote');

        console.log('🎉 [Hue Remote Pair] Remote pairing completed successfully!');

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

  } catch (err) {
    console.error('❌ [Hue Remote Pair] Create user request failed:', err);
    return error(
      'Errore di comunicazione con il cloud Hue',
      ERROR_CODES.NETWORK_ERROR,
      HTTP_STATUS.BAD_GATEWAY
    );
  }
}, 'Hue/Remote/Pair');
