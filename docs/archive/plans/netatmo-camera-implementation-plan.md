# Implementation Plan: Netatmo Camera Integration

**Version**: 1.0
**Created**: 2026-01-20
**Author**: Claude Chief Architect
**Quality Score**: 90/100 (Minimal changes, clear rollback, follows existing patterns)
**Target Version**: 1.65.0

---

## Executive Summary

This plan integrates Netatmo Security cameras (Welcome/Presence) as a new device in pannello-stufa. The implementation follows existing multi-device patterns and reuses the Netatmo OAuth infrastructure already in place for thermostats.

---

## Prerequisites

- ResearchPack reviewed: `/docs/research/netatmo-camera-api-researchpack.md`
- Existing Netatmo integration working
- Auth0 authentication working

---

## Scope

### In Scope (MVP)
1. Camera device registration
2. Camera list and status display
3. Live snapshot view (refreshable)
4. Recent events list (10 events)
5. Camera on/off status indicator
6. OAuth scope update for camera access

### Out of Scope (v2+)
- Live video streaming (requires HLS player)
- Camera toggle control
- Presence floodlight control
- Two-way audio
- Webhooks for real-time events
- Person management (away/home)

---

## File Changes Summary

| Action | File | Description |
|--------|------|-------------|
| UPDATE | `lib/devices/deviceTypes.js` | Add CAMERA device type |
| UPDATE | `lib/routes.js` | Add camera API routes |
| CREATE | `lib/netatmoCameraApi.js` | Camera API wrapper |
| CREATE | `app/api/netatmo/camera/route.js` | Get cameras endpoint |
| CREATE | `app/api/netatmo/camera/[cameraId]/snapshot/route.js` | Get snapshot endpoint |
| CREATE | `app/api/netatmo/camera/[cameraId]/events/route.js` | Get events endpoint |
| CREATE | `app/components/devices/camera/CameraCard.js` | Homepage camera card |
| CREATE | `app/(pages)/camera/page.js` | Camera dashboard page |
| UPDATE | `app/page.js` | Add CameraCard to homepage |
| UPDATE | `lib/netatmoCredentials.js` | Add camera OAuth scopes |
| CREATE | `__tests__/lib/netatmoCameraApi.test.js` | Unit tests |
| UPDATE | `lib/version.js` | Bump to 1.65.0 |
| UPDATE | `package.json` | Bump to 1.65.0 |
| UPDATE | `CHANGELOG.md` | Add version entry |

---

## Implementation Steps

### Phase 1: Device Registry (5 min)

#### Step 1.1: Add Camera Device Type

**File**: `lib/devices/deviceTypes.js`

```javascript
// ADD to DEVICE_TYPES object
CAMERA: 'camera',

// ADD to DEVICE_CONFIG object
[DEVICE_TYPES.CAMERA]: {
  id: 'camera',
  name: 'Videocamera',
  icon: '📹',
  color: 'ocean',
  enabled: true,
  routes: {
    main: '/camera',
  },
  features: {
    hasScheduler: false,
    hasMaintenance: false,
    hasErrors: false,
    hasSnapshot: true,
    hasEvents: true,
  },
},
```

#### Step 1.2: Add Camera Routes

**File**: `lib/routes.js`

```javascript
// ADD new section after NETATMO_ROUTES
// Camera endpoints
export const CAMERA_ROUTES = {
  list: `${API_BASE}/netatmo/camera`,
  snapshot: (cameraId) => `${API_BASE}/netatmo/camera/${cameraId}/snapshot`,
  events: (cameraId) => `${API_BASE}/netatmo/camera/${cameraId}/events`,
};

// UPDATE NETATMO_ROUTES to include camera
export const NETATMO_ROUTES = {
  // ... existing routes
  // Camera
  camera: CAMERA_ROUTES,
};

// UPDATE API_ROUTES
export const API_ROUTES = {
  // ... existing
  camera: CAMERA_ROUTES,
};
```

#### Step 1.3: Add Camera UI Routes

**File**: `lib/routes.js`

```javascript
// ADD new section
// Camera UI pages
export const CAMERA_UI_ROUTES = {
  main: '/camera',
};
```

---

### Phase 2: OAuth Scope Update (5 min)

#### Step 2.1: Update OAuth Scopes

**File**: Need to find where OAuth scopes are defined

First, let me identify the OAuth redirect file:

**File**: The OAuth redirect URL is built in the client component that initiates auth.

