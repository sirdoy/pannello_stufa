'use client';

/**
 * Phase 181 — AltroPage (CONTEXT D-12).
 *
 * Body of the /altro route. Renders 4 GlassCard groups in a vertical stack:
 *   1. Dispositivi (data-driven from /api/devices/config + getNavigationStructureWithPreferences)
 *   2. Sistema (3 static rows)
 *   3. Impostazioni (7 static rows — only routes that EXIST on disk per UI-SPEC OQ-2)
 *   4. Account (1 row: Esci, flame-red, external Auth0 redirect)
 *
 * Inline fetch of /api/devices/config (RESEARCH OQ-1: extract a hook only if
 * Phase 182 needs it). Mirrors legacy Navbar.tsx:140-167 idiom.
 *
 * device.icon is a STRING key from the registry, not a lucide component;
 * mapped via local ICON_MAP (mirrors rooms/lib/rooms-config.ts:ICON_FOR).
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
  Flame, Thermometer, Lightbulb, Music, Package, Plug, Wifi, Cpu, Phone,
  ScrollText, Boxes, History,
  Settings, Bell, KeyRound, LayoutDashboard, MapPin,
  LogOut, MoreHorizontal,
  User,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { CardHead } from '../CardHead';
import { AltroRow } from './AltroRow';
import { getNavigationStructureWithPreferences } from '@/lib/devices/deviceRegistry';

const ICON_MAP: Record<string, LucideIcon> = {
  flame: Flame,
  thermometer: Thermometer,
  lightbulb: Lightbulb,
  music: Music,
  package: Package,
  plug: Plug,
  wifi: Wifi,
  cpu: Cpu,
  phone: Phone,
};

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
    <div style={{ paddingTop: 70 }}>
      {/* Title block (mirrors RoomsTab.tsx:118-139) */}
      <div style={{ padding: '0 20px 20px' }}>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-2)',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Menu principale
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 600,
            color: '#fff',
            letterSpacing: -0.8,
          }}
        >
          Altro
        </div>
      </div>

      {/* Grouped stack of GlassCards */}
      <div
        style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 24 }}
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
                  icon={ICON_MAP[d.icon] ?? MoreHorizontal}
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
            <AltroRow icon={Boxes} label="Registro" href="/registry" />
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
            <AltroRow icon={KeyRound} label="API Keys" href="/settings/api-keys" />
            <AltroRow
              icon={LayoutDashboard}
              label="Dashboard"
              href="/settings/dashboard"
            />
            <AltroRow icon={Cpu} label="Dispositivi" href="/settings/devices" />
            <AltroRow icon={MapPin} label="Posizione" href="/settings/location" />
            <AltroRow
              icon={Thermometer}
              label="Termostato"
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
