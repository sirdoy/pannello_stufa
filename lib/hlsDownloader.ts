/**
 * HLS Downloader - Downloads HLS streams and converts to MP4
 * Uses mux.js for TS → MP4 transmuxing (no re-encoding)
 */

/**
 * HLS segment
 */
interface HLSSegment {
  url: string;
  duration?: number;
}

/**
 * Check if m3u8 is a master playlist (contains stream variants)
 */
function isMasterPlaylist(content: string): boolean {
  return content.includes('#EXT-X-STREAM-INF');
}

/**
 * Get the best quality stream URL from master playlist
 */
function getBestStreamUrl(m3u8Content: string, baseUrl: string): string | null {
  const lines = m3u8Content.split('\n');
  let bestBandwidth = 0;
  let bestUrl = null;
  let nextLineIsUrl = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('#EXT-X-STREAM-INF')) {
      // Parse bandwidth
      const bandwidthMatch = trimmed.match(/BANDWIDTH=(\d+)/);
      const bandwidth = bandwidthMatch ? parseInt(bandwidthMatch[1], 10) : 0;

      if (bandwidth > bestBandwidth) {
        bestBandwidth = bandwidth;
        nextLineIsUrl = true;
      }
    } else if (nextLineIsUrl && trimmed && !trimmed.startsWith('#')) {
      bestUrl = trimmed.startsWith('http') ? trimmed : new URL(trimmed, baseUrl).href;
      nextLineIsUrl = false;
    }
  }

  return bestUrl;
}

/**
 * Parse M3U8 playlist and extract segment URLs
 */
function parseM3u8(m3u8Content: string, baseUrl: string): string[] {
  const lines = m3u8Content.split('\n');
  const segments: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines, comments, and tags
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Only include .ts files (skip .m3u8 references)
    if (trimmed.endsWith('.ts') || trimmed.includes('.ts?')) {
      if (trimmed.startsWith('http')) {
        segments.push(trimmed);
      } else {
        segments.push(new URL(trimmed, baseUrl).href);
      }
    }
  }

  return segments;
}

/**
 * Download HLS stream and convert to MP4
 * @param {string} hlsUrl - URL to the m3u8 playlist
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise<Blob>} MP4 blob
 */
export async function downloadHlsAsMP4(hlsUrl, onProgress = () => {}) {
  // Step 1: Fetch the m3u8 playlist
  onProgress(0, 'Caricamento playlist...');

  let currentUrl = hlsUrl;
  let m3u8Content;
  let baseUrl;

  // Handle master playlist → media playlist resolution
  for (let attempt = 0; attempt < 3; attempt++) {
    const m3u8Response = await fetch(currentUrl);
    if (!m3u8Response.ok) {
      throw new Error(`Failed to fetch playlist: ${m3u8Response.status}`);
    }

    m3u8Content = await m3u8Response.text();
    baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);

    console.log('[HLS Download] Playlist content:', m3u8Content.substring(0, 500));

    // Check if this is a master playlist
    if (isMasterPlaylist(m3u8Content)) {
      const streamUrl = getBestStreamUrl(m3u8Content, baseUrl);
      if (streamUrl) {
        console.log('[HLS Download] Master playlist detected, following to:', streamUrl);
        currentUrl = streamUrl;
        continue;
      }
    }

    // This is a media playlist, extract segments
    break;
  }

  const segmentUrls = parseM3u8(m3u8Content, baseUrl);
  console.log('[HLS Download] Found segment URLs:', segmentUrls.length, segmentUrls.slice(0, 3));

  if (segmentUrls.length === 0) {
    throw new Error('No segments found in playlist. Content: ' + m3u8Content.substring(0, 200));
  }

  // Step 2: Download all TS segments
  const segments = [];
  let totalBytes = 0;
  for (let i = 0; i < segmentUrls.length; i++) {
    const progress = Math.round((i / segmentUrls.length) * 70);
    onProgress(progress, `Download segmento ${i + 1}/${segmentUrls.length}...`);

    const response = await fetch(segmentUrls[i]);
    if (!response.ok) {
      throw new Error(`Failed to fetch segment ${i}: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    totalBytes += buffer.byteLength;
    segments.push(new Uint8Array(buffer));
  }

  console.log('[HLS Download] Downloaded segments:', segments.length, 'Total bytes:', totalBytes);

  // If segments are empty, throw error
  if (totalBytes === 0) {
    throw new Error('Downloaded segments are empty');
  }

  // Step 3: Concatenate TS segments directly
  onProgress(90, 'Creazione file video...');

  const tsData = new Uint8Array(totalBytes);
  let offset = 0;
  for (const segment of segments) {
    tsData.set(segment, offset);
    offset += segment.byteLength;
  }

  console.log('[HLS Download] Final TS size:', totalBytes);
  onProgress(100, 'Completato!');

  return new Blob([tsData], { type: 'video/mp2t' });
}

/**
 * Download HLS stream as video file
 * @param {string} hlsUrl - URL to the m3u8 playlist
 * @param {string} filename - Desired filename (without extension)
 * @param {function} onProgress - Progress callback (percent, message)
 */
export async function downloadHlsVideo(hlsUrl, filename, onProgress = () => {}) {
  try {
    const blob = await downloadHlsAsMP4(hlsUrl, onProgress);

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.ts`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('HLS download error:', error);
    throw error;
  }
}