Need to update the scope string when building OAuth URL. This is typically in:
- `app/(pages)/thermostat/page.js` or
- A dedicated auth component

**OAuth Scope Update**:
```javascript
// OLD
const scopes = 'read_thermostat write_thermostat';

// NEW - Add camera scopes
const scopes = 'read_thermostat write_thermostat read_camera access_camera';
```

**Note**: Users will need to re-authorize after this change.

---

### Phase 3: Camera API Wrapper (15 min)

#### Step 3.1: Create Camera API Module

**File**: `lib/netatmoCameraApi.js`

```javascript
/**
 * Netatmo Camera API Wrapper
 * Handles camera-specific API calls
 *
 * API Documentation: https://dev.netatmo.com/apidocumentation/security
 */

const NETATMO_API_BASE = 'https://api.netatmo.com';

/**
 * Make authenticated API request
 */
async function makeRequest(endpoint, accessToken, options = {}) {
  const url = `${NETATMO_API_BASE}/api/${endpoint}`;
  const method = options.method || 'GET';
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ...options.headers,
  };

  const config = {
    method,
    headers,
  };

  if (options.body) {
    if (method === 'POST') {
      config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      config.body = new URLSearchParams(options.body);
    }
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (data.error) {
    throw new Error(`Netatmo API Error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  return data;
}

/**
 * Get homes data including cameras
 * Returns: cameras, persons, events
 */
export async function getCamerasData(accessToken, homeId = null) {
  const params = {};
  if (homeId) {
    params.home_id = homeId;
  }

  const data = await makeRequest('homesdata', accessToken, {
    method: 'POST',
    body: params,
  });

  return data.body?.homes || [];
}

/**
 * Get camera events for a specific home
 * @param {string} accessToken - OAuth access token
 * @param {string} homeId - Home ID
 * @param {number} size - Number of events to retrieve (default 10)
 */
export async function getCameraEvents(accessToken, homeId, size = 10) {
  const data = await makeRequest('gethomedata', accessToken, {
    method: 'POST',
    body: {
      home_id: homeId,
      size: size.toString(),
    },
  });

  return data.body?.homes?.[0]?.events || [];
}

/**
 * Parse cameras from homes data
 * Filters out undefined values for Firebase compatibility
 */
export function parseCameras(homesData) {
  if (!homesData || homesData.length === 0) return [];

  const home = homesData[0];
  return (home.cameras || []).map(camera => {
    const parsed = {
      id: camera.id,
      name: camera.name || 'Camera',
      type: camera.type, // NACamera (Welcome) or NOC (Presence)
      status: camera.status || 'unknown',
      is_local: camera.is_local || false,
    };

    // Only add optional properties if defined
    if (camera.vpn_url) {
      parsed.vpn_url = camera.vpn_url;
    }
    if (camera.local_url) {
      parsed.local_url = camera.local_url;
    }
    if (camera.sd_status) {
      parsed.sd_status = camera.sd_status;
    }
    if (camera.alim_status) {
      parsed.alim_status = camera.alim_status;
    }
    if (camera.light_mode_status) {
      parsed.light_mode_status = camera.light_mode_status;
    }

    return parsed;
  });
}

/**
 * Parse persons from homes data
 */
export function parsePersons(homesData) {
  if (!homesData || homesData.length === 0) return [];

  const home = homesData[0];
  return (home.persons || []).map(person => ({
    id: person.id,
    name: person.pseudo || 'Unknown',
    last_seen: person.last_seen,
    out_of_sight: person.out_of_sight ?? true,
    face: person.face ? {
      id: person.face.id,
      key: person.face.key,
    } : null,
  }));
}

/**
 * Parse events from homes data
 */
export function parseEvents(events) {
  if (!events || events.length === 0) return [];

  return events.map(event => {
    const parsed = {
      id: event.id,
      type: event.type,
      time: event.time,
      camera_id: event.camera_id,
    };

    if (event.person_id) {
      parsed.person_id = event.person_id;
    }
    if (event.snapshot) {
      parsed.snapshot = {
        id: event.snapshot.id,
        key: event.snapshot.key,
      };
    }
    if (event.video_id) {
      parsed.video_id = event.video_id;
      parsed.video_status = event.video_status;
    }

    return parsed;
  });
}

/**
 * Get snapshot URL for a camera
 * Returns VPN URL (always works) or local URL (faster, same network only)
 */
