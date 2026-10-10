'use client';

/**
 * Phase 181 — AltroPage (CONTEXT D-12).
 *
 * Body of the /altro route. Renders 4 GlassCard groups in a vertical stack:
 *   1. Dispositivi (data-driven from /api/devices/config + getNavigationStructureWithPreferences)
 *   2. Sistema (3 static rows)
 *   3. Impostazioni (7 static rows — only routes that EXIST on disk per UI-SPEC OQ-2)
 *   4. Account (1 row: Esci, flame-red, full-page logout)
 *
 * Inline fetch of /api/devices/config (RESEARCH OQ-1: extract a hook only if
 * Phase 182 needs it). Mirrors legacy Navbar.tsx:140-167 idiom.
 *
 * The row icon comes from the device id (ui/DeviceIcon), never from the emoji in the registry.
 *
 * NOTE on CardHead API: Phase 177 CardHead requires { Icon, label, tone }
 * (not the `title` prop the original 181-03 plan/PATTERNS doc referenced).
 * This file consumes the actual API; group titles are still passed via
 * `label="Dispositivi"` etc. so the 4 group headings render verbatim.
 *
 * NOTE on device.route: getNavigationStructureWithPreferences returns
 * DeviceNav { id, name, icon, color, items[] }. There is no top-level
 * `route` field; the primary route is `items[0].route` (the "Controllo"
 * main route). AltroPage uses that as the row href.
 *
 * GlassCard's default `aspectRatio: '1 / 1'` (square dashboard tile) is
 * overridden via `style={{ aspectRatio: 'auto' }}` here — group cards must
 * grow vertically to fit their row stack.
 */

import { useEffect, useState } from 'react';
import {
  Thermometer,
  ScrollText, Boxes, History,
  Settings, Bell, KeyRound, LayoutDashboard, MapPin, Users,
  LogOut,
  User,
  SlidersHorizontal,
} from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { getDeviceIcon } from '@/app/components/ui/DeviceIcon';
import { CardHead } from '../CardHead';
import { PageHeader } from '../PageHeader';
import { AltroRow } from './AltroRow';
import { getNavigationStructureWithPreferences } from '@/lib/devices/deviceRegistry';


const groupCardStyle = { aspectRatio: 'auto' as const };

export function AltroPage(): React.ReactElement {
  const [devicePreferences, setDevicePreferences] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/devices/config');
        if (!res.ok) return;
        const data: { enabledDevices?: string[] } = await res.json();
        const prefs: Record<string, boolean> = {};
        (data.enabledDevices ?? []).forEach((id) => { prefs[id] = true; });
        if (!cancelled) setDevicePreferences(prefs);
      } catch (error) {
        console.error('Errore nel recupero dispositivi:', error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const navStructure = getNavigationStructureWithPreferences(devicePreferences);
  const enabledDevices = navStructure.devices ?? [];

  return (
    <div>
      <PageHeader title="Altro" eyebrow="Menu principale" />

      {/* Grouped stack of GlassCards */}
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
      >
        {/* Group 1: Dispositivi (data-driven) */}
        <GlassCard style={groupCardStyle}>
          <CardHead Icon={Boxes} label="Dispositivi" tone="var(--accent)" />
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}
          >
            {enabledDevices.map((d) => {
              const primary = d.items[0];
              const href = primary?.route ?? '';
              if (!href) return null;
              return (
                <AltroRow
                  key={d.id}
                  icon={getDeviceIcon(d.id)}
                  label={d.name}
                  href={href}
                />
              );
            })}
          </div>
        </GlassCard>

        {/* Group 2: Sistema */}
        <GlassCard style={groupCardStyle}>
          <CardHead Icon={Settings} label="Sistema" tone="var(--accent)" />
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}
          >
            <AltroRow icon={ScrollText} label="Log" href="/log" />
            <AltroRow icon={Boxes} label="Registro" href="/registry/types" />
            <AltroRow icon={History} label="Changelog" href="/changelog" />
          </div>
        </GlassCard>

        {/* Group 3: Impostazioni (only routes that exist on disk per UI-SPEC OQ-2) */}
        <GlassCard style={groupCardStyle}>
          <CardHead
            Icon={SlidersHorizontal}
            label="Impostazioni"
            tone="var(--accent)"
          />
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}
          >
            <AltroRow icon={Settings} label="Generali" href="/settings" />
            <AltroRow icon={Bell} label="Notifiche" href="/settings/notifications" />
            <AltroRow icon={Users} label="Account e utenti" href="/settings/users" />
            <AltroRow icon={KeyRound} label="API Keys" href="/settings/api-keys" />
            <AltroRow
              icon={LayoutDashboard}
              label="Card della home"
              href="/settings?tab=dispositivi"
            />
            <AltroRow icon={MapPin} label="Posizione" href="/settings/location" />
            <AltroRow
              icon={Thermometer}
              label="Clima"
              href="/settings/thermostat"
            />
          </div>
        </GlassCard>

        {/* Group 4: Account */}
        <GlassCard style={groupCardStyle}>
          <CardHead Icon={User} label="Account" tone="var(--accent)" />
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}
          >
            <AltroRow
              icon={LogOut}
              label="Esci"
              href="/auth/logout"
              labelColor="#ff8a4a"
              external={true}
            />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
