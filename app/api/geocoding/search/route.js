/**
 * Geocoding Search API
 *
 * GET /api/geocoding/search?q=Milano - Search for cities matching query
 *
 * Returns up to 5 city suggestions from Open-Meteo Geocoding API.
 * Protected: Requires Auth0 authentication.
 */

import { withAuthAndErrorHandler, success, badRequest } from '@/lib/core';

// Force dynamic rendering (server-side fetch to external API)
export const dynamic = 'force-dynamic';

/**
 * Fetch with retry logic for Open-Meteo API
 * @param {string} url - URL to fetch
 * @param {number} retries - Number of retries remaining (default 3)
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithRetry(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        return response;
      }

      // On non-OK response, only retry on 5xx errors
      if (response.status >= 500 && attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        continue;
      }

      return response;
    } catch (error) {
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        continue;
      }
      throw error;
    }
  }
}

/**
 * GET /api/geocoding/search
 * Search for cities matching the query string
 *
 * Query params:
 *   q: Search query (required, min 3 characters)
 *
 * Response:
 *   200: { success: true, results: [{ id, name, country, admin1, latitude, longitude, timezone }] }
 *   400: { success: false, error: "...", code: "..." }
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  // Validate query parameter exists
  if (!query) {
    return badRequest("Parametro 'q' richiesto");
  }

  // Validate minimum length
  if (query.trim().length < 3) {
    return badRequest('Inserisci almeno 3 caratteri');
  }

  try {
    // Build Open-Meteo Geocoding API URL
    const apiUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
    apiUrl.searchParams.set('name', query.trim());
    apiUrl.searchParams.set('count', '5');
    apiUrl.searchParams.set('language', 'it');
    apiUrl.searchParams.set('format', 'json');

    // Fetch from Open-Meteo with retry
    const response = await fetchWithRetry(apiUrl.toString());

    if (!response.ok) {
      // On API failure, return empty results (graceful degradation)
      console.error('[Geocoding/Search] Open-Meteo API error:', response.status);
      return success({ results: [] });
    }

    const data = await response.json();

    // Open-Meteo returns { results: [...] } or {} if no results
    const results = (data.results || []).map(result => ({
      id: result.id,
      name: result.name,
      country: result.country || null,
      admin1: result.admin1 || null,
      latitude: result.latitude,
      longitude: result.longitude,
      timezone: result.timezone || null,
    }));

    return success({ results });
  } catch (error) {
    // Log error for monitoring
    console.error('[Geocoding/Search] Error:', error.message || error);

    // Return empty results on fetch failure (graceful degradation)
    return success({ results: [] });
  }
}, 'Geocoding/Search');