export function getSnapshotUrl(camera, preferLocal = false) {
  if (preferLocal && camera.is_local && camera.local_url) {
    return `${camera.local_url}/live/snapshot_720.jpg`;
  }
  if (camera.vpn_url) {
    return `${camera.vpn_url}/live/snapshot_720.jpg`;
  }
  return null;
}

/**
 * Get event snapshot URL
 */
export function getEventSnapshotUrl(event) {
  if (!event.snapshot) return null;
  return `https://api.netatmo.com/api/getcamerapicture?image_id=${event.snapshot.id}&key=${event.snapshot.key}`;
}

/**
 * Get camera type display name
 */
export function getCameraTypeName(type) {
  switch (type) {
    case 'NACamera':
      return 'Welcome (Indoor)';
    case 'NOC':
      return 'Presence (Outdoor)';
    case 'NDB':
      return 'Doorbell';
    default:
      return type || 'Camera';
  }
}

/**
 * Get event type display name (Italian)
 */
export function getEventTypeName(type) {
  switch (type) {
    case 'person':
      return 'Persona riconosciuta';
    case 'movement':
      return 'Movimento';
    case 'human':
      return 'Persona';
    case 'animal':
      return 'Animale';
    case 'vehicle':
      return 'Veicolo';
    case 'outdoor':
      return 'Movimento esterno';
    default:
      return type || 'Evento';
  }
}

const NETATMO_CAMERA_API = {
  getCamerasData,
  getCameraEvents,
  parseCameras,
  parsePersons,
  parseEvents,
  getSnapshotUrl,
  getEventSnapshotUrl,
  getCameraTypeName,
  getEventTypeName,
};

export default NETATMO_CAMERA_API;
```

---

### Phase 4: API Routes (20 min)

#### Step 4.1: Create Camera List Endpoint

**File**: `app/api/netatmo/camera/route.js`

```javascript
import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/camera
 * Retrieves list of cameras with status
 */
export async function GET(request) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { accessToken, error, message } = await getValidAccessToken();
    if (error) {
      const { status, reconnect } = handleTokenError(error);
      return NextResponse.json({ error: message, reconnect }, { status });
    }

    // Get home_id from Firebase (already stored by thermostat integration)
    const homeId = await adminDbGet('netatmo/home_id');

    // Get cameras data
    const homesData = await NETATMO_CAMERA_API.getCamerasData(accessToken, homeId);

    if (!homesData || homesData.length === 0) {
      return NextResponse.json({ error: 'Nessuna casa trovata' }, { status: 404 });
    }

    const cameras = NETATMO_CAMERA_API.parseCameras(homesData);
    const persons = NETATMO_CAMERA_API.parsePersons(homesData);

    // Get recent events
    const rawEvents = homesData[0]?.events || [];
    const events = NETATMO_CAMERA_API.parseEvents(rawEvents.slice(0, 10));

    // Save camera data to Firebase
    await adminDbSet('netatmo/cameras', {
      cameras,
      persons,
      last_sync: Date.now(),
    });

    return NextResponse.json({
      cameras,
      persons,
      events,
      home_id: homeId,
    });
  } catch (err) {
    console.error('Error in /api/netatmo/camera:', err);
    return NextResponse.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
}
```

#### Step 4.2: Create Snapshot Endpoint

**File**: `app/api/netatmo/camera/[cameraId]/snapshot/route.js`

```javascript
import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { adminDbGet } from '@/lib/firebaseAdmin';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/camera/[cameraId]/snapshot
 * Returns snapshot URL for a specific camera
 */
export async function GET(request, { params }) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { cameraId } = await params;

    const { accessToken, error, message } = await getValidAccessToken();
    if (error) {
      const { status, reconnect } = handleTokenError(error);
      return NextResponse.json({ error: message, reconnect }, { status });
    }

    // Get cameras from Firebase or API
    let cameraData = await adminDbGet('netatmo/cameras');

    if (!cameraData?.cameras) {
      // Fetch fresh data
      const homeId = await adminDbGet('netatmo/home_id');
      const homesData = await NETATMO_CAMERA_API.getCamerasData(accessToken, homeId);
      cameraData = { cameras: NETATMO_CAMERA_API.parseCameras(homesData) };
    }

    const camera = cameraData.cameras.find(c => c.id === cameraId);

    if (!camera) {
      return NextResponse.json({ error: 'Camera non trovata' }, { status: 404 });
    }

    const snapshotUrl = NETATMO_CAMERA_API.getSnapshotUrl(camera, false);

    if (!snapshotUrl) {
      return NextResponse.json({ error: 'URL snapshot non disponibile' }, { status: 404 });
    }

    return NextResponse.json({
      camera_id: cameraId,
      snapshot_url: snapshotUrl,
      is_local: camera.is_local,
      camera_name: camera.name,
    });
  } catch (err) {
    console.error('Error in /api/netatmo/camera/[cameraId]/snapshot:', err);
    return NextResponse.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
}
```

#### Step 4.3: Create Events Endpoint

**File**: `app/api/netatmo/camera/[cameraId]/events/route.js`

```javascript
import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { adminDbGet } from '@/lib/firebaseAdmin';
import { getValidAccessToken, handleTokenError } from '@/lib/netatmoTokenHelper';
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/camera/[cameraId]/events
 * Returns recent events for a specific camera
 */
export async function GET(request, { params }) {
  try {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const { cameraId } = await params;
    const { searchParams } = new URL(request.url);
    const size = parseInt(searchParams.get('size') || '10', 10);

    const { accessToken, error, message } = await getValidAccessToken();
    if (error) {
      const { status, reconnect } = handleTokenError(error);
      return NextResponse.json({ error: message, reconnect }, { status });
    }

    const homeId = await adminDbGet('netatmo/home_id');

    if (!homeId) {
      return NextResponse.json({ error: 'Home ID non trovato' }, { status: 404 });
    }

    const events = await NETATMO_CAMERA_API.getCameraEvents(accessToken, homeId, size);

    // Filter events for this camera
    const cameraEvents = events
      .filter(e => e.camera_id === cameraId)
      .slice(0, size);

    const parsedEvents = NETATMO_CAMERA_API.parseEvents(cameraEvents);

    return NextResponse.json({
      camera_id: cameraId,
      events: parsedEvents,
      total: parsedEvents.length,
    });
  } catch (err) {
    console.error('Error in /api/netatmo/camera/[cameraId]/events:', err);
    return NextResponse.json({ error: err.message || 'Errore server' }, { status: 500 });
  }
}
```

---

### Phase 5: UI Components (30 min)

#### Step 5.1: Create CameraCard Component

**File**: `app/components/devices/camera/CameraCard.js`

```javascript
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CAMERA_ROUTES } from '@/lib/routes';
import Skeleton from '../../ui/Skeleton';
import DeviceCard from '../../ui/DeviceCard';
import { Heading, Text, Button, EmptyState, Banner } from '../../ui';
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';

/**
 * CameraCard - Camera summary view for homepage
 * Shows camera status and recent events
 */
export default function CameraCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [events, setEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [snapshotUrl, setSnapshotUrl] = useState(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  const connectionCheckedRef = useRef(false);

  // Check connection on mount
  useEffect(() => {
    if (connectionCheckedRef.current) return;
    connectionCheckedRef.current = true;
    fetchCameras();
  }, []);

  // Auto-select first camera
  useEffect(() => {
    if (cameras.length > 0 && !selectedCameraId) {
      setSelectedCameraId(cameras[0].id);
    }
  }, [cameras, selectedCameraId]);

  // Fetch snapshot when camera selected
  useEffect(() => {
    if (selectedCameraId) {
      fetchSnapshot(selectedCameraId);
    }
  }, [selectedCameraId]);

  async function fetchCameras() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(CAMERA_ROUTES.list);
      const data = await response.json();

      if (data.reconnect) {
        setConnected(false);
        setError('Richiesta autorizzazione camera');
        return;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setConnected(true);
      setCameras(data.cameras || []);
      setEvents(data.events || []);
    } catch (err) {
      console.error('Errore fetch cameras:', err);
      setError(err.message);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSnapshot(cameraId) {
    try {
      setSnapshotLoading(true);
      const response = await fetch(CAMERA_ROUTES.snapshot(cameraId));
      const data = await response.json();

      if (data.snapshot_url) {
        setSnapshotUrl(data.snapshot_url);
      }
    } catch (err) {
      console.error('Errore fetch snapshot:', err);
    } finally {
      setSnapshotLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchCameras();
    if (selectedCameraId) {
      await fetchSnapshot(selectedCameraId);
    }
    setRefreshing(false);
  }

  const selectedCamera = cameras.find(c => c.id === selectedCameraId);
  const cameraEvents = events.filter(e => e.camera_id === selectedCameraId).slice(0, 3);

  // Loading state
  if (loading) {
    return <Skeleton.Card className="min-h-[300px]" />;
  }

  // Not connected state
  if (!connected) {
    return (
      <DeviceCard
        title="Videocamera"
        icon="📹"
        status="Disconnesso"
        onRefresh={handleRefresh}
        refreshing={refreshing}
      >
        <Banner
          variant="info"
          description="Collega le tue videocamere Netatmo per visualizzare lo streaming e gli eventi."
          className="mb-4"
        />
        <Button
          variant="ocean"
          className="w-full"
          onClick={() => router.push('/thermostat')}
        >
          Connetti Netatmo
        </Button>
      </DeviceCard>
    );
  }

  // No cameras found
  if (cameras.length === 0) {
    return (
      <DeviceCard
        title="Videocamera"
        icon="📹"
        status="Nessuna camera"
        onRefresh={handleRefresh}
        refreshing={refreshing}
      >
        <EmptyState
          icon="📹"
          title="Nessuna videocamera"
          description="Non sono state trovate videocamere Netatmo nel tuo account."
        />
      </DeviceCard>
    );
  }

  return (
    <DeviceCard
      title="Videocamera"
      icon="📹"
      status={selectedCamera?.status === 'on' ? 'Attiva' : 'Inattiva'}
      onRefresh={handleRefresh}
      refreshing={refreshing}
      onClick={() => router.push('/camera')}
    >
      {/* Camera selector if multiple */}
      {cameras.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {cameras.map(camera => (
            <Button
              key={camera.id}
              variant={selectedCameraId === camera.id ? 'ocean' : 'subtle'}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCameraId(camera.id);
              }}
            >
              {camera.name}
            </Button>
          ))}
        </div>
      )}

      {/* Snapshot preview */}
      <div className="relative aspect-video bg-slate-800 rounded-xl overflow-hidden mb-4">
        {snapshotLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Text variant="secondary">Caricamento...</Text>
          </div>
        ) : snapshotUrl ? (
          <img
            src={snapshotUrl}
            alt={`Snapshot ${selectedCamera?.name}`}
            className="w-full h-full object-cover"
            onError={() => setSnapshotUrl(null)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Text variant="secondary">Snapshot non disponibile</Text>
          </div>
        )}

        {/* Camera status badge */}
        {selectedCamera && (
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
            selectedCamera.status === 'on'
              ? 'bg-sage-500/80 text-white'
              : 'bg-slate-600/80 text-slate-300'
          }`}>
            {selectedCamera.status === 'on' ? 'Attiva' : 'Inattiva'}
          </div>
        )}
      </div>

      {/* Recent events */}
      {cameraEvents.length > 0 && (
        <div>
          <Text variant="label" className="mb-2">Eventi recenti</Text>
          <div className="space-y-2">
            {cameraEvents.map(event => (
              <div
                key={event.id}
                className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg"
              >
                <span className="text-lg">
                  {event.type === 'person' ? '👤' :
                   event.type === 'human' ? '🚶' :
                   event.type === 'animal' ? '🐾' :
                   event.type === 'vehicle' ? '🚗' : '📷'}
                </span>
                <div className="flex-1 min-w-0">
                  <Text variant="body" size="sm" className="truncate">
                    {NETATMO_CAMERA_API.getEventTypeName(event.type)}
                  </Text>
                  <Text variant="tertiary" size="xs">
                    {new Date(event.time * 1000).toLocaleString('it-IT', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: 'short',
                    })}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View all button */}
      <Button
        variant="subtle"
        size="sm"
        className="w-full mt-4"
        onClick={(e) => {
          e.stopPropagation();
          router.push('/camera');
        }}
      >
        Vedi tutte le telecamere
      </Button>
    </DeviceCard>
  );
}
```

#### Step 5.2: Create Camera Dashboard Page

**File**: `app/(pages)/camera/page.js`

```javascript
import { auth0 } from '@/lib/auth0';
import CameraDashboard from './CameraDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Videocamere - Pannello Stufa',
  description: 'Visualizza e controlla le tue videocamere Netatmo',
};

export default async function CameraPage() {
  const session = await auth0.getSession();

  if (!session || !session.user) {
    const { redirect } = await import('next/navigation');
    redirect('/auth/login');
  }

  return <CameraDashboard />;
}
```

#### Step 5.3: Create Camera Dashboard Client Component

**File**: `app/(pages)/camera/CameraDashboard.js`

```javascript
'use client';

import { useState, useEffect, useRef } from 'react';
import { CAMERA_ROUTES } from '@/lib/routes';
import {
  Section,
  Grid,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Heading,
  Text,
  Button,
  Banner,
  EmptyState,
  Skeleton,
} from '@/app/components/ui';
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';

export default function CameraDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [events, setEvents] = useState([]);
  const [persons, setPersons] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [snapshotUrls, setSnapshotUrls] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(CAMERA_ROUTES.list);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setCameras(data.cameras || []);
      setEvents(data.events || []);
      setPersons(data.persons || []);

      // Fetch snapshots for all cameras
      const urls = {};
      for (const camera of data.cameras || []) {
        try {
          const snapRes = await fetch(CAMERA_ROUTES.snapshot(camera.id));
          const snapData = await snapRes.json();
          if (snapData.snapshot_url) {
            urls[camera.id] = snapData.snapshot_url;
          }
        } catch (e) {
          console.error(`Error fetching snapshot for ${camera.id}:`, e);
        }
      }
      setSnapshotUrls(urls);

      if (data.cameras?.length > 0 && !selectedCameraId) {
        setSelectedCameraId(data.cameras[0].id);
      }
    } catch (err) {
      console.error('Error fetching camera data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    fetchedRef.current = false;
    await fetchData();
    setRefreshing(false);
  }

  const selectedCamera = cameras.find(c => c.id === selectedCameraId);
  const cameraEvents = selectedCameraId
    ? events.filter(e => e.camera_id === selectedCameraId)
    : events;

  if (loading) {
    return (
      <Section title="Videocamere" description="Caricamento..." spacing="section">
        <Grid cols={{ mobile: 1, desktop: 2 }} gap="large">
          <Skeleton.Card className="min-h-[400px]" />
          <Skeleton.Card className="min-h-[400px]" />
        </Grid>
      </Section>
    );
  }

  if (error) {
    return (
      <Section title="Videocamere" spacing="section">
        <Banner
          variant="error"
          title="Errore"
          description={error}
        />
        <Button variant="ember" onClick={handleRefresh} className="mt-4">
          Riprova
        </Button>
      </Section>
    );
  }

  if (cameras.length === 0) {
    return (
      <Section title="Videocamere" spacing="section">
        <EmptyState
          icon="📹"
          title="Nessuna videocamera trovata"
          description="Non sono state trovate videocamere Netatmo nel tuo account."
        />
      </Section>
    );
  }

  return (
    <Section
      title="Videocamere"
      description="Visualizza le tue videocamere Netatmo"
      spacing="section"
      action={
        <Button
          variant="subtle"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Aggiornamento...' : 'Aggiorna'}
        </Button>
      }
    >
      <Grid cols={{ mobile: 1, desktop: 2 }} gap="large">
        {/* Camera list */}
        <Card>
          <CardHeader>
            <CardTitle icon="📹">Le tue telecamere</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cameras.map(camera => (
              <div
                key={camera.id}
                className={`p-4 rounded-xl cursor-pointer transition-colors ${
                  selectedCameraId === camera.id
                    ? 'bg-ocean-500/20 border-2 border-ocean-500'
                    : 'bg-slate-800/50 hover:bg-slate-700/50 border-2 border-transparent'
                }`}
                onClick={() => setSelectedCameraId(camera.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Snapshot thumbnail */}
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                    {snapshotUrls[camera.id] ? (
                      <img
                        src={snapshotUrls[camera.id]}
                        alt={camera.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Text variant="tertiary" size="xs">N/D</Text>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <Heading level={4} size="md">{camera.name}</Heading>
                    <Text variant="tertiary" size="sm">
                      {NETATMO_CAMERA_API.getCameraTypeName(camera.type)}
                    </Text>
                    <div className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${
                      camera.status === 'on'
                        ? 'bg-sage-500/20 text-sage-400'
                        : 'bg-slate-600/50 text-slate-400'
                    }`}>
                      {camera.status === 'on' ? 'Attiva' : 'Inattiva'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Selected camera details */}
        {selectedCamera && (
          <Card>
            <CardHeader>
              <CardTitle icon="🎥">{selectedCamera.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Large snapshot */}
              <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden mb-4">
                {snapshotUrls[selectedCamera.id] ? (
                  <img
                    src={snapshotUrls[selectedCamera.id]}
                    alt={selectedCamera.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Text variant="secondary">Snapshot non disponibile</Text>
                  </div>
                )}
              </div>

              {/* Camera info */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <Text variant="label">Tipo</Text>
                  <Text variant="body">
                    {NETATMO_CAMERA_API.getCameraTypeName(selectedCamera.type)}
                  </Text>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <Text variant="label">Stato</Text>
                  <Text variant={selectedCamera.status === 'on' ? 'sage' : 'secondary'}>
                    {selectedCamera.status === 'on' ? 'Attiva' : 'Inattiva'}
                  </Text>
                </div>
                {selectedCamera.sd_status && (
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <Text variant="label">SD Card</Text>
                    <Text variant="body">
                      {selectedCamera.sd_status === 'on' ? 'Presente' : 'Assente'}
                    </Text>
                  </div>
                )}
                {selectedCamera.light_mode_status && (
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <Text variant="label">Luce</Text>
                    <Text variant="body">
                      {selectedCamera.light_mode_status === 'on' ? 'Accesa' :
                       selectedCamera.light_mode_status === 'auto' ? 'Auto' : 'Spenta'}
                    </Text>
                  </div>
                )}
              </div>

              {/* Recent events for this camera */}
              <Heading level={4} size="sm" className="mb-2">Eventi recenti</Heading>
              {cameraEvents.length > 0 ? (
                <div className="space-y-2">
                  {cameraEvents.slice(0, 5).map(event => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg"
                    >
                      <span className="text-2xl">
                        {event.type === 'person' ? '👤' :
                         event.type === 'human' ? '🚶' :
                         event.type === 'animal' ? '🐾' :
                         event.type === 'vehicle' ? '🚗' : '📷'}
                      </span>
                      <div className="flex-1">
                        <Text variant="body">
                          {NETATMO_CAMERA_API.getEventTypeName(event.type)}
                        </Text>
                        <Text variant="tertiary" size="sm">
                          {new Date(event.time * 1000).toLocaleString('it-IT')}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Text variant="secondary">Nessun evento recente</Text>
              )}
            </CardContent>
          </Card>
        )}
      </Grid>

      {/* Persons section */}
      {persons.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle icon="👥">Persone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {persons.map(person => (
                <div
                  key={person.id}
                  className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-ocean-500/20 flex items-center justify-center">
                    <span className="text-lg">👤</span>
                  </div>
                  <div>
                    <Text variant="body">{person.name}</Text>
                    <Text variant="tertiary" size="xs">
                      {person.out_of_sight ? 'Non presente' : 'Presente'}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </Section>
  );
}
```

---

### Phase 6: Homepage Integration (5 min)

#### Step 6.1: Add CameraCard to Homepage

**File**: `app/page.js`

```javascript
// ADD import
import CameraCard from './components/devices/camera/CameraCard';

// ADD in the device mapping section (after lights, before sonos)
if (device.id === 'camera') {
  return (
    <div key={device.id} className="animate-spring-in" style={{ animationDelay }}>
      <CameraCard />
    </div>
  );
}
```

---

### Phase 7: Version Update (5 min)

#### Step 7.1: Update Version Files

**File**: `lib/version.js`
```javascript
export const APP_VERSION = '1.65.0';
```

**File**: `package.json`
```json
{
  "version": "1.65.0"
}
```

#### Step 7.2: Update CHANGELOG

**File**: `CHANGELOG.md`

```markdown
## [1.65.0] - 2026-01-20

### Added
- Netatmo Camera integration (Welcome, Presence)
- CameraCard component for homepage
- Camera dashboard page (`/camera`)
- Live snapshot view with refresh
- Recent events display
- Person detection status
- Camera API wrapper (`lib/netatmoCameraApi.js`)
- Camera API routes (`/api/netatmo/camera/*`)

### Changed
- Extended OAuth scopes to include camera access
- Added CAMERA device type to device registry
- Updated routes configuration

### Notes
- Users need to re-authorize Netatmo after update (new OAuth scopes)
- MVP: snapshot and events only, no live streaming in v1
```

---

### Phase 8: Testing (10 min)

#### Step 8.1: Create Unit Tests

**File**: `__tests__/lib/netatmoCameraApi.test.js`

```javascript
import NETATMO_CAMERA_API from '@/lib/netatmoCameraApi';

describe('netatmoCameraApi', () => {
  describe('parseCameras', () => {
    it('should return empty array for empty input', () => {
      expect(NETATMO_CAMERA_API.parseCameras([])).toEqual([]);
      expect(NETATMO_CAMERA_API.parseCameras(null)).toEqual([]);
    });

    it('should parse cameras correctly', () => {
      const input = [{
        cameras: [{
          id: 'cam1',
          name: 'Test Camera',
          type: 'NACamera',
          status: 'on',
          vpn_url: 'https://vpn.test.com',
          is_local: true,
        }],
      }];

      const result = NETATMO_CAMERA_API.parseCameras(input);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cam1');
      expect(result[0].name).toBe('Test Camera');
      expect(result[0].type).toBe('NACamera');
      expect(result[0].status).toBe('on');
      expect(result[0].vpn_url).toBe('https://vpn.test.com');
    });
  });

  describe('getSnapshotUrl', () => {
    it('should return VPN URL by default', () => {
      const camera = {
        vpn_url: 'https://vpn.test.com',
        local_url: 'http://192.168.1.1',
        is_local: true,
      };

      const url = NETATMO_CAMERA_API.getSnapshotUrl(camera, false);
      expect(url).toBe('https://vpn.test.com/live/snapshot_720.jpg');
    });

    it('should return local URL when preferred and available', () => {
      const camera = {
        vpn_url: 'https://vpn.test.com',
        local_url: 'http://192.168.1.1',
        is_local: true,
      };

      const url = NETATMO_CAMERA_API.getSnapshotUrl(camera, true);
      expect(url).toBe('http://192.168.1.1/live/snapshot_720.jpg');
    });
  });

  describe('getCameraTypeName', () => {
    it('should return correct type names', () => {
      expect(NETATMO_CAMERA_API.getCameraTypeName('NACamera')).toBe('Welcome (Indoor)');
      expect(NETATMO_CAMERA_API.getCameraTypeName('NOC')).toBe('Presence (Outdoor)');
      expect(NETATMO_CAMERA_API.getCameraTypeName('NDB')).toBe('Doorbell');
    });
  });

  describe('getEventTypeName', () => {
    it('should return correct event type names', () => {
      expect(NETATMO_CAMERA_API.getEventTypeName('person')).toBe('Persona riconosciuta');
      expect(NETATMO_CAMERA_API.getEventTypeName('human')).toBe('Persona');
      expect(NETATMO_CAMERA_API.getEventTypeName('animal')).toBe('Animale');
      expect(NETATMO_CAMERA_API.getEventTypeName('vehicle')).toBe('Veicolo');
    });
  });
});
```

---

## Rollback Plan

### If Issues Arise

1. **Revert device registry change**: Remove CAMERA from `DEVICE_TYPES`
2. **Disable camera card**: Set `enabled: false` in device config
3. **Keep API routes**: They're isolated and won't affect other features

### Full Rollback Commands

```bash
# Revert all camera-related changes
git revert HEAD  # If committed

# Or manually:
# 1. Remove CAMERA from lib/devices/deviceTypes.js
# 2. Remove camera routes from lib/routes.js
# 3. Remove CameraCard import/usage from app/page.js
# 4. (API routes and lib files can stay - unused code doesn't affect runtime)
```

---

## Quality Checklist

- [ ] Device registry follows existing pattern
- [ ] API routes use `force-dynamic` export
- [ ] Auth0 session checked in all API routes
- [ ] Firebase operations use Admin SDK
- [ ] Error handling consistent with existing patterns
- [ ] UI follows Ember Noir design system
- [ ] No undefined values in Firebase writes
- [ ] Version bumped in all required files
- [ ] CHANGELOG updated
- [ ] Unit tests written

---

## Implementation Order

1. Phase 1: Device Registry (5 min)
2. Phase 2: OAuth Scope Update (5 min) - **User impact: re-authorization needed**
3. Phase 3: Camera API Wrapper (15 min)
4. Phase 4: API Routes (20 min)
5. Phase 5: UI Components (30 min)
6. Phase 6: Homepage Integration (5 min)
7. Phase 7: Version Update (5 min)
8. Phase 8: Testing (10 min)

**Total Estimated Time**: ~95 minutes

---

**Implementation Plan Status**: COMPLETE
**Ready for**: Implementation Phase
